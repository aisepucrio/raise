import { api } from "../../api/apiClient";
import { endpoints } from "../../api/endpoints";
import type { JobsListResponse } from "./jobsTypes";

export const jobsService = {
  // JobsPage: lists collection jobs (global route, independent of source).
  list: () => api.get<JobsListResponse, JobsListResponse>(endpoints.jobs()),

  // JobsPage: cancels/stops a specific task.
  stop: (taskId: string) => api.delete(endpoints.stopJob(taskId)),

  // JobsPage: restarts collection from an existing job.
  restartCollection: (taskId: string) =>
    api.post(endpoints.restartCollection(taskId)),
};
