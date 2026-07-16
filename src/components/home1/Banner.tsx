'use client';
import Image from 'next/image';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-wrapper-four">
        {/*=== Background Video ===*/}
        <div
          className="hero-bg bg_cover"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden' }}
        >
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          >
            <source src="/videos/video6.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay for text readability */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="row align-items-center">
            {/*=== Hero Content ===*/}
            <div className="col-xl-6 order-2 order-xl-1">
              <div className="hero-content">
                <span className="tag-line wow fadeInDown" data-wow-delay=".5s">
                  FUZO V2
                </span>
                <h1 className="wow fadeInUp" data-wow-delay=".6s" style={{ color: '#fff', fontSize: '56px', lineHeight: '1.2' }}>
                  YOUR CULINARY <span>IDENTITY</span>, REIMAGINED
                </h1>
                <p className="wow fadeInDown" data-wow-delay=".7s" style={{ color: '#f0f0f0' }}>
                  The ultimate food discovery and social platform. Combine personalized recipes, local place intelligence, short-form culinary media, and AI assistance.
                </p>
                <div className="hero-button wow fadeInUp" data-wow-delay=".75s">
                  <Link href="/scout" className="theme-btn style-one">
                    Start Exploring
                  </Link>
                </div>
              </div>
            </div>

            {/*=== Hero Image ===*/}
            <div className="col-xl-6 order-1 order-xl-2">
              <div className="hero-image text-center text-xl-end">
                <div className="shape wow bounceInUp">
                  <span>
                    <Image
                      src="/assets/images/hero/text-03.png"
                      alt="20% OFF"
                      width={150}
                      height={150}
                    />
                  </span>
                </div>

                <Image
                  className="hero-img wow fadeInRight"
                  data-wow-delay=".9s"
                  src="/assets/images/hero/hero-four_img1.png"
                  alt="Hero Image"
                  width={650}
                  height={600}
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
