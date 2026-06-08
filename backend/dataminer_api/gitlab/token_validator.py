import logging

import requests
from django.utils import timezone

from jobs.models import Task

logger = logging.getLogger(__name__)


class TokenValidator:
    def __init__(self, token, base_url="https://gitlab.com/api/v4"):
        self.token = token
        self.base_url = base_url.rstrip('/')
        self.headers = {
            'Accept': 'application/json',
            'PRIVATE-TOKEN': token,
        }

    def validate(self):
        try:
            response = requests.get(f'{self.base_url}/user', headers=self.headers, timeout=30)
            if response.status_code == 401:
                return False, "Invalid or expired token"
            if response.status_code == 403:
                return False, "Token does not have sufficient permissions"
            if response.status_code != 200:
                return False, f"GitLab API error: {response.status_code}"
            return True, None
        except requests.exceptions.RequestException as exc:
            logger.error(f"Error validating token: {exc}")
            return False, f"Connection error: {exc}"
        except Exception as exc:
            logger.error(f"Unexpected error validating token: {exc}")
            return False, f"Unexpected error: {exc}"

    @staticmethod
    def create_failed_task(operation, repository, error_message):
        try:
            Task.objects.create(
                task_id=None,
                operation=operation,
                repository=repository,
                status='FAILURE',
                error=error_message,
                created_at=timezone.now(),
            )
        except Exception as exc:
            logger.error(f"Error creating failure task: {exc}")
