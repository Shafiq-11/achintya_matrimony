'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/admin', icon: '📊' },
    { label: 'All Members', href: '/admin/members', icon: '👥' },
    { label: 'Daily Tasks', href: '/admin/tasks', icon: '📅' },
    { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <div className="brand-emblem" style={{ width: '2rem', height: '2rem', fontSize: '1rem' }}>
          अ
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>
            Achintya CRM
          </div>
          <div style={{ fontSize: '0.75rem', color: '#a39c94' }}>Admin Dashboard</div>
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        {navItems.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <div style={{ marginBottom: '0.75rem', color: '#a39c94' }}>
          Signed in as Administrator
        </div>
        <Link
          href="/"
          className="btn btn-outline btn-sm"
          style={{ width: '100%', borderColor: '#3a3532', color: '#d1cbc4' }}
        >
          🌐 View Public Site
        </Link>
      </div>
    </aside>
  );
}
