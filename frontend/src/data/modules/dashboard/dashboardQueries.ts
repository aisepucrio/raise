import { useQuery } from "@tanstack/react-query";
import type { PlatformId } from "../../api/endpoints";
import { queryKeys } from "../../query/keys";
import type {
  DashboardFilter,
  DashboardGraphFilter,
  HookQueryOptions,
} from "../shared";
import { dashboardService } from "./dashboardService";

// Dashboard cards; unscoped, also the entities a selector can scope to.
export function useDashboardQuery(
  platform: PlatformId,
  params?: DashboardFilter,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.dashboard.cards(platform, params),
    enabled: options?.enabled,
    queryFn: ({ signal }) =>
      dashboardService.getCards(platform, params, { signal }),
  });
}

export function useDashboardGraphQuery(
  platform: PlatformId,
  params: DashboardGraphFilter,
  options?: HookQueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.dashboard.graph(platform, params),
    enabled: options?.enabled,
    queryFn: ({ signal }) =>
      dashboardService.getGraphs(platform, params, { signal }),
  });
}

// Earliest and latest data of the dashboard's window timestamp.
export function useDashboardDateRangeQuery(
  platform: PlatformId,
  entity?: string,
  options?: HookQueryOptions,
) {
  const params = entity ? { entity } : undefined;

  return useQuery({
    queryKey: queryKeys.dashboard.dateRange(platform, params),
    enabled: options?.enabled,
    queryFn: ({ signal }) =>
      dashboardService.getDateRange(platform, params, { signal }),
  });
}
