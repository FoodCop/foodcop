'use client';
import React from 'react';

export default function Hero() {
  return (
    <section id="hero">
      <div className="hero-pin" id="heroPin">
        {/* VIDEO BACKGROUND — two clips cross-fading as hero-scroll progresses */}
        <div className="hero-video" id="heroVideo">
          <div className="hslide on" id="hs0">
            <video autoPlay muted loop playsInline>
              <source src="/videos/hero_video_01.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="hslide" id="hs1">
            <video autoPlay muted loop playsInline>
              <source src="/videos/hero_video_02.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {/* Hero body */}
        <div className="hero-body" id="hBody">
          <p className="hero-tagline">The Undiscovered Gastronomy</p>
          <h1 className="hero-h1">
            Eat<br />
            <span>Boldly.</span>
            Live<br />Fully.
          </h1>
          <p className="hero-sub-small">The app that thinks about food as much as you do.</p>
          <div className="hero-btns">
            <a href="#taste" className="btn-cta">🍴 Discover Food That Finds You</a>
            <a href="#discover" className="btn-ghost">Explore FUZO</a>
          </div>
        </div>

        {/* Slide dots */}
        <div className="hdots" id="hdots">
          <div className="hdot on"></div>
          <div className="hdot"></div>
        </div>
      </div>
    </section>
  );
}
