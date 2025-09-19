import { useMasterBots } from "../hooks/useMasterBots";
import { MasterBot } from "../services/masterBotService";

interface DailyPicksSectionProps {
  onNavigateToSignup?: () => void;
}

export function DailyPicksSection({
  onNavigateToSignup,
}: DailyPicksSectionProps) {
  const { masterBots, loading, error } = useMasterBots();

  // Convert Master Bot data to connoisseur format
  const connoisseurs = masterBots.slice(0, 7).map((bot) => {
    const specialty = getBotSpecialty(bot);
    return {
      emoji: getEmojiForSpecialty(specialty),
      name: specialty,
      description: bot.bio || "Culinary expertise",
      bot: bot,
    };
  });

  // Fallback connoisseurs if no Master Bots are loaded
  const fallbackConnoisseurs = [
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

  const displayConnoisseurs =
    connoisseurs.length > 0 ? connoisseurs : fallbackConnoisseurs;

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#0B1F3A] mb-6">
            Daily Picks from our AI connoisseurs
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Our 7 AI connoisseurs curate personalized food recommendations based
            on your taste preferences and dining history.
          </p>
        </div>

        {/* Connoisseurs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {displayConnoisseurs.map((connoisseur, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-4xl mb-4">{connoisseur.emoji}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {connoisseur.name}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {connoisseur.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <button
            onClick={onNavigateToSignup}
            className="bg-[#0B1F3A] text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#1a2f4a] transition-colors duration-300 shadow-lg hover:shadow-xl"
          >
            Start Your Food Journey
          </button>
          <p className="text-gray-500 text-sm mt-4">
            Join thousands discovering amazing food daily
          </p>
        </div>
      </div>
    </section>
  );
}

// Get bot specialty based on username or display name
function getBotSpecialty(bot: MasterBot): string {
  const username = bot.username.toLowerCase();
  const displayName = bot.display_name.toLowerCase();

  if (username.includes("nomad") || username.includes("aurelia")) {
    return "Street Food Explorer";
  } else if (username.includes("sommelier") || username.includes("sebastian")) {
    return "Fine Dining Expert";
  } else if (username.includes("plant") || username.includes("lila")) {
    return "Vegan Specialist";
  } else if (username.includes("adventure") || username.includes("rafa")) {
    return "Adventure Foodie";
  } else if (username.includes("spice") || username.includes("anika")) {
    return "Indian/Asian Cuisine Expert";
  } else if (username.includes("coffee") || username.includes("omar")) {
    return "Coffee Culture Expert";
  } else if (username.includes("zen") || username.includes("jun")) {
    return "Japanese Cuisine Master";
  }

  return "Food Expert";
}

// Helper function to get emoji based on specialty
function getEmojiForSpecialty(specialty: string): string {
  const specialtyMap: { [key: string]: string } = {
    "Japanese Cuisine Master": "🍣",
    "Italian Food Expert": "🍝",
    "Street Food Specialist": "🔥",
    "Fine Dining Connoisseur": "🍽️",
    "Pastry Chef": "🥐",
    "Healthy Food Advocate": "🌱",
    "BBQ Master": "🔥",
    "Vegan Specialist": "🌿",
    "Sushi Expert": "🍣",
    "Pizza Master": "🍕",
    "Ramen Specialist": "🍜",
    "Dessert Expert": "🍰",
    "Coffee Connoisseur": "☕",
    "Wine Expert": "🍷",
    "Cocktail Master": "🍸",
    "Seafood Specialist": "🦐",
    "Steak Expert": "🥩",
    "Vegetarian Chef": "🥗",
    "Mexican Food Expert": "🌮",
    "Chinese Cuisine Master": "🥢",
    "Indian Food Specialist": "🍛",
    "Thai Food Expert": "🌶️",
    "French Cuisine Master": "🥖",
    "Mediterranean Specialist": "🫒",
    "Korean Food Expert": "🥘",
    "Middle Eastern Cuisine": "🥙",
    "American BBQ": "🍖",
    "Bakery Specialist": "🥖",
    "Ice Cream Expert": "🍦",
  };

  return specialtyMap[specialty] || "🍽️";
}
