import Link from 'next/link';

interface PublicHeaderProps {
  businessPhone?: string;
  businessName?: string;
}

export function PublicHeader({
  businessPhone = '+919876543210',
  businessName = 'Achintya Matrimony',
}: PublicHeaderProps) {
  const cleanPhone = businessPhone.replace(/[^0-9+]/g, '');

  return (
    <header className="public-header">
      <div className="container public-header-inner">
        <Link href="/" className="brand-logo" aria-label="Achintya Matrimony Home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/achintya-logo.jpg"
            alt="Achintya Matrimony Crest"
            className="brand-logo-img"
          />
          <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--color-primary)' }}>
            {businessName}
          </span>
        </Link>


        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a
            href={`tel:${cleanPhone}`}
            className="btn btn-gold btn-sm"
            aria-label="Call business"
          >
            📞 Call Now
          </a>
        </div>
      </div>
    </header>
  );
}
