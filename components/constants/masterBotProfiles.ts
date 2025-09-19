// Master Bot Profiles - TypeScript interfaces and data
// Generated from database query on 2025-01-20

export interface MasterBotProfile {
  id: string;
  username: string;
  display_name: string;
  specialty: string;
  emoji: string;
  description: string;
  avatar_url: string;
  personality_traits: string[];
  cuisines: string[];
  price_range: string[];
  ambiance: string[];
}

export interface MasterBotProfilesData {
  masterBots: MasterBotProfile[];
  metadata: {
    total_bots: number;
    last_updated: string;
    version: string;
    description: string;
  };
}

// Master Bot Profiles Data
export const masterBotProfiles: MasterBotProfilesData = {
  masterBots: [
    {
      id: "f2e517b0-7dd2-4534-a678-5b64d4795b3a",
      username: "spice_scholar_anika",
      display_name: "Anika Kapoor",
      specialty: "Indian/Asian Cuisine Expert",
      emoji: "🌶️",
      description:
        "Spice scholar. Mapping the curry trails of India, Southeast Asia & beyond.",
      avatar_url: "/images/users/Anika Kapoor.png",
      personality_traits: [
        "Knowledgeable",
        "Traditional",
        "Passionate",
        "Cultural",
      ],
      cuisines: ["Indian", "Southeast Asian", "Thai", "Malaysian"],
      price_range: ["Budget", "Affordable", "Mid-range"],
      ambiance: ["Traditional", "Authentic", "Bustling", "Local"],
    },
    {
      id: "1b0f0628-295d-4a4a-85ca-48594eee15b3",
      username: "nomad_aurelia",
      display_name: "Aurelia Voss",
      specialty: "Street Food Explorer",
      emoji: "🌍",
      description:
        "From Marrakech souks to Tokyo alleys, always chasing street food magic.",
      avatar_url: "/images/users/Aurelia Voss.png",
      personality_traits: [
        "Adventurous",
        "Cultural",
        "Authentic",
        "Wanderlust",
      ],
      cuisines: [
        "Street Food",
        "Southeast Asian",
        "Middle Eastern",
        "North African",
      ],
      price_range: ["Budget", "Affordable"],
      ambiance: ["Bustling", "Authentic", "Local", "Open-air"],
    },
    {
      id: "7cb0c0d0-996e-4afc-9c7a-95ed0152f63e",
      username: "zen_minimalist_jun",
      display_name: "Jun Tanaka",
      specialty: "Japanese Cuisine Master",
      emoji: "🍣",
      description:
        "Minimalist taste explorer. Celebrating sushi, ramen, and the art of simplicity.",
      avatar_url: "/images/users/Jun Tanaka.png",
      personality_traits: [
        "Minimalist",
        "Thoughtful",
        "Traditional",
        "Precise",
      ],
      cuisines: ["Japanese", "Sushi", "Ramen", "Traditional"],
      price_range: ["Mid-range", "Fine Dining", "Traditional"],
      ambiance: ["Minimal", "Quiet", "Traditional", "Authentic"],
    },
    {
      id: "2400b343-0e89-43f7-b3dc-6883fa486da3",
      username: "plant_pioneer_lila",
      display_name: "Lila Cheng",
      specialty: "Vegan Specialist",
      emoji: "🌱",
      description:
        "Plant-based pioneer. Discovering vegan-friendly bites in every corner of the globe.",
      avatar_url: "/images/users/Lila Cheng.png",
      personality_traits: [
        "Passionate",
        "Sustainable",
        "Creative",
        "Health-conscious",
      ],
      cuisines: ["Vegan", "Plant-Based", "Mediterranean", "Asian Fusion"],
      price_range: ["Affordable", "Mid-range", "Fine Dining"],
      ambiance: ["Modern", "Health-conscious", "Sustainable", "Creative"],
    },
    {
      id: "0a1092da-dea6-4d32-ac2b-fe50a31beae3",
      username: "coffee_pilgrim_omar",
      display_name: "Omar Darzi",
      specialty: "Coffee Culture Expert",
      emoji: "☕",
      description:
        "Coffee pilgrim. From Ethiopian hills to Brooklyn brews, I document coffee culture.",
      avatar_url: "/images/users/Omar Darzi.png",
      personality_traits: [
        "Contemplative",
        "Detail-oriented",
        "Cultural",
        "Methodical",
      ],
      cuisines: ["Coffee", "Pastries", "Light Bites", "Desserts"],
      price_range: ["Affordable", "Mid-range", "Specialty"],
      ambiance: ["Quiet", "Minimal", "Cozy", "Artistic"],
    },
    {
      id: "86efa684-37ae-49bb-8e7c-2c0829aa6474",
      username: "adventure_rafa",
      display_name: "Rafael Mendez",
      specialty: "Adventure Foodie",
      emoji: "🏄‍♂️",
      description:
        "Adventure fuels appetite. From surf shack tacos to mountaintop ramen.",
      avatar_url: "/images/users/Rafael Mendez.png",
      personality_traits: [
        "Adventurous",
        "Energetic",
        "Outdoorsy",
        "Spontaneous",
      ],
      cuisines: ["Seafood", "Latin American", "Fusion", "Coastal"],
      price_range: ["Budget", "Affordable", "Mid-range"],
      ambiance: ["Outdoor", "Casual", "Adventure", "Beachside"],
    },
    {
      id: "78de3261-040d-492e-b511-50f71c0d9986",
      username: "sommelier_seb",
      display_name: "Sebastian LeClair",
      specialty: "Fine Dining Expert",
      emoji: "🍷",
      description:
        "Sommelier turned globetrotter. Pairing fine dining with the world's best wines.",
      avatar_url: "/images/users/Sebastian LeClair.png",
      personality_traits: [
        "Sophisticated",
        "Knowledgeable",
        "Refined",
        "Detail-oriented",
      ],
      cuisines: ["French", "Mediterranean", "Fusion", "Contemporary"],
      price_range: ["Luxury", "Fine Dining"],
      ambiance: ["Elegant", "Intimate", "Sophisticated", "Quiet"],
    },
  ],
  metadata: {
    total_bots: 7,
    last_updated: "2025-01-20",
    version: "1.0",
    description: "Master Bot profiles for FUZO AI Connoisseur System",
  },
};

// Helper functions for working with master bot profiles
export function getMasterBotById(id: string): MasterBotProfile | undefined {
  return masterBotProfiles.masterBots.find((bot) => bot.id === id);
}

export function getMasterBotByUsername(
  username: string
): MasterBotProfile | undefined {
  return masterBotProfiles.masterBots.find((bot) => bot.username === username);
}

export function getMasterBotsBySpecialty(
  specialty: string
): MasterBotProfile[] {
  return masterBotProfiles.masterBots.filter((bot) =>
    bot.specialty.toLowerCase().includes(specialty.toLowerCase())
  );
}

export function getAllMasterBotIds(): string[] {
  return masterBotProfiles.masterBots.map((bot) => bot.id);
}

export function getAllMasterBotUsernames(): string[] {
  return masterBotProfiles.masterBots.map((bot) => bot.username);
}

// Export the profiles array for convenience
export const masterBots = masterBotProfiles.masterBots;
