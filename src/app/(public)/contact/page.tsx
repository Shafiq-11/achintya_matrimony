import Link from 'next/link';

export default function ContactPage() {
  return (
    <div style={{ padding: '4rem 0' }}>
      <div className="container container-narrow">
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.5rem',
            color: 'var(--color-primary)',
            marginBottom: '0.75rem',
            textAlign: 'center',
          }}
        >
          Contact Our Matchmaking Office
        </h1>

        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '3rem' }}>
          Have inquiries regarding prospective matches, verification, or our referral network? Connect with our dedicated counselor team.
        </p>

        <div className="card" style={{ borderTop: '3px solid var(--color-gold)' }}>
          <div className="card-body" style={{ padding: '2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                  📞 Telephone / WhatsApp
                </h3>
                <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-main)' }}>+91 98765 43210</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  Available 10:00 AM – 7:00 PM IST
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                  ✉️ Email Inquiries
                </h3>
                <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-main)' }}>contact@achintyamatrimony.com</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  Prompt responses within 24 hours
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                  📍 Matchmaking Center
                </h3>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.5, color: 'var(--color-text-main)' }}>
                  Achintya Matrimonial Advisory Services<br />
                  Referral Consultation by Appointment
                </p>
              </div>
            </div>

            <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border-light)', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <a href="tel:+919876543210" className="btn btn-gold btn-lg">
                📞 Call Now (+91 98765 43210)
              </a>
              <Link href="/register" className="btn btn-primary btn-lg">
                Fill Registration Form →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
