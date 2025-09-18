import { ArrowLeft } from "lucide-react";

export function CookiePolicyPage() {
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
            Cookie Policy
          </h1>
          <p className="text-gray-600">
            <strong>Effective date:</strong> January 2025
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-12">
          <p className="text-lg text-gray-700 leading-relaxed">
            We use cookies and similar technologies to run the site, remember
            preferences, and analyze usage.
          </p>
        </section>

        {/* Cookie types */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Types of Cookies We Use
          </h2>
          <div className="space-y-6">
            <div className="bg-red-50 p-6 rounded-xl border-l-4 border-red-400">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Essential cookies (required)
              </h3>
              <p className="text-gray-700 mb-4">
                These cookies are necessary for the website to function and
                cannot be switched off in our systems.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Authentication and login sessions
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Security and fraud prevention
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Load balancing and performance
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Shopping cart and checkout functionality
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-400">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Preference cookies
              </h3>
              <p className="text-gray-700 mb-4">
                These cookies remember your choices and preferences to provide a
                more personalized experience.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Language and region settings
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Theme and display preferences
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Saved restaurant lists and favorites
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 p-6 rounded-xl border-l-4 border-green-400">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Analytics cookies
              </h3>
              <p className="text-gray-700 mb-4">
                These cookies help us understand how visitors interact with our
                website to improve user experience.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Page views and user journeys
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Feature usage and engagement metrics
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Error tracking and performance monitoring
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-purple-50 p-6 rounded-xl border-l-4 border-purple-400">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Marketing cookies (optional)
              </h3>
              <p className="text-gray-700 mb-4">
                These cookies are used to deliver relevant advertisements and
                track campaign effectiveness. Off by default.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Ad targeting and personalization
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Campaign performance tracking
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Social media integration
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Third-party cookies */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Third-Party Cookies
          </h2>
          <div className="bg-gray-50 p-6 rounded-xl">
            <p className="text-gray-700 mb-4">
              We use third-party services that may set their own cookies:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-[#F14C35] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">
                  <strong>Google Maps Platform:</strong> For map functionality
                  and location services
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-[#F14C35] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">
                  <strong>Stream Chat:</strong> For chat functionality and
                  real-time messaging
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-[#F14C35] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">
                  <strong>Analytics providers:</strong> For website performance
                  and usage analytics
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-[#F14C35] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">
                  <strong>Payment processors:</strong> For secure payment
                  processing (if applicable)
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* Managing cookies */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Managing Your Cookie Preferences
          </h2>
          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                In FUZO Settings
              </h3>
              <p className="text-gray-700 mb-4">
                You can manage your cookie preferences in{" "}
                <strong>Settings → Privacy</strong> within the FUZO app or
                website.
              </p>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> Blocking essential cookies may limit
                  functionality and prevent you from using certain features of
                  our service.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                In Your Browser
              </h3>
              <p className="text-gray-700 mb-4">
                You can also control cookies through your browser settings.
                Here's how for popular browsers:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    <strong>Chrome:</strong> Settings → Privacy and security →
                    Cookies and other site data
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    <strong>Firefox:</strong> Options → Privacy & Security →
                    Cookies and Site Data
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    <strong>Safari:</strong> Preferences → Privacy → Manage
                    Website Data
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    <strong>Edge:</strong> Settings → Cookies and site
                    permissions → Cookies and site data
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Cookie duration */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Cookie Duration
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Session Cookies
              </h3>
              <p className="text-gray-700">
                These cookies are temporary and are deleted when you close your
                browser. Used for essential functionality like login sessions.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Persistent Cookies
              </h3>
              <p className="text-gray-700">
                These cookies remain on your device for a set period (typically
                30 days to 2 years) to remember your preferences and improve
                your experience.
              </p>
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
              We may update this Cookie Policy from time to time to reflect
              changes in our practices or for other operational, legal, or
              regulatory reasons. We will notify you of any material changes by
              posting the new Cookie Policy on this page.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Questions About Cookies
          </h2>
          <div className="bg-gradient-to-br from-[#F14C35]/5 to-[#FF8C3A]/5 p-8 rounded-2xl">
            <p className="text-gray-700 mb-4">
              If you have any questions about our use of cookies or this Cookie
              Policy, please contact us:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                  Privacy Team
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
      </div>
    </div>
  );
}
