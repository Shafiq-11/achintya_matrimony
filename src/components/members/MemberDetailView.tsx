'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDate, calculateAge, buildWhatsAppLink, formatDisplayPhone } from '@/lib/utils/formatting';
import type { Member, Note, FollowUpTask, ProfileStatus } from '@/lib/types';

interface MemberDetailViewProps {
  initialMember: Member;
  initialNotes: Note[];
  initialFollowUps: FollowUpTask[];
}

const STATUS_OPTIONS: ProfileStatus[] = [
  'new',
  'active',
  'contacted',
  'shortlisted',
  'matched',
  'inactive',
  'archived',
];

export function MemberDetailView({
  initialMember,
  initialNotes,
  initialFollowUps,
}: MemberDetailViewProps) {
  const router = useRouter();
  const [member, setMember] = useState<Member>(initialMember);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [followUps, setFollowUps] = useState<FollowUpTask[]>(initialFollowUps);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form edit state
  const [editForm, setEditForm] = useState({
    profile_status: member.profile_status,
    phone: member.phone,
    email: member.email || '',
    location_city: member.location_city,
    location_state: member.location_state,
    education: member.education,
    occupation: member.occupation || '',
    annual_income: member.annual_income || '',
    about_me: member.about_me || '',
    partner_preferences: member.partner_preferences || '',
  });

  // Note creation state
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Follow-up scheduling state
  const [isSchedulingTask, setIsSchedulingTask] = useState(false);
  const [taskDate, setTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskTime, setTaskTime] = useState('11:00');
  const [taskReason, setTaskReason] = useState('');
  const [isSavingTask, setIsSavingTask] = useState(false);

  const age = calculateAge(member.dob);
  const whatsAppUrl = buildWhatsAppLink(
    member.phone,
    `Namaste ${member.full_name}, this is Achintya Matrimony regarding your profile (ID: ${member.reg_id}). We would like to connect with you regarding matrimonial proposals.`
  );

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const response = await fetch(`/api/admin/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to update member profile.');
        setIsSaving(false);
        return;
      }

      setMember(data.member);
      setIsEditing(false);
      setSaveSuccess(true);
      router.refresh();
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch {
      setErrorMessage('Network error occurred while saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setIsSavingNote(true);
    try {
      const response = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          content: noteContent.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok && data.note) {
        setNotes((prev) => [data.note, ...prev]);
        setNoteContent('');
        setIsAddingNote(false);
        router.refresh();
      } else {
        alert(data.error || 'Failed to record note.');
      }
    } catch {
      alert('Network error while saving note.');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskDate || !taskReason.trim()) return;

    setIsSavingTask(true);
    try {
      const response = await fetch('/api/admin/follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          scheduledDate: taskDate,
          scheduledTime: taskTime ? `${taskTime}:00` : null,
          reason: taskReason.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok && data.task) {
        setFollowUps((prev) => [...prev, data.task]);
        setTaskReason('');
        setIsSchedulingTask(false);
        router.refresh();
      } else {
        alert(data.error || 'Failed to schedule callback.');
      }
    } catch {
      alert('Network error while scheduling callback.');
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: 'completed' | 'cancelled') => {
    try {
      const response = await fetch(`/api/admin/follow-ups/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (response.ok && data.task) {
        setFollowUps((prev) =>
          prev.map((t) => (t.id === taskId ? data.task : t))
        );
        router.refresh();
      }
    } catch {
      alert('Failed to update task status.');
    }
  };

  return (
    <div>
      {/* Top action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Link href="/admin/members" className="btn btn-outline btn-sm">
          ← Back to Member Directory
        </Link>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm"
            style={{ borderColor: '#25D366', color: '#128C7E', fontWeight: 600 }}
          >
            💬 Open WhatsApp
          </a>

          <a
            href={`tel:${member.phone.replace(/[^0-9+]/g, '')}`}
            className="btn btn-gold btn-sm"
          >
            📞 Call Member
          </a>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'} btn-sm`}
          >
            {isEditing ? 'Cancel Edit' : '✏️ Edit Profile'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          ✓ Profile updated successfully.
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                  }}
                >
                  {member.full_name}
                </span>
                <span className={`badge badge-${member.profile_status}`}>
                  {member.profile_status}
                </span>
              </div>

              <div style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                <span><strong>ID:</strong> {member.reg_id}</span>
                <span><strong>Gender:</strong> {member.gender}</span>
                <span><strong>Age:</strong> {age ? `${age} yrs` : '—'}</span>
                <span><strong>Location:</strong> {member.location_city}, {member.location_state}</span>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.8125rem', color: 'var(--color-text-light)' }}>
              <div>Registered: {formatDate(member.created_at)}</div>
              <div>Source: <span style={{ textTransform: 'capitalize' }}>{member.registration_source.replace('_', ' ')}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form OR View Grid */}
      {isEditing ? (
        <form onSubmit={handleSave} className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 className="card-title">Edit Member Profile Details</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Profile Status</label>
                <select
                  name="profile_status"
                  className="form-select"
                  value={editForm.profile_status}
                  onChange={handleEditChange}
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input
                  name="phone"
                  type="text"
                  className="form-input"
                  value={editForm.phone}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  name="email"
                  type="email"
                  className="form-input"
                  value={editForm.email}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">City / Location</label>
                <input
                  name="location_city"
                  type="text"
                  className="form-input"
                  value={editForm.location_city}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  name="location_state"
                  type="text"
                  className="form-input"
                  value={editForm.location_state}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Highest Education</label>
                <input
                  name="education"
                  type="text"
                  className="form-input"
                  value={editForm.education}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Occupation</label>
                <input
                  name="occupation"
                  type="text"
                  className="form-input"
                  value={editForm.occupation}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Annual Income</label>
                <input
                  name="annual_income"
                  type="text"
                  className="form-input"
                  value={editForm.annual_income}
                  onChange={handleEditChange}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label className="form-label">About Candidate & Family</label>
              <textarea
                name="about_me"
                rows={3}
                className="form-textarea"
                value={editForm.about_me}
                onChange={handleEditChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Partner Preferences</label>
              <textarea
                name="partner_preferences"
                rows={3}
                className="form-textarea"
                value={editForm.partner_preferences}
                onChange={handleEditChange}
              />
            </div>
          </div>
          <div className="card-footer" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn btn-secondary btn-sm"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={isSaving}
            >
              {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Details Column 1: Contact & Social */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Contact & Community Details</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9375rem' }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', display: 'block' }}>Mobile / WhatsApp</span>
                <span style={{ fontWeight: 600 }}>{formatDisplayPhone(member.phone)}</span>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', display: 'block' }}>Email Address</span>
                <span>{member.email || '—'}</span>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', display: 'block' }}>Date of Birth</span>
                <span>{formatDate(member.dob)} ({age} years old)</span>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', display: 'block' }}>Height</span>
                <span>{member.height_cm ? `${member.height_cm} cm` : '—'}</span>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', display: 'block' }}>Marital Status</span>
                <span>{member.marital_status}</span>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', display: 'block' }}>Religion & Caste</span>
                <span>{member.religion || '—'} {member.caste ? `• ${member.caste}` : ''}</span>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', display: 'block' }}>Mother Tongue</span>
                <span>{member.mother_tongue || '—'}</span>
              </div>
            </div>
          </div>

          {/* Details Column 2: Career, Bio, Preferences */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Career & Matrimonial Preferences</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.9375rem' }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', display: 'block' }}>Highest Education</span>
                <span style={{ fontWeight: 600 }}>{member.education}</span>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', display: 'block' }}>Occupation</span>
                <span>{member.occupation || '—'}</span>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', display: 'block' }}>Annual Income</span>
                <span>{member.annual_income || '—'}</span>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', display: 'block' }}>About Candidate & Family</span>
                <p style={{ color: 'var(--color-text-main)', lineHeight: 1.6, marginTop: '0.25rem' }}>
                  {member.about_me || 'No background description provided.'}
                </p>
              </div>

              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', display: 'block' }}>Partner Preferences</span>
                <p style={{ color: 'var(--color-text-main)', lineHeight: 1.6, marginTop: '0.25rem' }}>
                  {member.partner_preferences || 'No specific preferences recorded.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Linked Notes & Tasks Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Conversation Notes */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📝 Conversation Notes ({notes.length})</h3>
            <button
              type="button"
              onClick={() => setIsAddingNote(!isAddingNote)}
              className="btn btn-outline btn-sm"
            >
              {isAddingNote ? 'Cancel' : '➕ Add Note'}
            </button>
          </div>
          <div className="card-body">
            {isAddingNote && (
              <form onSubmit={handleCreateNote} style={{ marginBottom: '1.25rem', padding: '1rem', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)' }}>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem' }}>New Conversation Note</label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    placeholder="Enter call summary, family discussion details, or proposal updates..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddingNote(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={isSavingNote || !noteContent.trim()}
                  >
                    {isSavingNote ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
              </form>
            )}

            {notes.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                No conversation notes recorded yet. Click &quot;Add Note&quot; to log your first call record.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {notes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      padding: '0.875rem',
                      background: 'var(--color-surface-alt)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                    }}
                  >
                    <p style={{ marginBottom: '0.5rem', lineHeight: 1.5, color: 'var(--color-text-main)' }}>{note.content}</p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>👤 {note.author_email || 'Administrator'}</span>
                      <span>🕒 {formatDate(note.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scheduled Callback Tasks */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📅 Scheduled Follow-ups ({followUps.length})</h3>
            <button
              type="button"
              onClick={() => setIsSchedulingTask(!isSchedulingTask)}
              className="btn btn-outline btn-sm"
            >
              {isSchedulingTask ? 'Cancel' : '📅 Schedule Callback'}
            </button>
          </div>
          <div className="card-body">
            {isSchedulingTask && (
              <form onSubmit={handleCreateTask} style={{ marginBottom: '1.25rem', padding: '1rem', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8125rem' }}>Callback Date <span className="required">*</span></label>
                    <input
                      type="date"
                      className="form-input"
                      value={taskDate}
                      onChange={(e) => setTaskDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8125rem' }}>Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={taskTime}
                      onChange={(e) => setTaskTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem' }}>Reason / Agenda <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Discuss proposals sent on WhatsApp / follow-up call"
                    value={taskReason}
                    onChange={(e) => setTaskReason(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setIsSchedulingTask(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-gold btn-sm"
                    disabled={isSavingTask || !taskReason.trim()}
                  >
                    {isSavingTask ? 'Scheduling...' : 'Confirm Callback'}
                  </button>
                </div>
              </form>
            )}

            {followUps.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                No callbacks scheduled. Click &quot;Schedule Callback&quot; to set up a reminder.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {followUps.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      padding: '0.875rem',
                      background: 'var(--color-surface-alt)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      borderLeft: task.status === 'completed' ? '3px solid var(--color-success)' : task.status === 'cancelled' ? '3px solid var(--color-text-light)' : '3px solid var(--color-warning)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                      <span style={{ fontWeight: 600 }}>
                        📅 {formatDate(task.scheduled_date)} {task.scheduled_time ? `at ${task.scheduled_time.slice(0, 5)}` : ''}
                      </span>
                      <span className={`badge badge-${task.status}`}>{task.status}</span>
                    </div>

                    <p style={{ color: 'var(--color-text-main)', lineHeight: 1.4, marginBottom: task.status === 'pending' ? '0.625rem' : '0' }}>
                      {task.reason}
                    </p>

                    {task.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', paddingTop: '0.375rem', borderTop: '1px dashed var(--color-border)' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                          className="btn btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', borderColor: 'var(--color-success-border)' }}
                        >
                          ✓ Mark Complete
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateTaskStatus(task.id, 'cancelled')}
                          className="btn btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-light)', borderColor: 'var(--color-border)' }}
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
