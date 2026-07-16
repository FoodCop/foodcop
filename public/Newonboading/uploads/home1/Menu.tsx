import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function MenuSection() {
  const menuItems = [
    {
      id: 1,
      image: '/assets/images/menu/menu-thumb1.png',
      title: 'Truffle Mac and Cheese',
      desc: 'Indulgent mac and cheese with truffle essence.',
      price: '$25.50',
    },
    {
      id: 2,
      image: '/assets/images/menu/menu-thumb2.png',
      title: 'Grilled Ribeye Steak',
      desc: 'Perfectly grilled ribeye steak with savory seasoning.',
      price: '$25.50',
    },
    {
      id: 3,
      image: '/assets/images/menu/menu-thumb3.png',
      title: 'Honey-Glazed Salmon',
      desc: 'Sweet and savory honey-glazed salmon fillet.',
      price: '$25.50',
    },
    {
      id: 4,
      image: '/assets/images/menu/menu-thumb4.png',
      title: 'Thai Coconut Curry',
      desc: 'Fragrant Thai coconut curry with vibrant vegetables.',
      price: '$25.50',
    },
    {
      id: 5,
      image: '/assets/images/menu/menu-thumb5.png',
      title: 'Gourmet Mushroom Risotto',
      desc: 'Rich, creamy risotto with gourmet mushrooms.',
      price: '$25.50',
    },
    {
      id: 6,
      image: '/assets/images/menu/menu-thumb6.png',
      title: 'Margarita Shrimp Tacos',
      desc: 'Zesty shrimp tacos with fresh margarita flavor.',
      price: '$25.50',
    },
    {
      id: 7,
      image: '/assets/images/menu/menu-thumb7.png',
      title: 'BBQ Bacon Burger',
      desc: 'Juicy burger topped with BBQ sauce and bacon.',
      price: '$35',
    },
    {
      id: 8,
      image: '/assets/images/menu/menu-thumb8.png',
      title: 'Spicy Tuna Roll',
      desc: 'Spicy tuna roll with a bold, flavorful kick.',
      price: '$39',
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
                <i className="flaticon-food-tray"></i> Delicious Menu
              </span>
              <h2>
                Explore Our Delicious <br /> Menu
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
                      <Link href="/menu-details">{item.title}</Link>
                    </h4>
                    <p>{item.desc}</p>
                  </div>
                  <div className="price-box">
                    <p className="price">{item.price}</p>
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
