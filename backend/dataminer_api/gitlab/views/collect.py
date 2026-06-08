import logging

from django.urls import reverse
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.test import APIClient

from ..serializers import GitLabCollectAllSerializer
from ..tasks import (
    fetch_branches,
    fetch_commits,
    fetch_issues,
    fetch_metadata,
    fetch_pull_requests,
)
from ..utils import DateTimeHandler

logger = logging.getLogger(__name__)


class GitLabCommitViewSet(viewsets.ViewSet):
    @extend_schema(summary="Mine GitLab commits", tags=["GitLab"], responses={202: OpenApiResponse(description="Task successfully initiated")})
    def create(self, request):
        repo_name = request.data.get('repo_name')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        commit_sha = request.data.get('commit_sha')

        if not repo_name:
            return Response({"error": "repo_name is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if start_date:
                start_date = DateTimeHandler.parse_date(start_date)
            if end_date:
                end_date = DateTimeHandler.parse_date(end_date)
            if start_date and end_date:
                DateTimeHandler.validate_date_range(start_date, end_date)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        task = fetch_commits.apply_async(args=[repo_name, start_date, end_date, commit_sha])
        return Response(
            {
                "task_id": task.id,
                "message": "Task successfully initiated",
                "status_endpoint": f"http://localhost:8000/api/jobs/tasks/{task.id}/",
            },
            status=status.HTTP_202_ACCEPTED,
        )


class GitLabCommitByShaViewSet(viewsets.ViewSet):
    @extend_schema(summary="Mine a specific GitLab commit by SHA", tags=["GitLab"], responses={202: OpenApiResponse(description="Task successfully initiated")})
    def create(self, request):
        repo_name = request.data.get('repo_name')
        commit_sha = request.data.get('commit_sha')
        if not repo_name or not commit_sha:
            return Response({"error": "repo_name and commit_sha are required"}, status=status.HTTP_400_BAD_REQUEST)

        task = fetch_commits.apply_async(args=[repo_name, None, None, commit_sha])
        return Response(
            {
                "task_id": task.id,
                "message": "Task successfully initiated",
                "status_endpoint": f"http://localhost:8000/api/jobs/tasks/{task.id}/",
            },
            status=status.HTTP_202_ACCEPTED,
        )


class GitLabIssueViewSet(viewsets.ViewSet):
    @extend_schema(summary="Mine GitLab issues", tags=["GitLab"], responses={202: OpenApiResponse(description="Task successfully initiated")})
    def create(self, request):
        repo_name = request.data.get('repo_name')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        depth = request.data.get('depth', 'basic')

        if not repo_name:
            return Response({"error": "repo_name is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if start_date:
                start_date = DateTimeHandler.parse_date(start_date)
            if end_date:
                end_date = DateTimeHandler.parse_date(end_date)
            if start_date and end_date:
                DateTimeHandler.validate_date_range(start_date, end_date)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        task = fetch_issues.apply_async(args=[repo_name, start_date, end_date, depth])
        return Response(
            {
                "task_id": task.id,
                "message": "Task successfully initiated",
                "status_endpoint": f"http://localhost:8000/api/jobs/tasks/{task.id}/",
            },
            status=status.HTTP_202_ACCEPTED,
        )


class GitLabPullRequestViewSet(viewsets.ViewSet):
    @extend_schema(summary="Mine GitLab merge requests", tags=["GitLab"], responses={202: OpenApiResponse(description="Task successfully initiated")})
    def create(self, request):
        repo_name = request.data.get('repo_name')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        depth = request.data.get('depth', 'basic')

        if not repo_name:
            return Response({"error": "repo_name is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if start_date:
                start_date = DateTimeHandler.parse_date(start_date)
            if end_date:
                end_date = DateTimeHandler.parse_date(end_date)
            if start_date and end_date:
                DateTimeHandler.validate_date_range(start_date, end_date)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        task = fetch_pull_requests.apply_async(args=[repo_name, start_date, end_date, depth])
        return Response(
            {
                "task_id": task.id,
                "message": "Task successfully initiated",
                "status_endpoint": f"http://localhost:8000/api/jobs/tasks/{task.id}/",
            },
            status=status.HTTP_202_ACCEPTED,
        )


class GitLabBranchViewSet(viewsets.ViewSet):
    @extend_schema(summary="Mine GitLab branches", tags=["GitLab"], responses={202: OpenApiResponse(description="Task successfully initiated")})
    def create(self, request):
        repo_name = request.data.get('repo_name')
        if not repo_name:
            return Response({"error": "repo_name is required"}, status=status.HTTP_400_BAD_REQUEST)

        task = fetch_branches.apply_async(args=[repo_name])
        return Response(
            {
                "task_id": task.id,
                "message": "Task successfully initiated",
                "status_endpoint": f"http://localhost:8000/api/jobs/tasks/{task.id}/",
            },
            status=status.HTTP_202_ACCEPTED,
        )


class GitLabMetadataViewSet(viewsets.ViewSet):
    @extend_schema(summary="Mine GitLab repository metadata", tags=["GitLab"], responses={202: OpenApiResponse(description="Task successfully initiated")})
    def create(self, request):
        repo_name = request.data.get('repo_name')
        if not repo_name:
            return Response({"error": "repo_name is required"}, status=status.HTTP_400_BAD_REQUEST)

        task = fetch_metadata.apply_async(args=[repo_name])
        return Response(
            {
                "task_id": task.id,
                "message": "Task successfully initiated",
                "status_endpoint": f"http://localhost:8000/api/jobs/tasks/{task.id}/",
            },
            status=status.HTTP_202_ACCEPTED,
        )


class GitLabCollectAllViewSet(viewsets.ViewSet):
    @extend_schema(summary="Mine selected GitLab data from multiple repositories", tags=["GitLab"], request=GitLabCollectAllSerializer)
    def create(self, request):
        try:
            serializer = GitLabCollectAllSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            repositories = serializer.validated_data['repositories']
            start_date = serializer.validated_data.get('start_date')
            end_date = serializer.validated_data.get('end_date')
            depth = serializer.validated_data.get('depth', 'basic')
            collect_types = serializer.validated_data.get('collect_types')

            results = []
            client = APIClient()

            for repo_name in repositories:
                repo_results = {'repository': repo_name, 'tasks': []}

                try:
                    if 'commits' in collect_types:
                        response = client.post(
                            reverse('gitlab:commit-collect-list'),
                            {'repo_name': repo_name, 'start_date': start_date, 'end_date': end_date},
                            format='json',
                        )
                        if response.status_code == 202:
                            repo_results['tasks'].append({'type': 'commits', 'task_id': response.json().get('task_id')})

                    if 'issues' in collect_types:
                        issue_depth = 'complex' if 'comments' in collect_types else depth
                        response = client.post(
                            reverse('gitlab:issue-collect-list'),
                            {'repo_name': repo_name, 'start_date': start_date, 'end_date': end_date, 'depth': issue_depth},
                            format='json',
                        )
                        if response.status_code == 202:
                            task_type = 'issues_with_comments' if 'comments' in collect_types else 'issues'
                            repo_results['tasks'].append({'type': task_type, 'task_id': response.json().get('task_id')})

                    if 'merge_requests' in collect_types:
                        mr_depth = 'complex' if 'comments' in collect_types else depth
                        response = client.post(
                            reverse('gitlab:mergerequest-collect-list'),
                            {'repo_name': repo_name, 'start_date': start_date, 'end_date': end_date, 'depth': mr_depth},
                            format='json',
                        )
                        if response.status_code == 202:
                            task_type = 'merge_requests_with_comments' if 'comments' in collect_types else 'merge_requests'
                            repo_results['tasks'].append({'type': task_type, 'task_id': response.json().get('task_id')})

                    if 'branches' in collect_types:
                        response = client.post(
                            reverse('gitlab:branch-collect-list'),
                            {'repo_name': repo_name},
                            format='json',
                        )
                        if response.status_code == 202:
                            repo_results['tasks'].append({'type': 'branches', 'task_id': response.json().get('task_id')})

                    if 'metadata' in collect_types:
                        response = client.post(
                            reverse('gitlab:metadata-collect-list'),
                            {'repo_name': repo_name},
                            format='json',
                        )
                        if response.status_code == 202:
                            repo_results['tasks'].append({'type': 'metadata', 'task_id': response.json().get('task_id')})

                    if 'comments' in collect_types and 'issues' not in collect_types:
                        response = client.post(
                            reverse('gitlab:issue-collect-list'),
                            {'repo_name': repo_name, 'start_date': start_date, 'end_date': end_date, 'depth': 'complex'},
                            format='json',
                        )
                        if response.status_code == 202:
                            repo_results['tasks'].append({'type': 'issues_with_comments', 'task_id': response.json().get('task_id')})

                    if 'comments' in collect_types and 'merge_requests' not in collect_types:
                        response = client.post(
                            reverse('gitlab:mergerequest-collect-list'),
                            {'repo_name': repo_name, 'start_date': start_date, 'end_date': end_date, 'depth': 'complex'},
                            format='json',
                        )
                        if response.status_code == 202:
                            repo_results['tasks'].append({'type': 'merge_requests_with_comments', 'task_id': response.json().get('task_id')})

                except Exception as exc:
                    logger.error(f"Error processing repository {repo_name}: {str(exc)}")
                    repo_results['error'] = str(exc)

                results.append(repo_results)

            return Response({'message': 'Mining tasks successfully initiated', 'results': results}, status=status.HTTP_202_ACCEPTED)
        except Exception as exc:
            logger.error(f"Error in collect-all view: {str(exc)}")
            return Response(
                {
                    'error': str(exc),
                    'detail': 'Internal error processing request',
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
