'use client';

import { LogoutButton } from '@/components/layout/LogoutButton';
import { useAdminShell } from '@/components/layout/AdminShell';

interface AdminTopBarProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function AdminTopBar({ title, subtitle, action }: AdminTopBarProps) {
  const { toggleMobileNav } = useAdminShell();

  return (
    <header className="admin-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        {/* Mobile Hamburger Menu Button */}
        <button
          type="button"
          className="admin-hamburger-btn"
          onClick={toggleMobileNav}
          aria-label="Open navigation menu"
        >
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
        </button>

        <div>
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
              fontFamily: 'var(--font-serif)',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-text-muted)',
                margin: 0,
                marginTop: '0.125rem',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        {action}
        <div className="admin-badge-session badge badge-active">
          🟢 Admin Session
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
