'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const iconClipboard = (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const iconChart = (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const iconPlus = (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
  </svg>
);

const navByRole: Record<string, NavItem[]> = {
  DOCTOR: [
    { href: '/doctor/prescriptions', label: 'Mis Prescripciones', icon: iconClipboard },
    { href: '/doctor/prescriptions/new', label: 'Nueva Prescripción', icon: iconPlus },
  ],
  PATIENT: [
    { href: '/patient/prescriptions', label: 'Mis Prescripciones', icon: iconClipboard },
  ],
  ADMIN: [
    { href: '/admin', label: 'Dashboard', icon: iconChart },
    { href: '/admin/prescriptions', label: 'Prescripciones', icon: iconClipboard },
  ],
};

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  DOCTOR: 'Médico',
  PATIENT: 'Paciente',
};

const roleColors: Record<string, string> = {
  ADMIN: 'rgba(255,149,0,0.12)',
  DOCTOR: 'rgba(0,113,227,0.10)',
  PATIENT: 'rgba(52,199,89,0.12)',
};

const roleTextColors: Record<string, string> = {
  ADMIN: 'var(--apple-orange)',
  DOCTOR: 'var(--apple-blue)',
  PATIENT: 'var(--apple-green)',
};

function getInitials(name: string = '') {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const navItems = navByRole[user?.role || ''] || [];

  const handleLogout = () => {
    logout();
    document.cookie = 'auth-role=; path=/; max-age=0';
    toast.success('Sesión cerrada');
    router.push('/login');
  };

  return (
    <aside
      className="fixed inset-y-0 left-0 w-[240px] flex flex-col z-20"
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRight: '1px solid var(--apple-border)',
      }}
    >
      {/* Logo */}
      <div className="h-[60px] flex items-center px-5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 flex items-center justify-center shrink-0"
            style={{
              background: 'var(--apple-blue)',
              borderRadius: '9px',
              boxShadow: '0 2px 8px rgba(0,113,227,0.28)',
            }}
          >
            <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span
            className="text-[15px] font-semibold tracking-tight"
            style={{ color: 'var(--apple-text)', letterSpacing: '-0.01em' }}
          >
            MedScript
          </span>
        </div>
      </div>

      {/* User card */}
      <div className="px-3 mb-2">
        <div
          className="px-3 py-3 rounded-[14px]"
          style={{ background: 'var(--apple-bg-2)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0"
              style={{
                background: roleColors[user?.role || ''] || 'var(--apple-bg-3)',
                color: roleTextColors[user?.role || ''] || 'var(--apple-text-2)',
              }}
            >
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <p
                className="text-[13px] font-semibold truncate leading-tight"
                style={{ color: 'var(--apple-text)' }}
              >
                {user?.name}
              </p>
              <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--apple-text-2)' }}>
                {user?.email}
              </p>
            </div>
          </div>
          <div className="mt-2.5">
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: roleColors[user?.role || ''] || 'var(--apple-bg-3)',
                color: roleTextColors[user?.role || ''] || 'var(--apple-text-2)',
              }}
            >
              {roleLabels[user?.role || ''] || user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[14px] font-medium transition-all duration-150"
              style={{
                background: active ? 'var(--apple-blue)' : 'transparent',
                color: active ? '#ffffff' : 'var(--apple-text-2)',
                minHeight: '44px',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--apple-bg-2)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--apple-text)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--apple-text-2)';
                }
              }}
            >
              <span style={{ opacity: active ? 1 : 0.7 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--apple-border-2)' }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[12px] text-[14px] font-medium transition-all duration-150"
          style={{
            color: 'var(--apple-text-2)',
            minHeight: '44px',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,59,48,0.08)';
            (e.currentTarget as HTMLElement).style.color = 'var(--apple-red)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--apple-text-2)';
          }}
        >
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
