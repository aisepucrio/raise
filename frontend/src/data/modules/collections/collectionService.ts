import { api } from "../../api/apiClient";
import { endpoints } from "../../api/endpoints";
import type { DatasetPage } from "../datasets/datasetTypes";
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

  // Every registered repository, from git's `repositories` dataset, newest
  // first. It follows the cursors, since a page holds at most 1000.
  listRepositories: async (options?: RequestOptions) => {
    const repositories: Repository[] = [];
    let cursor: string | undefined;
    do {
      const page = await api.get<DatasetPage, DatasetPage>(
        endpoints.datasetPreview("git", "repositories"),
        {
          params: { limit: MAX_LIMIT, ...(cursor ? { cursor } : {}) },
          signal: options?.signal,
        },
      );
      repositories.push(...(page.results as Repository[]));
      cursor = page.next_cursor ?? undefined;
    } while (cursor);
    return repositories;
  },
};
