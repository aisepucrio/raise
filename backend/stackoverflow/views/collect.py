from rest_framework import viewsets, status
from rest_framework.response import Response
import logging
from celery import chain

from ..serializers import StackOverflowCollectSerializer
from ..tasks import collect_questions_task  # repopulate_users_task is deprecated
from drf_spectacular.utils import extend_schema, OpenApiExample  # For API documentation

logger = logging.getLogger(__name__)


class StackOverflowViewSet(viewsets.ViewSet):
    """
    ViewSet responsible for starting and managing Stack Overflow data
    collection jobs.
    """

    @extend_schema(
        summary="Start a Stack Overflow Mining Job",
        tags=["StackOverflow"],
        request=StackOverflowCollectSerializer,
        responses={202: {"description": "Mining job successfully queued."}},
        examples=[
            OpenApiExample(
                "Collect questions by tags",
                value={
                    "targets": ["python", "django"],
                    "collect_types": ["questions"],
                    "start_date": "2025-01-01",
                    "end_date": "2025-01-31",
                    "filters": {},
                    "options": {"mode": "default"},
                },
                request_only=True,
            ),
            OpenApiExample(
                "Collect with advanced filters",
                value={
                    "targets": ["python"],
                    "collect_types": ["questions"],
                    "start_date": "2025-01-01",
                    "end_date": "2025-01-31",
                    "filters": {"accepted": True, "views": 100, "intitle": "django"},
                    "options": {"mode": "advanced"},
                },
                request_only=True,
            ),
        ],
    )
    def create(self, request):
        """
        Start a new mining job based on the standardized collect payload.
        """
        try:
            serializer = StackOverflowCollectSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            celery_task_chain = self._build_task_chain(serializer.validated_data)
            task_chain_result = celery_task_chain.apply_async()

            return Response(
                {"task_id": task_chain_result.id, "status": "Mining job successfully queued."},
                status=status.HTTP_202_ACCEPTED,
            )

        except Exception as e:
            logger.error(f"Error while starting mining job: {e}", exc_info=True)
            return Response(
                {"error": f"An unexpected error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # Private Methods
    def _build_task_chain(self, data: dict):
        """
        Builds a Celery task chain based on the requested operations.
        Currently supports only 'questions'.
        """
        start_date = data.get("start_date")
        end_date = data.get("end_date")
        target_tags = data.get("targets") or []
        filters = data.get("filters") or {}
        mode = (data.get("options") or {}).get("mode", "default")

        task = collect_questions_task.s(
            start_date=start_date,
            end_date=end_date,
            tags=";".join(target_tags) if target_tags else None,
            filters=filters,
            mode=mode,
        )
        return chain([task])
