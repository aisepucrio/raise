import * as queries from "./githubQueries";
import * as mutations from "./githubMutations";

export { mutations, queries };

export type {
  GithubCollectBody,
  GithubCollectType,
  GithubDateRangeParams,
  GithubExportBody,
  GithubGraphParams,
  GithubGraphResponse,
  GithubOverviewParams,
  GithubOverviewResponse,
  GithubPreviewParams,
  GithubPreviewResponse,
  GithubPreviewRow,
  GithubRepository,
} from "./githubTypes";
