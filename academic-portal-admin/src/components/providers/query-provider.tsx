'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes cache time
            refetchOnWindowFocus: false, // Don't refetch when window regains focus
            refetchOnMount: true, // Refetch when component mounts
            retry: (failureCount, error) => {
              // Don't retry on 401 or 403 errors
              if (error instanceof Error && error.message.includes('401')) {
                return false
              }
              if (error instanceof Error && error.message.includes('403')) {
                return false
              }
              // Don't retry on abort errors (navigation cancellations)
              if (error instanceof Error && error.message.includes('cancelled')) {
                return false
              }
              // Retry network errors (Render cold starts) up to 3 times
              if (error instanceof Error && 
                  (error.message.includes('Failed to fetch') || 
                   error.message.includes('network') ||
                   error.message.includes('timeout'))) {
                return failureCount < 3
              }
              return failureCount < 2
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff: 2s, 4s, 8s
          },
          mutations: {
            retry: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}