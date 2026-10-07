'use client';

import { Children, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';

// A titled row of cards. Shows the first PREVIEW_COUNT cards, then a "See all"
// card (a fanned stack of the next photos + a count) that expands the section
// into a grid in place - no long sideways scroll. Arrow buttons appear on
// devices with a mouse while it's a row.
const PREVIEW_COUNT = 4;

export function Rail({
  title,
  sub,
  link,
  wide = false,
  previews = [],
  extraAction,
  children,
}: {
  title: string;
  sub?: string;
  link?: { href: string; label: string };
  wide?: boolean;
  /** Image URL per card, in the same order as the cards - used for the "See all" stack. */
  previews?: (string | undefined)[];
  /** Optional extra control in the header (e.g. "Use my location"). */
  extraAction?: ReactNode;
  children: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const items = Children.toArray(children);
  const hidden = items.length - PREVIEW_COUNT;
  const collapsible = hidden > 0;
  const showGrid = collapsible && expanded;

  // Stack = the next photos after the visible cards (falling back to the first ones).
  const pool = previews.filter((u): u is string => !!u);
  const stack = (pool.slice(PREVIEW_COUNT, PREVIEW_COUNT + 3).length === 3 ? pool.slice(PREVIEW_COUNT, PREVIEW_COUNT + 3) : pool.slice(0, 3));

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const collapse = () => {
    setExpanded(false);
    trackRef.current?.closest('.fz-dash-rail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className={`fz-dash-rail${showGrid ? ' is-expanded' : ''}`}>
      <div className="fz-dash-rail__head">
        <div className="fz-dash-rail__heading">
          <h2 className="fz-dash-rail__title">{title}</h2>
          {sub && <p className="fz-dash-rail__sub">{sub}</p>}
        </div>
        <div className="fz-dash-rail__actions">
          {showGrid ? (
            <button type="button" className="fz-dash-rail__less" onClick={collapse}>
              Show less <ChevronUp size={14} />
            </button>
          ) : (
            <>
              {extraAction}
              {link && (
                <Link href={link.href} className="fz-dash-rail__link">
                  {link.label} <ChevronRight size={14} />
                </Link>
              )}
              <button type="button" className="fz-dash-rail__arrow" onClick={() => scroll(-1)} aria-label={`Scroll ${title} left`}>
                <ChevronLeft size={16} />
              </button>
              <button type="button" className="fz-dash-rail__arrow" onClick={() => scroll(1)} aria-label={`Scroll ${title} right`}>
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      <div
        className={`fz-dash-rail__track${wide ? ' fz-dash-rail__track--wide' : ''}${showGrid ? ' fz-dash-rail__track--grid' : ''}`}
        ref={trackRef}
      >
        {showGrid || !collapsible ? items : items.slice(0, PREVIEW_COUNT)}
        {collapsible && !expanded && (
          <button
            type="button"
            className={`fz-dash-seeall${wide ? ' fz-dash-seeall--wide' : ''}`}
            onClick={() => setExpanded(true)}
            aria-label={`See all ${items.length} in ${title}`}
          >
            <span className="fz-dash-seeall__stack" aria-hidden="true">
              {stack.map((src, i) => (
                <img key={i} src={src} alt="" loading="lazy" className={`fz-dash-seeall__photo fz-dash-seeall__photo--${i + 1}`} />
              ))}
              {stack.length === 0 && <span className="fz-dash-seeall__photo fz-dash-seeall__photo--2 fz-dash-seeall__photo--blank" />}
            </span>
            <span className="fz-dash-seeall__label">See all</span>
            <span className="fz-dash-seeall__count">+{hidden} more</span>
          </button>
        )}
      </div>
    </section>
  );
}

export function SkeletonCards({ wide = false }: { wide?: boolean }) {
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`fz-dash-card fz-dash-card--skeleton${wide ? ' fz-dash-card--wide' : ''}`} aria-hidden="true" />
      ))}
    </>
  );
}
