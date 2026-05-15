'use client';

import { Sidebar } from './Sidebar';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen" style={{ background: 'var(--apple-bg-2)' }}>
      <Sidebar />
      <main
        className="flex-1 overflow-y-auto"
        style={{ marginLeft: '240px' }}
      >
        <div className="p-8 max-w-[1200px] mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
