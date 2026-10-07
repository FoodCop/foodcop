'use client';
import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Utensils } from 'lucide-react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false });

export default function Hero() {
  const tagRef = useRef<HTMLParagraphElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const btnsRef = useRef<HTMLDivElement>(null);
  const chapter2Ref = useRef<HTMLDivElement>(null);

  // ─── HEADLINE ENTRANCE ───
  // One-time reveal on mount, independent of heroLogic's scroll-driven exit
  // fade in V6Scripts.tsx - that still owns opacity/transform on #hBody as a
  // whole, this only animates the children once, on load.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const h1El = h1Ref.current;
    const subEl = subRef.current;
    const btnsEl = btnsRef.current;

    gsap.registerPlugin(SplitText);
    const split = tagRef.current ? new SplitText(tagRef.current, { type: 'chars' }) : null;
    if (split) gsap.set(split.chars, { opacity: 0, y: 8 });
    gsap.set([h1El, subEl, btnsEl], { opacity: 0, y: 28 });

    const tl = gsap.timeline({ delay: 0.25 });
    if (split) {
      tl.to(split.chars, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.02 });
    }
    tl.to(h1El, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, split ? '-=0.15' : 0)
      .to(subEl, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.55')
      .to(btnsEl, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5');

    return () => {
      tl.kill();
      split?.revert();
      gsap.set([h1El, subEl, btnsEl], { clearProps: 'all' });
    };
  }, []);

  // ─── CHAPTER 2 ───
  // A second beat of copy, shown mid-flythrough once the opening headline
  // has long since faded (that fade finishes by p=0.25 - see heroLogic in
  // V6Scripts.tsx) so HeroScene's 3D cards aren't carrying the pin alone.
  // Own scroll listener/progress calc, same formula as heroLogic and
  // HeroScene - matches this codebase's existing pattern of each scroll
  // effect owning its own tiny progress calc rather than sharing one.
  useEffect(() => {
    function onScroll() {
      const heroEl = document.getElementById('hero');
      const el = chapter2Ref.current;
      if (!heroEl || !el) return;

      const top = heroEl.offsetTop;
      const h = heroEl.offsetHeight;
      const wH = window.innerHeight;
      const p = Math.max(0, Math.min((window.scrollY - top) / Math.max(1, h - wH), 1));

      const inStart = 0.38;
      const inEnd = 0.48;
      const outStart = 0.62;
      const outEnd = 0.74;

      let o = 0;
      if (p >= inStart && p < inEnd) o = (p - inStart) / (inEnd - inStart);
      else if (p >= inEnd && p < outStart) o = 1;
      else if (p >= outStart && p < outEnd) o = 1 - (p - outStart) / (outEnd - outStart);
      o = Math.max(0, Math.min(1, o));

      el.style.opacity = o.toString();
      el.style.transform = `translateY(${(1 - o) * 22}px)`;
      el.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section id="hero">
      <div className="hero-pin" id="heroPin">
        {/* Flat fallback fill - shown as-is when the 3D scene is skipped
            (prefers-reduced-motion) and the base color the scene's fog
            blends distant objects into otherwise. */}
        <div className="hero-video" id="heroVideo" />
        <HeroScene />

        {/* Hero body */}
        <div className="hero-body" id="hBody">
          <p className="hero-tagline" ref={tagRef}>The Undiscovered Gastronomy</p>
          <h1 className="hero-h1" ref={h1Ref}>
            Eat<br />
            <span>Boldly.</span>
            Live<br />Fully.
          </h1>
          <p className="hero-sub-small" ref={subRef}>The app that thinks about food as much as you do.</p>
          <div className="hero-btns" ref={btnsRef}>
            <a href="#taste" className="btn-cta"><Utensils size={16} className="hicon" /> Discover Food That Finds You</a>
            <a href="#discover" className="btn-ghost">Explore FUZO</a>
          </div>
        </div>

        {/* Chapter 2 - mid-flythrough copy, see the effect above */}
        <div className="hero-chapter2 warm-bg" ref={chapter2Ref}>
          <div className="eyebrow" style={{ justifyContent: 'center' }}>Your Taste · Your World</div>
          <h2 className="sec-h" style={{ textAlign: 'center' }}>Discover Your Taste.</h2>
          <p className="sec-sub" style={{ textAlign: 'center', margin: '16px auto 0', maxWidth: '480px' }}>
            Find restaurants, cafés and hidden gems that match your unique taste — not just your location.
          </p>
          <div className="hero-btns" style={{ justifyContent: 'center', marginTop: '32px' }}>
            <a href="#taste" className="btn-cta"><Utensils size={16} className="hicon" /> Discover Food That Finds You</a>
            <a href="#discover" className="btn-ghost">Explore FUZO</a>
          </div>
        </div>
      </div>
    </section>
  );
}
