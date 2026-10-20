import { act } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FurnitureFloatingLink from "./FurnitureFloatingLink";
import { contactEntryText } from "@/i18n/contactEntryText";
import { PublicChromeProvider } from "@/contexts/PublicChromeContext";
import { furnitureShopUrlForLanguage } from "@/lib/furnitureCatalogConfig";

const state = vi.hoisted(() => ({ language: "en" as "en" | "zh" | "ms" }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/hooks/useSiteSettings", () => ({ useSiteSettings: () => ({
  whatsapp_url: (message: string) => `https://wa.me/601128853888?text=${encodeURIComponent(message)}`,
  phone_href: "tel:+601128853888", phone_display: "+60 11-2885 3888",
}) }));
beforeEach(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterEach(() => vi.unstubAllGlobals());

for (const language of ["zh", "en", "ms"] as const) {
  describe(`${language} shared contact entry`, () => {
    it.each([
      ["/furniture", true], ["/furniture/", true], ["/furniture/living-room", true],
      ["/furniture/living-room/sofas?page=2&filter=chair", true], ["/furniture/product/chair", true],
      ["/", false], ["/contact?destination=furniture", false], ["/about?next=/furniture", false],
      ["/furniture-sale", false], ["/services/furniture", false],
    ])("scopes the shop to the resolved furniture segment: %s", async (path, showShop) => {
      state.language = language;
      const container = document.createElement("div"); document.body.append(container);
      const root = createRoot(container);
      const router = createMemoryRouter([{ path: "*", element: <PublicChromeProvider isAdminRoute={false} routeKey={path}>
        <FurnitureFloatingLink />
      </PublicChromeProvider> }], { initialEntries: [`/${language}${path}`] });
      try {
        await act(async () => { root.render(<RouterProvider router={router} />); await vi.dynamicImportSettled(); });
        const stack = container.querySelector(".fc-contact-stack")!;
        const contact = container.querySelector(".fc-contact-entry")!;
        expect(contact.parentElement).toBe(stack);
        const shop = container.querySelector<HTMLAnchorElement>(".fc-furniture-floating");
        expect(Boolean(shop)).toBe(showShop);
        if (shop) {
          expect(stack.firstElementChild).toBe(shop);
          expect(shop.nextElementSibling).toBe(contact);
          expect(shop.href).toBe(furnitureShopUrlForLanguage(language));
          expect(shop).toHaveAttribute("target", "_blank");
          expect(shop.rel).toContain("noopener");
          if (language === "ms") expect(shop).toHaveTextContent(contactEntryText.ms.shopLanguage);
        }
      } finally { await act(async () => root.unmount()); container.remove(); router.dispose(); }
    });

    it("yields both entries to contact and restores the shop after repeated dismissal", async () => {
      state.language = language;
      const container = document.createElement("div"); document.body.append(container);
      const root = createRoot(container);
      const pathname = `/${language}/furniture/product/chair`;
      const router = createMemoryRouter([{ path: "*", element: <PublicChromeProvider isAdminRoute={false} routeKey={pathname}>
        <main><h1>Chair</h1></main><FurnitureFloatingLink />
      </PublicChromeProvider> }], { initialEntries: [`/${language}/furniture?page=2`, `${pathname}?from=catalog#photos`] });
      try {
        await act(async () => { root.render(<RouterProvider router={router} />); await vi.dynamicImportSettled(); });
        const trigger = container.querySelector<HTMLButtonElement>(".fc-contact-entry")!;
        const stack = container.querySelector(".fc-contact-stack")!;
        await act(async () => { trigger.click(); trigger.click(); await vi.dynamicImportSettled(); });
        expect(stack).toHaveAttribute("aria-hidden", "true");
        expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
        await act(async () => {
          const close = document.querySelector<HTMLButtonElement>('[role="dialog"] button')!;
          close.click(); close.click();
        });
        expect(router.state.location.pathname).toBe(pathname);
        expect(router.state.location.search).toBe("?from=catalog");
        expect(router.state.location.hash).toBe("#photos");
        expect(stack).not.toHaveAttribute("aria-hidden");
        expect(container.querySelector(".fc-furniture-floating")).not.toBeNull();
        await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
      } finally { await act(async () => root.unmount()); container.remove(); router.dispose(); }
    });

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
        await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
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

it("does not mount public entries on an admin route", async () => {
  const container = document.createElement("div"); document.body.append(container);
  const root = createRoot(container);
  const router = createMemoryRouter([{ path: "*", element: <PublicChromeProvider isAdminRoute routeKey="/admin/furniture">
    <FurnitureFloatingLink />
  </PublicChromeProvider> }], { initialEntries: ["/admin/furniture"] });
  try {
    await act(async () => root.render(<RouterProvider router={router} />));
    expect(container.querySelector(".fc-contact-stack")).toBeNull();
  } finally { await act(async () => root.unmount()); container.remove(); router.dispose(); }
});
