import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const cleanEnv = (val: string | undefined) => val?.trim().replace(/^["']|["']$/g, '') || "";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  console.log("Starting server...");
  const rawSpoonKey = process.env.SPOONACULAR_API_KEY || process.env.VITE_SPOONACULAR_API_KEY;
  const spoonKey = cleanEnv(rawSpoonKey);
  console.log(`[Debug] SPOONACULAR_API_KEY source: ${process.env.SPOONACULAR_API_KEY ? 'env' : 'not in env'}`);
  console.log(`[Debug] VITE_SPOONACULAR_API_KEY source: ${process.env.VITE_SPOONACULAR_API_KEY ? 'env' : 'not in env'}`);
  console.log(`[Debug] Key Length: ${spoonKey?.length || 0}`);
  if (spoonKey) {
    console.log(`[Debug] Key Prefix: ${spoonKey.substring(0, 4)}...`);
    console.log(`[Debug] Key Suffix: ...${spoonKey.substring(spoonKey.length - 4)}`);
  }

  // Generic Spoonacular Proxy Handler
  const handleSpoonacularRequest = async (endpoint: string, method: string, params: any, res: express.Response) => {
    const rawKey = process.env.SPOONACULAR_API_KEY || process.env.VITE_SPOONACULAR_API_KEY;
    const apiKey = cleanEnv(rawKey);
    
    if (!apiKey) {
      console.error("SPOONACULAR_API_KEY is empty or undefined");
      return res.status(500).json({ error: "SPOONACULAR_API_KEY not configured on server" });
    }

    try {
      // Build URL
      const baseUrl = `https://api.spoonacular.com/${endpoint}`;
      const url = new URL(baseUrl);
      
      // Add apiKey to query params (Spoonacular default)
      url.searchParams.append("apiKey", apiKey);
      
      // Add other params
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'apiKey') {
          url.searchParams.append(key, String(value));
        }
      });

      const finalUrl = url.toString();
      console.log(`[Proxy] ${method} ${endpoint}`);
      console.log(`[Proxy] URL: ${finalUrl.replace(apiKey, "REDACTED")}`);
      console.log(`[Proxy] Key Length: ${apiKey.length}`);

      const response = await fetch(finalUrl, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json'
          // Removed x-api-key header to avoid potential conflicts
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Proxy] Spoonacular Error ${response.status}:`, errorText);
        
        // Forward the exact status from Spoonacular
        return res.status(response.status).json({ 
          success: false,
          error: `Spoonacular API error: ${response.status}`, 
          message: errorText,
          status: response.status
        });
      }

      const data = await response.json();
      console.log(`[Proxy] Success: Received data from ${endpoint}`);
      res.json(data);
    } catch (error) {
      console.error("[Proxy] Critical Error:", error);
      res.status(500).json({ success: false, error: "Internal Server Error during proxying" });
    }
  };

  // Support the routes used in SpoonacularService
  app.post("/api/spoonacular/recipes/complexSearch", (req, res) => handleSpoonacularRequest("recipes/complexSearch", "POST", req.body, res));
  app.post("/api/spoonacular/recipes/:id/information", (req, res) => handleSpoonacularRequest(`recipes/${req.params.id}/information`, "POST", req.body, res));
  app.post("/api/spoonacular/recipes/random", (req, res) => handleSpoonacularRequest("recipes/random", "POST", req.body, res));
  app.post("/api/spoonacular/recipes/:id/similar", (req, res) => handleSpoonacularRequest(`recipes/${req.params.id}/similar`, "POST", req.body, res));

  // Legacy GET route for compatibility
  app.get("/api/recipes/random", async (req, res) => {
    handleSpoonacularRequest("recipes/complexSearch", "GET", { ...req.query, sort: "random", addRecipeInformation: true, addRecipeNutrition: true, fillIngredients: true }, res);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
