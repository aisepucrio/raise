import * as queries from "./githubQueries";
import * as mutations from "./githubMutations";

export { mutations, queries };

export type {
  GithubCollectBody,
  GithubCollectType,
  GithubDateRangeParams,
  GithubExportBody,
  GithubOverviewParams,
  GithubPreviewParams,
  GithubPreviewResponse,
  GithubPreviewRow,
} from "./githubTypes";
