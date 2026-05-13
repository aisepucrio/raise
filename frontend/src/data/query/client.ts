import { QueryClient } from "@tanstack/react-query";

// Single React Query client for the entire application.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});
