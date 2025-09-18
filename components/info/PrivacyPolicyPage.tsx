import { ArrowLeft } from "lucide-react";

export function PrivacyPolicyPage() {
  const handleBackToHome = () => {
    const event = new CustomEvent("navigateToPage", { detail: "landing" });
    window.dispatchEvent(event);
  };

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
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#0B1F3A] mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600">
            <strong>Effective date:</strong> January 2025
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-12">
          <p className="text-lg text-gray-700 leading-relaxed">
            FUZO ("we", "us", "our") provides a food‑discovery service available
            via our website and apps ("Services"). This Privacy Policy explains
            how we collect, use, disclose, and safeguard personal information.
          </p>
        </section>

        {/* Information we collect */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Information we collect
          </h2>
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Account & profile
              </h3>
              <p className="text-gray-700">
                Name, email, avatar, preferences, saved lists.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Usage & device
              </h3>
              <p className="text-gray-700">
                Interactions, pages viewed, approximate location, device and
                browser metadata, crash logs.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Location (optional)
              </h3>
              <p className="text-gray-700">
                With permission, we use your device location to show nearby
                results.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Content
              </h3>
              <p className="text-gray-700">
                Favorites, notes, reviews, photos you upload, chat messages with
                Tako.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Third‑party data
              </h3>
              <p className="text-gray-700">
                Map/place and photo assets (Google Maps Platform), recipes
                (Spoonacular), chat metadata (Stream).
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Cookies & similar technologies
              </h3>
              <p className="text-gray-700">
                See our{" "}
                <button
                  onClick={() => {
                    const event = new CustomEvent("navigateToPage", {
                      detail: "cookie-policy",
                    });
                    window.dispatchEvent(event);
                  }}
                  className="text-[#F14C35] hover:underline"
                >
                  Cookie Policy
                </button>{" "}
                for details.
              </p>
            </div>
          </div>
        </section>

        {/* How we use information */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            How we use information
          </h2>
          <ul className="space-y-4">
            {[
              "Provide, personalize, and improve the Services",
              "Surface recommendations from AI connoisseurs; maintain your food map",
              "Safety and moderation; prevent abuse and fraud",
              "Analytics, research, and product development",
              "Communicate service updates and respond to support requests",
            ].map((use, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-[#F14C35] rounded-full mt-2 mr-4 flex-shrink-0"></div>
                <span className="text-gray-700">{use}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Legal bases */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Legal bases (EEA/UK)
          </h2>
          <div className="bg-blue-50 p-6 rounded-xl">
            <p className="text-gray-700">
              Performance of a contract; legitimate interests (product
              improvement, safety); consent (where required); compliance with
              legal obligations.
            </p>
          </div>
        </section>

        {/* Sharing */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">Sharing</h2>
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Processors & infrastructure
              </h3>
              <p className="text-gray-700">
                hosting, analytics, email, error reporting.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                APIs
              </h3>
              <p className="text-gray-700">
                Google Maps Platform (maps, places, photos), OpenAI (text
                generation), Spoonacular (recipes), Stream (chat).
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Law & safety
              </h3>
              <p className="text-gray-700">
                when required by law or to protect users and FUZO.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Business transfers
              </h3>
              <p className="text-gray-700">
                in connection with a merger, acquisition or sale.
              </p>
            </div>
          </div>
        </section>

        {/* Retention */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">Retention</h2>
          <div className="bg-gray-50 p-6 rounded-xl">
            <p className="text-gray-700">
              We retain data for as long as your account is active or as needed
              to provide the Services, comply with legal obligations, or resolve
              disputes. You may request deletion at any time.
            </p>
          </div>
        </section>

        {/* Your rights */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Your rights
          </h2>
          <div className="bg-gray-50 p-6 rounded-xl">
            <p className="text-gray-700 mb-4">
              Depending on your location, you may have rights to access,
              correct, delete, port, or restrict processing of your data.
              Contact{" "}
              <a
                href="mailto:privacy@fuzo.app"
                className="text-[#F14C35] hover:underline"
              >
                privacy@fuzo.app
              </a>
              . You may opt out of marketing emails at any time.
            </p>
          </div>
        </section>

        {/* International transfers */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            International transfers
          </h2>
          <div className="bg-gray-50 p-6 rounded-xl">
            <p className="text-gray-700">
              Data may be processed in countries other than your own. We use
              appropriate safeguards where required.
            </p>
          </div>
        </section>

        {/* Children */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">Children</h2>
          <div className="bg-gray-50 p-6 rounded-xl">
            <p className="text-gray-700">
              FUZO is not directed to children under 13 (or the age required by
              local law). If you believe we collected data from a child, contact
              us to delete it.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">Contact</h2>
          <div className="bg-gradient-to-br from-[#F14C35]/5 to-[#FF8C3A]/5 p-8 rounded-2xl">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                  Data Protection
                </h3>
                <p className="text-gray-700">
                  <a
                    href="mailto:privacy@fuzo.app"
                    className="text-[#F14C35] hover:underline"
                  >
                    privacy@fuzo.app
                  </a>
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                  Address
                </h3>
                <p className="text-gray-700">
                  Contact us for our business address
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Updates */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Updates to this Policy
          </h2>
          <div className="bg-gray-50 p-6 rounded-xl">
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by posting the new Privacy
              Policy on this page and updating the "Effective date" at the top
              of this policy.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
