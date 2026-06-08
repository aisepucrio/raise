from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views
from .views.dashboard import DashboardView, GraphDashboardView, RepositoryDateRangeView
from .views.export import ExportDataView
from .views.lookup import (
    BranchDetailView,
    BranchListView,
    CommitDetailView,
    CommitListView,
    IssueDetailView,
    IssueListView,
    MetadataListView,
    PullRequestDetailView,
    PullRequestListView,
    UserListView,
)

app_name = 'gitlab'

router = DefaultRouter()
router.register(r'commits/collect', views.GitLabCommitViewSet, basename='commit-collect')
router.register(r'commits/collect-by-sha', views.GitLabCommitByShaViewSet, basename='commit-collect-by-sha')
router.register(r'issues/collect', views.GitLabIssueViewSet, basename='issue-collect')
router.register(r'pull-requests/collect', views.GitLabPullRequestViewSet, basename='pullrequest-collect')
router.register(r'merge-requests/collect', views.GitLabPullRequestViewSet, basename='mergerequest-collect')
router.register(r'branches/collect', views.GitLabBranchViewSet, basename='branch-collect')
router.register(r'metadata/collect', views.GitLabMetadataViewSet, basename='metadata-collect')
router.register(r'collect', views.GitLabCollectAllViewSet, basename='collect')
router.register(r'collect-all', views.GitLabCollectAllViewSet, basename='collect-all')

urlpatterns = [
    path('export/', ExportDataView.as_view(), name='export-data'),
    path('', include(router.urls)),
    path('commits/', CommitListView.as_view(), name='commit-list'),
    path('commits/<str:sha>/', CommitDetailView.as_view(), name='commit-detail'),
    path('issues/', IssueListView.as_view(), name='issue-list'),
    path('issues/<int:record_id>/', IssueDetailView.as_view(), name='issue-detail'),
    path('pull-requests/', PullRequestListView.as_view(), name='pullrequest-list'),
    path('pull-requests/<int:record_id>/', PullRequestDetailView.as_view(), name='pullrequest-detail'),
    path('merge-requests/', PullRequestListView.as_view(), name='mergerequest-list'),
    path('merge-requests/<int:record_id>/', PullRequestDetailView.as_view(), name='mergerequest-detail'),
    path('branches/', BranchListView.as_view(), name='branch-list'),
    path('branches/<str:name>/', BranchDetailView.as_view(), name='branch-detail'),
    path('metadata/', MetadataListView.as_view(), name='metadata-list'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('dashboard/graph/', GraphDashboardView.as_view(), name='graph-dashboard'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('date-range/', RepositoryDateRangeView.as_view(), name='gitlab-date-range'),
]
