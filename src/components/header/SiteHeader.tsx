'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { primaryLinks, moreLinks, cuisines } from './navData';
import { useAuth } from '@/components/auth/AuthProvider';
import { CreateCardModal } from '@/components/create/CreateCardModal';

// Nav drawer + dropdowns are driven entirely by React state, not Bootstrap's
// JS (data-bs-toggle/dismiss). Bootstrap's offcanvas appends a full-viewport
// backdrop div directly to <body>, outside React's tree - if a drawer link's
// Next.js navigation unmounted the page while that close transition was still
// in flight, the backdrop was orphaned and permanently blocked every click on
// every page after (invisible, no console error). Plain state + our own
// conditional classes/backdrop can't leak that way, since everything lives
// inside this one persistent component.
export default function SiteHeader() {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'cuisines' | 'more' | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const closeAll = () => {
    setDrawerOpen(false);
    setOpenDropdown(null);
  };

  return (
    <>
    <nav className="navbar bg-white shadow-sm sticky-top">
      <div className="container">
        <Link href="/dashboard" className="navbar-brand fw-bold text-primary" onClick={closeAll}>
          FUZO
        </Link>

        {/* Space out brand and icons */}
        <div className="flex-grow-1" />

        {/* Top Nav Icons */}
        <div className="d-flex align-items-center gap-3 ms-auto me-3">
          {user && (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="btn btn-primary btn-sm rounded-circle d-flex align-items-center justify-content-center p-0"
              style={{ width: 32, height: 32 }}
              aria-label="Create a food card"
            >
              <Plus size={18} />
            </button>
          )}
          <Link href="/messages" className="text-dark position-relative" aria-label="Messages">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
              <span className="visually-hidden">New messages</span>
            </span>
          </Link>
          
          <Link href="/notifications" className="text-dark position-relative" aria-label="Notifications">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
              <span className="visually-hidden">New alerts</span>
            </span>
          </Link>

          {user ? (
            <Link href="/profile" className="text-dark" aria-label="Profile">
              <div className="rounded-circle bg-light d-flex align-items-center justify-content-center overflow-hidden border" style={{ width: 32, height: 32 }}>
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="w-100 h-100 object-fit-cover" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                )}
              </div>
            </Link>
          ) : (
            <Link href="/login" className="btn btn-outline-primary btn-sm rounded-pill fw-bold px-3">
              Sign In
            </Link>
          )}
        </div>

        <button
          className="navbar-toggler border-0 px-0"
          type="button"
          aria-expanded={drawerOpen}
          aria-label="Toggle navigation"
          onClick={() => setDrawerOpen((v) => !v)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        {drawerOpen && <div className="offcanvas-backdrop fade show" onClick={closeAll} />}

        <div className={`offcanvas offcanvas-end${drawerOpen ? ' show' : ''}`} tabIndex={-1}>
          <div className="offcanvas-header">
            <span className="fw-bold text-primary">FUZO</span>
            <button type="button" className="btn-close" aria-label="Close" onClick={closeAll} />
          </div>

          <div className="offcanvas-body d-flex flex-column w-100">
            <ul className="navbar-nav me-auto mb-4">
              {primaryLinks.map((link) => (
                <li className="nav-item" key={link.href}>
                  <Link href={link.href} className="nav-link fs-5 py-2" onClick={closeAll}>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="nav-item mt-3 mb-2">
                <span className="text-muted text-uppercase small fw-bold">More</span>
              </li>
              {moreLinks.map((link) => (
                <li key={link.href} className="nav-item">
                  <Link href={link.href} className="nav-link py-2" onClick={closeAll}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-3 border-top d-flex flex-column gap-2">
              {user ? (
                <>
                  <button
                    type="button"
                    className="btn btn-primary w-100"
                    onClick={() => { setIsCreateOpen(true); closeAll(); }}
                  >
                    + Create a Card
                  </button>
                  <Link href="/profile" className="btn btn-outline-primary w-100" onClick={closeAll}>
                    Profile
                  </Link>
                </>
              ) : (
                <Link href="/login" className="btn btn-primary w-100" onClick={closeAll}>
                  Sign In
                </Link>
              )}
            </div>

            {/* Dev previews - drawer-only (mobile), not shown in the desktop inline navbar */}
            <div className="d-lg-none mt-4 pt-3 border-top">
              <div className="text-muted text-uppercase small fw-bold mb-2">Dev Previews</div>
              <div className="d-flex flex-wrap gap-2">
                <Link href="/login" className="btn btn-sm btn-outline-secondary" onClick={closeAll}>
                  Login
                </Link>
                <Link href="/onboarding" className="btn btn-sm btn-outline-secondary" onClick={closeAll}>
                  Onboarding
                </Link>
                <Link href="/profile" className="btn btn-sm btn-outline-secondary" onClick={closeAll}>
                  Profile
                </Link>
                <Link href="/discover" className="btn btn-sm btn-outline-secondary" onClick={closeAll}>
                  Discover
                </Link>
                <Link href="/trims" className="btn btn-sm btn-outline-secondary" onClick={closeAll}>
                  Trims
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    {/* Portaled to <body>, not a child of this <nav> - position:fixed nested
        inside a position:sticky ancestor (this nav's .sticky-top) is
        unreliable on mobile Safari/Chrome, and was letting the sticky header
        bleed through above the modal instead of being fully covered. */}
    {isCreateOpen && createPortal(<CreateCardModal onClose={() => setIsCreateOpen(false)} />, document.body)}
    </>
  );
}
