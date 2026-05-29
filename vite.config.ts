import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { preferWebpAssets } from "./scripts/vite-prefer-webp.mjs";
import { SITE_CSP_POLICY } from "./scripts/site-csp.mjs";

const securityHeaders = {
  "Content-Security-Policy": SITE_CSP_POLICY,
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: securityHeaders,
    hmr: {
      overlay: false,
    },
  },
  preview: {
    headers: securityHeaders,
  },
  plugins: [preferWebpAssets(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["@radix-ui/react-accordion", "@radix-ui/react-dialog", "@radix-ui/react-tooltip", "@radix-ui/react-toast"],
        },
      },
    },
    target: "esnext",
    minify: "esbuild",
  },
}));
