import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface PrescriptionItem {
  id: string;
  name: string;
  dosage?: string;
  quantity?: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  code: string;
  notes?: string;
  status: 'PENDING' | 'CONSUMED';
  createdAt: string;
  updatedAt: string;
  author: { id: string; specialty?: string; user: { name: string; email: string } };
  patient: { id: string; dateOfBirth?: string; user: { name: string; email: string } };
  items: PrescriptionItem[];
}

export interface PaginatedPrescriptions {
  data: Prescription[];
  total: number;
  page: number;
  limit: number;
}

// Doctor: own prescriptions
export function useDoctorPrescriptions(params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return useQuery<PaginatedPrescriptions>({
    queryKey: ['doctor-prescriptions', params],
    queryFn: () => apiFetch(`/prescriptions?${query}`),
  });
}

// Patient: own prescriptions
export function usePatientPrescriptions(params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return useQuery<PaginatedPrescriptions>({
    queryKey: ['patient-prescriptions', params],
    queryFn: () => apiFetch(`/me/prescriptions?${query}`),
  });
}

// Admin: all prescriptions
export function useAdminPrescriptions(params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return useQuery<PaginatedPrescriptions>({
    queryKey: ['admin-prescriptions', params],
    queryFn: () => apiFetch(`/admin/prescriptions?${query}`),
  });
}

// Single prescription
export function usePrescription(id: string) {
  return useQuery<Prescription>({
    queryKey: ['prescription', id],
    queryFn: () => apiFetch(`/prescriptions/${id}`),
    enabled: !!id,
  });
}

// Consume prescription
export function useConsumePrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/prescriptions/${id}/consume`, { method: 'PUT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['prescription'] });
    },
  });
}

// Create prescription
export function useCreatePrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      apiFetch('/prescriptions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-prescriptions'] });
    },
  });
}
