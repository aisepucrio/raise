import * as queries from "./gitlabQueries";
import * as mutations from "./gitlabMutations";

export { mutations, queries };

export type {
  GitlabCollectBody,
  GitlabCollectType,
  GitlabDateRangeParams,
  GitlabExportBody,
  GitlabGraphParams,
  GitlabGraphResponse,
  GitlabOverviewParams,
  GitlabOverviewResponse,
  GitlabPreviewParams,
  GitlabPreviewResponse,
  GitlabPreviewRow,
  GitlabRepository,
} from "./gitlabTypes";
