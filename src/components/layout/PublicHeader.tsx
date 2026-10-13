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
          <div className="brand-emblem">अ</div>
          <span>{businessName}</span>
        </Link>

        <nav className="public-nav">
          <Link href="/" className="nav-link">
            Home
          </Link>
          <Link href="/register" className="nav-link">
            Register
          </Link>
          <Link href="/contact" className="nav-link">
            Contact
          </Link>
          <Link href="/privacy" className="nav-link">
            Privacy Policy
          </Link>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a
            href={`tel:${cleanPhone}`}
            className="btn btn-gold btn-sm"
            aria-label="Call business"
          >
            📞 Call Now
          </a>
          <Link
            href="/login"
            className="btn btn-outline btn-sm"
            title="Administrator Login"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </header>
  );
}
