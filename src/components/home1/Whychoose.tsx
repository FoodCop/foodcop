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
                <i className="fas fa-robot"></i>
              </div>
              <div className="content">
                <h4 className="title">Chef AI Assistant</h4>
                <p>Assistant-style interactions to guide your culinary journey.</p>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-md-6 col-sm-12">
            <div className="iconic-box style-six mb-40 wow fadeInUp">
              <div className="icon">
                <i className="fas fa-magic"></i>
              </div>
              <div className="content">
                <h4 className="title">AI Recipe Studio</h4>
                <p>Generate structured recipes instantly from ideas and images.</p>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-md-6 col-sm-12">
            <div className="iconic-box style-six mb-40 wow fadeInDown">
              <div className="icon">
                <i className="fas fa-film"></i>
              </div>
              <div className="content">
                <h4 className="title">AI Trim Studio</h4>
                <p>Generate short-form video concepts tailored to your audience.</p>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-md-6 col-sm-12">
            <div className="iconic-box style-six mb-40 wow fadeInUp">
              <div className="icon">
                <i className="fas fa-trophy"></i>
              </div>
              <div className="content">
                <h4 className="title">Gamified Engagement</h4>
                <p>Earn points for saving, sharing, and posting. Climb the leaderboard.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
