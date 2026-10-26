import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { preferWebpAssets } from "./scripts/vite-prefer-webp.mjs";
import { pruneDuplicatePublicMedia } from "./scripts/vite-prune-public-media.mjs";
import { buildLocalSiteCspPolicy } from "./scripts/site-csp.mjs";
import { publicBootHtml } from "./scripts/vite-public-boot.mjs";
import { resolvePublicModulePreloadDependencies } from "./scripts/vite-module-preload.mjs";

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
    // Load lazy route scripts through import(); preload the full static entry
    // graph so shared chunks do not wait for serial JavaScript discovery.
    modulePreload: {
      resolveDependencies: resolvePublicModulePreloadDependencies,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // These pure helpers are already in every document's static graph.
          // Share their module wrapper/compression with the existing runtime.
          if (/[\\/]src[\\/]lib[\\/](interactionPolicy|publicMotion|publicImageDecodeCache|recordUtils|utils)\.ts$/.test(id)) return "vendor";
          if (id.includes("node_modules")) {
            // Co-locate already-required shell helpers with React to reduce repeated chunk overhead.
            if (/[\\/]node_modules[\\/](clsx|tailwind-merge|react-helmet-async|react-fast-compare|shallowequal|invariant|tslib)[\\/]/.test(id)) return "vendor";
            // Only the icon factory is already required by the shell. Icon
            // definitions stay in their existing entry/lazy page chunks.
            if (/[\\/]node_modules[\\/]lucide-react[\\/]dist[\\/]esm[\\/](createLucideIcon|Icon|defaultAttributes|shared[\\/]src[\\/]utils)\.js$/.test(id)) return "vendor";
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
    minify: "oxc",
  },
}));
