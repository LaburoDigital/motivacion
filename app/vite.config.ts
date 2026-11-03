import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png"],
      manifest: {
        name: "Motivación",
        short_name: "Motivación",
        lang: "es",
        display: "standalone",
        start_url: "/",
        theme_color: "#101114",
        background_color: "#101114",
        icons: [
          { src: "icono-192.png", sizes: "192x192", type: "image/png" },
          { src: "icono-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,json}"],
        importScripts: ["push-handler.js"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: "CacheFirst",
            options: { cacheName: "fuentes", expiration: { maxEntries: 20 } },
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\//,
            handler: "CacheFirst",
            options: { cacheName: "fotos", expiration: { maxEntries: 150 } },
          },
        ],
      },
    }),
  ],
  test: { environment: "jsdom", setupFiles: ["src/test/setup.ts"] },
} as never);
