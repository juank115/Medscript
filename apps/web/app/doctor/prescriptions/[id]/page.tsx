'use client';

import { use } from 'react';
import Link from 'next/link';
import { usePrescription } from '@/lib/queries/prescriptions';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { apiUrl } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

const cardStyle = {
  background: '#ffffff',
  borderRadius: '18px',
  border: '1px solid var(--apple-border)',
  boxShadow: 'var(--apple-shadow)',
  padding: '24px',
} as const;

const sectionLabel = {
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  color: 'var(--apple-text-2)',
  marginBottom: '12px',
};

export default function DoctorPrescriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: rx, isLoading } = usePrescription(id);
  const token = useAuthStore((s) => s.accessToken);

  if (isLoading) {
    return (
      <div className="max-w-[640px] space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48 rounded-[10px]" />
        <Skeleton className="h-28 w-full rounded-[18px]" />
        <Skeleton className="h-24 w-full rounded-[18px]" />
        <Skeleton className="h-40 w-full rounded-[18px]" />
      </div>
    );
  }

  if (!rx) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--apple-text-2)' }}>
        Prescripción no encontrada
      </div>
    );
  }

  const downloadPdf = () => {
    fetch(apiUrl(`/prescriptions/${id}/pdf`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${rx.code}.pdf`;
        a.click();
      });
  };

  return (
    <div className="max-w-[640px] animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/doctor/prescriptions"
            className="flex items-center gap-1.5 text-[13px] mb-2"
            style={{ color: 'var(--apple-blue)', textDecoration: 'none' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Mis prescripciones
          </Link>
          <h1
            className="text-[28px] font-bold font-mono tracking-tight"
            style={{ color: 'var(--apple-text)', letterSpacing: '-0.01em' }}
          >
            {rx.code}
          </h1>
        </div>
        <button
          onClick={downloadPdf}
          className="apple-btn apple-btn-secondary"
          style={{ fontSize: '14px' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Descargar PDF
        </button>
      </div>

      <div className="space-y-4">
        {/* Status */}
        <div style={cardStyle}>
          <div className="flex items-center gap-4 flex-wrap">
            <Badge variant={rx.status === 'PENDING' ? 'warning' : 'success'}>
              {rx.status === 'PENDING' ? 'Pendiente' : 'Consumida'}
            </Badge>
            <span className="text-[14px]" style={{ color: 'var(--apple-text-2)' }}>
              Emitida el{' '}
              {new Date(rx.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Patient */}
        <div style={cardStyle}>
          <p style={sectionLabel}>Paciente</p>
          <p className="text-[16px] font-semibold" style={{ color: 'var(--apple-text)' }}>
            {rx.patient.user.name}
          </p>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--apple-text-2)' }}>
            {rx.patient.user.email}
          </p>
        </div>

        {/* Items */}
        <div style={cardStyle}>
          <p style={sectionLabel}>Medicamentos</p>
          <div className="space-y-2.5">
            {rx.items.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-[12px]"
                style={{ background: 'var(--apple-bg-2)' }}
              >
                <p className="text-[15px] font-semibold" style={{ color: 'var(--apple-text)' }}>
                  {item.name}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                  {item.dosage && (
                    <span className="text-[13px]" style={{ color: 'var(--apple-text-2)' }}>
                      Dosis: <span style={{ color: 'var(--apple-text)' }}>{item.dosage}</span>
                    </span>
                  )}
                  {item.quantity && (
                    <span className="text-[13px]" style={{ color: 'var(--apple-text-2)' }}>
                      Cantidad: <span style={{ color: 'var(--apple-text)' }}>{item.quantity}</span>
                    </span>
                  )}
                  {item.instructions && (
                    <span className="text-[13px]" style={{ color: 'var(--apple-text-2)' }}>
                      Indicación: <span style={{ color: 'var(--apple-text)' }}>{item.instructions}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {rx.notes && (
          <div style={cardStyle}>
            <p style={sectionLabel}>Notas del médico</p>
            <p className="text-[14px] leading-relaxed" style={{ color: 'var(--apple-text)' }}>
              {rx.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
