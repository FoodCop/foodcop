"use client";
import React from "react";
import Image from "next/image";
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";

interface Footer7Props {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  sections?: Array<{
    title: string;
    links: Array<{ name: string; href: string }>;
  }>;
  description?: string;
  socialLinks?: Array<{
    icon: React.ReactElement;
    href: string;
    label: string;
  }>;
  copyright?: string;
  legalLinks?: Array<{
    name: string;
    href: string;
  }>;
}

const defaultSections = [
  {
    title: "Company",
    links: [
      { name: "About Us", href: "about-us" },
      { name: "Careers", href: "careers" },
      { name: "Press", href: "press" },
    ],
  },
  {
    title: "Legal & Policies",
    links: [
      { name: "Privacy Policy", href: "privacy-policy" },
      { name: "Terms of Service", href: "terms-of-service" },
      { name: "Cookie Policy", href: "cookie-policy" },
      { name: "Accessibility", href: "accessibility" },
    ],
  },
  {
    title: "Support & Contact",
    links: [
      { name: "Help Center", href: "help-center" },
      { name: "Contact Us", href: "contact-us" },
    ],
  },
  {
    title: "Partners",
    links: [
      { name: "Restaurant Partners", href: "restaurant-partners" },
    ],
  },
];

const defaultSocialLinks = [
  { icon: <FaInstagram className="size-5" />, href: "#", label: "Instagram" },
  { icon: <FaFacebook className="size-5" />, href: "#", label: "Facebook" },
  { icon: <FaTwitter className="size-5" />, href: "#", label: "Twitter" },
  { icon: <FaLinkedin className="size-5" />, href: "#", label: "LinkedIn" },
];

const defaultLegalLinks = [
  { name: "Terms and Conditions", href: "#" },
  { name: "Privacy Policy", href: "#" },
];

function Footer7({
  logo = {
    url: "https://www.fuzo.com",
    src: "/images/landing/Images/logo.png",
    alt: "logo",
    title: "FUZO",
  },
  sections = defaultSections,
  description = "Discover extraordinary eats with AI-curated food recommendations, restaurant discovery, and personalized dining experiences.",
  socialLinks = defaultSocialLinks,
  copyright = "© 2024 FUZO. All rights reserved.",
  legalLinks = defaultLegalLinks,
}: Footer7Props) {
  const handleNavigation = (page: string) => {
    const event = new CustomEvent("navigateToPage", { detail: page });
    window.dispatchEvent(event);
  };
  return (
    <section className="py-32">
      <div className="container">
        <div className="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start lg:text-left">
          <div className="flex w-full flex-col justify-between gap-6 lg:items-start">
            {/* Logo */}
            <div className="flex items-center gap-2 lg:justify-start">
              <a href={logo.url}>
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  title={logo.title}
                  className="h-8"
                  width={32}
                  height={32}
                />
              </a>
              <h2 className="text-xl font-semibold">{logo.title}</h2>
            </div>
            <p className="text-muted-foreground max-w-[70%] text-sm">
              {description}
            </p>
            <ul className="text-muted-foreground flex items-center space-x-6">
              {socialLinks.map((social, idx) => (
                <li key={idx} className="hover:text-primary font-medium">
                  <a href={social.href} aria-label={social.label}>
                    {social.icon}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid w-full gap-6 md:grid-cols-3 lg:gap-20">
            {sections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h3 className="mb-4 font-bold">{section.title}</h3>
                <ul className="text-muted-foreground space-y-3 text-sm">
                  {section.links.map((link, linkIdx) => (
                    <li
                      key={linkIdx}
                      className="hover:text-primary font-medium"
                    >
                      <button 
                        onClick={() => handleNavigation(link.href)}
                        className="text-left"
                      >
                        {link.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="text-muted-foreground mt-8 flex flex-col justify-between gap-4 border-t py-8 text-xs font-medium md:flex-row md:items-center md:text-left">
          <p className="order-2 lg:order-1">{copyright}</p>
          <ul className="order-1 flex flex-col gap-2 md:order-2 md:flex-row">
            {defaultLegalLinks.map((link, idx) => (
              <li key={idx} className="hover:text-primary">
                <a href={link.href}> {link.name}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return <Footer7 />;
}
