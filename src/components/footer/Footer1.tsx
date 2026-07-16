'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
interface FooterProps {
  paddingClass?: string; // optional prop for custom padding
}



export default function Footer({ paddingClass = 'pt-120 pb-75' }: FooterProps) {
  const [year, setYear] = useState<number>();
  useEffect(() => setYear(new Date().getFullYear()), []);
  return (
    <footer className="footer-default p-r z-1">
      {/*=== Animated Shapes ===*/}
      {[
        { className: 'f-shape_one', depth: '.3', src: '/assets/images/shape/shape-2.png' },
        { className: 'f-shape_two', depth: '.4', src: '/assets/images/shape/shape-3.png' },
        { className: 'f-shape_three', depth: '.5', src: '/assets/images/shape/shape-4.png' },
        { className: 'f-shape_four', depth: '.6', src: '/assets/images/shape/shape-5.png' },
        { className: 'f-shape_five', depth: '.7', src: '/assets/images/shape/shape-6.png' },
        { className: 'f-shape_six', depth: '.8', src: '/assets/images/shape/shape-7.png' },
        { className: 'f-shape_seven', depth: '.9', src: '/assets/images/shape/shape-8.png' },
      ].map((shape, index) => (
        <div key={index} className={`footer-shape ${shape.className} scene`}>
          <span data-depth={shape.depth}>
            <Image src={shape.src} alt="shape" width={100} height={100} style={{ height: "auto" }} />
          </span>
        </div>
      ))}

      <div className="container">
        {/*=== Footer Widgets ===*/}
        <div className={`footer-widget-area ${paddingClass}`}>
        {/* <div className="footer-widget-area "> */}
          <div className="row">
            {/*=== About Widget ===*/}
            <div className="col-lg-3 col-md-6 col-sm-6">
              <div className="footer-widget footer-about-widget mb-40 wow fadeInUp">
                <div className="widget-content">
                  <div className="footer-logo mb-25">
                    <Link href="/">
                      <Image
                        src="/assets/images/logo/logo-white.png"
                        alt="Brand Logo"
                        width={150}
                        height={50}
                        style={{ height: "auto" }}
                      />
                    </Link>
                  </div>
                  <p>
                    Discover culinary delights, recipes and inspiration in our delightful food
                    haven.
                  </p>
                  <ul className="social-link">
                    <li>
                      <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-facebook-f" />
                      </a>
                    </li>
                    <li>
                      <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-twitter" />
                      </a>
                    </li>
                    <li>
                      <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-instagram" />
                      </a>
                    </li>
                    <li>
                      <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-youtube" />
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/*=== Contact Widget ===*/}
            <div className="col-lg-3 col-md-6 col-sm-6">
              <div className="footer-widget footer-contact-widget mb-40 wow fadeInUp">
                <div className="widget-content">
                  <h4 className="widget-title">Contact Us</h4>
                  <ul className="address-list">
                    <li>1901 Thornridge Cir. Shiloh, Hawaii 81063</li>
                    <li>
                      <Link href="tel:+88-344-667-999">+88-344-667-999</Link>
                    </li>
                    <li>
                      <Link href="mailto:order@foodix.com">order@foodix.com</Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/*=== Quick Links ===*/}
            <div className="col-lg-3 col-md-6 col-sm-6">
              <div className="footer-widget footer-nav-widget mb-40 wow fadeInUp">
                <div className="widget-content">
                  <h4 className="widget-title">Quick Links</h4>
                  <ul className="widget-menu">
                    <li>
                      <Link href="/">Home</Link>
                    </li>
                    <li>
                      <Link href="/about">About Us</Link>
                    </li>
                    <li>
                      <Link href="/menu-v1">Services</Link>
                    </li>
                    <li>
                      <Link href="/menu-v3">Our Menu</Link>
                    </li>
                    <li>
                      <Link href="/gallery">Gallery</Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/*=== Opening Hours ===*/}
            <div className="col-lg-3 col-md-6 col-sm-6">
              <div className="footer-widget footer-opening-widget mb-40 wow fadeInUp">
                <div className="widget-content">
                  <h4 className="widget-title">Opening Time</h4>
                  <ul className="opening-schedule">
                    <li>
                      Monday<span>: 10.00am - 05.00pm</span>
                    </li>
                    <li>
                      Tuesday<span>: 10.20am - 05.30pm</span>
                    </li>
                    <li>
                      Wednesday<span>: 10.30am - 05.50pm</span>
                    </li>
                    <li>
                      Thursday<span>: 11.00am - 07.10pm</span>
                    </li>
                    <li>
                      Friday: <span className="of-close">Closed</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*=== Copyright Area ===*/}
      <div className="copyright-area text-center">
        <div className="container">
          <div className="copyright-text">
            <p>&copy; {year || '2025'} Foodix. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
