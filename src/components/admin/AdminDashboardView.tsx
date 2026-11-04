'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Clapperboard, FileText, Loader2, Store, UserRound, type LucideIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AdminVerificationService, effectiveStatus } from '@/lib/services/adminVerificationService';

// /admin (client list #13, 2026-11-04): FUZO at a glance for app admins, built
// on what admins can already read. Being an admin is decided by the database
// (is_app_admin, the app_admins table); this page only hides itself from others.

type Stats = { users: number | null; businesses: number | null; posts: number | null; videos: number | null; toReview: number | null };
type Load = { status: 'loading' } | { status: 'denied' } | { status: 'done'; stats: Stats };

async function loadStats(): Promise<Stats> {
  const db = createClient();
  if (!db) return { users: null, businesses: null, posts: null, videos: null, toReview: null };
  const count = async (query: PromiseLike<{ count: number | null; error: unknown }>) => {
    const { count: n, error } = await query;
    return error ? null : n;
  };
  const [users, businesses, posts, videos, list] = await Promise.all([
    count(db.from('users').select('id', { count: 'exact', head: true }).eq('is_master_bot', false)),
    count(db.from('users').select('id', { count: 'exact', head: true }).eq('profile_type', 'business')),
    count(db.from('food_cards').select('id', { count: 'exact', head: true }).eq('status', 'PUBLISHED')),
    count(db.from('food_cards').select('id', { count: 'exact', head: true }).eq('status', 'PUBLISHED').not('media_url', 'is', null)),
    AdminVerificationService.list(),
  ]);
  const toReview = list.success
    ? (list.data ?? []).filter((b) => effectiveStatus(b.status, b.deadlineAt) === 'pending_review').length
    : null;
  return { users, businesses, posts, videos, toReview };
}

const TILES: { key: keyof Stats; label: string; icon: LucideIcon }[] = [
  { key: 'users', label: 'People', icon: UserRound },
  { key: 'businesses', label: 'Businesses', icon: Store },
  { key: 'posts', label: 'Published posts', icon: FileText },
  { key: 'videos', label: 'Video posts', icon: Clapperboard },
];

export default function AdminDashboardView() {
  const [load, setLoad] = useState<Load>({ status: 'loading' });

  useEffect(() => {
    let off = false;
    AdminVerificationService.isAdmin().then(async (ok) => {
      if (off) return;
      if (!ok) {
        setLoad({ status: 'denied' });
        return;
      }
      const stats = await loadStats();
      if (!off) setLoad({ status: 'done', stats });
    });
    return () => {
      off = true;
    };
  }, []);

  return (
    <div className="fz-onb fz-admin">
      <header className="fz-onb__top">
        <Link href="/dashboard" className="fz-onb__back">
          <ArrowLeft size={16} aria-hidden="true" /> Home
        </Link>
      </header>
      <main className="fz-admin__main">
        {load.status === 'loading' && (
          <div className="fz-onb__state" role="status" aria-label="Loading">
            <Loader2 size={26} className="fz-onb__spin" aria-hidden="true" />
          </div>
        )}
        {load.status === 'denied' && (
          <div className="fz-onb__card fz-onb__state">
            <h1 className="fz-onb__title">Admins only</h1>
            <p className="fz-onb__sub">This page is for the FUZO team.</p>
          </div>
        )}
        {load.status === 'done' && (
          <>
            <h1 className="fz-onb__title">Admin dashboard</h1>
            <p className="fz-onb__sub">FUZO at a glance.</p>
            <ul className="fz-admin-tiles">
              {TILES.map(({ key, label, icon: Icon }) => (
                <li key={key} className="fz-admin-tile">
                  <Icon size={20} aria-hidden="true" />
                  <strong>{load.stats[key]?.toLocaleString() ?? '-'}</strong>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
            <Link href="/admin/verification" className="fz-admin-link">
              <span>
                <strong>Business verification</strong>
                <span>{load.stats.toReview === null ? 'Review documents' : `${load.stats.toReview} waiting for review`}</span>
              </span>
              <ChevronRight size={20} aria-hidden="true" />
            </Link>
          </>
        )}
      </main>
    </div>
  );
}
