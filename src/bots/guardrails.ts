// Enhanced guardrails with moderation and localization
export interface UserProfile {
  country?: string;
  language?: string;
  dietary_restrictions?: string[];
}

export interface ModerationResult {
  isSafe: boolean;
  reason?: string;
  suggestedAction?: "block" | "deflect" | "allow";
}

// Enhanced moderation check
export function moderateContent(text: string): ModerationResult {
  const UNSAFE_PATTERNS = [
    // Violence and harm
    {
      pattern: /violence|harm|hurt|kill|murder|assault/i,
      reason: "Violent content",
    },
    {
      pattern: /weapon|gun|knife|bomb|explosive/i,
      reason: "Weapon-related content",
    },

    // Hate speech and discrimination
    {
      pattern: /hate|racist|discrimination|slur|offensive/i,
      reason: "Hate speech",
    },
    { pattern: /nazi|fascist|supremacist/i, reason: "Extremist content" },

    // Sexual content
    { pattern: /sexual|explicit|nsfw|porn|adult/i, reason: "Sexual content" },

    // Drugs and illegal substances
    {
      pattern: /cocaine|heroin|meth|drugs|substance abuse/i,
      reason: "Drug-related content",
    },

    // Self-harm and suicide
    {
      pattern: /suicide|self.harm|cutting|overdose/i,
      reason: "Self-harm content",
    },

    // Terrorism and threats
    {
      pattern: /terrorist|bomb|attack|threat|kill.*you/i,
      reason: "Threatening content",
    },

    // Spam and scams
    {
      pattern: /click here|free money|win.*prize|urgent.*action/i,
      reason: "Suspicious content",
    },
  ];

  for (const { pattern, reason } of UNSAFE_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isSafe: false,
        reason,
        suggestedAction: "block",
      };
    }
  }

  return { isSafe: true, suggestedAction: "allow" };
}

// Enhanced topic classification
export function classifyTopic(text: string): "food" | "non_food" | "unsafe" {
  const moderation = moderateContent(text);
  if (!moderation.isSafe) return "unsafe";

  const FOOD_KEYWORDS = [
    // General food terms
    "restaurant",
    "eat",
    "dish",
    "menu",
    "food",
    "meal",
    "breakfast",
    "lunch",
    "dinner",
    "snack",
    "appetizer",
    "main course",
    "side dish",
    "beverage",
    "drink",

    // Cuisines and types
    "street food",
    "hawker",
    "cafe",
    "bakery",
    "patisserie",
    "sushi",
    "omakase",
    "bbq",
    "grill",
    "vegan",
    "vegetarian",
    "halal",
    "kosher",
    "dessert",
    "pastry",
    "croissant",
    "taco",
    "biryani",
    "dosa",
    "chaat",
    "ramen",
    "pho",
    "kebab",
    "shawarma",
    "steak",
    "pizza",
    "pasta",
    "burger",
    "salad",
    "bowl",

    // Cooking and preparation
    "recipe",
    "cooking",
    "chef",
    "cuisine",
    "flavor",
    "taste",
    "delicious",
    "yummy",
    "spicy",
    "sweet",
    "sour",
    "bitter",
    "salty",
    "umami",
    "aroma",
    "fragrant",

    // Ingredients and nutrition
    "ingredient",
    "spice",
    "herb",
    "seasoning",
    "nutrition",
    "calories",
    "protein",
    "carb",
    "fat",
    "vitamin",
    "mineral",
    "gluten",
    "dairy",
    "allergy",

    // Food experiences
    "dining",
    "feast",
    "banquet",
    "buffet",
    "catering",
    "delivery",
    "takeout",
    "food truck",
    "market",
    "grocery",
    "fresh",
    "organic",
    "local",
    "farm",
  ];

  const NON_FOOD_KEYWORDS = [
    // Weather and time
    "weather",
    "rain",
    "snow",
    "sunny",
    "cloudy",
    "temperature",
    "forecast",
    "time",
    "clock",
    "schedule",
    "appointment",
    "meeting",

    // News and politics
    "news",
    "politics",
    "election",
    "government",
    "policy",
    "law",
    "court",
    "president",
    "minister",
    "parliament",
    "congress",

    // Finance and business
    "stock",
    "market",
    "investment",
    "trading",
    "bitcoin",
    "crypto",
    "currency",
    "bank",
    "loan",
    "credit",
    "debt",
    "business",
    "company",
    "work",
    "job",

    // Sports and entertainment
    "match",
    "game",
    "football",
    "cricket",
    "basketball",
    "soccer",
    "tennis",
    "movie",
    "film",
    "music",
    "concert",
    "show",
    "theater",
    "book",
    "novel",

    // Technology and education
    "code",
    "programming",
    "software",
    "computer",
    "phone",
    "internet",
    "website",
    "homework",
    "study",
    "school",
    "university",
    "math",
    "physics",
    "chemistry",
    "science",
    "research",
    "project",
    "assignment",

    // Health and medical
    "medicine",
    "doctor",
    "hospital",
    "clinic",
    "diagnosis",
    "treatment",
    "covid",
    "flu",
    "cold",
    "fever",
    "symptoms",
    "pain",
    "injury",
    "surgery",
    "therapy",

    // Travel and lifestyle
    "travel",
    "trip",
    "vacation",
    "flight",
    "hotel",
    "visa",
    "passport",
    "ticket",
    "workout",
    "exercise",
    "gym",
    "fitness",
    "yoga",
    "running",
    "swimming",

    // Personal and relationships
    "family",
    "friend",
    "relationship",
    "dating",
    "marriage",
    "wedding",
    "birthday",
    "party",
    "celebration",
    "gift",
    "present",
    "shopping",
    "fashion",
    "clothes",
  ];

  const s = (text || "").toLowerCase();
  const foodHit = FOOD_KEYWORDS.some((k) => s.includes(k));
  const nonFoodHit = NON_FOOD_KEYWORDS.some((k) => s.includes(k));

  // Special cases that should be treated as food
  if (
    s.includes("recommend") ||
    s.includes("hungry") ||
    s.includes("thirsty")
  ) {
    return "food";
  }

  if (s.includes("best") && (s.includes("place") || s.includes("restaurant"))) {
    return "food";
  }

  if (nonFoodHit && !foodHit) return "non_food";
  if (foodHit) return "food";
  if (s.trim().length < 3) return "non_food";

  return "non_food";
}

// Localized deflection responses
export function deflectAndPivot(
  botDisplay: string,
  specialty: string[],
  userText: string,
  userProfile?: UserProfile
): string {
  const country = userProfile?.country || "default";

  const NON_FOOD_HINTS: Record<string, Record<string, string>> = {
    weather: {
      IN: "For weather updates, try weather.gov.in or mausam.imd.gov.in",
      US: "For weather updates, try weather.gov or weather.com",
      UK: "For weather updates, try metoffice.gov.uk",
      CA: "For weather updates, try weather.gc.ca",
      AU: "For weather updates, try bom.gov.au",
      default: "For weather updates, try weather.com",
    },
    time: {
      default: "For local time, check time.is or worldclock.com",
    },
    news: {
      IN: "For news, try thehindu.com, indianexpress.com, or timesofindia.com",
      US: "For news, try reuters.com, cnn.com, or nytimes.com",
      UK: "For news, try bbc.com or theguardian.com",
      CA: "For news, try cbc.ca or theglobeandmail.com",
      AU: "For news, try abc.net.au or smh.com.au",
      default: "For news, try reuters.com or bbc.com",
    },
    sports: {
      IN: "For cricket scores, try espncricinfo.com or cricbuzz.com",
      US: "For scores, try espn.com or nfl.com",
      UK: "For football scores, try bbc.com/sport or skysports.com",
      default: "For scores, try espn.com or bbc.com/sport",
    },
    finance: {
      IN: "For Indian markets, try moneycontrol.com or economictimes.com",
      US: "For US markets, try finance.yahoo.com or bloomberg.com",
      UK: "For UK markets, try ft.com or bloomberg.com",
      default: "For markets, try finance.yahoo.com or bloomberg.com",
    },
    coding: {
      default:
        "For coding help, try Stack Overflow, GitHub, or freecodecamp.org",
    },
    homework: {
      default: "For study help, try Khan Academy, Coursera, or edX",
    },
    travel: {
      default: "For travel info, try Google Maps, TripAdvisor, or booking.com",
    },
    health: {
      default:
        "I can't provide medical advice. Please consult a healthcare professional.",
    },
    work: {
      default: "For work-related questions, try LinkedIn or your HR department",
    },
  };

  const s = (userText || "").toLowerCase();
  let deflect = "I'm here for food talk!";

  // Find the most specific match
  for (const [category, countryMap] of Object.entries(NON_FOOD_HINTS)) {
    if (s.includes(category)) {
      deflect = countryMap[country] || countryMap.default;
      break;
    }
  }

  // Add food pivot based on bot specialty
  const spec = (specialty?.[0] ?? "good eats").replace(/\_/g, " ");
  const foodPivots = [
    `Meanwhile, how about a ${spec} recommendation?`,
    `Instead, let me suggest some amazing ${spec} options!`,
    `I'd love to help you find great ${spec} instead!`,
    `How about we talk about ${spec}? I have some great tips!`,
  ];

  const randomPivot = foodPivots[Math.floor(Math.random() * foodPivots.length)];

  return `${deflect} ${randomPivot}`;
}

// Quick reply suggestions for deflections
export function getQuickReplies(botSpecialty: string[]): string[] {
  const specialty = botSpecialty[0]?.toLowerCase() || "food";

  const quickReplies = {
    "street food": [
      "Best street food near me",
      "Hidden street food gems",
      "Street food under ₹200",
    ],
    "fine dining": [
      "Romantic dinner spots",
      "Michelin restaurants",
      "Wine pairing suggestions",
    ],
    vegan: [
      "Vegan restaurants nearby",
      "Plant-based options",
      "Vegan dessert places",
    ],
    coffee: [
      "Best coffee shops",
      "Specialty coffee near me",
      "Coffee and pastry spots",
    ],
    japanese: [
      "Authentic sushi places",
      "Ramen recommendations",
      "Japanese izakaya spots",
    ],
    indian: [
      "Best biryani near me",
      "Authentic Indian restaurants",
      "Spicy food recommendations",
    ],
    adventure: [
      "Unique dining experiences",
      "Adventure food spots",
      "Outdoor dining options",
    ],
  };

  return (
    quickReplies[specialty] || [
      "Restaurant recommendations",
      "Best food near me",
      "Hidden gem restaurants",
    ]
  );
}

// Enhanced bot response generation
export function generateBotResponse(
  botId: string,
  userMessage: string,
  context?: {
    userProfile?: UserProfile;
    botSpecialty?: string[];
    conversationHistory?: string[];
  }
): {
  shouldRespond: boolean;
  response?: string;
  quickReplies?: string[];
  reason?: string;
} {
  // Check moderation first
  const moderation = moderateContent(userMessage);
  if (!moderation.isSafe) {
    return {
      shouldRespond: false,
      reason: `Content blocked: ${moderation.reason}`,
    };
  }

  // Classify topic
  const topic = classifyTopic(userMessage);

  if (topic === "unsafe") {
    return {
      shouldRespond: true,
      response: "I can't help with that. Let's talk about food instead!",
      quickReplies: getQuickReplies(context?.botSpecialty || []),
    };
  }

  if (topic === "non_food") {
    const deflection = deflectAndPivot(
      `Bot ${botId}`,
      context?.botSpecialty || [],
      userMessage,
      context?.userProfile
    );

    return {
      shouldRespond: true,
      response: deflection,
      quickReplies: getQuickReplies(context?.botSpecialty || []),
    };
  }

  // Food topic - let AI handle it
  return {
    shouldRespond: true,
    quickReplies: getQuickReplies(context?.botSpecialty || []),
  };
}
