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
    it(`${language}: binds the first CTA to the existing two action slots and card links to their titles`, async () => {
      state.language = language; state.content = "Existing body slot";
      state.sections = [
        section("cta", { title: "CTA heading", primary_label: "Primary fixture", primary_url: "/quote?from=cms#quote-form", secondary_label: "Secondary fixture", secondary_url: "https://example.test/contact" }),
        { ...section("cta", { primary_label: "Later CTA", primary_url: "/later" }), id: "later-cta" },
        section("service_grid", { items: [{ title: "Internal card", url: "/services/kitchen" }, { title: "External card", url: "https://example.test/service" }, { title: "Unsafe card", url: "java\nscript:alert(1)" }] }),
      ];
      await render();
      const actions = container.querySelectorAll<HTMLAnchorElement>(".fc-route-action-panel a");
      expect(actions).toHaveLength(2); expect(actions[0]).toHaveTextContent("Primary fixture");
      expect(actions[0].getAttribute("href")).toBe(`/${language}/quote?from=cms#quote-form`);
      expect(actions[1]).toHaveTextContent("Secondary fixture"); expect(actions[1].href).toBe("https://example.test/contact");
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
  it("does not add an action panel when the page has no existing body slot", async () => {
    state.sections = [section("cta", { title: "CTA", primary_label: "Action", primary_url: "/quote" })];
    await render();
    expect(container.querySelector(".fc-route-action-panel")).toBeNull();
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
