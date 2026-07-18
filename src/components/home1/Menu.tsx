import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function MenuSection() {
  const menuItems = [
    {
      id: 1,
      image: '/assets/images/menu/menu-thumb1.png',
      title: 'AI-Generated Wagyu Donburi',
      desc: 'A futuristic twist on a classic, optimized for umami.',
      stats: '12k Saves',
      author: '@chef_ai',
    },
    {
      id: 2,
      image: '/assets/images/menu/menu-thumb2.png',
      title: 'Vegan Matcha Pancakes',
      desc: 'Plant-based power breakfast with high antioxidants.',
      stats: '8k Saves',
      author: '@green_eats',
    },
    {
      id: 3,
      image: '/assets/images/menu/menu-thumb3.png',
      title: 'Honey-Glazed Salmon',
      desc: 'Perfectly balanced macros for your post-workout.',
      stats: '15k Saves',
      author: '@fitness_foodie',
    },
    {
      id: 4,
      image: '/assets/images/menu/menu-thumb4.png',
      title: 'Thai Coconut Curry',
      desc: 'Authentic street-food style curry with a spicy kick.',
      stats: '9.5k Saves',
      author: '@spice_route',
    },
    {
      id: 5,
      image: '/assets/images/menu/menu-thumb5.png',
      title: 'Gourmet Mushroom Risotto',
      desc: 'Rich, creamy comfort food crafted for cozy nights.',
      stats: '11k Saves',
      author: '@cozy_kitchen',
    },
    {
      id: 6,
      image: '/assets/images/menu/menu-thumb6.png',
      title: 'Margarita Shrimp Tacos',
      desc: 'Zesty and fresh, perfect for a summer gathering.',
      stats: '14k Saves',
      author: '@taco_tuesday',
    },
    {
      id: 7,
      image: '/assets/images/menu/menu-thumb7.png',
      title: 'BBQ Bacon Burger',
      desc: 'The ultimate cheat meal, stacked high with flavor.',
      stats: '22k Saves',
      author: '@burger_boss',
    },
    {
      id: 8,
      image: '/assets/images/menu/menu-thumb8.png',
      title: 'Spicy Tuna Poke Bowl',
      desc: 'Fresh, vibrant, and packed with Omega-3s.',
      stats: '18k Saves',
      author: '@island_vibes',
    },
  ];

  return (
    <section className="menu-section pt-120 pb-100">
      <div className="container">
        {/*=== Section Title ===*/}
        <div className="row">
          <div className="col-lg-12">
            <div className="section-title text-center mb-55 wow fadeInDown">
              <span className="sub-title">
                <i className="fas fa-fire"></i> Trending
              </span>
              <h2>
                Explore Top <br /> Community Bites
              </h2>
            </div>
          </div>
        </div>

        {/*=== Menu Grid ===*/}
        <div className="row">
          {menuItems.map((item) => (
            <div className="col-lg-6" key={item.id}>
              <div className="menu-item style-eight mb-30 wow fadeInUp">
                <div className="menu-thumbnail">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={100}
                    height={100}
                    className="img-fluid"
                  />
                </div>
                <div className="menu-content-wrap">
                  <div className="content">
                    <h4 className="title">
                      <Link href="/discover">{item.title}</Link>
                    </h4>
                    <p>{item.desc}</p>
                    <small className="text-muted">{item.author}</small>
                  </div>
                  <div className="price-box">
                    <p className="price" style={{ fontSize: '14px', color: '#ff4a17' }}>
                      <i className="fas fa-bookmark"></i> {item.stats}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
