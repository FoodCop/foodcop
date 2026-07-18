'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { DemoProfile } from './demoProfile';

// Ported from Soziety's user-profile.html .main-profile / .social-bar /
// .list-button structure, re-skinned onto Bootstrap flex/card utilities.
export default function ProfileHero({ profile, userId }: { profile: DemoProfile; userId?: string }) {
  const [following, setFollowing] = useState(false);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <div className="text-muted small">@{profile.handle}</div>
          <h5 className="mt-1 mb-0 fw-bold">{profile.name}</h5>
          <h6 className="text-primary fw-normal">{profile.role}</h6>
        </div>
        <div
          className="rounded-circle bg-light d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 64, height: 64 }}
        >
          <span style={{ fontSize: 22, color: '#ccc' }}>👤</span>
        </div>
      </div>

      <div className="d-flex gap-2 mt-3">
        <button type="button" className={`btn btn-sm ${following ? 'btn-outline-secondary' : 'btn-primary'}`} onClick={() => setFollowing((v) => !v)}>
          {following ? 'Following' : 'Follow'}
        </button>
        {profile.type === 'restaurant' ? (
          <>
            <button type="button" className="btn btn-sm btn-outline-secondary">
              Order
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary">
              Website
            </button>
          </>
        ) : (
          <Link href={userId ? `/messages?userId=${userId}` : '/messages'} className="btn btn-sm btn-outline-secondary">
            Message
          </Link>
        )}
      </div>

      <div className="d-flex gap-4 mt-4 border-top pt-3">
        <div className="text-center">
          <div className="fw-bold">{profile.bites}</div>
          <div className="text-muted small">Bites</div>
        </div>
        <div className="text-center">
          <div className="fw-bold">{profile.following}</div>
          <div className="text-muted small">Following</div>
        </div>
        <div className="text-center">
          <div className="fw-bold">{profile.followers}</div>
          <div className="text-muted small">Followers</div>
        </div>
      </div>
    </div>
  );
}
