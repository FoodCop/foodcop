'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Home, Lock } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import ShareSheet, { type SharePayload } from '@/components/share/ShareSheet';
import { CreateFlow } from '@/components/create/flow/CreateFlow';
import { createClient } from '@/lib/supabase/client';
import { foodCardService } from '@/lib/services/foodCardService';
import { postCover, postPath, postSharePayload, postTitle } from '@/lib/share/postShare';
import { rememberNextAfterSignup } from '@/lib/share/afterSignup';
import type { FoodCardRecord } from '@/lib/types/foodCard';
import { PostDetail, type PostAuthor } from './PostDetail';

// A shared post (client, 2026-10-14; plan Phase 9). Signed in: the whole
// post (photos, who posted it, where, tags, recipe steps) with Share, and
// Edit on your own posts. Signed out: a preview with "Sign up to see it" -
// after signing up (and onboarding) they come straight back here.

type Author = PostAuthor;
type State =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; card: FoodCardRecord; author: Author | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function PostView({ id }: { id: string }) {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [sharing, setSharing] = useState<SharePayload | null>(null);
  const [editing, setEditing] = useState(false);
  const valid = UUID.test(id);

  // Signed out, the database only returns posts of public profiles - enough
  // for the preview; everything else gets the generic sign-up prompt.
  const load = useCallback(async () => {
    const res = await foodCardService.getCardById(id);
    const card = res.success ? res.data : null;
    if (!card || (card.status !== 'PUBLISHED' && card.user_id !== user?.id)) return { status: 'missing' } as State;
    let author: Author | null = null;
    const supabase = createClient();
    if (supabase) {
      const { data } = await supabase.from('users').select('id, display_name, username, avatar_url').eq('id', card.user_id).maybeSingle();
      if (data) author = { id: data.id as string, name: (data.display_name as string) || (data.username as string) || 'a FUZO member', avatar: (data.avatar_url as string) || null };
    }
    return { status: 'ready', card, author } as State;
  }, [id, user?.id]);

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    load().then((s) => {
      if (!cancelled) setState(s);
    });
    return () => {
      cancelled = true;
    };
  }, [load, valid]);

  const shown: State = valid ? state : { status: 'missing' };

  // ----- Signed out: sign up to see it ------------------------------------------
  if (!user) {
    const card = shown.status === 'ready' ? shown.card : null;
    const author = shown.status === 'ready' ? shown.author : null;
    const cover = card ? postCover(card) : undefined;
    const next = postPath(id);
    return (
      <main className="fz-post fz-post--gate">
        <motion.section
          className="fz-post__gate"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          aria-labelledby="fz-post-gate-title"
        >
          <div className="fz-post__gate-photo" aria-hidden="true">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" />
            ) : (
              <span className="fz-post__gate-fallback" />
            )}
            <span className="fz-post__gate-lock">
              <Lock size={22} />
            </span>
          </div>
          <p className="fz-post__gate-eyebrow">{author ? `${author.name} shared a post` : 'Someone shared a post with you'}</p>
          <h1 id="fz-post-gate-title" className="fz-post__gate-title">
            {card ? postTitle(card) : 'A food find on FUZO'}
          </h1>
          <p className="fz-post__gate-sub">Join FUZO to see it - and find food that fits your taste, places near you and what your friends are eating.</p>
          <div className="fz-post__gate-actions">
            <Link href={`/login?next=${encodeURIComponent(next)}&mode=signup`} className="fz-post__btn fz-post__btn--primary" onClick={() => rememberNextAfterSignup(next)}>
              Sign up to see it
            </Link>
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="fz-post__btn" onClick={() => rememberNextAfterSignup(next)}>
              I already have an account
            </Link>
          </div>
        </motion.section>
      </main>
    );
  }

  // ----- Signed in --------------------------------------------------------------
  if (shown.status === 'loading') {
    return (
      <main className="fz-post" aria-busy="true">
        <div className="fz-post__card fz-post__card--skeleton">
          <div className="fz-post__photos" />
          <div className="fz-post__body">
            <span className="fz-post__sk fz-post__sk--sm" />
            <span className="fz-post__sk" />
            <span className="fz-post__sk fz-post__sk--md" />
          </div>
        </div>
        <span className="visually-hidden" role="status">
          Loading post…
        </span>
      </main>
    );
  }

  if (shown.status === 'missing') {
    return (
      <main className="fz-post">
        <section className="fz-post__card fz-post__missing">
          <h1 className="fz-post__title">This post isn&apos;t available</h1>
          <p className="fz-post__muted">It may have been deleted, or its owner made their profile private.</p>
          <Link href="/dashboard" className="fz-post__btn fz-post__btn--primary">
            <Home size={18} aria-hidden="true" /> Go home
          </Link>
        </section>
      </main>
    );
  }

  const { card, author } = shown;
  return (
    <>
      <PostDetail
        card={card}
        author={author}
        isOwner={card.user_id === user.id}
        onShare={() => setSharing(postSharePayload(card, author?.name))}
        onEdit={() => setEditing(true)}
      />

      <ShareSheet payload={sharing} onClose={() => setSharing(null)} />

      {editing && (
        <CreateFlow
          editCard={card}
          onSaved={() => load().then(setState)}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
