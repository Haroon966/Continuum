/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron/simple";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: "electron/main.ts",
        vite: {
          build: {
            outDir: "dist-electron",
            rollupOptions: {
              external: ["electron", "chokidar", "express", "cors"],
            },
          },
        },
      },
      preload: {
        input: "electron/preload.ts",
        vite: {
          build: {
            outDir: "dist-electron",
          },
        },
      },
      renderer: {},
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
});
