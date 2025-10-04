import {
  ArrowLeft,
  Camera,
  CheckCircle,
  Clock,
  Mail,
  MapPin,
  Star,
} from "lucide-react";

export function RestaurantPartnersPage() {
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
            <h1 className="text-2xl font-bold text-[#0B1F3A]">
              Restaurant Partners
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-[#F14C35] to-[#FF8C3A] px-8 py-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Partner with FUZO</h2>
            <p className="text-lg opacity-90">
              Help great venues get discovered by people who appreciate good
              food. Join our network of featured restaurants and reach diners
              through our AI connoisseurs.
            </p>
          </div>

          <div className="p-8">
            {/* Why Partner Section */}
            <div className="mb-12">
              <h3 className="text-2xl font-semibold text-[#0B1F3A] mb-6">
                Why Partner with FUZO?
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-[#F14C35] mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Reach Quality Diners
                      </h4>
                      <p className="text-sm text-gray-600">
                        Get discovered by food lovers who value great
                        experiences, not just foot traffic.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-[#F14C35] mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        AI-Powered Discovery
                      </h4>
                      <p className="text-sm text-gray-600">
                        Featured in curated daily picks by our specialty AI
                        connoisseurs.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-[#F14C35] mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Practical Tips Included
                      </h4>
                      <p className="text-sm text-gray-600">
                        Each feature includes what to order, when to go, and
                        cost cues.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-[#F14C35] mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Free Basic Listing
                      </h4>
                      <p className="text-sm text-gray-600">
                        No cost to join our network and get discovered.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-[#F14C35] mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Enhanced Profiles
                      </h4>
                      <p className="text-sm text-gray-600">
                        Optional premium features like hero photos and signature
                        dishes.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-[#F14C35] mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Map Integration
                      </h4>
                      <p className="text-sm text-gray-600">
                        Direct navigation links help customers find you easily.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* What We Need Section */}
            <div className="mb-12">
              <h3 className="text-2xl font-semibold text-[#0B1F3A] mb-6">
                What We Need from You
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-lg font-medium text-gray-900">
                    Required Information
                  </h4>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-[#F14C35] mt-1" />
                      <div>
                        <p className="font-medium text-gray-900">
                          Accurate Location
                        </p>
                        <p className="text-sm text-gray-600">
                          Correct map pin and full address
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-[#F14C35] mt-1" />
                      <div>
                        <p className="font-medium text-gray-900">
                          Current Hours
                        </p>
                        <p className="text-sm text-gray-600">
                          Up-to-date opening times and days
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Star className="w-5 h-5 text-[#F14C35] mt-1" />
                      <div>
                        <p className="font-medium text-gray-900">
                          Signature Dishes
                        </p>
                        <p className="text-sm text-gray-600">
                          What you&apos;re known for and recommend
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <span className="w-5 h-5 text-[#F14C35] mt-1 text-lg">
                        💰
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">Price Range</p>
                        <p className="text-sm text-gray-600">
                          Approximate cost per person
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-lg font-medium text-gray-900">
                    Optional Enhancements
                  </h4>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Camera className="w-5 h-5 text-[#F14C35] mt-1" />
                      <div>
                        <p className="font-medium text-gray-900">
                          High-Quality Photos
                        </p>
                        <p className="text-sm text-gray-600">
                          Images you own or license to share
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <span className="w-5 h-5 text-[#F14C35] mt-1 text-lg">
                        📖
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">
                          Restaurant Story
                        </p>
                        <p className="text-sm text-gray-600">
                          Background on your venue or signature dishes
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <span className="w-5 h-5 text-[#F14C35] mt-1 text-lg">
                        ⏰
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">
                          Peak Time Tips
                        </p>
                        <p className="text-sm text-gray-600">
                          Best times to visit or avoid crowds
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <span className="w-5 h-5 text-[#F14C35] mt-1 text-lg">
                        🍽️
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">
                          Special Dietary Info
                        </p>
                        <p className="text-sm text-gray-600">
                          Vegetarian, vegan, or allergen-friendly options
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quality Standards */}
            <div className="mb-12">
              <h3 className="text-2xl font-semibold text-[#0B1F3A] mb-6">
                Quality & Standards
              </h3>

              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-gray-700 mb-4">
                  We maintain high standards to ensure our recommendations are
                  helpful and accurate. We keep things respectful and focus on
                  what makes each place special.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-[#F14C35] mt-1" />
                    <p className="text-sm text-gray-600">
                      All information is verified for accuracy
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-[#F14C35] mt-1" />
                    <p className="text-sm text-gray-600">
                      We focus on what makes your venue unique
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-[#F14C35] mt-1" />
                    <p className="text-sm text-gray-600">
                      Quick response to edit requests or corrections
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-[#F14C35] mt-1" />
                    <p className="text-sm text-gray-600">
                      Respectful representation of your brand
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* How to Join */}
            <div className="mb-12">
              <h3 className="text-2xl font-semibold text-[#0B1F3A] mb-6">
                How to Join
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#F14C35] rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                    1
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">Contact Us</h4>
                  <p className="text-sm text-gray-600">
                    Email us at partners@fuzo.app with your restaurant details
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-[#F14C35] rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                    2
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Review Process
                  </h4>
                  <p className="text-sm text-gray-600">
                    We&apos;ll review your information and verify details
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-[#F14C35] rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                    3
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">Go Live</h4>
                  <p className="text-sm text-gray-600">
                    Your restaurant appears in our app and gets discovered
                  </p>
                </div>
              </div>
            </div>

            {/* Contact CTA */}
            <div className="border-t border-gray-200 pt-8">
              <div className="bg-gradient-to-r from-[#F14C35] to-[#FF8C3A] rounded-xl p-8 text-white text-center">
                <h3 className="text-2xl font-bold mb-4">
                  Ready to Partner with FUZO?
                </h3>
                <p className="text-lg opacity-90 mb-6">
                  Join our network and start reaching food lovers who appreciate
                  great dining experiences.
                </p>
                <a
                  href="mailto:partners@fuzo.app?subject=Restaurant Partnership Inquiry"
                  className="inline-flex items-center px-6 py-3 bg-white text-[#F14C35] rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Get Started Today
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
