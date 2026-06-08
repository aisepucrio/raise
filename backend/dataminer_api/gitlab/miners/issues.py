from typing import Dict, List, Optional

from django.utils import timezone

from .base import BaseMiner
from .utils import split_date_range, update_task_progress_date
from ..models import GitLabIssue, GitLabIssueExtra, GitLabMetadata


class IssuesMiner(BaseMiner):
    def get_issue_notes(self, project_id: int, issue_iid: int) -> List[Dict]:
        notes = self.paginate(f"projects/{project_id}/issues/{issue_iid}/notes", params={'sort': 'asc'})
        return [
            {
                'id': note.get('id'),
                'user': (note.get('author') or {}).get('username'),
                'body': note.get('body'),
                'created_at': note.get('created_at'),
                'updated_at': note.get('updated_at'),
                'system': note.get('system', False),
            }
            for note in notes
        ]

    def get_issues(self, repo_name: str, start_date: Optional[str] = None, end_date: Optional[str] = None, depth: str = 'basic', task_obj=None) -> List[Dict]:
        project = self.get_project(repo_name)
        metadata_obj = GitLabMetadata.objects.filter(external_id=str(project['id'])).first()
        if metadata_obj is None:
            metadata_obj = GitLabMetadata.objects.filter(repository=repo_name).first()
        if metadata_obj is None:
            raise RuntimeError(f"GitLabMetadata not found for {repo_name}. Run metadata collection first.")

        all_issues: List[Dict] = []

        def log_progress(message: str) -> None:
            print(message, flush=True)
            if task_obj:
                task_obj.operation = message
                task_obj.save(update_fields=["operation"])

        log_progress(f"[GITLAB][ISSUES] Starting extraction for {repo_name}")

        for period_start, period_end in split_date_range(start_date, end_date):
            params = {'scope': 'all', 'order_by': 'created_at', 'sort': 'asc'}
            if period_start:
                params['created_after'] = f"{period_start}T00:00:00Z"
            if period_end:
                params['created_before'] = f"{period_end}T23:59:59Z"

            issues = self.paginate(f"projects/{project['id']}/issues", params=params)
            for issue in issues:
                current_timestamp = timezone.now()
                notes = self.get_issue_notes(project['id'], issue['iid']) if depth == 'complex' else []
                comments = [note for note in notes if not note.get('system')]
                timeline_events = [note for note in notes if note.get('system')]
                author = issue.get('author') or {}
                reactions = {
                    'upvotes': issue.get('upvotes', 0),
                    'downvotes': issue.get('downvotes', 0),
                }
                processed_issue = {
                    'id': issue['id'],
                    'number': issue['iid'],
                    'title': issue['title'],
                    'state': issue['state'],
                    'locked': issue.get('discussion_locked', False),
                    'assignees': [assignee.get('username') for assignee in issue.get('assignees', []) if assignee.get('username')],
                    'labels': issue.get('labels') or [],
                    'milestone': (issue.get('milestone') or {}).get('title'),
                    'gitlab_created_at': issue.get('created_at'),
                    'gitlab_updated_at': issue.get('updated_at'),
                    'closed_at': issue.get('closed_at'),
                    'author_association': None,
                    'body': issue.get('description'),
                    'reactions': reactions,
                    'is_pull_request': False,
                    'timeline_events': timeline_events,
                    'comments_data': comments,
                    'time_mined': current_timestamp,
                    'data_type': 'issue',
                }

                issue_obj, _ = GitLabIssue.objects.update_or_create(
                    repository=metadata_obj,
                    external_id=str(processed_issue['id']),
                    defaults={
                        'number': processed_issue['number'],
                        'iid': issue.get('iid'),
                        'title': processed_issue['title'],
                        'state': processed_issue['state'],
                        'creator': author.get('username') or author.get('name') or 'unknown',
                        'assignees': processed_issue['assignees'],
                        'labels': processed_issue['labels'],
                        'milestone': processed_issue['milestone'],
                        'locked': processed_issue['locked'],
                        'created_at': processed_issue['gitlab_created_at'],
                        'updated_at': processed_issue['gitlab_updated_at'],
                        'closed_at': processed_issue['closed_at'],
                        'body': processed_issue['body'],
                        'comments': processed_issue['comments_data'],
                        'timeline_events': processed_issue['timeline_events'],
                        'author_association': processed_issue['author_association'],
                        'reactions': processed_issue['reactions'],
                        'time_mined': current_timestamp,
                        'raw_payload': issue,
                    },
                )

                GitLabIssueExtra.objects.update_or_create(
                    issue=issue_obj,
                    defaults={
                        'weight': issue.get('weight'),
                        'health_status': issue.get('health_status'),
                        'confidential': issue.get('confidential', False),
                        'discussion_locked': issue.get('discussion_locked', False),
                        'issue_type': issue.get('issue_type'),
                        'time_stats': issue.get('time_stats'),
                        'task_completion_status': issue.get('task_completion_status'),
                    },
                )

                all_issues.append(processed_issue)

            if period_end:
                update_task_progress_date(task_obj, period_end)
            elif period_start:
                update_task_progress_date(task_obj, period_start)

        log_progress(f"[GITLAB][ISSUES] Extraction completed. Total issues: {len(all_issues)}")
        return all_issues
