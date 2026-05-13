import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../query/keys";
import { jobsService } from "./jobsService";
import type { JobsListResponse } from "./jobsTypes";

// Lists global collection jobs shown on the Jobs page.
export function useJobsListQuery() {
  return useQuery<JobsListResponse>({
    queryKey: queryKeys.jobs.list(),
    queryFn: () => jobsService.list(),
  });
}
