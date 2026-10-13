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
          <div
            className="brand-emblem"
            style={{
              width: '3.25rem',
              height: '3.25rem',
              fontSize: '1.6rem',
              margin: '0 auto 1rem',
              boxShadow: '0 4px 10px rgba(133, 20, 25, 0.2)',
            }}
          >
            अ
          </div>
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

        <div className="card">
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
