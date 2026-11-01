import { api } from "../../api/apiClient";
import { endpoints, type PlatformId } from "../../api/endpoints";
import type { RequestOptions } from "../shared";
import type { RepositoryData } from "./repositoryTypes";

export const repositoryService = {
  getData: (id: number, options?: RequestOptions) =>
    api.get<RepositoryData, RepositoryData>(endpoints.repositoryData(id), {
      signal: options?.signal,
    }),

  // Admin only. Returns what remains. A 409 means jobs of the repository are
  // queued or running.
  removePart: (id: number, platform: PlatformId, key: string) =>
    api.delete<RepositoryData, RepositoryData>(
      endpoints.repositoryDataPart(id, platform, key),
    ),

  // Admin only. Deletes the repository and everything mined for it, except
  // commits other repositories also contain.
  remove: (id: number) => api.delete(endpoints.repository(id)),
};
