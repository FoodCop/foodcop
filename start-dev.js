#!/usr/bin/env node

/**
 * Development Server Starter
 * Starts both the AI server and Vite dev server concurrently
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 Starting FUZO Development Environment...\n");

// Start AI Server
console.log("🤖 Starting AI Server on port 3001...");
const aiServer = spawn("npx", ["tsx", "server/ai-server.ts"], {
  stdio: "pipe",
  shell: true,
  cwd: __dirname,
});

aiServer.stdout.on("data", (data) => {
  console.log(`[AI Server] ${data.toString().trim()}`);
});

aiServer.stderr.on("data", (data) => {
  console.error(`[AI Server Error] ${data.toString().trim()}`);
});

// Start Vite Dev Server
console.log("⚡ Starting Vite Dev Server on port 5173...");
const viteServer = spawn("npm", ["run", "dev"], {
  stdio: "pipe",
  shell: true,
  cwd: __dirname,
});

viteServer.stdout.on("data", (data) => {
  console.log(`[Vite] ${data.toString().trim()}`);
});

viteServer.stderr.on("data", (data) => {
  console.error(`[Vite Error] ${data.toString().trim()}`);
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down development servers...");
  aiServer.kill();
  viteServer.kill();
  process.exit(0);
});

// Wait a moment for servers to start
setTimeout(() => {
  console.log("\n✅ Development environment ready!");
  console.log("🔗 Frontend: http://localhost:5173");
  console.log("🤖 AI Server: http://localhost:3001");
  console.log("📊 AI Status: http://localhost:3001/api/ai/status");
  console.log("\nPress Ctrl+C to stop all servers\n");
}, 3000);




