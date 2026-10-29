import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PhotoEnquiryLink from "./PhotoEnquiryLink";
import ContactEntryPanel from "./ContactEntryPanel";
import MobileActionBar from "./MobileActionBar";
import CTABanner from "./blocks/CTABanner";
import { whatsappOpeningText } from "@/i18n/whatsappOpeningText";
import { trackCtaClick } from "@/lib/analytics";
import type { Language } from "@/i18n/routes";

const state = vi.hoisted(() => ({ language: "zh" as Language }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/hooks/useSiteSettings", async () => {
  const { resolveSiteSettings } = await import("@/lib/siteSettingsApi");
  return { useSiteSettings: () => resolveSiteSettings({ whatsapp_number: "601128853888" }, state.language) };
});
vi.mock("@/contexts/PublicChromeContext", () => ({ usePageConsultation: () => undefined, usePublicDialogLayer: () => undefined, usePublicChrome: () => ({ pageWhatsAppMessage: "Old furniture product message" }) }));
vi.mock("@/lib/analytics", () => ({ trackCtaClick: vi.fn() }));
vi.mock("@/components/SmartImage", () => ({ default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} /> }));

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.clearAllMocks(); window.sessionStorage.clear();
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

async function render(language: Language, query: string) {
  state.language = language;
  window.history.replaceState({}, "", `/${language}/furniture/product/synthetic${query}`);
  await act(async () => root.render(<MemoryRouter initialEntries={[`/${language}/furniture/product/synthetic`]}>
    <PhotoEnquiryLink service="Kitchen dimensions: __" source="service_hero" />
    <CTABanner whatsappMessage="Old project scope, budget and photos" />
    <ContactEntryPanel message="Old cabinet message" onClose={() => undefined} onCloseAutoFocus={() => undefined} />
    <MobileActionBar />
  </MemoryRouter>));
}

describe("all automatic public contact components share one opening", () => {
  for (const language of ["zh", "en", "ms"] as const) {
    it.each(["google", "chatgpt", ""])(`${language}: keeps every contact link consistent for %s`, async source => {
      await render(language, source ? `?utm_source=${source}&utm_medium=cpc` : "");
      const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="https://wa.me/"]'));
      expect(links.length).toBeGreaterThanOrEqual(4);
      const channel = source === "google" ? "google_paid" : source === "chatgpt" ? "chatgpt_paid" : "unknown";
      for (const link of links) {
        expect(new URL(link.href).searchParams.get("text")).toBe(whatsappOpeningText(language, channel));
      }
      expect(document.body).not.toHaveTextContent("项目地点：__");
    });
  }

  it("records successful WeChat copying and QR opening without any message send", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const clipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    try {
      await render("zh", "?utm_source=chatgpt&utm_medium=cpc");
      const copy = document.querySelector<HTMLButtonElement>('[aria-label="复制微信号"]')!;
      expect(copy).not.toBeNull();
      await act(async () => copy.click());
      expect(writeText).toHaveBeenCalledOnce();
      expect(trackCtaClick).toHaveBeenCalledWith("wechat_copy", "contact_panel", { destination: "wechat" });
      const qr = document.querySelector<HTMLDetailsElement>("details.fc-contact-panel__qr")!;
      await act(async () => { qr.open = true; qr.dispatchEvent(new Event("toggle")); });
      expect(trackCtaClick).toHaveBeenCalledWith("wechat_qr_open", "contact_panel", { destination: "wechat" });
    } finally {
      if (clipboard) Object.defineProperty(navigator, "clipboard", clipboard);
      else Reflect.deleteProperty(navigator, "clipboard");
    }
  });
});
