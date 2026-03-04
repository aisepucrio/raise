import type { DateFilterRange } from "../shared";

export type JiraOverviewParams = DateFilterRange & { project_id?: string };
export type JiraDateRangeParams = { project_id: string };
export type JiraGraphParams = DateFilterRange & {
  interval: "day" | "month" | "year";
  project_id?: string;
};

// Resposta do dashboard/overview (cards + lista de projetos)
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
  // No preview do Jira o filtro usa `project` (e nao `project_id`).
  project?: string;
  search?: string;
  ordering?: string;
  // Usado em `sprints`.
  startDate__gte?: string;
  endDate__lte?: string;
  // Usado em `users`.
  updated_at__gte?: string;
  updated_at__lte?: string;
  // Usado em `issues` e `comments`.
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
