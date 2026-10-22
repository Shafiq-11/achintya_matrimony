import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ padding: '4rem 0 5rem' }}>
      <div className="container">
        {/* Hero Section */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto' }}>
          {/* Official Brand Medallion */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.75rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/achintya-logo.jpg"
              alt="Achintya Matrimony Crest"
              style={{
                width: '6.5rem',
                height: '6.5rem',
                borderRadius: '50%',
                border: '3px solid var(--color-gold)',
                boxShadow: '0 6px 16px rgba(148, 27, 43, 0.16)',
                objectFit: 'cover',
              }}
            />
          </div>

          <div
            className="badge badge-gold"
            style={{
              marginBottom: '1rem',
              padding: '0.35rem 0.85rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
          >
            ⚜️ Traditional Values • Discerning Matchmaking
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.75rem',
              lineHeight: 1.2,
              color: 'var(--color-primary)',
              marginBottom: '1.25rem',
            }}
          >
            Find Your Ideal Life Partner with Trust & Discretion
          </h1>

          <p
            style={{
              fontSize: '1.125rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1.7,
              marginBottom: '2.5rem',
            }}
          >
            Achintya Matrimony offers personalized matchmaking based on mutual values, background, and life expectations. Share your profile directly with our confidential matchmaking team.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link href="/register" className="btn btn-primary btn-lg">
              Begin Free Registration →
            </Link>
            <a
              href="tel:+919876543210"
              className="btn btn-gold btn-lg"
            >
              📞 Speak with Counselor
            </a>
          </div>
        </div>

        {/* Value Highlights */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginTop: '5rem',
          }}
        >
          <div className="card" style={{ borderTop: '3px solid var(--color-gold)' }}>
            <div className="card-body">
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem', color: 'var(--color-primary)' }}>🔒</div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                100% Privacy Assured
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
                Your personal and contact information is kept strictly confidential within our verified matrimony network.
              </p>
            </div>
          </div>

          <div className="card" style={{ borderTop: '3px solid var(--color-gold)' }}>
            <div className="card-body">
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem', color: 'var(--color-gold)' }}>🤝</div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                Personalized Assistance
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
                Every profile is hand-screened. Our counselors contact you directly to understand your specific preferences.
              </p>
            </div>
          </div>

          <div className="card" style={{ borderTop: '3px solid var(--color-gold)' }}>
            <div className="card-body">
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem', color: 'var(--color-green)' }}>📜</div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                Verified Family Backgrounds
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
                We prioritize authenticity, verified family lineages, and genuine intent for lifelong companionship.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
