import { composeFeedCard } from "./cardComposer";
import { fetchSpoonacularRecipes, loadMasterBotJson } from "./masterBotLoader";

export interface ScheduledFeedCard {
  id: string;
  card: Awaited<ReturnType<typeof composeFeedCard>>;
  scheduledFor: Date;
}

// Example: schedule cards for the next 7 days
export async function scheduleFeedCards(
  apiKey: string
): Promise<ScheduledFeedCard[]> {
  const masterBotPlaces = loadMasterBotJson();
  const spoonacularRecipes = await fetchSpoonacularRecipes(
    "popular",
    apiKey,
    7
  );

  // Master Bot personalities for rotation
  const masterBotPersonalities = [
    {
      name: "Aurelia Voss",
      prompt: "You are adventurous, poetic, and love street food.",
    },
    {
      name: "Sebastian LeClair",
      prompt:
        "You are sophisticated, knowledgeable about fine dining and wine pairings.",
    },
    {
      name: "Lila Cheng",
      prompt:
        "You are passionate about plant-based food and sustainable eating.",
    },
    {
      name: "Rafael Mendez",
      prompt:
        "You are adventurous and energetic, love coastal and mountain cuisine.",
    },
    {
      name: "Anika Kapoor",
      prompt:
        "You are knowledgeable about spices and traditional Indian cuisine.",
    },
    {
      name: "Omar Darzi",
      prompt: "You are contemplative and detail-oriented about coffee culture.",
    },
    {
      name: "Jun Tanaka",
      prompt:
        "You are minimalist and thoughtful about Japanese cuisine and simplicity.",
    },
  ];

  // Compose cards for each bot place
  const botCards = await Promise.all(
    masterBotPlaces.map(async (place, i) => {
      // Rotate through all Master Bot personalities
      const bot = masterBotPersonalities[i % masterBotPersonalities.length];
      return {
        id: `masterbot-${place.kgmid}`,
        card: await composeFeedCard({
          placeName: place.name || place.kgmid,
          description: place.description || "",
          bot,
        }),
        scheduledFor: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
      };
    })
  );

  // Compose cards for Spoonacular recipes
  const recipeCards = await Promise.all(
    spoonacularRecipes.map(async (recipe, i) => {
      // Use different bots for recipes, cycling through the personalities
      const bot =
        masterBotPersonalities[
          (i + masterBotPlaces.length) % masterBotPersonalities.length
        ];
      return {
        id: `spoonacular-${recipe.id}`,
        card: await composeFeedCard({
          placeName: recipe.title,
          description: recipe.summary || "",
          bot,
        }),
        scheduledFor: new Date(
          Date.now() + (i + masterBotPlaces.length) * 24 * 60 * 60 * 1000
        ),
      };
    })
  );

  // Combine and sort by scheduled date
  return [...botCards, ...recipeCards].sort(
    (a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime()
  );
}
