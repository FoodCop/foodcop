import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, CheckCircle2, Loader2 } from 'lucide-react';
import type { AppItem } from '../../types/appItem';
import { RSVPService } from '../../lib/services/rsvpService';

interface EventInviteCardProps {
  messageId?: string;
  userId?: string;
  event: AppItem;
  role: 'user' | 'ai';
  onRSVP?: (status: 'going' | 'maybe' | 'not_going') => void;
}

export const EventInviteCard = ({ messageId, userId, event, role, onRSVP }: EventInviteCardProps) => {
  const isUser = role === 'user';
  const [status, setStatus] = useState<'going' | 'maybe' | 'not_going' | null>(null);
  const [counts, setCounts] = useState({ going: 0, maybe: 0, not_going: 0 });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!messageId) return;

    const loadRSVPs = async () => {
      const result = await RSVPService.getRSVPsForMessage(messageId);
      if (result.success && result.data) {
        setCounts(result.data);
        if (userId && result.raw) {
          const myRsvp = result.raw.find(r => r.user_id === userId);
          if (myRsvp) setStatus(myRsvp.status as any);
        }
      }
    };

    loadRSVPs();
  }, [messageId, userId]);

  const handleRSVP = async (newStatus: 'going' | 'maybe' | 'not_going') => {
    if (!messageId || !userId || isUpdating) return;

    setIsUpdating(true);
    const result = await RSVPService.submitRSVP(messageId, userId, newStatus);

    if (result.success) {
      setStatus(newStatus);
      // Refresh counts
      const countsResult = await RSVPService.getRSVPsForMessage(messageId);
      if (countsResult.success && countsResult.data) {
        setCounts(countsResult.data);
      }
      onRSVP?.(newStatus);
    }
    setIsUpdating(false);
  };

  return (
    <div className={`event-invite${isUser ? ' is-mine' : ''}`}>
      {/* Visual Header */}
      <div className="event-invite__media">
        <img
          src={event.img || 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80'}
          alt="Event"
        />
        <div className="event-invite__media-scrim" />
        <div className="event-invite__media-content">
          <div className="event-invite__media-tags">
            <div className="event-invite__media-badge">Invite</div>
            <span className="event-invite__media-brand">Fuzo Social</span>
          </div>
          <h3 className="event-invite__title">
            {event.name || 'Culinary Meetup'}
          </h3>
        </div>
      </div>

      {/* Details */}
      <div className="event-invite__body">
        <div className="event-invite__grid">
          <div className="event-invite__field">
            <p className="event-invite__field-label">When</p>
            <div className="event-invite__field-value">
              <Calendar size={12} />
              <span>{event.eventDate || 'Sat, 12 Oct'}</span>
            </div>
          </div>
          <div className="event-invite__field">
            <p className="event-invite__field-label">Time</p>
            <div className="event-invite__field-value">
              <span>{event.eventTime || '19:00 PM'}</span>
            </div>
          </div>
        </div>

        <div className="event-invite__field">
          <p className="event-invite__field-label">Location</p>
          <div className="event-invite__field-value">
            <MapPin size={12} />
            <span>{event.eventLocation || 'Mama Mia\'s, Downtown'}</span>
          </div>
        </div>

        <div className="event-invite__footer">
          <div className="event-invite__attendance-row">
            <div className="event-invite__attendees">
              <Users size={12} />
              <span>{counts.going} Attending</span>
            </div>
            {status && (
              <div className="event-invite__my-status">
                <CheckCircle2 size={12} />
                <span>{status}</span>
              </div>
            )}
          </div>

          <div className="event-invite__rsvp-grid">
            {(['going', 'maybe', 'not_going'] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleRSVP(s)}
                disabled={isUpdating}
                className={`event-invite__rsvp-btn${status === s ? ' is-selected' : ''}`}
              >
                {isUpdating && status === s ? <Loader2 size={10} className="chat-spin" /> : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
