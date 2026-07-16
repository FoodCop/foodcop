import React from 'react';

export default function WhyChooseSection() {
  return (
    <section className="why-choose-section pt-120 pb-90">
      <div className="container">
        {/*=== Section Title ===*/}
        <div className="row">
          <div className="col-lg-12">
            <div className="section-title text-center mb-55 wow fadeInDown">
              <span className="sub-title">
                <i className="flaticon-food-tray"></i> Ecosystem
              </span>
              <h2>A Culinary Network Reimagined</h2>
            </div>
          </div>
        </div>

        {/*=== Feature Boxes ===*/}
        <div className="row">
          <div className="col-xl-3 col-md-6 col-sm-12">
            <div className="iconic-box style-six mb-40 wow fadeInDown">
              <div className="icon">
                <i className="flaticon-chef"></i>
              </div>
              <div className="content">
                <h4 className="title">Recipes Rewired</h4>
                <p>Studio Bites. From consumption {'->'} comprehension.</p>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-md-6 col-sm-12">
            <div className="iconic-box style-six mb-40 wow fadeInUp">
              <div className="icon">
                <i className="flaticon-clean-water"></i>
              </div>
              <div className="content">
                <h4 className="title">Discover What's Around</h4>
                <p>Scout Maps. Map + Memory + Taste Graph.</p>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-md-6 col-sm-12">
            <div className="iconic-box style-six mb-40 wow fadeInDown">
              <div className="icon">
                <i className="flaticon-party"></i>
              </div>
              <div className="content">
                <h4 className="title">Contextualized Media</h4>
                <p>Fuzo Trims. Signal {'>'} Scroll.</p>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-md-6 col-sm-12">
            <div className="iconic-box style-six mb-40 wow fadeInUp">
              <div className="icon">
                <i className="flaticon-healthy-food"></i>
              </div>
              <div className="content">
                <h4 className="title">Ecosystem</h4>
                <p>Turn action into progression. Think less, Create more.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
