import { Suspense } from 'react';
import { RegistrationForm } from '@/components/forms/RegistrationForm';
import Link from 'next/link';

export const metadata = {
  title: 'Register Profile | Achintya Matrimony',
  description:
    'Confidential matrimony registration form. Submit your matrimonial preferences to our matchmaking team.',
};

export default function RegisterPage() {
  return (
    <div style={{ padding: '3.5rem 0 5rem' }}>
      <div className="container container-narrow">
        {/* Header Introduction */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div
            className="badge badge-gold"
            style={{
              marginBottom: '1rem',
              padding: '0.35rem 0.85rem',
            }}
          >
            📋 Prospective Member Registration
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.5rem',
              color: 'var(--color-primary)',
              marginBottom: '0.75rem',
            }}
          >
            Matrimonial Profile Application
          </h1>

          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', maxWidth: '620px', margin: '0 auto' }}>
            Please fill out your verified details below. Your submission is recorded confidentially and handled exclusively by our private matchmaking counselors.
          </p>

          <div
            style={{
              marginTop: '1.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 1rem',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--color-border)',
              fontSize: '0.8125rem',
              color: 'var(--color-text-muted)',
            }}
          >
            <span>Need assistance filling this form?</span>
            <a href="tel:+919876543210" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
              📞 Call +91 98765 43210
            </a>
          </div>
        </div>

        {/* Form Container */}
        <Suspense
          fallback={
            <div
              className="card card-premium"
              style={{
                padding: '3.5rem 2rem',
                minHeight: '360px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                marginBottom: '2rem',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  border: '3px solid var(--color-border)',
                  borderTopColor: 'var(--color-primary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '1rem',
                }}
              />
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', fontWeight: 500 }}>
                Loading application form...
              </p>
            </div>
          }
        >
          <RegistrationForm />
        </Suspense>

        {/* Footer Reminder */}
        <div style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--color-text-light)' }}>
          By submitting this form, you acknowledge our{' '}
          <Link href="/privacy" style={{ textDecoration: 'underline', color: 'var(--color-text-muted)' }}>
            Privacy & Confidentiality Policy
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
