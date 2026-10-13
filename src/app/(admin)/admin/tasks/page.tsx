import { AdminTopBar } from '@/components/layout/AdminTopBar';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminTasksPlaceholderPage() {
  return (
    <>
      <AdminTopBar
        title="Daily Tasks & Follow-ups"
        subtitle="Pending callback calls grouped by overdue, due today, and upcoming"
      />
      <div className="admin-content">
        <EmptyState
          icon="📅"
          title="Daily Task Pipeline Module"
          description="Pending callbacks grouped into Overdue, Due Today, and Upcoming, complete with quick WhatsApp click-to-chat and status resolution, will be connected in Phase 07."
        />
      </div>
    </>
  );
}
