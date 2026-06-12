from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views.lookup import (
    CommitListView, CommitDetailView,
    IssueListView, IssueDetailView,
    PullRequestListView, PullRequestDetailView,
    BranchListView, BranchDetailView,
    MetadataListView,
    UserListView,
)
from .views.dashboard import DashboardView, GraphDashboardView, RepositoryDateRangeView
from .views.export import ExportDataView

app_name = 'github'

router = DefaultRouter()
router.register(r'collect', views.GitHubCollectViewSet, basename='collect')

urlpatterns = [
    # PRIORITIZE the export route before the router
    path('export/', ExportDataView.as_view(), name='export-data'),

    path('', include(router.urls)),

    path('commits/', CommitListView.as_view(), name='commit-list'),
    path('commits/<str:sha>/', CommitDetailView.as_view(), name='commit-detail'),
    path('issues/', IssueListView.as_view(), name='issue-list'),
    path('issues/<int:issue_id>/', IssueDetailView.as_view(), name='issue-detail'),
    path('pull-requests/', PullRequestListView.as_view(), name='pullrequest-list'),
    path('pull-requests/<int:pr_id>/', PullRequestDetailView.as_view(), name='pullrequest-detail'),
    path('branches/', BranchListView.as_view(), name='branch-list'),
    path('branches/<str:name>/', BranchDetailView.as_view(), name='branch-detail'),
    path('metadata/', MetadataListView.as_view(), name='metadata-list'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('dashboard/graph/', GraphDashboardView.as_view(), name='graph-dashboard'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('date-range/', RepositoryDateRangeView.as_view(), name='github-date-range'),
]
