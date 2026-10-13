import Link from 'next/link';

export default function RegistrationSuccessPlaceholderPage() {
  return (
    <div style={{ padding: '4rem 0' }}>
      <div className="container container-narrow">
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div
            style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              backgroundColor: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1.5rem',
              border: '1px solid var(--color-success-border)',
            }}
          >
            ✓
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2rem',
              color: 'var(--color-primary)',
              marginBottom: '0.75rem',
            }}
          >
            Registration Successfully Received
          </h1>

          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
            Thank you for registering with Achintya Matrimony. Your profile has been securely recorded. Our counseling team will review your preferences and get in touch with you shortly.
          </p>

          <div
            style={{
              backgroundColor: 'var(--color-surface-alt)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              maxWidth: '360px',
              margin: '0 auto 2rem',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
              Your Registration Reference ID
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.05em' }}>
              AM-XXXX (Sample)
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <a href="tel:+919876543210" className="btn btn-gold btn-lg">
              📞 Call Now for Immediate Assistance
            </a>
            <Link href="/" className="btn btn-secondary btn-lg">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
