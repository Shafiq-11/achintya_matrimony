'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { formatDisplayPhone } from '@/lib/utils/formatting';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { downloadExportFile } from '@/lib/utils/exportDownload';
import type { BusinessSettings } from '@/lib/types';

interface SettingsMeta {
  isLive: boolean;
  totalMembers: number;
  adminEmail: string;
  databaseStatus: string;
  supabaseUrl: string;
}

type SettingsTab = 'business' | 'whatsapp' | 'regional' | 'system';

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST — UTC+05:30, Standard)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST — UTC+04:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT — UTC+08:00)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
];

const PRESET_TEMPLATES = [
  {
    title: 'Introductory Callback',
    description: 'Sent immediately after registration to schedule the introductory counselor call.',
    text: 'Namaste {{name}}, this is {{business_name}}. We received your matrimony registration (ID: {{reg_id}}). When would be a convenient time for a quick introductory call?',
  },
  {
    title: 'Match Proposal',
    description: 'Sent when proposing a verified candidate profile to the family.',
    text: 'Namaste {{name}}, we have identified a verified matching proposal for your matrimonial profile (ID: {{reg_id}}). Please let us know if we can share the biodata and horoscope details with you.',
  },
  {
    title: 'Document Follow-up',
    description: 'Sent to request pending horoscope chart or photo verification.',
    text: 'Namaste {{name}}, regarding your profile (ID: {{reg_id}}) with {{business_name}}: our counselor is waiting to review your details. Could you kindly share your horoscope chart when convenient?',
  },
];

export function AdminSettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('business');

  // Server state
  const [initialSettings, setInitialSettings] = useState<BusinessSettings | null>(null);
  const [meta, setMeta] = useState<SettingsMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form state
  const [businessName, setBusinessName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [whatsappTemplate, setWhatsappTemplate] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<'xlsx' | 'csv' | null>(null);

  const templateInputRef = useRef<HTMLTextAreaElement>(null);

  const handleTriggerExport = (format: 'xlsx' | 'csv') => {
    const todayStr = new Date().toISOString().split('T')[0];
    downloadExportFile({
      url: `/api/admin/members/export?format=${format}`,
      defaultFilename: `Achintya_Matrimony_Members_${todayStr}.${format}`,
      onStart: () => setExportingFormat(format),
      onSuccess: (fname) => {
        setExportingFormat(null);
        setToast({
          type: 'success',
          message: `Successfully downloaded ${fname}`,
        });
      },
      onError: (err) => {
        setExportingFormat(null);
        setToast({
          type: 'error',
          message: err,
        });
      },
    });
  };

  // Fetch settings on mount
  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      setFetchError(null);
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to load application settings.');
        }

        const s: BusinessSettings = data.settings;
        setInitialSettings(s);
        setMeta(data.meta || null);

        setBusinessName(s.business_name || '');
        setBusinessPhone(s.business_phone || '');
        setBusinessEmail(s.business_email || '');
        setWhatsappTemplate(s.default_whatsapp_template || '');
        setTimezone(s.timezone || 'Asia/Kolkata');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to connect to settings API.';
        setFetchError(msg);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  // Check if form is dirty
  const isDirty =
    initialSettings &&
    (businessName !== initialSettings.business_name ||
      businessPhone !== initialSettings.business_phone ||
      (businessEmail || '') !== (initialSettings.business_email || '') ||
      whatsappTemplate !== initialSettings.default_whatsapp_template ||
      timezone !== initialSettings.timezone);

  // Handle Save
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setFieldErrors({});
    setToast(null);

    try {
      const payload = {
        business_name: businessName,
        business_phone: businessPhone,
        business_email: businessEmail || null,
        default_whatsapp_template: whatsappTemplate,
        timezone,
      };

      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
        }
        setToast({
          type: 'error',
          message: data.error || 'Failed to save settings. Please verify the highlighted fields.',
        });
        setIsSaving(false);
        return;
      }

      setInitialSettings(data.settings);
      setToast({
        type: 'success',
        message: 'Settings successfully updated and saved.',
      });
    } catch {
      setToast({
        type: 'error',
        message: 'A network error occurred while saving settings.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form to last saved
  const handleReset = () => {
    if (!initialSettings) return;
    setBusinessName(initialSettings.business_name || '');
    setBusinessPhone(initialSettings.business_phone || '');
    setBusinessEmail(initialSettings.business_email || '');
    setWhatsappTemplate(initialSettings.default_whatsapp_template || '');
    setTimezone(initialSettings.timezone || 'Asia/Kolkata');
    setFieldErrors({});
    setToast(null);
  };

  // Insert Tag into WhatsApp Template at cursor
  const handleInsertTag = (tag: string) => {
    const el = templateInputRef.current;
    if (!el) {
      setWhatsappTemplate((prev) => `${prev} ${tag}`);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const newText = text.substring(0, start) + tag + text.substring(end);
    setWhatsappTemplate(newText);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  // Compute live interpolated WhatsApp message for sample candidate
  const previewSampleMember = {
    name: 'Aravind Swaminathan',
    reg_id: 'AM-1016',
    phone: '+91 98765 12345',
    city: 'Madurai',
  };

  const interpolatedPreview = whatsappTemplate
    ? whatsappTemplate
        .replace(/\{\{name\}\}/g, previewSampleMember.name)
        .replace(/\{\{reg_id\}\}/g, previewSampleMember.reg_id)
        .replace(/\{\{business_name\}\}/g, businessName || 'Achintya Matrimony')
        .replace(/\{\{phone\}\}/g, previewSampleMember.phone)
        .replace(/\{\{city\}\}/g, previewSampleMember.city)
    : 'No message template specified.';

  // Copy registration link
  const handleCopyLink = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/register` : '/register';
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (isLoading) {
    return (
      <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <LoadingSpinner label="Loading application settings..." />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="alert alert-danger" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <p style={{ fontWeight: 600, margin: '0 0 0.5rem 0' }}>⚠️ Connection Error</p>
        <p style={{ margin: 0 }}>{fetchError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn btn-outline btn-sm"
          style={{ marginTop: '0.875rem' }}
        >
          🔄 Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Toast Alert */}
      {toast && (
        <div
          className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-danger'}`}
          style={{
            maxWidth: '1200px',
            margin: '0 auto 1.5rem auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            {toast.type === 'success' ? '✓' : '⚠️'} {toast.message}
          </span>
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              color: 'inherit',
              padding: '0 0.25rem',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Settings Master-Detail Layout */}
      <div className="settings-container">
        {/* Left Navigation Sidebar */}
        <aside className="settings-sidebar">
          <nav className="settings-nav-card" aria-label="Settings Categories">
            <button
              type="button"
              className={`settings-nav-item ${activeTab === 'business' ? 'active' : ''}`}
              onClick={() => setActiveTab('business')}
            >
              <span className="settings-nav-icon">🏢</span>
              <span>Business Profile</span>
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeTab === 'whatsapp' ? 'active' : ''}`}
              onClick={() => setActiveTab('whatsapp')}
            >
              <span className="settings-nav-icon">💬</span>
              <span>WhatsApp Automation</span>
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeTab === 'regional' ? 'active' : ''}`}
              onClick={() => setActiveTab('regional')}
            >
              <span className="settings-nav-icon">🌐</span>
              <span>Regional & Locale</span>
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeTab === 'system' ? 'active' : ''}`}
              onClick={() => setActiveTab('system')}
            >
              <span className="settings-nav-icon">🛡️</span>
              <span>System & Data</span>
            </button>
          </nav>

          {/* Quick System Info in Left Rail */}
          <div className="settings-sidebar-status">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-green)',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                Database Connected
              </span>
            </div>
            <div style={{ color: 'var(--color-text-light)', fontSize: '0.75rem', lineHeight: 1.4 }}>
              PostgreSQL • {meta?.totalMembers ?? 0} Authoritative Profiles
            </div>
            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '0.625rem', marginTop: '0.25rem' }}>
              <Link
                href="/register"
                target="_blank"
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                Public Registration Portal ↗
              </Link>
            </div>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <main className="settings-content-card">
          <form onSubmit={handleSave} noValidate>
            {/* ==============================================================================
                TAB 1: BUSINESS PROFILE & PORTAL
                ============================================================================== */}
            {activeTab === 'business' && (
              <div>
                <div className="settings-header">
                  <h2 className="settings-title">Business Profile & Contact Details</h2>
                  <p className="settings-subtitle">
                    Configure your agency name, official helpline, contact email, and applicant registration link.
                  </p>
                </div>

                <div className="settings-body">
                  <div className="settings-grid-2 settings-field-group">
                    {/* Agency / Business Name */}
                    <div>
                      <label htmlFor="business_name" className="settings-label">
                        Agency / Business Name <span style={{ color: 'var(--color-primary)' }}>*</span>
                      </label>
                      <input
                        id="business_name"
                        type="text"
                        className={`form-input ${fieldErrors.business_name ? 'is-invalid' : ''}`}
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Achintya Matrimony"
                        required
                      />
                      {fieldErrors.business_name && (
                        <div style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                          {fieldErrors.business_name}
                        </div>
                      )}
                      <div className="settings-input-hint">
                        Appears in header banners and replaces <code>{'{{business_name}}'}</code> in WhatsApp templates.
                      </div>
                    </div>

                    {/* Helpline Phone */}
                    <div>
                      <label htmlFor="business_phone" className="settings-label">
                        Official Helpline Number <span style={{ color: 'var(--color-primary)' }}>*</span>
                      </label>
                      <input
                        id="business_phone"
                        type="tel"
                        className={`form-input ${fieldErrors.business_phone ? 'is-invalid' : ''}`}
                        value={businessPhone}
                        onChange={(e) => setBusinessPhone(e.target.value)}
                        placeholder="+919876543210"
                        required
                      />
                      {fieldErrors.business_phone && (
                        <div style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                          {fieldErrors.business_phone}
                        </div>
                      )}
                      <div className="settings-input-hint">
                        Primary contact for applicant inquiries: {formatDisplayPhone(businessPhone) || 'Not set'}.
                      </div>
                    </div>
                  </div>

                  <div className="settings-grid-2 settings-field-group">
                    {/* Official Contact Email */}
                    <div>
                      <label htmlFor="business_email" className="settings-label">
                        Support Email Address
                      </label>
                      <input
                        id="business_email"
                        type="email"
                        className={`form-input ${fieldErrors.business_email ? 'is-invalid' : ''}`}
                        value={businessEmail}
                        onChange={(e) => setBusinessEmail(e.target.value)}
                        placeholder="contact@achintyamatrimony.com"
                      />
                      {fieldErrors.business_email && (
                        <div style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                          {fieldErrors.business_email}
                        </div>
                      )}
                      <div className="settings-input-hint">
                        Used for proposal notifications and official inquiries.
                      </div>
                    </div>

                    {/* Public Registration Link */}
                    <div>
                      <label className="settings-label">
                        Public Registration Portal Link
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="text"
                          readOnly
                          value={typeof window !== 'undefined' ? `${window.location.origin}/register` : 'http://localhost:3000/register'}
                          className="form-input"
                          style={{ backgroundColor: 'var(--color-surface-alt)', fontSize: '0.8125rem' }}
                        />
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="btn btn-outline btn-sm"
                          style={{ whiteSpace: 'nowrap', padding: '0 0.875rem' }}
                          title="Copy public registration URL"
                        >
                          {copiedLink ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </div>
                      <div className="settings-input-hint">
                        Direct link to the 4-step candidate onboarding form.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==============================================================================
                TAB 2: WHATSAPP AUTOMATION
                ============================================================================== */}
            {activeTab === 'whatsapp' && (
              <div>
                <div className="settings-header">
                  <h2 className="settings-title">WhatsApp Automation Template</h2>
                  <p className="settings-subtitle">
                    Customize the default introductory message pre-filled when counselors click the WhatsApp icon on member profiles.
                  </p>
                </div>

                <div className="settings-body">
                  {/* Dynamic Tags Bar */}
                  <div className="settings-field-group">
                    <label className="settings-label">
                      Insert Candidate Tags:
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.375rem' }}>
                      {[
                        { tag: '{{name}}', label: 'Name' },
                        { tag: '{{reg_id}}', label: 'ID' },
                        { tag: '{{business_name}}', label: 'Agency' },
                        { tag: '{{phone}}', label: 'Phone' },
                        { tag: '{{city}}', label: 'City' },
                      ].map((item) => (
                        <button
                          key={item.tag}
                          type="button"
                          onClick={() => handleInsertTag(item.tag)}
                          className="tag-chip"
                          title={`Insert ${item.tag}`}
                        >
                          + {item.tag} <span style={{ opacity: 0.65 }}>({item.label})</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Template Textarea */}
                  <div className="settings-field-group">
                    <textarea
                      ref={templateInputRef}
                      rows={5}
                      className={`form-textarea ${fieldErrors.default_whatsapp_template ? 'is-invalid' : ''}`}
                      value={whatsappTemplate}
                      onChange={(e) => setWhatsappTemplate(e.target.value)}
                      placeholder="Enter WhatsApp template..."
                      style={{ width: '100%', fontSize: '0.875rem', lineHeight: 1.5 }}
                    />
                    {fieldErrors.default_whatsapp_template && (
                      <div style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        {fieldErrors.default_whatsapp_template}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '0.375rem' }}>
                      <span>Tags are automatically replaced with candidate data upon click.</span>
                      <span>{whatsappTemplate.length} / 800 chars</span>
                    </div>
                  </div>

                  {/* Quick Presets Selector */}
                  <div className="settings-field-group" style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '1.25rem' }}>
                    <label className="settings-label" style={{ marginBottom: '0.625rem' }}>
                      Quick Template Presets:
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {PRESET_TEMPLATES.map((preset) => (
                        <button
                          key={preset.title}
                          type="button"
                          onClick={() => setWhatsappTemplate(preset.text)}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.8125rem', padding: '0.35rem 0.75rem' }}
                          title={preset.description}
                        >
                          {preset.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Realistic WhatsApp Live Preview */}
                  <div className="settings-field-group" style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '1.25rem' }}>
                    <label className="settings-label" style={{ marginBottom: '0.625rem' }}>
                      Live Message Preview (Sample Candidate: Aravind Swaminathan):
                    </label>
                    <div className="wa-preview-box">
                      <div className="wa-preview-header">
                        <div
                          style={{
                            width: '2rem',
                            height: '2rem',
                            borderRadius: '50%',
                            backgroundColor: '#128C7E',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.8125rem',
                          }}
                        >
                          AM
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {businessName || 'Achintya Matrimony'} Official
                          </div>
                          <div style={{ fontSize: '0.6875rem', opacity: 0.85 }}>
                            Verified Matchmaking Account • Online
                          </div>
                        </div>
                      </div>

                      <div className="wa-preview-chat">
                        <div className="wa-preview-bubble">
                          <div style={{ whiteSpace: 'pre-wrap' }}>{interpolatedPreview}</div>
                          <div
                            style={{
                              textAlign: 'right',
                              fontSize: '0.6875rem',
                              color: '#667781',
                              marginTop: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: '0.25rem',
                            }}
                          >
                            <span>Just now</span>
                            <span style={{ color: '#53BDEB' }}>✓✓</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==============================================================================
                TAB 3: REGIONAL & LOCALE
                ============================================================================== */}
            {activeTab === 'regional' && (
              <div>
                <div className="settings-header">
                  <h2 className="settings-title">Regional & Operational Preferences</h2>
                  <p className="settings-subtitle">
                    Configure timezone boundaries, registered today tracking intervals, and community matchmaking criteria.
                  </p>
                </div>

                <div className="settings-body">
                  <div className="settings-grid-2 settings-field-group">
                    <div>
                      <label htmlFor="timezone" className="settings-label">
                        Operating Timezone <span style={{ color: 'var(--color-primary)' }}>*</span>
                      </label>
                      <select
                        id="timezone"
                        className={`form-select ${fieldErrors.timezone ? 'is-invalid' : ''}`}
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                      >
                        {TIMEZONE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.timezone && (
                        <div style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                          {fieldErrors.timezone}
                        </div>
                      )}
                      <div className="settings-input-hint">
                        Current time in selected zone:{' '}
                        <strong>
                          {new Date().toLocaleTimeString('en-IN', { timeZone: timezone, hour12: true })}
                        </strong>
                      </div>
                    </div>

                    <div>
                      <label className="settings-label">
                        Registered Today Boundary
                      </label>
                      <div
                        style={{
                          padding: '0.75rem 1rem',
                          background: 'var(--color-surface-alt)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.8125rem',
                          color: 'var(--color-text-muted)',
                          lineHeight: 1.45,
                        }}
                      >
                        Overview counts use midnight-to-midnight (00:00 to 23:59) in <code>{timezone}</code>.
                      </div>
                    </div>
                  </div>

                  <div className="settings-field-group" style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '1.25rem' }}>
                    <label className="settings-label" style={{ marginBottom: '0.5rem' }}>
                      Primary Matrimonial Communities:
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {[
                        'Kongu Vellalar',
                        'Kavalkara Kulam',
                        'Porulanthai Kulam',
                        'Villayan Kulam',
                        'Sengunthar',
                        'Nadakkar',
                        'Brahmin / Iyer',
                        'Chettiar',
                      ].map((kulam) => (
                        <span
                          key={kulam}
                          style={{
                            padding: '0.25rem 0.625rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            backgroundColor: 'var(--color-surface-alt)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-main)',
                          }}
                        >
                          {kulam}
                        </span>
                      ))}
                    </div>
                    <div className="settings-input-hint" style={{ marginTop: '0.5rem' }}>
                      Applicants can filter verified profiles by Kulam and native town across Kongu Nadu and Tamil Nadu.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==============================================================================
                TAB 4: SYSTEM & DATA
                ============================================================================== */}
            {activeTab === 'system' && (
              <div>
                <div className="settings-header">
                  <h2 className="settings-title">System Health & Candidate Data Export</h2>
                  <p className="settings-subtitle">
                    Live database connection status, security compliance, and full directory backup.
                  </p>
                </div>

                <div className="settings-body">
                  {/* Clean 4-card metric row */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <div
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface-alt)',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>
                        Database Provider
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-green)' }}>
                        PostgreSQL (Active)
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface-alt)',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>
                        Total Profiles
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-primary)' }}>
                        {meta?.totalMembers ?? 0} Authoritative
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface-alt)',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>
                        Security Policy
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text-main)' }}>
                        RLS Strict Mode
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface-alt)',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>
                        Admin Session
                      </div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '0.8125rem',
                          color: 'var(--color-text-main)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {meta?.adminEmail || 'admin@achintya'}
                      </div>
                    </div>
                  </div>

                  {/* Directory Export Row */}
                  <div
                    style={{
                      borderTop: '1px solid var(--color-border-light)',
                      paddingTop: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-main)' }}>
                        Download Candidate Member Directory
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', marginTop: '0.125rem' }}>
                        Export an offline spreadsheet of all verified member profiles (sensitive health data excluded).
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleTriggerExport('xlsx')}
                        disabled={exportingFormat !== null}
                        className="btn btn-outline-green btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', whiteSpace: 'nowrap' }}
                        title="Download verified member directory as compressed Excel spreadsheet (.xlsx)"
                      >
                        {exportingFormat === 'xlsx' ? (
                          <>
                            <span
                              style={{
                                display: 'inline-block',
                                width: '0.75rem',
                                height: '0.75rem',
                                border: '2px solid var(--color-green)',
                                borderTopColor: 'transparent',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                              }}
                            />
                            <span>Downloading XLSX...</span>
                          </>
                        ) : (
                          <span>📥 Export Excel (.xlsx)</span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTriggerExport('csv')}
                        disabled={exportingFormat !== null}
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', whiteSpace: 'nowrap' }}
                        title="Download universal UTF-8 CSV spreadsheet (.csv) compatible with all devices and spreadsheet apps"
                      >
                        {exportingFormat === 'csv' ? (
                          <>
                            <span
                              style={{
                                display: 'inline-block',
                                width: '0.75rem',
                                height: '0.75rem',
                                border: '2px solid var(--color-primary)',
                                borderTopColor: 'transparent',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                              }}
                            />
                            <span>Downloading CSV...</span>
                          </>
                        ) : (
                          <span>📄 Export CSV (.csv)</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Save Action Dock */}
            <div className="settings-save-dock">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                {isDirty ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--color-warning)',
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-warning)',
                        display: 'inline-block',
                      }}
                    />
                    Unsaved Changes
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      color: 'var(--color-green)',
                    }}
                  >
                    ✓ Settings In Sync With Database
                  </span>
                )}
                {initialSettings?.updated_at && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', display: 'none' }}>
                    {new Date(initialSettings.updated_at).toLocaleDateString('en-IN', { timeZone: timezone })}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!isDirty || isSaving}
                  className="btn btn-outline btn-sm"
                  style={{ minWidth: '80px', opacity: !isDirty ? 0.5 : 1 }}
                >
                  Discard
                </button>

                <button
                  type="submit"
                  disabled={isSaving || !isDirty}
                  className="btn btn-primary btn-sm"
                  style={{
                    minWidth: '130px',
                    opacity: !isDirty ? 0.6 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                  }}
                >
                  {isSaving ? (
                    <>
                      <span
                        style={{
                          display: 'inline-block',
                          width: '0.875rem',
                          height: '0.875rem',
                          border: '2px solid rgba(255,255,255,0.4)',
                          borderTopColor: '#FFFFFF',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
