'use client';

import { useState } from 'react';
import { useAdminPrescriptions } from '@/lib/queries/prescriptions';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';

export default function AdminPrescriptionsPage() {
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const params: Record<string, string> = { page: String(page), limit: '15', order: 'desc' };
  if (status) params.status = status;
  if (from) params.from = from;
  if (to) params.to = to;

  const { data, isLoading } = useAdminPrescriptions(params);
  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-[28px] font-semibold tracking-tight"
          style={{ color: 'var(--apple-text)', letterSpacing: '-0.02em' }}
        >
          Todas las Prescripciones
        </h1>
        <p className="text-[14px] mt-1" style={{ color: 'var(--apple-text-2)' }}>
          {data?.total ?? 0} en total
        </p>
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
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
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
            type="date" value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="apple-input" style={{ width: '156px' }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium" style={{ color: 'var(--apple-text-2)' }}>Hasta</label>
          <input
            type="date" value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="apple-input" style={{ width: '156px' }}
          />
        </div>
        <button
          onClick={() => { setStatus(''); setFrom(''); setTo(''); setPage(1); }}
          className="apple-btn apple-btn-secondary"
          style={{ padding: '11px 20px', fontSize: '14px' }}
        >
          Limpiar
        </button>
      </div>

      {/* Table */}
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
        ) : data?.data.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-[15px] font-medium" style={{ color: 'var(--apple-text-2)' }}>
              No hay prescripciones
            </p>
          </div>
        ) : (
          <>
            <table className="apple-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Médico</th>
                  <th>Paciente</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((rx) => (
                  <tr key={rx.id}>
                    <td>
                      <span className="font-mono text-[13px] font-semibold" style={{ color: 'var(--apple-blue)' }}>
                        {rx.code}
                      </span>
                    </td>
                    <td className="font-medium" style={{ color: 'var(--apple-text)' }}>{rx.author.user.name}</td>
                    <td style={{ color: 'var(--apple-text)' }}>{rx.patient.user.name}</td>
                    <td>
                      <Badge variant={rx.status === 'PENDING' ? 'warning' : 'success'}>
                        {rx.status === 'PENDING' ? 'Pendiente' : 'Consumida'}
                      </Badge>
                    </td>
                    <td style={{ color: 'var(--apple-text-2)' }}>
                      {new Date(rx.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
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
                    onClick={() => setPage((p) => p - 1)} disabled={page <= 1}
                    className="apple-btn apple-btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '13px', minHeight: '36px', borderRadius: '10px' }}
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}
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
