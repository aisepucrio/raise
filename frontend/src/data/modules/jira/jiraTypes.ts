import type { DateFilterRange } from "../shared";

export type JiraOverviewParams = DateFilterRange & { project_id?: string };
export type JiraDateRangeParams = { project_id: string };
export type JiraGraphParams = DateFilterRange & {
  interval: "day" | "month" | "year";
  project_id?: string;
};

// response of the dashboard/overview (cards + list of projects)
export type JiraOverviewProject = {
  id: string;
  name: string;
};

export type JiraOverviewResponse = {
  users_count?: number;
  issues_count?: number;
  comments_count?: number;
  sprints_count?: number;
  projects_count?: number;
  projects?: JiraOverviewProject[];
  time_mined?: string | null;
};

export type JiraPreviewParams = {
  page: number;
  page_size: number;
  // in the preview of the Jira the filter usa `project` (and not `project_id`).
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
