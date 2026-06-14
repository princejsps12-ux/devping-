'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui';
import { useUpdateMonitor } from '@/hooks/useMonitors';
import { useAuthStore } from '@/store/auth';
import { Monitor } from '@/lib/types';
import { badgeMarkdown, badgeUrl } from '@/lib/config';
import { cn } from '@/lib/utils';

export function EmbedCard({ monitor }: { monitor: Monitor }) {
  const username = useAuthStore((s) => s.user?.username);
  const update = useUpdateMonitor();
  const [copied, setCopied] = useState(false);

  const markdown = badgeMarkdown(monitor.id);

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      toast.success('Markdown copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy');
    }
  }

  function togglePublic() {
    update.mutate(
      { id: monitor.id, isPublic: !monitor.isPublic },
      {
        onSuccess: () =>
          toast.success(monitor.isPublic ? 'Hidden from status page' : 'Now shown on status page'),
      }
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium tracking-tight text-primary">Share &amp; embed</h2>
        {username && (
          <Link
            href={`/status/${username}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs text-secondary transition-colors hover:text-primary"
          >
            View status page
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Public visibility toggle */}
      <div className="mt-4 flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2.5">
        <div>
          <p className="text-sm text-primary">Show on public status page</p>
          <p className="text-xs text-muted">Visitors can see this monitor&apos;s status and uptime.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={monitor.isPublic}
          disabled={update.isPending}
          onClick={togglePublic}
          className={cn(
            'relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50',
            monitor.isPublic ? 'bg-accent' : 'bg-surface-hover'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
              monitor.isPublic ? 'translate-x-4' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      {/* Badge preview + markdown */}
      <div className="mt-4">
        <p className="mb-2 text-xs text-muted">Embeddable badge</p>
        <div className="mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={badgeUrl(monitor.id)} alt="status badge" height={20} />
        </div>
        <div className="flex items-stretch gap-2">
          <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-[var(--border)] bg-background px-3 py-2 font-mono text-xs text-secondary">
            {markdown}
          </code>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy markdown"
            className="inline-flex h-auto items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 text-xs font-medium text-secondary transition-colors hover:border-hover hover:text-primary"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-status-up" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </Card>
  );
}
