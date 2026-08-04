'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Order matches DOM order / z-index in home.css. #hero (own 320vh pin) and
// #grow (own internal vstack/gcard-outer card stack) keep their existing,
// unrelated scroll mechanisms and are left out. The footer isn't included
// either - it just scrolls over the pinned #final-cta naturally at the end.
const STACK_IDS = [
  'taste-intro', 'taste', 'discover', 'foodcards',
  'share', 'scout', 'tako', 'emotional', 'final-cta',
];

const coverEase = gsap.parseEase('power1.inOut');

// What to nudge upward during the reveal phase. Most sections wrap all
// their content in one child div, so translating that alone reproduces an
// internal scroll. A couple (#taste-intro, #emotional) have several direct
// children instead, so all of them move together. If the single child is
// itself one of the .sr/.sl/.srr/.sc scroll-reveal elements (only
// #final-cta today), its own transform is already driving an entrance
// fade/slide - reaching one level deeper avoids fighting that with ours.
// Absolutely-positioned children (e.g. #emotional's full-bleed .emo-bg
// image) are skipped entirely - they're sized to always cover the section's
// own box, and translating them the same way as normal-flow content would
// slide them off their anchor and open a gap under them.
function getRevealTargets(panel: HTMLElement): Element[] {
  const kids = Array.from(panel.children);
  const scoped = kids.length === 1 && kids[0].matches('.sr,.sl,.srr,.sc')
    ? Array.from(kids[0].children)
    : kids;
  return scoped.filter((el) => getComputedStyle(el).position !== 'absolute');
}

export default function StackScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const panels = STACK_IDS
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);

    let triggers: ScrollTrigger[] = [];

    const rebuild = () => {
      triggers.forEach((t) => t.kill());
      triggers = [];

      const vh = window.innerHeight;

      panels.forEach((panel, i) => {
        // Reveal phase: a panel taller than the viewport gets a short
        // scroll-scrub, right as it sticks, that shifts its own content
        // up internally until all of it has been shown - otherwise a
        // stuck panel just sits still and anything below the first
        // viewport-height would never become visible.
        const revealDistance = Math.max(0, panel.offsetHeight - vh);
        if (revealDistance > 0) {
          const targets = getRevealTargets(panel);
          triggers.push(
            ScrollTrigger.create({
              trigger: panel,
              start: 'top top',
              end: `+=${revealDistance}`,
              scrub: 0.6,
              onUpdate: (self) => {
                gsap.set(targets, { y: -self.progress * revealDistance });
              },
            }),
          );
        }

        // Cover phase: as the next panel slides up over this one, this
        // panel eases back - lifting, shrinking, dimming and gaining a
        // deeper shadow - like it's settling a layer further into the
        // stack. Eased (not linear) so the motion has a bit of weight to
        // it instead of tracking the scrollbar mechanically. This window
        // is exactly the scroll distance right after the reveal phase
        // ends, so the two never overlap or gap.
        const next = panels[i + 1];
        if (!next) return;
        triggers.push(
          ScrollTrigger.create({
            trigger: next,
            start: 'top bottom',
            end: 'top top',
            scrub: 0.6,
            onUpdate: (self) => {
              const p = coverEase(self.progress);
              gsap.set(panel, {
                transform: `translateY(${-p * 34}px) scale(${1 - p * 0.06})`,
                boxShadow: `0px ${p * 55}px ${p * 110}px rgba(0,0,0,${(p * 0.5).toFixed(3)})`,
                filter: `brightness(${(1 - p * 0.18).toFixed(3)})`,
              });
            },
          }),
        );
      });

      ScrollTrigger.refresh();
    };

    rebuild();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(rebuild, 200);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('load', rebuild);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('load', rebuild);
      triggers.forEach((t) => t.kill());
      panels.forEach((panel) => {
        gsap.set(panel, { clearProps: 'transform,boxShadow,filter' });
        gsap.set(getRevealTargets(panel), { clearProps: 'transform' });
      });
    };
  }, []);

  return null;
}
