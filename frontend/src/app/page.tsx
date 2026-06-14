'use client';

import Link from 'next/link';
import { Activity, Bell, Code2, Globe, Share2, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button, Card, StatusDot } from '@/components/ui';
import { useAuthStore } from '@/store/auth';

const features = [
  {
    icon: Activity,
    title: 'Real-time monitoring',
    desc: 'Health checks on your schedule, backed by a BullMQ queue that scales and auto-retries.',
  },
  {
    icon: Globe,
    title: 'Multi-region checks',
    desc: 'Verified from multiple regions, so a single network blip never triggers a false alarm.',
  },
  {
    icon: Sparkles,
    title: 'AI anomaly detection',
    desc: 'LLaMA 3.3 reads your response-time trends and flags downtime risk before it happens.',
  },
  {
    icon: Bell,
    title: 'Instant email alerts',
    desc: 'Know the moment a service goes down — and the moment it recovers, with downtime included.',
  },
  {
    icon: Share2,
    title: 'Public status pages',
    desc: 'Share a clean, branded status page with live uptime — perfect for customers.',
  },
  {
    icon: Code2,
    title: 'Embeddable badges',
    desc: 'Drop a live status badge into any README or site with a single line of markdown.',
  },
];

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero */}
        <section className="mx-auto max-w-2xl py-20 text-center sm:py-28">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-surface px-3 py-1 text-xs text-secondary">
            <StatusDot status="up" size="sm" />
            Now with AI-powered anomaly detection
          </div>
          <h1 className="text-4xl font-medium tracking-tighter text-primary sm:text-6xl">
            Uptime monitoring
            <br />
            for developers
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-secondary sm:text-lg">
            Know the moment your services go down. Fast multi-region checks, clean dashboards,
            AI insights, and alerts that actually reach you.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg">Go to dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg">Get started — free</Button>
                </Link>
                <Link href="/login">
                  <Button variant="secondary" size="lg">
                    Log in
                  </Button>
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="pb-24">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <f.icon className="h-[18px] w-[18px]" />
                </span>
                <h3 className="mt-4 text-sm font-medium text-primary">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-secondary">{f.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        {!isAuthenticated && (
          <section className="pb-24">
            <Card className="flex flex-col items-center gap-4 p-10 text-center">
              <h2 className="text-2xl font-medium tracking-tight text-primary">
                Ship with confidence
              </h2>
              <p className="max-w-md text-sm text-secondary">
                Set up your first monitor in under a minute. No credit card required.
              </p>
              <Link href="/signup">
                <Button size="lg">Get started</Button>
              </Link>
            </Card>
          </section>
        )}
      </main>

      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} DevPing</span>
          <span className="font-mono">Built with Next.js · Express · BullMQ · Prisma</span>
        </div>
      </footer>
    </div>
  );
}
