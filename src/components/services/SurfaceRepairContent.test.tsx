import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SurfaceRepairContent from "./SurfaceRepairContent";
import { surfaceRepairServiceForLanguage } from "@/data/surfaceRepairService";
import { surfaceRepairPageText } from "@/i18n/surfaceRepairPageText";
import { confirmProtectedNavigation, hasProtectedChanges, NAVIGATION_CONFIRM_EVENT, type NavigationConfirmRequest } from "@/lib/navigationProtection";

const state = vi.hoisted(() => ({ language: "zh" as "zh" | "en" }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/contexts/PublicChromeContext", () => ({ usePageConsultation: () => undefined }));
vi.mock("@/hooks/useSiteSettings", () => ({ useSiteSettings: () => ({ whatsapp_url: (text: string) => `https://wa.me/601128853888?text=${encodeURIComponent(text)}` }) }));
vi.mock("@/lib/analytics", () => ({ trackCtaClick: vi.fn() }));
vi.mock("@/components/SmartImage", () => ({ default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} /> }));
vi.mock("@/components/ImmersiveHero", () => ({ default: ({ children }: { children: React.ReactNode }) => <section>{children}</section> }));
vi.mock("@/components/PageMeta", () => ({ default: ({ title }: { title: string }) => <div data-meta={title} /> }));
vi.mock("@/components/JsonLd", () => ({ JsonLdBreadcrumb: () => null, JsonLdService: () => null, JsonLdFAQ: () => null }));
let container: HTMLDivElement;
let root: Root;
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
beforeEach(() => { state.language = "zh"; Element.prototype.scrollIntoView = vi.fn(); });
afterEach(() => { act(() => root?.unmount()); container?.remove(); vi.restoreAllMocks(); });
async function render() {
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
  const service = { ...surfaceRepairServiceForLanguage(state.language), seoTitle: "Published repair SEO", faqs: [{ q: "Published FAQ", a: "Published answer" }] };
  await act(async () => { root.render(<MemoryRouter><SurfaceRepairContent service={service} /></MemoryRouter>); });
}
const query = <T extends Element = HTMLElement>(selector: string) => container.querySelector<T>(selector)!;
async function click(selector: string) { await act(async () => query<HTMLElement>(selector).click()); }
async function input(selector: string, value: string) {
  await act(async () => {
    const element = query<HTMLInputElement | HTMLTextAreaElement>(selector);
    const proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function generate() { await click(".generate"); }

describe("Repair service interactions", () => {
  it("keeps the focused draft, risk and edited message through language changes and a cancelled exit", async () => {
    await render(); await input("#repair-region", "KL"); await input("#repair-description", "My authored description");
    await click(".check input"); await generate(); await input("#repair-message", "My authored message");
    await act(async () => { await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); });
    const region = query<HTMLInputElement>("#repair-region"); region.focus();
    state.language = "en";
    await act(async () => root.render(<MemoryRouter><SurfaceRepairContent service={surfaceRepairServiceForLanguage("en")} /></MemoryRouter>));
    expect(query("#repair-region")).toBe(region); expect(document.activeElement).toBe(region);
    expect(region.value).toBe("KL"); expect(query<HTMLTextAreaElement>("#repair-description").value).toBe("My authored description");
    expect(query<HTMLInputElement>(".check input").checked).toBe(true);
    expect(query<HTMLTextAreaElement>("#repair-message").value).toBe("My authored message");
    expect(hasProtectedChanges()).toBe(true);
    window.addEventListener(NAVIGATION_CONFIRM_EVENT, event => (event as CustomEvent<NavigationConfirmRequest>).detail.resolve(false), { once: true });
    expect(await confirmProtectedNavigation()).toBe(false);
    expect(query<HTMLTextAreaElement>("#repair-message").value).toBe("My authored message");
    state.language = "zh";
    await act(async () => root.render(<MemoryRouter><SurfaceRepairContent service={surfaceRepairServiceForLanguage("zh")} /></MemoryRouter>));
    expect(query<HTMLTextAreaElement>("#repair-message").value).toBe("My authored message");
  });
  for (const lang of ["zh", "en"] as const) {
    it(`${lang}: shows all eight categories without a parent collapse control and uses published content`, async () => {
      state.language = lang; await render();
      expect(query("h1")).toHaveTextContent(surfaceRepairServiceForLanguage(lang).title);
      expect(query(".all-scope").tagName).toBe("SECTION");
      expect(query(".all-scope").querySelector(":scope > summary")).toBeNull();
      expect(container.querySelectorAll(".service > summary")).toHaveLength(8);
      expect(query("[data-meta]")).toHaveAttribute("data-meta", "Published repair SEO");
      expect(query(".faq")).toHaveTextContent("Published FAQ");
      expect(query(".damage-card img").getAttribute("alt")).toBeTruthy();
      expect(query<HTMLAnchorElement>(".fcd-design-hero__primary").href).toContain("https://wa.me/601128853888?");
    });
  }
  it("requires a location, pre-fills a selected damage and keeps manually edited damage", async () => {
    await render(); await generate();
    expect(query("#repair-region")).toHaveAttribute("aria-invalid", "true");
    expect(container.querySelector("#repair-message")).toBeNull();
    await click(".damage-card .text-link");
    expect(query<HTMLDetailsElement>(".tool").open).toBe(true);
    expect(query<HTMLTextAreaElement>("#repair-description").value).toBe(surfaceRepairPageText.zh.damageExamples[0].title);
    await input("#repair-description", "我的补充说明"); await click(".damage-card:nth-child(2) .text-link");
    expect(query<HTMLTextAreaElement>("#repair-description").value).toBe("我的补充说明");
    await input("#repair-region", "Kuala Lumpur"); await generate();
    expect(query<HTMLTextAreaElement>("#repair-message").value).toContain("Kuala Lumpur");
    expect(query<HTMLTextAreaElement>("#repair-message").value).toContain("我的补充说明");
  });
  it("protects an edited message until the user explicitly replaces it", async () => {
    await render(); await input("#repair-region", "KL"); await generate();
    await input("#repair-message", "请保留这段文字"); await input("#repair-region", "PJ"); await generate();
    expect(query<HTMLTextAreaElement>("#repair-message").value).toBe("请保留这段文字");
    expect(query(".replace-warning")).not.toBeNull();
    await click(".replace-warning button:first-child");
    expect(container.querySelector(".replace-warning")).toBeNull();
    expect(new URL(query<HTMLAnchorElement>(".result a").href).searchParams.get("text")).toBe("请保留这段文字");
    await generate(); await click(".replace-warning button:last-child");
    expect(query<HTMLTextAreaElement>("#repair-message").value).toContain("PJ");
    expect(query<HTMLTextAreaElement>("#repair-message").value).not.toContain("请保留这段文字");
  });
  it("reports clipboard success and offers manual selection if clipboard access fails", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await render(); await input("#repair-region", "KL"); await generate();
    await click(".result > .actions button");
    expect(writeText).toHaveBeenCalledWith(query<HTMLTextAreaElement>("#repair-message").value);
    expect(query(".status")).toHaveTextContent(surfaceRepairPageText.zh.copiedLabel);
    writeText.mockRejectedValueOnce(new Error("denied")); await click(".result > .actions button");
    expect(query(".status")).toHaveTextContent(surfaceRepairPageText.zh.copyError);
    expect(document.activeElement).toBe(query("#repair-message"));
  });
});
