import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import { componentTagger } from "lovable-tagger";

import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // server: {
  //   host: "::",
  //   port: 8080,
  // },
  plugins: [
    react(),
    // mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'prompt',
      filename: 'manifest.json',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon-180x180.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Neo Missio - Gestão Social',
        short_name: 'Neo Missio',
        description: 'Sistema de gestão para o projeto social Neo Missio.',
        theme_color: '#e60049',
        background_color: '#09090b',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: {
        enabled: false
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
}));
