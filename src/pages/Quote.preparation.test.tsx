import { act } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { quotePageText } from "@/i18n/quotePageText";
import { PublicChromeProvider } from "@/contexts/PublicChromeContext";
import Quote from "@/pages/Quote";

vi.mock("@/hooks/usePublishedContent", () => ({ usePublishedSitePage: () => ({ data: undefined, isLoading: false }) }));
vi.mock("@/hooks/useSiteSettings", () => ({ useSiteSettings: () => ({
  short_address: "Test office", phone_display: "Test phone", phone_href: "tel:+601100000000",
  whatsapp_url: () => "https://wa.me/601100000000",
}) }));
vi.mock("@/hooks/useFormGuard", () => ({ useFormGuard: () => ({ startedAt: 0 }) }));
vi.mock("@/hooks/use-scroll-reveal", () => ({ useScrollReveal: () => ({ ref: { current: null }, isVisible: true }) }));
vi.mock("@/lib/turnstile", () => ({ preloadTurnstile: () => Promise.resolve() }));
vi.mock("@/lib/analytics", () => ({ trackCtaClick: vi.fn(), trackQuoteFormSubmit: vi.fn() }));
vi.mock("@/lib/leadApi", () => ({ submitQuoteRequest: vi.fn(() => { throw new Error("No submission allowed in this test"); }) }));

const bytes = readFileSync(resolve("drafts/seo/fc-20261003-quote-preparation-v16-source-binding-v1/approved-content-input.json"));
const approved = JSON.parse(bytes.toString()) as {
  changes: Array<{ language: "en" | "zh"; before: { insert_after_exact_text: string; insert_before_exact_heading: string }; after: { heading: string; paragraphs: string[]; link_anchor: string; link_href: string } }>;
};

describe("quote preparation approved content and language ownership", () => {
  it("uses the unchanged independently approved V16 input", () => {
    expect(createHash("sha256").update(bytes).digest("hex")).toBe("3a67770e6dc3c310bb287adb1afb14c1ca41081b14ec75f7477f0b8bea62789f");
  });

  for (const change of approved.changes) {
    it(`renders the exact ${change.language} paragraphs once at the approved anchors with a same-language link`, () => {
      const language = change.language;
      window.history.replaceState({}, "", `/${language}/quote`);
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      try {
        act(() => root.render(
          <HelmetProvider><LanguageProvider>
            <PublicChromeProvider isAdminRoute={false} routeKey="/quote">
              <MemoryRouter initialEntries={[`/${language}/quote`]}><Quote /></MemoryRouter>
            </PublicChromeProvider>
          </LanguageProvider></HelmetProvider>,
        ));
        const sections = container.querySelectorAll('section[aria-labelledby="quote-preparation-title"]');
        expect(sections).toHaveLength(1);
        const section = sections[0];
        expect(section.querySelector("h3")?.textContent).toBe(change.after.heading);
        expect(Array.from(section.querySelectorAll("p"), node => node.textContent)).toEqual(change.after.paragraphs);
        expect(section.previousElementSibling?.lastElementChild?.textContent).toBe(change.before.insert_after_exact_text);
        expect(section.parentElement?.nextElementSibling?.querySelector("h3")?.textContent).toBe(change.before.insert_before_exact_heading);
        const links = section.querySelectorAll("a");
        expect(links).toHaveLength(1);
        expect(links[0].textContent).toBe(change.after.link_anchor);
        expect(links[0].getAttribute("href")).toBe(change.after.link_href);
        expect(container.querySelectorAll(`main a[href="${change.after.link_href}"]`)).toHaveLength(1);
        expect(section.querySelectorAll("form,input,textarea,select,button,script")).toHaveLength(0);
        expect(container.querySelectorAll("form")).toHaveLength(1);
        expect(container.querySelectorAll("form input,form select,form textarea,form button")).toHaveLength(10);
        expect(container.querySelector("#quote-privacy-note")?.textContent).toContain(quotePageText[language].privacyNote);
        expect(container.querySelector("#quote-details")).toBeTruthy();
        expect(container.querySelector('input[type="file"]')).toBeNull();
      } finally {
        act(() => root.unmount());
        container.remove();
      }
    });
  }
});
