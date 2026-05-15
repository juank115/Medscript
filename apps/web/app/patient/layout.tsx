'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    } else if (user.role !== 'PATIENT') {
      router.replace('/login');
    }
  }, [user, router]);

  if (!user || user.role !== 'PATIENT') return null;

  return <DashboardLayout>{children}</DashboardLayout>;
}
