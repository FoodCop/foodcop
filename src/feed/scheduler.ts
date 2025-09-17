import { loadMasterBotJson, fetchSpoonacularRecipes } from "./masterBotLoader";
import { composeFeedCard } from "./cardComposer";

export interface ScheduledFeedCard {
  id: string;
  card: Awaited<ReturnType<typeof composeFeedCard>>;
  scheduledFor: Date;
}

// Example: schedule cards for the next 7 days
export async function scheduleFeedCards(apiKey: string): Promise<ScheduledFeedCard[]> {
  const masterBotPlaces = loadMasterBotJson();
  const spoonacularRecipes = await fetchSpoonacularRecipes("popular", apiKey, 7);

  // Compose cards for each bot place
  const botCards = await Promise.all(
    masterBotPlaces.map(async (place, i) => {
      // Choose a bot personality (stub: use first)
      const bot = {
        name: "Aurelia Voss",
        prompt: "You are adventurous, poetic, and love street food."
      };
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
      const bot = {
        name: "Lila Cheng",
        prompt: "You are creative, passionate, and love plant-based food."
      };
      return {
        id: `spoonacular-${recipe.id}`,
        card: await composeFeedCard({
          placeName: recipe.title,
          description: recipe.summary || "",
          bot,
        }),
        scheduledFor: new Date(Date.now() + (i + masterBotPlaces.length) * 24 * 60 * 60 * 1000),
      };
    })
  );

  // Combine and sort by scheduled date
  return [...botCards, ...recipeCards].sort(
    (a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime()
  );
}
