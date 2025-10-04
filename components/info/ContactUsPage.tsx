import { ArrowLeft, Clock, Mail, MessageCircle } from "lucide-react";

export function ContactUsPage() {
  const handleBackToHome = () => {
    const event = new CustomEvent("navigateToPage", { detail: "landing" });
    window.dispatchEvent(event);
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToHome}
                className="flex items-center text-gray-600 hover:text-[#F14C35] transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Home
              </button>
            </div>
            <h1 className="text-2xl font-bold text-[#0B1F3A]">Contact Us</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-[#F14C35] to-[#FF8C3A] px-8 py-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
            <p className="text-lg opacity-90">
              We&apos;d love to hear from you. Whether you have questions, feedback,
              or just want to say hello, we&apos;re here to help.
            </p>
          </div>

          <div className="p-8">
            {/* Contact Methods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-6">
                  Contact Information
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <Mail className="w-6 h-6 text-[#F14C35] mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        General Inquiries
                      </h4>
                      <a
                        href="mailto:hello@fuzo.app"
                        className="text-[#F14C35] hover:underline"
                      >
                        hello@fuzo.app
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <MessageCircle className="w-6 h-6 text-[#F14C35] mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900">Support</h4>
                      <a
                        href="mailto:support@fuzo.app"
                        className="text-[#F14C35] hover:underline"
                      >
                        support@fuzo.app
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <Mail className="w-6 h-6 text-[#F14C35] mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Press & Media
                      </h4>
                      <a
                        href="mailto:press@fuzo.app"
                        className="text-[#F14C35] hover:underline"
                      >
                        press@fuzo.app
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <Mail className="w-6 h-6 text-[#F14C35] mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Partnerships
                      </h4>
                      <a
                        href="mailto:partners@fuzo.app"
                        className="text-[#F14C35] hover:underline"
                      >
                        partners@fuzo.app
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <Mail className="w-6 h-6 text-[#F14C35] mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Privacy & Legal
                      </h4>
                      <a
                        href="mailto:privacy@fuzo.app"
                        className="text-[#F14C35] hover:underline"
                      >
                        privacy@fuzo.app
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-6">
                  Response Times
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-[#F14C35]" />
                    <div>
                      <p className="font-medium text-gray-900">
                        General Inquiries
                      </p>
                      <p className="text-sm text-gray-600">
                        Within 2 business days
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-[#F14C35]" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Support Issues
                      </p>
                      <p className="text-sm text-gray-600">Within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-[#F14C35]" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Press Inquiries
                      </p>
                      <p className="text-sm text-gray-600">
                        Within 1 business day
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-[#F14C35]" />
                    <div>
                      <p className="font-medium text-gray-900">Partnerships</p>
                      <p className="text-sm text-gray-600">
                        Within 3 business days
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-6">
                Frequently Asked Questions
              </h3>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    How do I report a restaurant or venue?
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Use the &quot;Report&quot; button on any restaurant card, or email us
                    at support@fuzo.app with the venue name and issue details.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Can I suggest a restaurant to be added?
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Absolutely! Email us at partners@fuzo.app with the
                    restaurant details and we&apos;ll review it for inclusion.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    How do I update my account information?
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Go to your profile settings in the app, or contact
                    support@fuzo.app for assistance with account changes.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Is FUZO available in my city?
                  </h4>
                  <p className="text-gray-600 text-sm">
                    We&apos;re constantly expanding! Check our app for current
                    coverage, or email hello@fuzo.app to request your city.
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Help */}
            <div className="border-t border-gray-200 pt-8 mt-8">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[#0B1F3A] mb-3">
                  Need More Help?
                </h3>
                <p className="text-gray-600 mb-4">
                  Check out our Help Center for detailed guides and
                  troubleshooting tips.
                </p>
                <button
                  onClick={() => {
                    const event = new CustomEvent("navigateToPage", {
                      detail: "help-center",
                    });
                    window.dispatchEvent(event);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-[#F14C35] text-white rounded-lg hover:bg-[#E03D2A] transition-colors"
                >
                  Visit Help Center
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
