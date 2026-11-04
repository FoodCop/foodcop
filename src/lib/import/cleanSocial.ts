// Strips social-media noise from an imported post's text so only the food /
// recipe content is kept (client list #9, 2026-11-04: "for recipe only recipe
// data, no other texts like likes, comments"). Pure and deterministic, so it
// works even while FUZO AI is off; the AI prompt (api/ai/fill) is told the
// same thing for whatever slips through.

// "1,234 likes, 56 comments - chef.anna on March 3, 2024: "...""  (Instagram / Facebook og:description)
const COUNTS_PREFIX = /^\s*[\d.,]+\s*[kKmM]?\s+(likes?|reactions?|views?)(\s*,\s*[\d.,]+\s*[kKmM]?\s+(comments?|shares?))*\s*[-–—]\s*[^:]{1,80}?(\s+on\s+[^:]{3,40})?:\s*/i;
// Whole lines that are engagement or promotion, not food.
const NOISE_LINE = new RegExp(
  [
    String.raw`^[\d.,]+\s*[kKmM]?\s+(likes?|comments?|views?|shares?|reactions?|followers?)\b`,
    String.raw`^(view|see)\s+(all\s+)?[\d.,]*\s*(comments?|replies)`,
    String.raw`\b(follow|subscribe|like|share|save|comment|tag)\b.{0,30}\b(for more|this post|a friend|below|my (page|channel)|notifications?)\b`,
    String.raw`\b(link in (my )?bio|use (my )?code|discount code|promo code|affiliate|sponsored|#ad\b|paid partnership)`,
    String.raw`^(original audio|♬|music:)`,
    String.raw`^\s*@\w[\w.]*(\s+@\w[\w.]*)*\s*$`, // a line of only @mentions
  ].join('|'),
  'i',
);

/** Cleans a caption: drops the "N likes, N comments - user on date:" prefix,
 *  engagement / promo lines, trailing hashtag blocks and wrapping quotes. */
export function cleanSocialText(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = raw.replace(COUNTS_PREFIX, '');
  // The quoted caption that follows the prefix: "…".
  s = s.replace(/^["“]([\s\S]*)["”]\.?\s*$/, '$1');
  const lines = s
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => !NOISE_LINE.test(l))
    // A line that is nothing but hashtags (and emoji / punctuation).
    .filter((l) => !/^(?:[#＃][\p{L}\p{N}_]+[\s.,·•|]*)+$/u.test(l));
  s = lines.join('\n');
  // Hashtags trailing the last sentence: "… so good! #food #yum #reels"
  s = s.replace(/(\s*[#＃][\p{L}\p{N}_]+)+\s*$/u, '');
  s = s.replace(/\n{3,}/g, '\n\n').trim();
  return s || null;
}
