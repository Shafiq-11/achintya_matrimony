'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Authentication failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      // Success: redirect to intended admin path and refresh router state
      router.push(redirectTo);
      router.refresh();
    } catch {
      setErrorMessage('Network error occurred. Please verify your connection.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {errorMessage && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem', fontSize: '0.875rem' }}>
          <span>⚠️</span>
          <div>{errorMessage}</div>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="admin_email" className="form-label">
          Administrator Email <span className="required">*</span>
        </label>
        <input
          id="admin_email"
          type="email"
          required
          autoComplete="email"
          className="form-input"
          placeholder="admin@achintyamatrimony.test"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '1.75rem' }}>
        <label htmlFor="admin_password" className="form-label">
          Password <span className="required">*</span>
        </label>
        <input
          id="admin_password"
          type="password"
          required
          autoComplete="current-password"
          className="form-input"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        style={{ width: '100%', padding: '0.75rem 1.25rem' }}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span
              className="spinner"
              style={{ width: '1rem', height: '1rem', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#ffffff' }}
            />
            Verifying Credentials...
          </>
        ) : (
          'Sign In to CRM Dashboard →'
        )}
      </button>

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <Link href="/" className="nav-link" style={{ fontSize: '0.8125rem' }}>
          ← Return to Public Website
        </Link>
      </div>
    </form>
  );
}
