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
      name: 'Sarah J.',
      position: '@foodie_sarah',
      img: 'author-1.jpg',
      text: 'You have to try this spot we found on Scout! 📍 The AI recommended their Truffle Fries and it was 100% accurate to my taste profile.',
    },
    {
      name: 'Mike T.',
      position: '@mike_eats',
      img: 'author-2.jpg',
      text: 'Just saved that Wagyu Donburi recipe from your Trim. Going to generate a shopping list and try cooking it this weekend! 🍳',
    },
    {
      name: 'Elena R.',
      position: '@elena_cooks',
      img: 'author-3.jpg',
      text: 'Wow, the Chef AI just helped me rescue a broken hollandaise sauce! This app is basically a culinary lifesaver in my pocket.',
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
                  <i className="fas fa-comment-dots"></i> Community Chat
                </span>
                <h2>Share the Flavor</h2>
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
