import { useQuery } from "@tanstack/react-query";
import {
  fetchRedditPreview,
  fetchRedditOverview,
  fetchRedditGraph,
} from "./redditService";

import type { RedditOverviewParams } from "./redditTypes";

type DateFilter = {
  startDate?: string;
  endDate?: string;
};

export function useRedditPreviewQuery() {
  return useQuery({
    queryKey: ["reddit-preview"],
    queryFn: fetchRedditPreview,
  });
}


export function useRedditOverviewQuery(params?: RedditOverviewParams) {
  return useQuery({
    queryKey: ["reddit-overview", params],
    queryFn: () => fetchRedditOverview(params),
  });
}


export function useRedditGraphQuery(params?: RedditOverviewParams) {
  return useQuery({
    queryKey: ["reddit-graph", params],
    queryFn: () => fetchRedditGraph(params),
  });
}