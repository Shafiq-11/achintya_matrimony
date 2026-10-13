import { AdminTopBar } from '@/components/layout/AdminTopBar';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminMembersPlaceholderPage() {
  return (
    <>
      <AdminTopBar
        title="All Members"
        subtitle="Search, filter, and manage matrimony member records"
      />
      <div className="admin-content">
        <EmptyState
          icon="👥"
          title="Member Directory Module"
          description="Full searchable member table, status filters, date sorting, profile viewing, editing, notes, follow-up scheduling, and Excel export will be integrated in Phase 04 and Phase 05."
        />
      </div>
    </>
  );
}
