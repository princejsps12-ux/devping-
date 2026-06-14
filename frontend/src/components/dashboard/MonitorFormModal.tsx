'use client';

import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Input, Modal, Select } from '@/components/ui';
import { useCreateMonitor, useUpdateMonitor } from '@/hooks/useMonitors';
import { Monitor } from '@/lib/types';

interface MonitorFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Pass a monitor to edit; omit to create. */
  monitor?: Monitor | null;
}

const intervalOptions = [
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 120, label: '2 minutes' },
  { value: 300, label: '5 minutes' },
  { value: 600, label: '10 minutes' },
  { value: 900, label: '15 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 3600, label: '1 hour' },
];

export function MonitorFormModal({ open, onClose, monitor }: MonitorFormModalProps) {
  const isEdit = Boolean(monitor);
  const create = useCreateMonitor();
  const update = useUpdateMonitor();

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [interval, setIntervalValue] = useState(60);

  // Sync form state whenever the modal opens (or the target monitor changes).
  useEffect(() => {
    if (open) {
      setName(monitor?.name ?? '');
      setUrl(monitor?.url ?? '');
      setIntervalValue(monitor?.interval ?? 60);
    }
  }, [open, monitor]);

  const isSubmitting = create.isPending || update.isPending;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isEdit && monitor) {
      update.mutate(
        { id: monitor.id, name, interval },
        {
          onSuccess: () => {
            toast.success('Monitor updated');
            onClose();
          },
        }
      );
    } else {
      create.mutate({ name, url, interval }, { onSuccess: () => onClose() });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit monitor' : 'Add monitor'}
      description={
        isEdit ? 'Update the name or check interval.' : 'Start watching a new endpoint.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="m-name" className="block text-sm font-medium text-secondary">
            Name
          </label>
          <Input
            id="m-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="API Production"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="m-url" className="block text-sm font-medium text-secondary">
            URL
          </label>
          <Input
            id="m-url"
            type="url"
            required
            mono
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/health"
            disabled={isEdit}
          />
          {isEdit && <p className="text-xs text-muted">The URL can&apos;t be changed after creation.</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="m-interval" className="block text-sm font-medium text-secondary">
            Check interval
          </label>
          <Select
            id="m-interval"
            value={interval}
            onChange={(e) => setIntervalValue(Number(e.target.value))}
          >
            {intervalOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Add monitor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
