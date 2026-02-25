import { api } from "../../api/apiClient";
import { endpoints } from "../../api/endpoints";

export type JobsListItem = {
  task_id: string;
  operation: string;
  repository: string;
  created_at: string;
  created_at_formatted: string;
  status: string;
  error?: string | null;
};

export type JobsListResponse = {
  count: number;
  results: JobsListItem[];
};

export const jobsService = {
  // JobsPage: lista jobs de coleta (rota global, independente da fonte).
  list: () => api.get<JobsListResponse, JobsListResponse>(endpoints.jobs()),

  // JobsPage: cancela/paralisa uma task especifica.
  stop: (taskId: string) => api.delete(endpoints.stopJob(taskId)),

  // JobsPage: reinicia uma coleta a partir de um job existente.
  restartCollection: (taskId: string) =>
    api.post(endpoints.restartCollection(taskId)),
};
