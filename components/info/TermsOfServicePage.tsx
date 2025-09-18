import { ArrowLeft } from "lucide-react";

export function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <p className="text-gray-600">
            <strong>Effective date:</strong> January 2025
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-12">
          <p className="text-lg text-gray-700 leading-relaxed">
            By using FUZO, you agree to these Terms.
          </p>
        </section>

        {/* Basics */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">Basics</h2>
          <ul className="space-y-4">
            {[
              "You must be at least 13, or older where required by law.",
              "Use FUZO lawfully and respectfully; do not misuse the Services.",
              "We may update features or terms; material changes will be notified.",
            ].map((term, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-[#F14C35] rounded-full mt-2 mr-4 flex-shrink-0"></div>
                <span className="text-gray-700">{term}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Your content */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Your content
          </h2>
          <div className="bg-gray-50 p-6 rounded-xl">
            <p className="text-gray-700">
              You retain ownership of content you submit. You grant FUZO a
              worldwide, non‑exclusive, royalty‑free license to host, display
              and distribute that content within the Services. Do not upload
              content you do not have rights to share.
            </p>
          </div>
        </section>

        {/* AI-generated content */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            AI‑generated content
          </h2>
          <div className="bg-yellow-50 p-6 rounded-xl border-l-4 border-yellow-400">
            <p className="text-gray-700">
              FUZO uses AI to generate copy and suggestions. AI output can be
              imperfect or outdated. Treat it as guidance; verify critical
              details (e.g., hours, addresses, allergens).
            </p>
          </div>
        </section>

        {/* Third-party services */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Third‑party services
          </h2>
          <div className="bg-gray-50 p-6 rounded-xl">
            <p className="text-gray-700">
              FUZO relies on third‑party APIs such as Google Maps Platform,
              OpenAI, Spoonacular and Stream. Use of these features may be
              subject to those providers' terms and privacy policies. Google and
              Google Maps are trademarks of Google LLC.
            </p>
          </div>
        </section>

        {/* Disclaimers & limitation of liability */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Disclaimers & limitation of liability
          </h2>
          <div className="bg-red-50 p-6 rounded-xl border-l-4 border-red-400">
            <p className="text-gray-700">
              FUZO is provided "as is" without warranties of any kind. To the
              extent permitted by law, FUZO shall not be liable for indirect or
              consequential damages arising from your use of the Services.
            </p>
          </div>
        </section>

        {/* Termination */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Termination
          </h2>
          <div className="bg-gray-50 p-6 rounded-xl">
            <p className="text-gray-700">
              We may suspend or terminate accounts that violate these Terms or
              our community guidelines.
            </p>
          </div>
        </section>

        {/* Governing law */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Governing law
          </h2>
          <div className="bg-gray-50 p-6 rounded-xl">
            <p className="text-gray-700">
              These Terms are governed by applicable local laws. Any disputes
              will be resolved in accordance with local jurisdiction
              requirements.
            </p>
          </div>
        </section>

        {/* Community guidelines */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Community Guidelines
          </h2>
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Food‑only chat experience
              </h3>
              <p className="text-gray-700">
                Off‑topic queries are politely redirected to appropriate
                resources.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Prohibited content
              </h3>
              <p className="text-gray-700">
                We do not allow hate speech, harassment, explicit content, or
                illegal activities.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Venue requests
              </h3>
              <p className="text-gray-700">
                Venues may request edits or removal via{" "}
                <a
                  href="mailto:partners@fuzo.app"
                  className="text-[#F14C35] hover:underline"
                >
                  partners@fuzo.app
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">Contact</h2>
          <div className="bg-gradient-to-br from-[#F14C35]/5 to-[#FF8C3A]/5 p-8 rounded-2xl">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                  Legal Questions
                </h3>
                <p className="text-gray-700">
                  <a
                    href="mailto:legal@fuzo.app"
                    className="text-[#F14C35] hover:underline"
                  >
                    legal@fuzo.app
                  </a>
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                  General Support
                </h3>
                <p className="text-gray-700">
                  <a
                    href="mailto:support@fuzo.app"
                    className="text-[#F14C35] hover:underline"
                  >
                    support@fuzo.app
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Updates */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Updates to these Terms
          </h2>
          <div className="bg-gray-50 p-6 rounded-xl">
            <p className="text-gray-700">
              We may update these Terms from time to time. We will notify you of
              any material changes by posting the new Terms on this page and
              updating the "Effective date" at the top of this policy.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
