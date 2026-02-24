import { QueryClient } from "@tanstack/react-query";

// Cliente único do React Query para toda a aplicação.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});
