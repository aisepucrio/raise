import csv
import json
import logging
from datetime import datetime, time, timezone

from django.db.models import Q
from django.http import HttpResponse
from django.utils.encoding import smart_str
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from utils.lookup import get_filterset_fields as _get_filterset_fields, get_search_fields as _get_search_fields

from ..models import GitLabBranch, GitLabCommit, GitLabIssue, GitLabMergeRequest, GitLabMetadata
from ..serializers import ExportDataSerializer

logger = logging.getLogger(__name__)


def _default_export_fields(model):
    fields = [field.name for field in model._meta.fields]
    if model is GitLabMetadata:
        fields.insert(7, 'stars_count')
    return fields


def _day_bounds_utc(d):
    start = datetime.combine(d, time.min).replace(tzinfo=timezone.utc)
    end = datetime.combine(d, time.max).replace(tzinfo=timezone.utc)
    return start, end


def _date_field_for_model(model):
    if model is GitLabCommit:
        return "date"
    if model in (GitLabIssue, GitLabMergeRequest, GitLabMetadata):
        return "created_at"
    if model is GitLabBranch:
        return "time_mined"
    return None


class ExportDataView(APIView):
    @extend_schema(summary="Export GitLab data", tags=["GitLab"], request=ExportDataSerializer, responses={200: OpenApiResponse(description="Exported data file")})
    def post(self, request):
        serializer = ExportDataSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        table = serializer.validated_data['table']
        ids = serializer.validated_data.get('ids', [])
        format_type = serializer.validated_data['format']
        data_type = serializer.validated_data.get('data_type')
        selected_fields = serializer.validated_data.get('fields')
        body_date = serializer.validated_data.get('date')
        body_start = serializer.validated_data.get('start_date')
        body_end = serializer.validated_data.get('end_date')

        model_mapping = {
            'gitlabcommit': GitLabCommit,
            'gitlabissue': GitLabIssue,
            'gitlabbranch': GitLabBranch,
            'gitlabmetadata': GitLabMetadata,
            'gitlabmergerequest': GitLabMergeRequest,
        }

        if table == 'gitlabissuepullrequest':
            if data_type == 'issue':
                model = GitLabIssue
            elif data_type == 'pull_request':
                model = GitLabMergeRequest
            else:
                return Response({"error": "data_type is required for gitlabissuepullrequest exports"}, status=status.HTTP_400_BAD_REQUEST)
        elif table in model_mapping:
            model = model_mapping[table]
        else:
            return Response({"error": f"Table '{table}' not found"}, status=status.HTTP_404_NOT_FOUND)
        queryset = model.objects.all()

        if ids:
            queryset = queryset.filter(id__in=ids)

        repo = serializer.validated_data.get("repository")
        state = serializer.validated_data.get("state")
        creator = serializer.validated_data.get("creator")
        if repo:
            queryset = queryset.filter(repository__repository__icontains=repo)
        if state:
            queryset = queryset.filter(state__iexact=state)
        if creator:
            queryset = queryset.filter(creator__icontains=creator)

        filterset_fields = _get_filterset_fields(model)
        if filterset_fields:
            dummy_view = type("DummyView", (), {"filterset_fields": filterset_fields, "get_queryset": lambda self: model.objects.all()})
            backend = DjangoFilterBackend()
            queryset = backend.filter_queryset(request, queryset, dummy_view())

        search_query = request.query_params.get('search')
        if search_query:
            search_fields = _get_search_fields(model) or []
            if search_fields:
                query = Q()
                for field in search_fields:
                    if "__" in field:
                        query |= Q(**{field: search_query})
                    else:
                        query |= Q(**{f"{field}__icontains": search_query})
                queryset = queryset.filter(query)

        ordering = request.query_params.get('ordering')
        if ordering:
            try:
                queryset = queryset.order_by(*[segment.strip() for segment in ordering.split(",") if segment.strip()])
            except Exception as exc:
                logger.warning(f"Ignoring invalid ordering '{ordering}': {exc}")

        date_field = _date_field_for_model(model)
        if date_field:
            if body_date:
                start_dt, end_dt = _day_bounds_utc(body_date)
                queryset = queryset.filter(**{f"{date_field}__gte": start_dt, f"{date_field}__lte": end_dt})
            elif body_start or body_end:
                if body_start:
                    queryset = queryset.filter(**{f"{date_field}__gte": body_start})
                if body_end:
                    queryset = queryset.filter(**{f"{date_field}__lte": body_end})

        if not queryset.exists():
            return Response({"error": "No data found to export"}, status=status.HTTP_404_NOT_FOUND)

        filename_parts = [table]
        if table == 'gitlabissuepullrequest' and data_type:
            filename_parts.append(data_type)
        filename_base = f"{'_'.join(filename_parts)}_export"

        if format_type == 'json':
            data = []
            for obj in queryset:
                obj_dict = {}
                for field in obj._meta.fields:
                    value = getattr(obj, field.name)
                    obj_dict[field.name] = value.id if hasattr(value, 'id') else value
                if model is GitLabMetadata:
                    obj_dict['stars_count'] = obj.stars_count
                data.append(obj_dict)

            response = HttpResponse(json.dumps(data, default=str, indent=2), content_type='application/json')
            response['Content-Disposition'] = f'attachment; filename="{filename_base}.json"'
            response['Access-Control-Expose-Headers'] = 'Content-Disposition'
            return response

        if not selected_fields:
            selected_fields = _default_export_fields(model)

        def row_iter():
            yield [smart_str(col) for col in selected_fields]
            for obj in queryset.iterator(chunk_size=5000):
                row = []
                for col in selected_fields:
                    val = getattr(obj, col, "")
                    if hasattr(val, "id"):
                        val = val.id
                    if val is None:
                        val = ""
                    elif hasattr(val, "isoformat"):
                        val = val.isoformat()
                    elif isinstance(val, bool):
                        val = "true" if val else "false"
                    elif isinstance(val, (list, tuple, set)):
                        val = ", ".join(map(str, val))
                    row.append(smart_str(val))
                yield row

        class Echo:
            def write(self, value):
                return value

        pseudo_buffer = Echo()
        writer = csv.writer(pseudo_buffer)

        def stream():
            for row in row_iter():
                yield writer.writerow(row)

        response = HttpResponse(stream(), content_type="text/csv; charset=utf-8")
        response['Content-Disposition'] = f'attachment; filename="{filename_base}.csv"'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'
        return response
