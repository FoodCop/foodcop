#!/usr/bin/env node
// Recolors the fuzo-yellow brand token everywhere it appears literally,
// without re-deriving the whole contrast pass by hand each time the client
// changes the exact hex (happened 3x during the 2026-07-29 rebrand).
//
// How it works: _variables.scss defines $fuzo-yellow-ink/-tint/-deep/-pale
// as Sass mix() functions of $fuzo-yellow, so every SCSS usage already
// re-derives for free on the next `npm run build` once the one $fuzo-yellow
// line changes. The only things that DON'T auto-derive are a handful of
// hardcoded hex literals in TSX (icon fill/stroke colors, inline gradients)
// that can't reference a Sass variable - this script finds the current
// computed shades in those files and swaps them for the newly-computed
// ones, wherever they appear under `src/`.
//
// Usage: node scripts/update-brand-color.mjs '#F1C74D'
//
// What it can't safely automate: if the new color's LUMINANCE crosses the
// light/dark threshold relative to the current one (e.g. a bright yellow
// becoming a dark taupe, or vice versa - this happened once already), a
// handful of SCSS sites that pair raw $fuzo-yellow text directly against
// the page background need to flip between $fuzo-yellow (bright colors)
// and $fuzo-yellow-ink (dark colors) - see _auth.scss's .auth-guest/
// .auth-footer, _dna.scss's .view-all, _tako.scss's .tako-greeting__title,
// _trims.scss's .follow-btn. The script prints a warning and does NOT try
// to guess that change; it needs a manual pass (or ask Claude) if it fires.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VARIABLES_FILE = join(REPO_ROOT, 'src/scss/_variables.scss');

function hexToRgb(hex) {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) throw new Error(`Not a valid 6-digit hex color: ${hex}`);
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
}

// Mirrors Sass's mix($color1, $color2, $weight) - $weight is the % of
// $color1 in the result. Must match the formulas in _variables.scss
// exactly or the "found in TSX" replacements below won't match anything.
function mix(hex1, hex2, weight1) {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  return rgbToHex([
    r1 * weight1 + r2 * (1 - weight1),
    g1 * weight1 + g2 * (1 - weight1),
    b1 * weight1 + b2 * (1 - weight1),
  ]);
}

// Weights here are the SHARE OF BLACK/WHITE in the mix (mirroring
// _variables.scss's `mix(#000, $fuzo-yellow, 75%)` etc., where the % is
// the first color's share) - ink/deep intentionally use inverse weights
// of each other, same for tint/pale. Mixing these up silently produces
// colors that don't match anything actually in the codebase, so replacements
// find nothing and appear to succeed while doing nothing - verify the
// printed hex values against _variables.scss's own mix() calls if in doubt.
function deriveShades(baseHex) {
  return {
    base: baseHex.toLowerCase(),
    ink: mix('#000000', baseHex, 0.75),   // 75% black + 25% base - dark text on solid base
    tint: mix('#ffffff', baseHex, 0.85),  // 85% white + 15% base - pale wash
    deep: mix('#000000', baseHex, 0.15),  // 15% black + 85% base - darker/richer
    pale: mix('#ffffff', baseHex, 0.30),  // 30% white + 70% base - lighter, for dark chrome
  };
}

// WCAG relative luminance - used only to warn about a light/dark flip,
// not for any of the actual color math above.
function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function walkTsxFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walkTsxFiles(full, out);
    else if (entry.endsWith('.tsx')) out.push(full);
  }
  return out;
}

const newHexArg = process.argv[2];
if (!newHexArg) {
  console.error('Usage: node scripts/update-brand-color.mjs \'#RRGGBB\'');
  process.exit(1);
}
const newHex = newHexArg.startsWith('#') ? newHexArg : `#${newHexArg}`;
hexToRgb(newHex); // throws if malformed

const variablesSrc = readFileSync(VARIABLES_FILE, 'utf8');
const currentMatch = variablesSrc.match(/^\$fuzo-yellow:\s*(#[0-9a-fA-F]{6});/m);
if (!currentMatch) {
  console.error('Could not find `$fuzo-yellow: #......;` in _variables.scss - has the file structure changed?');
  process.exit(1);
}
const oldHex = currentMatch[1];

const oldShades = deriveShades(oldHex);
const newShades = deriveShades(newHex);

// 1. Update the one source-of-truth line in _variables.scss.
const updatedVariables = variablesSrc.replace(
  /^\$fuzo-yellow:\s*#[0-9a-fA-F]{6};/m,
  `$fuzo-yellow: ${newHex.toLowerCase()};`,
);
writeFileSync(VARIABLES_FILE, updatedVariables);

// 2. Sweep every .tsx file under src/ for the OLD computed hex literals and
//    swap in the NEW ones. Case-insensitive match, lowercase replacement.
const shadeKeys = ['base', 'ink', 'tint', 'deep', 'pale'];
const tsxFiles = walkTsxFiles(join(REPO_ROOT, 'src'));
let filesTouched = 0;
let replacementsTotal = 0;

for (const file of tsxFiles) {
  let content = readFileSync(file, 'utf8');
  let fileChanged = false;
  for (const key of shadeKeys) {
    const oldValue = oldShades[key];
    const newValue = newShades[key];
    if (oldValue.toLowerCase() === newValue.toLowerCase()) continue; // no-op for this shade
    const re = new RegExp(oldValue, 'gi');
    const matches = content.match(re);
    if (matches) {
      content = content.replace(re, newValue);
      replacementsTotal += matches.length;
      fileChanged = true;
    }
  }
  if (fileChanged) {
    writeFileSync(file, content);
    filesTouched++;
    console.log(`  updated ${file.replace(REPO_ROOT + '\\', '').replace(REPO_ROOT + '/', '')}`);
  }
}

console.log('');
console.log(`$fuzo-yellow: ${oldHex} -> ${newHex.toLowerCase()}`);
console.log('Derived shades:');
for (const key of shadeKeys) {
  console.log(`  ${key.padEnd(4)} ${oldShades[key]} -> ${newShades[key]}`);
}
console.log(`\n${filesTouched} TSX file(s) updated, ${replacementsTotal} literal(s) replaced.`);

const oldLum = relativeLuminance(oldHex);
const newLum = relativeLuminance(newHex);
const oldNeedsDarkText = oldLum > 0.4;
const newNeedsDarkText = newLum > 0.4;
console.log(`\nLuminance: ${oldHex} = ${oldLum.toFixed(3)} (${oldNeedsDarkText ? 'needs dark text' : 'needs light text'}) -> ${newHex.toLowerCase()} = ${newLum.toFixed(3)} (${newNeedsDarkText ? 'needs dark text' : 'needs light text'})`);

if (oldNeedsDarkText !== newNeedsDarkText) {
  console.log('\n⚠️  LIGHT/DARK DIRECTION FLIPPED. The automatic shade swap above is NOT enough this time.');
  console.log('   Every SCSS site that pairs a solid $fuzo-yellow background with dark ink text (or vice');
  console.log('   versa) needs manual review - this is what happened when the brand hex briefly went from');
  console.log('   #FAE71B to #7A6B5E. Specifically re-check:');
  console.log('     - _auth.scss (.auth-guest, .auth-footer, .auth-cta)');
  console.log('     - _dna.scss (.view-all)');
  console.log('     - _tako.scss (.tako-greeting__title, .tako-fab, .tako-*-icon gradients)');
  console.log('     - _trims.scss (.follow-btn)');
  console.log('     - _rewards.scss, _leaderboard.scss, _chat.scss, _bites.scss, _studio.scss,');
  console.log('       _scout.scss, _dashboard.scss (every solid $fuzo-yellow-family background)');
  console.log('   Do not treat this run as complete - get a human/Claude pass before shipping.');
} else {
  console.log('\n✅ Same light/dark direction as before - no text-color direction changes needed.');
  console.log('   Next: npm run build, screenshot a few screens to eyeball it, commit.');
}
