import { Suspense } from 'react';
import { AdminTopBar } from '@/components/layout/AdminTopBar';
import { AdminSettingsView } from '@/components/settings/AdminSettingsView';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const metadata = {
  title: 'Application Settings | Achintya Matrimony CRM',
  description: 'Manage business identity, helpline phone, WhatsApp templates, and regional matchmaking settings.',
};

export default function AdminSettingsPage() {
  return (
    <>
      <AdminTopBar
        title="Application Settings"
        subtitle="Manage business identity, WhatsApp communication templates, and operational preferences"
      />
      <div className="admin-content">
        <Suspense fallback={<LoadingSpinner label="Loading application settings..." />}>
          <AdminSettingsView />
        </Suspense>
      </div>
    </>
  );
}
