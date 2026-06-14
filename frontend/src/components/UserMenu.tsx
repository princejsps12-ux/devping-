'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { Button } from '@/components/ui';
import { useLogout } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

export function UserMenu() {
  const { user, isAuthenticated } = useAuthStore();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Log in
          </Button>
        </Link>
        <Link href="/signup">
          <Button variant="primary" size="sm">
            Sign up
          </Button>
        </Link>
      </div>
    );
  }

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)]',
          'bg-surface text-xs font-medium text-secondary transition-colors duration-150',
          'hover:border-hover hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40'
        )}
        aria-label="Account menu"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-[var(--border)] bg-surface shadow-sm">
          <div className="border-b border-[var(--border)] px-3 py-2.5">
            <p className="truncate text-sm font-medium text-primary">{user.name}</p>
            <p className="truncate font-mono text-xs text-muted">{user.email}</p>
          </div>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-secondary transition-colors duration-150 hover:bg-surface-hover hover:text-primary"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-secondary transition-colors duration-150 hover:bg-surface-hover hover:text-primary"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
