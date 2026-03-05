import type { DateFilterRange } from "../shared";

export type GithubOverviewParams = DateFilterRange & { repository_id?: string };
export type GithubDateRangeParams = { repository_id: string };
export type GithubGraphParams = DateFilterRange & {
  interval: "day" | "month" | "year";
  repository_id?: string;
};

// response of the dashboard/overview (cards + list of repositories)
export type GithubRepository = {
  id: number;
  repository: string;
};

export type GithubOverviewResponse = {
  issues_count?: number;
  pull_requests_count?: number;
  commits_count?: number;
  comments_count?: number;
  forks_count?: number;
  stars_count?: number;
  users_count?: number;
  repositories_count?: number;
  repositories?: GithubRepository[];
  time_mined?: string | null;
};

// response of the chart of the dashboard (series for label/tempo)
export type GithubGraphResponse = {
  time_series?: {
    labels?: string[];
    [key: string]: unknown;
  };
  repository_id?: number;
  repository_name?: string;
};

export type GithubPreviewParams = {
  page: number;
  page_size: number;
  // in the preview of the GitHub the filter usa `repository` (and not `repository_id`).
  repository?: string;
  search?: string;
  ordering?: string;
  // used in `commits` and `users`.
  date__gte?: string;
  date__lte?: string;
  // used in `issues` and `pull-requests`.
  github_created_at__gte?: string;
  github_created_at__lte?: string;
};

export type GithubPreviewRow = Record<string, unknown>;

export type GithubPreviewResponse = {
  count?: number;
  results?: GithubPreviewRow[];
};

export type GithubCollectType =
  | "metadata"
  | "issues"
  | "comments"
  | "pull_requests"
  | "commits";

export type GithubCollectBody = {
  repositories: string[];
  depth: "basic";
  collect_types: GithubCollectType[];
  start_date?: string;
  end_date?: string;
};

export type GithubExportBody = {
  format: "json";
  table: string;
  date_type?: string;
};
