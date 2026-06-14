'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/theme-provider';

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            // Theme-aware toasts driven by the same CSS variables.
            style: {
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '0.625rem',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: 'rgb(var(--status-up))', secondary: 'var(--surface)' } },
            error: { iconTheme: { primary: 'rgb(var(--status-down))', secondary: 'var(--surface)' } },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
