'use client';

import { useEffect, useState } from 'react';
import { BadgeCheck, Clock, Loader2, ThumbsDown, ThumbsUp, Users } from 'lucide-react';
import { CommunityPlacesService, VOTES_TO_DECIDE, type CommunityPlace, type VoteState } from '@/lib/services/communityPlacesService';

// The community check for a restaurant FUZO members added (client,
// 2026-10-14; plan Phase 7): everyone, the creator included, votes once -
// "Yes, it's real" or "Not real". At 100 votes, 2/3 Yes makes it Verified by
// Community and 2/3 Not real removes it from the map.

export function CommunityPlaceStrip({ place }: { place: CommunityPlace }) {
  const [state, setState] = useState<VoteState>({ status: place.status, yes: place.yes, no: place.no, myVote: null });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    CommunityPlacesService.myVote(place.id).then((myVote) => {
      if (!cancelled && myVote !== null) setState((s) => ({ ...s, myVote }));
    });
    return () => {
      cancelled = true;
    };
  }, [place.id]);

  const total = state.yes + state.no;
  const verified = state.status === 'verified';
  const removed = state.status === 'removed';
  const yesShare = total ? Math.round((state.yes / total) * 100) : 0;

  const vote = async (isReal: boolean) => {
    setBusy(true);
    setMessage(null);
    const res = await CommunityPlacesService.vote(place.id, isReal);
    setBusy(false);
    if (!res.success || !res.data) {
      setMessage(res.error === 'Sign in to vote.' ? 'Sign in to vote.' : 'Could not save your vote. Please try again.');
      return;
    }
    setState(res.data);
    if (res.data.status === 'verified') setMessage('Thanks! The community verified this place.');
    else if (res.data.status === 'removed') setMessage('Thanks! The community decided this place isn’t real.');
  };

  return (
    <section className={`scout-community${verified ? ' is-verified' : ''}`} aria-label="Community check">
      <div className="scout-community__head">
        <span className="scout-community__badge">
          {verified ? <BadgeCheck size={14} aria-hidden="true" /> : <Users size={14} aria-hidden="true" />}
          {verified ? 'Verified by Community' : removed ? 'Removed by the community' : 'Community Added'}
        </span>
        <span className="scout-community__count">
          {total.toLocaleString()} {total === 1 ? 'vote' : 'votes'}
          {total > 0 && ` · ${yesShare}% say it's real`}
        </span>
      </div>

      {place.hours && (
        <p className="scout-community__line">
          <Clock size={14} aria-hidden="true" /> {place.hours}
        </p>
      )}

      {state.status === 'community' && (
        <>
          <p className="scout-community__ask">Added by a FUZO member. Have you been - is it real?</p>
          <div
            className="scout-community__progress"
            role="progressbar"
            aria-label="Votes so far"
            aria-valuemin={0}
            aria-valuemax={VOTES_TO_DECIDE}
            aria-valuenow={Math.min(total, VOTES_TO_DECIDE)}
          >
            <span style={{ width: `${Math.min(100, (total / VOTES_TO_DECIDE) * 100)}%` }} />
          </div>
          <p className="scout-community__hint">
            {total < VOTES_TO_DECIDE
              ? `${(VOTES_TO_DECIDE - total).toLocaleString()} more ${VOTES_TO_DECIDE - total === 1 ? 'vote' : 'votes'} until the community decides (2 in 3 needed).`
              : 'Needs 2 in 3 votes either way to decide.'}
          </p>
          {state.myVote === null ? (
            <div className="scout-community__actions">
              <button type="button" className="scout-community__btn is-yes" onClick={() => vote(true)} disabled={busy}>
                {busy ? <Loader2 size={16} className="scout-spin" aria-hidden="true" /> : <ThumbsUp size={16} aria-hidden="true" />} Yes, it&apos;s real
              </button>
              <button type="button" className="scout-community__btn" onClick={() => vote(false)} disabled={busy}>
                <ThumbsDown size={16} aria-hidden="true" /> Not real
              </button>
            </div>
          ) : (
            <p className="scout-community__voted">You voted: {state.myVote ? "Yes, it's real" : 'Not real'}</p>
          )}
        </>
      )}

      {message && (
        <p className="scout-community__hint" role="status">
          {message}
        </p>
      )}
    </section>
  );
}

export default CommunityPlaceStrip;
