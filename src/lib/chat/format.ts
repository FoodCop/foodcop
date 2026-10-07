// Small display helpers for the chat UI.

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const DAY = 86_400_000;

/** Inbox timestamp: time today, "Yesterday", weekday within a week, else "Sep 3". */
export function formatInboxTime(iso: string | null, now = new Date()): string {
  if (!iso) return '';
  const d = new Date(iso);
  const days = Math.round((startOfDay(now) - startOfDay(d)) / DAY);
  if (days <= 0) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (days === 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const formatMessageTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/** Divider label between days: "Today", "Yesterday", "Wednesday", or "Sep 3, 2026". */
export function formatDayLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const days = Math.round((startOfDay(now) - startOfDay(d)) / DAY);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
}

export const isSameDay = (a: string, b: string) => startOfDay(new Date(a)) === startOfDay(new Date(b));

export const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

// Warm, on-brand tints for initials avatars, picked deterministically per id.
const TINTS = ['#fde3ec', '#e8f3d6', '#dcedfb', '#ffe3dd', '#fbf3d9'];
export const tintFor = (id: string) => TINTS[[...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % TINTS.length];
