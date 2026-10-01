import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { blogEditorialMediaText } from "@/i18n/blogEditorialMediaText";
import { PublicChromeProvider } from "@/contexts/PublicChromeContext";
import { BLOG_TOPIC_KEYS, resolveBlogTopic } from "@/lib/blogTopics";
import { blogPageText } from "@/i18n/blogPageText";
import { translateDisplayText } from "@/i18n/displayLabels";
import Blog from "./Blog";

const fixture = vi.hoisted(() => ({ language: "en", posts: [] as Record<string, unknown>[] }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: fixture.language }) }));
vi.mock("@/hooks/usePublishedContent", () => ({
  usePublishedSitePage: () => ({ data: null }),
  usePublishedBlogPosts: () => ({ data: fixture.posts, isLoading: false, isError: false, refetch: vi.fn() }),
}));
vi.mock("@/components/PageMeta", () => ({ default: () => null }));
vi.mock("@/components/JsonLd", () => ({ JsonLdBreadcrumb: () => null }));

const makePost = (slug: string, image: string) => ({
  slug, image, imageAlt: "CMS-owned alt", title: "CMS title", excerpt: "CMS excerpt",
  category: "kitchen", date: "2026-09-25", readTime: "5 min",
});

// Published source order from the source-bound 38-row snapshot, 2026-10-01.
// Covers and excerpts are test placeholders; this fixture makes no CMS body claim.
const sourceOrderedSlugs = [
  "renovation-handover-defect-checklist-malaysia", "office-fit-out-me-it-planning-checklist-malaysia",
  "bathroom-waterproofing-drainage-planning-malaysia", "bathroom-renovation-quotation-checklist-malaysia",
  "kitchen-renovation-quotation-checklist-malaysia", "restaurant-fit-out-planning-checklist-malaysia",
  "rental-unit-renovation-kl", "renovation-payment-schedule-malaysia", "custom-wardrobe-price-malaysia",
  "office-reinstatement-vs-renovation", "shoplot-renovation-permit-malaysia", "landed-house-renovation-selangor",
  "dry-wet-kitchen-renovation-malaysia", "area-guide-kl-selangor-renovation", "renovation-quotation-checklist-malaysia",
  "built-in-furniture-small-condo-storage", "old-house-renovation-hidden-costs-malaysia", "bathroom-leakage-renovation-malaysia",
  "kitchen-cabinet-price-malaysia", "condo-renovation-management-approval-malaysia", "klang-valley-renovation-cost-2026",
  "renovation-materials-malaysia", "shop-renovation-before-opening", "selangor-office-fit-out-tips",
  "bathroom-waterproofing-guide", "old-house-renovation-checklist", "kitchen-cabinet-material-guide",
  "malaysia-renovation-budget-guide", "modern-warm-minimalist-home-design-malaysia", "small-condo-storage-design-ideas",
  "artistic-wall-coating-guide-remmers", "built-in-cabinet-cost-malaysia", "how-to-choose-renovation-contractor-kl",
  "how-to-plan-condo-renovation-kl", "renovation-permit-dbkl-guide", "spc-vinyl-vs-laminate-flooring",
  "office-renovation-checklist-malaysia", "feature-wall-ideas-2025",
];

const additionalSlugs = [
  "kitchen-cabinet-price-malaysia", "built-in-cabinet-cost-malaysia",
  "how-to-plan-condo-renovation-kl", "how-to-choose-renovation-contractor-kl",
];
const makeArchive = (language: "en" | "zh") => sourceOrderedSlugs.map((slug) => ({
  ...makePost(slug, "/images/services/kitchen-renovation.webp"), category: resolveBlogTopic("", slug),
  title: slug === "built-in-cabinet-cost-malaysia"
    ? language === "en" ? "Built-In Cabinet Cost in Malaysia" : "马来西亚定制内嵌柜价格指南"
    : `${language} published title ${slug}`,
}));

describe("source-bound topic additions and unchanged archive controls", () => {
  it.each(["en", "zh"] as const)("keeps all 18 original guides in order and adds four CMS-backed references in %s", (language) => {
    fixture.language = language;
    fixture.posts = makeArchive(language);
    expect(render()).toHaveLength(9);
    const topics = Array.from(container.querySelectorAll(".fc-blog-topic-card"));
    expect(topics).toHaveLength(6);
    expect(topics.map((topic) => topic.querySelectorAll("div > a").length)).toEqual([4, 4, 5, 3, 3, 3]);
    for (const [index, topic] of topics.entries()) {
      const expectedOld = fixture.posts.filter((post) => post.category === BLOG_TOPIC_KEYS[index]).slice(0, 3);
      const guides = Array.from(topic.querySelectorAll("div > a"));
      expect(guides.slice(0, 3).map((link) => link.getAttribute("href"))).toEqual(expectedOld.map((post) => `/${language}/blog/${post.slug}`));
    }
    for (const slug of additionalSlugs) {
      const guide = container.querySelector(`.fc-blog-topic-card div > a[href='/${language}/blog/${slug}']`);
      expect(guide).toHaveTextContent(translateDisplayText(String(fixture.posts.find((post) => post.slug === slug)?.title), language));
    }
    expect(container.querySelector(".fc-blog-topics")).not.toHaveTextContent("Factors");
  });

  it.each(["en", "zh"] as const)("preserves archive order and Load More increments of nine in %s", (language) => {
    fixture.language = language;
    fixture.posts = makeArchive(language);
    render();
    for (const count of [18, 27, 36, 38]) {
      const button = Array.from(container.querySelectorAll("button")).find((item) => item.textContent === blogPageText[language].loadMore);
      expect(button).toBeTruthy();
      act(() => button?.click());
      const cards = Array.from(container.querySelectorAll(".fc-route-card"));
      expect(cards).toHaveLength(count);
      expect(cards.map((card) => card.getAttribute("href"))).toEqual(sourceOrderedSlugs.slice(0, count).map((slug) => `/${language}/blog/${slug}`));
    }
    expect(Array.from(container.querySelectorAll("button")).some((item) => item.textContent === blogPageText[language].loadMore)).toBe(false);
  });

  it("preserves contractor taxonomy when selecting the budget topic", () => {
    fixture.language = "en";
    fixture.posts = makeArchive("en");
    render();
    const topic = container.querySelector<HTMLButtonElement>(".fc-blog-topic-card button");
    expect(topic).toHaveAttribute("aria-controls", "blog-articles");
    act(() => topic?.click());
    expect(topic).toHaveAttribute("aria-pressed", "true");
    const listed = Array.from(container.querySelectorAll(".fc-route-card a")).map((a) => a.getAttribute("href"));
    expect(listed).not.toContain("/en/blog/how-to-choose-renovation-contractor-kl");
    expect(container.querySelector(".fc-blog-topic-card div > a[href='/en/blog/how-to-choose-renovation-contractor-kl']")).toBeTruthy();
    expect(container.querySelector("#blog-articles")).toHaveAttribute("tabindex", "-1");
  });

  it("uses a changed CMS title rather than a static pinned title", () => {
    fixture.language = "en";
    fixture.posts = makeArchive("en").map((post) => post.slug === "built-in-cabinet-cost-malaysia" ? { ...post, title: "Revised CMS cabinet comparison" } : post);
    render();
    expect(container.querySelector(".fc-blog-topic-card div > a[href='/en/blog/built-in-cabinet-cost-malaysia']")).toHaveTextContent("Revised CMS cabinet comparison");
  });
});
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
const render = () => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<MemoryRouter><PublicChromeProvider isAdminRoute={false} routeKey="blog"><Blog /></PublicChromeProvider></MemoryRouter>));
  return Array.from(container.querySelectorAll(".fc-route-card"));
};
afterEach(() => { act(() => root?.unmount()); container?.remove(); });

describe("two exact Blog list card disclosure prerequisites", () => {
  it.each(["en", "zh"])("discloses both approved CMS covers in %s while preserving CMS alt", (language) => {
    fixture.language = language;
    fixture.posts = [
      makePost("kitchen-cabinet-price-malaysia", "/images/blog/editorial-concepts-20260926-v1/kitchen-cabinet-price-malaysia/kitchen-cover.webp"),
      makePost("office-renovation-checklist-malaysia", "/images/blog/editorial-concepts-20260926-v1/office-renovation-checklist-malaysia/office-cover.webp"),
    ];
    const cards = render();
    expect(cards).toHaveLength(2);
    for (const [index, card] of cards.entries()) {
      expect(card.querySelector(".fc-route-card-disclosure")).toHaveTextContent(blogEditorialMediaText.disclosure[language as "en" | "zh"]);
      expect(card.querySelector("img")).toHaveAttribute("alt", "CMS-owned alt");
      expect(card.querySelector("img")).toHaveAttribute("src", fixture.posts[index].image);
    }
  });
  it("leaves legacy covers, unrelated slugs and a swapped topic image without new disclosure", () => {
    fixture.language = "en";
    fixture.posts = [
      makePost("kitchen-cabinet-price-malaysia", "/images/services/kitchen-renovation.webp"),
      makePost("office-renovation-checklist-malaysia", "/images/blog/editorial-concepts-20260926-v1/kitchen-cabinet-price-malaysia/kitchen-cover.webp"),
      makePost("kitchen-cabinet-price-malaysia-other", "/images/blog/editorial-concepts-20260926-v1/kitchen-cabinet-price-malaysia/kitchen-cover.webp"),
    ];
    expect(render()).toHaveLength(3);
    expect(container.querySelector(".fc-route-card-disclosure")).toBeNull();
  });
});
