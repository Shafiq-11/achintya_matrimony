import { AdminTopBar } from '@/components/layout/AdminTopBar';
import Link from 'next/link';

export default function AdminOverviewPage() {
  return (
    <>
      <AdminTopBar
        title="CRM Overview"
        subtitle="Operational metrics and quick actions for Achintya Matrimony"
      />
      <div className="admin-content">
        {/* Foundation Notice */}
        <div className="alert alert-info" style={{ marginBottom: '1.75rem' }}>
          <div>
            <strong>Phase 01 Foundation Ready:</strong> Real-time database metrics, member queries, and live follow-up counts will be connected in Phase 03 and Phase 04 once administrator authentication is configured.
          </div>
        </div>

        {/* Metric Cards Shell */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Total Members</div>
            <div className="metric-value">—</div>
            <div className="metric-subtext">Awaiting Phase 04 DB Connection</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Calls Due Today</div>
            <div className="metric-value" style={{ color: 'var(--color-warning)' }}>—</div>
            <div className="metric-subtext">Follow-ups scheduled for today</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Overdue Calls</div>
            <div className="metric-value" style={{ color: 'var(--color-danger)' }}>—</div>
            <div className="metric-subtext">Past-due callbacks needing action</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">New Registrations</div>
            <div className="metric-value" style={{ color: 'var(--color-primary)' }}>—</div>
            <div className="metric-subtext">Recent unreviewed submissions</div>
          </div>
        </div>

        {/* Quick Nav Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">👥 Member Management</h3>
            </div>
            <div className="card-body">
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Search, filter by gender/status, record conversation notes, schedule callbacks, and export records to Excel.
              </p>
              <Link href="/admin/members" className="btn btn-outline btn-sm">
                Go to Member Directory →
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📅 Daily Task Pipeline</h3>
            </div>
            <div className="card-body">
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                View overdue calls, due today, and upcoming callbacks with 1-click WhatsApp message triggers.
              </p>
              <Link href="/admin/tasks" className="btn btn-outline btn-sm">
                Open Daily Tasks →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
