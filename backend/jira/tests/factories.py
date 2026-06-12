import factory
from django.utils import timezone

from jira.models import (
    JiraActivityLog,
    JiraChecklist,
    JiraComment,
    JiraCommit,
    JiraHistory,
    JiraHistoryItem,
    JiraIssue,
    JiraIssueLink,
    JiraIssueType,
    JiraProject,
    JiraSprint,
    JiraUser,
)


class JiraUserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JiraUser

    accountId = factory.Sequence(lambda n: f"user-{n}")
    displayName = factory.Sequence(lambda n: f"Test User {n}")
    emailAddress = factory.Sequence(lambda n: f"user{n}@test.com")
    active = True
    timeZone = "UTC"
    accountType = "atlassian"


class JiraProjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JiraProject

    id = factory.Sequence(lambda n: f"proj-{n}")
    key = factory.Sequence(lambda n: f"PROJ{n}")
    name = factory.Sequence(lambda n: f"Project {n}")
    simplified = False
    projectTypeKey = "software"


class JiraIssueTypeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JiraIssueType

    name = "Story"
    description = "A user story"


class JiraSprintFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JiraSprint

    id = factory.Sequence(lambda n: n + 1)
    name = factory.Sequence(lambda n: f"Sprint {n}")
    state = "active"
    boardId = factory.Sequence(lambda n: n + 1)


class JiraIssueFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JiraIssue

    issue_id = factory.Sequence(lambda n: f"PROJ-{n}")
    issue_key = factory.Sequence(lambda n: f"PROJ-{n}")
    project = factory.SubFactory(JiraProjectFactory)
    created = factory.LazyFunction(timezone.now)
    updated = factory.LazyFunction(timezone.now)
    status = "To Do"
    summary = factory.Sequence(lambda n: f"Issue {n}")
    creator = factory.SubFactory(JiraUserFactory)
    reporter = factory.SubFactory(JiraUserFactory)


class JiraCommentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JiraComment

    issue = factory.SubFactory(JiraIssueFactory)
    author = factory.SubFactory(JiraUserFactory)
    body = "A test comment"
    created = factory.LazyFunction(timezone.now)
    updated = factory.LazyFunction(timezone.now)


class JiraCommitFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JiraCommit

    issue = factory.SubFactory(JiraIssueFactory)
    sha = factory.Sequence(lambda n: f"abc{n:037d}")
    message = "Test commit"
    author = "Test Author"
    author_email = factory.Sequence(lambda n: f"author{n}@test.com")
    timestamp = factory.LazyFunction(timezone.now)


class JiraActivityLogFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JiraActivityLog

    issue = factory.SubFactory(JiraIssueFactory)
    author = factory.SubFactory(JiraUserFactory)
    created = factory.LazyFunction(timezone.now)
    description = "Status changed"


class JiraHistoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JiraHistory

    issue = factory.SubFactory(JiraIssueFactory)
    author = factory.SubFactory(JiraUserFactory)
    created = factory.LazyFunction(timezone.now)


class JiraHistoryItemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JiraHistoryItem

    history = factory.SubFactory(JiraHistoryFactory)
    field = "status"
    fieldtype = "jira"
    toString = "In Progress"


class JiraChecklistFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JiraChecklist

    issue = factory.SubFactory(JiraIssueFactory)
    checklist = {"items": []}
    progress = "0%"
    completed = False


class JiraIssueLinkFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JiraIssueLink

    issue = factory.SubFactory(JiraIssueFactory)
    linked_issue = factory.SubFactory(JiraIssueFactory)
    link_type = "Blocks"
    link_direction = "outward"
