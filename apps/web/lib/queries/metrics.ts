import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface Metrics {
  totals: { doctors: number; patients: number; prescriptions: number };
  byStatus: { status: string; count: number }[];
  byDay: { day: string; count: number }[];
  topDoctors: { doctor: { user: { name: string } } | null; count: number }[];
  period: { from: string; to: string };
}

export function useMetrics(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  return useQuery<Metrics>({
    queryKey: ['metrics', from, to],
    queryFn: () => apiFetch(`/admin/metrics?${params.toString()}`),
  });
}
