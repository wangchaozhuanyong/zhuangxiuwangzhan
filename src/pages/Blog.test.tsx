import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { blogEditorialMediaText } from "@/i18n/blogEditorialMediaText";
import { PublicChromeProvider } from "@/contexts/PublicChromeContext";
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
