import React from 'react';

export function FuzoFooter() {
  const footerSections = [
    {
      title: "Company",
      links: ["About Us", "Careers", "Press", "Blog"]
    },
    {
      title: "Legal & Policies", 
      links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Accessibility"]
    },
    {
      title: "Support & Contact",
      links: ["Help Center", "Contact Us", "Community", "Feedback"]
    },
    {
      title: "Partners & Social",
      links: ["Restaurant Partners", "API", "Instagram", "Twitter"]
    }
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Logo and main content */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-1">
            <h2 className="text-2xl font-bold text-[#F14C35] mb-4">FUZO</h2>
            <p className="text-gray-600 text-sm">
              Your intelligent food companion for discovering amazing culinary adventures.
            </p>
          </div>
          
          {/* Footer links */}
          {footerSections.map((section, index) => (
            <div key={index} className="space-y-4">
              <h3 className="font-semibold text-[#0B1F3A]">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a 
                      href="#" 
                      className="text-gray-600 hover:text-[#F14C35] text-sm transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Copyright */}
        <div className="border-t border-gray-200 mt-12 pt-8">
          <p className="text-center text-gray-500 text-sm">
            © 2024 FUZO. All rights reserved. Made with ❤️ for food lovers everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
}