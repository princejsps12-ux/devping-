'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error for debugging/observability.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-surface text-status-down">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <div>
        <h1 className="text-lg font-medium tracking-tight text-primary">Something went wrong</h1>
        <p className="mt-1 text-sm text-secondary">
          An unexpected error occurred. You can try again or head back home.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Link href="/">
          <Button variant="secondary">Go home</Button>
        </Link>
      </div>
    </div>
  );
}
