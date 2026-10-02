/// <reference types="node" />

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import postcss from "postcss";
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
  it("shares public surface and text tokens with design and repair content", () => {
    const design = readFileSync(resolve(process.cwd(), "src/styles/design-service.css"), "utf8");
    expect(design).toContain("--fcd-bg: var(--public-surface-base)");
    expect(design).toContain("--fcd-text: var(--public-text-primary)");
    expect(design).toContain("--fcd-soft: var(--public-text-secondary)");
    expect(design).not.toContain("var(--scheme-a-bg");
    expect(design).not.toContain("var(--scheme-a-text");
  });

  it("keeps dark accent controls readable in the warm stone skin", () => {
    const directory = resolve(process.cwd(), "src/styles/components");
    for (const file of ["furniture-showcase.css", "home-atelier.css", "scheme-a-native-pages.css", "scheme-a-route-hero-v5.css", "scheme-a-shell.css"]) {
      postcss.parse(readFileSync(resolve(directory, file), "utf8")).walkRules((rule) => {
        const declarations = rule.nodes.filter((node) => node.type === "decl");
        const hasAccentBackground = declarations.some((node) => node.prop === "background"
          && /^var\(--(?:public-accent|furniture-accent)\)$/.test(node.value));
        if (hasAccentBackground) {
          const color = declarations.find((node) => node.prop === "color");
          if (color) expect(color.value, `${file}: ${rule.selector}`).toBe("#FDFCFA");
        }
      });
    }
  });

  it("keeps the furniture entry viewport-fixed across public skins", () => {
    const componentDirectory = resolve(process.cwd(), "src/styles/components");
    const positions: string[] = [];
    for (const file of readdirSync(componentDirectory).filter((name) => name.endsWith(".css"))) {
      postcss.parse(readFileSync(resolve(componentDirectory, file), "utf8")).walkRules((rule) => {
        if (/\.fc-furniture-floating(?![\w-])/.test(rule.selector) && !rule.selector.includes("::")) {
          rule.walkDecls("position", (declaration) => { positions.push(declaration.value); });
        }
      });
    }
    expect(positions).toEqual(["fixed"]);
    const globalStyles = readFileSync(resolve(process.cwd(), "src/styles/components.css"), "utf8");
    const buttons = readFileSync(resolve(componentDirectory, "buttons.css"), "utf8");
    expect(globalStyles).toContain('@import "./components/buttons.css"');
    expect(buttons).toContain("--public-floating-bottom: 82px");
    expect(buttons).toContain("bottom: calc(var(--public-floating-bottom) + env(safe-area-inset-bottom))");
  });

  it.each(retiredPublicDesignFiles)("keeps retired design file deleted: %s", (file) => {
    expect(existsSync(resolve(process.cwd(), file))).toBe(false);
  });

  it("loads one canonical public stylesheet entry", () => {
    const publicRoutes = readFileSync(resolve(process.cwd(), "src/routes/publicRoutes.tsx"), "utf8");
    const publicStyles = readFileSync(resolve(process.cwd(), "src/styles/routes/public-pages.css"), "utf8");
    const sectionSpacing = readFileSync(resolve(process.cwd(), "src/styles/components/public-section-spacing.css"), "utf8");

    expect(publicRoutes).toContain('import("@/styles/routes/public-pages.css")');
    expect(publicRoutes).not.toMatch(/public-(?:home|forms)\.css|scheme-a-fidelity\.css/);
    expect(publicStyles.trimEnd()).toMatch(/@import "\.\.\/components\/public-section-spacing\.css";\n@tailwind components;$/);
    expect(sectionSpacing).toContain("--public-section-space-end: 28px;");
  });

  it("keeps the home materials content without the retired left rail", () => {
    const homeStyles = readFileSync(resolve(process.cwd(), "src/styles/components/home-atelier.css"), "utf8");

    expect(homeStyles).toMatch(/\.scheme-a-home--atelier \.scheme-a-materials__copy \{[\s\S]*?border-left: 0;/);
  });

  it("starts every mobile footer directory group collapsed", () => {
    const publicChrome = readFileSync(resolve(process.cwd(), "src/components/scheme-a/SchemeAPublicChrome.tsx"), "utf8");

    expect(publicChrome).toContain('<details key={group.key}>');
    expect(publicChrome).not.toMatch(/<details key=\{group\.key\}\s+open=/);
  });
});
