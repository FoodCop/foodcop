'use client';

import { useEffect, useState } from 'react';
import { Bell, UserPlus, UserCheck, Star } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { NotificationsService, POINTS_ACTION_COPY, type AppNotification } from '@/lib/services/notificationsService';
import { FriendRequestService } from '@/lib/services/friendRequestService';

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsView() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      const result = await NotificationsService.list(user.id);
      if (!cancelled) {
        setNotifications(result.success ? result.data ?? [] : []);
        setIsLoading(false);
      }
      // Mark seen after the list is fetched, so this visit still shows what
      // was actually new - only clears the header dot for next time.
      NotificationsService.markSeen(user.id);
    })();

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

  return (
    <div className="container py-4 py-md-5" style={{ maxWidth: 640 }}>
      <div className="text-center mb-4">
        <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary mb-2" style={{ width: 56, height: 56 }}>
          <Bell size={26} />
        </div>
        <h2 className="fw-bolder mb-1">Notifications</h2>
        <p className="text-muted mb-0">Friend requests and points, all in one place.</p>
      </div>

      {isLoading ? (
        <div className="text-center text-muted py-5">Loading…</div>
      ) : notifications.length === 0 ? (
        <div className="text-center text-muted py-5">
          <div className="fs-1 mb-2">🔔</div>
          Nothing new right now.
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {notifications.map((n) => (
            <div key={n.id} className="d-flex align-items-center gap-3 p-3 bg-white rounded-4 shadow-sm">
              <div
                className={`d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 ${
                  n.type === 'points' ? 'bg-warning bg-opacity-10 text-warning' : 'bg-primary bg-opacity-10 text-primary'
                }`}
                style={{ width: 42, height: 42 }}
              >
                {n.type === 'friend_request' && <UserPlus size={18} />}
                {n.type === 'friend_accepted' && <UserCheck size={18} />}
                {n.type === 'points' && <Star size={18} />}
              </div>

              <div className="flex-grow-1">
                {n.type === 'friend_request' && (
                  <div className="fw-semibold">{n.actorName} sent you a friend request</div>
                )}
                {n.type === 'friend_accepted' && (
                  <div className="fw-semibold">{n.actorName} accepted your friend request</div>
                )}
                {n.type === 'points' && (
                  <div className="fw-semibold">
                    +{n.pointsAwarded} points {POINTS_ACTION_COPY[n.actionType || ''] || 'earned'}
                  </div>
                )}
                <div className="text-muted small">{timeAgo(n.createdAt)}</div>
              </div>

              {n.type === 'friend_request' && (
                <div className="d-flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    className="btn btn-sm btn-primary rounded-pill px-3"
                    disabled={respondingId === n.id}
                    onClick={() => respondToRequest(n, true)}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                    disabled={respondingId === n.id}
                    onClick={() => respondToRequest(n, false)}
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
