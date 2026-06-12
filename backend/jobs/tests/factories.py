import factory
from django.utils import timezone

from jobs.models import Task


class TaskFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Task

    task_id = factory.Sequence(lambda n: f"task-id-{n}")
    operation = "collect_commits"
    repository = factory.Sequence(lambda n: f"owner-{n}/repo-{n}")
    type = "GITHUB"
    status = "PENDING"
    created_at = factory.LazyFunction(timezone.now)
