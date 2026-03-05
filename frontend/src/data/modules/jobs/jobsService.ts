import { api } from "../../api/apiClient";
import { endpoints } from "../../api/endpoints";
import type { JobsListResponse } from "./jobsTypes";

export const jobsService = {
  // JobsPage: list jobs of collection (rota global, independente of the source).
  list: () => api.get<JobsListResponse, JobsListResponse>(endpoints.jobs()),

  // JobsPage: cancela/paralisa the task especifica.
  stop: (taskId: string) => api.delete(endpoints.stopJob(taskId)),

  // JobsPage: reinicia the collection the partir of the job existente.
  restartCollection: (taskId: string) =>
    api.post(endpoints.restartCollection(taskId)),
};
