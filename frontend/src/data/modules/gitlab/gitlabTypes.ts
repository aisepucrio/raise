import type { DateFilterRange } from "../shared";

export type GitlabOverviewParams = DateFilterRange & { repository_id?: string };
export type GitlabDateRangeParams = { repository_id: string };
export type GitlabGraphParams = DateFilterRange & {
  interval: "day" | "week" | "month";
  repository_id?: string;
};

export type GitlabRepository = {
  id: number;
  repository: string;
};

export type GitlabOverviewResponse = {
  issues_count?: number;
  pull_requests_count?: number;
  commits_count?: number;
  forks_count?: number;
  stars_count?: number;
  watchers_count?: number;
  users_count?: number;
  repositories_count?: number;
  repositories?: GitlabRepository[];
  time_mined?: string | null;
};

export type GitlabGraphResponse = {
  time_series?: {
    labels?: string[];
    [key: string]: unknown;
  };
  repository_id?: number;
  repository_name?: string;
};

export type GitlabPreviewParams = {
  page: number;
  page_size: number;
  repository?: string;
  search?: string;
  ordering?: string;
  date__gte?: string;
  date__lte?: string;
  created_at__gte?: string;
  created_at__lte?: string;
};

export type GitlabPreviewRow = Record<string, unknown>;

export type GitlabPreviewResponse = {
  count?: number;
  results?: GitlabPreviewRow[];
};

export type GitlabCollectType =
  | "metadata"
  | "commits"
  | "issues"
  | "merge_requests"
  | "branches";

export type GitlabCollectBody = {
  repositories: string[];
  depth: "basic";
  collect_types: GitlabCollectType[];
  start_date?: string;
  end_date?: string;
};

export type GitlabExportBody = {
  format: "json";
  table:
    | "gitlabcommit"
    | "gitlabissue"
    | "gitlabmergerequest"
    | "gitlabbranch"
    | "gitlabmetadata";
};
