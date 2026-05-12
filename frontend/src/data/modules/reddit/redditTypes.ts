export type RedditSection = "posts" | "comments" | "users";

export type RedditPreviewParams = {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
};

export type RedditPreviewResponse = {
  count: number;
  results: any[];
};

export type RedditOverviewParams = {
  startDate?: string;
  endDate?: string;
  subreddit?: string;
};

export type RedditGraphParams = {
  startDate?: string;
  endDate?: string;
  interval?: string;
  subreddit?: string;
};

export type RedditOverviewResponse = {
  posts_count: number;
  comments_count: number;
  users_count: number;
  subreddits_count: number;
};

export type RedditGraphResponse = {
  date: string;
  posts: number;
  comments: number;
}[];