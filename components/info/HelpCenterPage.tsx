import {
  ArrowLeft,
  ChevronRight,
  Mail,
  MessageCircle,
  Search,
} from "lucide-react";
import { useState } from "react";

export function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleBackToHome = () => {
    const event = new CustomEvent("navigateToPage", { detail: "landing" });
    window.dispatchEvent(event);
  };

  const topArticles = [
    {
      id: "getting-started",
      title: "Getting started with daily picks",
      description:
        "Learn how to discover and save amazing restaurants recommended by our AI connoisseurs.",
      category: "Getting Started",
    },
    {
      id: "saving-places",
      title: "Saving places to your food map",
      description:
        "Create your personal food map by saving restaurants you love or want to try.",
      category: "Features",
    },
    {
      id: "chatting-tako",
      title: "Chatting with Tako (food‑only)",
      description:
        "Get personalized food recommendations and tips from our AI food guide.",
      category: "Features",
    },
    {
      id: "notifications",
      title: "Managing notifications and email",
      description: "Control how and when you receive updates from FUZO.",
      category: "Account",
    },
    {
      id: "editing-places",
      title: "Editing or removing a place",
      description: "Update information or remove places from your saved lists.",
      category: "Features",
    },
    {
      id: "reporting-issues",
      title: "Reporting an issue or venue",
      description:
        "Help us improve by reporting problems or incorrect information.",
      category: "Support",
    },
  ];

  const categories = [
    {
      name: "Getting Started",
      articles: topArticles.filter(
        (article) => article.category === "Getting Started"
      ),
      icon: "🚀",
    },
    {
      name: "Features",
      articles: topArticles.filter(
        (article) => article.category === "Features"
      ),
      icon: "✨",
    },
    {
      name: "Account",
      articles: topArticles.filter((article) => article.category === "Account"),
      icon: "👤",
    },
    {
      name: "Support",
      articles: topArticles.filter((article) => article.category === "Support"),
      icon: "🆘",
    },
  ];

  const filteredArticles = searchQuery
    ? topArticles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : topArticles;

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
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#0B1F3A] mb-6">
            Help Center
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find quick guides and answers to common questions about using FUZO.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F14C35] focus:border-transparent text-lg"
              />
            </div>
          </div>
        </div>

        {/* Search results or top articles */}
        {searchQuery ? (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#0B1F3A] mb-6">
              Search Results for "{searchQuery}"
            </h2>
            {filteredArticles.length > 0 ? (
              <div className="space-y-4">
                {filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-[#0B1F3A] mb-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 mb-3">
                          {article.description}
                        </p>
                        <span className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                          {article.category}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No results found
                </h3>
                <p className="text-gray-500 mb-6">
                  Try searching with different keywords or browse our categories
                  below.
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-[#F14C35] hover:text-[#E03D2A] font-semibold"
                >
                  Clear search
                </button>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Top articles */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
                Top Articles
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {topArticles.slice(0, 6).map((article) => (
                  <div
                    key={article.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-[#0B1F3A] mb-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 mb-3">
                          {article.description}
                        </p>
                        <span className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                          {article.category}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Categories */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
                Browse by Category
              </h2>
              <div className="space-y-8">
                {categories.map((category) => (
                  <div
                    key={category.name}
                    className="bg-gray-50 rounded-xl p-6"
                  >
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-3">{category.icon}</span>
                      <h3 className="text-2xl font-bold text-[#0B1F3A]">
                        {category.name}
                      </h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {category.articles.map((article) => (
                        <div
                          key={article.id}
                          className="bg-white rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                        >
                          <h4 className="font-semibold text-[#0B1F3A] mb-2">
                            {article.title}
                          </h4>
                          <p className="text-gray-600 text-sm">
                            {article.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Quick actions */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Can't find what you're looking for?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-[#F14C35]/5 to-[#FF8C3A]/5 p-8 rounded-2xl">
              <div className="flex items-center mb-4">
                <MessageCircle className="w-8 h-8 text-[#F14C35] mr-4" />
                <h3 className="text-xl font-semibold text-[#0B1F3A]">
                  Contact Support
                </h3>
              </div>
              <p className="text-gray-700 mb-4">
                Get personalized help from our support team. We aim to reply
                within 2 business days.
              </p>
              <a
                href="mailto:support@fuzo.app"
                className="inline-flex items-center bg-[#F14C35] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#E03D2A] transition-colors"
              >
                <Mail className="w-5 h-5 mr-2" />
                Contact Support
              </a>
            </div>

            <div className="bg-gradient-to-br from-[#FF8C3A]/5 to-[#FFD74A]/5 p-8 rounded-2xl">
              <div className="flex items-center mb-4">
                <Mail className="w-8 h-8 text-[#FF8C3A] mr-4" />
                <h3 className="text-xl font-semibold text-[#0B1F3A]">
                  Send Feedback
                </h3>
              </div>
              <p className="text-gray-700 mb-4">
                Help us improve FUZO by sharing your thoughts, suggestions, or
                reporting issues.
              </p>
              <a
                href="mailto:feedback@fuzo.app"
                className="inline-flex items-center bg-[#FF8C3A] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#FF7A1A] transition-colors"
              >
                <Mail className="w-5 h-5 mr-2" />
                Send Feedback
              </a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                question: "How do I get started with FUZO?",
                answer:
                  "Simply sign up for an account, and you'll immediately start receiving daily picks from our AI connoisseurs. You can save places you're interested in and build your personal food map.",
              },
              {
                question: "Are the restaurant recommendations really from AI?",
                answer:
                  "Yes! Our seven AI connoisseurs specialize in different food categories (Street Food, Fine Dining, Sushi, etc.) and use real data to surface the best restaurants in your area.",
              },
              {
                question: "Can I chat with the AI connoisseurs?",
                answer:
                  "Absolutely! Our AI guide Tako is available for food-focused conversations. Just remember, Tako stays on topic and will politely redirect non-food questions.",
              },
              {
                question: "How often do I get new recommendations?",
                answer:
                  "You'll receive fresh daily picks from each of our seven AI connoisseurs, so you'll always have new places to discover and try.",
              },
              {
                question: "Is FUZO free to use?",
                answer:
                  "Yes, FUZO is free to use! We believe great food discovery should be accessible to everyone.",
              },
              {
                question: "How accurate is the restaurant information?",
                answer:
                  "We pull data from trusted sources and verify information regularly. However, we always recommend checking the restaurant's official channels for the most up-to-date details like hours and menu changes.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-[#0B1F3A] mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-700">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact info */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Still need help?
          </h2>
          <div className="bg-gray-50 p-8 rounded-2xl">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Mail className="w-8 h-8 text-[#F14C35] mx-auto mb-4" />
                <h3 className="font-semibold text-[#0B1F3A] mb-2">
                  Email Support
                </h3>
                <p className="text-gray-600 text-sm mb-3">Get help via email</p>
                <a
                  href="mailto:support@fuzo.app"
                  className="text-[#F14C35] hover:underline font-semibold"
                >
                  support@fuzo.app
                </a>
              </div>
              <div className="text-center">
                <MessageCircle className="w-8 h-8 text-[#F14C35] mx-auto mb-4" />
                <h3 className="font-semibold text-[#0B1F3A] mb-2">Live Chat</h3>
                <p className="text-gray-600 text-sm mb-3">Chat with our team</p>
                <span className="text-gray-500 text-sm">Coming soon</span>
              </div>
              <div className="text-center">
                <Mail className="w-8 h-8 text-[#F14C35] mx-auto mb-4" />
                <h3 className="font-semibold text-[#0B1F3A] mb-2">Feedback</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Share your thoughts
                </p>
                <a
                  href="mailto:feedback@fuzo.app"
                  className="text-[#F14C35] hover:underline font-semibold"
                >
                  feedback@fuzo.app
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
