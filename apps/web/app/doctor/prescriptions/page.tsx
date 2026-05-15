'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useDoctorPrescriptions } from '@/lib/queries/prescriptions';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';

export default function DoctorPrescriptionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [from, setFrom] = useState(searchParams.get('from') || '');
  const [to, setTo] = useState(searchParams.get('to') || '');
  const [page, setPage] = useState(Number(searchParams.get('page') || '1'));

  const params: Record<string, string> = { page: String(page), limit: '10', order: 'desc' };
  if (status) params.status = status;
  if (from) params.from = from;
  if (to) params.to = to;

  const { data, isLoading, isError } = useDoctorPrescriptions(params);

  const applyFilters = () => {
    const q = new URLSearchParams();
    if (status) q.set('status', status);
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    q.set('page', '1');
    setPage(1);
    router.push(`?${q.toString()}`);
  };

  const clearFilters = () => {
    setStatus(''); setFrom(''); setTo(''); setPage(1);
    router.push('?');
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
            {data?.total ?? 0} prescripciones en total
          </p>
        </div>
        <Link
          href="/doctor/prescriptions/new"
          className="apple-btn apple-btn-primary"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva prescripción
        </Link>
      </div>

      {/* Filters */}
      <div
        className="rounded-[18px] p-5 mb-5 flex flex-wrap gap-3 items-end animate-delay-1 animate-fade-up"
        style={{
          background: 'rgba(255,255,255,0.80)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--apple-border-2)',
          boxShadow: 'var(--apple-shadow)',
        }}
      >
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium" style={{ color: 'var(--apple-text-2)' }}>Estado</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="apple-select"
            style={{ width: '148px' }}
          >
            <option value="">Todos</option>
            <option value="PENDING">Pendiente</option>
            <option value="CONSUMED">Consumida</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium" style={{ color: 'var(--apple-text-2)' }}>Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="apple-input"
            style={{ width: '156px' }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium" style={{ color: 'var(--apple-text-2)' }}>Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="apple-input"
            style={{ width: '156px' }}
          />
        </div>

        <div className="flex gap-2">
          <button onClick={applyFilters} className="apple-btn apple-btn-primary" style={{ padding: '11px 20px', fontSize: '14px' }}>
            Filtrar
          </button>
          <button onClick={clearFilters} className="apple-btn apple-btn-secondary" style={{ padding: '11px 20px', fontSize: '14px' }}>
            Limpiar
          </button>
        </div>
      </div>

      {/* Table card */}
      <div
        className="overflow-hidden animate-delay-2 animate-fade-up"
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid var(--apple-border)',
          boxShadow: 'var(--apple-shadow)',
        }}
      >
        {isLoading ? (
          <div className="p-6"><TableSkeleton /></div>
        ) : isError ? (
          <div className="p-16 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(255,59,48,0.10)' }}
            >
              <svg className="w-6 h-6" style={{ color: 'var(--apple-red)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-medium" style={{ color: 'var(--apple-red)' }}>Error al cargar prescripciones</p>
          </div>
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
            <p className="text-[15px] font-medium mb-1" style={{ color: 'var(--apple-text)' }}>
              No hay prescripciones
            </p>
            <p className="text-[14px] mb-4" style={{ color: 'var(--apple-text-2)' }}>
              Crea la primera prescripción para tu paciente
            </p>
            <Link href="/doctor/prescriptions/new" className="apple-btn apple-btn-primary" style={{ fontSize: '14px', padding: '10px 20px' }}>
              Crear prescripción
            </Link>
          </div>
        ) : (
          <>
            <table className="apple-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Paciente</th>
                  <th>Ítems</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((rx) => (
                  <tr key={rx.id}>
                    <td>
                      <span
                        className="font-mono text-[13px] font-semibold"
                        style={{ color: 'var(--apple-blue)' }}
                      >
                        {rx.code}
                      </span>
                    </td>
                    <td className="font-medium" style={{ color: 'var(--apple-text)' }}>
                      {rx.patient.user.name}
                    </td>
                    <td style={{ color: 'var(--apple-text-2)' }}>
                      {rx.items.length} ítem{rx.items.length !== 1 ? 's' : ''}
                    </td>
                    <td>
                      <Badge variant={rx.status === 'PENDING' ? 'warning' : 'success'}>
                        {rx.status === 'PENDING' ? 'Pendiente' : 'Consumida'}
                      </Badge>
                    </td>
                    <td style={{ color: 'var(--apple-text-2)' }}>
                      {new Date(rx.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/doctor/prescriptions/${rx.id}`}
                        className="text-[13px] font-medium"
                        style={{ color: 'var(--apple-blue)' }}
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {data && data.total > data.limit && (
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ borderTop: '1px solid var(--apple-border-2)' }}
              >
                <p className="text-[13px]" style={{ color: 'var(--apple-text-2)' }}>
                  {(page - 1) * data.limit + 1}–{Math.min(page * data.limit, data.total)} de {data.total}
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
