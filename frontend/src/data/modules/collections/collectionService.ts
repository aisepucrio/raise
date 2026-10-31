import { api } from "../../api/apiClient";
import { endpoints } from "../../api/endpoints";
import type { RequestOptions } from "../shared";
import type {
  Collection,
  CollectionJobError,
  Repository,
  StartCollectionBody,
} from "./collectionTypes";

// The list endpoints return bare arrays; 1000 is the API's maximum page.
const MAX_LIMIT = 1000;

export const collectionService = {
  // Newest first.
  list: (options?: RequestOptions) =>
    api.get<Collection[], Collection[]>(endpoints.collections(), {
      params: { limit: MAX_LIMIT },
      signal: options?.signal,
    }),

  // Researcher or admin. Returns 202 with the new collection.
  start: (body: StartCollectionBody) =>
    api.post<Collection, Collection>(endpoints.collections(), body),

  // Failed job attempts, oldest first; kept after the queue deletes its jobs.
  listErrors: (id: number, options?: RequestOptions) =>
    api.get<CollectionJobError[], CollectionJobError[]>(
      endpoints.collectionErrors(id),
      { params: { limit: MAX_LIMIT }, signal: options?.signal },
    ),

  // Researcher or admin.
  cancel: (id: number) => api.post(endpoints.cancelCollection(id)),

  listRepositories: (options?: RequestOptions) =>
    api.get<Repository[], Repository[]>(endpoints.repositories(), {
      params: { limit: MAX_LIMIT },
      signal: options?.signal,
    }),
};
