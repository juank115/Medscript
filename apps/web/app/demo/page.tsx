'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

const DEMO_USERS = {
  DOCTOR: {
    id: 'demo-doctor',
    email: 'dr@test.com',
    name: 'Dr. Carlos Rodríguez',
    role: 'DOCTOR' as const,
  },
  PATIENT: {
    id: 'demo-patient',
    email: 'patient@test.com',
    name: 'María López',
    role: 'PATIENT' as const,
  },
  ADMIN: {
    id: 'demo-admin',
    email: 'admin@test.com',
    name: 'Admin Sistema',
    role: 'ADMIN' as const,
  },
};

const ROUTES = {
  DOCTOR: '/doctor/prescriptions',
  PATIENT: '/patient/prescriptions',
  ADMIN: '/admin',
};

export default function DemoPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [selected, setSelected] = useState<keyof typeof DEMO_USERS | null>(null);

  const enter = (role: keyof typeof DEMO_USERS) => {
    setSelected(role);
    const user = DEMO_USERS[role];
    setAuth({ user, accessToken: 'demo-token', refreshToken: 'demo-refresh' });
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `auth-role=${role}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax${secure}`;
    setTimeout(() => router.push(ROUTES[role]), 300);
  };

  useEffect(() => {
    // Clear any existing session to start fresh
    document.cookie = 'auth-role=; path=/; max-age=0; SameSite=Lax';
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(160deg, #f5f5f7 0%, #e8e8ed 100%)' }}
    >
      <div
        className="w-full max-w-[440px] animate-fade-up"
        style={{
          background: 'rgba(255,255,255,0.90)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: '24px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 8px 48px rgba(0,0,0,0.10)',
          padding: '44px 40px',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 flex items-center justify-center mb-5"
            style={{ background: 'var(--apple-blue)', borderRadius: '18px', boxShadow: '0 4px 20px rgba(0,113,227,0.32)' }}
          >
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1
            className="text-[26px] font-semibold"
            style={{ color: 'var(--apple-text)', letterSpacing: '-0.02em' }}
          >
            Modo Demo
          </h1>
          <p className="mt-1.5 text-[14px] text-center" style={{ color: 'var(--apple-text-2)' }}>
            Elegí un rol para explorar la interfaz con datos de muestra
          </p>
        </div>

        <div className="space-y-3">
          {/* Doctor */}
          <button
            onClick={() => enter('DOCTOR')}
            disabled={selected !== null}
            className="w-full text-left p-4 rounded-[16px] transition-all duration-150"
            style={{
              background: selected === 'DOCTOR' ? 'rgba(0,113,227,0.08)' : 'var(--apple-bg-2)',
              border: selected === 'DOCTOR' ? '1.5px solid var(--apple-blue)' : '1.5px solid transparent',
              cursor: selected !== null ? 'default' : 'pointer',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(0,113,227,0.12)', color: 'var(--apple-blue)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-semibold" style={{ color: 'var(--apple-text)' }}>Médico</p>
                <p className="text-[12px]" style={{ color: 'var(--apple-text-2)' }}>
                  Crear y gestionar prescripciones · Descargar PDFs
                </p>
              </div>
            </div>
          </button>

          {/* Patient */}
          <button
            onClick={() => enter('PATIENT')}
            disabled={selected !== null}
            className="w-full text-left p-4 rounded-[16px] transition-all duration-150"
            style={{
              background: selected === 'PATIENT' ? 'rgba(52,199,89,0.08)' : 'var(--apple-bg-2)',
              border: selected === 'PATIENT' ? '1.5px solid var(--apple-green)' : '1.5px solid transparent',
              cursor: selected !== null ? 'default' : 'pointer',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(52,199,89,0.12)', color: 'var(--apple-green)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-semibold" style={{ color: 'var(--apple-text)' }}>Paciente</p>
                <p className="text-[12px]" style={{ color: 'var(--apple-text-2)' }}>
                  Ver mis prescripciones · Marcar consumidas
                </p>
              </div>
            </div>
          </button>

          {/* Admin */}
          <button
            onClick={() => enter('ADMIN')}
            disabled={selected !== null}
            className="w-full text-left p-4 rounded-[16px] transition-all duration-150"
            style={{
              background: selected === 'ADMIN' ? 'rgba(255,149,0,0.08)' : 'var(--apple-bg-2)',
              border: selected === 'ADMIN' ? '1.5px solid var(--apple-orange)' : '1.5px solid transparent',
              cursor: selected !== null ? 'default' : 'pointer',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,149,0,0.12)', color: 'var(--apple-orange)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-semibold" style={{ color: 'var(--apple-text)' }}>Administrador</p>
                <p className="text-[12px]" style={{ color: 'var(--apple-text-2)' }}>
                  Dashboard con métricas · Vista global de prescripciones
                </p>
              </div>
            </div>
          </button>
        </div>

        {selected && (
          <div className="mt-5 text-center animate-fade-in">
            <p className="text-[13px]" style={{ color: 'var(--apple-text-2)' }}>
              Cargando dashboard...
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-[11px]" style={{ color: 'var(--apple-text-3)' }}>
          Datos de muestra — sin conexión al backend
        </p>
      </div>
    </div>
  );
}
