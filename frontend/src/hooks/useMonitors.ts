'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/utils';
import { AnomalyResult, Incident, Monitor, MonitorStats, PingPoint, RangeKey } from '@/lib/types';

export const monitorsKey = ['monitors'] as const;

const REFRESH_MS = 30_000;

export interface CreateMonitorInput {
  name: string;
  url: string;
  interval: number;
}

export interface UpdateMonitorInput {
  id: string;
  name?: string;
  interval?: number;
  isActive?: boolean;
  isPublic?: boolean;
}

export function useMonitors() {
  return useQuery({
    queryKey: monitorsKey,
    queryFn: async () => {
      const { data } = await api.get<{ monitors: Monitor[] }>('/monitors');
      return data.monitors;
    },
  });
}

export function useMonitor(id: string) {
  return useQuery({
    queryKey: ['monitor', id],
    queryFn: async () => {
      const { data } = await api.get<{ monitor: Monitor }>(`/monitors/${id}`);
      return data.monitor;
    },
    refetchInterval: REFRESH_MS,
  });
}

export function useMonitorStats(id: string) {
  return useQuery({
    queryKey: ['monitor', id, 'stats'],
    queryFn: async () => {
      const { data } = await api.get<{ stats: MonitorStats }>(`/monitors/${id}/stats`);
      return data.stats;
    },
    refetchInterval: REFRESH_MS,
  });
}

export function useMonitorPings(id: string, range: RangeKey) {
  return useQuery({
    queryKey: ['monitor', id, 'pings', range],
    queryFn: async () => {
      const { data } = await api.get<{ pings: PingPoint[] }>(`/monitors/${id}/pings`, {
        params: { range },
      });
      return data.pings;
    },
    refetchInterval: REFRESH_MS,
  });
}

export function useMonitorIncidents(id: string) {
  return useQuery({
    queryKey: ['monitor', id, 'incidents'],
    queryFn: async () => {
      const { data } = await api.get<{ incidents: Incident[] }>(`/monitors/${id}/incidents`);
      return data.incidents;
    },
    refetchInterval: REFRESH_MS,
  });
}

export function useAnalyzeMonitor(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.get<{ anomaly: AnomalyResult }>(`/monitors/${id}/anomaly`);
      return data.anomaly;
    },
    onSuccess: () => {
      // Result is persisted on the monitor; refetch so the card reflects it.
      qc.invalidateQueries({ queryKey: ['monitor', id] });
      toast.success('Analysis complete');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'AI analysis failed')),
  });
}

export function useCreateMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMonitorInput) => {
      const { data } = await api.post<{ monitor: Monitor }>('/monitors', input);
      return data.monitor;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: monitorsKey });
      toast.success('Monitor created');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not create monitor')),
  });
}

export function useUpdateMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateMonitorInput) => {
      const res = await api.patch<{ monitor: Monitor }>(`/monitors/${id}`, data);
      return res.data.monitor;
    },
    // Success toasts are left to callers since the message differs
    // (edit vs. pause/resume). Errors are reported here uniformly.
    onSuccess: () => qc.invalidateQueries({ queryKey: monitorsKey }),
    onError: (error) => toast.error(getErrorMessage(error, 'Could not update monitor')),
  });
}

export function useDeleteMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/monitors/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: monitorsKey });
      toast.success('Monitor deleted');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not delete monitor')),
  });
}
