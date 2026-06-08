from datetime import datetime, timedelta

from celery import shared_task
from django.utils import timezone as dj_tz

from jobs.models import Task

from .miners import GitLabMiner


class TokenValidationError(Exception):
    pass


def format_date_for_json(date_value):
    if date_value is None:
        return None
    if isinstance(date_value, str):
        return date_value
    if hasattr(date_value, 'isoformat'):
        return date_value.isoformat()
    return str(date_value)


def _verify_token_or_fail(self, miner, task_obj, operation, repo_name, extra_meta_return=None):
    token_result = miner.verify_token()
    if token_result.get('valid'):
        return None

    error_msg = token_result.get('error', 'Unknown error in token validation')
    error_type = 'TokenValidationError'

    task_obj.status = 'FAILURE'
    task_obj.error = error_msg
    task_obj.error_type = error_type
    task_obj.token_validation_error = True
    task_obj.save()

    extra_meta_return = extra_meta_return or {}
    failure_meta = {
        'operation': operation,
        'repository': repo_name,
        'error': error_msg,
        'error_type': error_type,
        'exc_type': error_type,
        'exc_message': error_msg,
        'exc_module': 'gitlab.tasks',
        **extra_meta_return,
    }
    self.update_state(state='FAILURE', meta=failure_meta)
    raise TokenValidationError(error_msg)


def _reuse_or_create_task(self, *, defaults, task_pk=None):
    if task_pk:
        update_data = {**defaults, "task_id": self.request.id}
        update_data.pop("date_init", None)
        updated = Task.objects.filter(pk=task_pk).update(**update_data)
        if updated:
            return Task.objects.get(pk=task_pk), False
    return Task.objects.get_or_create(task_id=self.request.id, defaults=defaults)


@shared_task(bind=True)
def fetch_commits(self, repo_name, start_date=None, end_date=None, commit_sha=None, task_pk=None):
    defaults = {
        "operation": f"Starting GitLab commit collection: {repo_name}",
        "repository": repo_name,
        "status": "STARTED",
        "error": None,
        "date_init": start_date,
        "date_end": end_date,
        "type": f"gitlab_commits_{commit_sha}" if commit_sha else "gitlab_commits",
    }
    task_obj, _ = _reuse_or_create_task(self, defaults=defaults, task_pk=task_pk)

    self.update_state(
        state='STARTED',
        meta={
            'operation': 'fetch_commits',
            'repository': repo_name,
            'start_date': format_date_for_json(start_date),
            'end_date': format_date_for_json(end_date),
            'commit_sha': commit_sha,
        },
    )

    try:
        if isinstance(start_date, datetime):
            start_date = start_date.strftime('%Y-%m-%dT%H:%M:%SZ')
        if isinstance(end_date, datetime):
            end_date = end_date.strftime('%Y-%m-%dT%H:%M:%SZ')

        miner = GitLabMiner()
        _verify_token_or_fail(self, miner, task_obj, 'fetch_commits', repo_name, {'commit_sha': commit_sha})

        miner.get_repository_metadata(repo_name)
        commits = miner.get_commits(repo_name, start_date, end_date, commit_sha=commit_sha, task_obj=task_obj)

        result = {
            'operation': 'fetch_commits',
            'repository': repo_name,
            'commit_sha': commit_sha,
            'start_date': format_date_for_json(start_date),
            'end_date': format_date_for_json(end_date),
            'data': commits,
        }
        task_obj.status = 'SUCCESS'
        task_obj.operation = f"Completed GitLab commit collection: {repo_name}"
        task_obj.result = result
        task_obj.save()

        self.update_state(state='SUCCESS', meta=result)
        return result
    except Exception as exc:
        error_msg = str(exc)
        error_type = type(exc).__name__
        task_obj.operation = error_msg
        task_obj.status = 'FAILURE'
        task_obj.error = error_msg
        task_obj.error_type = error_type
        task_obj.save()
        self.update_state(
            state='FAILURE',
            meta={
                'operation': 'fetch_commits',
                'repository': repo_name,
                'error': error_msg,
                'error_type': error_type,
                'exc_type': error_type,
                'exc_message': error_msg,
                'exc_module': exc.__class__.__module__,
            },
        )
        raise


@shared_task(bind=True)
def fetch_issues(self, repo_name, start_date=None, end_date=None, depth='basic', task_pk=None):
    defaults = {
        "operation": f"Starting GitLab issue collection: {repo_name}",
        "repository": repo_name,
        "status": "STARTED",
        "date_init": start_date,
        "date_end": end_date,
        "type": f"gitlab_issues_{depth}",
    }
    task_obj, _ = _reuse_or_create_task(self, defaults=defaults, task_pk=task_pk)

    self.update_state(
        state='STARTED',
        meta={
            'operation': 'fetch_issues',
            'repository': repo_name,
            'start_date': format_date_for_json(start_date),
            'end_date': format_date_for_json(end_date),
            'depth': depth,
        },
    )

    try:
        miner = GitLabMiner()
        _verify_token_or_fail(self, miner, task_obj, 'fetch_issues', repo_name, {'depth': depth})

        miner.get_repository_metadata(repo_name)
        issues = miner.get_issues(repo_name, start_date, end_date, depth, task_obj)

        result = {
            'status': 'SUCCESS',
            'count': len(issues),
            'repository': repo_name,
            'start_date': format_date_for_json(start_date),
            'end_date': format_date_for_json(end_date),
            'depth': depth,
        }
        task_obj.status = 'SUCCESS'
        task_obj.operation = f"Completed GitLab issue collection: {repo_name}"
        task_obj.result = result
        task_obj.save()

        self.update_state(state='SUCCESS', meta={**result, 'operation': 'fetch_issues'})
        return result
    except Exception as exc:
        error_msg = str(exc)
        error_type = type(exc).__name__
        task_obj.operation = error_msg
        task_obj.status = 'FAILURE'
        task_obj.error = error_msg
        task_obj.error_type = error_type
        task_obj.save()
        self.update_state(
            state='FAILURE',
            meta={
                'operation': 'fetch_issues',
                'repository': repo_name,
                'error': error_msg,
                'error_type': error_type,
                'exc_type': error_type,
                'exc_message': error_msg,
                'exc_module': exc.__class__.__module__,
            },
        )
        raise


@shared_task(bind=True)
def fetch_pull_requests(self, repo_name, start_date=None, end_date=None, depth='basic', task_pk=None):
    defaults = {
        "operation": f"Starting GitLab merge request collection: {repo_name}",
        "repository": repo_name,
        "status": "STARTED",
        "error": None,
        "date_init": start_date,
        "date_end": end_date,
        "type": f"gitlab_pull_requests_{depth}",
    }
    task_obj, _ = _reuse_or_create_task(self, defaults=defaults, task_pk=task_pk)

    self.update_state(
        state='STARTED',
        meta={
            'operation': 'fetch_pull_requests',
            'repository': repo_name,
            'start_date': format_date_for_json(start_date),
            'end_date': format_date_for_json(end_date),
            'depth': depth,
        },
    )

    try:
        miner = GitLabMiner()
        _verify_token_or_fail(self, miner, task_obj, 'fetch_pull_requests', repo_name, {'depth': depth})

        miner.get_repository_metadata(repo_name)
        pull_requests = miner.get_pull_requests(repo_name, start_date, end_date, depth, task_obj)

        result = {
            'status': 'SUCCESS',
            'count': len(pull_requests),
            'repository': repo_name,
            'start_date': format_date_for_json(start_date),
            'end_date': format_date_for_json(end_date),
            'depth': depth,
        }
        task_obj.status = 'SUCCESS'
        task_obj.operation = f"Completed GitLab merge request collection: {repo_name}"
        task_obj.result = result
        task_obj.save()

        self.update_state(state='SUCCESS', meta={**result, 'operation': 'fetch_pull_requests'})
        return result
    except Exception as exc:
        error_msg = str(exc)
        error_type = type(exc).__name__
        task_obj.operation = error_msg
        task_obj.status = 'FAILURE'
        task_obj.error = error_msg
        task_obj.error_type = error_type
        task_obj.save()
        self.update_state(
            state='FAILURE',
            meta={
                'operation': 'fetch_pull_requests',
                'repository': repo_name,
                'error': error_msg,
                'error_type': error_type,
                'exc_type': error_type,
                'exc_message': error_msg,
                'exc_module': exc.__class__.__module__,
            },
        )
        raise


@shared_task(bind=True)
def fetch_branches(self, repo_name, task_pk=None):
    defaults = {
        "operation": f"Starting GitLab branches collection: {repo_name}",
        "repository": repo_name,
        "error": None,
        "status": "STARTED",
        "type": "gitlab_branches",
    }
    task_obj, _ = _reuse_or_create_task(self, defaults=defaults, task_pk=task_pk)

    self.update_state(state='STARTED', meta={'operation': 'fetch_branches', 'repository': repo_name})
    try:
        miner = GitLabMiner()
        _verify_token_or_fail(self, miner, task_obj, 'fetch_branches', repo_name)

        miner.get_repository_metadata(repo_name)
        branches = miner.get_branches(repo_name)

        result = {'status': 'SUCCESS', 'count': len(branches), 'repository': repo_name}
        task_obj.status = 'SUCCESS'
        task_obj.operation = f"Completed GitLab branches collection: {repo_name}"
        task_obj.result = result
        task_obj.save()

        self.update_state(state='SUCCESS', meta={**result, 'operation': 'fetch_branches'})
        return result
    except Exception as exc:
        error_msg = str(exc)
        error_type = type(exc).__name__
        task_obj.operation = error_msg
        task_obj.status = 'FAILURE'
        task_obj.error = error_msg
        task_obj.error_type = error_type
        task_obj.save()
        self.update_state(
            state='FAILURE',
            meta={
                'operation': 'fetch_branches',
                'repository': repo_name,
                'error': error_msg,
                'error_type': error_type,
                'exc_type': error_type,
                'exc_message': error_msg,
                'exc_module': exc.__class__.__module__,
            },
        )
        raise


@shared_task(bind=True)
def fetch_metadata(self, repo_name, task_pk=None):
    defaults = {
        "operation": f"Starting GitLab metadata collection: {repo_name}",
        "repository": repo_name,
        "error": None,
        "status": "STARTED",
        "type": "gitlab_metadata",
    }
    task_obj, _ = _reuse_or_create_task(self, defaults=defaults, task_pk=task_pk)

    self.update_state(state='STARTED', meta={'operation': 'fetch_metadata', 'repository': repo_name})
    try:
        miner = GitLabMiner()
        _verify_token_or_fail(self, miner, task_obj, 'fetch_metadata', repo_name)

        metadata = miner.get_repository_metadata(repo_name, task_obj)
        if metadata is None:
            raise RuntimeError(
                f"Metadata extraction returned no data for {repo_name}. "
                "Check GitLab API availability and token permissions."
            )

        metadata_dict = {
            'repository': metadata.repository,
            'owner': metadata.owner,
            'organization': metadata.organization,
            'project_id': metadata.project_id,
            'stars_count': metadata.stars_count,
            'watchers_count': metadata.watchers_count,
            'forks_count': metadata.forks_count,
            'open_issues_count': metadata.open_issues_count,
            'default_branch': metadata.default_branch,
            'description': metadata.description,
            'html_url': metadata.html_url,
            'contributors_count': metadata.contributors_count,
            'topics': metadata.topics,
            'languages': metadata.languages,
            'readme': metadata.readme,
            'labels_count': metadata.labels_count,
            'gitlab_created_at': format_date_for_json(metadata.gitlab_created_at),
            'gitlab_updated_at': format_date_for_json(metadata.gitlab_updated_at),
            'is_archived': metadata.is_archived,
            'is_template': metadata.is_template,
            'used_by_count': metadata.used_by_count,
            'releases_count': metadata.releases_count,
            'time_mined': format_date_for_json(metadata.time_mined),
        }

        result = {'status': 'SUCCESS', 'repository': repo_name, 'metadata': metadata_dict}
        task_obj.status = 'SUCCESS'
        task_obj.operation = f"Completed GitLab metadata collection: {repo_name}"
        task_obj.result = result
        task_obj.save()

        self.update_state(state='SUCCESS', meta={**result, 'operation': 'fetch_metadata'})
        return result
    except Exception as exc:
        error_msg = str(exc)
        error_type = type(exc).__name__
        task_obj.operation = error_msg
        task_obj.status = 'FAILURE'
        task_obj.error = error_msg
        task_obj.error_type = error_type
        task_obj.save()
        self.update_state(
            state='FAILURE',
            meta={
                'operation': 'fetch_metadata',
                'repository': repo_name,
                'error': error_msg,
                'error_type': error_type,
                'exc_type': error_type,
                'exc_message': error_msg,
                'exc_module': exc.__class__.__module__,
            },
        )
        raise


@shared_task(bind=True, name="gitlab.restart_collection")
def restart_collection(self, task_pk: str):
    task_obj = Task.objects.get(pk=task_pk)
    repo_name = task_obj.repository or ""
    collect_type = (task_obj.type or "").strip().lower()
    end_date = task_obj.date_end

    extra = None
    if "_" in collect_type:
        extra = collect_type.rsplit("_", 1)[1] or None

    base = task_obj.date_last_update or getattr(task_obj, "date_init", None)
    start_date = (base + timedelta(days=1)) if base else None
    if isinstance(start_date, datetime) and dj_tz.is_naive(start_date):
        start_date = dj_tz.make_aware(start_date, dj_tz.get_current_timezone())

    if collect_type.startswith("gitlab_issues"):
        new_id = fetch_issues.apply_async(args=[repo_name, start_date, end_date, extra, task_pk]).id
    elif collect_type.startswith("gitlab_pull_requests") or collect_type.startswith("gitlab_pr"):
        new_id = fetch_pull_requests.apply_async(args=[repo_name, start_date, end_date, extra, task_pk]).id
    elif collect_type.startswith("gitlab_commits"):
        commit_sha = None if extra == 'commits' else extra
        new_id = fetch_commits.apply_async(args=[repo_name, start_date, end_date, commit_sha, task_pk]).id
    elif collect_type.startswith("gitlab_branches"):
        new_id = fetch_branches.apply_async(args=[repo_name, task_pk]).id
    elif collect_type.startswith("gitlab_metadata"):
        new_id = fetch_metadata.apply_async(args=[repo_name, task_pk]).id
    else:
        self.update_state(state="FAILURE", meta={"error": f"Tipo desconhecido: {collect_type}"})
        raise ValueError(f"Tipo desconhecido: {collect_type}")

    self.update_state(state="SUCCESS", meta={"spawned_task_pk": new_id, "type": collect_type})
    return {"status": "SUCCESS", "spawned_task_pk": new_id, "type": collect_type}
