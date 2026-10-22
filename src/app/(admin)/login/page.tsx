import { Suspense } from 'react';
import { LoginForm } from '@/components/forms/LoginForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const metadata = {
  title: 'Administrator Login | Achintya Matrimony CRM',
  description: 'Authorized administrator login for Achintya Matrimony CRM.',
};

export default function AdminLoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/achintya-logo.jpg"
            alt="Achintya Matrimony"
            style={{
              width: '4.5rem',
              height: '4.5rem',
              borderRadius: '50%',
              border: '2.5px solid var(--color-gold)',
              boxShadow: '0 4px 12px rgba(148, 27, 43, 0.2)',
              margin: '0 auto 1rem',
              display: 'block',
              objectFit: 'cover',
            }}
          />
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.875rem',
              color: 'var(--color-primary)',
              marginBottom: '0.35rem',
            }}
          >
            Achintya Matrimony
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Authorized Administrator Access Only
          </p>
        </div>

        <div className="card" style={{ borderTop: '3px solid var(--color-primary)' }}>
          <div className="card-body" style={{ padding: '2rem' }}>
            <Suspense fallback={<LoadingSpinner label="Loading login interface..." />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
          🔒 Protected session with Row Level Security (RLS) enforcement.
        </div>
      </div>
    </div>
  );
}
