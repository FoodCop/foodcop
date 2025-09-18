import { ArrowLeft } from "lucide-react";

export function AboutUsPage() {
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
        {/* Hero section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#0B1F3A] mb-6">
            About FUZO
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're on a mission to help people eat well—anywhere—by turning a
            world of options into a short list of excellent choices.
          </p>
        </div>

        {/* FUZO at a glance */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            FUZO at a glance
          </h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              FUZO is a food‑discovery platform powered by AI connoisseurs—seven
              culinary specialists that surface remarkable places to eat and
              recipes to try. We blend trusted data (maps, menus, ratings) with
              tasteful editorial guidance so people find better meals, faster.
            </p>
          </div>

          <div className="mt-8">
            <h3 className="text-2xl font-semibold text-[#0B1F3A] mb-6">
              What makes FUZO different
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <h4 className="font-semibold text-[#F14C35] mb-3">
                  AI connoisseurs, not generic lists
                </h4>
                <p className="text-gray-700">
                  Each connoisseur has a specialty—Street Food, Fine Dining,
                  Sushi, Pastry, Healthy, BBQ, Vegan—so picks feel precise and
                  personal.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl">
                <h4 className="font-semibold text-[#F14C35] mb-3">
                  Real‑world usefulness
                </h4>
                <p className="text-gray-700">
                  Every recommendation includes a concrete tip (what to order,
                  when to go, cost cues, map link).
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl">
                <h4 className="font-semibold text-[#F14C35] mb-3">
                  Your living food map
                </h4>
                <p className="text-gray-700">
                  Save places you love or want to try; build shareable lists and
                  revisit them later.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl">
                <h4 className="font-semibold text-[#F14C35] mb-3">
                  Food‑only chat
                </h4>
                <p className="text-gray-700">
                  Our guide, <strong>Tako</strong>, speaks strictly food and
                  steers off‑topic queries elsewhere.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="mb-16">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-[#F14C35]/5 to-[#FF8C3A]/5 p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-[#0B1F3A] mb-4">
                Mission
              </h3>
              <p className="text-gray-700 text-lg">
                Help people eat well—anywhere—by turning a world of options into
                a short list of excellent choices.
              </p>
            </div>
            <div className="bg-gradient-to-br from-[#FF8C3A]/5 to-[#FFD74A]/5 p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-[#0B1F3A] mb-4">Vision</h3>
              <p className="text-gray-700 text-lg">
                A trusted, global food graph where great meals are easy to
                discover, plan and share.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "Taste > hype",
              "Helpfulness over noise",
              "Respect for people & places",
              "Transparency and attribution",
              "Accessibility by default",
            ].map((value, index) => (
              <div
                key={index}
                className="flex items-center p-4 bg-white border border-gray-200 rounded-xl"
              >
                <div className="w-2 h-2 bg-[#F14C35] rounded-full mr-4"></div>
                <span className="text-gray-700 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Our story */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">Our story</h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              We started FUZO after too many so‑so meals and too much scrolling.
              We believed discovery could be smarter: specialty AIs that know a
              scene deeply, paired with clean, human guidance. Today FUZO
              curates thousands of restaurants across major cities and grows
              daily.
            </p>
          </div>
        </section>

        {/* How FUZO works */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            How FUZO works (simple)
          </h2>
          <div className="space-y-6">
            {[
              {
                step: "1",
                title: "AI Analysis",
                description:
                  "Our AI connoisseurs parse public data and quality signals to shortlist standouts in their domain.",
              },
              {
                step: "2",
                title: "Quality Check",
                description:
                  "Each pick is sanity‑checked for basics (hours, map pin, price cues).",
              },
              {
                step: "3",
                title: "Smart Presentation",
                description:
                  "Tako turns shortlists into readable cards you can save, share, and navigate to.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 p-6 bg-gray-50 rounded-xl"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-[#F14C35] text-white rounded-full flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#0B1F3A] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-700">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* The team */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">The team</h2>
          <div className="bg-gradient-to-r from-[#F14C35]/10 to-[#FF8C3A]/10 p-8 rounded-2xl">
            <p className="text-gray-700 text-lg leading-relaxed">
              We're engineers, designers and food nerds. We move quickly,
              attribute sources, and continuously improve.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-gradient-to-br from-[#F14C35] to-[#FF8C3A] text-white p-12 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4">
            Ready to discover your next great meal?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of food lovers who trust FUZO for their daily picks.
          </p>
          <button
            onClick={() => {
              const event = new CustomEvent("navigateToPage", {
                detail: "onboarding",
              });
              window.dispatchEvent(event);
            }}
            className="inline-block bg-white text-[#F14C35] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors"
          >
            Get Started
          </button>
        </section>
      </div>
    </div>
  );
}
