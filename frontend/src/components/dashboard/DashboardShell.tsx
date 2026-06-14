'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserMenu } from '@/components/UserMenu';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { useAuthStore } from '@/store/auth';

export function DashboardShell({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Wait for client mount so the persisted auth store has hydrated before
  // deciding whether to redirect.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace('/login');
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="relative inline-flex h-3 w-3">
          <span className="absolute inset-0 rounded-full bg-accent animate-pulse-ring" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar />

      {/* Mobile top bar (sidebar is hidden below md). */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--border)] bg-background/80 px-4 backdrop-blur-md md:hidden">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      <div className="md:pl-60">
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
