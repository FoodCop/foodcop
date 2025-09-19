import fs, { createWriteStream } from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Master Bot configurations
const masterBots = [
  {
    id: "f2e517b0-7dd2-4534-a678-5b64d4795b3a",
    username: "spice_scholar_anika",
    display_name: "Anika Kapoor",
    specialty: "Indian/Asian Cuisine Expert",
    emoji: "🌶️",
    personality: "Knowledgeable, Traditional, Passionate, Cultural",
    contentStyle: "spice_stories",
  },
  {
    id: "78de3261-040d-492e-b511-50f71c0d9986",
    username: "sommelier_seb",
    display_name: "Sebastian LeClair",
    specialty: "Fine Dining Expert",
    emoji: "🍷",
    personality: "Sophisticated, Knowledgeable, Refined, Detail-oriented",
    contentStyle: "fine_dining",
  },
  {
    id: "2400b343-0e89-43f7-b3dc-6883fa486da3",
    username: "plant_pioneer_lila",
    display_name: "Lila Cheng",
    specialty: "Vegan Specialist",
    emoji: "🌱",
    personality: "Passionate, Sustainable, Creative, Health-conscious",
    contentStyle: "plant_based",
  },
  {
    id: "7cb0c0d0-996e-4afc-9c7a-95ed0152f63e",
    username: "zen_minimalist_jun",
    display_name: "Jun Tanaka",
    specialty: "Japanese Cuisine Master",
    emoji: "🍣",
    personality: "Minimalist, Thoughtful, Traditional, Precise",
    contentStyle: "zen_philosophy",
  },
  {
    id: "0a1092da-dea6-4d32-ac2b-fe50a31beae3",
    username: "coffee_pilgrim_omar",
    display_name: "Omar Darzi",
    specialty: "Coffee Culture Expert",
    emoji: "☕",
    personality: "Contemplative, Detail-oriented, Cultural, Methodical",
    contentStyle: "coffee_culture",
  },
  {
    id: "86efa684-37ae-49bb-8e7c-2c0829aa6474",
    username: "adventure_rafa",
    display_name: "Rafael Mendez",
    specialty: "Adventure Foodie",
    emoji: "🏄‍♂️",
    personality: "Adventurous, Energetic, Outdoorsy, Spontaneous",
    contentStyle: "adventure_stories",
  },
  {
    id: "1b0f0628-295d-4a4a-85ca-48594eee15b3",
    username: "nomad_aurelia",
    display_name: "Aurelia Voss",
    specialty: "Street Food Explorer",
    emoji: "🌍",
    personality: "Adventurous, Cultural, Authentic, Wanderlust",
    contentStyle: "street_food",
  },
];

// Content templates for each bot style
const contentTemplates = {
  spice_stories: {
    reviews: [
      "The {spice} in this {dish} transports me straight to {region}. Every bite tells a story of {culture}.",
      "Found this hidden gem serving {cuisine} that's been passed down for generations. The {spice} blend is {adjective}.",
      "This {dish} reminds me why I fell in love with {cuisine}. The {spice} notes are {adjective} and {adjective}.",
      "The {spice} trail led me here, and I'm not disappointed. This {dish} is {adjective} and {adjective}.",
      "Every {spice} in this {dish} has a purpose. The {cuisine} tradition is alive and well here.",
    ],
    stories: [
      "The {spice} vendor in {location} shared the secret to perfect {dish}. It's all about {technique}.",
      "I learned about {spice} from a {age} grandmother in {region}. Her {dish} recipe is {adjective}.",
      "The {spice} market in {location} is a {adjective} experience. Every {spice} tells a story.",
      "This {cuisine} restaurant has been using the same {spice} blend for {years} years. The {dish} is {adjective}.",
      "The {spice} ceremony here is {adjective}. It's a {cuisine} tradition that's {adjective}.",
    ],
    tips: [
      "Pro tip: The key to perfect {dish} is {technique}. The {spice} should be {adjective}.",
      "Want to master {cuisine}? Start with {spice}. It's the foundation of {dish}.",
      "The {spice} ratio in {dish} is {adjective}. Too much and it's {adjective}, too little and it's {adjective}.",
      "I always {technique} when making {dish}. The {spice} needs to be {adjective}.",
      "The {spice} should be {adjective} before adding to {dish}. It makes all the difference.",
    ],
  },
  fine_dining: {
    reviews: [
      "The {wine} pairing with this {dish} is {adjective}. The {cuisine} technique is {adjective}.",
      "This {restaurant} showcases {cuisine} at its finest. The {dish} is {adjective} and {adjective}.",
      "The {chef} has created something {adjective} here. The {dish} is a {adjective} experience.",
      "Every element on this plate has a purpose. The {cuisine} philosophy is {adjective}.",
      "The {wine} selection here is {adjective}. Perfect for this {cuisine} experience.",
    ],
    stories: [
      "The {chef} shared the story behind this {dish}. It's inspired by {inspiration}.",
      "This {restaurant} has been perfecting {cuisine} for {years} years. The {dish} is {adjective}.",
      "The {wine} cellar here is {adjective}. Every bottle tells a story of {region}.",
      "The {cuisine} tradition here is {adjective}. The {dish} is a {adjective} example.",
      "I learned about {technique} from the {chef}. It's the secret to perfect {dish}.",
    ],
    tips: [
      "Pro tip: The {wine} should be {temperature} when pairing with {dish}.",
      "Want to appreciate {cuisine}? Focus on the {technique}. It's {adjective}.",
      "The {dish} should be {adjective} before serving. The {cuisine} standard is {adjective}.",
      "I always {technique} when preparing {dish}. The {cuisine} method is {adjective}.",
      "The {wine} notes should {verb} with the {dish}. It's a {cuisine} art.",
    ],
  },
  plant_based: {
    reviews: [
      "This {dish} proves that {cuisine} can be {adjective} and {adjective}. The {ingredient} is {adjective}.",
      "Found this {cuisine} gem that's {adjective} and {adjective}. The {ingredient} is {adjective}.",
      "The {ingredient} in this {dish} is {adjective}. It's a {cuisine} revelation.",
      "This {restaurant} shows that {cuisine} can be {adjective}. The {dish} is {adjective}.",
      "The {ingredient} combination here is {adjective}. It's {cuisine} at its finest.",
    ],
    stories: [
      "The {ingredient} farmer shared the story of this {dish}. It's {adjective} and {adjective}.",
      "I learned about {ingredient} from a {cuisine} expert. The {dish} is {adjective}.",
      "This {restaurant} sources {ingredient} from {region}. The {dish} is {adjective}.",
      "The {cuisine} tradition here is {adjective}. The {ingredient} is {adjective}.",
      "I discovered {ingredient} in {location}. It's the secret to perfect {dish}.",
    ],
    tips: [
      "Pro tip: The {ingredient} should be {adjective} for perfect {dish}.",
      "Want to master {cuisine}? Start with {ingredient}. It's {adjective}.",
      "The {ingredient} ratio in {dish} is {adjective}. Too much and it's {adjective}.",
      "I always {technique} when preparing {dish}. The {ingredient} needs to be {adjective}.",
      "The {ingredient} should be {adjective} before adding to {dish}. It's {cuisine} magic.",
    ],
  },
  zen_philosophy: {
    reviews: [
      "The {technique} in this {dish} is {adjective}. Every element is {adjective}.",
      "This {cuisine} experience is {adjective}. The {dish} is {adjective} and {adjective}.",
      "The {ingredient} quality here is {adjective}. It's {cuisine} perfection.",
      "This {restaurant} embodies {cuisine} philosophy. The {dish} is {adjective}.",
      "The {technique} here is {adjective}. It's a {cuisine} masterpiece.",
    ],
    stories: [
      "The {chef} shared the {cuisine} philosophy behind this {dish}. It's {adjective}.",
      "I learned about {technique} from a {cuisine} master. The {dish} is {adjective}.",
      "This {restaurant} has been perfecting {cuisine} for {years} years. The {dish} is {adjective}.",
      "The {cuisine} tradition here is {adjective}. The {technique} is {adjective}.",
      "I discovered {technique} in {location}. It's the essence of {cuisine}.",
    ],
    tips: [
      "Pro tip: The {technique} should be {adjective} for perfect {dish}.",
      "Want to master {cuisine}? Focus on {technique}. It's {adjective}.",
      "The {ingredient} should be {adjective} before {technique}. It's {cuisine} wisdom.",
      "I always {technique} when preparing {dish}. The {cuisine} way is {adjective}.",
      "The {technique} here is {adjective}. It's {cuisine} at its purest.",
    ],
  },
  coffee_culture: {
    reviews: [
      "The {coffee} here is {adjective}. The {method} brings out {flavor} notes.",
      "This {cafe} showcases {coffee} culture at its finest. The {method} is {adjective}.",
      "The {coffee} beans here are {adjective}. The {method} is {adjective}.",
      "This {cafe} has been perfecting {coffee} for {years} years. The {method} is {adjective}.",
      "The {coffee} selection here is {adjective}. Every {method} tells a story.",
    ],
    stories: [
      "The {barista} shared the story of this {coffee}. It's from {region} and {adjective}.",
      "I learned about {method} from a {coffee} expert. The {flavor} is {adjective}.",
      "This {cafe} sources {coffee} from {region}. The {method} is {adjective}.",
      "The {coffee} tradition here is {adjective}. The {method} is {adjective}.",
      "I discovered {coffee} in {location}. It's the perfect {method} for {flavor}.",
    ],
    tips: [
      "Pro tip: The {method} should be {adjective} for perfect {coffee}.",
      "Want to master {coffee}? Start with {method}. It's {adjective}.",
      "The {coffee} should be {adjective} before {method}. It's {adjective}.",
      "I always {method} when preparing {coffee}. The {flavor} is {adjective}.",
      "The {method} here is {adjective}. It's {coffee} perfection.",
    ],
  },
  adventure_stories: {
    reviews: [
      "This {dish} is {adjective} and {adjective}. Perfect for {activity} in {location}.",
      "Found this {cuisine} gem while {activity}. The {dish} is {adjective}.",
      "The {ingredient} here is {adjective}. It's {cuisine} adventure at its finest.",
      "This {restaurant} is {adjective} for {activity}. The {dish} is {adjective}.",
      "The {cuisine} here is {adjective}. It's a {activity} essential.",
    ],
    stories: [
      "I discovered this {dish} while {activity} in {location}. It's {adjective} and {adjective}.",
      "The {chef} shared the story of this {cuisine}. It's {adjective} and {adjective}.",
      "This {restaurant} is {adjective} for {activity}. The {dish} is {adjective}.",
      "I learned about {cuisine} from a {activity} expert. The {dish} is {adjective}.",
      "The {cuisine} tradition here is {adjective}. It's {activity} culture at its finest.",
    ],
    tips: [
      "Pro tip: The {dish} should be {adjective} for {activity}. It's {adjective}.",
      "Want to master {cuisine}? Try {activity}. It's {adjective}.",
      "The {ingredient} here is {adjective}. Perfect for {activity} in {location}.",
      "I always {technique} when preparing {dish} for {activity}. It's {adjective}.",
      "The {cuisine} here is {adjective}. It's {activity} fuel at its finest.",
    ],
  },
  street_food: {
    reviews: [
      "This {dish} is {adjective} and {adjective}. The {ingredient} is {adjective}.",
      "Found this {cuisine} gem in {location}. The {dish} is {adjective}.",
      "The {ingredient} here is {adjective}. It's {cuisine} street food at its finest.",
      "This {vendor} serves {cuisine} that's {adjective}. The {dish} is {adjective}.",
      "The {cuisine} here is {adjective}. It's {location} street food culture.",
    ],
    stories: [
      "I discovered this {dish} from a {vendor} in {location}. It's {adjective} and {adjective}.",
      "The {vendor} shared the story of this {cuisine}. It's {adjective} and {adjective}.",
      "This {location} street food is {adjective}. The {dish} is {adjective}.",
      "I learned about {cuisine} from a {vendor}. The {dish} is {adjective}.",
      "The {cuisine} tradition here is {adjective}. It's {location} street food at its finest.",
    ],
    tips: [
      "Pro tip: The {dish} should be {adjective} for perfect {cuisine}. It's {adjective}.",
      "Want to master {cuisine}? Try {location} street food. It's {adjective}.",
      "The {ingredient} here is {adjective}. Perfect for {cuisine} in {location}.",
      "I always {technique} when preparing {dish}. It's {cuisine} street food magic.",
      "The {cuisine} here is {adjective}. It's {location} street food culture at its finest.",
    ],
  },
};

// Content variables for template filling
const contentVariables = {
  spices: [
    "turmeric",
    "cumin",
    "coriander",
    "cardamom",
    "cinnamon",
    "cloves",
    "nutmeg",
    "pepper",
    "saffron",
    "fenugreek",
  ],
  dishes: [
    "curry",
    "biryani",
    "tandoori",
    "dal",
    "naan",
    "sushi",
    "ramen",
    "tempura",
    "yakitori",
    "miso soup",
  ],
  regions: [
    "Kerala",
    "Punjab",
    "Tamil Nadu",
    "Gujarat",
    "Rajasthan",
    "Tokyo",
    "Osaka",
    "Kyoto",
    "Hokkaido",
    "Kyushu",
  ],
  cultures: [
    "Indian",
    "Japanese",
    "Thai",
    "Korean",
    "Chinese",
    "Southeast Asian",
    "Middle Eastern",
    "North African",
  ],
  adjectives: [
    "incredible",
    "amazing",
    "spectacular",
    "outstanding",
    "exceptional",
    "remarkable",
    "extraordinary",
    "magnificent",
  ],
  techniques: [
    "slow cooking",
    "fermentation",
    "grilling",
    "steaming",
    "braising",
    "roasting",
    "sautéing",
    "marinating",
  ],
  ingredients: [
    "tofu",
    "tempeh",
    "quinoa",
    "chia seeds",
    "spirulina",
    "nutritional yeast",
    "coconut oil",
    "almond milk",
  ],
  wines: [
    "Chardonnay",
    "Pinot Noir",
    "Cabernet Sauvignon",
    "Merlot",
    "Sauvignon Blanc",
    "Riesling",
    "Syrah",
    "Malbec",
  ],
  chefs: [
    "master chef",
    "culinary artist",
    "kitchen wizard",
    "flavor architect",
    "taste innovator",
  ],
  restaurants: [
    "hidden gem",
    "culinary treasure",
    "flavor haven",
    "taste sanctuary",
    "food paradise",
  ],
  locations: [
    "Tokyo",
    "Osaka",
    "Kyoto",
    "Bangkok",
    "Singapore",
    "Hong Kong",
    "Mumbai",
    "Delhi",
    "London",
    "Paris",
  ],
  activities: [
    "hiking",
    "surfing",
    "camping",
    "exploring",
    "adventuring",
    "traveling",
    "discovering",
  ],
  vendors: [
    "street vendor",
    "food stall owner",
    "market seller",
    "local chef",
    "culinary expert",
  ],
  methods: [
    "pour over",
    "french press",
    "espresso",
    "cold brew",
    "aeropress",
    "chemex",
    "v60",
  ],
  flavors: [
    "fruity",
    "nutty",
    "chocolatey",
    "caramel",
    "vanilla",
    "citrus",
    "floral",
    "earthy",
  ],
  temperatures: ["room temperature", "slightly chilled", "warm", "hot", "cold"],
  ages: ["elderly", "wise", "experienced", "venerable", "ancient"],
  years: ["50", "75", "100", "150", "200", "300"],
  inspirations: [
    "grandmother's recipe",
    "traditional technique",
    "cultural heritage",
    "family tradition",
    "ancient wisdom",
  ],
  verbs: ["complement", "enhance", "balance", "harmonize", "accentuate"],
};

// Function to download image
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(filepath);
    https
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
  });
}

// Function to generate random content
function generateRandomContent(template, variables) {
  let content = template;

  // Replace placeholders with random variables
  Object.keys(variables).forEach((key) => {
    const values = variables[key];
    const randomValue = values[Math.floor(Math.random() * values.length)];
    content = content.replace(new RegExp(`{${key}}`, "g"), randomValue);
  });

  return content;
}

// Function to generate post
function generatePost(bot, restaurant, postIndex) {
  const template = contentTemplates[bot.contentStyle];
  const contentType =
    Object.keys(template)[
      Math.floor(Math.random() * Object.keys(template).length)
    ];
  const contentTemplate =
    template[contentType][
      Math.floor(Math.random() * template[contentType].length)
    ];

  const content = generateRandomContent(contentTemplate, contentVariables);

  return {
    id: `${bot.username}-post-${postIndex + 1}`,
    masterBotId: bot.id,
    title: `${bot.emoji} ${content.substring(0, 50)}...`,
    content: content,
    imageUrl: `/images/posts/${bot.username}/post-${postIndex + 1}.jpg`,
    imageLocalPath: `public/images/posts/${bot.username}/post-${
      postIndex + 1
    }.jpg`,
    restaurant: {
      id: restaurant.id || `restaurant-${postIndex + 1}`,
      name: restaurant.title || restaurant.name || "Restaurant",
      location: `${restaurant.city || "City"}, ${
        restaurant.countryCode || "Country"
      }`,
      rating: restaurant.totalScore || 4.5,
      priceRange: restaurant.price || "$$",
      cuisine: restaurant.categoryName || "Cuisine",
    },
    tags: restaurant.categories || ["food", "restaurant"],
    engagement: {
      likes: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 20),
      shares: Math.floor(Math.random() * 10),
    },
    createdAt: new Date().toISOString(),
    personality:
      bot.personality.split(", ")[
        Math.floor(Math.random() * bot.personality.split(", ").length)
      ],
  };
}

// Main function
async function generateMasterBotPosts() {
  console.log("🎯 Generating 70 posts for each Master Bot...");

  const outputDir = path.join(__dirname, "../public/masterbot-posts");
  const imageDir = path.join(__dirname, "../public/images/posts");

  // Create directories
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const bot of masterBots) {
    console.log(`\n🌍 Generating posts for ${bot.display_name}...`);

    // Create bot directory
    const botDir = path.join(imageDir, bot.username);
    if (!fs.existsSync(botDir)) {
      fs.mkdirSync(botDir, { recursive: true });
    }

    // Load bot's restaurant data
    const dataFile = path.join(
      __dirname,
      `../public/masterbot-datasets/${bot.username}-data.json`
    );
    let restaurants = [];

    try {
      const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
      restaurants = data.restaurants || [];
    } catch (error) {
      console.log(
        `   ⚠️  No dataset found for ${bot.username}, using sample data`
      );
      restaurants = Array(70)
        .fill()
        .map((_, i) => ({
          id: `restaurant-${i + 1}`,
          title: `Restaurant ${i + 1}`,
          city: "City",
          countryCode: "Country",
          totalScore: 4.5,
          price: "$$",
          categoryName: "Cuisine",
          categories: ["food", "restaurant"],
        }));
    }

    const posts = [];

    // Generate 70 posts
    for (let i = 0; i < 70; i++) {
      const restaurant = restaurants[i % restaurants.length];
      const post = generatePost(bot, restaurant, i);
      posts.push(post);

      // Download image if available
      if (restaurant.image_url || restaurant.hero_url) {
        const imageUrl = restaurant.image_url || restaurant.hero_url;
        const imagePath = path.join(botDir, `post-${i + 1}.jpg`);

        try {
          await downloadImage(imageUrl, imagePath);
          console.log(`   📸 Downloaded image for post ${i + 1}`);
        } catch (error) {
          console.log(
            `   ⚠️  Could not download image for post ${i + 1}: ${
              error.message
            }`
          );
        }
      }
    }

    // Save posts to file
    const postsFile = path.join(outputDir, `${bot.username}-posts.json`);
    fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));

    console.log(`   ✅ Generated 70 posts for ${bot.display_name}`);
    console.log(`   📁 Saved to: ${postsFile}`);
  }

  console.log(
    `\n🎉 Successfully generated posts for all ${masterBots.length} Master Bots!`
  );
  console.log(`📁 All posts saved in: ${outputDir}`);
  console.log(`🖼️  All images saved in: ${imageDir}`);
}

// Run the script
generateMasterBotPosts().catch(console.error);
