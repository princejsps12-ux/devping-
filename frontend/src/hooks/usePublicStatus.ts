'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { PublicStatus } from '@/lib/types';

export function usePublicStatus(username: string) {
  return useQuery({
    queryKey: ['public-status', username],
    queryFn: async () => {
      const { data } = await api.get<PublicStatus>(`/public/status/${username}`);
      return data;
    },
    refetchInterval: 30_000,
    retry: false,
  });
}
