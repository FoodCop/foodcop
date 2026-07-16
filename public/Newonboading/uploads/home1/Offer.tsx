import Image from 'next/image';
import Link from 'next/link';

export default function OfferComboSection() {
  return (
    <section className="offer-combo-section">
      <div
        className="offer-bg-wrapper bg_cover p-r z-1 pt-130 pb-80"
        style={{ backgroundImage: 'url(/assets/images/bg/offer-bg1.jpg)' }}
      >
        {/*=== Decorative Shape ===*/}
        <div className="shape shape-one">
          <span>
            <Image
              src="/assets/images/bg/bn-img-6.png"
              alt="Shape"
              width={200}
              height={200}
            />
          </span>
        </div>

        <div className="container">
          <div className="row">
            {/*=== Left Content ===*/}
            <div className="col-lg-6">
              <div className="section-content-box text-center text-lg-start mb-50 wow fadeInLeft">
                <div className="section-title text-white mb-30">
                  <span className="sub-title">
                    <i className="flaticon-food-tray"></i> Get 25% Discount
                  </span>
                  <h2>Today our special Combo offers</h2>
                </div>

                {/*=== Countdown Placeholder (Optional Countdown Plugin Integration) ===*/}
                <div className="offer-countdown">
                  <div className="simply-countdown"></div>
                </div>

                <Link href="/menu-details" className="theme-btn style-one">
                  Read More
                </Link>
              </div>
            </div>

            {/*=== Right Image ===*/}
            <div className="col-lg-6">
              <div className="offer-image-box text-center text-lg-end mb-50 wow fadeInRight">
                <Image
                  src="/assets/images/bg/offer-img1.png"
                  alt="Combo Package"
                  width={650}
                  height={550}
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
