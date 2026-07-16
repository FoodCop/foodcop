'use client';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export default function GallerySection() {
  const galleryItems = [
    { img: "https://placehold.co/384x500/1a1a1a/ffffff?text=Bites", title: "Bites", category: "Studio Bites" },
    { img: "https://placehold.co/384x500/1a1a1a/ffffff?text=Scout", title: "Scout", category: "Scout Maps" },
    { img: "https://placehold.co/384x500/1a1a1a/ffffff?text=Food+DNA", title: "Food DNA", category: "Personalized Graph" },
    { img: "https://placehold.co/384x500/1a1a1a/ffffff?text=Feed", title: "Feed", category: "Culinary Feed" },
    { img: "https://placehold.co/384x500/1a1a1a/ffffff?text=Trims", title: "Trims", category: "Fuzo Trims" },
  ];

  return (
    <section className="gallery-section">
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
                      <a href="#">{item.title}</a>
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
