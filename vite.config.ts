import { defineConfig } from "vite"
import { serviceWorkerPlugin } from "@gautemo/vite-plugin-service-worker"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
