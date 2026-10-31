import type { PlatformId } from "../../api/endpoints";

export type CollectionStatus = "running" | "completed" | "partial" | "canceled";

export type Collection = {
  id: number;
  platform: PlatformId;
  parameters: Record<string, unknown>;
  status: CollectionStatus;
  created_by?: number;
  created_at: string;
  finished_at?: string;
  progress: {
    // Grows as jobs fan out.
    jobs_expected: number;
    jobs_done: number;
    jobs_failed: number;
  };
};

// One failed attempt of one of a collection's jobs (GET /api/collections/{id}/errors).
export type CollectionJobError = {
  id: number;
  job_id: number;
  job_kind: string;
  // What the job was working on: repository, batch, cursor, ...
  job_args: Record<string, unknown>;
  attempt: number;
  // The job was given up (counted in jobs_failed); otherwise it was retried.
  is_final: boolean;
  error: string;
  created_at: string;
};

export type StartCollectionBody = {
  platform: PlatformId;
  parameters: Record<string, unknown>;
};

// GitHub resources a git collection can enrich its repositories with
// (backend-go README, Mining a repository).
export type GithubResource =
  | "metadata"
  | "issues"
  | "pull_requests"
  | "commits"
  | "releases"
  | "users";

// Parameters of a `git` collection. GitHub data is an enrichment of the
// repository, so GitHub collections are git collections with `enrich.github`.
export type GitCollectionParameters = {
  urls?: string[];
  repository_ids?: number[];
  // Clone or fetch the repository and mine its history locally.
  commits?: boolean;
  enrich?: {
    github?: {
      resources: GithubResource[];
      // Creation window of issues, pull requests and releases (RFC 3339,
      // until exclusive).
      created_since?: string;
      created_until?: string;
      // Re-mine only issues and pull requests updated since then (RFC 3339).
      since?: string;
    };
  };
};

export type Repository = {
  id: number;
  url: string;
  host: string;
  path: string;
};
