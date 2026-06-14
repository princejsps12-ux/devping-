import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative inline-flex h-2.5 w-2.5">
        <span className="absolute inset-0 rounded-full bg-accent animate-pulse-ring" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-primary">DevPing</span>
    </Link>
  );
}
