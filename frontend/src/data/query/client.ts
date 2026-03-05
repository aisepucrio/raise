import { QueryClient } from "@tanstack/react-query";

// Cliente single of the React Query for entire the application.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});
