'use client';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export default function GallerySection() {
  const galleryItems = [
    { img: "https://placehold.co/384x500/1a1a1a/ffffff?text=Snap", title: "Midnight Ramen Run", category: "@foodninja" },
    { img: "https://placehold.co/384x500/1a1a1a/ffffff?text=Trim", title: "Making Perfect Dough", category: "@baker_bob (Trim)" },
    { img: "https://placehold.co/384x500/1a1a1a/ffffff?text=Snap", title: "Hidden Cafe Gem", category: "@city_scout" },
    { img: "https://placehold.co/384x500/1a1a1a/ffffff?text=Trim", title: "Wok Hei Masterclass", category: "@chef_chen (Trim)" },
    { img: "https://placehold.co/384x500/1a1a1a/ffffff?text=Snap", title: "Sunday Brunch", category: "@weekend_eats" },
  ];

  return (
    <section className="gallery-section pt-100 pb-50">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="section-title text-center mb-50 wow fadeInDown">
              <span className="sub-title">
                <i className="fas fa-camera"></i> Snaps & Trims
              </span>
              <h2>From the Community</h2>
            </div>
          </div>
        </div>
      </div>
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={0}
        slidesPerView={5}
        navigation={false}
        pagination={{ clickable: true }}
        loop={true}
        grabCursor={true}
        className="gallery-slider-one"
        breakpoints={{
          320: { slidesPerView: 2 },
          640: { slidesPerView: 3 },
          1024: { slidesPerView: 5 },
        }}
      >
        {galleryItems.map((item, idx) => (
          <SwiperSlide key={idx}>
            <div className="gallery-item style-two">
              <div className="gallery-img">
                <img
                  src={item.img}
                  alt={item.title}
                  width="100%"
                  height="auto"
                  className="img-fluid"
                  style={{ objectFit: 'cover', aspectRatio: '384/500' }}
                />
                <div className="hover-content">
                  <div className="gallery-content">
                    <h4 className="title">
                      <a href="/trims">{item.title}</a>
                    </h4>
                    <span>{item.category}</span>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
