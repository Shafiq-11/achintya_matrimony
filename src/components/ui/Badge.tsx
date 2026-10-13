import React from 'react';

export interface BadgeProps {
  variant?: 'new' | 'active' | 'pending' | 'overdue' | 'muted';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'muted', children, className = '' }: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()}>
      {children}
    </span>
  );
}
