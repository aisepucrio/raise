from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock
import uuid
from django.utils import timezone

from jira.models import (
    JiraIssue, JiraProject, JiraUser, JiraComment, JiraSprint,
    JiraIssueType, JiraHistory, JiraHistoryItem, JiraCommit,
    JiraChecklist, JiraIssueLink, JiraActivityLog
)
from jira.miner import JiraMiner  # Imported to test the exception
from jobs.models import Task


class JiraTasksTests(APITestCase):
    @patch("jira.tasks.JiraMiner")
    @patch("jira.tasks._reuse_or_create_task", autospec=True)
    @patch("celery.app.task.Task.request")
    def test_collect_jira_issues_task_logic_success(
        self, mock_task_request, mock_reuse, mock_jira_miner_class
    ):
        """
        [Scenario]: Successful execution of the Jira issue collection task.
        [What it tests]: Validates the full internal flow of the Celery task using mocks.
        [How it tests]: Spies on update_state, simulates miner return, and validates the final state.
        [Expected result]: Task with SUCCESS status, correct state updates, and coherent result.
        """
        from jira.tasks import collect_jira_issues_task

        # Arrange
        mock_task_request.id = str(uuid.uuid4())
        task_obj = MagicMock(spec_set=[
            "status",
            "operation",
            "error",
            "error_type",
            "token_validation_error",
            "result",
            "save"
        ])
        task_obj.result = {}
        mock_reuse.return_value = (task_obj, True)

        miner = mock_jira_miner_class.return_value
        miner.collect_jira_issues.return_value = {
            "status": "Collected 5 issues successfully.",
            "total_issues": 5
        }

        # Act
        with patch.object(collect_jira_issues_task, "update_state") as spy_state:
            res = collect_jira_issues_task.run(
                "test.atlassian.net", "PROJ", ["Bug"], None, None
            )

        # Assert
        miner.collect_jira_issues.assert_called_once_with("PROJ", ["Bug"], None, None)

        states = [c.kwargs["state"] for c in spy_state.call_args_list]
        self.assertIn("STARTED", states)
        self.assertIn("SUCCESS", states)

        self.assertEqual(task_obj.status, "SUCCESS")
        self.assertIn("operation", task_obj.result)
        self.assertIn("repository", task_obj.result)
        self.assertEqual(task_obj.result["operation"], "collect_jira_issues")
        self.assertEqual(task_obj.result["repository"], "test.atlassian.net/PROJ")

        self.assertEqual(res["status"], "Collected 5 issues successfully.")
        self.assertEqual(res["total_issues"], 5)

    @patch("jira.tasks.JiraMiner")
    @patch("jira.tasks._reuse_or_create_task", autospec=True)
    def test_collect_jira_issues_task_invalid_token(self, mock_reuse, mock_jira_miner_class):
        """
        [Scenario]: Invalid Jira token handling.
        [What it tests]: Ensures that the task correctly handles invalid token exceptions.
        [Expected result]: Task is marked as FAILURE and returns an appropriate error code.
        """
        from jira.tasks import collect_jira_issues_task

        task_obj = MagicMock(spec_set=[
            "status",
            "operation",
            "error",
            "error_type",
            "result",
            "token_validation_error",
            "save"
        ])

        mock_reuse.return_value = (task_obj, True)
        miner = mock_jira_miner_class.return_value
        miner.collect_jira_issues.side_effect = JiraMiner.NoValidJiraTokenError("Invalid token")

        res = collect_jira_issues_task.run("test.atlassian.net", "PROJ", ["Bug"], None, None)

        self.assertEqual(task_obj.status, "FAILURE")
        self.assertEqual(task_obj.error_type, "NO_VALID_JIRA_TOKEN")
        self.assertIn("Invalid token", task_obj.error)
        self.assertEqual(res["code"], "NO_VALID_JIRA_TOKEN")
