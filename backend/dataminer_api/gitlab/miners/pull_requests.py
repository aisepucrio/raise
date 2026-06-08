from typing import Dict, List, Optional

from django.utils import timezone

from .base import BaseMiner
from .utils import split_date_range, update_task_progress_date
from ..models import GitLabMergeRequest, GitLabMergeRequestExtra, GitLabMetadata


class PullRequestsMiner(BaseMiner):
    def get_merge_request_notes(self, project_id: int, mr_iid: int) -> List[Dict]:
        notes = self.paginate(f"projects/{project_id}/merge_requests/{mr_iid}/notes", params={'sort': 'asc'})
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

    def get_merge_request_commits(self, project_id: int, mr_iid: int) -> List[Dict]:
        commits = self.paginate(f"projects/{project_id}/merge_requests/{mr_iid}/commits")
        return [
            {
                'id': commit.get('id'),
                'short_id': commit.get('short_id'),
                'title': commit.get('title'),
                'created_at': commit.get('created_at'),
                'author_name': commit.get('author_name'),
                'author_email': commit.get('author_email'),
            }
            for commit in commits
        ]

    def get_pull_requests(self, repo_name: str, start_date: Optional[str] = None, end_date: Optional[str] = None, depth: str = 'basic', task_obj=None) -> List[Dict]:
        project = self.get_project(repo_name)
        metadata_obj = GitLabMetadata.objects.filter(external_id=str(project['id'])).first()
        if metadata_obj is None:
            metadata_obj = GitLabMetadata.objects.filter(repository=repo_name).first()
        if metadata_obj is None:
            raise RuntimeError(f"GitLabMetadata not found for {repo_name}. Run metadata collection first.")

        all_merge_requests: List[Dict] = []

        def log_progress(message: str) -> None:
            print(message, flush=True)
            if task_obj:
                task_obj.operation = message
                task_obj.save(update_fields=["operation"])

        log_progress(f"[GITLAB][MRS] Starting extraction for {repo_name}")

        for period_start, period_end in split_date_range(start_date, end_date):
            params = {'scope': 'all', 'order_by': 'created_at', 'sort': 'asc'}
            if period_start:
                params['created_after'] = f"{period_start}T00:00:00Z"
            if period_end:
                params['created_before'] = f"{period_end}T23:59:59Z"

            merge_requests = self.paginate(f"projects/{project['id']}/merge_requests", params=params)
            for merge_request in merge_requests:
                current_timestamp = timezone.now()
                notes = self.get_merge_request_notes(project['id'], merge_request['iid']) if depth == 'complex' else []
                comments = [note for note in notes if not note.get('system')]
                timeline_events = [note for note in notes if note.get('system')]
                commits_data = self.get_merge_request_commits(project['id'], merge_request['iid']) if depth == 'complex' else []
                author = merge_request.get('author') or {}
                reactions = {
                    'upvotes': merge_request.get('upvotes', 0),
                    'downvotes': merge_request.get('downvotes', 0),
                }

                processed_pr = {
                    'id': merge_request['id'],
                    'number': merge_request['iid'],
                    'title': merge_request['title'],
                    'state': merge_request['state'],
                    'locked': merge_request.get('discussion_locked', False),
                    'assignees': [assignee.get('username') for assignee in merge_request.get('assignees', []) if assignee.get('username')],
                    'labels': merge_request.get('labels') or [],
                    'milestone': (merge_request.get('milestone') or {}).get('title'),
                    'gitlab_created_at': merge_request.get('created_at'),
                    'gitlab_updated_at': merge_request.get('updated_at'),
                    'closed_at': merge_request.get('closed_at'),
                    'author_association': None,
                    'body': merge_request.get('description'),
                    'reactions': reactions,
                    'is_pull_request': True,
                    'timeline_events': timeline_events,
                    'comments_data': comments,
                    'time_mined': current_timestamp,
                    'data_type': 'pull_request',
                    'merged_at': merge_request.get('merged_at'),
                    'commits_data': commits_data,
                }

                change_request, _ = GitLabMergeRequest.objects.update_or_create(
                    repository=metadata_obj,
                    external_id=str(processed_pr['id']),
                    defaults={
                        'number': processed_pr['number'],
                        'iid': merge_request.get('iid'),
                        'title': processed_pr['title'],
                        'state': processed_pr['state'],
                        'creator': author.get('username') or author.get('name') or 'unknown',
                        'source_branch': merge_request.get('source_branch'),
                        'target_branch': merge_request.get('target_branch'),
                        'assignees': processed_pr['assignees'],
                        'created_at': processed_pr['gitlab_created_at'],
                        'updated_at': processed_pr['gitlab_updated_at'],
                        'closed_at': processed_pr['closed_at'],
                        'merged_at': processed_pr['merged_at'],
                        'labels': processed_pr['labels'],
                        'milestone': processed_pr['milestone'],
                        'locked': processed_pr['locked'],
                        'commits': processed_pr['commits_data'],
                        'comments': processed_pr['comments_data'],
                        'timeline_events': processed_pr['timeline_events'],
                        'body': processed_pr['body'],
                        'author_association': processed_pr['author_association'],
                        'reactions': processed_pr['reactions'],
                        'time_mined': current_timestamp,
                        'merge_commit_sha': merge_request.get('merge_commit_sha'),
                        'squash_commit_sha': merge_request.get('squash_commit_sha'),
                        'raw_payload': merge_request,
                    },
                )

                GitLabMergeRequestExtra.objects.update_or_create(
                    change_request=change_request,
                    defaults={
                        'source_project_id': merge_request.get('source_project_id'),
                        'target_project_id': merge_request.get('target_project_id'),
                        'merge_status': merge_request.get('merge_status'),
                        'detailed_merge_status': merge_request.get('detailed_merge_status'),
                        'squash': merge_request.get('squash'),
                        'should_remove_source_branch': merge_request.get('should_remove_source_branch'),
                        'force_remove_source_branch': merge_request.get('force_remove_source_branch'),
                        'merge_when_pipeline_succeeds': merge_request.get('merge_when_pipeline_succeeds'),
                        'draft': merge_request.get('draft', False),
                    },
                )

                all_merge_requests.append(processed_pr)

            if period_end:
                update_task_progress_date(task_obj, period_end)
            elif period_start:
                update_task_progress_date(task_obj, period_start)

        log_progress(f"[GITLAB][MRS] Extraction completed. Total merge requests: {len(all_merge_requests)}")
        return all_merge_requests
