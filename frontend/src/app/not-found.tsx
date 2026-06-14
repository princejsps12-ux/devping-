import Link from 'next/link';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-mono text-5xl font-medium text-primary">404</p>
      <p className="text-sm text-secondary">This page could not be found.</p>
      <Link href="/">
        <Button variant="secondary">Go home</Button>
      </Link>
    </div>
  );
}
