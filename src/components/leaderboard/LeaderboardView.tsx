'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import {
  LeaderboardService,
  type LeaderboardPeriod,
  type LeaderboardResult,
  type LeaderboardRow,
  type LeaderboardScope,
} from '@/lib/services/leaderboardService';
import { PointsService, type PointsHistoryEntry } from '@/lib/services/pointsService';
import { POINTS_ACTION_COPY } from '@/lib/services/notificationsService';
import { POINTS_PER_LEVEL, getLevelProgress } from '@/lib/rewards/progressionEngine';

// Real rankings only: every row comes from get_leaderboard() (or its plain
// all-time fallback) - see src/lib/services/leaderboardService.ts. Seeded demo
// accounts are never ranked and avatars are the user's own photo or initials
// (never a placeholder photo service).
//
// Desktop layout: full-width hero band (title + controls | podium), then a
// two-column body (rankings | sticky sidebar with your rank + recent points).
// Below 992px everything stacks and "Your rank" becomes a sticky bottom bar.

const SCOPES: { value: LeaderboardScope; label: string }[] = [
  { value: 'global', label: 'Global' },
  { value: 'friends', label: 'Friends' },
];
const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'month', label: 'This month' },
  { value: 'week', label: 'This week' },
];

const fmt = (n: number) => n.toLocaleString('en-US');

// Warm, on-brand tints for the initials avatar, picked deterministically per user.
const INITIAL_TINTS = ['#fde3ec', '#e8f3d6', '#dcedfb', '#ffe3dd', '#fbf3d9'];
const tintFor = (id: string) => INITIAL_TINTS[[...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % INITIAL_TINTS.length];
const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

type AllTimeStats = { points: number; level: number };

export default function LeaderboardView() {
  const { user } = useAuth();
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');
  const [result, setResult] = useState<LeaderboardResult | null>(null);
  const [allTime, setAllTime] = useState<AllTimeStats | null>(null);
  const [recent, setRecent] = useState<PointsHistoryEntry[] | null>(null);
  const [loaded, setLoaded] = useState<{ key: string; error: boolean } | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  const userId = user?.id;
  const requestKey = userId ? `${userId}:${scope}:${period}:${retryNonce}` : null;

  useEffect(() => {
    if (!userId || !requestKey) return;
    let cancelled = false;
    (async () => {
      const [board, stats] = await Promise.all([
        LeaderboardService.get({ scope, period, userId }),
        PointsService.getUserStats(userId),
      ]);
      if (cancelled) return;
      if (board.success && board.data) setResult(board.data);
      if (stats.success && stats.data) setAllTime({ points: stats.data.points, level: stats.data.level });
      setLoaded({ key: requestKey, error: !board.success });
    })();
    return () => { cancelled = true; };
  }, [userId, scope, period, requestKey]);

  // Own point history for the sidebar - independent of scope/period, so fetched once per user.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    PointsService.getRecentPoints(userId, 5).then((r) => {
      if (!cancelled) setRecent(r.success && r.data ? r.data : []);
    });
    return () => { cancelled = true; };
  }, [userId]);

  const isLoading = !!requestKey && loaded?.key !== requestKey;
  const hasError = !isLoading && !!loaded?.error;
  const rows = !isLoading && !hasError && result ? result.rows : [];
  const podiumRows = rows.slice(0, 3);
  const listRows = rows.slice(podiumRows.length);
  const periodFellBack = !isLoading && !hasError && result && !result.periodsSupported && period !== 'all';
  const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? '';

  const retry = useCallback(() => setRetryNonce((n) => n + 1), []);

  return (
    <div className="fz-lb">
      {/* Full-width hero: title + controls on the left, podium on the right. */}
      <section className="fz-lb-hero">
        <div className="fz-lb__inner fz-lb-hero__grid">
          <div className="fz-lb-hero__intro">
            <div className="fz-lb-head">
              <div className="fz-lb-head__icon" aria-hidden><Trophy size={26} /></div>
              <div>
                <div className="fz-lb-eyebrow">Community</div>
                <h1 className="fz-lb-title">Leaderboard</h1>
              </div>
            </div>
            <p className="fz-lb-sub">See who’s cooking, exploring and sharing the most on FUZO.</p>

            <div className="fz-lb-controls">
              <div className="fz-profile-tabs fz-lb-scope" role="tablist" aria-label="Leaderboard scope">
                {SCOPES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    role="tab"
                    aria-selected={scope === s.value}
                    className={`fz-profile-tab${scope === s.value ? ' fz-profile-tab--active' : ''}`}
                    onClick={() => setScope(s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="fz-lb-seg" role="tablist" aria-label="Time period">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    role="tab"
                    aria-selected={period === p.value}
                    className={`fz-lb-seg__btn${period === p.value ? ' is-active' : ''}`}
                    onClick={() => setPeriod(p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="fz-lb-hero__stage">
            {isLoading ? (
              <div className="fz-lb-hero__loading" aria-busy="true" aria-label="Loading leaderboard" />
            ) : podiumRows.length > 0 ? (
              <Podium rows={podiumRows} period={period} />
            ) : null}
          </div>
        </div>
      </section>

      <div className="fz-lb__inner fz-lb-body">
        <main className="fz-lb-main">
          {periodFellBack && (
            <div className="fz-lb-note" role="status">
              Weekly and monthly rankings aren’t available yet - showing all-time points.
            </div>
          )}

          {isLoading ? (
            <LeaderboardSkeleton />
          ) : hasError ? (
            <div className="fz-empty-state">
              <div className="fz-empty-state__icon">⚠️</div>
              <div className="fz-empty-state__title">Couldn’t load the leaderboard</div>
              <div className="fz-empty-state__sub">Check your connection and try again.</div>
              <button type="button" className="fz-lb-btn" onClick={retry}>Try again</button>
            </div>
          ) : rows.length === 0 ? (
            <EmptyBoard scope={scope} periodLabel={periodLabel} period={period} />
          ) : listRows.length > 0 ? (
            <ol className="fz-lb-list" aria-label="Rankings">
              {listRows.map((row, i) => (
                <LeaderRow key={row.userId} row={row} period={period} index={i} />
              ))}
            </ol>
          ) : (
            <div className="fz-empty-state">
              <div className="fz-empty-state__icon">🎉</div>
              <div className="fz-empty-state__title">Everyone on the board is on the podium</div>
              <div className="fz-empty-state__sub">Invite friends to join the race.</div>
              <Link href="/messages" className="fz-lb-btn">Find friends</Link>
            </div>
          )}
        </main>

        {!isLoading && !hasError && (
          <aside className="fz-lb-side">
            <YouCard
              me={result?.me ?? null}
              above={result?.above ?? null}
              allTime={allTime}
              period={period}
              periodLabel={periodLabel}
            />
            <RecentPoints entries={recent} />
          </aside>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────── pieces ─────────────────────────────

function Avatar({ row, size }: { row: LeaderboardRow; size: number }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size, fontSize: size * 0.38 } as const;
  if (row.avatarUrl && !broken) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="fz-lb-avatar" style={style} src={row.avatarUrl} alt="" onError={() => setBroken(true)} />;
  }
  return <span className="fz-lb-avatar fz-lb-avatar--initials" style={{ ...style, background: tintFor(row.userId) }} aria-hidden>{initialsOf(row.displayName)}</span>;
}

const pointsLabel = (points: number, period: LeaderboardPeriod) => `${period === 'all' ? '' : '+'}${fmt(points)}`;

function ProfileLink({ row, className, children }: { row: LeaderboardRow; className?: string; children: React.ReactNode }) {
  return <Link href={row.isMe ? '/profile' : `/profile/${row.userId}`} className={className}>{children}</Link>;
}

function Podium({ rows, period }: { rows: LeaderboardRow[]; period: LeaderboardPeriod }) {
  // Visual order 2nd - 1st - 3rd, leader raised in the middle. Missing slots
  // stay as empty columns so 1 or 2 people still sit correctly.
  const order: (LeaderboardRow | undefined)[] = [rows[1], rows[0], rows[2]];
  return (
    <section className="fz-lb-podium" aria-label="Top three">
      {order.map((row, i) => {
        if (!row) return <div key={`empty-${i}`} className="fz-lb-pod fz-lb-pod--empty" aria-hidden />;
        const first = row.rank === rows[0].rank;
        return (
          <ProfileLink key={row.userId} row={row} className={`fz-lb-pod${first ? ' is-first' : ''}${row.isMe ? ' is-me' : ''}`}>
            {first && <span className="fz-lb-pod__crown" aria-hidden>👑</span>}
            <span className="fz-lb-pod__ring"><Avatar row={row} size={first ? 96 : 72} /></span>
            <span className="fz-lb-pod__name">{row.displayName}{row.isMe && <span className="fz-lb-you"> · You</span>}</span>
            <span className="fz-lb-pod__pts">{pointsLabel(row.points, period)}<small> pts</small></span>
            <span className="fz-lb-pod__level">Lv {row.level}</span>
            <span className="fz-lb-pod__step" aria-label={`Rank ${row.rank}`}>{row.rank}</span>
          </ProfileLink>
        );
      })}
    </section>
  );
}

function LeaderRow({ row, period, index }: { row: LeaderboardRow; period: LeaderboardPeriod; index: number }) {
  return (
    <li style={{ ['--row-i' as string]: index }}>
      <ProfileLink row={row} className={`fz-lb-row${row.isMe ? ' is-me' : ''}`}>
        <span className="fz-lb-row__rank">{row.rank}</span>
        <Avatar row={row} size={48} />
        <span className="fz-lb-row__who">
          <span className="fz-lb-row__name">{row.displayName}{row.isMe && <span className="fz-lb-you"> · You</span>}</span>
          <span className="fz-lb-row__meta">{row.username ? `@${row.username} · ` : ''}Level {row.level}</span>
        </span>
        <span className="fz-lb-row__pts">{pointsLabel(row.points, period)}<small> pts</small></span>
      </ProfileLink>
    </li>
  );
}

function YouCard({
  me, above, allTime, period, periodLabel,
}: {
  me: LeaderboardRow | null;
  above: LeaderboardRow | null;
  allTime: AllTimeStats | null;
  period: LeaderboardPeriod;
  periodLabel: string;
}) {
  // Level progress always uses all-time points - it's what levels are made of,
  // whatever period the board is showing.
  const level = allTime?.level ?? me?.level ?? 1;
  const progress = allTime ? getLevelProgress(allTime.points) : 0;
  const toNext = allTime ? POINTS_PER_LEVEL - (allTime.points % POINTS_PER_LEVEL) : null;

  let nudge: string | null = null;
  if (me && above) nudge = `${fmt(above.points - me.points)} pts to pass ${above.displayName}`;
  else if (me && me.rank === 1 && me.points > 0) nudge = 'You’re leading the board 🎉';
  else if (!me || me.points === 0) nudge = 'Publish a card or share one with a friend to get on the board.';

  return (
    <section className="fz-lb-you-card" aria-label="Your ranking">
      <div className="fz-lb-you-card__rank">
        <span className="fz-lb-you-card__hash">{me ? `#${me.rank}` : '—'}</span>
        <span className="fz-lb-you-card__label">{periodLabel}</span>
      </div>
      <div className="fz-lb-you-card__body">
        <div className="fz-lb-you-card__top">
          <span className="fz-lb-you-card__title">Your rank</span>
          <span className="fz-lb-you-card__pts">{pointsLabel(me?.points ?? 0, period)}<small> pts</small></span>
        </div>
        {nudge && <div className="fz-lb-you-card__nudge">{nudge}</div>}
        <div className="fz-lb-you-card__level">
          <span>Level {level}</span>
          <span className="fz-lb-you-card__track"><span style={{ width: `${Math.round(progress * 100)}%` }} /></span>
          {toNext != null && <span>{toNext} to Lv {level + 1}</span>}
        </div>
      </div>
    </section>
  );
}

function RecentPoints({ entries }: { entries: PointsHistoryEntry[] | null }) {
  return (
    <section className="fz-lb-recent" aria-label="Your recent points">
      <h2 className="fz-lb-recent__title">Your recent points</h2>
      {entries === null ? (
        <div className="fz-lb-skeleton__row" />
      ) : entries.length === 0 ? (
        <p className="fz-lb-recent__empty">No points yet - publish a card or share one with a friend.</p>
      ) : (
        <ul className="fz-lb-recent__list">
          {entries.map((e) => (
            <li key={e.id}>
              <span className="fz-lb-recent__what">
                {POINTS_ACTION_COPY[e.actionType] ?? e.actionType.replace(/_/g, ' ')}
                <small>{new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small>
              </span>
              <span className="fz-lb-recent__pts">+{e.points}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EmptyBoard({ scope, period, periodLabel }: { scope: LeaderboardScope; period: LeaderboardPeriod; periodLabel: string }) {
  if (scope === 'friends') {
    return (
      <div className="fz-empty-state">
        <div className="fz-empty-state__icon">👥</div>
        <div className="fz-empty-state__title">No friends on the board yet</div>
        <div className="fz-empty-state__sub">Add friends in Messages and you’ll compete on your own board.</div>
        <Link href="/messages" className="fz-lb-btn">Find friends</Link>
      </div>
    );
  }
  return (
    <div className="fz-empty-state">
      <div className="fz-empty-state__icon">🏆</div>
      <div className="fz-empty-state__title">{period === 'all' ? 'No one has scored yet' : `No points earned ${periodLabel.toLowerCase()}`}</div>
      <div className="fz-empty-state__sub">Publish a card or share one with a friend - you could be first.</div>
      <Link href="/rewards" className="fz-lb-btn">See how to earn points</Link>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="fz-lb-skeleton" aria-busy="true" aria-label="Loading leaderboard">
      {[0, 1, 2, 3, 4].map((i) => <div key={i} className="fz-lb-skeleton__row" />)}
    </div>
  );
}
