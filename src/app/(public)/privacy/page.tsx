export default function PrivacyPolicyPage() {
  return (
    <div style={{ padding: '4rem 0' }}>
      <div className="container container-narrow">
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.5rem',
            color: 'var(--color-primary)',
            marginBottom: '0.75rem',
          }}
        >
          Privacy Policy & Data Protection
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2.5rem' }}>
          Last updated: October 2026 • Achintya Matrimony
        </p>

        <div className="card" style={{ borderTop: '3px solid var(--color-gold)' }}>
          <div className="card-body" style={{ lineHeight: 1.8, fontSize: '0.9375rem', color: 'var(--color-text-main)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-primary)' }}>
              1. Information We Collect
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              We collect information provided directly by applicants during registration, including full name, contact phone number, date of birth, marital status, educational and professional details, and mutual partner preferences. This information is gathered solely for the purpose of personal matchmaking and referral consultations.
            </p>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-primary)' }}>
              2. How Your Data Is Protected
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Unlike open social matchmaking websites, Achintya Matrimony is a closed, counselor-moderated service. Your contact details, phone numbers, and full profiles are never published publicly, indexed by search engines, or made browsable by the public. Only our authorized matchmaking counselor accesses your profile to facilitate introductions.
            </p>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-primary)' }}>
              3. Consent & Purpose of Contact
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              By submitting the registration form, you give consent to Achintya Matrimony to contact you via telephone call or WhatsApp to verify your details, clarify partner preferences, and discuss prospective matches.
            </p>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-primary)' }}>
              4. Data Retention & Deletion
            </h2>
            <p>
              You retain the right at any time to request updates to your matrimonial profile or request complete deletion of your records from our system once your match has been finalized or if you no longer wish to utilize our services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
