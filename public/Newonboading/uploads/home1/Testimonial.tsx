'use client';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export default function TestimonialSection() {
  const testimonials = [
    {
      name: 'David Liam',
      position: 'CEO',
      img: 'author-1.jpg',
      text: 'From the moment we walked in, we were impressed by the warm and inviting atmosphere. The food was exceptional—each dish was bursting with fresh, vibrant flavors. The staff was attentive and knowledgeable, making our dining experience.',
    },
    {
      name: 'Alex Mika',
      position: 'CEO',
      img: 'author-2.jpg',
      text: 'From the moment we walked in, we were impressed by the warm and inviting atmosphere. The food was exceptional—each dish was bursting with fresh, vibrant flavors. The staff was attentive and knowledgeable, making our dining experience.',
    },
    {
      name: 'David Liam',
      position: 'CEO',
      img: 'author-3.jpg',
      text: 'From the moment we walked in, we were impressed by the warm and inviting atmosphere. The food was exceptional—each dish was bursting with fresh, vibrant flavors. The staff was attentive and knowledgeable, making our dining experience.',
    },
  ];

  return (
    <section className="testimonial-section">
      <div className="testimonial-wrapper-bgc gray-bg pt-120 pb-130">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              {/* Section Title */}
              <div className="section-title text-center mb-50 wow fadeInDown">
                <span className="sub-title">
                  <i className="flaticon-food-tray"></i>Testimonials
                </span>
                <h2>Our Guests Are Saying</h2>
              </div>
            </div>
          </div>

          {/* Swiper Slider */}
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            spaceBetween={30}
            slidesPerView={2}
            loop={true}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            navigation={false}
          >
            {testimonials.map((item, index) => (
              <SwiperSlide key={index}>
                <div className="testimonial-item style-three mb-60">
                  <div className="testimonial-content">
                    <ul className="ratings">
                      {[...Array(5)].map((_, i) => (
                        <li key={i}>
                          <i className="fas fa-star"></i>
                        </li>
                      ))}
                    </ul>
                    <p>{item.text}</p>
                    <div className="author-quote-item d-flex">
                      <div className="author-thumb-item d-flex">
                        <div className="author-thumb">
                          <Image
                            src={`/assets/images/testimonial/${item.img}`}
                            alt="author image"
                            width={70}
                            height={70}
                          />
                        </div>
                        <div className="author-info">
                          <h5>{item.name}</h5>
                          <span>{item.position}</span>
                        </div>
                      </div>
                      <div className="quote">
                        <i className="far fa-quote-right"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
