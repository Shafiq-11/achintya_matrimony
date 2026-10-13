import { Suspense } from 'react';
import { AdminTopBar } from '@/components/layout/AdminTopBar';
import { MemberListTable } from '@/components/members/MemberListTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const metadata = {
  title: 'All Members Directory | Achintya Matrimony CRM',
  description: 'Search, filter, sort, and manage candidate matrimonial profiles.',
};

export default function AdminMembersPage() {
  return (
    <>
      <AdminTopBar
        title="Member Directory"
        subtitle="Search, filter, and manage candidate records with quick WhatsApp & follow-up actions"
      />
      <div className="admin-content">
        <Suspense fallback={<LoadingSpinner label="Loading member directory..." />}>
          <MemberListTable />
        </Suspense>
      </div>
    </>
  );
}
