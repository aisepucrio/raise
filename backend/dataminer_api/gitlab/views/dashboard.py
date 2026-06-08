from django.db.models import Count, Max, Min
from django.db.models.functions import TruncDay, TruncMonth, TruncYear
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import GitLabCommit, GitLabIssue, GitLabMergeRequest, GitLabMetadata
from ..serializers import GraphDashboardSerializer
from ..utils import DateTimeHandler


@extend_schema(
    tags=["GitLab"],
    summary="Dashboard statistics",
    parameters=[
        OpenApiParameter(name="repository_id", required=False, type=int),
        OpenApiParameter(name="start_date", required=False, type=OpenApiTypes.DATETIME),
        OpenApiParameter(name="end_date", required=False, type=OpenApiTypes.DATETIME),
    ],
)
class DashboardView(APIView):
    def get(self, request):
        repository_id = request.query_params.get('repository_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if repository_id:
            try:
                repository_id = int(repository_id)
            except ValueError:
                return Response({"error": "repository_id must be an integer"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if start_date:
                start_date = DateTimeHandler.parse_date(start_date)
            if end_date:
                end_date = DateTimeHandler.parse_date(end_date)
            if start_date and end_date:
                DateTimeHandler.validate_date_range(start_date, end_date)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        issue_filters = {}
        pr_filters = {}
        commit_filters = {}

        if start_date:
            issue_filters['created_at__gte'] = start_date
            pr_filters['created_at__gte'] = start_date
            commit_filters['date__gte'] = start_date
        if end_date:
            issue_filters['created_at__lte'] = end_date
            pr_filters['created_at__lte'] = end_date
            commit_filters['date__lte'] = end_date

        issues_query = GitLabIssue.objects.filter(**issue_filters)
        prs_query = GitLabMergeRequest.objects.filter(**pr_filters)
        commits_query = GitLabCommit.objects.filter(**commit_filters)

        if repository_id:
            try:
                metadata = GitLabMetadata.objects.get(id=repository_id)
            except GitLabMetadata.DoesNotExist:
                return Response({"error": f"Repository with ID {repository_id} not found"}, status=status.HTTP_404_NOT_FOUND)

            issues_query = issues_query.filter(repository=metadata)
            prs_query = prs_query.filter(repository=metadata)
            commits_query = commits_query.filter(repository=metadata)

            response_data = {
                "repository_id": repository_id,
                "repository_name": metadata.repository,
                "issues_count": issues_query.count(),
                "pull_requests_count": prs_query.count(),
                "commits_count": commits_query.count(),
                "forks_count": metadata.forks_count,
                "stars_count": metadata.stars_count,
                "watchers_count": metadata.watchers_count,
                "time_mined": DateTimeHandler.format_date(metadata.time_mined),
                "users_count": commits_query.values('author').distinct().count(),
            }
        else:
            repositories = GitLabMetadata.objects.values('id', 'repository')
            response_data = {
                "issues_count": issues_query.count(),
                "pull_requests_count": prs_query.count(),
                "commits_count": commits_query.count(),
                "repositories_count": repositories.count(),
                "repositories": list(repositories),
                "users_count": commits_query.values('author').distinct().count(),
            }

        return Response(response_data)


@extend_schema(
    tags=["GitLab"],
    summary="Graph Dashboard",
    parameters=[
        OpenApiParameter(name="repository_id", required=False, type=int),
        OpenApiParameter(name="start_date", required=False, type=OpenApiTypes.DATETIME),
        OpenApiParameter(name="end_date", required=False, type=OpenApiTypes.DATETIME),
        OpenApiParameter(name="interval", required=False, type=str, default="day"),
    ],
)
class GraphDashboardView(APIView):
    def get(self, request):
        serializer = GraphDashboardSerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        repository_id = serializer.validated_data.get('repository_id')
        start_date = serializer.validated_data.get('start_date')
        end_date = serializer.validated_data.get('end_date')
        interval = serializer.validated_data.get('interval', 'day')

        if interval == 'day':
            trunc_func = TruncDay
            date_format = '%Y-%m-%d'
        elif interval == 'month':
            trunc_func = TruncMonth
            date_format = '%Y-%m'
        else:
            trunc_func = TruncYear
            date_format = '%Y'

        issues_query = GitLabIssue.objects.all()
        prs_query = GitLabMergeRequest.objects.all()
        commits_query = GitLabCommit.objects.all()

        repository_name = None
        if repository_id:
            try:
                metadata = GitLabMetadata.objects.get(id=repository_id)
                repository_name = metadata.repository
                issues_query = issues_query.filter(repository=metadata)
                prs_query = prs_query.filter(repository=metadata)
                commits_query = commits_query.filter(repository=metadata)
            except GitLabMetadata.DoesNotExist:
                pass

        if end_date:
            issues_query = issues_query.filter(created_at__lte=end_date)
            prs_query = prs_query.filter(created_at__lte=end_date)
            commits_query = commits_query.filter(date__lte=end_date)

        issues_by_date = issues_query.annotate(interval=trunc_func('created_at')).values('interval').annotate(count=Count('id')).order_by('interval')
        prs_by_date = prs_query.annotate(interval=trunc_func('created_at')).values('interval').annotate(count=Count('id')).order_by('interval')
        commits_by_date = commits_query.annotate(interval=trunc_func('date')).values('interval').annotate(count=Count('id')).order_by('interval')

        issues_dict = {}
        prs_dict = {}
        commits_dict = {}

        cumulative_issues = 0
        cumulative_prs = 0
        cumulative_commits = 0

        for item in issues_by_date:
            cumulative_issues += item['count']
            issues_dict[item['interval'].strftime(date_format)] = cumulative_issues
        for item in prs_by_date:
            cumulative_prs += item['count']
            prs_dict[item['interval'].strftime(date_format)] = cumulative_prs
        for item in commits_by_date:
            cumulative_commits += item['count']
            commits_dict[item['interval'].strftime(date_format)] = cumulative_commits

        date_range = sorted(set(list(issues_dict.keys()) + list(prs_dict.keys()) + list(commits_dict.keys())))
        if start_date:
            date_range = [date_str for date_str in date_range if date_str >= start_date.strftime(date_format)]

        issues_data = []
        prs_data = []
        commits_data = []
        last_issues = 0
        last_prs = 0
        last_commits = 0

        for date_str in date_range:
            last_issues = issues_dict.get(date_str, last_issues)
            last_prs = prs_dict.get(date_str, last_prs)
            last_commits = commits_dict.get(date_str, last_commits)
            issues_data.append(last_issues)
            prs_data.append(last_prs)
            commits_data.append(last_commits)

        response_data = {
            "time_series": {
                "labels": date_range,
                "issues": issues_data,
                "pull_requests": prs_data,
                "commits": commits_data,
            }
        }
        if repository_id:
            response_data["repository_id"] = repository_id
            response_data["repository_name"] = repository_name

        return Response(response_data)


@extend_schema(tags=["GitLab"], summary="Repository date range")
class RepositoryDateRangeView(APIView):
    def get(self, request):
        repository_id = request.query_params.get('repository_id')
        if repository_id is None:
            return Response({"error": "repository_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            repository_id = int(repository_id)
        except (ValueError, TypeError):
            return Response({"error": "repository_id must be an integer"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            metadata = GitLabMetadata.objects.get(id=repository_id)
        except GitLabMetadata.DoesNotExist:
            return Response({"error": f"Repository with ID {repository_id} not found"}, status=status.HTTP_404_NOT_FOUND)

        commit_dates = GitLabCommit.objects.filter(repository=metadata).aggregate(min_date=Min('date'), max_date=Max('date'))
        return Response(
            {
                "repository_id": repository_id,
                "min_date": DateTimeHandler.format_date(commit_dates.get('min_date')) if commit_dates.get('min_date') else None,
                "max_date": DateTimeHandler.format_date(commit_dates.get('max_date')) if commit_dates.get('max_date') else None,
            }
        )
