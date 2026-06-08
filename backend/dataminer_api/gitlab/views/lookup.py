from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import generics
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import PageNumberPagination

from utils.lookup import get_filterset_fields as _get_filterset_fields, get_search_fields as _get_search_fields

from ..models import GitLabAuthor, GitLabBranch, GitLabCommit, GitLabIssue, GitLabMergeRequest, GitLabMetadata
from ..serializers import (
    GitLabAuthorSerializer,
    GitLabBranchSerializer,
    GitLabCommitSerializer,
    GitLabIssueSerializer,
    GitLabMergeRequestSerializer,
    GitLabMetadataSerializer,
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 1000


@extend_schema(tags=["GitLab"], summary="List all GitLab commits")
class CommitListView(generics.ListAPIView):
    queryset = GitLabCommit.objects.all()
    serializer_class = GitLabCommitSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = _get_filterset_fields(GitLabCommit)
    search_fields = _get_search_fields(GitLabCommit)
    ordering_fields = '__all__'
    pagination_class = StandardResultsSetPagination


@extend_schema(tags=["GitLab"], summary="Retrieve a specific GitLab commit")
class CommitDetailView(generics.RetrieveAPIView):
    queryset = GitLabCommit.objects.all()
    serializer_class = GitLabCommitSerializer
    lookup_field = 'sha'


@extend_schema(tags=["GitLab"], summary="List all GitLab issues")
class IssueListView(generics.ListAPIView):
    queryset = GitLabIssue.objects.all()
    serializer_class = GitLabIssueSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = _get_filterset_fields(GitLabIssue)
    search_fields = _get_search_fields(GitLabIssue)
    ordering_fields = '__all__'
    pagination_class = StandardResultsSetPagination


@extend_schema(tags=["GitLab"], summary="Retrieve a specific GitLab issue")
class IssueDetailView(generics.RetrieveAPIView):
    queryset = GitLabIssue.objects.all()
    serializer_class = GitLabIssueSerializer
    lookup_field = 'external_id'
    lookup_url_kwarg = 'record_id'


@extend_schema(tags=["GitLab"], summary="List all GitLab merge requests")
class PullRequestListView(generics.ListAPIView):
    queryset = GitLabMergeRequest.objects.all()
    serializer_class = GitLabMergeRequestSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = _get_filterset_fields(GitLabMergeRequest)
    search_fields = _get_search_fields(GitLabMergeRequest)
    ordering_fields = '__all__'
    pagination_class = StandardResultsSetPagination


@extend_schema(tags=["GitLab"], summary="Retrieve a specific GitLab merge request")
class PullRequestDetailView(generics.RetrieveAPIView):
    queryset = GitLabMergeRequest.objects.all()
    serializer_class = GitLabMergeRequestSerializer
    lookup_field = 'external_id'
    lookup_url_kwarg = 'record_id'


@extend_schema(tags=["GitLab"], summary="List all GitLab branches")
class BranchListView(generics.ListAPIView):
    queryset = GitLabBranch.objects.all()
    serializer_class = GitLabBranchSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = _get_filterset_fields(GitLabBranch)
    search_fields = _get_search_fields(GitLabBranch)
    ordering_fields = '__all__'
    pagination_class = StandardResultsSetPagination


@extend_schema(tags=["GitLab"], summary="Retrieve a specific GitLab branch")
class BranchDetailView(generics.RetrieveAPIView):
    queryset = GitLabBranch.objects.all()
    serializer_class = GitLabBranchSerializer
    lookup_field = 'name'


@extend_schema(tags=["GitLab"], summary="List all GitLab repository metadata")
class MetadataListView(generics.ListAPIView):
    queryset = GitLabMetadata.objects.select_related('gitlab_extra')
    serializer_class = GitLabMetadataSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = _get_filterset_fields(GitLabMetadata)
    search_fields = _get_search_fields(GitLabMetadata)
    ordering_fields = '__all__'
    pagination_class = StandardResultsSetPagination


class UserListView(generics.ListAPIView):
    queryset = GitLabAuthor.objects.all()
    serializer_class = GitLabAuthorSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = _get_filterset_fields(GitLabAuthor)
    search_fields = _get_search_fields(GitLabAuthor)
    ordering_fields = '__all__'
    pagination_class = StandardResultsSetPagination
