// Working hours + live open/closed status for restaurant profiles.
// Pure functions (no React, no Supabase) - the status is recomputed from the
// hours saved in the Restaurant Dashboard, in the restaurant's own timezone,
// so changing the hours (or the clock moving on) changes the status.

export const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export const DAY_LABELS: Record<DayKey, string> = {
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
};

/** Display order in the dashboard / info tab (week starts Monday). */
export const WEEK_ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export type DayHours = { closed: boolean; open: string; close: string }; // "HH:MM", 24h
export type WeeklyHours = Partial<Record<DayKey, DayHours>>;

export type OpenStatus = {
  isOpen: boolean;
  /** Short label, e.g. "Open now", "Closes in 2 hours", "Closed", "Opens tomorrow at 9:00 AM". */
  label: string;
  /** Secondary detail, e.g. "Closes at 10:00 PM". */
  detail?: string;
};

export const DEFAULT_DAY: DayHours = { closed: false, open: '09:00', close: '22:00' };

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export function formatTime(hhmm: string) {
  const mins = toMinutes(hhmm) % (24 * 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** "9:00 AM – 10:00 PM" / "Closed" / "Open 24 hours". */
export function formatDay(day: DayHours | undefined) {
  if (!day || day.closed) return 'Closed';
  if (day.open === day.close) return 'Open 24 hours';
  return `${formatTime(day.open)} – ${formatTime(day.close)}`;
}

export function hasAnyHours(hours: WeeklyHours | null | undefined) {
  return !!hours && WEEK_ORDER.some((d) => hours[d] && !hours[d]!.closed);
}

/** Current weekday + minutes-since-midnight in the given IANA timezone. */
function nowIn(timezone: string, now: Date) {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  } catch {
    parts = new Intl.DateTimeFormat('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  }
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { dayIndex: dayIndex < 0 ? 0 : dayIndex, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

function humanDuration(mins: number) {
  if (mins < 60) return `${mins} min`;
  const h = Math.round(mins / 60);
  return `${h} hour${h === 1 ? '' : 's'}`;
}

/**
 * Live status from weekly hours. Handles overnight hours (close < open spills
 * into the next day) and "open 24 hours" (open === close). Returns null when
 * no hours have been set, so the UI can simply hide the status.
 */
export function getOpenStatus(hours: WeeklyHours | null | undefined, timezone = 'UTC', now = new Date()): OpenStatus | null {
  if (!hasAnyHours(hours)) return null;
  const h = hours as WeeklyHours;
  const { dayIndex, minutes } = nowIn(timezone, now);
  const WEEK = 7 * 24 * 60;
  const nowAbs = dayIndex * 24 * 60 + minutes;

  // Every opening window this week, as absolute minutes from Sunday 00:00.
  const windows: { start: number; end: number; day: number; close: string }[] = [];
  DAY_KEYS.forEach((key, i) => {
    const d = h[key];
    if (!d || d.closed) return;
    const start = i * 24 * 60 + toMinutes(d.open);
    let end = i * 24 * 60 + toMinutes(d.close);
    if (end <= start) end += 24 * 60; // overnight or 24h
    windows.push({ start, end, day: i, close: d.close });
  });

  // Open right now? (also check last week's windows that spill past Saturday night)
  for (const w of windows) {
    for (const shift of [0, -WEEK]) {
      if (nowAbs >= w.start + shift && nowAbs < w.end + shift) {
        const left = w.end + shift - nowAbs;
        if (w.end - w.start >= 24 * 60) return { isOpen: true, label: 'Open 24 hours' };
        if (left <= 180) return { isOpen: true, label: `Closes in ${humanDuration(left)}`, detail: `Closes at ${formatTime(w.close)}` };
        return { isOpen: true, label: 'Open now', detail: `Closes at ${formatTime(w.close)}` };
      }
    }
  }

  // Closed - find the next opening.
  let best: { at: number; day: number; open: string } | null = null;
  for (const w of windows) {
    const at = w.start > nowAbs ? w.start : w.start + WEEK;
    if (!best || at < best.at) best = { at, day: w.day, open: h[DAY_KEYS[w.day]]!.open };
  }
  if (!best) return { isOpen: false, label: 'Closed' };

  const daysAhead = Math.floor(best.at / (24 * 60)) - dayIndex;
  const time = formatTime(best.open);
  if (daysAhead === 0) {
    const inMins = best.at - nowAbs;
    return { isOpen: false, label: inMins <= 60 ? `Opens in ${humanDuration(inMins)}` : `Opens at ${time}`, detail: 'Closed now' };
  }
  if (daysAhead === 1) return { isOpen: false, label: `Opens tomorrow at ${time}`, detail: 'Closed now' };
  return { isOpen: false, label: `Opens ${DAY_LABELS[DAY_KEYS[best.day]]} at ${time}`, detail: 'Closed now' };
}
