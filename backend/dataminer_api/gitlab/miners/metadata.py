from typing import Dict, List, Optional

from django.utils import timezone

from .base import BaseMiner
from ..models import GitLabBranch, GitLabMetadata, GitLabProjectExtra


class MetadataMiner(BaseMiner):
    def get_branches(self, repo_name: str) -> List[Dict]:
        project = self.get_project(repo_name)
        branches = self.paginate(f"projects/{project['id']}/repository/branches")
        current_timestamp = timezone.now()

        metadata_obj, _ = GitLabMetadata.objects.get_or_create(
            external_id=str(project['id']),
            defaults={
                'name': project.get('name') or repo_name.split('/')[-1],
                'repository': repo_name,
                'owner': repo_name.split('/')[0],
                'organization': project.get('namespace', {}).get('full_path'),
                'html_url': project.get('web_url'),
                'created_at': project.get('created_at'),
                'updated_at': project.get('last_activity_at') or project.get('updated_at') or project.get('created_at'),
            },
        )

        for branch in branches:
            GitLabBranch.objects.update_or_create(
                repository=metadata_obj,
                name=branch['name'],
                defaults={
                    'sha': branch.get('commit', {}).get('id'),
                    'protected': branch.get('protected', False),
                    'default': branch.get('default', False),
                    'merged': branch.get('merged', False),
                    'web_url': branch.get('web_url'),
                    'time_mined': current_timestamp,
                    'raw_payload': branch,
                },
            )
        return branches

    def get_repo_languages(self, project_id: int) -> Optional[Dict]:
        data = self.get_json(f"projects/{project_id}/languages")
        if not data:
            return None
        return {
            'languages': [
                {'language': name, 'percentage': percentage}
                for name, percentage in data.items()
            ]
        }

    def get_repo_readme(self, project_id: int, default_branch: Optional[str]) -> Optional[str]:
        if not default_branch:
            return None

        tree = self.paginate(
            f"projects/{project_id}/repository/tree",
            params={'ref': default_branch, 'per_page': 100},
        )
        readme_candidates = [
            item for item in tree
            if item.get('type') == 'blob' and item.get('name', '').lower().startswith('readme')
        ]
        if not readme_candidates:
            return None

        filepath = readme_candidates[0]['path']
        response = self.request(
            "GET",
            f"projects/{project_id}/repository/files/{self.encode_project(filepath)}/raw",
            params={'ref': default_branch},
        )
        if response.status_code != 200:
            return None
        return response.text

    def get_contributors_count(self, project_id: int) -> Optional[int]:
        try:
            contributors = self.paginate(f"projects/{project_id}/repository/contributors")
            return len(contributors)
        except Exception:
            return None

    def get_labels_count(self, project_id: int) -> Optional[int]:
        try:
            labels = self.paginate(f"projects/{project_id}/labels")
            return len(labels)
        except Exception:
            return None

    def get_releases_count(self, project_id: int) -> int:
        try:
            releases = self.paginate(f"projects/{project_id}/releases")
            return len(releases)
        except Exception:
            return 0

    def get_repository_metadata(self, repo_name: str, task_obj=None) -> Optional[GitLabMetadata]:
        def log_progress(message: str) -> None:
            print(message, flush=True)
            if task_obj:
                task_obj.operation = message
                task_obj.save(update_fields=["operation"])

        log_progress(f"[GITLAB][METADATA] Starting metadata extraction for {repo_name}")

        try:
            project = self.get_project(repo_name)
            project_id = project['id']
            current_timestamp = timezone.now()
            namespace = project.get('namespace') or {}

            metadata, _ = GitLabMetadata.objects.update_or_create(
                external_id=str(project_id),
                defaults={
                    'name': project.get('name') or repo_name.split('/')[-1],
                    'repository': repo_name,
                    'owner': repo_name.split('/')[0],
                    'organization': namespace.get('full_path'),
                    'watchers_count': project.get('star_count', 0),
                    'forks_count': project.get('forks_count', 0),
                    'open_issues_count': project.get('open_issues_count', 0),
                    'default_branch': project.get('default_branch') or 'main',
                    'description': project.get('description'),
                    'html_url': project.get('web_url'),
                    'contributors_count': self.get_contributors_count(project_id),
                    'topics': project.get('topics') or project.get('tag_list'),
                    'languages': self.get_repo_languages(project_id),
                    'readme': self.get_repo_readme(project_id, project.get('default_branch')),
                    'labels_count': self.get_labels_count(project_id),
                    'created_at': project.get('created_at'),
                    'updated_at': project.get('last_activity_at') or project.get('updated_at') or project.get('created_at'),
                    'is_archived': project.get('archived', False),
                    'is_template': project.get('is_template', False),
                    'releases_count': self.get_releases_count(project_id),
                    'time_mined': current_timestamp,
                    'raw_payload': project,
                },
            )

            GitLabProjectExtra.objects.update_or_create(
                repository=metadata,
                defaults={
                    'stars_count': project.get('star_count', 0),
                    'namespace_id': namespace.get('id'),
                    'path_with_namespace': project.get('path_with_namespace'),
                    'visibility': project.get('visibility'),
                    'archived': project.get('archived', False),
                    'issues_enabled': project.get('issues_enabled'),
                    'merge_requests_enabled': project.get('merge_requests_enabled'),
                    'jobs_enabled': project.get('jobs_enabled'),
                    'wiki_enabled': project.get('wiki_enabled'),
                    'snippets_enabled': project.get('snippets_enabled'),
                },
            )

            log_progress(f"[GITLAB][METADATA] Metadata extracted successfully for {repo_name}")
            return metadata
        except Exception as exc:
            log_progress(f"[GITLAB][METADATA] Error: {exc}")
            return None
