'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ChefHat, Clapperboard, Compass, Share2, Sparkles, Star, Trophy, UserCheck, Utensils } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import ChatAvatar from '../chat/ChatAvatar';
import { NotificationsService, type AppNotification } from '@/lib/services/notificationsService';
import { FriendRequestService } from '@/lib/services/friendRequestService';

// Notifications, in the FUZO look: a header with filter pills (All / Friends /
// Points), a points summary for the week, friend requests waiting for a reply
// at the top, then everything else grouped by day ("New", "Today",
// "Yesterday", "This week", "Earlier"). Repeated point awards for the same
// action on the same day collapse into one row ("Shared 3 cards · +30").

type Filter = 'all' | 'friends' | 'points';

// What each points action reads as (one / many) and its icon.
const POINT_ACTIONS: Record<string, { one: string; many: (n: number) => string; icon: ReactNode }> = {
  share_card: { one: 'Shared a card with a friend', many: (n) => `Shared ${n} cards with friends`, icon: <Share2 size={17} /> },
  create_recipe: { one: 'Published a recipe', many: (n) => `Published ${n} recipes`, icon: <ChefHat size={17} /> },
  create_restaurant: { one: 'Logged a restaurant visit', many: (n) => `Logged ${n} restaurant visits`, icon: <Utensils size={17} /> },
  create_video: { one: 'Posted a video', many: (n) => `Posted ${n} videos`, icon: <Clapperboard size={17} /> },
  create_discovery: { one: 'Posted a discovery', many: (n) => `Posted ${n} discoveries`, icon: <Compass size={17} /> },
};
const FALLBACK_ACTION = { one: 'Earned points', many: (n: number) => `Earned points ${n} times`, icon: <Star size={17} /> };

// A row on screen: a single notification, or several same-day point awards merged.
type Row =
  | { kind: 'friend'; key: string; n: AppNotification; isNew: boolean }
  | { kind: 'points'; key: string; actionType: string; count: number; total: number; createdAt: string; isNew: boolean };

function timeLabel(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

function dayBucket(iso: string): string {
  const today = startOfDay(new Date());
  const day = startOfDay(new Date(iso));
  const diff = Math.round((today - day) / 86_400_000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return 'This week';
  return 'Earlier';
}

export default function NotificationsView() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [loadedAt, setLoadedAt] = useState(0); // clock reading taken when the list loads (render stays pure)

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    Promise.all([NotificationsService.list(user.id), NotificationsService.getSeenAt()]).then(([result, lastSeen]) => {
      if (cancelled) return;
      setNotifications(result.success ? result.data ?? [] : []);
      setSeenAt(lastSeen);
      setLoadedAt(Date.now());
      setIsLoading(false);
      // Mark seen after the list is fetched, so this visit still shows what
      // was actually new - only clears the header dot for next time.
      NotificationsService.markSeen(user.id);
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const respondToRequest = async (notification: AppNotification, accept: boolean) => {
    if (!notification.requestId) return;
    setRespondingId(notification.id);
    const result = accept
      ? await FriendRequestService.acceptRequest(notification.requestId)
      : await FriendRequestService.declineRequest(notification.requestId);
    if (result.success) {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }
    setRespondingId(null);
  };

  const isNew = (iso: string) => !seenAt || new Date(iso).getTime() > new Date(seenAt).getTime();

  const requests = notifications.filter((n) => n.type === 'friend_request');

  // Points earned in the last 7 days, for the summary card.
  const weekPoints = useMemo(() => {
    const since = loadedAt - 7 * 86_400_000;
    return notifications
      .filter((n) => n.type === 'points' && new Date(n.createdAt).getTime() >= since)
      .reduce((sum, n) => sum + (n.pointsAwarded ?? 0), 0);
  }, [notifications, loadedAt]);

  // Everything except pending requests, filtered, merged and grouped by day.
  const groups = useMemo(() => {
    const visible = notifications.filter((n) => {
      if (n.type === 'friend_request') return false;
      if (filter === 'friends') return n.type === 'friend_accepted';
      if (filter === 'points') return n.type === 'points';
      return true;
    });

    const rows: Row[] = [];
    for (const n of visible) {
      const fresh = isNew(n.createdAt);
      if (n.type === 'points') {
        const action = n.actionType || '';
        const prev = rows[rows.length - 1];
        // Merge with the previous row if it's the same action, same day and same new/old state.
        if (
          prev?.kind === 'points' &&
          prev.actionType === action &&
          prev.isNew === fresh &&
          startOfDay(new Date(prev.createdAt)) === startOfDay(new Date(n.createdAt))
        ) {
          prev.count += 1;
          prev.total += n.pointsAwarded ?? 0;
          continue;
        }
        rows.push({ kind: 'points', key: n.id, actionType: action, count: 1, total: n.pointsAwarded ?? 0, createdAt: n.createdAt, isNew: fresh });
      } else {
        rows.push({ kind: 'friend', key: n.id, n, isNew: fresh });
      }
    }

    const order = ['New', 'Today', 'Yesterday', 'This week', 'Earlier'];
    const byBucket = new Map<string, Row[]>();
    for (const r of rows) {
      const createdAt = r.kind === 'points' ? r.createdAt : r.n.createdAt;
      const bucket = r.isNew ? 'New' : dayBucket(createdAt);
      byBucket.set(bucket, [...(byBucket.get(bucket) ?? []), r]);
    }
    return order.filter((b) => byBucket.has(b)).map((b) => ({ label: b, rows: byBucket.get(b)! }));
    // isNew depends on seenAt
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications, filter, seenAt]);

  const showRequests = filter !== 'points' && requests.length > 0;
  const nothing = !showRequests && groups.length === 0;

  return (
    <div className="fz-notif">
      <div className="fz-notif__inner">
        <header className="fz-notif__head">
          <div>
            <h1 className="fz-notif__title">Notifications</h1>
            <p className="fz-notif__sub">Friend requests, friends and points - all in one place.</p>
          </div>
        </header>

        <div className="fz-notif__filters" role="tablist" aria-label="Filter notifications">
          {(
            [
              ['all', 'All'],
              ['friends', 'Friends'],
              ['points', 'Points'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              className={`fz-profile-tab${filter === key ? ' fz-profile-tab--active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
              {key === 'friends' && requests.length > 0 && <span className="fz-notif__count">{requests.length}</span>}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="fz-notif__list" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="fz-notif__row fz-notif__row--ghost">
                <span className="fz-notif__ghost-icon" />
                <span className="fz-notif__ghost-lines"><span /><span /></span>
              </div>
            ))}
          </div>
        ) : (
          <>
            {filter !== 'friends' && weekPoints > 0 && (
              <Link href="/leaderboard?tab=rewards" className="fz-notif__summary">
                <span className="fz-notif__summary-icon"><Trophy size={20} /></span>
                <span className="fz-notif__summary-text">
                  <strong>+{weekPoints} points this week</strong>
                  <span>Keep sharing and posting to climb the leaderboard.</span>
                </span>
                <span className="fz-notif__summary-go">Rewards</span>
              </Link>
            )}

            {showRequests && (
              <section className="fz-notif__section">
                <h2 className="fz-notif__label">
                  Friend requests <span className="fz-notif__label-count">{requests.length}</span>
                </h2>
                <div className="fz-notif__list">
                  {requests.map((n) => (
                    <div key={n.id} className="fz-notif__row fz-notif__row--request">
                      <Link href={`/profile/${n.actorId}`} className="fz-notif__avatar">
                        <ChatAvatar id={n.actorId || n.id} name={n.actorName || 'Someone'} src={n.actorAvatarUrl ?? null} size={44} />
                      </Link>
                      <div className="fz-notif__text">
                        <p>
                          <Link href={`/profile/${n.actorId}`}><strong>{n.actorName}</strong></Link> wants to be friends
                        </p>
                        <span className="fz-notif__time">{timeLabel(n.createdAt)}</span>
                      </div>
                      <div className="fz-notif__actions">
                        <button type="button" className="fz-notif__btn fz-notif__btn--accept" disabled={respondingId === n.id} onClick={() => respondToRequest(n, true)}>
                          Accept
                        </button>
                        <button type="button" className="fz-notif__btn fz-notif__btn--decline" disabled={respondingId === n.id} onClick={() => respondToRequest(n, false)}>
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {groups.map((g) => (
              <section key={g.label} className="fz-notif__section">
                <h2 className={`fz-notif__label${g.label === 'New' ? ' fz-notif__label--new' : ''}`}>{g.label}</h2>
                <div className="fz-notif__list">
                  {g.rows.map((r) =>
                    r.kind === 'friend' ? (
                      <Link key={r.key} href={`/profile/${r.n.actorId}`} className={`fz-notif__row${r.isNew ? ' is-new' : ''}`}>
                        <span className="fz-notif__avatar">
                          <ChatAvatar id={r.n.actorId || r.n.id} name={r.n.actorName || 'Someone'} src={r.n.actorAvatarUrl ?? null} size={44} />
                          <span className="fz-notif__badge"><UserCheck size={11} strokeWidth={3} /></span>
                        </span>
                        <span className="fz-notif__text">
                          <p><strong>{r.n.actorName}</strong> accepted your friend request</p>
                          <span className="fz-notif__time">{timeLabel(r.n.createdAt)}</span>
                        </span>
                        {r.isNew && <span className="fz-notif__dot" aria-label="New" />}
                      </Link>
                    ) : (
                      <div key={r.key} className={`fz-notif__row${r.isNew ? ' is-new' : ''}`}>
                        <span className="fz-notif__icon">{(POINT_ACTIONS[r.actionType] ?? FALLBACK_ACTION).icon}</span>
                        <span className="fz-notif__text">
                          <p>
                            {r.count > 1
                              ? (POINT_ACTIONS[r.actionType] ?? FALLBACK_ACTION).many(r.count)
                              : (POINT_ACTIONS[r.actionType] ?? FALLBACK_ACTION).one}
                          </p>
                          <span className="fz-notif__time">{timeLabel(r.createdAt)}</span>
                        </span>
                        <span className="fz-notif__points">+{r.total}</span>
                        {r.isNew && <span className="fz-notif__dot" aria-label="New" />}
                      </div>
                    ),
                  )}
                </div>
              </section>
            ))}

            {nothing && (
              <div className="fz-empty-state fz-notif__empty">
                <div className="fz-notif__empty-icon"><Sparkles size={26} /></div>
                <div className="fz-notif__empty-title">
                  {filter === 'friends' ? 'No friend activity yet' : filter === 'points' ? 'No points yet' : 'You’re all caught up'}
                </div>
                <p className="fz-notif__empty-sub">
                  {filter === 'points'
                    ? 'Share cards and post your food finds to start earning.'
                    : 'Friend requests and points will show up here.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
