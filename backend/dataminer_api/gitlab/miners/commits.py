from typing import Dict, List, Optional

from django.utils import timezone as django_timezone

from .base import BaseMiner
from .utils import count_diff_stats, update_task_progress_date
from ..models import GitLabAuthor, GitLabCommit, GitLabMetadata, GitLabModifiedFile


class CommitsMiner(BaseMiner):
    def get_commit_detail(self, project_id: int, sha: str) -> Dict:
        return self.get_json(f"projects/{project_id}/repository/commits/{sha}")

    def get_commit_diff(self, project_id: int, sha: str) -> List[Dict]:
        return self.get_json(f"projects/{project_id}/repository/commits/{sha}/diff")

    def _change_type(self, diff_item: Dict) -> str:
        if diff_item.get('new_file'):
            return 'A'
        if diff_item.get('deleted_file'):
            return 'D'
        if diff_item.get('renamed_file'):
            return 'R'
        return 'M'

    def get_commits(self, repo_name: str, start_date: Optional[str] = None, end_date: Optional[str] = None, clone_path: Optional[str] = None, commit_sha: Optional[str] = None, task_obj=None) -> List[Dict]:
        project = self.get_project(repo_name)
        metadata_obj = GitLabMetadata.objects.filter(external_id=str(project['id'])).first()
        if metadata_obj is None:
            metadata_obj = GitLabMetadata.objects.filter(repository=repo_name).first()
        if metadata_obj is None:
            raise RuntimeError(f"GitLabMetadata not found for {repo_name}. Run metadata collection first.")

        def log_progress(message: str) -> None:
            print(message, flush=True)
            if task_obj:
                task_obj.operation = message
                task_obj.save(update_fields=["operation"])

        params = {'with_stats': True}
        if start_date:
            params['since'] = start_date
        if end_date:
            params['until'] = end_date
        if project.get('default_branch'):
            params['ref_name'] = project['default_branch']

        if commit_sha:
            commits = [self.get_commit_detail(project['id'], commit_sha)]
        else:
            commits = self.paginate(f"projects/{project['id']}/repository/commits", params=params)

        current_timestamp = django_timezone.now()
        essential_commits: List[Dict] = []
        last_processed_date = None

        for index, commit in enumerate(commits, start=1):
            sha = commit.get('id')
            detail = commit if commit_sha else self.get_commit_detail(project['id'], sha)
            diff_items = self.get_commit_diff(project['id'], sha)
            log_progress(f"[GITLAB][COMMITS] Mining commit {index} of {len(commits)}. SHA: {sha[:8]}")

            author, _ = GitLabAuthor.objects.get_or_create(
                name=detail.get('author_name') or 'unknown',
                email=detail.get('author_email'),
            )
            committer, _ = GitLabAuthor.objects.get_or_create(
                name=detail.get('committer_name') or detail.get('author_name') or 'unknown',
                email=detail.get('committer_email'),
            )

            total_added = 0
            total_deleted = 0
            modified_files_payload = []

            db_commit, _ = GitLabCommit.objects.update_or_create(
                repository=metadata_obj,
                sha=sha,
                defaults={
                    'short_sha': detail.get('short_id') or sha[:8],
                    'title': detail.get('title'),
                    'message': detail.get('message') or detail.get('title') or '',
                    'date': detail.get('authored_date') or detail.get('created_at') or detail.get('committed_date'),
                    'authored_date': detail.get('authored_date') or detail.get('created_at'),
                    'committed_date': detail.get('committed_date') or detail.get('created_at'),
                    'author': author,
                    'committer': committer,
                    'insertions': detail.get('stats', {}).get('additions', 0),
                    'deletions': detail.get('stats', {}).get('deletions', 0),
                    'files_changed': len(diff_items),
                    'in_main_branch': True,
                    'merge': len(detail.get('parent_ids') or []) > 1,
                    'dmm_unit_size': None,
                    'dmm_unit_complexity': None,
                    'dmm_unit_interfacing': None,
                    'time_mined': current_timestamp,
                    'raw_payload': detail,
                },
            )

            for diff_item in diff_items:
                diff_text = diff_item.get('diff')
                added_lines, deleted_lines = count_diff_stats(diff_text)
                total_added += added_lines
                total_deleted += deleted_lines
                filename = diff_item.get('new_path') or diff_item.get('old_path') or 'unknown'
                change_type = self._change_type(diff_item)

                db_modified_file, _ = GitLabModifiedFile.objects.update_or_create(
                    commit=db_commit,
                    filename=filename,
                    defaults={
                        'old_path': diff_item.get('old_path'),
                        'new_path': diff_item.get('new_path'),
                        'change_type': change_type,
                        'diff': diff_text,
                        'added_lines': added_lines,
                        'deleted_lines': deleted_lines,
                        'time_mined': current_timestamp,
                        'raw_payload': diff_item,
                    },
                )

                modified_files_payload.append(
                    {
                        'old_path': diff_item.get('old_path'),
                        'new_path': diff_item.get('new_path'),
                        'filename': filename,
                        'change_type': change_type,
                        'diff': diff_text,
                        'added_lines': added_lines,
                        'deleted_lines': deleted_lines,
                    }
                )

            if detail.get('stats'):
                db_commit.insertions = detail['stats'].get('additions', total_added)
                db_commit.deletions = detail['stats'].get('deletions', total_deleted)
                db_commit.save(update_fields=['insertions', 'deletions'])

            essential_commits.append(
                {
                    'sha': sha,
                    'message': detail.get('message') or detail.get('title') or '',
                    'date': detail.get('authored_date') or detail.get('created_at') or detail.get('committed_date'),
                    'author': {'name': author.name, 'email': author.email},
                    'committer': {'name': committer.name, 'email': committer.email},
                    'lines': {
                        'insertions': db_commit.insertions,
                        'deletions': db_commit.deletions,
                        'files': len(diff_items),
                    },
                    'in_main_branch': True,
                    'merge': db_commit.merge,
                    'dmm_unit_size': None,
                    'dmm_unit_complexity': None,
                    'dmm_unit_interfacing': None,
                    'modified_files': modified_files_payload,
                }
            )

            commit_date = (detail.get('authored_date') or detail.get('created_at') or detail.get('committed_date') or '')[:10]
            if last_processed_date and commit_date and last_processed_date != commit_date:
                update_task_progress_date(task_obj, last_processed_date)
            last_processed_date = commit_date or last_processed_date

        if last_processed_date:
            update_task_progress_date(task_obj, last_processed_date)

        return essential_commits
