// TYPES
export * from "./redditQueries";
export * from "./redditMutations";
export * from "./redditService";
export * from "./redditTypes";

export type RedditSection = "posts" | "comments" | "users";

export type RedditPreviewParams = {
  page?: number;
  page_size?: number;
};

export type RedditOverviewResponse = {
  subreddits_count: number;
  posts_count: number;
  comments_count: number;
  users_count: number;
};

export type RedditGraphParams = {};
export type RedditOverviewParams = {};


// OVERVIEW QUERY (mock)

export function useRedditOverviewQuery(params?: RedditOverviewParams) {
  return {
    data: {
      subreddits_count: 3,
      posts_count: 120,
      comments_count: 540,
      users_count: 80,
      subreddits: [
        { id: "reactjs", name: "reactjs" },
        { id: "programming", name: "programming" },
        { id: "webdev", name: "webdev" },
      ],
    },
    isPending: false,
  };
}


// PREVIEW QUERY (mock)

export function useRedditPreviewQuery() {
  return {
    data: {
      results: [
        {
          title: "React 19 released",
          author: "user1",
          score: 540,
          created_at: "2024-01-01",
        },
        {
          title: "TypeScript tips",
          author: "user2",
          score: 120,
          created_at: "2024-01-02",
        },
      ],
      count: 2,
    },
    isPending: false,
    isError: false,
  };
}


// EXPORT (mock)

export function useRedditExportMutation() {
  return {
    mutateAsync: async () => {
      return new Blob(["mock export"]);
    },
    isPending: false,
  };
}


// GRAPH QUERY (mock)

export function useRedditGraphQuery(params?: RedditOverviewParams) {
  return {
    data: [],
    isPending: false,
  };
}


// DATE RANGE (mock)

export function useRedditDateRangeBySubredditQuery() {
  return {
    data: {
      start_date: "2024-01-01",
      end_date: "2024-12-31",
    },
  };
}