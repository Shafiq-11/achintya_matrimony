'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils/formatting';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import type { Member } from '@/lib/types';

interface TrendPoint {
  date: string;
  label: string;
  count: number;
  grooms: number;
  brides: number;
}

interface FollowUpItem {
  id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  notes: string;
  status: string;
  purpose: string;
  member: {
    id: string;
    reg_id: string;
    full_name: string;
    gender: string;
    phone: string;
  } | null;
}

interface MetricsData {
  totalMembers: number;
  matchedCount: number;
  inactiveCount: number;
  activeMembers: number;
  todaysTasks: number;
  overdueTasks: number;
  periodRegistrations: number;
  periodLabel: string;
  period: string;
  startDate: string;
  endDate: string;
  maleCount: number;
  femaleCount: number;
  trend?: TrendPoint[];
  tasks?: FollowUpItem[];
}

type PeriodType = 'today' | 'this_week' | 'this_month' | 'custom';

export function AdminOverviewDashboard() {
  // Admin Profile
  const [adminName, setAdminName] = useState<string | null>(null);

  // Period Filter State
  const [activePeriod, setActivePeriod] = useState<PeriodType>('today');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [dateError, setDateError] = useState<string | null>(null);

  // Dashboard Data State
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch current admin display name
  useEffect(() => {
    async function fetchAdminUser() {
      try {
        const res = await fetch('/api/admin/me');
        if (res.ok) {
          const data = await res.json();
          if (data.displayName && typeof data.displayName === 'string' && data.displayName.trim()) {
            setAdminName(data.displayName.trim());
          } else {
            setAdminName(null);
          }
        }
      } catch {
        setAdminName(null);
      }
    }
    fetchAdminUser();
  }, []);

  // 2. Fetch metrics based on active period filter
  const fetchDashboardData = useCallback(async (period: PeriodType, start?: string, end?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      let metricsUrl = `/api/admin/metrics?period=${period}`;
      if (period === 'custom' && start && end) {
        metricsUrl += `&startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`;
      }

      // Parallel fetch metrics and recent members
      const [metricsRes, membersRes] = await Promise.all([
        fetch(metricsUrl),
        fetch('/api/admin/members?limit=5&sortBy=created_at&sortOrder=desc'),
      ]);

      if (!metricsRes.ok) {
        const errData = await metricsRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to connect to database metrics.');
      }

      const metricsJson = await metricsRes.json();
      if (!metricsJson.success || !metricsJson.metrics) {
        throw new Error(metricsJson.error || 'Invalid metrics returned from server.');
      }
      setMetrics(metricsJson.metrics);

      // Members list
      if (membersRes.ok) {
        const membersJson = await membersRes.json();
        setRecentMembers(membersJson.members || []);
      }
    } catch (err: unknown) {
      console.error('Dashboard fetch error:', err);
      const msg = err instanceof Error ? err.message : 'Database is currently unreachable.';
      setError(msg);
      setMetrics(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    let ignore = false;

    async function loadInitial() {
      try {
        const [metricsRes, membersRes] = await Promise.all([
          fetch('/api/admin/metrics?period=today'),
          fetch('/api/admin/members?limit=5&sortBy=created_at&sortOrder=desc'),
        ]);

        if (ignore) return;

        if (!metricsRes.ok) {
          const errData = await metricsRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to connect to database metrics.');
        }

        const metricsJson = await metricsRes.json();
        if (metricsJson.success && metricsJson.metrics) {
          setMetrics(metricsJson.metrics);
        }

        if (membersRes.ok) {
          const membersJson = await membersRes.json();
          setRecentMembers(membersJson.members || []);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Database is currently unreachable.';
          setError(msg);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadInitial();

    return () => {
      ignore = true;
    };
  }, []);

  // Handle Preset Period Selection
  const handleSelectPeriod = (period: PeriodType) => {
    setDateError(null);
    setActivePeriod(period);
    if (period !== 'custom') {
      fetchDashboardData(period);
    }
  };

  // Handle Custom Date Range Apply
  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) {
      setDateError('Please select both start and end dates.');
      return;
    }
    if (customStart > customEnd) {
      setDateError('Start date cannot be after end date.');
      return;
    }
    setDateError(null);
    setActivePeriod('custom');
    fetchDashboardData('custom', customStart, customEnd);
  };

  // Handle Reset Date Filter
  const handleResetFilter = () => {
    setDateError(null);
    setCustomStart('');
    setCustomEnd('');
    setActivePeriod('today');
    fetchDashboardData('today');
  };

  const currentDateDisplay = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date());

  return (
    <div className="dashboard-container">
      {/* 1. TOP HEADER & VANAKKAM GREETING */}
      <section className="dashboard-hero-header">
        <div className="hero-header-content">
          <div className="hero-text-block">
            <h1 className="hero-greeting-title">
              {adminName ? `வணக்கம், ${adminName}` : 'வணக்கம், Administrator'}
            </h1>
            <p className="hero-greeting-subtitle">
              Achintya Matrimony Matchmaking CRM &amp; Operations Pipeline
            </p>
          </div>

          <div className="hero-badges-row">
            <span className="hero-pill-badge badge-live">
              <span className="live-pulse-dot" /> Live Database Connected
            </span>
            <span className="hero-pill-badge badge-time">
              🕒 IST (UTC+5:30)
            </span>
          </div>
        </div>

        {/* Minimalist Date Range Filter Bar */}
        <div className="hero-filter-bar">
          <div className="filter-bar-label">
            <span className="filter-bar-icon">📅</span>
            <span>Registration Filter:</span>
          </div>

          <div className="filter-segmented-pill-group">
            <button
              type="button"
              className={`filter-pill-btn ${activePeriod === 'today' ? 'active' : ''}`}
              onClick={() => handleSelectPeriod('today')}
            >
              Today
            </button>
            <button
              type="button"
              className={`filter-pill-btn ${activePeriod === 'this_week' ? 'active' : ''}`}
              onClick={() => handleSelectPeriod('this_week')}
            >
              This Week
            </button>
            <button
              type="button"
              className={`filter-pill-btn ${activePeriod === 'this_month' ? 'active' : ''}`}
              onClick={() => handleSelectPeriod('this_month')}
            >
              This Month
            </button>
            <button
              type="button"
              className={`filter-pill-btn ${activePeriod === 'custom' ? 'active' : ''}`}
              onClick={() => handleSelectPeriod('custom')}
            >
              Custom
            </button>
          </div>

          {metrics && (
            <div className="filter-range-caption">
              Showing: <strong>{formatDate(metrics.startDate)}</strong> – <strong>{formatDate(metrics.endDate)}</strong>
            </div>
          )}
        </div>

        {/* Custom Range Accordion */}
        {activePeriod === 'custom' && (
          <form onSubmit={handleApplyCustomRange} className="custom-date-accordion">
            <div className="custom-date-inputs">
              <div className="form-field-inline">
                <label htmlFor="custom-start-date" className="filter-input-label">From:</label>
                <input
                  id="custom-start-date"
                  type="date"
                  className="form-input filter-date-input"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  required
                />
              </div>
              <div className="form-field-inline">
                <label htmlFor="custom-end-date" className="filter-input-label">To:</label>
                <input
                  id="custom-end-date"
                  type="date"
                  className="form-input filter-date-input"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  required
                />
              </div>
              <div className="custom-date-actions">
                <button type="submit" className="btn btn-primary btn-sm">Apply</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={handleResetFilter}>Reset</button>
              </div>
            </div>
            {dateError && <div className="filter-validation-error">⚠️ {dateError}</div>}
          </form>
        )}
      </section>

      {/* Database Error Banner */}
      {error && (
        <div className="alert alert-danger" role="alert" style={{ marginBottom: '1.5rem' }}>
          <strong>⚠️ Database Notice:</strong> {error}
          <div style={{ marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => fetchDashboardData(activePeriod, customStart, customEnd)}
            >
              🔄 Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* 2. STAT CARDS (CLEAN MINIMALIST DESIGN MATCHING REFERENCE UI) */}
      <section className="dashboard-cards-section" aria-label="Key Operational Statistics">
        <div className="summary-cards-grid">
          {/* Card 1: Total Members */}
          <div className="overview-summary-card">
            <div className="card-top-row">
              <span className="card-metric-label">Total Members</span>
              <div className="card-squircle-icon icon-maroon" aria-hidden="true">
                👥
              </div>
            </div>
            <div className="card-metric-number">
              {isLoading ? <span className="metric-skeleton" /> : metrics ? metrics.totalMembers : '—'}
            </div>
            <div className="card-metric-footer">
              <span>👨 {metrics?.maleCount ?? 0} Grooms • 👩 {metrics?.femaleCount ?? 0} Brides</span>
            </div>
            <Link href="/admin/members" className="card-action-link">
              View all members →
            </Link>
          </div>

          {/* Card 2: Matched Users */}
          <div className="overview-summary-card">
            <div className="card-top-row">
              <span className="card-metric-label">Matched Users</span>
              <div className="card-squircle-icon icon-gold" aria-hidden="true">
                💍
              </div>
            </div>
            <div className="card-metric-number">
              {isLoading ? <span className="metric-skeleton" /> : metrics ? metrics.matchedCount : '—'}
            </div>
            <div className="card-metric-footer">
              <span>Profiles successfully matched &amp; settled</span>
            </div>
            <Link href="/admin/members?status=matched" className="card-action-link">
              View matched profiles →
            </Link>
          </div>

          {/* Card 3: Today's Tasks */}
          <div className="overview-summary-card">
            <div className="card-top-row">
              <span className="card-metric-label">Today&apos;s Tasks</span>
              <div className="card-squircle-icon icon-maroon" aria-hidden="true">
                📅
              </div>
            </div>
            <div className="card-metric-number">
              {isLoading ? <span className="metric-skeleton" /> : metrics ? metrics.todaysTasks : '—'}
            </div>
            <div className="card-metric-footer">
              <span>Pending follow-up calls due today</span>
            </div>
            <Link href="/admin/tasks" className="card-action-link">
              Open daily tasks →
            </Link>
          </div>

          {/* Card 4: Registered in Period */}
          <div className="overview-summary-card">
            <div className="card-top-row">
              <span className="card-metric-label">
                {activePeriod === 'today' ? 'Registered Today' : 'Filtered Period'}
              </span>
              <div className="card-squircle-icon icon-beige" aria-hidden="true">
                📝
              </div>
            </div>
            <div className="card-metric-number">
              {isLoading ? <span className="metric-skeleton" /> : metrics ? metrics.periodRegistrations : '—'}
            </div>
            <div className="card-metric-footer">
              <span>{activePeriod === 'today' ? 'Candidate registrations created today' : 'Registrations in selected range'}</span>
            </div>
            <Link href="/admin/members" className="card-action-link">
              Filter in directory →
            </Link>
          </div>

          {/* Card 5: Overdue Tasks */}
          <div className="overview-summary-card">
            <div className="card-top-row">
              <span className="card-metric-label">Overdue Tasks</span>
              <div className="card-squircle-icon icon-maroon" aria-hidden="true">
                ⏰
              </div>
            </div>
            <div className="card-metric-number">
              {isLoading ? <span className="metric-skeleton" /> : metrics ? metrics.overdueTasks : '—'}
            </div>
            <div className="card-metric-footer">
              <span>Pending callbacks prior to today</span>
            </div>
            <Link href="/admin/tasks" className="card-action-link">
              Review overdue tasks →
            </Link>
          </div>
        </div>
      </section>

      {/* 3. CHARTS FOR EASY ANALYSIS (AS REQUESTED) */}
      {metrics && (
        <AnalyticsCharts
          totalMembers={metrics.totalMembers}
          maleCount={metrics.maleCount}
          femaleCount={metrics.femaleCount}
          matchedCount={metrics.matchedCount}
          activeCount={metrics.activeMembers}
          inactiveCount={metrics.inactiveCount}
          trend={metrics.trend}
        />
      )}

      {/* 4. TWO-COLUMN OPERATIONAL DASHBOARD (MATCHING REFERENCE UI) */}
      <section className="overview-columns-section">
        <div className="overview-columns-grid">
          {/* Left Column: Recent Member Registrations */}
          <div className="overview-card-container">
            <div className="overview-card-header">
              <div>
                <h2 className="overview-card-title">Recent Registrations</h2>
                <p className="overview-card-subtitle">
                  Latest candidate profile submissions from live database
                </p>
              </div>
              <Link href="/admin/members" className="overview-view-all-btn">
                View all →
              </Link>
            </div>

            <div className="overview-card-content">
              {isLoading ? (
                <div className="card-loading-box">
                  <div className="spinner" />
                  <p>Loading member applications...</p>
                </div>
              ) : recentMembers.length > 0 ? (
                <div className="candidate-list">
                  {recentMembers.map((member) => (
                    <div key={member.id} className="candidate-item-row">
                      <div className="candidate-avatar-circle">
                        {member.gender === 'Female' ? '👩' : '👨'}
                      </div>

                      <div className="candidate-info-cell">
                        <Link href={`/admin/members/${member.id}`} className="candidate-name-link">
                          {member.full_name}
                        </Link>
                        <div className="candidate-sub-details">
                          <span className="candidate-reg-tag">{member.reg_id}</span>
                          <span>•</span>
                          <span>{member.gender === 'Female' ? 'Bride' : 'Groom'}</span>
                          {member.kulam && <span>• {member.kulam}</span>}
                          {member.location_city && <span>• {member.location_city}</span>}
                        </div>
                      </div>

                      <div className="candidate-status-cell">
                        <span className={`status-pill ${member.profile_status === 'matched' ? 'pill-matched' : 'pill-active'}`}>
                          {member.profile_status === 'matched' ? '💍 Matched' : member.profile_status || 'Active'}
                        </span>
                        <span className="candidate-date-text">
                          {formatDate(member.created_at)}
                        </span>
                      </div>

                      <div className="candidate-action-buttons">
                        <Link
                          href={`/admin/members/${member.id}`}
                          className="btn-icon-round"
                          title="View Profile Details"
                        >
                          👁️
                        </Link>
                        {member.phone && (
                          <a
                            href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-icon-round icon-wa"
                            title="Chat on WhatsApp"
                          >
                            💬
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state-box">
                  <div className="empty-state-icon">📭</div>
                  <h4 className="empty-state-title">No Profiles Found</h4>
                  <p className="empty-state-desc">New member submissions will automatically appear here.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Today's Follow-up Agenda (Matching Right Schedule Card in Reference) */}
          <div className="overview-card-container">
            <div className="overview-card-header">
              <div>
                <h2 className="overview-card-title">
                  Today, {currentDateDisplay}
                </h2>
                <p className="overview-card-subtitle">
                  Operational matchmaking follow-ups &amp; agenda
                </p>
              </div>
              <div className="calendar-nav-controls">
                <span className="cal-dot" />
                <span className="cal-today-badge">Active Day</span>
              </div>
            </div>

            <div className="overview-card-content">
              {metrics?.tasks && metrics.tasks.length > 0 ? (
                <div className="agenda-stack">
                  {metrics.tasks.map((task, idx) => {
                    const isUrgent = idx === 0; // Prominently highlight top item in Royal Maroon (like Geometry card in reference!)
                    return (
                      <div
                        key={task.id}
                        className={`agenda-item-card ${isUrgent ? 'agenda-card-highlight' : 'agenda-card-standard'}`}
                      >
                        <div className="agenda-item-header">
                          <span className="agenda-item-title">
                            {task.purpose || 'Follow-up Consultation'}
                          </span>
                          <span className="agenda-item-id">
                            {task.member?.reg_id || 'AM-Task'}
                          </span>
                        </div>

                        <div className="agenda-item-meta">
                          <span>🕒 {task.scheduled_time || '10:00 am'} IST</span>
                          {task.member?.full_name && <span>• {task.member.full_name}</span>}
                        </div>

                        {task.notes && (
                          <div className="agenda-item-notes">
                            &ldquo;{task.notes}&rdquo;
                          </div>
                        )}

                        <div className="agenda-item-footer">
                          {task.member?.phone && (
                            <a
                              href={`tel:${task.member.phone.replace(/[^0-9+]/g, '')}`}
                              className={`agenda-link ${isUrgent ? 'link-light' : 'link-maroon'}`}
                            >
                              📞 Call Candidate
                            </a>
                          )}
                          <Link
                            href="/admin/tasks"
                            className={`agenda-link ${isUrgent ? 'link-light' : 'link-maroon'}`}
                          >
                            Task Details →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="agenda-cleared-box">
                  <div className="cleared-icon">✨</div>
                  <h4 className="cleared-title">All Follow-ups Cleared</h4>
                  <p className="cleared-desc">
                    There are no pending tasks scheduled for today. Great work!
                  </p>
                  <Link href="/admin/tasks" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>
                    + Schedule New Follow-up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. QUICK SHORTCUTS ROW */}
      <section className="dashboard-quick-shortcuts" aria-label="Quick Navigation">
        <div className="shortcuts-bar">
          <Link href="/admin/members" className="shortcut-pill">
            <span>👥</span> All Members Directory
          </Link>
          <Link href="/admin/tasks" className="shortcut-pill">
            <span>📅</span> Daily Tasks Pipeline
          </Link>
          <Link href="/admin/settings" className="shortcut-pill">
            <span>⚙️</span> CRM Settings
          </Link>
          <Link href="/register" target="_blank" className="shortcut-pill">
            <span>📝</span> Registration Portal ↗
          </Link>
        </div>
      </section>
    </div>
  );
}
