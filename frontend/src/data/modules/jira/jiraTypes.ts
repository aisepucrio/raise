import type { DateFilterRange, StandardCollectBody } from "../shared";

export type JiraOverviewParams = DateFilterRange & { project_id?: string };
export type JiraDateRangeParams = { project_id: string };

export type JiraPreviewParams = {
  page: number;
  page_size: number;
  // In Jira preview, the filter uses `project` (not `project_id`).
  project?: string;
  search?: string;
  ordering?: string;
  // used in `sprints`.
  startDate__gte?: string;
  endDate__lte?: string;
  // used in `users`.
  updated_at__gte?: string;
  updated_at__lte?: string;
  // used in `issues` and `comments`.
  created__gte?: string;
  created__lte?: string;
};

export type JiraPreviewRow = Record<string, unknown>;

export type JiraPreviewResponse = {
  count?: number;
  results?: JiraPreviewRow[];
};

export type JiraProject = { jira_domain: string; project_key: string };

export type JiraCollectBody = {
  projects: JiraProject[];
  start_date?: string;
  end_date?: string;
};

export type JiraExportBody = {
  format: "json" | "csv";
  table: string;
  date_type?: string;
};
