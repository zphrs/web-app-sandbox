import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    // VitePWA({
    //   registerType: "autoUpdate",
    //   strategies: "injectManifest",
    //   srcDir: "src",
    //   filename: "sw.ts",
    //   devOptions: {
    //     enabled: true,
    //   },
    // }),
  ],
  server: {
    cors: true,
    port: 5173,
    allowedHosts: ["localhost"],
  },
})
