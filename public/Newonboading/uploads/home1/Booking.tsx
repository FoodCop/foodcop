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
                      <i className="flaticon-food-tray"></i>Reservation
                    </span>
                    <h2>
                      Need reservation? <br />
                      booking your table now
                    </h2>
                  </div>
                  <div className="booking-button">
                    <p>Order online</p>
                    <a href="tel:+555-657-8876" className="theme-btn style-one">
                      <i className="far fa-phone"></i> +555-657-8876
                    </a>
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                {/*== Booking Form Box ===*/}
                <div className="booking-form-box wow fadeInUp">
                  <div className="booking-title text-center mb-30">
                    <h3>Create An Booking Table</h3>
                  </div>
                  <form className="booking-form">
                    <div className="row">
                      <div className="col-lg-6">
                        <div className="form_group">
                          <input
                            type="text"
                            className="form_control"
                            placeholder="Enter your name"
                            name="name"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-lg-6">
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
                      <div className="col-lg-6">
                        <div className="form_group">
                          <input
                            type="text"
                            className="form_control"
                            placeholder="Enter your Phone"
                            name="phone"
                            required
                          />
                          <span className="icon">
                            <i className="far fa-phone"></i>
                          </span>
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="form_group">
                          <input
                            type="text"
                            className="form_control"
                            placeholder="Date"
                            id="datepicker"
                          />
                          <span className="icon">
                            <i className="far fa-calendar-alt"></i>
                          </span>
                        </div>
                      </div>
                      <div className="col-lg-12">
                         <div className="form_group">
                            <select
                              id="people"
                              name="people"
                              className="form_control wide"
                              defaultValue="01"
                              required
                            >
                              <option value="01">01 People</option>
                              <option value="02">02 People</option>
                              <option value="03">03 People</option>
                              <option value="04">04 People</option>
                              <option value="05">05 People</option>
                            </select>
                            <span className="icon">
                              <i className="far fa-user"></i>
                            </span>
                          </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="form_group text-center">
                          <button type="submit" className="theme-btn style-one">
                            Book a Table
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
