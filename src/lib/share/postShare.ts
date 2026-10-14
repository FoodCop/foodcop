// Sharing a post (client, 2026-10-14; plan Phase 9): one link for every post,
// /post/<id>. Signed-in people see the post; anyone else is asked to sign up
// first and lands back on it. Sending it in FUZO chat uses the same card.

import type { SharePayload } from '@/components/share/ShareSheet';
import { TYPE_META, type FoodCardRecord } from '@/lib/types/foodCard';

/** The page that opens a post. */
export const postPath = (cardId: string) => `/post/${cardId}`;

/** A post's title for sharing ("Untitled" posts use their place or kind). */
export const postTitle = (card: Pick<FoodCardRecord, 'title' | 'place_name' | 'card_type'>) =>
  card.title && card.title !== 'Untitled' ? card.title : card.place_name || `${TYPE_META[card.card_type]?.label ?? 'A'} post`;

/** The post's first real photo (http), for previews and chat cards. */
export const postCover = (card: Pick<FoodCardRecord, 'photos' | 'image_url'>) =>
  [card.photos?.[0], card.image_url].find((u): u is string => !!u && /^https?:\/\//i.test(u));

export function postSharePayload(card: FoodCardRecord, authorName?: string | null): SharePayload {
  const meta = TYPE_META[card.card_type];
  const title = postTitle(card);
  const image = postCover(card);
  return {
    title,
    subtitle: [meta?.label, authorName ? `by ${authorName}` : null, card.place_name].filter(Boolean).join(' · '),
    image,
    url: postPath(card.id),
    text: authorName ? `Check out "${title}" by ${authorName} on FUZO` : `Check out "${title}" on FUZO`,
    item: {
      id: card.id,
      itemId: card.id,
      itemType: 'food_card', // chat opens it in the post viewer
      type: meta?.label,
      title,
      cat: meta?.label,
      img: image,
      caption: card.caption ?? undefined,
      author: authorName ?? undefined,
      placeId: card.place_id ?? undefined,
    },
  };
}
