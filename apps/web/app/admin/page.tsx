'use client';

import { useMetrics } from '@/lib/queries/metrics';
import { CardSkeleton, Skeleton } from '@/components/ui/Skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';

function KpiCard({
  label, value, icon, color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      className="p-6 animate-fade-up"
      style={{
        background: '#ffffff',
        borderRadius: '18px',
        border: '1px solid var(--apple-border)',
        boxShadow: 'var(--apple-shadow)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-[13px] font-medium" style={{ color: 'var(--apple-text-2)' }}>
          {label}
        </p>
        <div
          className="w-10 h-10 rounded-[12px] flex items-center justify-center"
          style={{ background: color + '18', color }}
        >
          {icon}
        </div>
      </div>
      <p
        className="text-[36px] font-bold tracking-tight"
        style={{ color: 'var(--apple-text)', letterSpacing: '-0.03em', lineHeight: 1 }}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

const iconDoctor = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const iconPatients = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const iconRx = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const chartStyle = {
  background: '#ffffff',
  borderRadius: '18px',
  border: '1px solid var(--apple-border)',
  boxShadow: 'var(--apple-shadow)',
  padding: '24px',
};

export default function AdminDashboard() {
  const { data, isLoading } = useMetrics();

  if (isLoading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="grid grid-cols-3 gap-5">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <Skeleton className="h-64 rounded-[18px]" />
          <Skeleton className="h-64 rounded-[18px]" />
        </div>
        <Skeleton className="h-48 rounded-[18px]" />
      </div>
    );
  }

  const statusData = (data?.byStatus || []).map((s) => ({
    name: s.status === 'PENDING' ? 'Pendiente' : 'Consumida',
    total: s.count,
  }));

  const dayData = (data?.byDay || []).map((d) => ({
    day: new Date(d.day).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
    total: d.count,
  }));

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Title */}
      <div className="mb-2">
        <h1
          className="text-[28px] font-semibold tracking-tight"
          style={{ color: 'var(--apple-text)', letterSpacing: '-0.02em' }}
        >
          Dashboard
        </h1>
        <p className="text-[14px] mt-1" style={{ color: 'var(--apple-text-2)' }}>
          Resumen de actividad — últimos 30 días
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Médicos" value={data?.totals.doctors ?? 0} icon={iconDoctor} color="var(--apple-blue)" />
        <KpiCard label="Pacientes" value={data?.totals.patients ?? 0} icon={iconPatients} color="var(--apple-green)" />
        <KpiCard label="Prescripciones" value={data?.totals.prescriptions ?? 0} icon={iconRx} color="var(--apple-orange)" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div style={chartStyle} className="animate-delay-1 animate-fade-up">
          <h2 className="text-[15px] font-semibold mb-5" style={{ color: 'var(--apple-text)', letterSpacing: '-0.01em' }}>
            Por estado
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--apple-border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 13, fill: 'var(--apple-text-2)', fontFamily: 'inherit' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--apple-text-2)', fontFamily: 'inherit' }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.95)',
                  border: '1px solid var(--apple-border)',
                  borderRadius: '12px',
                  boxShadow: 'var(--apple-shadow)',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                }}
                cursor={{ fill: 'var(--apple-bg-2)' }}
              />
              <Bar dataKey="total" fill="var(--apple-blue)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={chartStyle} className="animate-delay-2 animate-fade-up">
          <h2 className="text-[15px] font-semibold mb-5" style={{ color: 'var(--apple-text)', letterSpacing: '-0.01em' }}>
            Prescripciones por día
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--apple-border)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: 'var(--apple-text-2)', fontFamily: 'inherit' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--apple-text-2)', fontFamily: 'inherit' }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.95)',
                  border: '1px solid var(--apple-border)',
                  borderRadius: '12px',
                  boxShadow: 'var(--apple-shadow)',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                }}
                cursor={{ stroke: 'var(--apple-border)' }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="var(--apple-blue)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: 'var(--apple-blue)', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top doctors */}
      {data?.topDoctors && data.topDoctors.length > 0 && (
        <div style={chartStyle} className="animate-delay-3 animate-fade-up">
          <h2 className="text-[15px] font-semibold mb-4" style={{ color: 'var(--apple-text)', letterSpacing: '-0.01em' }}>
            Top médicos
          </h2>
          <div className="space-y-1">
            {data.topDoctors.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 px-3 rounded-[12px] transition-colors"
                style={{ background: i % 2 === 0 ? 'transparent' : 'var(--apple-bg-2)' }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{
                      background: i === 0 ? 'rgba(255,149,0,0.15)' : 'var(--apple-bg-3)',
                      color: i === 0 ? 'var(--apple-orange)' : 'var(--apple-text-2)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-[14px] font-medium" style={{ color: 'var(--apple-text)' }}>
                    {d.doctor?.user.name ?? 'Desconocido'}
                  </span>
                </div>
                <span className="text-[13px]" style={{ color: 'var(--apple-text-2)' }}>
                  {d.count} prescripciones
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
