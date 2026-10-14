import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { furnitureText } from "@/i18n/furnitureText";
import FurnitureFloatingLink from "@/components/FurnitureFloatingLink";

const shopDestinations = {
  zh: "https://shop.flashcast.com.my/zh/",
  en: "https://shop.flashcast.com.my/en/",
} as const;

for (const language of ["en", "zh"] as const) {
  describe(`furniture entry ${language} route and accessibility preservation`, () => {
    it("keeps destination, language and keyboard/press behavior across routes without route exceptions", () => {
      window.history.replaceState({}, "", `/${language}/quote`);
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      let go: ReturnType<typeof useNavigate>;
      let setLanguage: ReturnType<typeof useLanguage>["setLanguage"];
      const Probe = () => {
        go = useNavigate();
        setLanguage = useLanguage().setLanguage;
        return <FurnitureFloatingLink />;
      };
      try {
        act(() => root.render(<LanguageProvider><MemoryRouter initialEntries={[`/${language}/quote`]}><Probe /></MemoryRouter></LanguageProvider>));
        const entry = container.querySelector<HTMLAnchorElement>("a")!;
        expect(entry.getAttribute("href")).toBe(shopDestinations[language]);
        expect(entry.getAttribute("target")).toBe("_blank");
        expect(entry.getAttribute("rel")).toBe("noopener noreferrer");
        expect(entry.getAttribute("aria-label")).toBe(furnitureText[language].floatingShop);
        expect(entry.getAttribute("lang")).toBe(language);
        expect(entry.hasAttribute("data-reserved-lane")).toBe(false);
        act(() => go(`/${language}/blog/renovation-materials-malaysia`));
        expect(entry.hasAttribute("data-reserved-lane")).toBe(false);
        act(() => go(`/${language}/blog`));
        expect(entry.hasAttribute("data-reserved-lane")).toBe(false);
        act(() => go(`/${language}/blog/`));
        expect(entry.hasAttribute("data-reserved-lane")).toBe(false);
        act(() => go(`/${language}`));
        expect(entry.hasAttribute("data-reserved-lane")).toBe(false);
        expect(entry.getAttribute("href")).toBe(shopDestinations[language]);
        const otherLanguage = language === "zh" ? "en" : "zh";
        act(() => {
          go(`/${otherLanguage}`);
          setLanguage(otherLanguage);
        });
        expect(container.querySelector("a")).toBe(entry);
        expect(entry.getAttribute("href")).toBe(shopDestinations[otherLanguage]);
        expect(entry.getAttribute("lang")).toBe(otherLanguage);
        expect(entry.getAttribute("aria-label")).toBe(furnitureText[otherLanguage].floatingShop);
        act(() => {
          go(`/${language}`);
          setLanguage(language);
        });
        expect(entry.getAttribute("href")).toBe(shopDestinations[language]);
        expect(entry.getAttribute("lang")).toBe(language);
        expect(entry.getAttribute("aria-label")).toBe(furnitureText[language].floatingShop);
        entry.focus();
        expect(document.activeElement).toBe(entry);
        const down = new Event("pointerdown", { bubbles: true });
        Object.defineProperties(down, { isPrimary: { value: true }, button: { value: 0 } });
        act(() => entry.dispatchEvent(down));
        expect(entry.dataset.pressed).toBe("true");
        act(() => entry.dispatchEvent(new Event("pointercancel", { bubbles: true })));
        expect(entry.hasAttribute("data-pressed")).toBe(false);
      } finally {
        act(() => root.unmount());
        container.remove();
      }
    });
  });
}
