'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import foodCardService from '@/lib/services/foodCardService';
import { postPath } from '@/lib/share/postShare';

// A FUZO post link typed or pasted into a chat shows as a rich card, like an
// Instagram link in a DM. The preview is read on this device from the post
// itself: the message stays encrypted and nothing about it goes anywhere else.
// While loading, or if the post is gone or private, the plain text is shown.

const POST_LINK = /(?:https?:\/\/)?(?:www\.)?([a-z0-9.-]+(?::\d+)?)\/post\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b\S*/i;

/** The post in a message and the text around it. Only FUZO's own links count. */
export function findPostLink(text: string): { postId: string; rest: string } | null {
  const m = text.match(POST_LINK);
  if (!m) return null;
  const host = m[1].toLowerCase();
  const own = host === 'fuzo.app' || (typeof window !== 'undefined' && host === window.location.host.toLowerCase());
  if (!own) return null;
  return { postId: m[2].toLowerCase(), rest: text.replace(m[0], '').trim() };
}

type Preview = { title: string; caption: string; image: string | null };
const cache = new Map<string, Preview | null>(); // A thread re-renders a lot: one lookup per post.

export function ChatPostLink({ postId, fallback, above }: { postId: string; fallback: ReactNode; above: ReactNode }) {
  const [preview, setPreview] = useState<Preview | null | undefined>(() => cache.get(postId));

  useEffect(() => {
    if (cache.has(postId)) return;
    let cancelled = false;
    foodCardService.getCardById(postId).then((res) => {
      const c = res.success ? res.data : null;
      const value = c ? { title: c.title || 'Post on FUZO', caption: c.caption || '', image: c.image_url || null } : null;
      cache.set(postId, value);
      if (!cancelled) setPreview(value);
    });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  if (!preview) return <>{fallback}</>;
  return (
    <>
    {above}
    <div className="fz-chat-link">
      <Link
        href={postPath(postId)}
        className="fz-chat-link__card"
        style={preview.image ? { ['--cover' as string]: `url("${preview.image.replace(/"/g, '%22')}")` } : undefined}
        aria-label={`Open ${preview.title}`}
      >
        <span className="fz-chat-link__media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview.image && <img src={preview.image} alt="" referrerPolicy="no-referrer" />}
          <span className="fz-chat-link__scrim" aria-hidden />
          <span className="fz-chat-link__headline">{preview.title}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="fz-chat-link__mark" src="/fuzo_logo.svg" alt="" aria-hidden />
        </span>
        <span className="fz-chat-link__caption">
          <span className="fz-chat-link__title">Post on FUZO</span>
          <span className="fz-chat-link__sub">{preview.caption || 'Tap to open'}</span>
        </span>
      </Link>
    </div>
    </>
  );
}
