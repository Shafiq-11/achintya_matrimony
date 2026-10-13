import Link from 'next/link';

export default function RegisterPlaceholderPage() {
  return (
    <div style={{ padding: '3.5rem 0' }}>
      <div className="container container-narrow">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.25rem',
              color: 'var(--color-primary)',
              marginBottom: '0.5rem',
            }}
          >
            Matrimony Registration Form
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Complete your matrimonial profile. Your data is handled with strict confidentiality.
          </p>
        </div>

        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Phase 02 Registration Module
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
              The full multi-field public registration form with instant client-side validation, server-side duplicate checks, and unique registration ID generation will be implemented in Phase 02.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link href="/" className="btn btn-secondary">
                ← Return to Home
              </Link>
              <a href="tel:+919876543210" className="btn btn-gold">
                📞 Call Us Directly
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
