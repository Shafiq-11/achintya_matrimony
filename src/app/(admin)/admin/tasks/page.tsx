import { Suspense } from 'react';
import { AdminTopBar } from '@/components/layout/AdminTopBar';
import { DailyTasksList } from '@/components/tasks/DailyTasksList';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const metadata = {
  title: 'Daily Tasks & Follow-ups | Achintya Matrimony CRM',
  description: 'Manage scheduled callbacks, follow-ups, and urgent tasks.',
};

export default function AdminTasksPage() {
  return (
    <>
      <AdminTopBar
        title="Daily Tasks & Follow-ups"
        subtitle="Pending callbacks and scheduled follow-ups grouped by Overdue, Due Today, and Upcoming"
      />
      <div className="admin-content">
        <Suspense fallback={<LoadingSpinner label="Loading daily task pipeline..." />}>
          <DailyTasksList />
        </Suspense>
      </div>
    </>
  );
}
