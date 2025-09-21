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
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react/jsx-runtime"],
          "ui-vendor": [
            "framer-motion",
            "lucide-react",
            "@radix-ui/react-avatar",
            "@radix-ui/react-dialog",
            "@radix-ui/react-progress",
            "sonner",
          ],
          "supabase-vendor": ["@supabase/supabase-js"],
          "utils-vendor": ["clsx", "tailwind-merge"],
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
      "ai",
      "@ai-sdk/react",
      "@ai-sdk/openai",
      "zod",
    ],
    force: true,
  },
  esbuild: {
    jsx: "automatic",
  },
});
