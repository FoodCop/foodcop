import type { Metadata } from 'next';
import PostView from '@/components/post/PostView';

// A shared post (client, 2026-10-14; plan Phase 9): "share via FUZO chat, or
// a link - someone without an account signs up, then sees the post".
// The page itself is PostView (client). This server part only gives link
// previews (WhatsApp, iMessage...) a title and photo, read with the public
// key so the database's privacy rules decide: a private profile's post gets
// the generic FUZO preview.

type Props = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GENERIC_TITLE = 'A post on FUZO';
const GENERIC_DESCRIPTION = 'Someone shared a food find with you on FUZO. Sign up to see it.';
const GENERIC: Metadata = {
  title: GENERIC_TITLE,
  description: GENERIC_DESCRIPTION,
  openGraph: { title: GENERIC_TITLE, description: GENERIC_DESCRIPTION, siteName: 'FUZO', type: 'website' },
  twitter: { card: 'summary', title: GENERIC_TITLE, description: GENERIC_DESCRIPTION },
};

type PreviewRow = { title: string | null; image_url: string | null; photos: string[] | null };

async function loadPreview(id: string): Promise<PreviewRow | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !UUID.test(id)) return null;
  try {
    const res = await fetch(`${url}/rest/v1/food_cards?id=eq.${id}&status=eq.PUBLISHED&select=title,image_url,photos`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as PreviewRow[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await loadPreview(id);
  if (!post) return GENERIC;
  const image = [post.photos?.[0], post.image_url].find((u) => !!u && /^https:\/\//i.test(u));
  const title = post.title && post.title !== 'Untitled' ? `${post.title} on FUZO` : GENERIC_TITLE;
  return {
    title,
    description: GENERIC_DESCRIPTION,
    openGraph: { title, description: GENERIC_DESCRIPTION, siteName: 'FUZO', images: image ? [image] : undefined, type: 'article' },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description: GENERIC_DESCRIPTION, images: image ? [image] : undefined },
  };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  return <PostView id={id} />;
}
