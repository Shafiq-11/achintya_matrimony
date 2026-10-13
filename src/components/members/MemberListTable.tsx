'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatDate, calculateAge, buildWhatsAppLink, formatDisplayPhone } from '@/lib/utils/formatting';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Member, Gender, ProfileStatus } from '@/lib/types';

export function MemberListTable() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter and search state
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [status, setStatus] = useState<ProfileStatus | ''>('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (gender) params.set('gender', gender);
    if (status) params.set('status', status);
    if (minAge) params.set('minAge', minAge);
    if (maxAge) params.set('maxAge', maxAge);
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    params.set('page', page.toString());
    params.set('limit', limit.toString());

    try {
      const response = await fetch(`/api/admin/members?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to load member records.');
        setIsLoading(false);
        return;
      }

      setMembers(data.members || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch {
      setErrorMessage('Network error occurred while fetching members.');
    } finally {
      setIsLoading(false);
    }
  }, [search, gender, status, minAge, maxAge, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers();
    }, 250); // slight debounce on search typing

    return () => clearTimeout(timer);
  }, [fetchMembers]);

  const handleResetFilters = () => {
    setSearch('');
    setGender('');
    setStatus('');
    setMinAge('');
    setMaxAge('');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
  };

  const hasActiveFilters = !!(search || gender || status || minAge || maxAge || sortBy !== 'created_at' || sortOrder !== 'desc');

  return (
    <div>
      {/* Search and Filters Toolbar Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          {/* Row 1: Search bar */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px', position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="🔍 Search by Name, Reg ID, Mobile (+91...), or City..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-secondary btn-sm"
                style={{ alignSelf: 'center' }}
              >
                ↺ Reset All Filters
              </button>
            )}
          </div>

          {/* Row 2: Granular Filters */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '1rem',
              alignItems: 'flex-end',
            }}
          >
            <div>
              <label className="form-label" style={{ fontSize: '0.8125rem' }}>Gender</label>
              <select
                className="form-select"
                style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value as Gender | '');
                  setPage(1);
                }}
              >
                <option value="">All Genders</option>
                <option value="Female">Female (Bride)</option>
                <option value="Male">Male (Groom)</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8125rem' }}>Profile Status</label>
              <select
                className="form-select"
                style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as ProfileStatus | '');
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="active">Active</option>
                <option value="contacted">Contacted</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="matched">Matched</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8125rem' }}>Age Range</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  placeholder="Min"
                  className="form-input"
                  style={{ fontSize: '0.875rem', padding: '0.5rem' }}
                  value={minAge}
                  onChange={(e) => {
                    setMinAge(e.target.value);
                    setPage(1);
                  }}
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="form-input"
                  style={{ fontSize: '0.875rem', padding: '0.5rem' }}
                  value={maxAge}
                  onChange={(e) => {
                    setMaxAge(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8125rem' }}>Sort By</label>
              <select
                className="form-select"
                style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split(':');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                  setPage(1);
                }}
              >
                <option value="created_at:desc">Newest Registered</option>
                <option value="created_at:asc">Oldest Registered</option>
                <option value="full_name:asc">Name (A → Z)</option>
                <option value="full_name:desc">Name (Z → A)</option>
                <option value="reg_id:asc">Reg ID (Ascending)</option>
                <option value="dob:desc">Age (Youngest first)</option>
                <option value="dob:asc">Age (Oldest first)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
          Found <strong>{totalCount}</strong> member record{totalCount === 1 ? '' : 's'}
          {hasActiveFilters && ' (filtered)'}
        </div>

        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)' }}>
          Page {page} of {totalPages}
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Main Members Table Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          {isLoading ? (
            <LoadingSpinner label="Loading member records..." />
          ) : members.length === 0 ? (
            <EmptyState
              icon="👥"
              title="No Members Found"
              description="No matrimonial records matched your active search and filter criteria."
              action={
                hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="btn btn-outline btn-sm"
                  >
                    Clear Filter Criteria
                  </button>
                ) : undefined
              }
            />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-alt)' }}>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Reg ID</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Candidate Name</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Gender</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Contact & City</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Education / Work</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Registered</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const age = calculateAge(member.dob);
                  const whatsAppUrl = buildWhatsAppLink(
                    member.phone,
                    `Namaste ${member.full_name}, this is Achintya Matrimony regarding your profile (ID: ${member.reg_id}).`
                  );

                  return (
                    <tr
                      key={member.id}
                      style={{
                        borderBottom: '1px solid var(--color-border-light)',
                        transition: 'background-color 150ms ease',
                      }}
                    >
                      <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        <Link href={`/admin/members/${member.id}`} style={{ color: 'inherit' }}>
                          {member.reg_id}
                        </Link>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <Link
                          href={`/admin/members/${member.id}`}
                          style={{ fontWeight: 600, color: 'var(--color-text-main)' }}
                        >
                          {member.full_name}
                        </Link>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                          {age ? `${age} yrs` : '—'} • {member.marital_status}
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                          {member.gender === 'Female' ? '👩 Bride' : member.gender === 'Male' ? '👨 Groom' : member.gender}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 500 }}>{formatDisplayPhone(member.phone)}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          📍 {member.location_city}, {member.location_state}
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 500 }}>{member.education}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          💼 {member.occupation || 'Not specified'}
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span className={`badge badge-${member.profile_status}`}>
                          {member.profile_status}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                        {formatDate(member.created_at)}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.375rem', alignItems: 'center' }}>
                          <a
                            href={whatsAppUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0.25rem 0.5rem', borderColor: '#25D366', color: '#128C7E' }}
                            title="Chat on WhatsApp"
                          >
                            💬
                          </a>
                          <a
                            href={`tel:${member.phone.replace(/[^0-9+]/g, '')}`}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0.25rem 0.5rem' }}
                            title="Call Phone"
                          >
                            📞
                          </a>
                          <Link
                            href={`/admin/members/${member.id}`}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.25rem 0.625rem' }}
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
          >
            ← Previous Page
          </button>

          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-outline'}`}
                style={{ minWidth: '2.25rem' }}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
          >
            Next Page →
          </button>
        </div>
      )}
    </div>
  );
}
