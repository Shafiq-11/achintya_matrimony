interface PublicFooterProps {
  businessName?: string;
  businessPhone?: string;
}

export function PublicFooter({
  businessName = 'Achintya Matrimony',
  businessPhone = '+919876543210',
}: PublicFooterProps) {
  const currentYear = 2026;

  return (
    <footer className="public-footer">
      <div className="container footer-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/achintya-logo.jpg"
            alt="Achintya Matrimony"
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '50%',
              border: '1.5px solid var(--color-gold)',
              objectFit: 'cover',
            }}
          />
          <span style={{ fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--color-primary)', fontSize: '1.0625rem', letterSpacing: '0.02em' }}>
            {businessName}
          </span>
        </div>

        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', maxWidth: '540px' }}>
          Connecting families with trust, respect, and confidentiality. Personalized matchmaking for discerning individuals.
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
          <a href={`tel:${businessPhone.replace(/[^0-9+]/g, '')}`} className="nav-link">
            Helpdesk: {businessPhone}
          </a>
        </div>

        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', borderTop: '1px solid var(--color-border-light)', width: '100%', paddingTop: '1.25rem' }}>
          © {currentYear} {businessName}. All rights reserved. Built for private matchmaking operations.
        </div>
      </div>
    </footer>
  );
}
