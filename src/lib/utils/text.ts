/**
 * Plain text from a string that may contain HTML (e.g. recipe instructions
 * from an external API), for showing as React text. Tags are stripped
 * repeatedly until none are left, then any stray "<" or ">" is removed, so
 * input like "<scr<b>ipt>" can't leave a tag behind (CodeQL
 * js/incomplete-multi-character-sanitization). React escapes the result
 * anyway - this is about clean text, not the only line of defence.
 */
export function htmlToText(input: string | null | undefined): string {
  let text = input ?? '';
  let previous: string;
  do {
    previous = text;
    text = text.replace(/<[^<>]*>/g, '');
  } while (text !== previous);
  return text.replace(/[<>]/g, '');
}
