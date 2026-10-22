'use client';

import React, { useState, createContext, useContext, Suspense } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';

interface AdminShellContextType {
  isMobileNavOpen: boolean;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
}

const AdminShellContext = createContext<AdminShellContextType>({
  isMobileNavOpen: false,
  toggleMobileNav: () => {},
  closeMobileNav: () => {},
});

export function useAdminShell() {
  return useContext(AdminShellContext);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const toggleMobileNav = () => setIsMobileNavOpen((prev) => !prev);
  const closeMobileNav = () => setIsMobileNavOpen(false);

  return (
    <AdminShellContext.Provider value={{ isMobileNavOpen, toggleMobileNav, closeMobileNav }}>
      <div className="admin-shell">
        {/* Mobile backdrop overlay */}
        {isMobileNavOpen && (
          <div
            className="admin-mobile-backdrop"
            onClick={closeMobileNav}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <Suspense fallback={<aside className="admin-sidebar" style={{ width: '260px', background: '#1c1415' }} />}>
          <AdminSidebar isOpen={isMobileNavOpen} onClose={closeMobileNav} />
        </Suspense>

        {/* Main content area */}
        <div className="admin-main">
          {children}
        </div>
      </div>
    </AdminShellContext.Provider>
  );
}
