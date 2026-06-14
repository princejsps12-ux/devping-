'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, BellRing, LogOut, Settings } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useLogout } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

const nav = [
  { label: 'Monitors', href: '/dashboard', icon: Activity, enabled: true },
  { label: 'Incidents', href: '#', icon: BellRing, enabled: false },
  { label: 'Settings', href: '#', icon: Settings, enabled: false },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const logout = useLogout();

  const initials = (user?.name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-[var(--border)] bg-background md:flex">
      <div className="flex h-14 items-center border-b border-[var(--border)] px-5">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const active = item.enabled && pathname === item.href;
          const Icon = item.icon;
          const content = (
            <span
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150',
                active
                  ? 'bg-surface-hover text-primary'
                  : item.enabled
                    ? 'text-secondary hover:bg-surface-hover hover:text-primary'
                    : 'cursor-default text-muted'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {!item.enabled && (
                <span className="ml-auto text-[10px] uppercase tracking-wide text-muted">Soon</span>
              )}
            </span>
          );
          return item.enabled ? (
            <Link key={item.label} href={item.href}>
              {content}
            </Link>
          ) : (
            <div key={item.label} aria-disabled>
              {content}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-[var(--border)] p-3">
        <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-surface text-xs font-medium text-secondary">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-primary">{user?.name}</p>
            <p className="truncate font-mono text-xs text-muted">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={logout}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-secondary transition-colors duration-150 hover:border-hover hover:text-primary"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
