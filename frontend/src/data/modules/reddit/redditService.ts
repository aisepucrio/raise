import type {
  RedditOverviewResponse,
  RedditGraphResponse,
  RedditOverviewParams,
  RedditGraphParams,
} from "./redditTypes";

export async function fetchRedditOverview(
  params?: RedditOverviewParams
): Promise<RedditOverviewResponse> {
  console.log("overview params:", params);

  return {
    posts_count: 120,
    comments_count: 540,
    users_count: 87,
    subreddits_count: 12,
  };
}

export async function fetchRedditGraph(
  params: RedditGraphParams
): Promise<RedditGraphResponse> {
  console.log("graph params:", params);

  return [
    { date: "2024-01-01", posts: 10, comments: 30 },
    { date: "2024-01-02", posts: 15, comments: 40 },
  ];
}

export async function fetchRedditPreview() {
  return {
    count: 3,
    results: [
      { id: 1, title: "Post 1" },
      { id: 2, title: "Post 2" },
    ],
  };
}