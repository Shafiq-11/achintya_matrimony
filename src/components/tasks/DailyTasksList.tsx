'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate, buildWhatsAppLink, formatDisplayPhone } from '@/lib/utils/formatting';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import type { FollowUpTask } from '@/lib/types';

function getTodayDateString(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export function DailyTasksList() {
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'overdue' | 'upcoming' | 'all' | 'completed'>('today');

  const todayStr = getTodayDateString();

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const response = await fetch('/api/admin/follow-ups?status=all');
        const data = await response.json();

        if (ignore) return;
        if (!response.ok) {
          setErrorMessage(data.error || 'Failed to retrieve daily tasks.');
        } else {
          setTasks(data.tasks || []);
        }
      } catch {
        if (!ignore) {
          setErrorMessage('Network error occurred while fetching tasks.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleUpdateStatus = async (taskId: string, newStatus: 'completed' | 'cancelled') => {
    try {
      const response = await fetch(`/api/admin/follow-ups/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (response.ok && data.task) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, ...data.task } : t))
        );
      } else {
        alert(data.error || 'Failed to update task.');
      }
    } catch {
      alert('Network error while updating task.');
    }
  };

  // Group tasks
  const overdueTasks = tasks.filter(
    (t) => t.status === 'pending' && t.scheduled_date < todayStr
  );
  const dueTodayTasks = tasks.filter(
    (t) => t.status === 'pending' && t.scheduled_date === todayStr
  );
  const upcomingTasks = tasks.filter(
    (t) => t.status === 'pending' && t.scheduled_date > todayStr
  );
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  let displayedTasks: FollowUpTask[] = [];
  if (activeTab === 'today') displayedTasks = dueTodayTasks;
  else if (activeTab === 'overdue') displayedTasks = overdueTasks;
  else if (activeTab === 'upcoming') displayedTasks = upcomingTasks;
  else if (activeTab === 'completed') displayedTasks = completedTasks;
  else displayedTasks = tasks.filter((t) => t.status === 'pending');

  return (
    <div>
      {/* Metrics Summary Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          className="card"
          onClick={() => setActiveTab('today')}
          style={{
            cursor: 'pointer',
            borderBottom: activeTab === 'today' ? '3px solid var(--color-gold)' : undefined,
            backgroundColor: activeTab === 'today' ? 'var(--color-gold-light)' : undefined,
          }}
        >
          <div className="card-body" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              🔔 Due Today
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-gold)' }}>
              {dueTodayTasks.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Scheduled for today</div>
          </div>
        </div>

        <div
          className="card"
          onClick={() => setActiveTab('overdue')}
          style={{
            cursor: 'pointer',
            borderBottom: activeTab === 'overdue' ? '3px solid var(--color-danger)' : undefined,
            backgroundColor: activeTab === 'overdue' ? 'var(--color-danger-bg)' : undefined,
          }}
        >
          <div className="card-body" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              ⚠️ Overdue
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-danger)' }}>
              {overdueTasks.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Missed earlier callbacks</div>
          </div>
        </div>

        <div
          className="card"
          onClick={() => setActiveTab('upcoming')}
          style={{
            cursor: 'pointer',
            borderBottom: activeTab === 'upcoming' ? '3px solid var(--color-primary)' : undefined,
            backgroundColor: activeTab === 'upcoming' ? 'var(--color-primary-light)' : undefined,
          }}
        >
          <div className="card-body" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              📅 Upcoming
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              {upcomingTasks.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Future scheduled tasks</div>
          </div>
        </div>

        <div
          className="card"
          onClick={() => setActiveTab('completed')}
          style={{
            cursor: 'pointer',
            borderBottom: activeTab === 'completed' ? '3px solid var(--color-success)' : undefined,
            backgroundColor: activeTab === 'completed' ? 'var(--color-success-bg)' : undefined,
          }}
        >
          <div className="card-body" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              ✓ Completed
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-success)' }}>
              {completedTasks.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Resolved callbacks</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.25rem',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('today')}
          className={`btn btn-sm ${activeTab === 'today' ? 'btn-primary' : 'btn-outline'}`}
        >
          Due Today ({dueTodayTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('overdue')}
          className={`btn btn-sm ${activeTab === 'overdue' ? 'btn-primary' : 'btn-outline'}`}
        >
          Overdue ({overdueTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`btn btn-sm ${activeTab === 'upcoming' ? 'btn-primary' : 'btn-outline'}`}
        >
          Upcoming ({upcomingTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-outline'}`}
        >
          All Active Pending ({dueTodayTasks.length + overdueTasks.length + upcomingTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`btn btn-sm ${activeTab === 'completed' ? 'btn-primary' : 'btn-outline'}`}
        >
          Completed History ({completedTasks.length})
        </button>
      </div>

      {/* Task Cards List */}
      {isLoading ? (
        <LoadingSpinner label="Loading daily tasks..." />
      ) : errorMessage ? (
        <div className="alert alert-danger">{errorMessage}</div>
      ) : displayedTasks.length === 0 ? (
        <EmptyState
          icon="📅"
          title={
            activeTab === 'today'
              ? 'No Follow-ups Due Today'
              : activeTab === 'overdue'
              ? 'Great Job! No Overdue Tasks'
              : 'No Tasks Found in this Category'
          }
          description="When you schedule follow-up callbacks on member profile pages, they automatically appear here on their scheduled date."
          action={
            <Link href="/admin/members" className="btn btn-primary btn-sm">
              Go to Member Directory
            </Link>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {displayedTasks.map((task) => {
            const isOverdue = task.status === 'pending' && task.scheduled_date < todayStr;
            const isToday = task.status === 'pending' && task.scheduled_date === todayStr;
            const memberInfo = task.member;
            const whatsAppUrl = memberInfo?.phone
              ? buildWhatsAppLink(
                  memberInfo.phone,
                  `Namaste ${memberInfo.full_name}, this is Achintya Matrimony regarding your profile (${memberInfo.reg_id}).`
                )
              : '#';

            return (
              <div
                key={task.id}
                className="card"
                style={{
                  borderLeft: isOverdue
                    ? '4px solid var(--color-danger)'
                    : isToday
                    ? '4px solid var(--color-warning)'
                    : task.status === 'completed'
                    ? '4px solid var(--color-success)'
                    : '4px solid var(--color-primary)',
                }}
              >
                <div className="card-body">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    {/* Left: Member & Task Details */}
                    <div style={{ flex: '1 1 300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
                        {memberInfo ? (
                          <Link
                            href={`/admin/members/${memberInfo.id}`}
                            style={{
                              fontSize: '1.125rem',
                              fontWeight: 700,
                              color: 'var(--color-primary)',
                              textDecoration: 'none',
                            }}
                          >
                            {memberInfo.full_name}
                          </Link>
                        ) : (
                          <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                            Member ID: {task.member_id}
                          </span>
                        )}

                        {memberInfo && (
                          <span
                            style={{
                              fontSize: '0.8125rem',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              backgroundColor: 'var(--color-surface-alt)',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            {memberInfo.reg_id}
                          </span>
                        )}

                        <span
                          className={`badge ${
                            isOverdue
                              ? 'badge-danger'
                              : isToday
                              ? 'badge-warning'
                              : task.status === 'completed'
                              ? 'badge-active'
                              : 'badge-new'
                          }`}
                        >
                          {isOverdue ? '⚠️ OVERDUE' : isToday ? '🔔 DUE TODAY' : task.status.toUpperCase()}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-main)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                        {task.reason}
                      </p>

                      <div
                        style={{
                          fontSize: '0.8125rem',
                          color: 'var(--color-text-muted)',
                          display: 'flex',
                          gap: '1rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>
                          📅 <strong>Scheduled:</strong> {formatDate(task.scheduled_date)}{' '}
                          {task.scheduled_time ? `at ${task.scheduled_time.slice(0, 5)}` : ''}
                        </span>
                        {memberInfo?.phone && (
                          <span>
                            📞 <strong>Phone:</strong> {formatDisplayPhone(memberInfo.phone)}
                          </span>
                        )}
                        <span>👤 {task.author_email || 'Administrator'}</span>
                      </div>
                    </div>

                    {/* Right: Quick Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {memberInfo?.phone && (
                        <>
                          <a
                            href={whatsAppUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-green btn-sm"
                            title="Chat on WhatsApp"
                          >
                            💬 WhatsApp
                          </a>

                          <a
                            href={`tel:${memberInfo.phone.replace(/[^0-9+]/g, '')}`}
                            className="btn btn-outline btn-sm"
                            title="Call Phone"
                          >
                            📞 Call
                          </a>
                        </>
                      )}

                      {memberInfo && (
                        <Link
                          href={`/admin/members/${memberInfo.id}`}
                          className="btn btn-outline btn-sm"
                        >
                          View Profile
                        </Link>
                      )}

                      {task.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(task.id, 'completed')}
                            className="btn btn-green btn-sm"
                          >
                            ✓ Done
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(task.id, 'cancelled')}
                            className="btn btn-secondary btn-sm"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
