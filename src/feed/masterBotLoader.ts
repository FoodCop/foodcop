import fs from "fs";
import path from "path";

// Type for a MasterBot restaurant/place
export interface MasterBotPlace {
  kgmid: string;
  name?: string;
  description?: string;
  // Add more fields as needed from your JSON

// Loader for MasterBotBucket2.json
export function loadMasterBotJson(jsonPath?: string): MasterBotPlace[] {
  const filePath =
    jsonPath || path.resolve(__dirname, "../../MasterBotBucket2.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : [];
}

// Spoonacular API loader
export async function fetchSpoonacularRecipes(
  tag: string,
  apiKey: string,
  count = 10
) {
  const endpoint = `https://api.spoonacular.com/recipes/complexSearch?number=${count}&tags=${encodeURIComponent(tag)}&apiKey=${apiKey}&addRecipeInformation=true`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error('Failed to fetch Spoonacular recipes');
  const json = await res.json();
  return json.results || [];
}

// Example usage:
// const places = loadMasterBotJson();
// const recipes = await fetchSpoonacularRecipes('vegan', process.env.SPOONACULAR_KEY!);
