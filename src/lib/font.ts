import { Barlow_Condensed, Hanken_Grotesk } from 'next/font/google';

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
