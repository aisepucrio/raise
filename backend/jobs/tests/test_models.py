from django.test import TestCase

from jobs.tests.factories import TaskFactory


class TaskModelTests(TestCase):
    def test_task_str(self):
        task = TaskFactory(operation="collect_commits", repository="owner/repo")
        self.assertIn("collect_commits", str(task))
        self.assertIn("owner/repo", str(task))

    def test_task_default_status(self):
        task = TaskFactory()
        self.assertEqual(task.status, "PENDING")
