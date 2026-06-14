'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Activity, Plus } from 'lucide-react';
import { Button, Card, Skeleton } from '@/components/ui';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { MonitorCard } from '@/components/dashboard/MonitorCard';
import { MonitorFormModal } from '@/components/dashboard/MonitorFormModal';
import { useDeleteMonitor, useMonitors, useUpdateMonitor } from '@/hooks/useMonitors';
import { Monitor } from '@/lib/types';

export default function DashboardPage() {
  const { data: monitors, isLoading, isError, refetch } = useMonitors();
  const update = useUpdateMonitor();
  const del = useDeleteMonitor();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Monitor | null>(null);
  const [deleting, setDeleting] = useState<Monitor | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(monitor: Monitor) {
    setEditing(monitor);
    setFormOpen(true);
  }

  function toggleActive(monitor: Monitor) {
    update.mutate(
      { id: monitor.id, isActive: !monitor.isActive },
      { onSuccess: () => toast.success(monitor.isActive ? 'Monitor paused' : 'Monitor resumed') }
    );
  }

  function confirmDelete() {
    if (!deleting) return;
    del.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-primary">Monitors</h1>
          <p className="mt-1 text-sm text-secondary">
            {monitors?.length
              ? `${monitors.length} ${monitors.length === 1 ? 'endpoint' : 'endpoints'} being watched`
              : 'Track the uptime of your services.'}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add monitor
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[148px] rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-sm text-secondary">Couldn&apos;t load your monitors.</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </Card>
      )}

      {!isLoading && !isError && monitors?.length === 0 && (
        <Card className="flex flex-col items-center gap-4 p-12 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-surface text-muted">
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-primary">No monitors yet</p>
            <p className="mt-1 text-sm text-secondary">
              Add your first endpoint to start tracking uptime.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add monitor
          </Button>
        </Card>
      )}

      {!isLoading && !isError && monitors && monitors.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {monitors.map((monitor) => (
            <MonitorCard
              key={monitor.id}
              monitor={monitor}
              onEdit={openEdit}
              onDelete={setDeleting}
              onToggle={toggleActive}
              isToggling={update.isPending}
            />
          ))}
        </div>
      )}

      <MonitorFormModal open={formOpen} onClose={() => setFormOpen(false)} monitor={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete monitor?"
        description={
          deleting
            ? `"${deleting.name}" and all its check history will be permanently removed.`
            : undefined
        }
        isLoading={del.isPending}
      />
    </div>
  );
}
