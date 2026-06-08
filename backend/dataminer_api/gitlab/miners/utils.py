import time
from datetime import datetime, timedelta, timezone
from typing import Generator, Optional, Tuple


class APIMetrics:
    def __init__(self):
        self.execution_start = time.time()
        self.total_requests = 0
        self.rate_limit_remaining = None
        self.rate_limit_reset = None
        self.rate_limit_limit = None
        self.average_time_per_request = 0

    def update_rate_limit(self, headers: dict) -> None:
        self.rate_limit_remaining = headers.get('RateLimit-Remaining') or headers.get('X-RateLimit-Remaining')
        self.rate_limit_reset = headers.get('RateLimit-Reset') or headers.get('X-RateLimit-Reset')
        self.rate_limit_limit = headers.get('RateLimit-Limit') or headers.get('X-RateLimit-Limit')

        if self.total_requests > 0:
            total_time = time.time() - self.execution_start
            self.average_time_per_request = total_time / self.total_requests

    def get_execution_time(self) -> dict:
        total_time = time.time() - self.execution_start
        return {
            "seconds": round(total_time, 2),
            "formatted": f"{int(total_time // 60)}min {int(total_time % 60)}s",
        }


def split_date_range(start_date: Optional[str], end_date: Optional[str], interval_days: int = 1) -> Generator[Tuple[str, str], None, None]:
    if not start_date or not end_date:
        yield (start_date, end_date)
        return

    if isinstance(start_date, datetime):
        start_date = start_date.strftime("%Y-%m-%dT%H:%M:%S")
    if isinstance(end_date, datetime):
        end_date = end_date.strftime("%Y-%m-%dT%H:%M:%S")

    start = datetime.strptime(start_date.rstrip('Z'), "%Y-%m-%dT%H:%M:%S")
    end = datetime.strptime(end_date.rstrip('Z'), "%Y-%m-%dT%H:%M:%S")

    current = start
    while current <= end:
        interval_end = min(current + timedelta(days=interval_days - 1), end)
        yield (
            current.strftime("%Y-%m-%d"),
            interval_end.strftime("%Y-%m-%d"),
        )
        current = interval_end + timedelta(days=1)


def convert_to_iso8601(date: datetime) -> str:
    return date.isoformat()


def count_diff_stats(diff_text: Optional[str]) -> Tuple[int, int]:
    if not diff_text:
        return 0, 0

    added = 0
    deleted = 0
    for line in diff_text.splitlines():
        if line.startswith('+++') or line.startswith('---'):
            continue
        if line.startswith('+'):
            added += 1
        elif line.startswith('-'):
            deleted += 1
    return added, deleted


def update_task_progress_date(task_obj, completed_date: str) -> None:
    if not task_obj:
        return

    try:
        completed_datetime = datetime.strptime(completed_date, "%Y-%m-%d")
        completed_datetime = completed_datetime.replace(tzinfo=timezone.utc)
        task_obj.date_last_update = completed_datetime
        task_obj.save(update_fields=["date_last_update"])
    except Exception as exc:
        print(f"[GITLAB] Warning: could not update progress date: {exc}", flush=True)
