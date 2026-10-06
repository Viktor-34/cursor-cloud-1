import react from "@vitejs/plugin-react";
import netlify from "@netlify/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    netlify({
      // This environment's Deno build rejects the edge-functions dev flag.
      // The app does not use edge functions or the image CDN.
      edgeFunctions: { enabled: false },
      images: { enabled: false },
    }),
  ],
});
