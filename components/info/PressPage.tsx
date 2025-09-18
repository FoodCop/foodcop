import { ArrowLeft, Download, ExternalLink, Mail } from "lucide-react";

export function PressPage() {
  const handleBackToHome = () => {
    const event = new CustomEvent("navigateToPage", { detail: "landing" });
    window.dispatchEvent(event);
  };
  const pressTemplates = [
    {
      id: "launch-announcement",
      title: "Launch / Product announcement",
      headline: "FUZO launches AI connoisseurs for food discovery",
      angle: "specialty AIs; daily seven picks; food‑only chat; map pins",
      proof: "cities covered; dataset scale; speed; examples",
    },
    {
      id: "city-expansion",
      title: "City expansion",
      headline: "FUZO expands to Singapore & Bangkok",
      angle: "partner restaurants, early lists, upcoming areas",
      proof: "Include: partner restaurants, early lists, upcoming areas",
    },
    {
      id: "feature-spotlight",
      title: "Feature spotlight",
      headline: "Save & share with FUZO's food map",
      angle: "Focus on pins, notes, lists, and navigation",
      proof: "Focus on pins, notes, lists, and navigation",
    },
    {
      id: "data-trends",
      title: "Data & trends",
      headline: "Street‑food surges after midnight—FUZO data shows",
      angle: "Analyze anonymized engagement and saves; include methodology",
      proof: "Analyze anonymized engagement and saves; include methodology",
    },
    {
      id: "partner-story",
      title: "Partner story",
      headline: "Local bakeries find new regulars via FUZO",
      angle: "Human‑level impact: discovery → visit → repeat",
      proof: "Human‑level impact: discovery → visit → repeat",
    },
    {
      id: "creator-collaborations",
      title: "Creator collaborations",
      headline: "Chef collabs bring neighborhood gems to light",
      angle: "Include creator bios, routes, and favorite orders",
      proof: "Include creator bios, routes, and favorite orders",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header with back button */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <button
              onClick={handleBackToHome}
              className="flex items-center text-[#F14C35] hover:text-[#E03D2A] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#0B1F3A] mb-6">
            Press & Media
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            FUZO is an AI‑powered food discovery platform that surfaces
            extraordinary restaurants and recipes through seven specialty AI
            connoisseurs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="mailto:press@fuzo.app"
              className="inline-flex items-center bg-[#F14C35] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#E03D2A] transition-colors"
            >
              <Mail className="w-5 h-5 mr-2" />
              Contact Press
            </a>
            <a
              href="#media-kit"
              className="inline-flex items-center bg-white text-[#F14C35] border-2 border-[#F14C35] px-6 py-3 rounded-xl font-semibold hover:bg-[#F14C35] hover:text-white transition-colors"
            >
              <Download className="w-5 h-5 mr-2" />
              Media Kit
            </a>
          </div>
        </div>

        {/* Quick facts */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Quick Facts
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                stat: "7",
                label: "AI Connoisseurs",
                description: "Specialized in different food categories",
              },
              {
                stat: "1000+",
                label: "Restaurants",
                description: "Curated across major cities",
              },
              {
                stat: "Daily",
                label: "Fresh Picks",
                description: "New recommendations every day",
              },
              {
                stat: "Food-only",
                label: "Chat Experience",
                description: "AI that stays focused on food",
              },
              {
                stat: "Global",
                label: "Coverage",
                description: "Expanding to new cities regularly",
              },
              {
                stat: "AI-powered",
                label: "Discovery",
                description: "Smart recommendations, not generic lists",
              },
            ].map((fact, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-[#F14C35]/5 to-[#FF8C3A]/5 p-6 rounded-xl text-center"
              >
                <div className="text-3xl font-bold text-[#F14C35] mb-2">
                  {fact.stat}
                </div>
                <div className="font-semibold text-[#0B1F3A] mb-2">
                  {fact.label}
                </div>
                <div className="text-gray-600 text-sm">{fact.description}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Quote boilerplate */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Quote Boilerplate
          </h2>
          <div className="bg-gray-50 p-8 rounded-2xl">
            <blockquote className="text-xl text-gray-700 italic leading-relaxed">
              "FUZO's goal is simple: fewer mediocre meals. Our AI connoisseurs
              do the heavy lifting so you can eat well, anywhere."
            </blockquote>
            <div className="mt-4 text-sm text-gray-600">
              <strong>Attribution:</strong> FUZO Team
            </div>
          </div>
        </section>

        {/* Press templates */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Press Templates
          </h2>
          <div className="space-y-8">
            {pressTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-[#0B1F3A] mb-4">
                      {template.title}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">
                          Headline:
                        </h4>
                        <p className="text-gray-700 italic">
                          "{template.headline}"
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">
                          Angle:
                        </h4>
                        <p className="text-gray-700">{template.angle}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">
                          Proof points:
                        </h4>
                        <p className="text-gray-700">{template.proof}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 md:ml-6">
                    <a
                      href={`mailto:press@fuzo.app?subject=${encodeURIComponent(
                        template.title
                      )} - Press Inquiry`}
                      className="inline-flex items-center bg-[#F14C35] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#E03D2A] transition-colors text-sm"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Request Info
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Media kit */}
        <section id="media-kit" className="mb-16">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">Media Kit</h2>
          <div className="bg-gradient-to-br from-[#F14C35]/5 to-[#FF8C3A]/5 p-8 rounded-2xl">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                  Available Assets
                </h3>
                <ul className="space-y-3">
                  {[
                    "FUZO logo (PNG, SVG)",
                    "Brand guidelines & colors",
                    "Product screenshots",
                    "Founder photos & bios",
                    "App icon & favicon",
                    "Social media assets",
                  ].map((asset, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-[#F14C35] rounded-full mr-3"></div>
                      <span className="text-gray-700">{asset}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                  Request Access
                </h3>
                <p className="text-gray-700 mb-4">
                  Get access to our complete media kit including high-resolution
                  assets, brand guidelines, and product screenshots.
                </p>
                <a
                  href="mailto:press@fuzo.app?subject=Media Kit Request"
                  className="inline-flex items-center bg-[#F14C35] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#E03D2A] transition-colors"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Request Media Kit
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Contact information */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Press Contact
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 p-8 rounded-2xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                General Press
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-[#F14C35] mr-3" />
                  <a
                    href="mailto:press@fuzo.app"
                    className="text-gray-700 hover:text-[#F14C35] transition-colors"
                  >
                    press@fuzo.app
                  </a>
                </div>
                <p className="text-gray-600 text-sm">
                  For general press inquiries, interview requests, and media kit
                  access.
                </p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 p-8 rounded-2xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Response Time
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <ExternalLink className="w-5 h-5 text-[#F14C35] mr-3" />
                  <span className="text-gray-700">Within 24 hours</span>
                </div>
                <p className="text-gray-600 text-sm">
                  We aim to respond to all press inquiries within one business
                  day.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Recent coverage placeholder */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Recent Coverage
          </h2>
          <div className="bg-gray-50 p-8 rounded-2xl text-center">
            <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
              Coming Soon
            </h3>
            <p className="text-gray-600 mb-6">
              We're just getting started! Check back soon for press coverage and
              media mentions.
            </p>
            <a
              href="mailto:press@fuzo.app?subject=Press Coverage Inquiry"
              className="inline-flex items-center text-[#F14C35] hover:text-[#E03D2A] transition-colors font-semibold"
            >
              <Mail className="w-5 h-5 mr-2" />
              Be the first to cover us
            </a>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-gradient-to-br from-[#F14C35] to-[#FF8C3A] text-white p-12 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4">
            Ready to write about FUZO?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Get in touch for interviews, demos, and exclusive access.
          </p>
          <a
            href="mailto:press@fuzo.app?subject=Press Inquiry"
            className="inline-block bg-white text-[#F14C35] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors"
          >
            Contact Our Press Team
          </a>
        </section>
      </div>
    </div>
  );
}
