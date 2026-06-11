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
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon-180x180.png', 'icon-institui.png'],
      manifest: {
        name: 'Institui — Gestão para Organizações Sociais',
        short_name: 'Institui',
        description: 'Sistema completo de gestão para escolas, ONGs e centros educacionais.',
        theme_color: '#e60049',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon-institui.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-institui.png',
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
