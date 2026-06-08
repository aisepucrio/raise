from django.db import models


class GitLabAuthor(models.Model):
    platform = models.CharField(max_length=20, default='gitlab', db_index=True)
    external_id = models.CharField(max_length=255, null=True, blank=True)
    username = models.CharField(max_length=255, null=True, blank=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(null=True, blank=True, db_index=True)
    avatar_url = models.URLField(max_length=1000, null=True, blank=True)
    profile_url = models.URLField(max_length=1000, null=True, blank=True)
    raw_payload = models.JSONField(null=True, blank=True)

    class Meta:
        unique_together = [('name', 'email')]

    def __str__(self):
        return f"{self.name} <{self.email}>"


class GitLabMetadata(models.Model):
    platform = models.CharField(max_length=20, default='gitlab', db_index=True)
    external_id = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    repository = models.CharField(max_length=255, db_index=True)
    owner = models.CharField(max_length=255)
    organization = models.CharField(max_length=255, null=True, blank=True)
    watchers_count = models.IntegerField(default=0)
    forks_count = models.IntegerField(default=0)
    open_issues_count = models.IntegerField(default=0)
    default_branch = models.CharField(max_length=255, default='main')
    description = models.TextField(null=True, blank=True)
    html_url = models.URLField(max_length=1000)
    contributors_count = models.IntegerField(null=True, blank=True)
    topics = models.JSONField(null=True, blank=True)
    languages = models.JSONField(null=True, blank=True)
    readme = models.TextField(null=True, blank=True)
    labels_count = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()
    last_sync = models.DateTimeField(auto_now=True)
    is_archived = models.BooleanField(default=False)
    is_template = models.BooleanField(default=False)
    releases_count = models.IntegerField(default=0)
    time_mined = models.DateTimeField(null=True, blank=True, help_text="Date and time of mining")
    raw_payload = models.JSONField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['repository']),
            models.Index(fields=['created_at']),
            models.Index(fields=['updated_at']),
        ]
        unique_together = [('repository', 'owner')]

    def __str__(self):
        return f"Metadata for {self.repository}"

    @property
    def project_id(self):
        if isinstance(self.external_id, str) and self.external_id.isdigit():
            return int(self.external_id)
        return self.external_id

    @property
    def gitlab_created_at(self):
        return self.created_at

    @property
    def gitlab_updated_at(self):
        return self.updated_at

    @property
    def stars_count(self):
        if hasattr(self, 'gitlab_extra'):
            return self.gitlab_extra.stars_count
        return 0

    @property
    def used_by_count(self):
        return 0


class GitLabProjectExtra(models.Model):
    repository = models.OneToOneField(GitLabMetadata, related_name='gitlab_extra', on_delete=models.CASCADE)
    stars_count = models.IntegerField(default=0)
    namespace_id = models.BigIntegerField(null=True, blank=True)
    path_with_namespace = models.CharField(max_length=255, null=True, blank=True)
    visibility = models.CharField(max_length=50, null=True, blank=True)
    archived = models.BooleanField(default=False)
    issues_enabled = models.BooleanField(null=True, blank=True)
    merge_requests_enabled = models.BooleanField(null=True, blank=True)
    jobs_enabled = models.BooleanField(null=True, blank=True)
    wiki_enabled = models.BooleanField(null=True, blank=True)
    snippets_enabled = models.BooleanField(null=True, blank=True)

    def __str__(self):
        return f"GitLab extra for {self.repository.repository}"


class GitLabCommit(models.Model):
    repository = models.ForeignKey(GitLabMetadata, related_name='commits', on_delete=models.CASCADE)
    sha = models.CharField(max_length=64, unique=True)
    short_sha = models.CharField(max_length=64, null=True, blank=True)
    title = models.CharField(max_length=255, null=True, blank=True)
    message = models.TextField()
    date = models.DateTimeField()
    authored_date = models.DateTimeField(null=True, blank=True)
    committed_date = models.DateTimeField(null=True, blank=True)
    author = models.ForeignKey(GitLabAuthor, related_name='author_commits', on_delete=models.SET_NULL, null=True, blank=True)
    committer = models.ForeignKey(GitLabAuthor, related_name='committer_commits', on_delete=models.SET_NULL, null=True, blank=True)
    insertions = models.IntegerField(default=0)
    deletions = models.IntegerField(default=0)
    files_changed = models.IntegerField(default=0)
    in_main_branch = models.BooleanField(default=False)
    merge = models.BooleanField(default=False)
    dmm_unit_size = models.FloatField(null=True, blank=True)
    dmm_unit_complexity = models.FloatField(null=True, blank=True)
    dmm_unit_interfacing = models.FloatField(null=True, blank=True)
    time_mined = models.DateTimeField(null=True, blank=True, help_text="Date and time of mining")
    raw_payload = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"Commit {self.sha}"

    @property
    def repository_name(self):
        return self.repository.repository if self.repository_id else None


class GitLabModifiedFile(models.Model):
    commit = models.ForeignKey(GitLabCommit, related_name='modified_files', on_delete=models.CASCADE)
    old_path = models.TextField(null=True, blank=True)
    new_path = models.TextField(null=True, blank=True)
    filename = models.TextField()
    change_type = models.CharField(max_length=20)
    diff = models.TextField(null=True, blank=True)
    added_lines = models.IntegerField(default=0)
    deleted_lines = models.IntegerField(default=0)
    complexity = models.IntegerField(null=True, blank=True)
    time_mined = models.DateTimeField(null=True, blank=True, help_text="Date and time of mining")
    raw_payload = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"File {self.filename} in Commit {self.commit.sha}"


class GitLabIssue(models.Model):
    platform = models.CharField(max_length=20, default='gitlab', db_index=True)
    repository = models.ForeignKey(GitLabMetadata, related_name='issues', on_delete=models.CASCADE)
    external_id = models.CharField(max_length=255)
    number = models.IntegerField(null=True, blank=True)
    iid = models.IntegerField(null=True, blank=True)
    title = models.TextField()
    state = models.CharField(max_length=50)
    creator = models.CharField(max_length=255)
    assignees = models.JSONField(default=list)
    labels = models.JSONField(default=list)
    milestone = models.CharField(max_length=255, null=True, blank=True)
    locked = models.BooleanField(default=False)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()
    closed_at = models.DateTimeField(null=True, blank=True)
    body = models.TextField(null=True, blank=True)
    comments = models.JSONField(default=list)
    timeline_events = models.JSONField(default=list)
    author_association = models.CharField(max_length=50, null=True, blank=True)
    reactions = models.JSONField(default=dict)
    time_mined = models.DateTimeField(null=True, blank=True, help_text="Date and time of mining")
    raw_payload = models.JSONField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['repository', 'external_id']),
            models.Index(fields=['created_at']),
            models.Index(fields=['updated_at']),
        ]
        unique_together = [('repository', 'external_id')]

    def __str__(self):
        return f"Issue {self.external_id} - {self.title}"

    @property
    def issue_id(self):
        if isinstance(self.external_id, str) and self.external_id.isdigit():
            return int(self.external_id)
        return self.external_id

    @property
    def repository_name(self):
        return self.repository.repository if self.repository_id else None

    @property
    def gitlab_created_at(self):
        return self.created_at

    @property
    def gitlab_updated_at(self):
        return self.updated_at


class GitLabIssueExtra(models.Model):
    issue = models.OneToOneField(GitLabIssue, related_name='gitlab_extra', on_delete=models.CASCADE)
    weight = models.IntegerField(null=True, blank=True)
    health_status = models.CharField(max_length=100, null=True, blank=True)
    confidential = models.BooleanField(default=False)
    discussion_locked = models.BooleanField(default=False)
    issue_type = models.CharField(max_length=100, null=True, blank=True)
    time_stats = models.JSONField(null=True, blank=True)
    task_completion_status = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"GitLab issue extra for {self.issue.external_id}"


class GitLabMergeRequest(models.Model):
    platform = models.CharField(max_length=20, default='gitlab', db_index=True)
    repository = models.ForeignKey(GitLabMetadata, related_name='merge_requests', on_delete=models.CASCADE)
    external_id = models.CharField(max_length=255)
    number = models.IntegerField(null=True, blank=True)
    iid = models.IntegerField(null=True, blank=True)
    title = models.CharField(max_length=255)
    state = models.CharField(max_length=50)
    creator = models.CharField(max_length=255)
    source_branch = models.CharField(max_length=255, null=True, blank=True)
    target_branch = models.CharField(max_length=255, null=True, blank=True)
    assignees = models.JSONField(default=list)
    labels = models.JSONField(default=list)
    milestone = models.CharField(max_length=255, null=True, blank=True)
    locked = models.BooleanField(default=False)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()
    closed_at = models.DateTimeField(null=True, blank=True)
    merged_at = models.DateTimeField(null=True, blank=True)
    body = models.TextField(null=True, blank=True)
    comments = models.JSONField(default=list)
    timeline_events = models.JSONField(default=list)
    commits = models.JSONField(default=list)
    author_association = models.CharField(max_length=50, null=True, blank=True)
    reactions = models.JSONField(default=dict)
    merge_commit_sha = models.CharField(max_length=64, null=True, blank=True)
    squash_commit_sha = models.CharField(max_length=64, null=True, blank=True)
    time_mined = models.DateTimeField(null=True, blank=True, help_text="Date and time of mining")
    raw_payload = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = 'gitlab_merge_requests'
        indexes = [
            models.Index(fields=['repository', 'external_id']),
            models.Index(fields=['created_at']),
            models.Index(fields=['updated_at']),
        ]
        unique_together = [('repository', 'external_id')]

    def __str__(self):
        return f"Merge Request {self.external_id} - {self.title}"

    @property
    def mr_id(self):
        if isinstance(self.external_id, str) and self.external_id.isdigit():
            return int(self.external_id)
        return self.external_id

    @property
    def record_id(self):
        return self.mr_id

    @property
    def repository_name(self):
        return self.repository.repository if self.repository_id else None

    @property
    def gitlab_created_at(self):
        return self.created_at

    @property
    def gitlab_updated_at(self):
        return self.updated_at


class GitLabMergeRequestExtra(models.Model):
    change_request = models.OneToOneField(GitLabMergeRequest, related_name='gitlab_extra', on_delete=models.CASCADE)
    source_project_id = models.BigIntegerField(null=True, blank=True)
    target_project_id = models.BigIntegerField(null=True, blank=True)
    merge_status = models.CharField(max_length=100, null=True, blank=True)
    detailed_merge_status = models.CharField(max_length=100, null=True, blank=True)
    squash = models.BooleanField(null=True, blank=True)
    should_remove_source_branch = models.BooleanField(null=True, blank=True)
    force_remove_source_branch = models.BooleanField(null=True, blank=True)
    merge_when_pipeline_succeeds = models.BooleanField(null=True, blank=True)
    draft = models.BooleanField(default=False)

    def __str__(self):
        return f"GitLab MR extra for {self.change_request.external_id}"


class GitLabBranch(models.Model):
    repository = models.ForeignKey(GitLabMetadata, related_name='branches', on_delete=models.CASCADE)
    name = models.CharField(max_length=500)
    sha = models.CharField(max_length=64)
    protected = models.BooleanField(default=False)
    default = models.BooleanField(default=False)
    merged = models.BooleanField(default=False)
    web_url = models.URLField(max_length=1000, null=True, blank=True)
    time_mined = models.DateTimeField(null=True, blank=True, help_text="Date and time of mining")
    raw_payload = models.JSONField(null=True, blank=True)

    class Meta:
        unique_together = [('repository', 'name')]

    def __str__(self):
        return f"Branch {self.name}"

    @property
    def repository_name(self):
        return self.repository.repository if self.repository_id else None
