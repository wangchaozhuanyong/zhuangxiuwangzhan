import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SchemeAHome from "@/components/scheme-a/SchemeAHome";
import { PublicChromeProvider } from "@/contexts/PublicChromeContext";
import type { PublishedHomeContentBundle } from "@/lib/homeContentApi";
import { homeFurnitureText } from "@/i18n/homeFurnitureText";

const state = vi.hoisted(() => ({
  language: "en" as "en" | "zh",
  whatsappHref: "https://wa.me/601100000000?text=Configured%20message",
  query: { data: [], isLoading: false, isFetching: false, isInitialError: false, refetch: vi.fn() },
}));

// Keep the actual composed UI and public links; only isolate remote readers.
vi.mock("@/hooks/usePublishedContent", () => ({
  usePublishedHomeFurniture: () => state.query,
  usePublishedHomeJournal: () => state.query,
  usePublishedHomeServiceAreas: () => state.query,
}));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/hooks/useSiteSettings", () => ({
  useSiteSettings: () => ({ whatsapp_url: () => state.whatsappHref }),
}));

// Match the existing presentation tests' complete bundle shape so omissions do
// not accidentally test fallback data in place of explicitly supplied CMS data.
const bundle = (patch: Partial<PublishedHomeContentBundle> = {}): PublishedHomeContentBundle => ({
  pageContent: null,
  heroSlides: [],
  statsSection: null,
  whyChooseUsSection: null,
  projects: [],
  brandPartnersEnabled: false,
  brandPartners: [],
  services: [],
  processSteps: [],
  beforeAfterItems: [],
  testimonialsEnabled: false,
  testimonials: [],
  faqs: [],
  ctaBlock: null,
  ...patch,
});

const originalServiceSlugs = [
  "renovation", "kitchen", "builtin", "office-renovation", "shop-renovation", "bathroom", "design", "surface-repair",
];

describe("SchemeAHome composed CMS behavior", () => {
  let container: HTMLDivElement;
  let root: Root;

  const render = (content: PublishedHomeContentBundle, faqItems: { question: string; answer: string }[] = []) => {
    act(() => root.render(
      <MemoryRouter>
        <PublicChromeProvider isAdminRoute={false} routeKey="home">
          <SchemeAHome content={content} faqItems={faqItems} />
        </PublicChromeProvider>
      </MemoryRouter>,
    ));
  };

  beforeEach(() => {
    state.language = "en";
    state.whatsappHref = "https://wa.me/601100000000?text=Configured%20message";
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it.each(["zh", "en"] as const)("preserves the custom CMS hero and all original service paths in %s", (language) => {
    state.language = language;
    const buttonLabel = language === "zh" ? "咨询我的装修计划" : "Discuss my renovation";
    const image = "https://images.example.test/cms-home-cover.webp";
    const alt = language === "zh" ? "已发布住宅空间图片" : "Published home interior image";
    const content = bundle({
      heroSlides: [{ id: "cms-hero", title: "", excerpt: "", buttonLabel, buttonUrl: "/quote?source=homepage-cms", image, alt }],
    });
    render(content);

    const hero = container.querySelector('[data-home-section="hero"]');
    expect(hero).toHaveAttribute("data-hero-art", "custom");
    expect(hero?.querySelector("img")).toHaveAttribute("src", image);
    expect(hero?.querySelector("img")).toHaveAttribute("alt", alt);
    const heroLinks = hero!.querySelectorAll("a");
    expect(heroLinks).toHaveLength(3);
    expect(heroLinks[0]).toHaveTextContent(language === "zh" ? "WhatsApp咨询" : "Chat on WhatsApp");
    expect(heroLinks[0]).toHaveAttribute("href", state.whatsappHref);
    expect(heroLinks[0]).toHaveAttribute("target", "_blank");
    expect(heroLinks[0]).toHaveAttribute("rel", "noopener noreferrer");
    expect(heroLinks[0]).toHaveClass("scheme-a-button--paper");
    expect(heroLinks[1]).toHaveTextContent(language === "zh" ? "查看案例" : "View projects");
    expect(heroLinks[1]).toHaveAttribute("href", `/${language}/projects`);
    expect(heroLinks[1]).toHaveClass("scheme-a-button--glass");
    expect(heroLinks[2]).toHaveAttribute("href", `https://shop.flashcast.com.my/${language}/`);
    expect(heroLinks[2]).toHaveAttribute("target", "_blank");
    expect(heroLinks[2]).toHaveAttribute("rel", "noopener noreferrer");
    expect(heroLinks[2]).toHaveAttribute("aria-label", homeFurnitureText[language].heroShopLabel);
    expect(heroLinks[2].querySelector(".scheme-a-home-furniture-entry__title")).toHaveTextContent(homeFurnitureText[language].heroShopTitle);
    const categories = homeFurnitureText[language].heroShopDescription.split(" · ");
    const chips = heroLinks[2].querySelectorAll(".scheme-a-chip");
    expect(chips).toHaveLength(categories.length);
    categories.forEach((category, index) => expect(chips[index]).toHaveTextContent(category));
    expect(heroLinks[2].querySelector(".scheme-a-home-furniture-entry__badge")).toHaveTextContent(homeFurnitureText[language].heroShopBadge);
    expect(hero!.querySelector(".scheme-a-hero__enquiry-panel, .scheme-a-hero__scope, .scheme-a-hero__enquiry")).toBeNull();
    for (const slug of originalServiceSlugs) {
      expect(container.querySelector(`[data-home-section="services"] a[href="/${language}/services/${slug}"]`)).not.toBeNull();
    }

    // Legacy CMS actions cannot replace the requested WhatsApp entry point.
    state.whatsappHref = "https://wa.me/601100000001?text=Updated%20message";
    render({ ...content, heroSlides: [{ ...content.heroSlides[0], buttonUrl: "/contact" }] });
    expect(container.querySelector('[data-home-section="hero"] a[target="_blank"]')).toHaveAttribute("href", state.whatsappHref);
    expect(container.querySelector(`[data-home-section="hero"] a[href="/${language}/contact"]`)).toBeNull();
  });

  it.each(["zh", "en"] as const)("retains the original hero actions without a language-specific panel in %s", (language) => {
    state.language = language;
    render(bundle());
    const hero = container.querySelector('[data-home-section="hero"]');
    expect(hero!.querySelectorAll("a")).toHaveLength(3);
    expect(hero!.querySelector(".scheme-a-hero__brand")?.textContent ?? null).toBe(language === "zh" ? "闪铸装饰 FLASH CAST" : null);
    expect(hero!.querySelector('a[target="_blank"]')).toHaveAttribute("href", state.whatsappHref);
    expect(hero!.querySelector(`a[href="/${language}/projects"]`)).toHaveTextContent(language === "zh" ? "查看案例" : "View projects");
    expect(hero!.querySelector(".scheme-a-hero__enquiry-panel, .scheme-a-hero__scope, .scheme-a-hero__enquiry")).toBeNull();
    expect(hero!.querySelector("h1")).toHaveTextContent(language === "zh" ? /更好的空间，\s*更美好的生活。/ : /A Better Space.\s*A Brighter Life./);
  });

  it("renders every passed FAQ answer and keeps the final answer operable", () => {
    const faqItems = Array.from({ length: 7 }, (_, index) => ({
      question: `Published question ${index + 1}?`,
      answer: `Published answer ${index + 1}, including the full agreed scope.`,
    }));
    render(bundle({
      faqs: [{ id: "unused", category: "home", question: "Unfiltered alternate question?", answer: "This must not replace the shared FAQ props." }],
    }), faqItems);

    const rows = Array.from(container.querySelectorAll('[data-home-section="faq"] .fc-route-faq-item'));
    expect(rows).toHaveLength(faqItems.length);
    rows.forEach((row, index) => {
      expect(row.querySelector(".fc-route-faq-question")?.textContent).toBe(faqItems[index].question);
      expect(row.querySelector("p")?.textContent).toBe(faqItems[index].answer);
    });
    expect(container).not.toHaveTextContent("Unfiltered alternate question?");
    const finalButton = rows.at(-1)!.querySelector<HTMLButtonElement>("button")!;
    expect(finalButton).toHaveAttribute("aria-expanded", "false");
    act(() => finalButton.click());
    expect(finalButton).toHaveAttribute("aria-expanded", "true");
    expect(rows.at(-1)!.querySelector("p")).not.toHaveAttribute("hidden");

    render(bundle(), []);
    expect(container.querySelector('[data-home-section="faq"]')).toBeNull();
  });

  it("keeps brand and testimonial CMS switches independent when populated data is present", () => {
    const content = bundle({
      brandPartners: [{ id: "brand", name: "Published partner", logo_url: "/images/test-partner.webp" }],
      testimonials: [{ id: "testimonial", text: "Published customer feedback.", client: "Approved customer label", type: "", location: "", rating: 5 }],
    });

    for (const [brandPartnersEnabled, testimonialsEnabled] of [[false, false], [true, false], [false, true], [true, true]]) {
      render({ ...content, brandPartnersEnabled, testimonialsEnabled });
      const brandSection = container.querySelector('[data-home-section="brand_partners"]');
      const testimonialSection = container.querySelector('[data-home-section="testimonials"]');
      expect(Boolean(brandSection)).toBe(brandPartnersEnabled);
      expect(Boolean(testimonialSection)).toBe(testimonialsEnabled);
      if (brandSection) expect(brandSection).toHaveTextContent("Published partner");
      if (testimonialSection) expect(testimonialSection).toHaveTextContent("Published customer feedback.");
    }

    render({ ...content, brandPartnersEnabled: true, testimonialsEnabled: true, brandPartners: [], testimonials: [] });
    expect(container.querySelector('[data-home-section="brand_partners"]')).toBeNull();
    expect(container.querySelector('[data-home-section="testimonials"]')).toBeNull();
  });
});
