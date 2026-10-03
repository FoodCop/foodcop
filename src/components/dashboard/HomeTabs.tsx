'use client';

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { LucideIcon } from 'lucide-react';

export type HomeTab<K extends string> = { key: K; label: string; icon: LucideIcon };

// Segmented tab bar for the dashboard (For you · Bites · Feed · Trims).
// Accessible tabs pattern: role=tablist/tab, roving tabIndex, arrow keys +
// Home/End move focus and select. A yellow "thumb" slides under the active
// tab (measured from the DOM so labels of any length line up).
export default function HomeTabs<K extends string>({
  tabs,
  active,
  onChange,
  idPrefix = 'home',
}: {
  tabs: HomeTab<K>[];
  active: K;
  onChange: (key: K) => void;
  idPrefix?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);

  // Position the sliding thumb under the active tab (and keep it there on resize).
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const el = list.querySelector<HTMLElement>(`[data-key="${active}"]`);
      if (el) setThumb({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, [active, tabs.length]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.findIndex((t) => t.key === active);
    let next = i;
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    onChange(tabs[next].key);
    listRef.current?.querySelector<HTMLElement>(`[data-key="${tabs[next].key}"]`)?.focus();
  };

  return (
    <div className="fz-dash-tabs" role="tablist" aria-label="Home sections" ref={listRef} onKeyDown={onKeyDown}>
      {thumb && <span className="fz-dash-tabs__thumb" style={{ transform: `translateX(${thumb.left}px)`, width: thumb.width }} aria-hidden="true" />}
      {tabs.map(({ key, label, icon: Icon }) => {
        const selected = key === active;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${key}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${key}`}
            tabIndex={selected ? 0 : -1}
            data-key={key}
            className={`fz-dash-tabs__tab${selected ? ' is-active' : ''}`}
            onClick={() => onChange(key)}
          >
            <Icon size={16} strokeWidth={2.3} aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
