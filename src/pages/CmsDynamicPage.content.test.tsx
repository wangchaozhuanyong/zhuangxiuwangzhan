import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CmsDynamicPage from "./CmsDynamicPage";
import type { PublishedCmsSection } from "@/lib/homeContentApi";

const state = vi.hoisted(() => ({ language: "en" as "en" | "zh", content: "", sections: [] as PublishedCmsSection[] }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/hooks/useInteractionQuery", () => ({ useInteractionQuery: () => ({
  data: { title: "Fixture page", path: "/fixture", description: "Fixture description", content: state.content, sections: state.sections },
  isLoading: false, isInitialError: false,
}) }));
vi.mock("@/lib/publicContentQueries", () => ({ publicContentQueries: { cmsPage: () => ({ queryKey: ["fixture"] }) } }));
vi.mock("@/components/PageMeta", () => ({ default: () => null }));
vi.mock("@/components/SmartImage", () => ({
  SmartImage: ({ src, alt, width, height, loading, targetAspectRatio }: { src: string; alt: string; width: number; height: number; loading: "eager" | "lazy"; targetAspectRatio: { width: number; height: number } }) =>
    <img src={src} alt={alt} width={width} height={height} loading={loading} data-aspect={`${targetAspectRatio.width}/${targetAspectRatio.height}`} />,
}));
vi.mock("@/components/scheme-a/SchemeARoutePrimitives", () => ({
  SchemeARouteHero: ({ title }: { title: string }) => <h1>{title}</h1>,
  SchemeASection: ({ title, children }: { title?: string; children: React.ReactNode }) => <section>{title && <h2>{title}</h2>}{children}</section>,
}));
let container: HTMLDivElement;
let root: Root;
beforeEach(() => { vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); container = document.createElement("div"); document.body.append(container); root = createRoot(container); state.sections = []; state.content = ""; state.language = "en"; });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
const render = async () => { await act(async () => root.render(<MemoryRouter><CmsDynamicPage /></MemoryRouter>)); };
const section = (type: string, content: Record<string, unknown>): PublishedCmsSection => ({
  id: type, section_type: type, section_key: type, title: "", content, settings: {}, sort_order: 0,
});

describe("dynamic CMS content within existing slots", () => {
  for (const language of ["en", "zh"] as const) {
    it(`${language}: renders every authored CTA in section order and preserves safe card links`, async () => {
      state.language = language; state.content = "Existing body slot";
      state.sections = [
        section("cta", { title: "CTA heading", primary_label: "Primary fixture", primary_url: "/quote?from=cms#quote-form", secondary_label: "Secondary fixture", secondary_url: "https://example.test/contact" }),
        { ...section("cta", { primary_label: "Later CTA", primary_url: "/later" }), id: "later-cta" },
        section("service_grid", { items: [{ title: "Internal card", url: "/services/kitchen" }, { title: "External card", url: "https://example.test/service" }, { title: "Unsafe card", url: "java\nscript:alert(1)" }] }),
      ];
      await render();
      const actions = container.querySelectorAll<HTMLAnchorElement>(".fc-route-action-panel a");
      expect(actions).toHaveLength(3); expect(actions[0]).toHaveTextContent("Primary fixture");
      expect(actions[0].getAttribute("href")).toBe(`/${language}/quote?from=cms#quote-form`);
      expect(actions[1]).toHaveTextContent("Secondary fixture"); expect(actions[1].href).toBe("https://example.test/contact");
      expect(actions[2]).toHaveTextContent("Later CTA"); expect(actions[2].getAttribute("href")).toBe(`/${language}/later`);
      expect(container.querySelectorAll(".fc-route-action-panel")).toHaveLength(2);
      expect(Array.from(container.querySelectorAll("section")).map((node) => node.textContent)).toEqual([
        "Existing body slot", "CTA headingPrimary fixtureSecondary fixture", "Later CTA", "01Internal card02External card03Unsafe card",
      ]);
      const titles = container.querySelectorAll(".fc-route-cms-list h3");
      expect(titles).toHaveLength(3);
      expect(titles[0].querySelector("a")?.getAttribute("href")).toBe(`/${language}/services/kitchen`);
      expect(titles[1].querySelector("a")?.getAttribute("href")).toBe("https://example.test/service");
      expect(titles[2].querySelector("a")).toBeNull(); expect(titles[2]).toHaveTextContent("Unsafe card");
      expect(container.querySelectorAll(".fc-route-cms-list svg, .fc-route-cms-list img")).toHaveLength(0);
    });
  }
  it("keeps invalid CTA targets as inert text in the same two slots", async () => {
    state.content = "Existing body slot";
    state.sections = [section("cta", { primary_label: "Unsafe primary", primary_url: "javascript:alert(1)", secondary_label: "Unsafe secondary", secondary_url: "data:text/html,payload" })];
    await render();
    const actions = container.querySelectorAll(".fc-route-action-panel a");
    expect(actions).toHaveLength(2);
    for (const action of actions) { expect(action.hasAttribute("href")).toBe(false); expect(action).toHaveAttribute("aria-disabled", "true"); }
  });
  it("renders a CTA-only page without inventing a heading, secondary action or body", async () => {
    state.sections = [section("cta", { primary_label: "Action", primary_url: "/quote" })];
    await render();
    expect(container.querySelectorAll(".fc-route-action-panel")).toHaveLength(1);
    expect(container.querySelectorAll(".fc-route-action-panel a")).toHaveLength(1);
    expect(container.querySelector(".fc-route-action-panel a")).toHaveAttribute("href", "/en/quote");
    expect(container.querySelector("h2")).toBeNull();
    expect(container.querySelector(".fc-route-cms-copy")).toBeNull();
  });
  for (const language of ["en", "zh"] as const) {
    it(`${language}: displays author-edited questions, answers and testimonial fields`, async () => {
      state.language = language;
      const question = language === "zh" ? "怎样报价？" : "How is the quotation prepared?";
      const answer = language === "zh" ? "先确认施工范围。" : "Confirm the work scope first.";
      state.sections = [section("faq", { items: [{ question, answer }] }), section("testimonials", { items: [{ name: "Owner fixture", role: "Homeowner", quote: "Quote fixture" }] })];
      await render();
      expect(container.querySelector("h3")).toHaveTextContent(question);
      expect(container.textContent).toContain(answer);
      expect(container.textContent).toContain("Owner fixture · Homeowner");
      expect(container.textContent).toContain("Quote fixture");
      expect(container.textContent).not.toContain("Item 1");
    });
  }
  for (const language of ["en", "zh"] as const) {
    it(`${language}: renders gallery images, card media and testimonial avatars from authored data`, async () => {
      state.language = language;
      const caption = language === "zh" ? "厨房空间" : "Kitchen space";
      const owner = language === "zh" ? "业主" : "Homeowner";
      state.sections = [
        section("gallery", { items: [{ image_url: "/images/gallery.webp", alt: caption }, { title: caption, description: "Gallery caption", image_url: "https://images.example.test/gallery.webp" }] }),
        section("service_grid", { items: [{ title: caption, image_url: "/images/card.webp", url: "/services/kitchen" }] }),
        section("testimonials", { items: [{ name: owner, role: "Owner", quote: "Authored review", image_url: "/images/owner.webp" }] }),
      ];
      await render();
      const images = container.querySelectorAll(".fc-route-cms-list img");
      expect(images).toHaveLength(4);
      expect(images[0]).toHaveAttribute("src", "/images/gallery.webp"); expect(images[0]).toHaveAttribute("alt", caption);
      expect(images[1]).toHaveAttribute("src", "https://images.example.test/gallery.webp"); expect(images[1]).toHaveAttribute("alt", caption);
      expect(images[2]).toHaveAttribute("alt", caption); expect(images[2]).toHaveAttribute("data-aspect", "16/10");
      expect(images[3].parentElement).toHaveClass("fc-route-cms-avatar");
      expect(images[3]).toHaveAttribute("alt", owner); expect(images[3]).toHaveAttribute("data-aspect", "1/1");
      expect(images[3]).toHaveAttribute("width", "72"); expect(images[3]).toHaveAttribute("height", "72");
      expect(images[0].parentElement?.parentElement?.querySelector("h3")).toBeNull();
      expect(container.textContent).not.toContain("Item 1");
    });
  }
  it("rejects unsafe or malformed image sources while retaining valid text and later images", async () => {
    state.sections = [section("gallery", { items: [
      null, [], {}, { image_url: "javascript:alert(1)" }, { image_url: "data:image/svg+xml,payload" },
      { image_url: "mailto:owner@example.test" }, { image_url: "tel:123" }, { image_url: "#fragment" },
      { image_url: "?image=1" }, { image_url: "https://[" }, { image_url: {} },
      { title: "Keep text", image_url: "java\nscript:alert(1)", url: "javascript:alert(1)" },
      { image_url: "/images/valid.webp" }, { title: "No image provided" },
    ] })];
    await render();
    expect(container.querySelectorAll(".fc-route-cms-list > div")).toHaveLength(3);
    expect(container.querySelectorAll("img")).toHaveLength(1);
    expect(container.querySelector("img")).toHaveAttribute("src", "/images/valid.webp");
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect(container.querySelector("h3")).toHaveTextContent("Keep text");
    expect(container.querySelector("h3 a")).toBeNull();
    expect(container.textContent).not.toMatch(/\[object Object\]|Item 1/);
  });
  it("does not invent targets for missing CTA URLs or actions for missing labels", async () => {
    state.sections = [section("cta", { title: "Authored heading", primary_label: "Unavailable action", primary_url: {}, secondary_url: "/contact" })];
    await render();
    expect(container.querySelectorAll(".fc-route-action-panel a")).toHaveLength(1);
    expect(container.querySelector("a")).toHaveAttribute("aria-disabled", "true");
    expect(container.querySelector("a")?.hasAttribute("href")).toBe(false);
    expect(container.querySelector("h2")).toHaveTextContent("Authored heading");
  });
  it("normalizes authored section types and preserves the existing no-CTA fallback", async () => {
    state.content = "Legacy body";
    state.sections = [section(" TESTIMONIALS ", { items: [{ name: "Owner", quote: "Review", image_url: "/images/avatar.webp" }] })];
    await render();
    expect(container.querySelector(".fc-route-cms-avatar img")).toBeTruthy();
    expect(container.querySelectorAll(".fc-route-action-panel a")).toHaveLength(2);
    expect(container.querySelector(".fc-route-action-panel a")).toHaveAttribute("href", "/en/quote#quote-form");
  });
  it("skips malformed entries locally and renders later valid content", async () => {
    state.sections = [section("service_grid", { items: [null, [], 8, {}, "Text fixture", { title: "Valid item", description: "Visible body" }, { title: {}, description: [] }] })];
    await render();
    expect(container.querySelectorAll("h3")).toHaveLength(2);
    expect(container.textContent).toContain("Text fixture");
    expect(container.textContent).toContain("Visible body");
    expect(container.textContent).not.toMatch(/\[object Object\]|Item 1/);
  });
  it("preserves the existing section slots for heading/body and strips unsafe rich links", async () => {
    state.sections = [section("rich_text", { heading: "Heading fixture", body: '<p>Body fixture <a href="java&#10;script:alert(1)">Unsafe</a></p>' })];
    await render();
    expect(container.querySelector("h2")).toHaveTextContent("Heading fixture");
    expect(container.textContent).toContain("Body fixture");
    expect(container.querySelector("a")?.hasAttribute("href")).toBe(false);
    expect(container.querySelectorAll(".fc-route-cms-copy")).toHaveLength(1);
  });
});
