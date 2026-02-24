import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../query/keys";
import { jobsService } from "./jobsService";

// Lista os jobs de coleta globais exibidos na página de Jobs.
export function useJobsListQuery() {
  return useQuery({
    queryKey: queryKeys.jobs.list(),
    queryFn: () => jobsService.list(),
  });
}
