import { Suspense } from 'react';
import { AdminTopBar } from '@/components/layout/AdminTopBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { formatDate } from '@/lib/utils/formatting';
import { devSampleMembers } from '@/lib/data/devSamples';
import type { DashboardMetrics, Member } from '@/lib/types';

async function getDashboardData(): Promise<{ metrics: DashboardMetrics; recentMembers: Member[]; isLive: boolean }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/admin/metrics`, { cache: 'no-store' });
    const membersRes = await fetch(`${baseUrl}/api/admin/members?sortBy=created_at&sortOrder=desc`, { cache: 'no-store' });

    if (!res.ok || !membersRes.ok) throw new Error('API fetch error');

    const metricsData = await res.json();
    const membersData = await membersRes.json();

    return {
      metrics: metricsData.metrics,
      recentMembers: (membersData.members || []).slice(0, 5),
      isLive: !!metricsData.isLive,
    };
  } catch {
    // Graceful fallback for build-time or dev evaluation
    return {
      metrics: {
        totalMembers: devSampleMembers.length,
        maleCount: devSampleMembers.filter((m) => m.gender === 'Male').length,
        femaleCount: devSampleMembers.filter((m) => m.gender === 'Female').length,
        newRegistrations: devSampleMembers.filter((m) => m.profile_status === 'new').length,
        callsDueToday: 1,
        callsOverdue: 0,
        callsUpcoming: 2,
      },
      recentMembers: devSampleMembers.slice(0, 5) as Member[],
      isLive: false,
    };
  }
}

async function DashboardOverviewContent() {
  const { metrics, recentMembers, isLive } = await getDashboardData();

  return (
    <>
      {/* Status Notification */}
      <div className={`alert ${isLive ? 'alert-success' : 'alert-info'}`} style={{ marginBottom: '1.75rem' }}>
        <div>
          <strong>{isLive ? '🟢 Connected to Live Database:' : 'ℹ️ Development Preview Mode:'}</strong>{' '}
          {isLive
            ? 'Metrics are computed directly from active PostgreSQL records.'
            : 'Displaying local workspace data. Live Supabase database queries will activate once .env.local credentials are provided.'}
        </div>
      </div>

      {/* Operational Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Members</div>
          <div className="metric-value">{metrics.totalMembers}</div>
          <div className="metric-subtext">
            👨 {metrics.maleCount} Grooms • 👩 {metrics.femaleCount} Brides
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">New Registrations</div>
          <div className="metric-value" style={{ color: 'var(--color-primary)' }}>
            {metrics.newRegistrations}
          </div>
          <div className="metric-subtext">Awaiting counselor review</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Calls Due Today</div>
          <div className="metric-value" style={{ color: 'var(--color-warning)' }}>
            {metrics.callsDueToday}
          </div>
          <div className="metric-subtext">Follow-ups scheduled for today</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Overdue Calls</div>
          <div className="metric-value" style={{ color: 'var(--color-danger)' }}>
            {metrics.callsOverdue}
          </div>
          <div className="metric-subtext">Requiring immediate contact</div>
        </div>
      </div>

      {/* Quick Nav & Follow-up Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">⚡ Quick Management</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link href="/admin/members" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                👥 View All Members Directory ({metrics.totalMembers})
              </Link>
              <Link href="/admin/tasks" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                📅 Manage Daily Tasks & Callbacks ({metrics.callsDueToday} due)
              </Link>
              <Link href="/register" target="_blank" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                📝 Open Public Registration Form
              </Link>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📞 Follow-up Pipeline Summary</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Overdue Callbacks</span>
                <span className={`badge ${metrics.callsOverdue > 0 ? 'badge-overdue' : 'badge-muted'}`}>
                  {metrics.callsOverdue}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Scheduled For Today</span>
                <span className={`badge ${metrics.callsDueToday > 0 ? 'badge-pending' : 'badge-muted'}`}>
                  {metrics.callsDueToday}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Upcoming Callbacks</span>
                <span className="badge badge-muted">
                  {metrics.callsUpcoming}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Registrations Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Submissions</h3>
          <Link href="/admin/members" className="btn btn-outline btn-sm">
            View All →
          </Link>
        </div>
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-alt)' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Reg ID</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Gender</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Location</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Registered</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentMembers.map((member) => (
                <tr key={member.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {member.reg_id}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                    {member.full_name}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>{member.gender}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>{member.location_city}, {member.location_state}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span className={`badge badge-${member.profile_status}`}>
                      {member.profile_status}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-muted)' }}>
                    {formatDate(member.created_at)}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                    <Link href={`/admin/members/${member.id}`} className="btn btn-outline btn-sm">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
              {recentMembers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No member records registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function AdminOverviewPage() {
  return (
    <>
      <AdminTopBar
        title="CRM Overview"
        subtitle="Operational metrics and member pipeline for Achintya Matrimony"
      />
      <div className="admin-content">
        <Suspense fallback={<LoadingSpinner label="Loading CRM dashboard metrics..." />}>
          <DashboardOverviewContent />
        </Suspense>
      </div>
    </>
  );
}
