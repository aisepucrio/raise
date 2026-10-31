import { api } from "../../api/apiClient";
import { endpoints, type PlatformId } from "../../api/endpoints";
import type {
  Dashboard,
  DashboardDateRange,
  DashboardFilter,
  DashboardGraphFilter,
  DashboardGraphs,
  RequestOptions,
} from "../shared";

// The same three routes serve every platform's dashboard (§9.1).
export const dashboardService = {
  getCards: (
    platform: PlatformId,
    params?: DashboardFilter,
    options?: RequestOptions,
  ) =>
    api.get<Dashboard, Dashboard>(endpoints.dashboard(platform), {
      params,
      signal: options?.signal,
    }),

  getGraphs: (
    platform: PlatformId,
    params: DashboardGraphFilter,
    options?: RequestOptions,
  ) =>
    api.get<DashboardGraphs, DashboardGraphs>(
      endpoints.dashboardGraph(platform),
      { params, signal: options?.signal },
    ),

  getDateRange: (
    platform: PlatformId,
    params?: Pick<DashboardFilter, "entity">,
    options?: RequestOptions,
  ) =>
    api.get<DashboardDateRange, DashboardDateRange>(
      endpoints.dashboardDateRange(platform),
      { params, signal: options?.signal },
    ),
};
