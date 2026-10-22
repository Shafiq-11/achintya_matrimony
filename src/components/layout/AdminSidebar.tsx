'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const generalItems = [
    { label: 'Dashboard', href: '/admin', icon: '📊' },
    { label: 'All Members', href: '/admin/members', icon: '👥', badge: '7' },
    { label: 'Daily Tasks', href: '/admin/tasks', icon: '📅', badge: '1', badgeType: 'alert' },
  ];

  const managementItems = [
    { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
    { label: 'Registration Form', href: '/register', icon: '📝', isExternal: true },
  ];

  return (
    <aside className={`admin-sidebar ${isOpen ? 'mobile-open' : ''}`}>
      <div className="admin-sidebar-header">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/achintya-logo.jpg"
          alt="Achintya Matrimony"
          style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '50%',
            border: '2px solid var(--color-gold)',
            objectFit: 'cover',
            boxShadow: '0 2px 6px rgba(201, 163, 74, 0.25)',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: '0.9375rem',
              color: '#ffffff',
              fontFamily: 'var(--font-serif)',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Achintya Matrimony
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-gold)', fontWeight: 500 }}>
            CRM Administration
          </div>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <button
            type="button"
            className="admin-mobile-close-btn"
            onClick={onClose}
            aria-label="Close sidebar menu"
          >
            ✕
          </button>
        )}
      </div>

      <nav className="admin-sidebar-nav" aria-label="Admin Navigation">
        {/* Section 1: GENERAL */}
        <div className="sidebar-nav-group">
          <div className="sidebar-group-title">General</div>
          {generalItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="admin-nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="admin-nav-label">{item.label}</span>
                {item.badge && (
                  <span
                    className={`sidebar-counter-badge ${
                      item.badgeType === 'alert' ? 'badge-alert' : ''
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Section 2: MANAGEMENT */}
        <div className="sidebar-nav-group" style={{ marginTop: '1.25rem' }}>
          <div className="sidebar-group-title">Management</div>
          {managementItems.map((item) => {
            const isActive =
              item.href === '/admin/settings'
                ? pathname.startsWith('/admin/settings')
                : false;

            return (
              <Link
                key={item.href}
                href={item.href}
                target={item.isExternal ? '_blank' : undefined}
                rel={item.isExternal ? 'noopener noreferrer' : undefined}
                onClick={onClose}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="admin-nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="admin-nav-label">{item.label}</span>
                {item.isExternal && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', opacity: 0.6 }}>
                    ↗
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="admin-sidebar-footer">
        <div className="sidebar-user-card">
          <div className="sidebar-avatar">
            AM
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.8125rem' }}>
              Administrator
            </div>
            <div style={{ color: '#9e918b', fontSize: '0.75rem' }}>
              admin@achintya
            </div>
          </div>
          <Link
            href="/"
            target="_blank"
            className="sidebar-public-link"
            title="Open Public Website"
          >
            🌐
          </Link>
        </div>
      </div>
    </aside>
  );
}
