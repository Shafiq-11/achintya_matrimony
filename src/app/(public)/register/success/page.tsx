import { Suspense } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata = {
  title: 'Registration Confirmation | Achintya Matrimony',
  description: 'Your matrimonial registration has been recorded successfully.',
};

async function SuccessDetails({
  searchParams,
}: {
  searchParams: Promise<{ regId?: string; name?: string }>;
}) {
  const params = await searchParams;
  const regId = params.regId || 'AM-CONFIRMED';
  const name = params.name || 'Member';

  let businessPhone = '+919876543210';
  let businessName = 'Achintya Matrimony';

  try {
    const adminClient = createAdminClient();
    const supabase = adminClient || (await createClient());
    const { data: settings } = await supabase
      .from('settings')
      .select('business_phone, business_name')
      .limit(1)
      .maybeSingle();

    if (settings?.business_phone) businessPhone = settings.business_phone;
    if (settings?.business_name) businessName = settings.business_name;
  } catch {}

  const cleanPhone = businessPhone.replace(/[^0-9+]/g, '');
  const whatsAppMessage = encodeURIComponent(
    `Hello ${businessName}, I have submitted my registration form (Registration ID: ${regId}, Name: ${name}). Please assist me with the next steps.`
  );
  const whatsAppLink = `https://wa.me/${cleanPhone.replace('+', '')}?text=${whatsAppMessage}`;

  return (
    <>
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '2.25rem',
          color: 'var(--color-primary)',
          marginBottom: '0.75rem',
        }}
      >
        Thank You, {name}!
      </h1>

      <p
        style={{
          color: 'var(--color-text-muted)',
          fontSize: '1.0625rem',
          lineHeight: 1.6,
          maxWidth: '540px',
          margin: '0 auto 2rem',
        }}
      >
        Your matrimonial profile has been securely recorded in our private CRM system. Our matchmaking counselors will review your preferences and initiate contact shortly.
      </p>

      {/* Registration Reference Card */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-gold-border)',
          borderTop: '3px solid var(--color-gold)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          maxWidth: '400px',
          margin: '0 auto 2.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.375rem',
          }}
        >
          Unique Registration ID
        </div>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--color-primary)',
            letterSpacing: '0.05em',
          }}
        >
          {regId}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '0.375rem' }}>
          Please quote this ID whenever communicating with our counselors.
        </div>
      </div>

      {/* Call-To-Action Options */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '2rem',
        }}
      >
        <a
          href={`tel:${cleanPhone}`}
          className="btn btn-gold btn-lg"
          style={{ minWidth: '220px' }}
        >
          📞 Call Now ({businessPhone})
        </a>

        <a
          href={whatsAppLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-whatsapp btn-lg"
          style={{ minWidth: '220px' }}
        >
          💬 WhatsApp Us
        </a>
      </div>
    </>
  );
}

export default function RegistrationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ regId?: string; name?: string }>;
}) {
  return (
    <div style={{ padding: '4.5rem 0 6rem' }}>
      <div className="container container-narrow">
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          {/* Success Check Icon */}
          <div
            style={{
              width: '4.5rem',
              height: '4.5rem',
              borderRadius: '50%',
              backgroundColor: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.25rem',
              margin: '0 auto 1.5rem',
              border: '2px solid var(--color-success-border)',
              boxShadow: '0 4px 12px rgba(21, 128, 61, 0.15)',
            }}
          >
            ✓
          </div>

          <span
            className="badge badge-active"
            style={{ marginBottom: '1rem', padding: '0.35rem 0.85rem' }}
          >
            Submission Confirmed
          </span>

          <Suspense fallback={<LoadingSpinner label="Loading your confirmation..." />}>
            <SuccessDetails searchParams={searchParams} />
          </Suspense>

          {/* Next Steps Guidance */}
          <div
            style={{
              borderTop: '1px solid var(--color-border-light)',
              paddingTop: '2rem',
              maxWidth: '520px',
              margin: '0 auto',
              textAlign: 'left',
            }}
          >
            <h3
              style={{
                fontSize: '0.9375rem',
                fontWeight: 700,
                marginBottom: '0.75rem',
                color: 'var(--color-text-main)',
                textAlign: 'center',
              }}
            >
              What Happens Next?
            </h3>
            <ul
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.8,
                paddingLeft: '1.25rem',
              }}
            >
              <li>Our matchmaking team screens and validates the submitted profile details.</li>
              <li>A counselor contacts you via phone or WhatsApp for an introductory conversation.</li>
              <li>Curated matches tailored to your mutual partner preferences will be shared directly.</li>
            </ul>
          </div>

          <div style={{ marginTop: '2.5rem' }}>
            <Link href="/" className="nav-link" style={{ fontSize: '0.875rem' }}>
              ← Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
