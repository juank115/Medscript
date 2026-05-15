'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    } else {
      const routes: Record<string, string> = {
        ADMIN: '/admin',
        DOCTOR: '/doctor/prescriptions',
        PATIENT: '/patient/prescriptions',
      };
      router.replace(routes[user.role] || '/login');
    }
  }, [user, router]);

  return null;
}
