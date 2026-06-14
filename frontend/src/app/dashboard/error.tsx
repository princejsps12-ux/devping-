'use client';

import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button, Card } from '@/components/ui';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="flex flex-col items-center gap-4 p-12 text-center">
      <p className="text-sm font-medium text-primary">This view failed to load</p>
      <p className="max-w-sm text-sm text-secondary">
        Something went wrong while loading your dashboard. Please try again.
      </p>
      <Button variant="secondary" onClick={reset}>
        <RefreshCw className="h-4 w-4" />
        Retry
      </Button>
    </Card>
  );
}
