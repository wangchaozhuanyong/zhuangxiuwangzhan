/// <reference types="node" />

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const retiredPublicDesignFiles = [
  "src/styles/components/cinematic-public.css",
  "src/styles/components/forest-client.css",
  "src/styles/components/forest-detail-pages.css",
  "src/styles/components/forest-final.css",
  "src/styles/components/forest-pages.css",
  "src/styles/components/home-hero.css",
  "src/styles/components/home-sections.css",
  "src/styles/components/new-client.css",
  "src/styles/components/optical-gallery.css",
  "src/styles/components/public-header.css",
  "src/styles/components/public-luxury-refinement.css",
  "src/styles/components/public-page-unification.css",
  "src/styles/components/scheme-a-fidelity.css",
  "src/styles/components/subpages.css",
  "src/styles/routes/public-forms.css",
  "src/styles/routes/public-home.css",
  "src/components/AdaptiveSurface.tsx",
  "src/components/DesktopFloatingCta.tsx",
  "src/components/FloatingCTA.tsx",
  "src/components/Footer.tsx",
  "src/components/Navbar.tsx",
  "src/components/ProductDetailChrome.tsx",
  "src/components/ProductGallery.tsx",
  "src/components/ProductGallery.test.tsx",
  "src/components/blocks/FAQSection.tsx",
  "src/components/blocks/FooterPreludeCta.tsx",
  "src/components/blocks/HeroBanner.tsx",
  "src/components/blocks/IconCardGrid.tsx",
  "src/components/blocks/SectionHeader.tsx",
  "src/components/forest/ForestBottomNav.tsx",
  "src/components/forest/ForestHome.tsx",
  "src/components/sections/BeforeAfterSection.tsx",
  "src/components/sections/BrandLogosSection.tsx",
  "src/components/sections/CTASection.tsx",
  "src/components/sections/HeroSection.tsx",
  "src/components/sections/HomeFAQSection.tsx",
  "src/components/sections/HomeProductsSection.tsx",
  "src/components/sections/HomePromotionsSection.tsx",
  "src/components/sections/ProcessSection.tsx",
  "src/components/sections/ProjectsSection.tsx",
  "src/components/sections/ServicesSection.tsx",
  "src/components/sections/StatsSection.tsx",
  "src/components/sections/TestimonialsSection.tsx",
  "src/components/sections/WhyChooseUsSection.tsx",
  "src/components/ui/accordion.tsx",
  "public/videos/home-hero.mp4",
  "public/videos/home-hero.webm",
  "public/videos/home-hero-tablet.mp4",
  "public/videos/home-hero-tablet.webm",
  "public/videos/home-hero-mobile.mp4",
  "public/videos/home-hero-mobile.webm",
] as const;

describe("public design boundary", () => {
  it.each(retiredPublicDesignFiles)("keeps retired design file deleted: %s", (file) => {
    expect(existsSync(resolve(process.cwd(), file))).toBe(false);
  });

  it("loads one canonical public stylesheet entry", () => {
    const publicRoutes = readFileSync(resolve(process.cwd(), "src/routes/publicRoutes.tsx"), "utf8");

    expect(publicRoutes).toContain('import("@/styles/routes/public-pages.css")');
    expect(publicRoutes).not.toMatch(/public-(?:home|forms)\.css|scheme-a-fidelity\.css/);
  });
});
