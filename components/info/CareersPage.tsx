import { ArrowLeft, Clock, MapPin, Users } from "lucide-react";

export function CareersPage() {
  const handleBackToHome = () => {
    const event = new CustomEvent("navigateToPage", { detail: "landing" });
    window.dispatchEvent(event);
  };
  const jobOpenings = [
    {
      id: "community-moderator",
      title: "Community Moderator",
      type: "Remote",
      description:
        "Keep conversations food‑focused; enforce community guidelines.",
      requirements: [
        "Excellent written English; bonus for Hindi/Tamil/Spanish",
        "Empathy, judgment, and fast response times",
        "Experience with community tools or Trust & Safety",
      ],
      niceToHave: ["Hospitality, food writing, or map curation background"],
    },
    {
      id: "database-engineer",
      title: "Database Engineer / Data Expert",
      type: "Remote",
      description:
        "Own schema design for restaurants, recipes, posts and analytics.",
      requirements: [
        "Strong SQL/Postgres; Supabase experience",
        "Comfort with TypeScript/Node and cloud functions",
        "Practical experience processing large datasets (ETL)",
      ],
      niceToHave: ["Exposure to maps/geo, ranking, or recommendation systems"],
    },
    {
      id: "social-media-designer",
      title: "Social Media Designer",
      type: "Remote",
      description: "Turn daily picks into scroll‑stopping posts and stories.",
      requirements: [
        "Portfolio with clean typography and brand consistency",
        "Figma/After Effects or alternative motion tools",
        "Understanding of food aesthetics and accessibility (contrast/legibility)",
      ],
      niceToHave: ["Experience with component‑driven design systems"],
    },
    {
      id: "influencer-partnerships",
      title: "Influencer / Creator Partnerships",
      type: "Hybrid",
      description:
        "Identify culinary creators and restaurants to collaborate with.",
      requirements: [
        "Proven track record in creator marketing or partnerships",
        "Negotiation skills and clear communication",
        "Love for local scenes; ability to travel occasionally",
      ],
      niceToHave: [],
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
            Join Our Team
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            <em>Remote‑friendly. We value portfolios and shipped work.</em>
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Remote-first
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Flexible hours
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Small team
            </div>
          </div>
        </div>

        {/* Open positions */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Open Positions
          </h2>
          <div className="space-y-8">
            {jobOpenings.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-[#0B1F3A] mb-2">
                      {job.title}
                    </h3>
                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="w-4 h-4 mr-2" />
                      {job.type}
                    </div>
                    <p className="text-gray-700 text-lg">{job.description}</p>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <a
                      href={`mailto:careers@fuzo.app?subject=Application for ${job.title}`}
                      className="inline-block bg-[#F14C35] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#E03D2A] transition-colors"
                    >
                      Apply Now
                    </a>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold text-[#0B1F3A] mb-4">
                      Requirements
                    </h4>
                    <ul className="space-y-2">
                      {job.requirements.map((req, index) => (
                        <li key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-[#F14C35] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-700">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {job.niceToHave.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-[#0B1F3A] mb-4">
                        Nice to have
                      </h4>
                      <ul className="space-y-2">
                        {job.niceToHave.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How to apply */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            How to Apply
          </h2>
          <div className="bg-gradient-to-br from-[#F14C35]/5 to-[#FF8C3A]/5 p-8 rounded-2xl">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#F14C35] text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                  1
                </div>
                <h3 className="font-semibold text-[#0B1F3A] mb-2">
                  Send us your work
                </h3>
                <p className="text-gray-700 text-sm">
                  Email <strong>careers@fuzo.app</strong> with a short note,
                  links to work, and your location/timezone.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#F14C35] text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                  2
                </div>
                <h3 className="font-semibold text-[#0B1F3A] mb-2">
                  We&apos;ll review
                </h3>
                <p className="text-gray-700 text-sm">
                  Our team will review your application and portfolio within 1-2
                  weeks.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#F14C35] text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                  3
                </div>
                <h3 className="font-semibold text-[#0B1F3A] mb-2">
                  Let&apos;s chat
                </h3>
                <p className="text-gray-700 text-sm">
                  If we&apos;re a good fit, we&apos;ll schedule a casual conversation to
                  get to know each other.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why work with us */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#0B1F3A] mb-8">
            Why Work With Us
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Remote-first culture",
                description:
                  "Work from anywhere with flexible hours that fit your lifestyle.",
              },
              {
                title: "Impact-driven work",
                description:
                  "Help thousands of people discover amazing food experiences every day.",
              },
              {
                title: "Small team, big ideas",
                description:
                  "Your voice matters in a small, collaborative team environment.",
              },
              {
                title: "Food-focused mission",
                description:
                  "Work on something you can be passionate about—great food and experiences.",
              },
              {
                title: "Growth opportunities",
                description:
                  "Learn and grow with cutting-edge AI and food technology.",
              },
              {
                title: "Portfolio value",
                description:
                  "We value shipped work and real-world impact over traditional credentials.",
              },
            ].map((benefit, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-[#0B1F3A] mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-700 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-gradient-to-br from-[#F14C35] to-[#FF8C3A] text-white p-12 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4">Don&apos;t see the right role?</h2>
          <p className="text-xl mb-8 opacity-90">
            We&apos;re always looking for talented people who share our passion for
            great food.
          </p>
          <a
            href="mailto:careers@fuzo.app?subject=General Application"
            className="inline-block bg-white text-[#F14C35] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors"
          >
            Send Us Your Info
          </a>
        </section>
      </div>
    </div>
  );
}
