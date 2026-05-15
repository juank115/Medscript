'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(4, 'Mínimo 4 caracteres'),
});

type FormData = z.infer<typeof schema>;

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Credenciales inválidas');
      }

      const json = await res.json();
      const { accessToken, refreshToken, user } = json.data ?? json;

      setAuth({ user, accessToken, refreshToken });
      document.cookie = `auth-role=${user.role}; path=/; max-age=${7 * 24 * 3600}`;

      toast.success(`Bienvenido, ${user.name}`);

      const routes: Record<string, string> = {
        ADMIN: '/admin',
        DOCTOR: '/doctor/prescriptions',
        PATIENT: '/patient/prescriptions',
      };
      router.push(routes[user.role] || '/');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(160deg, #f5f5f7 0%, #e8e8ed 100%)' }}
    >
      {/* Card */}
      <div
        className="w-full max-w-[400px] animate-fade-up"
        style={{
          background: 'rgba(255,255,255,0.88)',
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
            style={{
              background: 'var(--apple-blue)',
              borderRadius: '18px',
              boxShadow: '0 4px 20px rgba(0,113,227,0.32)',
            }}
          >
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1
            className="text-[28px] font-semibold tracking-tight"
            style={{ color: 'var(--apple-text)', letterSpacing: '-0.02em' }}
          >
            Plataforma Médica
          </h1>
          <p className="mt-1.5 text-[15px]" style={{ color: 'var(--apple-text-2)' }}>
            Inicia sesión para continuar
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              className="block text-[13px] font-medium mb-1.5"
              style={{ color: 'var(--apple-text-2)' }}
            >
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="doctor@ejemplo.com"
              className="apple-input"
            />
            {errors.email && (
              <p className="mt-1.5 text-[12px]" style={{ color: 'var(--apple-red)' }}>
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              className="block text-[13px] font-medium mb-1.5"
              style={{ color: 'var(--apple-text-2)' }}
            >
              Contraseña
            </label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="apple-input"
            />
            {errors.password && (
              <p className="mt-1.5 text-[12px]" style={{ color: 'var(--apple-red)' }}>
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="apple-btn apple-btn-primary w-full mt-2"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2 justify-center">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Iniciando sesión...
              </span>
            ) : 'Iniciar sesión'}
          </button>
        </form>

        {/* Test credentials */}
        <div
          className="mt-6 p-4"
          style={{
            background: 'var(--apple-bg-2)',
            borderRadius: '14px',
          }}
        >
          <p className="text-[12px] font-semibold mb-2" style={{ color: 'var(--apple-text-2)' }}>
            CUENTAS DE PRUEBA
          </p>
          <div className="space-y-1.5">
            {[
              { rol: 'Admin', email: 'admin@test.com', pass: 'admin123' },
              { rol: 'Médico', email: 'dr@test.com', pass: 'dr123' },
              { rol: 'Paciente', email: 'patient@test.com', pass: 'patient123' },
            ].map(({ rol, email, pass }) => (
              <div key={rol} className="flex items-center justify-between">
                <span className="text-[12px]" style={{ color: 'var(--apple-text-2)' }}>{rol}</span>
                <span className="text-[12px] font-mono" style={{ color: 'var(--apple-text)' }}>
                  {email} · {pass}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
