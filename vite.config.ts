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
        hostType === "js"
          ? dependencies.filter((dependency) => dependency.endsWith(".css"))
          : dependencies.filter((dependency) => dependency.endsWith(".css") || dependency.includes("vendor") || dependency.includes("runtime")),
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|@remix-run[\\/]router)[\\/]/.test(id)) return "vendor";
            return;
          }
          if (id.includes("furnitureCatalogZh.json")) return "furniture-catalog-zh";
          if (id.includes("furnitureCatalogEn.json")) return "furniture-catalog-en";
          if (id.includes("furnitureCatalog.json")) return "furniture-catalog-base";
        },
      },
    },
    target: "esnext",
    minify: "esbuild",
  },
}));
