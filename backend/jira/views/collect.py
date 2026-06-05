import logging

from django.conf import settings
from drf_spectacular.utils import extend_schema, OpenApiExample
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from jira.serializers import JiraCollectSerializer
from jira.tasks import collect_jira_issues_task


logger = logging.getLogger(__name__)


@extend_schema(
    tags=['Jira'],
    summary="Collect Jira Issues",
    request=JiraCollectSerializer,
    responses={
        202: {
            'type': 'object',
            'properties': {
                'tasks': {
                    'type': 'array',
                    'items': {
                        'type': 'object',
                        'properties': {
                            'task_id': {'type': 'string'},
                            'repository': {'type': 'string'}
                        }
                    }
                },
                'message': {'type': 'string'}
            }
        },
        400: {'description': 'Missing or invalid required fields'},
        500: {'description': 'Internal server error'}
    },
    examples=[
        OpenApiExample(
            "Collect issues from one project",
            value={
                "targets": ["company.atlassian.net/PROJ"],
                "collect_types": ["issues"],
                "start_date": "2025-01-01",
                "end_date": "2025-01-31",
                "filters": {"types": ["Bug", "Task"]},
                "options": {},
            },
            request_only=True,
        ),
        OpenApiExample(
            "Collect issues from multiple projects",
            value={
                "targets": ["company.atlassian.net/PROJ", "company.atlassian.net/OPS"],
                "collect_types": ["issues"],
                "start_date": None,
                "end_date": None,
                "filters": {"types": []},
                "options": {},
            },
            request_only=True,
        ),
    ],
)
class JiraIssueCollectView(APIView):
    """
    API endpoint that initiates Celery tasks to collect issues from Jira projects.
    """

    def post(self, request, *args, **kwargs):
        try:
            serializer = JiraCollectSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            data = serializer.validated_data
            targets = data["targets"]
            issue_types = (data.get("filters") or {}).get("types", [])
            start_date = data.get("start_date") or None
            end_date = data.get("end_date") or None

            jira_email = settings.JIRA_EMAIL
            jira_api_token = settings.JIRA_API_TOKEN

            logger.info(f"JIRA Email: {jira_email}")
            logger.info(f"JIRA API Token: {jira_api_token[:5]}*****" if jira_api_token else "JIRA API Token: missing")

            # Validate credentials
            if not jira_email or not jira_api_token:
                return Response(
                    {"error": "Missing JIRA credentials in settings."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            tasks = []
            for target in targets:
                jira_domain, project_key = target.split("/", 1)

                task = collect_jira_issues_task.delay(
                    jira_domain,
                    project_key,
                    issue_types,
                    start_date,
                    end_date
                )

                tasks.append({
                    "task_id": task.id,
                    "repository": f"{jira_domain}/{project_key}"
                })

            # Return 202 response
            return Response(
                {
                    "tasks": tasks,
                    "message": "Task(s) successfully initiated"
                },
                status=status.HTTP_202_ACCEPTED
            )

        except Exception as e:
            logger.error(f"Error in JiraIssueCollectView: {e}", exc_info=True)
            return Response(
                {"error": "Internal Server Error", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
