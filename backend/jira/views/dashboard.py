import logging

from django.conf import settings
from django.db.models.functions import TruncDay, TruncMonth, TruncWeek, TruncYear
from django.db.models import Min, Max
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from jira.models import JiraIssue, JiraProject, JiraSprint, JiraComment, JiraCommit, JiraUser

logger = logging.getLogger(__name__)


def format_project_name(project):
    return f"{project.key} - {project.name}"


@extend_schema(
    tags=['Jira'],
    summary="Jira Dashboard statistics",
    description="Provides statistics about Jira issues. "
                "If project_name is provided, returns detailed stats for that project.",
    parameters=[
        OpenApiParameter(
            name="project_id",
            description="ID of the project to get statistics for. If not provided, returns aggregated stats for all projects.",
            required=False,
            type=int
        ),
        OpenApiParameter(
            name="project_name",
            description="Name of the project to get statistics for. If not provided, returns aggregated stats for all projects.",
            required=False,
            type=str
        ),
        OpenApiParameter(
            name="start_date",
            description="Filter data from this date onwards (ISO format). Defaults to 1970-01-01.",
            required=False,
            type=OpenApiTypes.DATETIME
        ),
        OpenApiParameter(
            name="end_date",
            description="Filter data up to this date (ISO format). Defaults to current time.",
            required=False,
            type=OpenApiTypes.DATETIME
        ),
    ],
    responses={
        200: {
            "type": "object",
            "properties": {
                "selectedEntity": {"type": "object", "nullable": True},
                "entities": {"type": "array", "items": {"type": "object"}},
                "cards": {"type": "object"},
                "time_mined": {"type": "string", "format": "date-time", "nullable": True},
            }
        },
        400: {
            "type": "object",
            "properties": {
                "error": {"type": "string"}
            },
            "description": "Invalid request parameters (invalid date format)"
        },
        404: {
            "type": "object",
            "properties": {
                "error": {"type": "string"}
            },
            "description": "Project not found"
        },
        500: {
            "type": "object",
            "properties": {
                "error": {"type": "string"}
            },
            "description": "Internal server error"
        }
    },
    examples=[
        OpenApiExample(
            "Project dashboard",
            value={
                "selectedEntity": {"id": "1", "name": "PROJ - Sample Project"},
                "entities": [],
                "cards": {"issues": 120, "comments": 250, "commits": 80, "sprints": 5, "users": 10},
                "time_mined": "2023-01-01T12:00:00Z",
            },
            summary="Example with project_id"
        ),
        OpenApiExample(
            "All projects dashboard",
            value={
                "selectedEntity": None,
                "entities": [
                    {"id": "1", "name": "PROJ1 - Project One"},
                    {"id": "2", "name": "PROJ2 - Project Two"}
                ],
                "cards": {"projects": 2, "issues": 500, "comments": 750, "commits": 300, "sprints": 15, "users": 30},
                "time_mined": "2023-01-01T12:00:00Z",
            },
            summary="Example without project_name"
        ),
        OpenApiExample(
            "Error Example - Invalid Date",
            value={
                "error": "Invalid start_date format. Please use ISO format (YYYY-MM-DDTHH:MM:SSZ)."
            },
            summary="Example of invalid date format error",
            response_only=True,
            status_codes=["400"]
        )
    ]
)
class JiraDashboardView(APIView):
    def get(self, request):
        try:
            project_id = request.query_params.get('project_id')
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')

            filters = {}

            if start_date:
                filters['created__gte'] = start_date
            if end_date:
                filters['created__lte'] = end_date

            issues_query = JiraIssue.objects.filter(**filters)

            if project_id:
                try:
                    project = JiraProject.objects.get(id=project_id)
                    project_issues = issues_query.filter(project=project)

                    if project_issues.exists():
                        latest_time_mined = project_issues.order_by('-time_mined').first().time_mined
                    else:
                        latest_time_mined = None

                    sprints_count = JiraSprint.objects.filter(issues__in=project_issues).distinct().count()
                    comments_count = JiraComment.objects.filter(issue__in=project_issues).distinct().count()
                    commits_count = JiraCommit.objects.filter(issue__in=project_issues).distinct().count()
                    users_count = JiraUser.objects.filter().distinct().count()

                    response_data = {
                        "selectedEntity": {"id": str(project.id), "name": format_project_name(project)},
                        "entities": [],
                        "cards": {
                            "issues": project_issues.count(),
                            "comments": comments_count,
                            "commits": commits_count,
                            "sprints": sprints_count,
                            "users": users_count,
                        },
                        "time_mined": latest_time_mined.isoformat() if latest_time_mined else None,
                    }
                except JiraProject.DoesNotExist:
                    return Response(
                        {"error": f"Project with ID {project_id} not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
                except Exception as e: # Catching generic exception for project specific data retrieval
                    return Response(
                        {"error": f"Error retrieving data for project ID {project_id}: {str(e)}"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            else:
                projects = JiraProject.objects.all()
                projects_list = [{"id": str(p.id), "name": format_project_name(p)} for p in projects]

                sprints_count = JiraSprint.objects.filter(issues__in=issues_query).distinct().count()
                comments_count = JiraComment.objects.filter(issue__in=issues_query).distinct().count()
                commits_count = JiraCommit.objects.filter(issue__in=issues_query).distinct().count()
                users_count = JiraUser.objects.filter().distinct().count()
                latest_time_mined = issues_query.aggregate(value=Max("time_mined"))["value"]

                response_data = {
                    "selectedEntity": None,
                    "entities": projects_list,
                    "cards": {
                        "projects": len(projects_list),
                        "issues": issues_query.count(),
                        "comments": comments_count,
                        "commits": commits_count,
                        "sprints": sprints_count,
                        "users": users_count,
                    },
                    "time_mined": latest_time_mined.isoformat() if latest_time_mined else None,
                }

            return Response(response_data)
        except Exception as e:
            print(e)
            return Response({"error": "An internal server error occurred. Please try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Jira'],
    summary="Graph Dashboard Data",
    description="Provides cumulative time-series data for issues, comments, commits, and sprints",
    parameters=[
        OpenApiParameter(
            name='project_id',
            description='ID of the project to get statistics for',
            required=False,
            type=int
        ),
        OpenApiParameter(
            name='start_date',
            description='Filter display range from this date onwards (ISO format)',
            required=False,
            type=OpenApiTypes.DATETIME
        ),
        OpenApiParameter(
            name='end_date',
            description='Filter display range up to this date (ISO format)',
            required=False,
            type=OpenApiTypes.DATETIME
        ),
        OpenApiParameter(
            name='interval',
            description='Time interval for grouping (day, week, month, year)',
            required=False,
            type=str,
            enum=["day", "week", "month", "year"],
            default='day'
        )
    ],
    responses={
        200: {
            "type": "object",
            "properties": {
                "selectedEntity": {"type": "object", "nullable": True},
                "interval": {"type": "string"},
                "time_series": {
                    "type": "object",
                    "properties": {
                        "labels": {"type": "array", "items": {"type": "string"}},
                        "datasets": {"type": "object"},
                    }
                }
            }
        }
    },
    examples=[
        OpenApiExample(
            "Project Example",
            value={
                "selectedEntity": {"id": "123", "name": "PROJ - Sample Project"},
                "interval": "day",
                "time_series": {
                    "labels": ["2023-01-01", "2023-01-02", "2023-01-03"],
                    "datasets": {
                        "issues": [5, 12, 15],
                        "comments": [2, 6, 7],
                        "commits": [1, 1, 3],
                        "sprints": [0, 1, 1],
                    },
                }
            },
            summary="Example with project_id showing cumulative counts"
        ),
        OpenApiExample(
            "All Projects Example",
            value={
                "selectedEntity": None,
                "interval": "day",
                "time_series": {
                    "labels": ["2023-01-01", "2023-01-02", "2023-01-03"],
                    "datasets": {
                        "issues": [10, 22, 30],
                        "comments": [5, 11, 14],
                        "commits": [2, 3, 6],
                        "sprints": [1, 1, 2],
                    },
                }
            },
            summary="Example without project_id showing cumulative counts"
        ),
        OpenApiExample(
            "Error Example - Invalid Date",
            value={
                "error": "Invalid start_date format. Please use ISO format (YYYY-MM-DDTHH:MM:SSZ)."
            },
            summary="Example of invalid date format error",
            response_only=True,
            status_codes=["400"]
        )
    ]
)
class JiraGraphDashboardView(APIView):
    def get(self, request):
        try:
            logger.info(f"JiraGraphDashboardView called with params: {request.query_params}")
            project_id = request.query_params.get('project_id')
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            interval = request.query_params.get('interval', 'day')

            if interval not in ("day", "week", "month", "year"):
                return Response({"error": "interval must be one of: day, week, month, year"}, status=status.HTTP_400_BAD_REQUEST)

            # Determine the truncation function and date format based on interval
            if interval == 'day':
                trunc_func = TruncDay
                date_format = '%Y-%m-%d'
            elif interval == 'week':
                trunc_func = TruncWeek
                date_format = '%Y-%m-%d'
            elif interval == 'month':
                trunc_func = TruncMonth
                date_format = '%Y-%m'
            else:
                trunc_func = TruncYear
                date_format = '%Y'

            # Base queryset filters for display range
            display_filters = {}
            if start_date:
                display_filters['created__gte'] = start_date
            if end_date:
                display_filters['created__lte'] = end_date
            if project_id:
                display_filters['project_id'] = project_id

            # Project filter for cumulative counts
            project_filter = {'project_id': project_id} if project_id else {}

            # Get cumulative data for each date in the display range
            issues_data = []
            comments_data = []
            commits_data = []
            sprints_data = []
            
            base_issues = JiraIssue.objects.filter(**project_filter).distinct()
            base_comments = JiraComment.objects.filter(issue__in=base_issues).distinct()
            base_commits = JiraCommit.objects.filter(issue__in=base_issues).distinct()
            base_sprints = JiraSprint.objects.filter(issues__in=base_issues).distinct()

            # Get the date range for display
            display_issues = base_issues.filter(**display_filters)
            dates = display_issues.annotate(
                interval=trunc_func('created')
            ).values('interval').distinct().order_by('interval')

            for date in dates:
                current_date = date['interval']
                
                # Count all items up to this date
                issues_count = base_issues.filter(created__lte=current_date).count()
                comments_count = base_comments.filter(created__lte=current_date).count()
                commits_count = base_commits.filter(timestamp__lte=current_date).count()
                sprints_count = base_sprints.filter(startDate__lte=current_date).count()

                formatted_date = current_date.strftime(date_format)
                issues_data.append({'interval': formatted_date, 'count': issues_count})
                comments_data.append({'interval': formatted_date, 'count': comments_count})
                commits_data.append({'interval': formatted_date, 'count': commits_count})
                sprints_data.append({'interval': formatted_date, 'count': sprints_count})

            # Convert to response format
            date_range = [item['interval'] for item in issues_data]
            issues_list = [item['count'] for item in issues_data]
            comments_list = [item['count'] for item in comments_data]
            commits_list = [item['count'] for item in commits_data]
            sprints_list = [item['count'] for item in sprints_data]

            # Get project name if needed
            project_label = None
            if project_id:
                try:
                    project = JiraProject.objects.get(id=project_id)
                    project_label = format_project_name(project)
                except JiraProject.DoesNotExist:
                    logger.error(f"Project with ID {project_id} not found", exc_info=True)
                    project_label = None

            response_data = {
                "selectedEntity": {"id": str(project_id), "name": project_label} if project_id else None,
                "interval": interval,
                "time_series": {
                    "labels": date_range,
                    "datasets": {
                        "issues": issues_list,
                        "comments": comments_list,
                        "commits": commits_list,
                        "sprints": sprints_list,
                    },
                }
            }

            return Response(response_data)

        except Exception as e:
            logger.error(f"Error in JiraGraphDashboardView: {e}", exc_info=True)
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@extend_schema(
    tags=['Jira'],
    summary="Project date range",
    description="Returns the earliest (min_date) and latest (max_date) dates for issues in a given project_id.",
    parameters=[
        OpenApiParameter(
                name='project_id',
                description='Query parameter. ID of the project to get date range for.',
                required=True,
                type=int
            )
    ],
    responses={
        200: {
            "type": "object",
            "properties": {
                "selectedEntity": {"type": "object"},
                "date_range": {"type": "object"}
            }
        },
        400: {"type": "object", "properties": {"error": {"type": "string"}}},
        404: {"type": "object", "properties": {"error": {"type": "string"}}}
    }
)
class JiraProjectDateRangeView(APIView):
    def get(self, request):
        project_id = request.query_params.get('project_id')

        if project_id is None:
            return Response({"error": "project_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            project_id = int(project_id)
        except (ValueError, TypeError):
            return Response({"error": "project_id must be an integer"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            project = JiraProject.objects.get(id=project_id)
        except JiraProject.DoesNotExist:
            return Response({"error": f"Project with ID {project_id} not found"}, status=status.HTTP_404_NOT_FOUND)

        date_agg = JiraIssue.objects.filter(project=project).aggregate(min_date=Min('created'), max_date=Max('created'))

        min_date = date_agg.get('min_date')
        max_date = date_agg.get('max_date')

        response = {
            "selectedEntity": {"id": str(project_id), "name": format_project_name(project)},
            "date_range": {
                "min_date": min_date.isoformat() if min_date else None,
                "max_date": max_date.isoformat() if max_date else None,
            },
        }

        return Response(response)
