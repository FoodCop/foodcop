import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-a0939869/health", (c) => {
  return c.json({ status: "ok" });
});

// Get Google Maps API key
app.get("/make-server-a0939869/config/maps-api-key", (c) => {
  const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
  if (!apiKey) {
    console.log('Error: GOOGLE_MAPS_API_KEY not found in environment');
    return c.json({ error: 'API key not configured' }, 500);
  }
  return c.json({ apiKey });
});

Deno.serve(app.fetch);