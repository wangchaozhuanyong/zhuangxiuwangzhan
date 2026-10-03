import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { preferWebpAssets } from "./scripts/vite-prefer-webp.mjs";
import { pruneDuplicatePublicMedia } from "./scripts/vite-prune-public-media.mjs";
import { buildLocalSiteCspPolicy } from "./scripts/site-csp.mjs";
import { publicBootHtml } from "./scripts/vite-public-boot.mjs";

const securityHeaders = (mode: string) => ({
  "Content-Security-Policy": buildLocalSiteCspPolicy(loadEnv(mode, process.cwd(), "VITE_").VITE_SUPABASE_URL),
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: securityHeaders(mode),
    hmr: {
      overlay: false,
    },
  },
  preview: {
    headers: securityHeaders(mode),
  },
  plugins: [publicBootHtml(), preferWebpAssets(), react(), pruneDuplicatePublicMedia()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    // WebKit can retain failed modulepreload scripts across a native reload.
    // Load lazy route scripts through import(); keep entry and CSS preloads.
    modulePreload: {
      resolveDependencies: (_filename, dependencies, { hostType }) =>
        hostType === "js" ? dependencies.filter((dependency) => dependency.endsWith(".css")) : dependencies,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/.test(id)) return "vendor";
        },
      },
    },
    target: "esnext",
    minify: "esbuild",
  },
}));
