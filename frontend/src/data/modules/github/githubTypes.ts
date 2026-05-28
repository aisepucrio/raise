import type { DateFilterRange } from "../shared";

export type GithubOverviewParams = DateFilterRange & { repository_id?: string };
export type GithubDateRangeParams = { repository_id: string };

export type GithubPreviewParams = {
  page: number;
  page_size: number;
  // In GitHub preview, the filter uses `repository` (not `repository_id`).
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
