import React from 'react';

export interface LoadingSpinnerProps {
  label?: string;
}

export function LoadingSpinner({ label = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        gap: '0.75rem',
      }}
    >
      <div className="spinner" />
      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
        {label}
      </span>
    </div>
  );
}
