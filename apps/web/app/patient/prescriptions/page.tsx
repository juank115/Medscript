'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { usePatientPrescriptions, useConsumePrescription } from '@/lib/queries/prescriptions';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { apiUrl } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

export default function PatientPrescriptionsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const token = useAuthStore((s) => s.accessToken);

  const params: Record<string, string> = { page: String(page), limit: '10' };
  if (status) params.status = status;

  const { data, isLoading } = usePatientPrescriptions(params);
  const { mutateAsync: consume, isPending: consuming } = useConsumePrescription();

  const handleConsume = async (id: string, code: string) => {
    if (!confirm(`¿Marcar ${code} como consumida?\n\nEsta acción no se puede deshacer.`)) return;
    try {
      await consume(id);
      toast.success('Prescripción marcada como consumida');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const downloadPdf = (id: string, code: string) => {
    fetch(apiUrl(`/prescriptions/${id}/pdf`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${code}.pdf`;
        a.click();
      })
      .catch(() => toast.error('Error al descargar PDF'));
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-[28px] font-semibold tracking-tight"
            style={{ color: 'var(--apple-text)', letterSpacing: '-0.02em' }}
          >
            Mis Prescripciones
          </h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--apple-text-2)' }}>
            {data?.total ?? 0} prescripciones
          </p>
        </div>
        <div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="apple-select"
            style={{ width: '160px' }}
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="CONSUMED">Consumida</option>
          </select>
        </div>
      </div>

      {/* Table card */}
      <div
        className="overflow-hidden animate-delay-1 animate-fade-up"
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid var(--apple-border)',
          boxShadow: 'var(--apple-shadow)',
        }}
      >
        {isLoading ? (
          <div className="p-6"><TableSkeleton /></div>
        ) : data?.data.length === 0 ? (
          <div className="p-16 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--apple-bg-2)' }}
            >
              <svg className="w-7 h-7" style={{ color: 'var(--apple-text-3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-[15px] font-medium" style={{ color: 'var(--apple-text)' }}>
              No tenés prescripciones aún
            </p>
            <p className="text-[14px] mt-1" style={{ color: 'var(--apple-text-2)' }}>
              Tu médico te enviará prescripciones aquí
            </p>
          </div>
        ) : (
          <>
            <table className="apple-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Médico</th>
                  <th>Ítems</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((rx) => (
                  <tr key={rx.id}>
                    <td>
                      <Link
                        href={`/patient/prescriptions/${rx.id}`}
                        className="font-mono text-[13px] font-semibold"
                        style={{ color: 'var(--apple-blue)' }}
                      >
                        {rx.code}
                      </Link>
                    </td>
                    <td className="font-medium" style={{ color: 'var(--apple-text)' }}>
                      {rx.author.user.name}
                    </td>
                    <td style={{ color: 'var(--apple-text-2)' }}>{rx.items.length}</td>
                    <td>
                      <Badge variant={rx.status === 'PENDING' ? 'warning' : 'success'}>
                        {rx.status === 'PENDING' ? 'Pendiente' : 'Consumida'}
                      </Badge>
                    </td>
                    <td style={{ color: 'var(--apple-text-2)' }}>
                      {new Date(rx.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        {rx.status === 'PENDING' && (
                          <button
                            onClick={() => handleConsume(rx.id, rx.code)}
                            disabled={consuming}
                            className="apple-btn apple-btn-success"
                            style={{ padding: '7px 14px', fontSize: '12px', minHeight: '32px', borderRadius: '8px' }}
                          >
                            Consumir
                          </button>
                        )}
                        <button
                          onClick={() => downloadPdf(rx.id, rx.code)}
                          className="apple-btn apple-btn-secondary"
                          style={{ padding: '7px 14px', fontSize: '12px', minHeight: '32px', borderRadius: '8px' }}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {data && data.total > data.limit && (
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ borderTop: '1px solid var(--apple-border-2)' }}
              >
                <p className="text-[13px]" style={{ color: 'var(--apple-text-2)' }}>
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page <= 1}
                    className="apple-btn apple-btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '13px', minHeight: '36px', borderRadius: '10px' }}
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
                    className="apple-btn apple-btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '13px', minHeight: '36px', borderRadius: '10px' }}
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
