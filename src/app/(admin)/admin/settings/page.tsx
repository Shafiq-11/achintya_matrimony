import { AdminTopBar } from '@/components/layout/AdminTopBar';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminSettingsPlaceholderPage() {
  return (
    <>
      <AdminTopBar
        title="Application Settings"
        subtitle="Manage business phone, WhatsApp templates, and operational preferences"
      />
      <div className="admin-content">
        <EmptyState
          icon="⚙️"
          title="CRM Settings Module"
          description="Business details, editable WhatsApp message templates, and registration link configurations will be connected in Phase 04."
        />
      </div>
    </>
  );
}
