from rest_framework import serializers

from .models import GitLabAuthor, GitLabBranch, GitLabCommit, GitLabIssue, GitLabMergeRequest, GitLabMetadata, GitLabModifiedFile
from .utils import DateTimeHandler


class GitLabAuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = GitLabAuthor
        fields = ['id', 'platform', 'external_id', 'username', 'name', 'email', 'avatar_url', 'profile_url', 'raw_payload']


class GitLabModifiedFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = GitLabModifiedFile
        fields = [
            'id',
            'old_path',
            'new_path',
            'filename',
            'change_type',
            'diff',
            'added_lines',
            'deleted_lines',
            'time_mined',
            'raw_payload',
        ]


class GitLabCommitSerializer(serializers.ModelSerializer):
    author = GitLabAuthorSerializer(read_only=True)
    committer = GitLabAuthorSerializer(read_only=True)
    modified_files = GitLabModifiedFileSerializer(many=True, read_only=True)
    repository_name = serializers.CharField(source='repository.repository', read_only=True)

    class Meta:
        model = GitLabCommit
        fields = [
            'id',
            'repository',
            'repository_name',
            'sha',
            'short_sha',
            'title',
            'message',
            'date',
            'authored_date',
            'committed_date',
            'author',
            'committer',
            'insertions',
            'deletions',
            'files_changed',
            'in_main_branch',
            'merge',
            'dmm_unit_size',
            'dmm_unit_complexity',
            'dmm_unit_interfacing',
            'time_mined',
            'raw_payload',
            'modified_files',
        ]


class GitLabIssueSerializer(serializers.ModelSerializer):
    issue_id = serializers.CharField(source='external_id', read_only=True)
    repository_name = serializers.CharField(source='repository.repository', read_only=True)
    gitlab_created_at = serializers.DateTimeField(source='created_at', read_only=True)
    gitlab_updated_at = serializers.DateTimeField(source='updated_at', read_only=True)
    created_at_formatted = serializers.SerializerMethodField()
    updated_at_formatted = serializers.SerializerMethodField()

    class Meta:
        model = GitLabIssue
        fields = [
            'id',
            'platform',
            'repository',
            'repository_name',
            'issue_id',
            'number',
            'iid',
            'title',
            'state',
            'creator',
            'assignees',
            'labels',
            'milestone',
            'locked',
            'gitlab_created_at',
            'gitlab_updated_at',
            'closed_at',
            'body',
            'comments',
            'timeline_events',
            'author_association',
            'reactions',
            'time_mined',
            'raw_payload',
            'created_at_formatted',
            'updated_at_formatted',
        ]

    def get_created_at_formatted(self, obj):
        return DateTimeHandler.format_date(obj.created_at)

    def get_updated_at_formatted(self, obj):
        return DateTimeHandler.format_date(obj.updated_at)


class GitLabMergeRequestSerializer(serializers.ModelSerializer):
    mr_id = serializers.CharField(source='external_id', read_only=True)
    record_id = serializers.CharField(source='external_id', read_only=True)
    repository_name = serializers.CharField(source='repository.repository', read_only=True)
    gitlab_created_at = serializers.DateTimeField(source='created_at', read_only=True)
    gitlab_updated_at = serializers.DateTimeField(source='updated_at', read_only=True)
    labels_list = serializers.SerializerMethodField()
    created_at_formatted = serializers.SerializerMethodField()
    updated_at_formatted = serializers.SerializerMethodField()

    class Meta:
        model = GitLabMergeRequest
        fields = [
            'id',
            'platform',
            'repository',
            'repository_name',
            'mr_id',
            'record_id',
            'number',
            'iid',
            'title',
            'state',
            'creator',
            'source_branch',
            'target_branch',
            'assignees',
            'labels',
            'labels_list',
            'milestone',
            'locked',
            'gitlab_created_at',
            'gitlab_updated_at',
            'closed_at',
            'merged_at',
            'body',
            'comments',
            'timeline_events',
            'commits',
            'author_association',
            'reactions',
            'merge_commit_sha',
            'squash_commit_sha',
            'time_mined',
            'raw_payload',
            'created_at_formatted',
            'updated_at_formatted',
        ]

    def get_created_at_formatted(self, obj):
        return DateTimeHandler.format_date(obj.created_at)

    def get_updated_at_formatted(self, obj):
        return DateTimeHandler.format_date(obj.updated_at)

    def get_labels_list(self, obj):
        return obj.labels if isinstance(obj.labels, list) else []


class GitLabBranchSerializer(serializers.ModelSerializer):
    repository_name = serializers.CharField(source='repository.repository', read_only=True)

    class Meta:
        model = GitLabBranch
        fields = [
            'id',
            'repository',
            'repository_name',
            'name',
            'sha',
            'protected',
            'default',
            'merged',
            'web_url',
            'time_mined',
            'raw_payload',
        ]


class GitLabMetadataSerializer(serializers.ModelSerializer):
    project_id = serializers.SerializerMethodField()
    gitlab_created_at = serializers.DateTimeField(source='created_at', read_only=True)
    gitlab_updated_at = serializers.DateTimeField(source='updated_at', read_only=True)
    stars_count = serializers.SerializerMethodField()

    class Meta:
        model = GitLabMetadata
        fields = [
            'id',
            'platform',
            'external_id',
            'project_id',
            'name',
            'repository',
            'owner',
            'organization',
            'stars_count',
            'watchers_count',
            'forks_count',
            'open_issues_count',
            'default_branch',
            'description',
            'html_url',
            'contributors_count',
            'topics',
            'languages',
            'readme',
            'labels_count',
            'gitlab_created_at',
            'gitlab_updated_at',
            'is_archived',
            'is_template',
            'releases_count',
            'time_mined',
            'raw_payload',
        ]

    def get_project_id(self, obj):
        if obj.external_id is None:
            return None
        return int(obj.external_id) if str(obj.external_id).isdigit() else obj.external_id

    def get_stars_count(self, obj):
        return obj.stars_count


class GitLabIssuePullRequestSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    platform = serializers.CharField(read_only=True)
    repository = serializers.PrimaryKeyRelatedField(read_only=True)
    repository_name = serializers.CharField(source='repository.repository', read_only=True)
    record_id = serializers.CharField(source='external_id', read_only=True)
    number = serializers.IntegerField(read_only=True, allow_null=True)
    iid = serializers.IntegerField(read_only=True, allow_null=True)
    title = serializers.CharField(read_only=True)
    state = serializers.CharField(read_only=True)
    creator = serializers.CharField(read_only=True)
    assignees = serializers.SerializerMethodField()
    labels = serializers.ListField(read_only=True)
    milestone = serializers.CharField(read_only=True, allow_null=True)
    locked = serializers.BooleanField(read_only=True)
    gitlab_created_at = serializers.DateTimeField(source='created_at', read_only=True)
    gitlab_updated_at = serializers.DateTimeField(source='updated_at', read_only=True)
    closed_at = serializers.DateTimeField(read_only=True, allow_null=True)
    body = serializers.CharField(read_only=True, allow_null=True)
    comments = serializers.ListField(read_only=True)
    timeline_events = serializers.ListField(read_only=True)
    merged_at = serializers.SerializerMethodField()
    commits = serializers.SerializerMethodField()
    is_pull_request = serializers.SerializerMethodField()
    author_association = serializers.CharField(read_only=True, allow_null=True)
    reactions = serializers.JSONField(read_only=True)
    data_type = serializers.SerializerMethodField()
    time_mined = serializers.DateTimeField(read_only=True, allow_null=True)
    raw_payload = serializers.JSONField(read_only=True)
    created_at_formatted = serializers.SerializerMethodField()
    updated_at_formatted = serializers.SerializerMethodField()
    closed_at_formatted = serializers.SerializerMethodField()
    merged_at_formatted = serializers.SerializerMethodField()

    def get_assignees(self, obj):
        return getattr(obj, 'assignees', [])

    def get_commits(self, obj):
        return getattr(obj, 'commits', [])

    def get_merged_at(self, obj):
        return getattr(obj, 'merged_at', None)

    def get_is_pull_request(self, obj):
        return isinstance(obj, GitLabMergeRequest)

    def get_data_type(self, obj):
        return 'pull_request' if isinstance(obj, GitLabMergeRequest) else 'issue'

    def get_created_at_formatted(self, obj):
        return DateTimeHandler.format_date(obj.created_at)

    def get_updated_at_formatted(self, obj):
        return DateTimeHandler.format_date(obj.updated_at)

    def get_closed_at_formatted(self, obj):
        return DateTimeHandler.format_date(obj.closed_at)

    def get_merged_at_formatted(self, obj):
        return DateTimeHandler.format_date(getattr(obj, 'merged_at', None))


class GraphDashboardSerializer(serializers.Serializer):
    repository_id = serializers.IntegerField(required=False)
    start_date = serializers.DateTimeField(required=False)
    end_date = serializers.DateTimeField(required=False)
    interval = serializers.ChoiceField(
        choices=['day', 'week', 'month'],
        default='day',
        required=False,
    )

    def validate(self, data):
        if 'start_date' in data and 'end_date' in data:
            DateTimeHandler.validate_date_range(data['start_date'], data['end_date'])
        return data


class GitLabCollectAllSerializer(serializers.Serializer):
    repositories = serializers.ListField(
        child=serializers.CharField(help_text="Repository name in format group/project"),
        help_text="List of repositories to mine",
    )
    start_date = serializers.DateTimeField(required=False, allow_null=True, help_text="Start date for mining (optional)")
    end_date = serializers.DateTimeField(required=False, allow_null=True, help_text="End date for mining (optional)")
    depth = serializers.ChoiceField(choices=['basic', 'complex'], default='basic', help_text="Mining depth (basic or complex)")
    collect_types = serializers.ListField(
        child=serializers.ChoiceField(choices=['commits', 'issues', 'pull_requests', 'merge_requests', 'branches', 'metadata', 'comments']),
        help_text="List of data types to mine (commits, issues, merge_requests, branches, metadata, comments)",
    )

    def validate_collect_types(self, value):
        if not value:
            raise serializers.ValidationError("At least one data type must be selected for mining")

        normalized = []
        seen = set()
        for item in value:
            item = 'merge_requests' if item == 'pull_requests' else item
            if item not in seen:
                normalized.append(item)
                seen.add(item)
        return normalized

    def validate_repositories(self, value):
        if not value:
            raise serializers.ValidationError("At least one repository must be provided for mining")

        unique_repos = []
        seen = set()
        for repo in value:
            if repo not in seen:
                unique_repos.append(repo)
                seen.add(repo)
        return unique_repos

    def validate(self, data):
        if 'start_date' in data and 'end_date' in data:
            DateTimeHandler.validate_date_range(data['start_date'], data['end_date'])
        if 'comments' in data.get('collect_types', []):
            data['depth'] = 'complex'
        return data


class ExportDataSerializer(serializers.Serializer):
    table = serializers.ChoiceField(
        choices=[
            'gitlabcommit',
            'gitlabissue',
            'gitlabmergerequest',
            'gitlabbranch',
            'gitlabmetadata',
            'gitlabissuepullrequest',
        ],
        help_text="Table name to export",
    )
    ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="List of IDs to export (optional)",
    )
    format = serializers.ChoiceField(
        choices=['json', 'csv'],
        default='json',
        help_text="Output format",
    )
    data_type = serializers.ChoiceField(
        choices=['issue', 'pull_request'],
        required=False,
        help_text="Filter by data type - only applies to gitlabissuepullrequest table",
    )
    fields = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="Optional: limit CSV columns to this list of field names",
    )
    date = serializers.DateField(required=False, help_text="Single day filter (UTC date)")
    start_date = serializers.DateTimeField(required=False, help_text="Start datetime (inclusive, UTC)")
    end_date = serializers.DateTimeField(required=False, help_text="End datetime (inclusive, UTC)")
    repository = serializers.CharField(required=False, help_text="Filter by repository name")
    state = serializers.CharField(required=False, help_text="Filter by issue/MR state")
    creator = serializers.CharField(required=False, help_text="Filter by creator username")

    def validate(self, data):
        if data.get("date") and (data.get("start_date") or data.get("end_date")):
            raise serializers.ValidationError("Use apenas 'date' OU 'start_date'/'end_date'.")
        return data
