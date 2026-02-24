import { api } from "../../api/apiClient";
import { endpoints } from "../../api/endpoints";

export const jobsService = {
  // JobsPage: lista jobs de coleta (rota global, independente da fonte).
  list: () => api.get(endpoints.jobs()),

  // JobsPage: cancela/paralisa uma task especifica.
  stop: (taskId: string) => api.delete(endpoints.stopJob(taskId)),

  // JobsPage: reinicia uma coleta a partir de um job existente.
  restartCollection: (taskId: string) =>
    api.post(endpoints.restartCollection(taskId)),
};
