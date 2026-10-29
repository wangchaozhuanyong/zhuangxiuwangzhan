import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SchemeAFooterPrelude } from "./SchemeAPublicChrome";
import { schemeAChromeText } from "@/i18n/schemeAText";
import type { PublishedCtaBlock } from "@/lib/homeContentApi";

const fixture = vi.hoisted(() => ({ language: "en" as "zh" | "en" | "ms", consultation: false, cta: null as PublishedCtaBlock | null, read: vi.fn() }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: fixture.language }) }));
vi.mock("@/contexts/PublicChromeContext", () => ({ usePublicChrome: () => ({ hasPageConsultation: fixture.consultation }) }));
vi.mock("@/hooks/useSiteSettings", () => ({ useSiteSettings: () => ({ whatsapp_url: () => "https://wa.me/60123456789" }) }));
vi.mock("@/hooks/usePublishedCtaBlock", () => ({ usePublishedCtaBlock: (...args: unknown[]) => { fixture.read(...args); return { data: fixture.cta }; } }));
vi.mock("@/components/SmartImage", () => ({ default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} /> }));
let root: Root; let node: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); fixture.language = "en"; fixture.consultation = false; fixture.read.mockClear();
  fixture.cta = { id: "synthetic", block_key: "home_final", title: "Saved invitation", description: "Saved explanation", primary_label: "Saved quote", primary_url: "/quote#quote-form", secondary_label: "Saved contact", secondary_url: "/contact#contact-form", image_url: "/saved-panorama.webp" };
  node = document.createElement("div"); document.body.append(node); root = createRoot(node);
});
afterEach(async () => { await act(async () => root.unmount()); node.remove(); vi.unstubAllGlobals(); });
const render = async (path: string) => { await act(async () => root.render(<MemoryRouter initialEntries={[path]}><SchemeAFooterPrelude /></MemoryRouter>)); };

describe("published home/about invitation delivery", () => {
  it.each(["zh", "en", "ms"] as const)("uses the saved %s content and localizes both actions in the existing panorama", async lang => {
    fixture.language = lang; await render(`/${lang}`);
    expect(node.querySelector("h2")).toHaveTextContent("Saved invitation");
    expect(node.querySelector(".scheme-a-footer__invitation-copy")).toHaveTextContent("Saved explanation");
    expect(node.querySelector("img")).toHaveAttribute("src", "/saved-panorama.webp");
    expect(node.querySelectorAll("a")[0]).toHaveAttribute("href", `/${lang}/quote#quote-form`);
    expect(node.querySelectorAll("a")[1]).toHaveAttribute("href", `/${lang}/contact#contact-form`);
    expect(fixture.read).toHaveBeenCalledWith(lang, "home_final", { enabled: true });
  });
  it("uses the about invitation only on the about route", async () => {
    await render("/en/about"); expect(node.querySelector("h2")).toHaveTextContent("Saved invitation");
    expect(fixture.read).toHaveBeenCalledWith("en", "about_final", { enabled: true });
  });
  it("does not leak a cached home/about invitation onto unrelated pages", async () => {
    await render("/en/projects"); expect(node.querySelector("h2")).toHaveTextContent(schemeAChromeText.en.footerTitle);
    expect(node).not.toHaveTextContent("Saved invitation");
  });
  it("retains the original invitation when no published record is available", async () => {
    fixture.cta = null; await render("/en/about"); expect(node.querySelector("h2")).toHaveTextContent(schemeAChromeText.en.footerTitle);
    expect(node.querySelectorAll("a")[1]).toHaveAttribute("href", "https://wa.me/60123456789");
  });
  it("does not render another invitation when the page already has consultation", async () => {
    fixture.consultation = true; await render("/en/about"); expect(node).toBeEmptyDOMElement();
  });
  it("uses safe existing destinations and image when stored URLs have executable schemes", async () => {
    fixture.cta = { ...fixture.cta!, primary_url: "javascript:alert(1)", secondary_url: "data:text/html,private", image_url: "javascript:alert(2)" };
    await render("/en/about"); expect(node.innerHTML).not.toContain("javascript:"); expect(node.innerHTML).not.toContain("data:text/html");
    expect(node.querySelectorAll("a")[0]).toHaveAttribute("href", "/en/quote#quote-form");
    expect(node.querySelectorAll("a")[1]).toHaveAttribute("href", "https://wa.me/60123456789");
  });
});
