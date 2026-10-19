import { act } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import FurnitureFloatingLink from "./FurnitureFloatingLink";
import { contactEntryText } from "@/i18n/contactEntryText";
import { PublicChromeProvider } from "@/contexts/PublicChromeContext";

const state = vi.hoisted(() => ({ language: "en" as "en" | "zh" | "ms" }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/hooks/useSiteSettings", () => ({ useSiteSettings: () => ({
  whatsapp_url: (message: string) => `https://wa.me/601128853888?text=${encodeURIComponent(message)}`,
  phone_href: "tel:+601128853888", phone_display: "+60 11-2885 3888",
}) }));

for (const language of ["zh", "en", "ms"] as const) {
  describe(`${language} shared contact entry`, () => {
    it("starts collapsed, uses configured contact details and service context, closes with Back and restores focus", async () => {
      state.language = language;
      const container = document.createElement("div"); document.body.append(container);
      const root = createRoot(container);
      const router = createMemoryRouter([{ path: "*", element: <PublicChromeProvider isAdminRoute={false} routeKey="/services/kitchen">
        <main><h1>Kitchen</h1></main><FurnitureFloatingLink />
      </PublicChromeProvider> }], { initialEntries: [`/${language}/prior`, `/${language}/services/kitchen?keep=yes#section`] });
      try {
        await act(async () => root.render(<RouterProvider router={router} />));
        const trigger = container.querySelector<HTMLButtonElement>(".fc-contact-entry")!;
        expect(trigger.textContent).toBe(contactEntryText[language].trigger);
        expect(document.querySelector('[role="dialog"]')).toBeNull();
        expect(document.querySelector(".fc-furniture-floating")).toBeNull();
        await act(async () => { trigger.click(); await vi.dynamicImportSettled(); });
        const dialog = document.querySelector('[role="dialog"]')!;
        expect(dialog).toHaveTextContent(contactEntryText[language].title);
        const whatsapp = dialog.querySelector<HTMLAnchorElement>('a[href^="https://wa.me/"]')!;
        expect(new URL(whatsapp.href).pathname).toBe("/601128853888");
        expect(new URL(whatsapp.href).searchParams.get("text")).toBe(contactEntryText[language].message("Kitchen"));
        expect(dialog.querySelector('a[href^="tel:"]')).toHaveAttribute("href", "tel:+601128853888");
        expect(dialog).not.toHaveTextContent(/微信|WeChat/);
        expect(router.state.location.search).toBe("?keep=yes");
        expect(router.state.location.hash).toBe("#section");
        await act(async () => { await router.navigate(-1); });
        expect(document.querySelector('[role="dialog"]')).toBeNull();
        expect(router.state.location.pathname).toBe(`/${language}/services/kitchen`);
        expect(document.activeElement).toBe(trigger);
        await act(async () => trigger.click());
        await act(async () => {
          const close = document.querySelector<HTMLButtonElement>('[role="dialog"] button')!;
          close.click(); close.click();
        });
        expect(document.querySelector('[role="dialog"]')).toBeNull();
        expect(router.state.location.pathname).toBe(`/${language}/services/kitchen`);
        await act(async () => trigger.click());
        expect(document.querySelector('[role="dialog"]')).not.toBeNull();
      } finally { await act(async () => root.unmount()); container.remove(); router.dispose(); }
    });
  });
}
