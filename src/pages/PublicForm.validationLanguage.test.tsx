import { act } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { quotePageText } from "@/i18n/quotePageText";
import { contactPageText } from "@/i18n/contactPageText";
import { PublicChromeProvider } from "@/contexts/PublicChromeContext";
import { submitContactLead, submitQuoteRequest } from "@/lib/leadApi";
import Contact from "@/pages/Contact";
import Quote from "@/pages/Quote";

vi.mock("@/hooks/usePublishedContent", () => ({ usePublishedSitePage: () => ({ data: undefined, isLoading: false }) }));
vi.mock("@/hooks/useSiteSettings", () => ({ useSiteSettings: () => ({
  address: "QA office", short_address: "QA office", phone_display: "QA phone",
  phone_href: "tel:+601100000000", email: "qa@example.com", business_hours: "QA hours",
  whatsapp_url: () => "https://wa.me/601100000000",
}) }));
vi.mock("@/hooks/useFormGuard", () => ({ useFormGuard: () => ({ startedAt: 0 }) }));
vi.mock("@/hooks/use-scroll-reveal", () => ({ useScrollReveal: () => ({ ref: { current: null }, isVisible: true }) }));
vi.mock("@/lib/turnstile", () => ({ preloadTurnstile: () => Promise.resolve() }));
vi.mock("@/lib/instantScroll", () => ({ focusElementByIdWhenReady: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ trackCtaClick: vi.fn(), trackQuoteFormSubmit: vi.fn(), trackContactFormSubmit: vi.fn() }));
vi.mock("@/lib/leadApi", () => ({ submitContactLead: vi.fn(), submitQuoteRequest: vi.fn() }));

function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  return <button data-testid="language-switch" onClick={() => setLanguage(language === "zh" ? "en" : "zh")}>Switch</button>;
}

const input = (element: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
};

describe("public form validation follows language without losing draft inputs", () => {
  for (const kind of ["quote", "contact"] as const) {
    for (const startingLanguage of ["zh", "en"] as const) {
      it(`${kind}: ${startingLanguage} errors translate immediately in both directions; invalid forms never submit`, async () => {
        vi.clearAllMocks();
        window.history.replaceState({}, "", `/${startingLanguage}/${kind}`);
        const container = document.createElement("div");
        document.body.appendChild(container);
        const root = createRoot(container);
        const translations = kind === "quote" ? quotePageText : contactPageText;
        let language = startingLanguage;
        const field = (name: string) => container.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${kind}-${name}`)!;
        const submit = () => act(async () => {
          container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        });
        const switchLanguage = async () => {
          await act(async () => container.querySelector<HTMLButtonElement>('[data-testid="language-switch"]')!.click());
          language = language === "zh" ? "en" : "zh";
        };
        try {
          await act(async () => root.render(
            <HelmetProvider><LanguageProvider><PublicChromeProvider isAdminRoute={false} routeKey={`/${kind}`}>
              <MemoryRouter initialEntries={[`/${startingLanguage}/${kind}`]}>
                <LanguageSwitch />{kind === "quote" ? <Quote /> : <Contact />}
              </MemoryRouter>
            </PublicChromeProvider></LanguageProvider></HelmetProvider>,
          ));
          await submit();
          expect(container.textContent).toContain(translations[language].requiredName);
          expect(container.textContent).toContain(translations[language].requiredPhone);
          await switchLanguage();
          expect(container.textContent).toContain(translations[language].requiredName);
          expect(container.textContent).not.toContain(translations[startingLanguage].requiredName);
          await act(async () => {
            input(field("name"), "QA draft remains");
            input(field("phone"), "bad-phone");
            input(field("email"), "bad-email");
            if (kind === "contact") input(field("message"), "short");
          });
          await submit();
          await switchLanguage();
          expect(container.textContent).toContain(translations[language].invalidPhone);
          expect(container.textContent).toContain(translations[language].invalidEmail);
          const oldLanguage = language === "zh" ? "en" : "zh";
          expect(container.textContent).not.toContain(translations[oldLanguage].invalidPhone);
          expect(field("name").value).toBe("QA draft remains");
          expect(field("phone").value).toBe("bad-phone");
          expect(field("email").value).toBe("bad-email");
          if (kind === "contact") {
            expect(field("message").value).toBe("short");
            expect(container.textContent).toContain(contactPageText[language].shortMessage);
          } else {
            expect(container.textContent).toContain(quotePageText[language].requiredProject);
            expect(container.textContent).toContain(quotePageText[language].requiredLocation);
          }
          await act(async () => input(field("phone"), "+601100000000"));
          expect(container.textContent).not.toContain(translations[language].invalidPhone);
          expect(container.textContent).toContain(translations[language].invalidEmail);
          expect(submitContactLead).not.toHaveBeenCalled();
          expect(submitQuoteRequest).not.toHaveBeenCalled();
        } finally {
          await act(async () => root.unmount());
          container.remove();
        }
      });
    }
  }
});
