import Image from 'next/image';
import Link from 'next/link';

export default function AboutSection() {
  return (
    <section className="about-section pt-90 pb-80">
      <div className="container">
        <div className="row">
          {/*=== About Video ===*/}
          <div className="col-xl-6">
            <div className="about-image-box mb-50 text-center text-xl-start wow fadeInLeft" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="img-fluid w-100"
                style={{ borderRadius: '20px' }}
              >
                <source src="/videos/video1.mp4" type="video/mp4" />
              </video>
            </div>
          </div>

          {/*=== About Content ===*/}
          <div className="col-xl-6">
            <div className="section-content-box mb-50">
              <div className="section-title wow fadeInDown">
                <span className="sub-title">
                  <i className="flaticon-food-tray"></i> Discovery
                </span>
                <h2>Your Personalized Food Graph</h2>
              </div>

              <p className="wow fadeInUp">
                Your feed adapts in real time with recipes, short form videos, and places curated to your taste, location, and behavior. Discover {'->'} Save {'->'} Share {'->'} Refine.
              </p>

              {/*=== Info Boxes ===*/}
              <div className="row">
                <div className="col-sm-6">
                  <div className="iconic-box style-five mb-30 wow fadeInDown" data-wow-delay=".3s">
                    <div className="icon">
                      <Image
                        src="/assets/images/icon/icon-7.svg"
                        alt="Icon"
                        width={60}
                        height={60}
                        className="img-fluid"
                      />
                    </div>
                    <div className="content">
                      <h3 className="title">10M+</h3>
                      <p>Recipes Analyzed</p>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="iconic-box style-five mb-30 wow fadeInDown" data-wow-delay=".4s">
                    <div className="icon">
                      <Image
                        src="/assets/images/icon/icon-8.svg"
                        alt="Icon"
                        width={60}
                        height={60}
                        className="img-fluid"
                      />
                    </div>
                    <div className="content">
                      <h3 className="title">500k+</h3>
                      <p>Hidden Gems</p>
                    </div>
                  </div>
                </div>
              </div>

              {/*=== Read More Button ===*/}
              <div className="about-button wow fadeInUp" data-wow-delay=".5s">
                <Link href="/about" className="theme-btn style-one">
                  Read More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
