import { Suspense } from 'react';
import { AdminTopBar } from '@/components/layout/AdminTopBar';
import { AdminOverviewDashboard } from '@/components/dashboard/AdminOverviewDashboard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const metadata = {
  title: 'Overview Dashboard | Achintya Matrimony CRM',
  description: 'Authoritative operational dashboard and member pipeline for Achintya Matrimony.',
};

export default function AdminOverviewPage() {
  return (
    <>
      <AdminTopBar
        title="Overview"
        subtitle="Achintya Matrimony Matchmaking Administration & Operations"
      />
      <div className="admin-content">
        <Suspense fallback={<LoadingSpinner label="Loading Achintya Matrimony dashboard..." />}>
          <AdminOverviewDashboard />
        </Suspense>
      </div>
    </>
  );
}
