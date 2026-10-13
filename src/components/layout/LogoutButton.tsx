'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LogoutButton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      window.location.href = '/login';
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`btn btn-outline btn-sm ${className}`.trim()}
      style={style}
      title="Sign out of Admin Session"
    >
      {isLoggingOut ? 'Logging out...' : '🚪 Logout'}
    </button>
  );
}
