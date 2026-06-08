import os
import time
from typing import Any, Dict, List, Optional
from urllib.parse import quote

import requests
from dotenv import load_dotenv

from .utils import APIMetrics


class BaseMiner:
    def __init__(self):
        load_dotenv()
        self.base_url = (
            os.getenv("GITLAB_API_URL")
            or os.getenv("GITLAB_BASE_URL")
            or "https://gitlab.com/api/v4"
        ).rstrip('/')
        self.headers = {'Accept': 'application/json'}
        self.tokens: List[str] = []
        self.current_token_index = 0

        result = self.load_tokens()
        if not result['success']:
            raise Exception(f"Failed to initialize GitLab tokens: {result['error']}")

        self.update_auth_header()

    def load_tokens(self) -> Dict[str, Any]:
        tokens_str = os.getenv("GITLAB_TOKENS")
        if not tokens_str:
            return {
                'success': False,
                'error': 'No tokens found. Configure GITLAB_TOKENS in the .env file',
            }

        self.tokens = [token.strip().strip('"').strip("'") for token in tokens_str.split(",") if token.strip()]
        if not self.tokens:
            return {
                'success': False,
                'error': 'No valid tokens found after processing GITLAB_TOKENS',
            }

        valid_tokens = []
        for index, token in enumerate(self.tokens):
            self.current_token_index = index
            self.headers['PRIVATE-TOKEN'] = token
            verification = self.verify_token()
            if verification.get('valid'):
                valid_tokens.append({'index': index})

        if not valid_tokens:
            return {
                'success': False,
                'error': 'No valid GitLab tokens were accepted by the API',
            }

        self.current_token_index = valid_tokens[0]['index']
        return {
            'success': True,
            'tokens_loaded': len(self.tokens),
            'valid_tokens': len(valid_tokens),
            'selected_token': valid_tokens[0],
        }

    def update_auth_header(self) -> None:
        if self.tokens:
            self.headers['PRIVATE-TOKEN'] = self.tokens[self.current_token_index]

    def switch_token(self) -> None:
        if not self.tokens:
            return
        self.current_token_index = (self.current_token_index + 1) % len(self.tokens)
        self.update_auth_header()

    def verify_token(self) -> Dict[str, Any]:
        try:
            response = requests.get(f"{self.base_url}/user", headers=self.headers, timeout=30)
            if response.status_code == 401:
                return {'valid': False, 'error': 'Token invalid or expired', 'status_code': 401}
            if response.status_code == 403:
                return {'valid': False, 'error': 'Token does not have sufficient permissions', 'status_code': 403}
            if response.status_code != 200:
                return {
                    'valid': False,
                    'error': f'Error verifying token: {response.status_code}',
                    'status_code': response.status_code,
                }
            return {'valid': True}
        except Exception as exc:
            return {'valid': False, 'error': f'Error verifying token: {exc}', 'status_code': None}

    def handle_rate_limit(self, response: requests.Response) -> bool:
        if response.status_code not in (429, 403):
            return False

        if len(self.tokens) > 1:
            original_index = self.current_token_index
            for _ in range(len(self.tokens) - 1):
                self.switch_token()
                if self.current_token_index == original_index:
                    break
                verification = self.verify_token()
                if verification.get('valid'):
                    return True

        retry_after = response.headers.get('Retry-After')
        wait_seconds = int(retry_after) if retry_after and retry_after.isdigit() else 5
        time.sleep(wait_seconds)
        return True

    def request(self, method: str, path: str, params: Optional[Dict[str, Any]] = None, **kwargs) -> requests.Response:
        url = f"{self.base_url}/{path.lstrip('/')}"
        response = requests.request(method, url, headers=self.headers, params=params, timeout=60, **kwargs)
        if response.status_code in (429, 403) and self.handle_rate_limit(response):
            response = requests.request(method, url, headers=self.headers, params=params, timeout=60, **kwargs)
        return response

    def get_json(self, path: str, params: Optional[Dict[str, Any]] = None) -> Any:
        response = self.request("GET", path, params=params)
        response.raise_for_status()
        return response.json()

    def paginate(self, path: str, params: Optional[Dict[str, Any]] = None, per_page: int = 100) -> List[Dict[str, Any]]:
        page = 1
        all_items: List[Dict[str, Any]] = []
        while True:
            page_params = {**(params or {}), 'per_page': per_page, 'page': page}
            response = self.request("GET", path, params=page_params)
            response.raise_for_status()
            data = response.json()
            if not data:
                break
            all_items.extend(data)
            if len(data) < per_page:
                break
            page += 1
        return all_items

    def encode_project(self, repo_name: str) -> str:
        return quote(repo_name, safe='')

    def get_project(self, repo_name: str) -> Dict[str, Any]:
        return self.get_json(f"projects/{self.encode_project(repo_name)}")

    def check_and_log_rate_limit(self, response: requests.Response, metrics: APIMetrics, context: str = "") -> bool:
        metrics.update_rate_limit(response.headers)
        remaining = metrics.rate_limit_remaining
        if remaining is not None and str(remaining).isdigit() and int(remaining) < 50:
            print(f"[GITLAB] Warning: only {remaining} requests remaining. {context}", flush=True)
        return response.status_code in (429, 403)
