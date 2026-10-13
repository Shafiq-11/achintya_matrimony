'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Gender, MaritalStatus } from '@/lib/types';

interface FormData {
  full_name: string;
  gender: Gender | '';
  dob: string;
  phone: string;
  email: string;
  location_city: string;
  location_state: string;
  marital_status: MaritalStatus | '';
  religion: string;
  caste: string;
  mother_tongue: string;
  height_cm: string;
  education: string;
  occupation: string;
  annual_income: string;
  about_me: string;
  partner_preferences: string;
  consent_given: boolean;
  website_trap: string; // Honeypot field
}

const initialForm: FormData = {
  full_name: '',
  gender: '',
  dob: '',
  phone: '',
  email: '',
  location_city: '',
  location_state: '',
  marital_status: '',
  religion: '',
  caste: '',
  mother_tongue: '',
  height_cm: '',
  education: '',
  occupation: '',
  annual_income: '',
  about_me: '',
  partner_preferences: '',
  consent_given: false,
  website_trap: '',
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi / NCR', 'Other / NRI'
];

export function RegistrationForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    // Clear specific field error when user modifies it
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.full_name.trim() || form.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name is required (minimum 2 letters).';
    }

    if (!form.gender) {
      newErrors.gender = 'Please select a gender.';
    }

    if (!form.dob) {
      newErrors.dob = 'Date of birth is required.';
    } else {
      const dob = new Date(form.dob);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 18) {
        newErrors.dob = 'Applicant must be at least 18 years old.';
      } else if (age > 95) {
        newErrors.dob = 'Please provide a realistic date of birth.';
      }
    }

    const cleanPhone = form.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      newErrors.phone = 'Please provide a valid 10-digit mobile number.';
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please provide a valid email address.';
    }

    if (!form.location_city.trim()) {
      newErrors.location_city = 'City / Location is required.';
    }

    if (!form.location_state) {
      newErrors.location_state = 'Please select your state.';
    }

    if (!form.marital_status) {
      newErrors.marital_status = 'Please specify your marital status.';
    }

    if (!form.education.trim()) {
      newErrors.education = 'Highest education qualification is required.';
    }

    if (!form.consent_given) {
      newErrors.consent_given = 'Your consent is required to process your matrimony profile.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) {
      // Scroll to first error
      const firstErrorKey = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorKey);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setErrors(data.details);
        }
        setServerError(data.error || 'Failed to submit registration. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Success: redirect to confirmation page
      const regId = encodeURIComponent(data.regId || 'AM-PENDING');
      const name = encodeURIComponent(data.fullName || form.full_name);
      router.push(`/register/success?regId=${regId}&name=${name}`);
    } catch {
      setServerError('A network error occurred. Please check your internet connection and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Honeypot field (hidden from legitimate humans) */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <input
          type="text"
          name="website_trap"
          value={form.website_trap}
          onChange={handleChange}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {serverError && (
        <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>
          <span>⚠️</span>
          <div>
            <strong>Submission Error:</strong> {serverError}
          </div>
        </div>
      )}

      {/* SECTION 1: Personal Details */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <h2 className="card-title">1. Personal Information</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label htmlFor="full_name" className="form-label">
                Full Name <span className="required">*</span>
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="e.g. Aditi Sharma / Rahul Verma"
                className="form-input"
                value={form.full_name}
                onChange={handleChange}
                aria-invalid={!!errors.full_name}
              />
              {errors.full_name && <p className="form-error">{errors.full_name}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="gender" className="form-label">
                Gender <span className="required">*</span>
              </label>
              <select
                id="gender"
                name="gender"
                className="form-select"
                value={form.gender}
                onChange={handleChange}
                aria-invalid={!!errors.gender}
              >
                <option value="">Select Gender</option>
                <option value="Female">Female (Bride)</option>
                <option value="Male">Male (Groom)</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className="form-error">{errors.gender}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="dob" className="form-label">
                Date of Birth <span className="required">*</span>
              </label>
              <input
                id="dob"
                name="dob"
                type="date"
                className="form-input"
                value={form.dob}
                onChange={handleChange}
                aria-invalid={!!errors.dob}
              />
              {errors.dob && <p className="form-error">{errors.dob}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="height_cm" className="form-label">
                Height (in cm)
              </label>
              <input
                id="height_cm"
                name="height_cm"
                type="number"
                min="100"
                max="240"
                placeholder="e.g. 165 (5'5'')"
                className="form-input"
                value={form.height_cm}
                onChange={handleChange}
              />
              <p className="form-hint">Optional (approximate height)</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Contact & Location */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <h2 className="card-title">2. Contact & Geographic Location</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Mobile Number (WhatsApp) <span className="required">*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    padding: '0.625rem 0.75rem',
                    backgroundColor: 'var(--color-surface-alt)',
                    border: '1px solid var(--color-border)',
                    borderRight: 'none',
                    borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  +91
                </span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  className="form-input"
                  style={{ borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}
                  value={form.phone}
                  onChange={handleChange}
                  aria-invalid={!!errors.phone}
                />
              </div>
              {errors.phone && <p className="form-error">{errors.phone}</p>}
              <p className="form-hint">Primary number for counselor verification and WhatsApp call</p>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                className="form-input"
                value={form.email}
                onChange={handleChange}
                aria-invalid={!!errors.email}
              />
              {errors.email && <p className="form-error">{errors.email}</p>}
              <p className="form-hint">Optional, for digital acknowledgements</p>
            </div>

            <div className="form-group">
              <label htmlFor="location_city" className="form-label">
                Current City / Town <span className="required">*</span>
              </label>
              <input
                id="location_city"
                name="location_city"
                type="text"
                placeholder="e.g. Pune / Mumbai / Bangalore"
                className="form-input"
                value={form.location_city}
                onChange={handleChange}
                aria-invalid={!!errors.location_city}
              />
              {errors.location_city && <p className="form-error">{errors.location_city}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="location_state" className="form-label">
                State <span className="required">*</span>
              </label>
              <select
                id="location_state"
                name="location_state"
                className="form-select"
                value={form.location_state}
                onChange={handleChange}
                aria-invalid={!!errors.location_state}
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              {errors.location_state && <p className="form-error">{errors.location_state}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Community & Social Background */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <h2 className="card-title">3. Matrimonial & Community Background</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label htmlFor="marital_status" className="form-label">
                Marital Status <span className="required">*</span>
              </label>
              <select
                id="marital_status"
                name="marital_status"
                className="form-select"
                value={form.marital_status}
                onChange={handleChange}
                aria-invalid={!!errors.marital_status}
              >
                <option value="">Select Status</option>
                <option value="Never Married">Never Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
                <option value="Awaiting Divorce">Awaiting Divorce</option>
                <option value="Annulled">Annulled</option>
              </select>
              {errors.marital_status && <p className="form-error">{errors.marital_status}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="religion" className="form-label">
                Religion
              </label>
              <input
                id="religion"
                name="religion"
                type="text"
                placeholder="e.g. Hindu / Jain / Sikh / Christian"
                className="form-input"
                value={form.religion}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="caste" className="form-label">
                Caste / Community / Sub-caste
              </label>
              <input
                id="caste"
                name="caste"
                type="text"
                placeholder="e.g. Brahmin / Maratha / Vaishya / Open to all"
                className="form-input"
                value={form.caste}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="mother_tongue" className="form-label">
                Mother Tongue
              </label>
              <input
                id="mother_tongue"
                name="mother_tongue"
                type="text"
                placeholder="e.g. Hindi / Marathi / Gujarati / Telugu"
                className="form-input"
                value={form.mother_tongue}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Education & Profession */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <h2 className="card-title">4. Education & Career</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label htmlFor="education" className="form-label">
                Highest Education <span className="required">*</span>
              </label>
              <input
                id="education"
                name="education"
                type="text"
                placeholder="e.g. B.Tech, MBA, M.Com, MBBS, CA"
                className="form-input"
                value={form.education}
                onChange={handleChange}
                aria-invalid={!!errors.education}
              />
              {errors.education && <p className="form-error">{errors.education}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="occupation" className="form-label">
                Occupation / Profession
              </label>
              <input
                id="occupation"
                name="occupation"
                type="text"
                placeholder="e.g. Software Engineer, Business Owner, Doctor, Civil Services"
                className="form-input"
                value={form.occupation}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="annual_income" className="form-label">
                Annual Income (Approximate)
              </label>
              <input
                id="annual_income"
                name="annual_income"
                type="text"
                placeholder="e.g. 10 - 15 LPA / Disclose during call"
                className="form-input"
                value={form.annual_income}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: Bio & Preferences */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <h2 className="card-title">5. About & Partner Preferences</h2>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label htmlFor="about_me" className="form-label">
              About Yourself & Family Background
            </label>
            <textarea
              id="about_me"
              name="about_me"
              rows={3}
              placeholder="Brief overview of personality, family values, hobbies, or background..."
              className="form-textarea"
              value={form.about_me}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="partner_preferences" className="form-label">
              Expectations / Desired Partner Qualities
            </label>
            <textarea
              id="partner_preferences"
              name="partner_preferences"
              rows={3}
              placeholder="Preferred age bracket, education, location preference, values, etc..."
              className="form-textarea"
              value={form.partner_preferences}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* SECTION 6: Consent & Submission */}
      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
            <input
              id="consent_given"
              name="consent_given"
              type="checkbox"
              checked={form.consent_given}
              onChange={handleChange}
              style={{ marginTop: '0.25rem', width: '1.25rem', height: '1.25rem', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />
            <label htmlFor="consent_given" style={{ fontSize: '0.9375rem', color: 'var(--color-text-main)', cursor: 'pointer' }}>
              I hereby declare that the information provided is accurate to the best of my knowledge. I authorize Achintya Matrimony counselors to contact me via phone or WhatsApp regarding prospective matrimonial proposals. <span className="required">*</span>
            </label>
          </div>
          {errors.consent_given && <p className="form-error" style={{ marginBottom: '1rem' }}>{errors.consent_given}</p>}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-light)' }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔒 Confidential & encrypted. No public directory listing.</span>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isSubmitting}
              style={{ minWidth: '220px' }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" style={{ width: '1.1rem', height: '1.1rem', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#ffffff' }} />
                  Saving Profile...
                </>
              ) : (
                'Submit Registration →'
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
