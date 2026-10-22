'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Gender, MaritalStatus, PublicRegistrationPayload } from '@/lib/types';

interface FormData {
  // Section A: Personal Details
  full_name: string;
  gender: Gender | '';
  dob: string;
  phone: string;
  email: string;
  marital_status: MaritalStatus | '';
  siblings: string;
  kulam: string;
  height_cm: string;

  // Section B: Education and Family
  college_name: string;
  college_degree: string;
  school_name: string;
  education_other: string;
  parents_details: string;
  parents_origin: string;
  place_of_living: string;
  location_state: string;

  // Section C: Work and Financial Details
  employment_status: string;
  employer_name: string;
  job_title: string;
  salary_info: string;
  business_details: string;
  property_details: string;
  monthly_income: string;
  passive_income: string;
  passive_income_type: 'monthly' | 'annual';
  linkedin_url: string;

  // Section D: Health Information
  health_info: string;
  health_consent_given: boolean;

  // Consent & Spam Protection
  consent_given: boolean;
  website_trap: string; // Honeypot field
}

const initialForm: FormData = {
  full_name: '',
  gender: '',
  dob: '',
  phone: '',
  email: '',
  marital_status: 'Never Married',
  siblings: '',
  kulam: '',
  height_cm: '',

  college_name: '',
  college_degree: '',
  school_name: '',
  education_other: '',
  parents_details: '',
  parents_origin: '',
  place_of_living: '',
  location_state: 'Tamil Nadu',

  employment_status: 'Salaried',
  employer_name: '',
  job_title: '',
  salary_info: '',
  business_details: '',
  property_details: '',
  monthly_income: '',
  passive_income: '',
  passive_income_type: 'monthly',
  linkedin_url: '',

  health_info: '',
  health_consent_given: false,

  consent_given: false,
  website_trap: '',
};

const INDIAN_STATES = [
  'Tamil Nadu', 'Karnataka', 'Kerala', 'Andhra Pradesh', 'Telangana', 'Maharashtra',
  'Gujarat', 'Delhi / NCR', 'Uttar Pradesh', 'West Bengal', 'Rajasthan', 'Madhya Pradesh',
  'Punjab', 'Haryana', 'Bihar', 'Odisha', 'Goa', 'Assam', 'Other / Overseas NRI'
];

const EMPLOYMENT_STATUS_OPTIONS = [
  'Salaried',
  'Business Owner / Entrepreneur',
  'Self-Employed / Professional',
  'Civil Services / Government',
  'Homemaker',
  'Not Employed / Seeking Opportunities',
  'Other'
];

export function RegistrationForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Computed Age from DOB (Timezone-safe)
  const calculatedAge = useMemo(() => {
    if (!form.dob) return null;
    const parts = form.dob.split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    const today = new Date();
    let age = today.getFullYear() - year;
    const m = today.getMonth() - month;
    if (m < 0 || (m === 0 && today.getDate() < day)) {
      age--;
    }
    return age;
  }, [form.dob]);

  // Height helper in feet and inches
  const heightInFeetInches = useMemo(() => {
    const cm = Number(form.height_cm);
    if (!cm || isNaN(cm) || cm < 90 || cm > 250) return null;
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet} ft ${inches} in`;
  }, [form.height_cm]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'phone') {
      // Smart Indian phone normalizer: strip non-digits and normalize +91 / 0 prefix
      let digits = value.replace(/\D/g, '');
      if (digits.length > 10) {
        if (digits.startsWith('91') && digits.length === 12) {
          digits = digits.slice(2);
        } else if (digits.startsWith('0') && digits.length === 11) {
          digits = digits.slice(1);
        } else if (digits.length > 10) {
          digits = digits.slice(-10);
        }
      }
      setForm((prev) => ({ ...prev, phone: digits }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

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

    // Section A Validation
    if (!form.full_name.trim() || form.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name is required (minimum 2 letters).';
    }

    if (!form.gender) {
      newErrors.gender = 'Please select your gender.';
    }

    if (!form.dob) {
      newErrors.dob = 'Date of birth is required.';
    } else {
      const dobDate = new Date(form.dob);
      const today = new Date();
      if (dobDate > today) {
        newErrors.dob = 'Date of birth cannot be in the future.';
      } else if (calculatedAge !== null && calculatedAge < 18) {
        newErrors.dob = 'Applicant must be at least 18 years old to register.';
      } else if (calculatedAge !== null && calculatedAge > 90) {
        newErrors.dob = 'Please provide a realistic date of birth.';
      }
    }

    const cleanPhone = form.phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      newErrors.phone = 'Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'Please provide a valid email address.';
    }

    if (form.height_cm) {
      const h = Number(form.height_cm);
      if (isNaN(h) || h < 90 || h > 250) {
        newErrors.height_cm = 'Please enter a valid height between 90 and 250 cm.';
      }
    }

    // Section B Validation
    if (!form.place_of_living.trim()) {
      newErrors.place_of_living = 'Place of living (Town / City) is required.';
    }

    // Section C Validation
    if (form.monthly_income) {
      const income = Number(form.monthly_income);
      if (isNaN(income) || income < 0) {
        newErrors.monthly_income = 'Monthly income cannot be negative.';
      }
    }

    if (form.passive_income) {
      const passive = Number(form.passive_income);
      if (isNaN(passive) || passive < 0) {
        newErrors.passive_income = 'Passive income cannot be negative.';
      }
    }

    if (form.linkedin_url && form.linkedin_url.trim()) {
      const url = form.linkedin_url.trim();
      if (!/^https?:\/\/(www\.)?linkedin\.com\/.*$/i.test(url)) {
        newErrors.linkedin_url = 'Please provide a valid LinkedIn profile URL (e.g. https://www.linkedin.com/in/yourname).';
      }
    }

    // Section D Validation
    if (form.health_info.trim() && !form.health_consent_given) {
      newErrors.health_consent_given = 'Please provide your consent to process disclosed health information, or clear the health field.';
    }

    // General Consent
    if (!form.consent_given) {
      newErrors.consent_given = 'Your consent is required to process your matrimony profile and receive proposal calls.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) {
      const firstErrorKey = Object.keys(errors)[0] || 'full_name';
      const element = document.getElementById(firstErrorKey);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: PublicRegistrationPayload = {
        full_name: form.full_name.trim(),
        gender: form.gender as Gender,
        dob: form.dob,
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        marital_status: form.marital_status || 'Never Married',
        siblings: form.siblings.trim() || undefined,
        kulam: form.kulam.trim() || undefined,
        height_cm: form.height_cm ? Number(form.height_cm) : undefined,

        college_name: form.college_name.trim() || undefined,
        college_degree: form.college_degree.trim() || undefined,
        school_name: form.school_name.trim() || undefined,
        education_other: form.education_other.trim() || undefined,
        parents_details: form.parents_details.trim() || undefined,
        parents_origin: form.parents_origin.trim() || undefined,
        place_of_living: form.place_of_living.trim(),
        location_city: form.place_of_living.trim(),
        location_state: form.location_state,

        employment_status: form.employment_status || undefined,
        employer_name: form.employer_name.trim() || undefined,
        job_title: form.job_title.trim() || undefined,
        salary_info: form.salary_info.trim() || undefined,
        business_details: form.business_details.trim() || undefined,
        property_details: form.property_details.trim() || undefined,
        monthly_income: form.monthly_income ? Number(form.monthly_income) : undefined,
        passive_income: form.passive_income ? Number(form.passive_income) : undefined,
        passive_income_type: form.passive_income_type,
        linkedin_url: form.linkedin_url.trim() || undefined,

        health_info: form.health_info.trim() || undefined,
        health_consent_given: form.health_consent_given,

        consent_given: true,
        website_trap: form.website_trap,
      };

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setErrors(data.details);
        }
        setServerError(data.error || 'Failed to submit registration. Please correct the highlighted fields.');
        setIsSubmitting(false);
        return;
      }

      const regId = encodeURIComponent(data.regId || 'AM-CONFIRMED');
      const name = encodeURIComponent(data.fullName || form.full_name);
      router.push(`/register/success?regId=${regId}&name=${name}`);
    } catch {
      setServerError('A network connectivity error occurred. Please check your internet connection and try again.');
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
            <strong>Registration Notice:</strong> {serverError}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION A: Personal Details */}
      {/* ==================================================================== */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <h2 className="card-title">Section A — Personal Details</h2>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Core Identity & Family Lineage</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {/* 1. Full Name */}
            <div className="form-group">
              <label htmlFor="full_name" className="form-label">
                1. Full Name <span className="required">*</span>
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="e.g. Anandha Kumar / Priyadarshini"
                className="form-input"
                value={form.full_name}
                onChange={handleChange}
                aria-invalid={!!errors.full_name}
              />
              {errors.full_name && <p className="form-error">{errors.full_name}</p>}
            </div>

            {/* Gender */}
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

            {/* 2. Date of Birth */}
            <div className="form-group">
              <label htmlFor="dob" className="form-label">
                2. Date of Birth <span className="required">*</span>
                {calculatedAge !== null && calculatedAge >= 0 && (
                  <span style={{ marginLeft: '0.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    ({calculatedAge} years old)
                  </span>
                )}
              </label>
              <input
                id="dob"
                name="dob"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                className="form-input"
                value={form.dob}
                onChange={handleChange}
                aria-invalid={!!errors.dob}
              />
              {errors.dob && <p className="form-error">{errors.dob}</p>}
            </div>

            {/* Mobile Phone (WhatsApp) */}
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
                  maxLength={16}
                  placeholder="9876543210"
                  className="form-input"
                  style={{ borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}
                  value={form.phone}
                  onChange={handleChange}
                  aria-invalid={!!errors.phone}
                />
              </div>
              {errors.phone && <p className="form-error">{errors.phone}</p>}
              <p className="form-hint">For introductory counselor communication and match updates</p>
            </div>

            {/* Email Address */}
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

            {/* Marital Status */}
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
              >
                <option value="Never Married">Never Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
                <option value="Awaiting Divorce">Awaiting Divorce</option>
                <option value="Annulled">Annulled</option>
              </select>
            </div>

            {/* 3. Kulam */}
            <div className="form-group">
              <label htmlFor="kulam" className="form-label">
                3. Kulam
              </label>
              <input
                id="kulam"
                name="kulam"
                type="text"
                placeholder="e.g. Kongu Vellalar / Sengunthar / Pillai / Open"
                className="form-input"
                value={form.kulam}
                onChange={handleChange}
              />
              <p className="form-hint">Specify your native kulam / clan lineage</p>
            </div>

            {/* 4. Height */}
            <div className="form-group">
              <label htmlFor="height_cm" className="form-label">
                4. Height (in cm)
                {heightInFeetInches && (
                  <span style={{ marginLeft: '0.5rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    ({heightInFeetInches})
                  </span>
                )}
              </label>
              <input
                id="height_cm"
                name="height_cm"
                type="number"
                min="90"
                max="250"
                step="1"
                placeholder="e.g. 168 (approx. 5 ft 6 in)"
                className="form-input"
                value={form.height_cm}
                onChange={handleChange}
                aria-invalid={!!errors.height_cm}
              />
              {errors.height_cm && <p className="form-error">{errors.height_cm}</p>}
              <p className="form-hint">Measured in centimetres (reasonable range 90-250 cm)</p>
            </div>
          </div>

          {/* 5. Siblings */}
          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label htmlFor="siblings" className="form-label">
              5. Siblings (Count & Details)
            </label>
            <textarea
              id="siblings"
              name="siblings"
              rows={2}
              placeholder="e.g. 1 Elder Brother (Married, Software Engineer in Bangalore), 1 Younger Sister (Unmarried, Studying M.Sc)"
              className="form-textarea"
              value={form.siblings}
              onChange={handleChange}
            />
            <p className="form-hint">Mention number of brothers/sisters, their marital status, and occupations</p>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION B: Education and Family */}
      {/* ==================================================================== */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header" style={{ borderLeft: '4px solid var(--color-gold)' }}>
          <h2 className="card-title">Section B — Education and Family</h2>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Academics, Parents & Native Roots</span>
        </div>
        <div className="card-body">
          {/* 6. Education Details */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.75rem' }}>
              6. Education Details — College and School
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label htmlFor="college_degree" className="form-label">
                  College Qualification / Degree
                </label>
                <input
                  id="college_degree"
                  name="college_degree"
                  type="text"
                  placeholder="e.g. B.E Computer Science, MBA Finance, MBBS, CA"
                  className="form-input"
                  value={form.college_degree}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="college_name" className="form-label">
                  College / University Name
                </label>
                <input
                  id="college_name"
                  name="college_name"
                  type="text"
                  placeholder="e.g. PSG Tech Coimbatore / Anna University"
                  className="form-input"
                  value={form.college_name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="school_name" className="form-label">
                  School Name
                </label>
                <input
                  id="school_name"
                  name="school_name"
                  type="text"
                  placeholder="e.g. St. Joseph's Higher Secondary / Kendriya Vidyalaya"
                  className="form-input"
                  value={form.school_name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="education_other" className="form-label">
                  Other Education Details (Optional)
                </label>
                <input
                  id="education_other"
                  name="education_other"
                  type="text"
                  placeholder="e.g. Additional certifications, Diplomas, Online specializations"
                  className="form-input"
                  value={form.education_other}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* 7. Parents Details */}
          <div className="form-group">
            <label htmlFor="parents_details" className="form-label">
              7. Parents&apos; Details & Occupation
            </label>
            <textarea
              id="parents_details"
              name="parents_details"
              rows={2}
              placeholder="e.g. Father: K. Ramanathan (Retired Bank Manager), Mother: Lakshmi (Homemaker)"
              className="form-textarea"
              value={form.parents_details}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginTop: '1.25rem' }}>
            {/* 8. Parents Origin Details */}
            <div className="form-group">
              <label htmlFor="parents_origin" className="form-label">
                8. Parents&apos; Origin Details (Native Place)
              </label>
              <input
                id="parents_origin"
                name="parents_origin"
                type="text"
                placeholder="e.g. Erode / Dharapuram / Madurai native"
                className="form-input"
                value={form.parents_origin}
                onChange={handleChange}
              />
              <p className="form-hint">Ancestral town, village or native district</p>
            </div>

            {/* 9. Place of Living */}
            <div className="form-group">
              <label htmlFor="place_of_living" className="form-label">
                9. Place of Living (Current Town / City) <span className="required">*</span>
              </label>
              <input
                id="place_of_living"
                name="place_of_living"
                type="text"
                placeholder="e.g. Tirupur / Coimbatore / Chennai / Bengaluru"
                className="form-input"
                value={form.place_of_living}
                onChange={handleChange}
                aria-invalid={!!errors.place_of_living}
              />
              {errors.place_of_living && <p className="form-error">{errors.place_of_living}</p>}
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
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION C: Work and Financial Details */}
      {/* ==================================================================== */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <h2 className="card-title">Section C — Work and Financial Details</h2>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Career, Income & Assets (Optional)</span>
        </div>
        <div className="card-body">
          {/* Employment Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label htmlFor="employment_status" className="form-label">
                10. Employment Status
              </label>
              <select
                id="employment_status"
                name="employment_status"
                className="form-select"
                value={form.employment_status}
                onChange={handleChange}
              >
                {EMPLOYMENT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="employer_name" className="form-label">
                Employer / Company Name (If Salaried)
              </label>
              <input
                id="employer_name"
                name="employer_name"
                type="text"
                placeholder="e.g. Tata Consultancy Services / Private Ltd"
                className="form-input"
                value={form.employer_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="job_title" className="form-label">
                Job Title / Designation
              </label>
              <input
                id="job_title"
                name="job_title"
                type="text"
                placeholder="e.g. Senior Software Engineer / Finance Manager"
                className="form-input"
                value={form.job_title}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="salary_info" className="form-label">
                Salary Details (Optional)
              </label>
              <input
                id="salary_info"
                name="salary_info"
                type="text"
                placeholder="e.g. 14 LPA (Disclose during counselor call)"
                className="form-input"
                value={form.salary_info}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* 11. Business Details */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="business_details" className="form-label">
              11. Business Details (If applicable)
            </label>
            <textarea
              id="business_details"
              name="business_details"
              rows={2}
              placeholder="e.g. Textile Export & Garments Manufacturing in Tirupur, Operating since 2012, 45 Employees"
              className="form-textarea"
              value={form.business_details}
              onChange={handleChange}
            />
            <p className="form-hint">Business name, industry type, and key operational details</p>
          </div>

          {/* Incomes & Assets Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            {/* 12. Monthly Income */}
            <div className="form-group">
              <label htmlFor="monthly_income" className="form-label">
                12. Approximate Monthly Income (INR ₹)
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    padding: '0.625rem 0.75rem',
                    backgroundColor: 'var(--color-surface-alt)',
                    border: '1px solid var(--color-border)',
                    borderRight: 'none',
                    borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  ₹ INR
                </span>
                <input
                  id="monthly_income"
                  name="monthly_income"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="e.g. 100000"
                  className="form-input"
                  style={{ borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}
                  value={form.monthly_income}
                  onChange={handleChange}
                  aria-invalid={!!errors.monthly_income}
                />
              </div>
              {errors.monthly_income && <p className="form-error">{errors.monthly_income}</p>}
              <p className="form-hint">Optional. Stated in Indian Rupees (INR)</p>
            </div>

            {/* 13. Passive Income */}
            <div className="form-group">
              <label htmlFor="passive_income" className="form-label">
                13. Passive Income (INR ₹)
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  id="passive_income"
                  name="passive_income"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="e.g. 25000"
                  className="form-input"
                  style={{ borderRadius: 'var(--radius-md) 0 0 var(--radius-md)' }}
                  value={form.passive_income}
                  onChange={handleChange}
                  aria-invalid={!!errors.passive_income}
                />
                <select
                  id="passive_income_type"
                  name="passive_income_type"
                  className="form-select"
                  style={{ width: '130px', borderRadius: '0 var(--radius-md) var(--radius-md) 0', borderLeft: 'none' }}
                  value={form.passive_income_type}
                  onChange={handleChange}
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              {errors.passive_income && <p className="form-error">{errors.passive_income}</p>}
              <p className="form-hint">Rental, agricultural, or dividend yield (separate from salary)</p>
            </div>

            {/* 14. LinkedIn ID */}
            <div className="form-group">
              <label htmlFor="linkedin_url" className="form-label">
                14. LinkedIn Profile URL (If Available)
              </label>
              <input
                id="linkedin_url"
                name="linkedin_url"
                type="url"
                placeholder="https://www.linkedin.com/in/username"
                className="form-input"
                value={form.linkedin_url}
                onChange={handleChange}
                aria-invalid={!!errors.linkedin_url}
              />
              {errors.linkedin_url && <p className="form-error">{errors.linkedin_url}</p>}
            </div>
          </div>

          {/* 15. Property Details */}
          <div className="form-group">
            <label htmlFor="property_details" className="form-label">
              15. Property & Asset Details (Optional)
            </label>
            <textarea
              id="property_details"
              name="property_details"
              rows={2}
              placeholder="e.g. Own residential house in Coimbatore, 5 acres agricultural land in native village"
              className="form-textarea"
              value={form.property_details}
              onChange={handleChange}
            />
            <p className="form-hint">Optional overview of residential properties or agricultural holdings</p>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION D: Health Information */}
      {/* ==================================================================== */}
      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <div className="card-header" style={{ borderLeft: '4px solid var(--color-gold)' }}>
          <h2 className="card-title">Section D — Health Information</h2>
          <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>🔒 Strict Counselor Confidentiality</span>
        </div>
        <div className="card-body">
          {/* Explanation Alert */}
          <div className="alert alert-info" style={{ marginBottom: '1.25rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
            <strong>Why we request this information:</strong> Matrimonial relationships flourish on mutual honesty and trust. You may optionally disclose relevant physical disabilities, major medical surgeries, or ongoing regular treatments. This information is <strong>strictly confidential</strong>, visible only to authorized counselors, and <strong>never published on public pages, search results, or exported spreadsheets</strong>.
          </div>

          {/* 16. Health Info Text Area */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="health_info" className="form-label">
              16. Health Information (Optional)
            </label>
            <textarea
              id="health_info"
              name="health_info"
              rows={3}
              placeholder="If applicable, disclose physical challenges, major surgeries, or ongoing medications (Leave blank if not applicable)..."
              className="form-textarea"
              value={form.health_info}
              onChange={handleChange}
            />
          </div>

          {/* Health Consent Checkbox */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.5rem', backgroundColor: 'var(--color-surface-alt)', padding: '0.875rem', borderRadius: 'var(--radius-md)' }}>
            <input
              id="health_consent_given"
              name="health_consent_given"
              type="checkbox"
              checked={form.health_consent_given}
              onChange={handleChange}
              style={{ marginTop: '0.25rem', width: '1.2rem', height: '1.2rem', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />
            <label htmlFor="health_consent_given" style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', cursor: 'pointer' }}>
              I voluntarily consent to Achintya Matrimony counselors recording and processing any health disclosures strictly for private matchmaking consultations.
            </label>
          </div>
          {errors.health_consent_given && <p className="form-error" style={{ marginBottom: '1rem' }}>{errors.health_consent_given}</p>}

          {/* Mandatory Submission Consent */}
          <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <input
                id="consent_given"
                name="consent_given"
                type="checkbox"
                checked={form.consent_given}
                onChange={handleChange}
                style={{ marginTop: '0.25rem', width: '1.25rem', height: '1.25rem', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
              <label htmlFor="consent_given" style={{ fontSize: '0.9375rem', color: 'var(--color-text-main)', cursor: 'pointer', fontWeight: 500 }}>
                I hereby declare that the details provided in Sections A to D are accurate. I authorize Achintya Matrimony counselors to contact me via phone or WhatsApp regarding suitable matrimonial proposals. <span className="required">*</span>
              </label>
            </div>
            {errors.consent_given && <p className="form-error" style={{ marginTop: '0.5rem' }}>{errors.consent_given}</p>}
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              🔒 No account registration required • Your profile is private & Counselor-verified
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isSubmitting}
              style={{ minWidth: '240px' }}
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
