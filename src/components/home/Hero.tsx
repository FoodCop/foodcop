'use client';
import React from 'react';

export default function Hero() {
  return (
    <section id="hero">
      <div className="hero-pin" id="heroPin">
        {/* VIDEO BACKGROUND */}
        <div className="hero-video" id="heroVideo">
          <video autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}>
            <source src="/v6/hero-video.mp4" type="video/mp4" />
          </video>
          {/* Fallback image slides */}
          <div className="hslide on" id="hs0" style={{ backgroundImage: "url('/v6/hero-street.png')" }}></div>
          <div className="hslide" id="hs1" style={{ backgroundImage: "url('/v6/hero-slide2.png')" }}></div>
          <div className="hslide" id="hs2" style={{ backgroundImage: "url('/v6/ramen.png')" }}></div>
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
          <div className="hdot"></div>
        </div>
      </div>
    </section>
  );
}
