import { AlertCircle, ArrowLeft, CheckCircle, Mail } from "lucide-react";

export function AccessibilityPage() {
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
            Accessibility
          </h1>
          <p className="text-xl text-gray-600">
            We aim for WCAG 2.2 AA compliance to ensure FUZO is accessible to
            everyone.
          </p>
        </div>

        {/* Our commitment */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-[#F14C35]/5 to-[#FF8C3A]/5 p-8 rounded-2xl">
            <h2 className="text-3xl font-bold text-[#0B1F3A] mb-6">
              Our Commitment
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              At FUZO, we believe that great food discovery should be accessible
              to everyone. We&apos;re committed to making our platform usable by
              people with diverse abilities, including those who use assistive
              technologies.
            </p>
          </div>
        </section>

        {/* What we do */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">What We Do</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                <h3 className="text-xl font-semibold text-[#0B1F3A]">
                  Semantic HTML
                </h3>
              </div>
              <p className="text-gray-700">
                We use proper HTML structure with semantic elements, headings,
                and landmarks to ensure screen readers can navigate content
                effectively.
              </p>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                <h3 className="text-xl font-semibold text-[#0B1F3A]">
                  Keyboard Navigation
                </h3>
              </div>
              <p className="text-gray-700">
                All interactive elements are keyboard accessible with clear
                focus indicators and logical tab order.
              </p>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                <h3 className="text-xl font-semibold text-[#0B1F3A]">
                  Color Contrast
                </h3>
              </div>
              <p className="text-gray-700">
                We maintain sufficient color contrast ratios (4.5:1 for normal
                text, 3:1 for large text) to ensure readability.
              </p>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                <h3 className="text-xl font-semibold text-[#0B1F3A]">
                  Motion Preferences
                </h3>
              </div>
              <p className="text-gray-700">
                We respect user preferences for reduced motion and provide
                alternatives for animated content.
              </p>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                <h3 className="text-xl font-semibold text-[#0B1F3A]">
                  Alt Text
                </h3>
              </div>
              <p className="text-gray-700">
                Meaningful images include descriptive alt text, while decorative
                images are marked appropriately.
              </p>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                <h3 className="text-xl font-semibold text-[#0B1F3A]">
                  Form Labels
                </h3>
              </div>
              <p className="text-gray-700">
                All form controls have clear, descriptive labels and error
                messages that are announced to screen readers.
              </p>
            </div>
          </div>
        </section>

        {/* Features for accessibility */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Accessibility Features
          </h2>
          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Screen Reader Support
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    ARIA labels and descriptions for complex UI elements
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Live regions for dynamic content updates
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Proper heading hierarchy for content structure
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Visual Accessibility
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    High contrast mode support
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Scalable text up to 200% without horizontal scrolling
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Color is not the only means of conveying information
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-purple-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Motor Accessibility
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Large touch targets (minimum 44x44px) for mobile
                    interactions
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    No time limits on user interactions
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Keyboard shortcuts for common actions
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Known limitations */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Known Limitations
          </h2>
          <div className="bg-yellow-50 p-6 rounded-xl border-l-4 border-yellow-400">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-600 mr-3" />
              <h3 className="text-xl font-semibold text-[#0B1F3A]">
                Areas We&apos;re Working On
              </h3>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">
                  Some third-party integrations may not be fully accessible
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">
                  Video content may lack captions (we&apos;re working on this)
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">
                  Some complex data visualizations may need improvement
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* Testing and compliance */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Testing & Compliance
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Our Testing Process
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-[#F14C35] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Automated accessibility testing with axe-core
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-[#F14C35] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Manual testing with screen readers (NVDA, JAWS, VoiceOver)
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-[#F14C35] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Keyboard-only navigation testing
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-[#F14C35] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Color contrast validation
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Standards We Follow
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-[#F14C35] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">WCAG 2.2 AA guidelines</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-[#F14C35] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Section 508 compliance (US federal)
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-[#F14C35] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    ADA compliance principles
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-[#F14C35] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    EN 301 549 (European standard)
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Feedback */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Feedback & Support
          </h2>
          <div className="bg-gradient-to-br from-[#F14C35]/5 to-[#FF8C3A]/5 p-8 rounded-2xl">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#0B1F3A] mb-4">
                Help Us Improve
              </h3>
              <p className="text-lg text-gray-700 mb-6">
                Spotted an accessibility issue? We want to hear from you and
                will work to fix it promptly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:accessibility@fuzo.app?subject=Accessibility Issue Report"
                  className="inline-flex items-center bg-[#F14C35] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#E03D2A] transition-colors"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Report an Issue
                </a>
                <a
                  href="mailto:support@fuzo.app?subject=Accessibility Support"
                  className="inline-flex items-center bg-white text-[#F14C35] border-2 border-[#F14C35] px-6 py-3 rounded-xl font-semibold hover:bg-[#F14C35] hover:text-white transition-colors"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Get Support
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Resources */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Accessibility Resources
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                For Users
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-[#F14C35] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Keyboard shortcuts guide
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-[#F14C35] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Screen reader setup instructions
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-[#F14C35] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    High contrast mode activation
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                For Developers
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-[#F14C35] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    Accessibility testing tools
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-[#F14C35] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">
                    WCAG 2.2 guidelines reference
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-[#F14C35] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">ARIA best practices</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Contact Our Accessibility Team
          </h2>
          <div className="bg-gray-50 p-8 rounded-2xl">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                  Accessibility Issues
                </h3>
                <p className="text-gray-700 mb-2">
                  <a
                    href="mailto:accessibility@fuzo.app"
                    className="text-[#F14C35] hover:underline"
                  >
                    accessibility@fuzo.app
                  </a>
                </p>
                <p className="text-gray-600 text-sm">
                  For reporting accessibility barriers or requesting
                  accommodations
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                  General Support
                </h3>
                <p className="text-gray-700 mb-2">
                  <a
                    href="mailto:support@fuzo.app"
                    className="text-[#F14C35] hover:underline"
                  >
                    support@fuzo.app
                  </a>
                </p>
                <p className="text-gray-600 text-sm">
                  For general questions about using FUZO
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
