import {
  toApiSince,
  toApiUntil,
  type GitCollectionParameters,
  type GithubResource,
} from "@/data";

// What a GitHub collection can mine. `git_commits` and `git_diffs` come from
// the repository itself (cloned locally, no token needed); the rest are
// GitHub resources, which need a GitHub credential (backend-go README, Mining
// a repository).
export type GithubCollectType = "git_commits" | "git_diffs" | GithubResource;

// GitHub resources the date filters apply to.
export const DATED_RESOURCES: readonly GithubResource[] = [
  "issues",
  "pull_requests",
  "releases",
];

// GitHub resources `since` (updated since) applies to; releases can't be
// filtered by update time.
export const UPDATABLE_RESOURCES: readonly GithubResource[] = [
  "issues",
  "pull_requests",
];

export type GithubCollectDates = {
  // Inclusive `YYYY-MM-DD` days from date inputs; empty when unset.
  createdFrom: string;
  createdTo: string;
  updatedSince: string;
};

export function githubResourcesOf(
  types: readonly GithubCollectType[],
): GithubResource[] {
  return types.filter(
    (t): t is GithubResource => t !== "git_commits" && t !== "git_diffs",
  );
}

// Builds a `git` collection, enriched with GitHub only when a GitHub resource
// is selected, so a commits-only collection needs no token. Repositories are
// sent as URLs; the API registers unknown ones and matches known ones. Diffs
// are mined with the commits, so they send `commits` too.
export function buildGithubCollectionParameters(
  repositories: readonly string[],
  types: readonly GithubCollectType[],
  dates: GithubCollectDates,
): GitCollectionParameters {
  const resources = githubResourcesOf(types);
  const isDated = resources.some((r) => DATED_RESOURCES.includes(r));
  const isUpdatable = resources.some((r) => UPDATABLE_RESOURCES.includes(r));
  const createdSince = isDated ? toApiSince(dates.createdFrom) : undefined;
  const createdUntil = isDated ? toApiUntil(dates.createdTo) : undefined;
  const since = isUpdatable ? toApiSince(dates.updatedSince) : undefined;

  return {
    urls: repositories.map((repository) => `https://github.com/${repository}`),
    ...(types.includes("git_commits") || types.includes("git_diffs")
      ? { commits: true }
      : {}),
    ...(types.includes("git_diffs") ? { diffs: true } : {}),
    ...(resources.length > 0
      ? {
          enrich: {
            github: {
              resources,
              ...(createdSince ? { created_since: createdSince } : {}),
              ...(createdUntil ? { created_until: createdUntil } : {}),
              ...(since ? { since } : {}),
            },
          },
        }
      : {}),
  };
}
