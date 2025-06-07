import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import inlineSource from "vite-plugin-inline-source"

export default defineConfig({
  plugins: [
    VitePWA({
      injectRegister: null,
      strategies: "injectManifest",
      srcDir: "src/sw",
      injectManifest: {
        injectionPoint: undefined,
      },
      manifest: false,
      filename: "sw.ts",
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
    inlineSource(),
  ],
  server: {
    cors: true,
    port: 5273,
    allowedHosts: [".localhost"],
  },
  preview: {
    cors: true,
    port: 5273,
    proxy: {
      "^pg-doc-id/.*": "http://localhost:5273/index.html",
    },
    allowedHosts: [".localhost"],
  },
})
