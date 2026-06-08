from typing import Dict, List, Optional

from .base import BaseMiner
from .commits import CommitsMiner
from .issues import IssuesMiner
from .metadata import MetadataMiner
from .pull_requests import PullRequestsMiner
from .utils import APIMetrics, convert_to_iso8601, split_date_range


class GitLabMiner(BaseMiner):
    def __init__(self):
        self._commits_miner = None
        self._pull_requests_miner = None
        self._issues_miner = None
        self._metadata_miner = None

        super().__init__()

        self._commits_miner = CommitsMiner()
        self._pull_requests_miner = PullRequestsMiner()
        self._issues_miner = IssuesMiner()
        self._metadata_miner = MetadataMiner()

        self._sync_auth_state()

    def _sync_auth_state(self) -> None:
        for miner in [
            self._commits_miner,
            self._pull_requests_miner,
            self._issues_miner,
            self._metadata_miner,
        ]:
            if miner is not None:
                miner.base_url = self.base_url
                miner.headers = self.headers.copy()
                miner.tokens = self.tokens.copy()
                miner.current_token_index = self.current_token_index

    def switch_token(self) -> None:
        super().switch_token()
        self._sync_auth_state()

    def update_auth_header(self) -> None:
        super().update_auth_header()
        self._sync_auth_state()

    def get_commits(self, repo_name: str, start_date: Optional[str] = None, end_date: Optional[str] = None, clone_path: Optional[str] = None, commit_sha: Optional[str] = None, task_obj=None) -> List[Dict]:
        self._sync_auth_state()
        return self._commits_miner.get_commits(repo_name, start_date, end_date, clone_path, commit_sha, task_obj)

    def get_issues(self, repo_name: str, start_date: Optional[str] = None, end_date: Optional[str] = None, depth: str = 'basic', task_obj=None) -> List[Dict]:
        self._sync_auth_state()
        return self._issues_miner.get_issues(repo_name, start_date, end_date, depth, task_obj)

    def get_pull_requests(self, repo_name: str, start_date: Optional[str] = None, end_date: Optional[str] = None, depth: str = 'basic', task_obj=None) -> List[Dict]:
        self._sync_auth_state()
        return self._pull_requests_miner.get_pull_requests(repo_name, start_date, end_date, depth, task_obj)

    def get_branches(self, repo_name: str):
        self._sync_auth_state()
        return self._metadata_miner.get_branches(repo_name)

    def get_repository_metadata(self, repo_name: str, task_obj=None):
        self._sync_auth_state()
        return self._metadata_miner.get_repository_metadata(repo_name, task_obj)


__all__ = [
    'APIMetrics',
    'BaseMiner',
    'CommitsMiner',
    'convert_to_iso8601',
    'GitLabMiner',
    'IssuesMiner',
    'MetadataMiner',
    'PullRequestsMiner',
    'split_date_range',
]
