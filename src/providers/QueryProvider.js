"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,          // 30s — data considered fresh
        gcTime: 30 * 60 * 1000,        // 30min cache — survives browser tab switches
        retry: 2,                       // Retry twice on failure
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
        refetchOnWindowFocus: true,     // Refresh when user comes back to tab
        refetchOnReconnect: true,       // Refresh when network reconnects
      },
    },
  }));


  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
