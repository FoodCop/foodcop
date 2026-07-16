import React from "react";

const BookingSection = () => {
  return (
    <>
      {/*====== Start Booking Section ======*/}
      <section className="booking-section">
        <div
          className="booking-wrapper bg_cover pt-130"
          style={{ backgroundImage: "url(assets/images/bg/offer-bg1.jpg)" }}
        >
          <div className="container">
            <div className="row">
              <div className="col-lg-6">
                {/*== Section Content Box ===*/}
                <div className="section-content-box wow fadeInDown">
                  <div className="section-title text-white">
                    <span className="sub-title">
                      <i className="fas fa-users"></i> Community
                    </span>
                    <h2>
                      Build Your <br />
                      Culinary Network
                    </h2>
                  </div>
                  <div className="booking-button mt-4">
                    <p className="text-white mb-3">Join thousands of foodies sharing their favorite bites and hidden gems.</p>
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                {/*== Booking Form Box ===*/}
                <div className="booking-form-box wow fadeInUp">
                  <div className="booking-title text-center mb-30">
                    <h3>Claim Your Identity</h3>
                  </div>
                  <form className="booking-form" action="/login">
                    <div className="row">
                      <div className="col-lg-12">
                        <div className="form_group">
                          <input
                            type="email"
                            className="form_control"
                            placeholder="Enter your Email"
                            name="email"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="form_group text-center mt-3">
                          <button type="submit" className="theme-btn style-one">
                            Get Started
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/*====== End Booking Section ======*/}
    </>
  );
};

export default BookingSection;
