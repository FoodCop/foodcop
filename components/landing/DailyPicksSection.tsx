interface DailyPicksSectionProps {
  onNavigateToSignup?: () => void;
}

export function DailyPicksSection({
  onNavigateToSignup,
}: DailyPicksSectionProps) {
  const connoisseurs = [
    {
      emoji: "🔥",
      name: "Street Food",
      description: "Late-night legends & hawker icons.",
    },
    {
      emoji: "🍽️",
      name: "Fine Dining",
      description: "Tasting menus worth dressing up for.",
    },
    { emoji: "🍣", name: "Sushi", description: "Omakase and immaculate cuts." },
    {
      emoji: "🥐",
      name: "Pastry",
      description: "Flaky, buttery, photogenic joy.",
    },
    {
      emoji: "🌱",
      name: "Healthy",
      description: "Bowls, salads, smart swaps.",
    },
    {
      emoji: "🔥",
      name: "BBQ",
      description: "Smoke, char and slow-cooked bliss.",
    },
    {
      emoji: "🌿",
      name: "Vegan",
      description: "Bold flavors, zero compromise.",
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#0B1F3A] mb-6">
            Daily Picks from our AI connoisseurs
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Every day, our AI connoisseurs bring you one standout place in each
            style. Short, specific and actually helpful.
          </p>

          {/* Connoisseur avatars */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {connoisseurs.map((connoisseur, index) => (
              <div
                key={index}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition-transform duration-300"
                style={{
                  animation: `float 3s ease-in-out infinite ${index * 0.2}s`,
                }}
              >
                {connoisseur.emoji}
              </div>
            ))}
          </div>
        </div>

        {/* Today's Picks Grid */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-[#0B1F3A] mb-8 text-center">
            Today's seven picks
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connoisseurs.map((connoisseur, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#F14C35] to-[#FF6B6B] rounded-xl flex items-center justify-center text-2xl mr-4 group-hover:scale-110 transition-transform duration-300">
                    {connoisseur.emoji}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-[#0B1F3A]">
                      {connoisseur.name}
                    </h4>
                    <p className="text-sm text-gray-500">AI Connoisseur</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {connoisseur.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={onNavigateToSignup}
            className="group relative px-8 py-4 bg-[#F14C35] text-white rounded-xl font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            onMouseOver={(e) => {
              const target = e.currentTarget;
              target.style.transform = "scale(1.05)";
              target.style.boxShadow = "0 12px 32px rgba(241, 76, 53, 0.4)";
            }}
            onMouseOut={(e) => {
              const target = e.currentTarget;
              target.style.transform = "scale(1)";
              target.style.boxShadow = "0 8px 24px rgba(241, 76, 53, 0.3)";
            }}
          >
            See today's seven
            <div className="absolute inset-0 rounded-xl ring-2 ring-[#F14C35]/50 scale-0 group-hover:scale-100 transition-transform duration-300" />
          </button>
        </div>
      </div>

      <style jsx="true">{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </section>
  );
}
