import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "favicon.svg",
        "icons/favicon-32x32.png",
        "icons/apple-touch-icon.png",
        "icons/icon-192x192.png",
        "icons/icon-512x512.png",
        "icons/icon-maskable-192x192.png",
        "icons/icon-maskable-512x512.png",
      ],
      manifest: {
        name: "四宫格数独试卷生成器 - A4专业打印与在线答题系统",
        short_name: "四宫格数独",
        description:
          "四宫格数独试卷生成器与在线答题系统，支持A4纸高清打印与在线做题、自动100分打分、做题数据统计、手机平板自适应与离线做题。",
        id: "/",
        start_url: "/",
        scope: "/",
        display: "standalone",
        display_override: ["standalone", "minimal-ui", "window-controls-overlay"],
        orientation: "any",
        background_color: "#f8fafc",
        theme_color: "#2563eb",
        lang: "zh-CN",
        categories: ["education", "games", "productivity"],
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-maskable-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icons/icon-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\/.*/],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^\/api\/.*/,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../public"),
    emptyOutDir: true,
    target: "es2020",
  },
});
