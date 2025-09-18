import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@components": path.resolve(__dirname, "./components"),
      "@utils": path.resolve(__dirname, "./utils"),
      "@contexts": path.resolve(__dirname, "./contexts"),
      "@styles": path.resolve(__dirname, "./styles"),
    },
  },
  server: {
    port: 5173,
    host: true,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: process.env.NODE_ENV === "production" ? false : true,
    minify: "esbuild",
    chunkSizeWarningLimit: 1000,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        socket: path.resolve(__dirname, "src/socket.ts"),
      },
      output: {
        // Ensure predictable filename for socket bridge (no hash) so external tooling
        // looking specifically for dist/socket.js can locate it.
        entryFileNames: (chunk) => {
          if (chunk.name === "socket") return "socket.js";
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
        manualChunks: (id) => {
          // Create chunks based on node_modules
          if (id.includes("node_modules")) {
            // Keep React and React-DOM together in the main chunk for stability
            if (id.includes("react") || id.includes("react-dom")) {
              return undefined; // Keep in main chunk
            }
            if (
              id.includes("framer-motion") ||
              id.includes("lucide-react") ||
              id.includes("@radix-ui") ||
              id.includes("sonner")
            ) {
              return "ui-vendor";
            }
            if (id.includes("@supabase")) {
              return "supabase-vendor";
            }
            if (id.includes("clsx") || id.includes("tailwind-merge")) {
              return "utils-vendor";
            }
            // Group other vendor libraries
            return "vendor";
          }
          // Split large application files
          if (id.includes("components/") && id.includes("PageRouter")) {
            return "router";
          }
          if (id.includes("components/") && id.includes("OnboardingFlow")) {
            return "onboarding";
          }
        },
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "framer-motion",
      "lucide-react",
      "@radix-ui/react-avatar",
      "@radix-ui/react-dialog",
      "@radix-ui/react-progress",
      "sonner",
      "clsx",
      "tailwind-merge",
    ],
    force: true,
  },
});
