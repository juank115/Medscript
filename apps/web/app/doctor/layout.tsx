'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    } else if (user.role !== 'DOCTOR') {
      router.replace('/login');
    }
  }, [user, router]);

  if (!user || user.role !== 'DOCTOR') return null;

  return <DashboardLayout>{children}</DashboardLayout>;
}
