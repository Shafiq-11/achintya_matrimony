'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  formatDate,
  calculateAge,
  buildWhatsAppLink,
  formatDisplayPhone,
  normalizeWhatsAppPhone,
} from '@/lib/utils/formatting';
import type { Member, Note, FollowUpTask, ProfileStatus, Gender, MaritalStatus } from '@/lib/types';

interface MemberDetailViewProps {
  initialMember: Member;
  initialNotes: Note[];
  initialFollowUps: FollowUpTask[];
  businessName?: string;
  defaultWhatsAppTemplate?: string;
}

const STATUS_OPTIONS: { value: ProfileStatus; label: string }[] = [
  { value: 'new', label: 'New Registration' },
  { value: 'active', label: 'Active Profile' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'matched', label: 'Matched' },
  { value: 'inactive', label: 'Inactive / On Hold' },
  { value: 'archived', label: 'Archived' },
];

const GENDER_OPTIONS: Gender[] = ['Female', 'Male', 'Other'];

const MARITAL_STATUS_OPTIONS: MaritalStatus[] = [
  'Never Married',
  'Divorced',
  'Widowed',
  'Awaiting Divorce',
  'Annulled',
];

const EMPLOYMENT_STATUS_OPTIONS = [
  'Salaried',
  'Business Owner / Entrepreneur',
  'Self-Employed / Professional',
  'Civil Services / Government',
  'Homemaker',
  'Not Employed / Seeking Opportunities',
  'Other',
];

const INDIAN_STATES = [
  'Tamil Nadu', 'Karnataka', 'Kerala', 'Andhra Pradesh', 'Telangana', 'Maharashtra',
  'Gujarat', 'Delhi / NCR', 'Uttar Pradesh', 'West Bengal', 'Rajasthan', 'Madhya Pradesh',
  'Punjab', 'Haryana', 'Bihar', 'Odisha', 'Goa', 'Assam', 'Other / Overseas NRI'
];

function getTomorrowDateString(): string {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(tomorrow);
  } catch {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
}

function cmToFeetInches(cm?: number | null): string | null {
  if (!cm) return null;
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
}

export function MemberDetailView({
  initialMember,
  initialNotes,
  initialFollowUps,
  businessName = 'Achintya Matrimony',
  defaultWhatsAppTemplate,
}: MemberDetailViewProps) {
  const router = useRouter();

  const [member, setMember] = useState<Member>(initialMember);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [followUps, setFollowUps] = useState<FollowUpTask[]>(initialFollowUps);

  // Status update loading state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Schedule Call Form State
  const [scheduleDate, setScheduleDate] = useState(getTomorrowDateString);
  const [scheduleTime, setScheduleTime] = useState('11:00');
  const [scheduleReason, setScheduleReason] = useState('Follow-up call to discuss profile details');
  const [rescheduleTaskId, setRescheduleTaskId] = useState<string | null>(null);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // WhatsApp Message State
  const defaultMsg =
    defaultWhatsAppTemplate && defaultWhatsAppTemplate.includes('{{name}}')
      ? defaultWhatsAppTemplate
          .replace(/\{\{name\}\}/g, member.full_name)
          .replace(/\{\{reg_id\}\}/g, member.reg_id)
          .replace(/\{\{business_name\}\}/g, businessName)
      : `Namaste ${member.full_name}, this is ${businessName} regarding your matrimony registration (ID: ${member.reg_id}). When would be a convenient time for a quick introductory call?`;

  const [whatsAppText, setWhatsAppText] = useState(defaultMsg);

  // Edit Member Form State (Section A - D)
  const [editForm, setEditForm] = useState({
    full_name: member.full_name,
    gender: member.gender,
    dob: member.dob,
    phone: member.phone,
    email: member.email || '',
    marital_status: member.marital_status,
    siblings: member.siblings || '',
    kulam: member.kulam || member.caste || '',
    height_cm: member.height_cm ? String(member.height_cm) : '',

    college_name: member.college_name || '',
    college_degree: member.college_degree || member.education || '',
    school_name: member.school_name || '',
    education_other: member.education_other || '',
    parents_details: member.parents_details || '',
    parents_origin: member.parents_origin || '',
    place_of_living: member.place_of_living || member.location_city || '',
    location_state: member.location_state || 'Tamil Nadu',

    employment_status: member.employment_status || 'Salaried',
    employer_name: member.employer_name || '',
    job_title: member.job_title || member.occupation || '',
    salary_info: member.salary_info || '',
    business_details: member.business_details || '',
    property_details: member.property_details || '',
    monthly_income: member.monthly_income ? String(member.monthly_income) : '',
    passive_income: member.passive_income ? String(member.passive_income) : '',
    passive_income_type: (member.passive_income_type as 'monthly' | 'annual') || 'monthly',
    linkedin_url: member.linkedin_url || '',

    health_info: member.health_info || '',
    health_consent_given: Boolean(member.health_consent_given),

    profile_status: member.profile_status,
  });

  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Add Note State
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isAddingNoteInline, setIsAddingNoteInline] = useState(false);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const age = calculateAge(member.dob);
  const normalizedPhone = normalizeWhatsAppPhone(member.phone);
  const isValidPhone = normalizedPhone.length >= 10;
  const telLink = isValidPhone ? `tel:${member.phone.replace(/[^0-9+]/g, '')}` : null;
  const feetInches = cmToFeetInches(member.height_cm);

  // Status Change Handler
  const handleStatusChange = async (newStatus: ProfileStatus) => {
    if (newStatus === member.profile_status) return;
    setIsUpdatingStatus(true);

    try {
      const response = await fetch(`/api/admin/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_status: newStatus }),
      });

      const data = await response.json();
      if (!response.ok) {
        showToast('error', data.error || 'Failed to update profile status.');
        return;
      }

      setMember((prev) => ({
        ...prev,
        profile_status: newStatus,
        updated_at: data.member?.updated_at || new Date().toISOString(),
      }));
      showToast('success', `Status updated to "${newStatus.toUpperCase()}" successfully.`);
      router.refresh();
    } catch {
      showToast('error', 'Network error occurred while updating status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Schedule Call Handler
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleDate || !scheduleReason.trim()) {
      alert('Please fill in callback date and reason.');
      return;
    }

    setIsSavingSchedule(true);
    try {
      const response = await fetch('/api/admin/follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          scheduledDate: scheduleDate,
          scheduledTime: scheduleTime ? `${scheduleTime}:00` : null,
          reason: scheduleReason.trim(),
          rescheduleTaskId: rescheduleTaskId || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        showToast('error', data.error || 'Failed to schedule follow-up.');
        return;
      }

      if (data.task) {
        if (rescheduleTaskId) {
          setFollowUps((prev) =>
            prev.map((t) =>
              t.id === rescheduleTaskId
                ? { ...t, status: 'cancelled', reason: `Rescheduled to ${scheduleDate}` }
                : t
            )
          );
        }

        setFollowUps((prev) => [data.task, ...prev]);
        setIsScheduleModalOpen(false);
        setRescheduleTaskId(null);
        showToast('success', `Follow-up call scheduled for ${formatDate(scheduleDate)}!`);
        router.refresh();
      }
    } catch {
      showToast('error', 'Network error while scheduling callback.');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Follow-up status update
  const handleUpdateTaskStatus = async (taskId: string, newStatus: 'completed' | 'cancelled') => {
    try {
      const response = await fetch(`/api/admin/follow-ups/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (response.ok && data.task) {
        setFollowUps((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
        showToast('success', `Task marked as ${newStatus}.`);
        router.refresh();
      } else {
        showToast('error', data.error || 'Failed to update task.');
      }
    } catch {
      showToast('error', 'Network error while updating task.');
    }
  };

  const handleOpenReschedule = (task: FollowUpTask) => {
    setRescheduleTaskId(task.id);
    setScheduleDate(getTomorrowDateString());
    setScheduleReason(`Callback for ${member.full_name}: ${task.reason}`);
    setIsScheduleModalOpen(true);
  };

  // Add Note Handler
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
        setIsAddingNoteInline(false);
        showToast('success', 'Private admin note saved successfully.');
        router.refresh();
      } else {
        showToast('error', data.error || 'Failed to save note.');
      }
    } catch {
      showToast('error', 'Network error while saving note.');
    } finally {
      setIsSavingNote(false);
    }
  };

  // WhatsApp launcher
  const handleLaunchWhatsApp = () => {
    if (!isValidPhone) {
      alert('Cannot launch WhatsApp: This candidate does not have a valid mobile number.');
      return;
    }
    const url = buildWhatsAppLink(member.phone, whatsAppText);
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsWhatsAppModalOpen(false);
    showToast('success', 'WhatsApp conversation opened in a new tab.');
  };

  // Save Edit Member Handler
  const handleSaveEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!editForm.full_name.trim()) errors.full_name = 'Full name is required.';
    if (!editForm.phone.trim()) errors.phone = 'Mobile number is required.';
    if (!editForm.place_of_living.trim()) errors.place_of_living = 'Place of living is required.';

    if (editForm.linkedin_url && editForm.linkedin_url.trim()) {
      if (!/^https?:\/\/(www\.)?linkedin\.com\/.*$/i.test(editForm.linkedin_url.trim())) {
        errors.linkedin_url = 'Please provide a valid LinkedIn URL.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setEditErrors({});
    setIsSavingEdit(true);

    try {
      const payload: Record<string, unknown> = {
        full_name: editForm.full_name.trim(),
        gender: editForm.gender,
        dob: editForm.dob,
        phone: editForm.phone.trim(),
        email: editForm.email.trim() || null,
        marital_status: editForm.marital_status,
        siblings: editForm.siblings.trim() || null,
        kulam: editForm.kulam.trim() || null,
        height_cm: editForm.height_cm ? Number(editForm.height_cm) : null,

        college_name: editForm.college_name.trim() || null,
        college_degree: editForm.college_degree.trim() || null,
        school_name: editForm.school_name.trim() || null,
        education_other: editForm.education_other.trim() || null,
        parents_details: editForm.parents_details.trim() || null,
        parents_origin: editForm.parents_origin.trim() || null,
        place_of_living: editForm.place_of_living.trim(),
        location_city: editForm.place_of_living.trim(),
        location_state: editForm.location_state,

        employment_status: editForm.employment_status || null,
        employer_name: editForm.employer_name.trim() || null,
        job_title: editForm.job_title.trim() || null,
        salary_info: editForm.salary_info.trim() || null,
        business_details: editForm.business_details.trim() || null,
        property_details: editForm.property_details.trim() || null,
        monthly_income: editForm.monthly_income ? Number(editForm.monthly_income) : null,
        passive_income: editForm.passive_income ? Number(editForm.passive_income) : null,
        passive_income_type: editForm.passive_income_type,
        linkedin_url: editForm.linkedin_url.trim() || null,

        health_info: editForm.health_info.trim() || null,
        health_consent_given: editForm.health_consent_given,

        profile_status: editForm.profile_status,
      };

      const response = await fetch(`/api/admin/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        showToast('error', data.error || 'Failed to update member profile.');
        return;
      }

      setMember(data.member);
      setIsEditModalOpen(false);
      showToast('success', 'Candidate details updated successfully.');
      router.refresh();
    } catch {
      showToast('error', 'Network error occurred while saving profile changes.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const pendingTasks = followUps.filter((t) => t.status === 'pending');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Toast Alert */}
      {toast && (
        <div
          className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-danger'}`}
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            zIndex: 2000,
            boxShadow: 'var(--shadow-lg)',
            animation: 'fadeIn 200ms ease',
          }}
        >
          {toast.type === 'success' ? '✓' : '⚠️'} {toast.text}
        </div>
      )}

      {/* Top Breadcrumb & Actions Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <Link
          href="/admin/members"
          className="btn btn-outline btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
        >
          ← Return to Member Directory
        </Link>

        {/* Action Buttons Area */}
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Schedule Call */}
          <button
            type="button"
            onClick={() => {
              setRescheduleTaskId(null);
              setScheduleDate(getTomorrowDateString());
              setScheduleReason('Follow-up call to discuss profile details');
              setIsScheduleModalOpen(true);
            }}
            className="btn btn-gold btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
          >
            📅 Schedule Call
          </button>

          {/* Add Note */}
          <button
            type="button"
            onClick={() => setIsAddingNoteInline(!isAddingNoteInline)}
            className="btn btn-outline btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
          >
            📝 Add Note
          </button>

          {/* WhatsApp */}
          {isValidPhone ? (
            <button
              type="button"
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="btn btn-whatsapp btn-sm"
            >
              💬 WhatsApp
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="btn btn-secondary btn-sm"
              title="No valid mobile number recorded"
              style={{ opacity: 0.6 }}
            >
              💬 WhatsApp (No Phone)
            </button>
          )}

          {/* Phone Call */}
          {telLink ? (
            <a
              href={telLink}
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
              title={`Call ${formatDisplayPhone(member.phone)}`}
            >
              📞 Call {formatDisplayPhone(member.phone)}
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="btn btn-secondary btn-sm"
              style={{ opacity: 0.6 }}
            >
              📞 Call (Invalid Phone)
            </button>
          )}

          {/* Edit Member Button */}
          <button
            type="button"
            onClick={() => {
              setEditForm({
                full_name: member.full_name,
                gender: member.gender,
                dob: member.dob,
                phone: member.phone,
                email: member.email || '',
                marital_status: member.marital_status,
                siblings: member.siblings || '',
                kulam: member.kulam || member.caste || '',
                height_cm: member.height_cm ? String(member.height_cm) : '',

                college_name: member.college_name || '',
                college_degree: member.college_degree || member.education || '',
                school_name: member.school_name || '',
                education_other: member.education_other || '',
                parents_details: member.parents_details || '',
                parents_origin: member.parents_origin || '',
                place_of_living: member.place_of_living || member.location_city || '',
                location_state: member.location_state || 'Tamil Nadu',

                employment_status: member.employment_status || 'Salaried',
                employer_name: member.employer_name || '',
                job_title: member.job_title || member.occupation || '',
                salary_info: member.salary_info || '',
                business_details: member.business_details || '',
                property_details: member.property_details || '',
                monthly_income: member.monthly_income ? String(member.monthly_income) : '',
                passive_income: member.passive_income ? String(member.passive_income) : '',
                passive_income_type: (member.passive_income_type as 'monthly' | 'annual') || 'monthly',
                linkedin_url: member.linkedin_url || '',

                health_info: member.health_info || '',
                health_consent_given: Boolean(member.health_consent_given),

                profile_status: member.profile_status,
              });
              setEditErrors({});
              setIsEditModalOpen(true);
            }}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
          >
            ✏️ Edit Member
          </button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--color-primary)' }}>
        <div className="card-body">
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.25rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <h1
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.875rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  {member.full_name}
                </h1>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    padding: '0.2rem 0.6rem',
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-primary-subtle)',
                  }}
                >
                  {member.reg_id}
                </span>

                <span className={`badge badge-${member.profile_status}`}>
                  {member.profile_status.toUpperCase()}
                </span>

                {pendingTasks.length > 0 && (
                  <span className="badge badge-warning" title={`${pendingTasks.length} pending callback task(s)`}>
                    ⏰ {pendingTasks.length} Callback Pending
                  </span>
                )}
              </div>

              <div
                style={{
                  fontSize: '0.9375rem',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  gap: '1.25rem',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <span>
                  <strong>Gender:</strong> {member.gender === 'Female' ? '👩 Bride' : member.gender === 'Male' ? '👨 Groom' : member.gender}
                </span>
                <span>
                  <strong>Age:</strong> {age ? `${age} yrs (${formatDate(member.dob)})` : formatDate(member.dob)}
                </span>
                <span>
                  <strong>Marital Status:</strong> {member.marital_status}
                </span>
                <span>
                  <strong>Location:</strong> {member.place_of_living || member.location_city}, {member.location_state}
                </span>
                {member.kulam && (
                  <span>
                    <strong>Kulam:</strong> {member.kulam}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.625rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  Change Status:
                </label>
                <select
                  className="form-select"
                  style={{ fontSize: '0.8125rem', padding: '0.3rem 0.6rem', width: 'auto' }}
                  value={member.profile_status}
                  onChange={(e) => handleStatusChange(e.target.value as ProfileStatus)}
                  disabled={isUpdatingStatus}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', textAlign: 'right' }}>
                <div>Registered: <strong>{formatDate(member.created_at)}</strong></div>
                <div>Last Modified: <strong>{formatDate(member.updated_at)}</strong></div>
                <div>Source: <span style={{ textTransform: 'capitalize' }}>{member.registration_source.replace('_', ' ')}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Quick Add Note Box */}
      {isAddingNoteInline && (
        <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--color-gold-light)', borderColor: 'var(--color-gold-border)' }}>
          <div className="card-body">
            <form onSubmit={handleCreateNote}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                  🔒 Add Internal Admin Conversation Note
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Private — strictly for counselor records
                </span>
              </div>
              <textarea
                rows={3}
                className="form-textarea"
                placeholder="Log discussion details (e.g. 'Spoke with candidate regarding horoscope preferences. Shared 2 shortlisted profiles on WhatsApp.')"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                required
                style={{ backgroundColor: '#ffffff', marginBottom: '0.75rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsAddingNoteInline(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSavingNote || !noteContent.trim()}
                >
                  {isSavingNote ? 'Saving Note...' : 'Save Private Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4-SECTION DETAILED INFORMATION CARDS */}
      {/* ==================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* SECTION A CARD: Personal Details */}
        <div className="card">
          <div className="card-header" style={{ borderLeft: '4px solid var(--color-primary)' }}>
            <h3 className="card-title">Section A — Personal Details</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>1. Full Name</span>
                <span style={{ fontWeight: 700 }}>{member.full_name}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Gender</span>
                <span>{member.gender}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>2. Date of Birth / Age</span>
                <span>{formatDate(member.dob)} {age ? `(${age} yrs)` : ''}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Marital Status</span>
                <span>{member.marital_status}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Mobile / WhatsApp</span>
                <span style={{ fontWeight: 600 }}>{formatDisplayPhone(member.phone)}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Email Address</span>
                <span style={{ wordBreak: 'break-all' }}>{member.email || <em style={{ color: 'var(--color-text-light)' }}>Not provided</em>}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>3. Kulam</span>
                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                  {member.kulam || member.caste || <em style={{ color: 'var(--color-text-light)', fontWeight: 400 }}>Not specified</em>}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>4. Height</span>
                <span>
                  {member.height_cm ? `${member.height_cm} cm ${feetInches ? `(${feetInches})` : ''}` : <em style={{ color: 'var(--color-text-light)' }}>Not specified</em>}
                </span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>5. Siblings</span>
              <p style={{ marginTop: '0.25rem', lineHeight: 1.5, color: 'var(--color-text-main)' }}>
                {member.siblings || <em style={{ color: 'var(--color-text-light)' }}>No sibling details disclosed</em>}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION B CARD: Education and Family */}
        <div className="card">
          <div className="card-header" style={{ borderLeft: '4px solid var(--color-gold)' }}>
            <h3 className="card-title">Section B — Education and Family</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>College Qualification / Degree</span>
              <span style={{ fontWeight: 600 }}>{member.college_degree || member.education || 'Not specified'}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>College / University Name</span>
                <span>{member.college_name || <em style={{ color: 'var(--color-text-light)' }}>Not specified</em>}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>School Name</span>
                <span>{member.school_name || <em style={{ color: 'var(--color-text-light)' }}>Not specified</em>}</span>
              </div>
            </div>

            {member.education_other && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Other Education</span>
                <span>{member.education_other}</span>
              </div>
            )}

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>7. Parents&apos; Details & Occupation</span>
              <p style={{ marginTop: '0.25rem', lineHeight: 1.5 }}>
                {member.parents_details || <em style={{ color: 'var(--color-text-light)' }}>Not specified</em>}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>8. Parents&apos; Origin Details</span>
                <span>{member.parents_origin || <em style={{ color: 'var(--color-text-light)' }}>Not specified</em>}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>9. Place of Living</span>
                <span style={{ fontWeight: 600 }}>
                  {member.place_of_living || member.location_city}, {member.location_state}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION C CARD: Work and Financial Details */}
        <div className="card">
          <div className="card-header" style={{ borderLeft: '4px solid var(--color-primary)' }}>
            <h3 className="card-title">Section C — Work & Financial Details</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Employment Status</span>
                <span style={{ fontWeight: 600 }}>{member.employment_status || member.occupation || 'Not specified'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Job Title / Designation</span>
                <span>{member.job_title || member.occupation || <em style={{ color: 'var(--color-text-light)' }}>Not specified</em>}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Employer / Company Name</span>
                <span>{member.employer_name || <em style={{ color: 'var(--color-text-light)' }}>Not specified</em>}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Salary / CTC</span>
                <span>{member.salary_info || member.annual_income || <em style={{ color: 'var(--color-text-light)' }}>Not disclosed</em>}</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>11. Business Details</span>
              <p style={{ marginTop: '0.25rem', lineHeight: 1.5 }}>
                {member.business_details || <em style={{ color: 'var(--color-text-light)' }}>No business details recorded</em>}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>12. Monthly Income (INR)</span>
                <span style={{ fontWeight: 600 }}>
                  {member.monthly_income ? `₹${Number(member.monthly_income).toLocaleString('en-IN')}` : <em style={{ color: 'var(--color-text-light)', fontWeight: 400 }}>Not disclosed</em>}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>13. Passive Income</span>
                <span>
                  {member.passive_income ? `₹${Number(member.passive_income).toLocaleString('en-IN')} (${member.passive_income_type || 'monthly'})` : <em style={{ color: 'var(--color-text-light)' }}>None disclosed</em>}
                </span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>14. LinkedIn Profile</span>
              {member.linkedin_url ? (
                <a
                  href={member.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#0077B5', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  🔗 View LinkedIn Profile ↗
                </a>
              ) : (
                <em style={{ color: 'var(--color-text-light)' }}>Not provided</em>
              )}
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>15. Property Details</span>
              <p style={{ marginTop: '0.25rem', lineHeight: 1.5 }}>
                {member.property_details || <em style={{ color: 'var(--color-text-light)' }}>No property details disclosed</em>}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION D CARD: Sensitive Health Information (Restricted Admin) */}
        <div className="card" style={{ borderColor: 'var(--color-gold-border)' }}>
          <div className="card-header" style={{ borderLeft: '4px solid var(--color-gold)', backgroundColor: 'var(--color-gold-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <h3 className="card-title" style={{ color: 'var(--color-primary)' }}>
                🔒 Section D — Health Information
              </h3>
              <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>Confidential</span>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface-alt)', padding: '0.625rem', borderRadius: 'var(--radius-sm)' }}>
              🛡️ <strong>Counselor Security Notice:</strong> Health disclosures are protected sensitive information. This information is excluded by default from candidate search results, directory tables, and exported spreadsheets.
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                Disclosed Health Information
              </span>
              <p style={{ marginTop: '0.35rem', lineHeight: 1.5, fontWeight: member.health_info ? 500 : 400 }}>
                {member.health_info || <em style={{ color: 'var(--color-text-light)' }}>No physical disabilities, major surgeries or chronic medications disclosed.</em>}
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                Applicant Health Consent
              </span>
              <span style={{ fontSize: '0.8125rem', color: member.health_consent_given ? 'var(--color-success)' : 'var(--color-text-muted)', fontWeight: 600 }}>
                {member.health_consent_given ? '✓ Voluntary applicant consent given' : 'Consent not recorded'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Linked Follow-ups and Notes Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Scheduled Follow-ups */}
        <div className="card">
          <div
            className="card-header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>📅 Scheduled Follow-ups ({followUps.length})</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Callbacks appear in Daily Tasks
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setRescheduleTaskId(null);
                setScheduleDate(getTomorrowDateString());
                setScheduleReason('Follow-up call to discuss profile details');
                setIsScheduleModalOpen(true);
              }}
              className="btn btn-gold btn-sm"
            >
              ➕ Schedule
            </button>
          </div>

          <div className="card-body">
            {followUps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No Callbacks Scheduled</p>
                <p style={{ fontSize: '0.8125rem' }}>
                  Click &quot;Schedule&quot; to set a reminder for following up with {member.full_name}.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {followUps.map((task) => {
                  const isPending = task.status === 'pending';
                  const isCompleted = task.status === 'completed';

                  return (
                    <div
                      key={task.id}
                      style={{
                        padding: '0.875rem',
                        backgroundColor: 'var(--color-surface-alt)',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: isPending
                          ? '3px solid var(--color-warning)'
                          : isCompleted
                          ? '3px solid var(--color-success)'
                          : '3px solid var(--color-text-light)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.375rem',
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text-main)' }}>
                          📅 {formatDate(task.scheduled_date)}{' '}
                          {task.scheduled_time ? `at ${task.scheduled_time.slice(0, 5)}` : ''}
                        </span>
                        <span className={`badge badge-${task.status}`}>{task.status.toUpperCase()}</span>
                      </div>

                      <p style={{ fontSize: '0.875rem', lineHeight: 1.4, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                        {task.reason}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.75rem',
                          color: 'var(--color-text-light)',
                          borderTop: '1px dashed var(--color-border)',
                          paddingTop: '0.5rem',
                        }}
                      >
                        <span>By: {task.author_email || 'Administrator'}</span>

                        {isPending && (
                          <div style={{ display: 'flex', gap: '0.375rem' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenReschedule(task)}
                              className="btn btn-outline btn-sm"
                              style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
                            >
                              🔁 Reschedule
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                              className="btn btn-sm"
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.15rem 0.5rem',
                                backgroundColor: 'var(--color-success-bg)',
                                color: 'var(--color-success)',
                                borderColor: 'var(--color-success-border)',
                              }}
                            >
                              ✓ Done
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateTaskStatus(task.id, 'cancelled')}
                              className="btn btn-sm"
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.15rem 0.5rem',
                                backgroundColor: 'var(--color-surface)',
                                color: 'var(--color-text-light)',
                                borderColor: 'var(--color-border)',
                              }}
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Private Internal Notes */}
        <div className="card">
          <div
            className="card-header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>📝 Private Internal Notes ({notes.length})</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Protected counselor history
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingNoteInline(true)}
              className="btn btn-outline btn-sm"
            >
              ➕ Add Note
            </button>
          </div>

          <div className="card-body">
            {notes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No Notes Recorded</p>
                <p style={{ fontSize: '0.8125rem' }}>
                  Log discussion summaries, family feedback, or preferences for internal staff reference.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {notes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      padding: '0.875rem',
                      backgroundColor: 'var(--color-surface-alt)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      borderLeft: '3px solid var(--color-primary)',
                    }}
                  >
                    <p style={{ color: 'var(--color-text-main)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                      {note.content}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-light)',
                        borderTop: '1px dashed var(--color-border)',
                        paddingTop: '0.375rem',
                      }}
                    >
                      <span>👤 {note.author_email || 'Administrator'}</span>
                      <span>🕒 {formatDate(note.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: Schedule Call Dialog */}
      {/* ==================================================================== */}
      {isScheduleModalOpen && (
        <div className="modal-overlay" onClick={() => setIsScheduleModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {rescheduleTaskId ? '🔁 Reschedule Follow-up Call' : '📅 Schedule Callback Task'}
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsScheduleModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchedule}>
              <div className="modal-body">
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                  Schedule a follow-up callback for <strong>{member.full_name}</strong> ({member.reg_id}).
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">
                      Callback Date <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Callback Time (Optional)</label>
                    <input
                      type="time"
                      className="form-input"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Reason or Reminder Note <span className="required">*</span>
                  </label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    placeholder="e.g. Member requested callback to review shortlisted proposals."
                    value={scheduleReason}
                    onChange={(e) => setScheduleReason(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                  disabled={isSavingSchedule}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-gold btn-sm"
                  disabled={isSavingSchedule || !scheduleDate || !scheduleReason.trim()}
                >
                  {isSavingSchedule ? 'Saving Task...' : 'Save Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: WhatsApp Message Review & Customization */}
      {/* ==================================================================== */}
      {isWhatsAppModalOpen && (
        <div className="modal-overlay" onClick={() => setIsWhatsAppModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--color-green)' }}>
                💬 Review & Send WhatsApp Message
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsWhatsAppModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'block' }}>
                  Recipient:
                </span>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                  {member.full_name} ({formatDisplayPhone(member.phone)})
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Message Content</label>
                <textarea
                  rows={4}
                  className="form-textarea"
                  value={whatsAppText}
                  onChange={(e) => setWhatsAppText(e.target.value)}
                  style={{ lineHeight: 1.5 }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.375rem' }}>
                  Quick Preset Templates:
                </span>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                    onClick={() =>
                      setWhatsAppText(
                        `Namaste ${member.full_name}, this is ${businessName} regarding your registration (${member.reg_id}). When is a convenient time for a brief introductory call?`
                      )
                    }
                  >
                    Introductory Call
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                    onClick={() =>
                      setWhatsAppText(
                        `Namaste ${member.full_name}, we have curated 2 verified matrimonial matches for your profile (${member.reg_id}). Please let us know if we may share their bio-data.`
                      )
                    }
                  >
                    Proposals Ready
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLaunchWhatsApp}
                className="btn btn-whatsapp btn-sm"
              >
                💬 Open in WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: Edit Member Profile (Sections A to D) */}
      {/* ==================================================================== */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-container modal-container-lg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <h2 className="modal-title">✏️ Edit Candidate Information</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditMember}>
              <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                {/* Security Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--color-surface-alt)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1.25rem',
                    fontSize: '0.8125rem',
                  }}
                >
                  <span>
                    Registration ID: <strong>{member.reg_id}</strong> (Permanent)
                  </span>
                  <span>
                    Registered: <strong>{formatDate(member.created_at)}</strong> (Preserved)
                  </span>
                </div>

                {/* Section A Fields */}
                <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.875rem' }}>
                    Section A — Personal Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Full Name <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        required
                      />
                      {editErrors.full_name && <span className="form-error">{editErrors.full_name}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Gender <span className="required">*</span></label>
                      <select
                        className="form-select"
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as Gender })}
                      >
                        {GENDER_OPTIONS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Date of Birth <span className="required">*</span></label>
                      <input
                        type="date"
                        className="form-input"
                        value={editForm.dob}
                        onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Mobile Number <span className="required">*</span></label>
                      <input
                        type="tel"
                        className="form-input"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        required
                      />
                      {editErrors.phone && <span className="form-error">{editErrors.phone}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-input"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Marital Status</label>
                      <select
                        className="form-select"
                        value={editForm.marital_status}
                        onChange={(e) => setEditForm({ ...editForm, marital_status: e.target.value as MaritalStatus })}
                      >
                        {MARITAL_STATUS_OPTIONS.map((ms) => (
                          <option key={ms} value={ms}>{ms}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Kulam</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.kulam}
                        onChange={(e) => setEditForm({ ...editForm, kulam: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Height (cm)</label>
                      <input
                        type="number"
                        min={90}
                        max={250}
                        className="form-input"
                        value={editForm.height_cm}
                        onChange={(e) => setEditForm({ ...editForm, height_cm: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '0.75rem' }}>
                    <label className="form-label">Siblings Details</label>
                    <textarea
                      rows={2}
                      className="form-textarea"
                      value={editForm.siblings}
                      onChange={(e) => setEditForm({ ...editForm, siblings: e.target.value })}
                    />
                  </div>
                </div>

                {/* Section B Fields */}
                <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.875rem' }}>
                    Section B — Education and Family
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">College Degree / Qualification</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.college_degree}
                        onChange={(e) => setEditForm({ ...editForm, college_degree: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">College / University Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.college_name}
                        onChange={(e) => setEditForm({ ...editForm, college_name: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">School Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.school_name}
                        onChange={(e) => setEditForm({ ...editForm, school_name: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Other Education Details</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.education_other}
                        onChange={(e) => setEditForm({ ...editForm, education_other: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Parents&apos; Origin Details (Native Place)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.parents_origin}
                        onChange={(e) => setEditForm({ ...editForm, parents_origin: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Place of Living (Town / City) <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.place_of_living}
                        onChange={(e) => setEditForm({ ...editForm, place_of_living: e.target.value })}
                        required
                      />
                      {editErrors.place_of_living && <span className="form-error">{editErrors.place_of_living}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">State</label>
                      <select
                        className="form-select"
                        value={editForm.location_state}
                        onChange={(e) => setEditForm({ ...editForm, location_state: e.target.value })}
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '0.75rem' }}>
                    <label className="form-label">Parents&apos; Details & Occupation</label>
                    <textarea
                      rows={2}
                      className="form-textarea"
                      value={editForm.parents_details}
                      onChange={(e) => setEditForm({ ...editForm, parents_details: e.target.value })}
                    />
                  </div>
                </div>

                {/* Section C Fields */}
                <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.875rem' }}>
                    Section C — Work and Financial Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Employment Status</label>
                      <select
                        className="form-select"
                        value={editForm.employment_status}
                        onChange={(e) => setEditForm({ ...editForm, employment_status: e.target.value })}
                      >
                        {EMPLOYMENT_STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Employer Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.employer_name}
                        onChange={(e) => setEditForm({ ...editForm, employer_name: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Job Title / Designation</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.job_title}
                        onChange={(e) => setEditForm({ ...editForm, job_title: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Salary Details</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.salary_info}
                        onChange={(e) => setEditForm({ ...editForm, salary_info: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Approximate Monthly Income (INR ₹)</label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={editForm.monthly_income}
                        onChange={(e) => setEditForm({ ...editForm, monthly_income: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Passive Income (INR ₹)</label>
                      <div style={{ display: 'flex' }}>
                        <input
                          type="number"
                          min="0"
                          className="form-input"
                          style={{ borderRadius: 'var(--radius-md) 0 0 var(--radius-md)' }}
                          value={editForm.passive_income}
                          onChange={(e) => setEditForm({ ...editForm, passive_income: e.target.value })}
                        />
                        <select
                          className="form-select"
                          style={{ width: '120px', borderRadius: '0 var(--radius-md) var(--radius-md) 0', borderLeft: 'none' }}
                          value={editForm.passive_income_type}
                          onChange={(e) => setEditForm({ ...editForm, passive_income_type: e.target.value as 'monthly' | 'annual' })}
                        >
                          <option value="monthly">Monthly</option>
                          <option value="annual">Annual</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">LinkedIn Profile URL</label>
                      <input
                        type="url"
                        className="form-input"
                        value={editForm.linkedin_url}
                        onChange={(e) => setEditForm({ ...editForm, linkedin_url: e.target.value })}
                      />
                      {editErrors.linkedin_url && <span className="form-error">{editErrors.linkedin_url}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Profile Status</label>
                      <select
                        className="form-select"
                        value={editForm.profile_status}
                        onChange={(e) => setEditForm({ ...editForm, profile_status: e.target.value as ProfileStatus })}
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st.value} value={st.value}>{st.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '0.75rem' }}>
                    <label className="form-label">Business Details</label>
                    <textarea
                      rows={2}
                      className="form-textarea"
                      value={editForm.business_details}
                      onChange={(e) => setEditForm({ ...editForm, business_details: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Property & Asset Details</label>
                    <textarea
                      rows={2}
                      className="form-textarea"
                      value={editForm.property_details}
                      onChange={(e) => setEditForm({ ...editForm, property_details: e.target.value })}
                    />
                  </div>
                </div>

                {/* Section D Fields (Sensitive Health) */}
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.875rem' }}>
                    🔒 Section D — Health Information (Confidential)
                  </h4>
                  <div className="form-group">
                    <label className="form-label">Physical Disabilities, Major Surgeries or Medications</label>
                    <textarea
                      rows={3}
                      className="form-textarea"
                      value={editForm.health_info}
                      onChange={(e) => setEditForm({ ...editForm, health_info: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginTop: '0.5rem' }}>
                    <input
                      id="edit_health_consent"
                      type="checkbox"
                      checked={editForm.health_consent_given}
                      onChange={(e) => setEditForm({ ...editForm, health_consent_given: e.target.checked })}
                      style={{ width: '1.15rem', height: '1.15rem', accentColor: 'var(--color-primary)' }}
                    />
                    <label htmlFor="edit_health_consent" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
                      Applicant gave consent to store sensitive health disclosures
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                  disabled={isSavingEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
