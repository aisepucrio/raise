import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../query/keys";
import { jobsService } from "./jobsService";
import type { JobsListResponse } from "./jobsTypes";

// list the jobs of collection global shown in the page of jobs.
export function useJobsListQuery() {
  return useQuery<JobsListResponse>({
    queryKey: queryKeys.jobs.list(),
    queryFn: () => jobsService.list(),
  });
}
