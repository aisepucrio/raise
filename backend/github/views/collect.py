import logging

from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiResponse
from rest_framework import status, viewsets
from rest_framework.response import Response

from ..tasks import (
    fetch_commits,
    fetch_issues,
    fetch_pull_requests,
    fetch_branches,
    fetch_metadata
)
from ..serializers import GitHubCollectSerializer

logger = logging.getLogger(__name__)


GITHUB_DEFAULT_DEPTH = "basic"


def _dispatch_github_collect(target, collect_types, start_date=None, end_date=None, depth=GITHUB_DEFAULT_DEPTH, sha=None):
    tasks = []

    if "commits" in collect_types:
        task = fetch_commits.apply_async(args=[target, start_date, end_date, sha])
        tasks.append({"type": "commits", "task_id": task.id})

    if "issues" in collect_types:
        task = fetch_issues.apply_async(args=[target, start_date, end_date, depth])
        tasks.append({"type": "issues", "task_id": task.id})

    if "pull_requests" in collect_types:
        task = fetch_pull_requests.apply_async(args=[target, start_date, end_date, depth])
        tasks.append({"type": "pull_requests", "task_id": task.id})

    if "branches" in collect_types:
        task = fetch_branches.apply_async(args=[target])
        tasks.append({"type": "branches", "task_id": task.id})

    if "metadata" in collect_types:
        task = fetch_metadata.apply_async(args=[target])
        tasks.append({"type": "metadata", "task_id": task.id})

    return tasks


class GitHubCollectViewSet(viewsets.ViewSet):
    @extend_schema(
        summary="Mine selected data from multiple repositories",
        tags=["GitHub"],
        request=GitHubCollectSerializer,
        responses={
            202: OpenApiResponse(description="Tasks successfully initiated"),
            400: OpenApiResponse(description="Bad request - missing or invalid parameters")
        },
        examples=[
            OpenApiExample(
                "Collect repository metadata and activity",
                value={
                    "targets": ["pandas-dev/pandas"],
                    "collect_types": ["metadata", "issues", "pull_requests", "commits"],
                    "start_date": "2025-01-01T00:00:00Z",
                    "end_date": "2025-01-31T23:59:59Z",
                    "filters": {},
                    "options": {"depth": "basic"},
                },
                request_only=True,
            ),
            OpenApiExample(
                "Collect all GitHub types",
                value={
                    "targets": ["owner/repo"],
                    "collect_types": ["all"],
                    "start_date": None,
                    "end_date": None,
                    "filters": {},
                    "options": {"depth": "complex"},
                },
                request_only=True,
            ),
            OpenApiExample(
                "Collect one commit by SHA",
                value={
                    "targets": ["owner/repo"],
                    "collect_types": ["commits"],
                    "start_date": None,
                    "end_date": None,
                    "filters": {"sha": "abc123"},
                    "options": {},
                },
                request_only=True,
            ),
        ],
    )
    def create(self, request):
        try:
            serializer = GitHubCollectSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            targets = serializer.validated_data['targets']
            start_date = serializer.validated_data.get('start_date')
            end_date = serializer.validated_data.get('end_date')
            collect_types = serializer.validated_data['collect_types']
            filters = serializer.validated_data.get('filters') or {}
            options = serializer.validated_data.get('options') or {}
            depth = options.get('depth', GITHUB_DEFAULT_DEPTH)
            sha = filters.get('sha')

            results = []

            for target in targets:
                repo_results = {
                    'repository': target,
                    'tasks': []
                }

                try:
                    repo_results['tasks'] = _dispatch_github_collect(
                        target,
                        collect_types,
                        start_date=start_date,
                        end_date=end_date,
                        depth=depth,
                        sha=sha,
                    )
                except Exception as e:
                    logger.error(f"Error processing repository {target}: {str(e)}")
                    repo_results['error'] = str(e)

                results.append(repo_results)

            return Response({
                'message': 'Mining tasks successfully initiated',
                'results': results
            }, status=status.HTTP_202_ACCEPTED)

        except Exception as e:
            logger.error(f"Error in GitHub collect view: {str(e)}")
            return Response({
                'error': str(e),
                'detail': 'Internal error processing request'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 
