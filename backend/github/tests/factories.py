import factory
from django.utils import timezone

from github.models import (
    GitHubAuthor,
    GitHubBranch,
    GitHubCommit,
    GitHubIssue,
    GitHubMetadata,
    GitHubMethod,
    GitHubModifiedFile,
    GitHubPullRequest,
)


class GitHubMetadataFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GitHubMetadata

    repository = factory.Sequence(lambda n: f"owner-{n}/repo-{n}")
    owner = factory.Sequence(lambda n: f"owner-{n}")
    organization = factory.Sequence(lambda n: f"owner-{n}")
    stars_count = 4242
    watchers_count = 4242
    forks_count = 100
    open_issues_count = 5
    default_branch = "main"
    description = "Test repo"
    html_url = factory.LazyAttribute(lambda o: f"https://github.com/{o.repository}")
    contributors_count = 3
    topics = ["ai", "nlp"]
    languages = {"Python": 10000}
    readme = "README"
    labels_count = 10
    github_created_at = factory.LazyFunction(timezone.now)
    github_updated_at = factory.LazyFunction(timezone.now)
    is_archived = False
    is_template = False
    used_by_count = 50
    releases_count = 2
    time_mined = factory.LazyFunction(timezone.now)


class GitHubAuthorFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GitHubAuthor

    name = factory.Sequence(lambda n: f"Author {n}")
    email = factory.Sequence(lambda n: f"author{n}@test.com")


class GitHubCommitFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GitHubCommit

    repository = factory.SubFactory(GitHubMetadataFactory)
    repository_name = factory.LazyAttribute(lambda o: o.repository.repository)
    sha = factory.Sequence(lambda n: f"{'a' * 39}{n}")
    message = "Test commit message"
    date = factory.LazyFunction(timezone.now)
    author = factory.SubFactory(GitHubAuthorFactory)
    committer = factory.SubFactory(GitHubAuthorFactory)
    insertions = 10
    deletions = 2
    files_changed = 1
    in_main_branch = True
    merge = False
    dmm_unit_size = 1.0
    dmm_unit_complexity = 1.0
    dmm_unit_interfacing = 1.0
    time_mined = factory.LazyFunction(timezone.now)


class GitHubModifiedFileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GitHubModifiedFile

    commit = factory.SubFactory(GitHubCommitFactory)
    old_path = None
    new_path = "src/app.py"
    filename = "src/app.py"
    change_type = "M"
    diff = "---"
    added_lines = 10
    deleted_lines = 2
    complexity = 3
    time_mined = factory.LazyFunction(timezone.now)


class GitHubMethodFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GitHubMethod

    modified_file = factory.SubFactory(GitHubModifiedFileFactory)
    name = "def foo()"
    complexity = 2
    max_nesting = 1
    time_mined = factory.LazyFunction(timezone.now)


class GitHubIssueFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GitHubIssue

    repository = factory.SubFactory(GitHubMetadataFactory)
    repository_name = factory.LazyAttribute(lambda o: o.repository.repository)
    issue_id = factory.Sequence(lambda n: 1000000000 + n)
    number = factory.Sequence(lambda n: n + 1)
    title = "Bug: something fails"
    state = "open"
    creator = "alice"
    assignees = ["bob"]
    labels = ["bug"]
    milestone = None
    locked = False
    github_created_at = factory.LazyFunction(timezone.now)
    github_updated_at = factory.LazyFunction(timezone.now)
    closed_at = None
    body = "Steps to reproduce..."
    comments = []
    timeline_events = []
    is_pull_request = False
    author_association = "CONTRIBUTOR"
    reactions = {"+1": 1}
    time_mined = factory.LazyFunction(timezone.now)


class GitHubPullRequestFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GitHubPullRequest

    pr_id = factory.Sequence(lambda n: 900000000 + n)
    repository = factory.SubFactory(GitHubMetadataFactory)
    repository_name = factory.LazyAttribute(lambda o: o.repository.repository)
    number = factory.Sequence(lambda n: n + 10)
    title = "Add feature"
    state = "open"
    creator = "bob"
    github_created_at = factory.LazyFunction(timezone.now)
    github_updated_at = factory.LazyFunction(timezone.now)
    closed_at = None
    merged_at = None
    labels = ["enhancement"]
    commits = []
    comments = []
    body = "Implements feature X"
    time_mined = factory.LazyFunction(timezone.now)


class GitHubBranchFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = GitHubBranch

    repository = factory.SubFactory(GitHubMetadataFactory)
    repository_name = factory.LazyAttribute(lambda o: o.repository.repository)
    name = factory.Sequence(lambda n: f"branch-{n}")
    sha = factory.Sequence(lambda n: f"{'b' * 39}{n}")
    is_default = False
    time_mined = factory.LazyFunction(timezone.now)
