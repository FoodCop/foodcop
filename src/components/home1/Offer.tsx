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
                    <i className="fas fa-compass"></i> Explore Your World
                  </span>
                  <h2>Three Ways to Discover</h2>
                </div>

                <div className="text-white mb-40">
                  <p className="mb-2"><strong>Bites:</strong> A personalized recipe feed tailored to your diet and taste preferences.</p>
                  <p className="mb-2"><strong>Trims:</strong> Short-form culinary media and videos localized to your region.</p>
                  <p className="mb-4"><strong>Scout:</strong> An interactive map to uncover hidden gems and nearby places.</p>
                </div>

                <Link href="/scout" className="theme-btn style-one">
                  Try Scout Now
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
