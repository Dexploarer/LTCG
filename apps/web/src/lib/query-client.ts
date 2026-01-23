/**
 * TanStack Query (React Query) Configuration
 * Centralized query client setup with sensible defaults
 */

import { QueryClient } from "@tanstack/react-query";

/**
 * Default query options
 */
export const defaultQueryOptions = {
  queries: {
    // Stale time: how long data is considered fresh (5 minutes)
    staleTime: 5 * 60 * 1000,

    // Cache time: how long inactive data stays in cache (10 minutes)
    gcTime: 10 * 60 * 1000,

    // Retry failed requests 3 times with exponential backoff
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Don't refetch on window focus in development
    refetchOnWindowFocus: process.env.NODE_ENV === "production",

    // Refetch on reconnect
    refetchOnReconnect: true,

    // Don't refetch on mount if data is fresh
    refetchOnMount: false,
  },
  mutations: {
    // Retry mutations once
    retry: 1,
  },
};

/**
 * Create a new QueryClient instance
 * Use this in your app provider and tests
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: defaultQueryOptions,
  });
}

/**
 * Singleton query client for the application
 * Only use this in your app root - create new instances for tests
 */
export const queryClient = createQueryClient();
