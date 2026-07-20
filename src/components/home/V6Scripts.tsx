'use client';

import { useEffect } from 'react';

export default function V6Scripts() {
  useEffect(() => {
    // ─── CURSOR ───
    const cur = document.getElementById('cur');
    const curo = document.getElementById('cur-o');
    let mx = 0, my = 0, ox = 0, oy = 0;
    
    let rafId: number;
    
    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (cur) {
        cur.style.left = mx + 'px';
        cur.style.top = my + 'px';
      }
    };
    document.addEventListener('mousemove', onMouseMove);
    
    function loop() {
      ox += (mx - ox) * 0.1;
      oy += (my - oy) * 0.1;
      if (curo) {
        curo.style.left = ox + 'px';
        curo.style.top = oy + 'px';
      }
      rafId = requestAnimationFrame(loop);
    }
    loop();

    const hoverSelectors = 'a, button, .cat-pill, .gcard, .ccard, .s-ico, .spill';
    
    // We attach event listeners to body to handle dynamic elements using event delegation
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest(hoverSelectors)) {
        document.body.classList.add('hov');
      }
    };
    const onMouseOut = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest(hoverSelectors)) {
        document.body.classList.remove('hov');
      }
    };
    document.body.addEventListener('mouseover', onMouseOver);
    document.body.addEventListener('mouseout', onMouseOut);

    // ─── HERO SLIDES ───
    let curHS = 0;
    function heroLogic(sy: number) {
      const heroEl = document.getElementById('hero');
      const hslides = [
        document.getElementById('hs0'),
        document.getElementById('hs1'),
        document.getElementById('hs2')
      ];
      const hdotsEl = document.querySelectorAll('.hdot');
      const hBody = document.getElementById('hBody');
      
      if (!heroEl || !hBody || !hslides[0] || !hslides[1] || !hslides[2]) return;

      const top = heroEl.offsetTop;
      const h = heroEl.offsetHeight;
      const wH = window.innerHeight;
      
      const p = Math.max(0, Math.min((sy - top) / Math.max(1, h - wH), 1));
      const idx = Math.min(2, Math.floor(p * 3));
      const lp = (p * 3) % 1;
      
      if (idx !== curHS) {
        hslides[curHS]?.classList.remove('on');
        hdotsEl[curHS]?.classList.remove('on');
        curHS = idx;
        hslides[curHS]?.classList.add('on');
        hdotsEl[curHS]?.classList.add('on');
      }
      
      hslides.forEach((s, i) => {
        if (s) {
          s.style.transform = i === idx ? `scale(${1.1 - lp * .1})` : 'scale(1.08)';
        }
      });
      
      const fade = Math.max(0, 1 - p * 4);
      hBody.style.opacity = fade.toString();
      hBody.style.transform = `translateY(${(1 - fade) * 36}px)`;
    }

    // ─── CARD PARALLAX ───
    function cardsParallax(sy: number) {
      const cs = document.getElementById('cardsStage');
      if (!cs) return;
      const r = cs.getBoundingClientRect();
      const wH = window.innerHeight;
      if (r.top > wH || r.bottom < 0) return;
      const p = (wH - r.top) / (wH + r.height);
      const lift = p * 28;
      
      const fc1 = document.getElementById('fc1');
      const fc2 = document.getElementById('fc2');
      const fc3 = document.getElementById('fc3');
      
      if (fc1) fc1.style.transform = `rotate(-15deg) translate(-72px,${44 - lift * .6}px)`;
      if (fc2) fc2.style.transform = `rotate(13deg) translate(72px,${44 - lift * .4}px)`;
      if (fc3) fc3.style.transform = `rotate(-2deg) translateY(${-lift * 1.1}px)`;
    }

    // ─── SCROLL REVEAL ───
    function revealAll() {
      document.querySelectorAll('.sr, .sl, .srr, .sc').forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.88) {
          el.classList.add('in');
        }
      });
    }

    const observer = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.sr, .sl, .srr, .sc').forEach(el => observer.observe(el));

    // ─── CHECK SECTIONS ───
    let tTrig = false;
    let eTrig = false;
    let takTrig = false;

    function checkSections() {
      const wH = window.innerHeight;
      
      const tasteEl = document.getElementById('taste');
      if (tasteEl && !tTrig && tasteEl.getBoundingClientRect().top < wH * 0.7) {
        tTrig = true;
        document.querySelectorAll('.chip').forEach((c, i) => {
          setTimeout(() => {
            (c as HTMLElement).style.opacity = '1';
            (c as HTMLElement).style.transform = 'scale(1)';
          }, i * 60);
        });
        setTimeout(() => {
          const b = document.getElementById('bFill');
          if (b) b.style.width = '55%';
        }, 500);
      }

      const emoEl = document.getElementById('emotional');
      if (emoEl && !eTrig && emoEl.getBoundingClientRect().top < wH * 0.75) {
        eTrig = true;
        document.querySelectorAll('#eLines span').forEach((el, i) => {
          setTimeout(() => el.classList.add('on'), i * 160);
        });
      }

      const takoEl = document.getElementById('tako');
      if (takoEl && !takTrig && takoEl.getBoundingClientRect().top < wH * 0.75) {
        takTrig = true;
        document.querySelectorAll('.tmsg').forEach((el, i) => {
          setTimeout(() => el.classList.add('vis'), 400 + i * 600);
        });
      }

      revealAll();
    }

    // ─── PROGRESS + NAV ───
    const pbar = document.getElementById('pbar');
    // For now we don't mess with nav unless we add a custom wrapper class

    function onScroll() {
      const sy = window.scrollY;
      if (pbar) {
        const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        const progress = sy / Math.max(1, docHeight - window.innerHeight);
        pbar.style.transform = `scaleX(${progress})`;
      }
      
      // nav.classList.toggle('on',sy>60); // Omit for SiteHeader compatibility if we use global nav

      heroLogic(sy);
      cardsParallax(sy);
      checkSections();
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // ─── CHIP INIT ───
    document.querySelectorAll('.chip').forEach(c => {
      (c as HTMLElement).style.opacity = '0';
      (c as HTMLElement).style.transform = 'scale(0.7)';
      (c as HTMLElement).style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    });

    // ─── GROW CARDS STACKING ───
    function growCards() {
      document.querySelectorAll('.gcard-outer').forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const wH = window.innerHeight;
        if (r.top < wH - 0.1) {
          const inner = el.querySelector('.gcard') as HTMLElement;
          if (inner) {
            const depth = i * 0.02;
            inner.style.transform = `scale(${1 - depth})`;
            inner.style.transformOrigin = 'top center';
          }
        }
      });
    }
    window.addEventListener('scroll', growCards, { passive: true });

    // ─── MIRO OVERLAP ANIMATION ───
    const sectionIds = [
      'taste',
      'discover',
      'foodcards',
      'share',
      'scout',
      'grow',
      'tako',
      'emotional',
      'final-cta'
    ];
    
    const secObserver = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.opacity = '1';
          (e.target as HTMLElement).style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.05 });

    sectionIds.forEach((id, i) => {
      const s = document.getElementById(id);
      if (!s) return;
      s.style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
      secObserver.observe(s);
      
      if (i > 0) {
        s.style.opacity = '0.01';
        s.style.transform = 'translateY(40px)';
      }
    });

    // ─── INIT ───
    revealAll();
    heroLogic(window.scrollY);
    checkSections();

    return () => {
      // Cleanup
      document.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
      document.body.removeEventListener('mouseover', onMouseOver);
      document.body.removeEventListener('mouseout', onMouseOut);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', growCards);
      observer.disconnect();
      secObserver.disconnect();
    };
  }, []);

  return null;
}
