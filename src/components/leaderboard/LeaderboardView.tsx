'use client';

import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { PointsService, type LeaderboardEntry } from '../../lib/services/pointsService';
import { FriendRequestService } from '../../lib/services/friendRequestService';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardView() {
  const { user } = useAuth();
  const [scope, setScope] = useState<'global' | 'friends'>('global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myStats, setMyStats] = useState<{ pointsTotal: number; pointsLevel: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    (async () => {
      setIsLoading(true);

      let friendIds: string[] | undefined;
      if (scope === 'friends') {
        const friendsResult = await FriendRequestService.listAcceptedFriendIds(user.id);
        friendIds = friendsResult.success ? friendsResult.data ?? [] : [];
      }

      const [leaderboardResult, rankResult, statsResult] = await Promise.all([
        PointsService.getLeaderboard({ scope, friendIds }),
        PointsService.getUserRank(user.id),
        PointsService.getUserStats(user.id),
      ]);

      if (cancelled) return;

      setEntries(leaderboardResult.success ? leaderboardResult.data ?? [] : []);
      setMyRank(rankResult.success ? rankResult.data ?? null : null);
      setMyStats(statsResult.success && statsResult.data
        ? { pointsTotal: statsResult.data.points, pointsLevel: statsResult.data.level }
        : null);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, scope]);

  return (
    <div className="container py-4 py-md-5" style={{ maxWidth: 640 }}>
      <div className="text-center mb-4">
        <div className="leaderboard-hero-icon mb-2">
          <Trophy size={28} />
        </div>
        <h2 className="fw-bolder mb-1">Leaderboard</h2>
        <p className="text-muted mb-0">Top Fuzo creators, ranked by points earned.</p>
      </div>

      <ul className="nav nav-pills nav-fill mb-4 bg-light rounded-pill p-1 shadow-sm">
        {(['global', 'friends'] as const).map((tab) => (
          <li className="nav-item" key={tab}>
            <button
              className={`nav-link rounded-pill fw-bold text-uppercase py-2 ${
                scope === tab ? 'active bg-warning text-dark' : 'text-secondary'
              }`}
              onClick={() => setScope(tab)}
              style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}
            >
              {tab}
            </button>
          </li>
        ))}
      </ul>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center text-muted py-5 bg-light rounded-4">
          <div style={{ fontSize: 32 }}>🏆</div>
          <div className="fw-bold mt-2 text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>
            {scope === 'friends' ? 'No friends on the board yet' : 'No one has scored points yet'}
          </div>
        </div>
      ) : (
        <ul className="list-group list-group-flush shadow-sm rounded-4 overflow-hidden">
          {entries.map((entry, index) => (
            <li
              key={entry.id}
              className={`list-group-item d-flex align-items-center gap-3 py-3 ${entry.id === user?.id ? 'bg-warning-subtle' : ''}`}
            >
              <span className="leaderboard-rank">
                {index < 3 ? MEDALS[index] : index + 1}
              </span>
              <img
                src={entry.avatarUrl || `https://i.pravatar.cc/150?u=${entry.id}`}
                alt={entry.displayName}
                className="rounded-circle"
                style={{ width: 44, height: 44, objectFit: 'cover' }}
              />
              <div className="flex-grow-1 min-width-0">
                <div className="fw-bold text-truncate">{entry.displayName}</div>
                <div className="small text-muted">Level {entry.pointsLevel}</div>
              </div>
              <div className="fw-bolder text-warning-emphasis">{entry.pointsTotal.toLocaleString()} pts</div>
            </li>
          ))}
        </ul>
      )}

      {myRank !== null && (
        <div className="leaderboard-your-rank mt-4 p-3 rounded-4 shadow-sm d-flex align-items-center gap-3">
          <span className="fw-bolder">#{myRank}</span>
          <div className="flex-grow-1">
            <div className="fw-bold">Your Rank</div>
            {myStats && <div className="small text-muted">Level {myStats.pointsLevel}</div>}
          </div>
          {myStats && <div className="fw-bolder text-warning-emphasis">{myStats.pointsTotal.toLocaleString()} pts</div>}
        </div>
      )}
    </div>
  );
}
