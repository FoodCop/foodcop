"use client";
import { useEffect, useState } from "react";
import Hero from "@/components/landing/Hero";
import SectionOne from "@/components/landing/SectionOne";
import SectionTwo from "@/components/landing/SectionTwo";
import SectionThree from "@/components/landing/SectionThree";
import CuisineSection from "@/components/landing/CuisineSection";
import SectionFour from "@/components/landing/SectionFour";
import { AboutUsPage } from "@/components/info/AboutUsPage";
import { CareersPage } from "@/components/info/CareersPage";
import { PressPage } from "@/components/info/PressPage";
import { PrivacyPolicyPage } from "@/components/info/PrivacyPolicyPage";
import { TermsOfServicePage } from "@/components/info/TermsOfServicePage";
import { CookiePolicyPage } from "@/components/info/CookiePolicyPage";
import { AccessibilityPage } from "@/components/info/AccessibilityPage";
import { HelpCenterPage } from "@/components/info/HelpCenterPage";
import { ContactUsPage } from "@/components/info/ContactUsPage";
import { RestaurantPartnersPage } from "@/components/info/RestaurantPartnersPage";
// Reusable sections (ported)

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState("landing");

  useEffect(() => {
    const handleNavigation = (event: CustomEvent) => {
      setCurrentPage(event.detail);
    };

    window.addEventListener("navigateToPage", handleNavigation as EventListener);

    return () => {
      window.removeEventListener("navigateToPage", handleNavigation as EventListener);
    };
  }, []);
  const renderPage = () => {
    switch (currentPage) {
      case "about-us":
        return <AboutUsPage />;
      case "careers":
        return <CareersPage />;
      case "press":
        return <PressPage />;
      case "privacy-policy":
        return <PrivacyPolicyPage />;
      case "terms-of-service":
        return <TermsOfServicePage />;
      case "cookie-policy":
        return <CookiePolicyPage />;
      case "accessibility":
        return <AccessibilityPage />;
      case "help-center":
        return <HelpCenterPage />;
      case "contact-us":
        return <ContactUsPage />;
      case "restaurant-partners":
        return <RestaurantPartnersPage />;
      case "landing":
      default:
        return (
          <>
            <Hero />
            <SectionOne />
            <SectionTwo />
            <SectionThree />
            <CuisineSection />
            <SectionFour />
          </>
        );
    }
  };

  return (
    <main className="min-h-screen">
      {renderPage()}
    </main>
  );
}
