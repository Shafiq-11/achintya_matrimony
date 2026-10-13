'use client';

import { LogoutButton } from '@/components/layout/LogoutButton';

interface AdminTopBarProps {
  title: string;
  subtitle?: string;
}

export function AdminTopBar({ title, subtitle }: AdminTopBarProps) {
  return (
    <header className="admin-topbar">
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <span className="badge badge-active">Admin Session</span>
        <LogoutButton />
      </div>
    </header>
  );
}
