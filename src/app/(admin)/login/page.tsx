import Link from 'next/link';

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
            style={{ width: '3rem', height: '3rem', fontSize: '1.5rem', margin: '0 auto 1rem' }}
          >
            अ
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.75rem',
              color: 'var(--color-primary)',
              marginBottom: '0.25rem',
            }}
          >
            Achintya Matrimony
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Authorized Administrator Access Only
          </p>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="alert alert-info" style={{ fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
              <div>
                <strong>Phase 03 Authentication Foundation:</strong> Real Supabase authentication, session cookies, and login credentials processing will be integrated in Phase 03.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Administrator Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="admin@achintyamatrimony.com"
                disabled
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••••••"
                disabled
              />
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled
            >
              Sign In to CRM Dashboard
            </button>
          </div>

          <div className="card-footer" style={{ textAlign: 'center' }}>
            <Link href="/" className="nav-link" style={{ fontSize: '0.8125rem' }}>
              ← Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
