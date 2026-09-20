import { Barlow, Barlow_Condensed, Hanken_Grotesk } from 'next/font/google';

// Heading font
export const barlowCondensed = Barlow_Condensed({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--heading-font',
  display: 'swap',
});

// Body font
export const hankenGrotesk = Hanken_Grotesk({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--body-font',
  display: 'swap',
});

// Body font for the Profile section's "Industry" design system only - see
// src/scss/_industry.scss, which repoints --body-font to this inside
// .fz-industry. Not applied app-wide (Hanken Grotesk stays the default body
// font everywhere else).
export const barlow = Barlow({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-barlow',
  display: 'swap',
});
