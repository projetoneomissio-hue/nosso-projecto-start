// vite.config.ts
import { defineConfig } from "file:///C:/Users/NeoMissio/Documents/Neomissio14022026/nosso-projecto-start/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/NeoMissio/Documents/Neomissio14022026/nosso-projecto-start/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { VitePWA } from "file:///C:/Users/NeoMissio/Documents/Neomissio14022026/nosso-projecto-start/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\NeoMissio\\Documents\\Neomissio14022026\\nosso-projecto-start";
var vite_config_default = defineConfig(({ mode }) => ({
  // server: {
  //   host: "::",
  //   port: 8080,
  // },
  plugins: [
    react(),
    // mode === "development" && componentTagger(),
    VitePWA({
      registerType: "prompt",
      filename: "manifest.json",
      includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon-180x180.png", "pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        name: "Neo Missio - Gest\xE3o Social",
        short_name: "Neo Missio",
        description: "Sistema de gest\xE3o para o projeto social Neo Missio.",
        theme_color: "#e60049",
        background_color: "#09090b",
        display: "standalone",
        scope: "/",
        start_url: "/",
        orientation: "portrait",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      },
      devOptions: {
        enabled: false
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxOZW9NaXNzaW9cXFxcRG9jdW1lbnRzXFxcXE5lb21pc3NpbzE0MDIyMDI2XFxcXG5vc3NvLXByb2plY3RvLXN0YXJ0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxOZW9NaXNzaW9cXFxcRG9jdW1lbnRzXFxcXE5lb21pc3NpbzE0MDIyMDI2XFxcXG5vc3NvLXByb2plY3RvLXN0YXJ0XFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9OZW9NaXNzaW8vRG9jdW1lbnRzL05lb21pc3NpbzE0MDIyMDI2L25vc3NvLXByb2plY3RvLXN0YXJ0L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuLy8gaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcblxyXG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSBcInZpdGUtcGx1Z2luLXB3YVwiO1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcclxuICAvLyBzZXJ2ZXI6IHtcclxuICAvLyAgIGhvc3Q6IFwiOjpcIixcclxuICAvLyAgIHBvcnQ6IDgwODAsXHJcbiAgLy8gfSxcclxuICBwbHVnaW5zOiBbXHJcbiAgICByZWFjdCgpLFxyXG4gICAgLy8gbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiICYmIGNvbXBvbmVudFRhZ2dlcigpLFxyXG4gICAgVml0ZVBXQSh7XHJcbiAgICAgIHJlZ2lzdGVyVHlwZTogJ3Byb21wdCcsXHJcbiAgICAgIGZpbGVuYW1lOiAnbWFuaWZlc3QuanNvbicsXHJcbiAgICAgIGluY2x1ZGVBc3NldHM6IFsnZmF2aWNvbi5pY28nLCAncm9ib3RzLnR4dCcsICdhcHBsZS10b3VjaC1pY29uLTE4MHgxODAucG5nJywgJ3B3YS0xOTJ4MTkyLnBuZycsICdwd2EtNTEyeDUxMi5wbmcnXSxcclxuICAgICAgbWFuaWZlc3Q6IHtcclxuICAgICAgICBuYW1lOiAnTmVvIE1pc3NpbyAtIEdlc3RcdTAwRTNvIFNvY2lhbCcsXHJcbiAgICAgICAgc2hvcnRfbmFtZTogJ05lbyBNaXNzaW8nLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2lzdGVtYSBkZSBnZXN0XHUwMEUzbyBwYXJhIG8gcHJvamV0byBzb2NpYWwgTmVvIE1pc3Npby4nLFxyXG4gICAgICAgIHRoZW1lX2NvbG9yOiAnI2U2MDA0OScsXHJcbiAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogJyMwOTA5MGInLFxyXG4gICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcclxuICAgICAgICBzY29wZTogJy8nLFxyXG4gICAgICAgIHN0YXJ0X3VybDogJy8nLFxyXG4gICAgICAgIG9yaWVudGF0aW9uOiAncG9ydHJhaXQnLFxyXG4gICAgICAgIGljb25zOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHNyYzogJy9wd2EtMTkyeDE5Mi5wbmcnLFxyXG4gICAgICAgICAgICBzaXplczogJzE5MngxOTInLFxyXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHNyYzogJy9wd2EtNTEyeDUxMi5wbmcnLFxyXG4gICAgICAgICAgICBzaXplczogJzUxMng1MTInLFxyXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcclxuICAgICAgICAgICAgcHVycG9zZTogJ2FueSBtYXNrYWJsZScsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIF1cclxuICAgICAgfSxcclxuICAgICAgd29ya2JveDoge1xyXG4gICAgICAgIGNsZWFudXBPdXRkYXRlZENhY2hlczogdHJ1ZSxcclxuICAgICAgICBjbGllbnRzQ2xhaW06IHRydWUsXHJcbiAgICAgICAgc2tpcFdhaXRpbmc6IHRydWUsXHJcbiAgICAgICAgZ2xvYlBhdHRlcm5zOiBbJyoqLyoue2pzLGNzcyxodG1sLGljbyxwbmcsc3ZnLHdvZmYyfSddLFxyXG4gICAgICAgIG1heGltdW1GaWxlU2l6ZVRvQ2FjaGVJbkJ5dGVzOiA1ICogMTAyNCAqIDEwMjQsXHJcbiAgICAgIH0sXHJcbiAgICAgIGRldk9wdGlvbnM6IHtcclxuICAgICAgICBlbmFibGVkOiBmYWxzZVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHRlc3Q6IHtcclxuICAgIGdsb2JhbHM6IHRydWUsXHJcbiAgICBlbnZpcm9ubWVudDogXCJqc2RvbVwiLFxyXG4gICAgc2V0dXBGaWxlczogW1wiLi9zcmMvdGVzdC9zZXR1cC50c1wiXSxcclxuICAgIGNzczogZmFsc2UsXHJcbiAgfSxcclxufSkpO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXVZLFNBQVMsb0JBQW9CO0FBQ3BhLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFHakIsU0FBUyxlQUFlO0FBTHhCLElBQU0sbUNBQW1DO0FBUXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUt6QyxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUE7QUFBQSxJQUVOLFFBQVE7QUFBQSxNQUNOLGNBQWM7QUFBQSxNQUNkLFVBQVU7QUFBQSxNQUNWLGVBQWUsQ0FBQyxlQUFlLGNBQWMsZ0NBQWdDLG1CQUFtQixpQkFBaUI7QUFBQSxNQUNqSCxVQUFVO0FBQUEsUUFDUixNQUFNO0FBQUEsUUFDTixZQUFZO0FBQUEsUUFDWixhQUFhO0FBQUEsUUFDYixhQUFhO0FBQUEsUUFDYixrQkFBa0I7QUFBQSxRQUNsQixTQUFTO0FBQUEsUUFDVCxPQUFPO0FBQUEsUUFDUCxXQUFXO0FBQUEsUUFDWCxhQUFhO0FBQUEsUUFDYixPQUFPO0FBQUEsVUFDTDtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFVBQ1I7QUFBQSxVQUNBO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsWUFDTixTQUFTO0FBQUEsVUFDWDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFDQSxTQUFTO0FBQUEsUUFDUCx1QkFBdUI7QUFBQSxRQUN2QixjQUFjO0FBQUEsUUFDZCxhQUFhO0FBQUEsUUFDYixjQUFjLENBQUMsc0NBQXNDO0FBQUEsUUFDckQsK0JBQStCLElBQUksT0FBTztBQUFBLE1BQzVDO0FBQUEsTUFDQSxZQUFZO0FBQUEsUUFDVixTQUFTO0FBQUEsTUFDWDtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0gsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUNoQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxNQUFNO0FBQUEsSUFDSixTQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsSUFDYixZQUFZLENBQUMscUJBQXFCO0FBQUEsSUFDbEMsS0FBSztBQUFBLEVBQ1A7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
