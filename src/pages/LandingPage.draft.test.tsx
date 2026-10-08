import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LandingPage from "./LandingPage";
import { landingPageText } from "@/i18n/landingPageText";

const state = vi.hoisted(() => ({ language: "en" as "en" | "zh", pending: false, failed: false, missing: false }));
const fixture = { title: "Fixture campaign", subtitle: "Fixture scope", description: "Fixture details", heroImage: "/images/fixture.webp", benefits: [], relatedProjects: [], faqs: [] };
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/hooks/usePublishedContent", () => ({ usePublishedLandingPageBySlug: () => ({
  data: state.pending || state.failed ? undefined : state.missing ? null : fixture,
  isPending: state.pending, isInitialError: state.failed,
}) }));
vi.mock("@/hooks/useSiteSettings", () => ({ useSiteSettings: () => ({ whatsapp_url: () => "https://example.test/contact" }) }));
vi.mock("@/hooks/useFormGuard", () => ({ useFormGuard: () => ({ startedAt: 123 }) }));
vi.mock("@/lib/leadApi", () => ({ submitQuoteRequest: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ trackQuoteFormSubmit: vi.fn(), trackCtaClick: vi.fn() }));
vi.mock("@/lib/turnstile", () => ({ preloadTurnstile: () => Promise.resolve() }));
vi.mock("@/components/PageMeta", () => ({ default: () => null }));
vi.mock("@/components/SmartImage", () => ({ default: () => null }));
vi.mock("@/components/ImmersiveHero", () => ({ default: ({ children }: { children: React.ReactNode }) => <section>{children}</section> }));
vi.mock("@/components/scheme-a/SchemeARoutePrimitives", () => ({ SchemeAFaqList: () => null, SchemeANumberList: () => null }));
let container: HTMLDivElement;
let root: Root;
beforeEach(() => { vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); state.language = "en"; state.pending = false; state.failed = false; state.missing = false; Element.prototype.scrollIntoView = vi.fn(); container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
const render = async () => { await act(async () => root.render(<MemoryRouter initialEntries={["/en/landing/custom-campaign-fixture"]}><Routes><Route path="/:lang/landing/:slug" element={<LandingPage />} /></Routes></MemoryRouter>)); };

describe("CMS campaign parent retains the form during language reads", () => {
  it("keeps the same focused field and translated validation while pending or failed", async () => {
    await render();
    const input = container.querySelector<HTMLInputElement>("#landing-quote-name")!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "Keep this draft");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    input.focus(); state.language = "zh"; state.pending = true; await render();
    expect(container.querySelector("#landing-quote-name")).toBe(input); expect(input.value).toBe("Keep this draft");
    expect(document.activeElement).toBe(input); expect(container.textContent).toContain(landingPageText.zh.formRequired);
    state.pending = false; state.failed = true; await render();
    expect(container.querySelector("#landing-quote-name")).toBe(input); expect(input.value).toBe("Keep this draft");
    state.failed = false; await render();
    expect(container.querySelector("#landing-quote-name")).toBe(input); expect(input.value).toBe("Keep this draft");
  });
  it("uses the existing missing-page state after a successful missing record", async () => {
    await render(); state.pending = true; await render();
    state.pending = false; state.missing = true; await render();
    expect(container.querySelector("#landing-quote-name")).toBeNull();
    expect(container.textContent).toContain(landingPageText.en.notFound);
  });
});
