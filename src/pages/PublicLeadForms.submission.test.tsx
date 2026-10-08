import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Quote from "./Quote";
import Contact from "./Contact";
import { quotePageText } from "@/i18n/quotePageText";
import { contactPageText } from "@/i18n/contactPageText";

const state = vi.hoisted(() => ({ language: "en" as "en" | "zh", quote: vi.fn(), contact: vi.fn() }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/hooks/usePublishedContent", () => ({ usePublishedSitePage: () => ({ data: undefined, isLoading: false }) }));
vi.mock("@/hooks/useSiteSettings", () => ({ useSiteSettings: () => ({
  address: "Fixture office", short_address: "Fixture office", phone_display: "Fixture phone",
  phone_href: "tel:+601100000000", email: "office@example.invalid",
  whatsapp_url: () => "https://example.invalid/contact", map_latitude: "3", map_longitude: "101",
}) }));
vi.mock("@/hooks/useFormGuard", () => ({ useFormGuard: () => ({ startedAt: 123 }) }));
vi.mock("@/lib/leadApi", () => ({ submitQuoteRequest: state.quote, submitContactLead: state.contact }));
vi.mock("@/lib/analytics", () => ({ trackQuoteFormSubmit: vi.fn(), trackContactFormSubmit: vi.fn(), trackCtaClick: vi.fn() }));
vi.mock("@/lib/turnstile", () => ({ preloadTurnstile: () => Promise.resolve() }));
vi.mock("@/components/PageMeta", () => ({ default: () => null }));
vi.mock("@/components/JsonLd", () => ({ JsonLdBreadcrumb: () => null }));
vi.mock("@/components/GoogleMapEmbed", () => ({ default: () => null }));
vi.mock("@/hooks/use-scroll-reveal", () => ({ useScrollReveal: () => ({ ref: { current: null }, isVisible: true }) }));
vi.mock("@/components/scheme-a/SchemeARoutePrimitives", () => ({ SchemeARouteHero: () => null }));

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("External requests are forbidden in this fixture"); }));
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  state.quote.mockReset(); state.contact.mockReset();
  Element.prototype.scrollIntoView = vi.fn();
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});

const fixture = { name: "Local fixture", phone: "+601100000000", email: "fixture@example.invalid", location: "Fixture area" };
async function input(id: string, value: string) {
  await act(async () => {
    const field = container.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`#${id}`)!;
    const prototype = field instanceof HTMLSelectElement ? HTMLSelectElement.prototype
      : field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(field, value);
    field.dispatchEvent(new Event(field instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
  });
}

for (const page of ["quote", "contact"] as const) for (const language of ["en", "zh"] as const) {
  describe(`${language} ${page} safe submission`, () => {
    const submit = () => page === "quote" ? state.quote : state.contact;
    async function render() {
      state.language = language;
      window.history.replaceState({}, "", `/${language}/${page}?source=fixture`);
      await act(async () => root.render(
        <MemoryRouter initialEntries={[`/${language}/${page}?source=fixture`]}>
          {page === "quote" ? <Quote /> : <Contact />}
        </MemoryRouter>,
      ));
    }
    async function fill() {
      await input(`${page}-name`, fixture.name); await input(`${page}-phone`, fixture.phone);
      await input(`${page}-email`, fixture.email);
      if (page === "quote") {
        await input("quote-project-type", "Other"); await input("quote-location", fixture.location);
      } else await input("contact-message", "A local fixture message for verification only.");
    }
    const event = () => new Event("submit", { bubbles: true, cancelable: true });

    it("cancels both events when the lock refuses an immediate duplicate, without navigation", async () => {
      let complete!: () => void;
      submit().mockReturnValue(new Promise<void>((resolve) => { complete = resolve; }));
      await render(); await fill();
      const form = container.querySelector("form")!;
      expect(form.method).toBe("post");
      const before = window.location.href;
      const push = vi.spyOn(window.history, "pushState"); const replace = vi.spyOn(window.history, "replaceState");
      const first = event(); const duplicate = event();
      await act(async () => { form.dispatchEvent(first); form.dispatchEvent(duplicate); });
      expect(first.defaultPrevented).toBe(true); expect(duplicate.defaultPrevented).toBe(true);
      expect(submit()).toHaveBeenCalledTimes(1);
      expect(submit().mock.calls[0][0]).toMatchObject({ name: fixture.name, phone: fixture.phone, email: fixture.email, sourcePath: `/${language}/${page}?source=fixture` });
      expect(window.location.href).toBe(before); expect(push).not.toHaveBeenCalled(); expect(replace).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
      await act(async () => complete());
      expect(container.querySelector("form")).toBeNull();
      expect(container.textContent).toContain(page === "quote" ? quotePageText[language].successTitle : contactPageText[language].successTitle);
    });

    it("keeps an unsuccessful draft and retries through the existing submission API", async () => {
      submit().mockRejectedValueOnce(new Error("Fixture unavailable")).mockResolvedValueOnce(undefined);
      await render(); await fill();
      const before = window.location.href; const first = event();
      await act(async () => { container.querySelector("form")!.dispatchEvent(first); });
      expect(first.defaultPrevented).toBe(true);
      expect(container.querySelector<HTMLInputElement>(`#${page}-name`)?.value).toBe(fixture.name);
      expect(container.querySelector("[role=alert]")).not.toBeNull();
      const retry = event();
      await act(async () => { container.querySelector("form")!.dispatchEvent(retry); });
      expect(retry.defaultPrevented).toBe(true); expect(submit()).toHaveBeenCalledTimes(2);
      expect(container.querySelector("form")).toBeNull(); expect(window.location.href).toBe(before);
      expect(fetch).not.toHaveBeenCalled();
    });

    it("cancels invalid submissions without invoking the request API", async () => {
      await render(); const invalid = event();
      await act(async () => { container.querySelector("form")!.dispatchEvent(invalid); });
      expect(invalid.defaultPrevented).toBe(true); expect(submit()).not.toHaveBeenCalled();
      expect(container.querySelector("[role=alert]")).not.toBeNull(); expect(fetch).not.toHaveBeenCalled();
    });
  });
}
