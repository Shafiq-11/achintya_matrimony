import { Suspense } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-shell">
      <Suspense fallback={<aside className="admin-sidebar" style={{ width: '260px', background: '#1e1b1a' }} />}>
        <AdminSidebar />
      </Suspense>
      <div className="admin-main">
        {children}
      </div>
    </div>
  );
}
