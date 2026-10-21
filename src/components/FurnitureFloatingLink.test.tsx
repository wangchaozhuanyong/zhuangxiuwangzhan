import { act } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FurnitureFloatingLink from "./FurnitureFloatingLink";
import { contactEntryText } from "@/i18n/contactEntryText";
import { wechatContactText } from "@/i18n/wechatContactText";
import { PublicChromeProvider } from "@/contexts/PublicChromeContext";
import { furnitureShopUrlForLanguage } from "@/lib/furnitureCatalogConfig";

const state = vi.hoisted(() => ({ language: "en" as "en" | "zh" | "ms", wechatId: "" }));
vi.mock("@/config/site", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/config/site")>();
  return { ...actual, siteConfig: { ...actual.siteConfig, get wechatId() { return state.wechatId; } } };
});
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/hooks/useSiteSettings", () => ({ useSiteSettings: () => ({
  whatsapp_url: (message: string) => `https://wa.me/601128853888?text=${encodeURIComponent(message)}`,
  phone_href: "tel:+601128853888", phone_display: "+60 11-2885 3888",
}) }));
beforeEach(() => { state.wechatId = ""; vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); });
afterEach(() => vi.unstubAllGlobals());

for (const language of ["zh", "en", "ms"] as const) {
  describe(`${language} shared contact entry`, () => {
    it.each(["copied", "denied", "unavailable"] as const)("handles configured WeChat copy: %s", async (outcome) => {
      state.language = language;
      state.wechatId = "  fixture_wechat_only  ";
      const text = { ...contactEntryText[language], ...wechatContactText[language] };
      const clipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
      let finish!: () => void;
      const writeText = vi.fn(() => outcome === "denied" ? Promise.reject(new Error("clipboard denied"))
        : new Promise<void>(resolve => { finish = resolve; }));
      Object.defineProperty(navigator, "clipboard", { configurable: true,
        value: outcome === "unavailable" ? undefined : { writeText } });
      const container = document.createElement("div"); document.body.append(container);
      const root = createRoot(container);
      const router = createMemoryRouter([{ path: "*", element: <PublicChromeProvider isAdminRoute={false} routeKey="/contact">
        <FurnitureFloatingLink />
      </PublicChromeProvider> }], { initialEntries: [`/${language}/contact`] });
      try {
        await act(async () => { root.render(<RouterProvider router={router} />); await vi.dynamicImportSettled(); });
        await act(async () => { container.querySelector<HTMLButtonElement>(".fc-contact-entry")!.click(); await vi.dynamicImportSettled(); });
        const row = document.querySelector(".fc-contact-panel__wechat")!;
        expect(row).toHaveTextContent(text.wechat);
        expect(row).toHaveTextContent("fixture_wechat_only");
        const qr = document.querySelector<HTMLDetailsElement>(".fc-contact-panel__qr")!;
        expect(qr).not.toHaveAttribute("open");
        expect(qr.querySelector("summary")).toHaveTextContent(text.showWechatQr);
        expect(qr.querySelector("img")).toHaveAttribute("src", "/images/contact/wechat-qr.webp");
        const save = qr.querySelector<HTMLAnchorElement>(".fc-contact-panel__qr-save")!;
        expect(save).toHaveTextContent(text.saveQr);
        expect(save).toHaveAttribute("href", "/downloads/wechat-qr.png");
        expect(save).toHaveAttribute("download", "FLASH-CAST-WeChat.png");
        const original = qr.querySelector<HTMLAnchorElement>(".fc-contact-panel__qr-original")!;
        expect(original).toHaveTextContent(text.openQr);
        expect(original).toHaveAttribute("href", "/downloads/wechat-qr.png");
        expect(original).toHaveAttribute("target", "_blank");
        expect(original.rel).toContain("noopener");
        await act(async () => qr.querySelector<HTMLElement>("summary")!.click());
        expect(qr).toHaveAttribute("open");
        const copy = row.querySelector<HTMLButtonElement>("button")!;
        await act(async () => { copy.click(); copy.click(); });
        if (outcome === "copied") {
          expect(copy).toBeDisabled();
          expect(copy).toHaveAttribute("aria-busy", "true");
          expect(writeText).toHaveBeenCalledTimes(1);
          expect(writeText).toHaveBeenCalledWith("fixture_wechat_only");
          await act(async () => finish());
          expect(copy).toHaveTextContent(text.copied);
          expect(copy).toHaveAccessibleName(text.copied);
          expect(document.querySelector('.fc-contact-panel__copy-status')).toBeEmptyDOMElement();
        } else {
          expect(document.querySelector('[role="status"]')).toHaveTextContent(text.wechatCopyFailed);
          expect(copy).not.toBeDisabled();
          expect(row.querySelector(".fc-contact-panel__wechat-id")).toHaveTextContent("fixture_wechat_only");
        }
        const close = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'))
          .find(button => button.textContent === text.close)!;
        await act(async () => close.click());
        expect(document.querySelector('[role="dialog"]')).toBeNull();
      } finally {
        await act(async () => root.unmount()); container.remove(); router.dispose();
        if (clipboard) Object.defineProperty(navigator, "clipboard", clipboard); else Reflect.deleteProperty(navigator, "clipboard");
      }
    });

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

it.each(["shared", "cancelled", "denied", "unsupported", "prepare-failed", "fine-pointer"] as const)(
  "saves the original QR image with the mobile system sheet or direct download: %s", async (outcome) => {
    state.language = "en"; state.wechatId = "fixture_wechat_only";
    const text = wechatContactText.en;
    const shareDescriptor = Object.getOwnPropertyDescriptor(navigator, "share");
    const canShareDescriptor = Object.getOwnPropertyDescriptor(navigator, "canShare");
    let finish!: () => void;
    let fail!: (error: DOMException) => void;
    const share = vi.fn<(data: ShareData) => Promise<void>>(() => new Promise<void>((resolve, reject) => { finish = resolve; fail = reject; }));
    const canShare = vi.fn(() => outcome !== "unsupported");
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: canShare });
    const media = vi.spyOn(window, "matchMedia");
    media.mockReturnValue({ ...window.matchMedia("(any-pointer: coarse)"), matches: outcome !== "fine-pointer" });
    const fetchQr = vi.fn(async () => ({ ok: outcome !== "prepare-failed",
      blob: async () => new Blob(["qr-fixture"], { type: "image/png" }) }));
    vi.stubGlobal("fetch", fetchQr);
    const container = document.createElement("div"); document.body.append(container);
    const root = createRoot(container);
    const router = createMemoryRouter([{ path: "*", element: <PublicChromeProvider isAdminRoute={false} routeKey="/contact">
      <FurnitureFloatingLink />
    </PublicChromeProvider> }], { initialEntries: ["/en/contact"] });
    try {
      await act(async () => { root.render(<RouterProvider router={router} />); await vi.dynamicImportSettled(); });
      await act(async () => { container.querySelector<HTMLButtonElement>(".fc-contact-entry")!.click(); await vi.dynamicImportSettled(); });
      const save = document.querySelector<HTMLAnchorElement>(".fc-contact-panel__qr-save")!;
      const status = document.querySelector(".fc-contact-panel__save-status")!;
      // Let React handle the action while preventing jsdom from attempting an actual navigation.
      document.addEventListener("click", event => event.preventDefault(), { once: true });
      if (["unsupported", "prepare-failed", "fine-pointer"].includes(outcome)) {
        await act(async () => save.click());
        expect(share).not.toHaveBeenCalled();
        expect(save).toHaveAttribute("download", "FLASH-CAST-WeChat.png");
        expect(status).toBeEmptyDOMElement();
        if (outcome === "fine-pointer") expect(fetchQr).not.toHaveBeenCalled();
        return;
      }
      await act(async () => { save.click(); save.click(); });
      expect(share).toHaveBeenCalledTimes(1);
      const file = share.mock.calls[0][0].files[0];
      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe("FLASH-CAST-WeChat.png");
      expect(file.type).toBe("image/png");
      expect(file.size).toBe(10);
      expect(save).toHaveAttribute("aria-busy", "true");
      expect(save).toHaveAttribute("aria-disabled", "true");
      if (outcome === "shared") {
        await act(async () => finish());
        expect(status).toBeEmptyDOMElement();
      } else if (outcome === "cancelled") {
        await act(async () => fail(new DOMException("cancelled", "AbortError")));
        expect(status).toBeEmptyDOMElement();
        expect(share).toHaveBeenCalledTimes(1);
      } else {
        await act(async () => fail(new DOMException("blocked", "NotAllowedError")));
        expect(status).toHaveTextContent(text.qrSaveFailed);
        document.addEventListener("click", event => event.preventDefault(), { once: true });
        await act(async () => save.click());
        expect(share).toHaveBeenCalledTimes(1);
        expect(status).toBeEmptyDOMElement();
      }
      expect(save).not.toHaveAttribute("aria-busy");
      expect(save).not.toHaveAttribute("aria-disabled");
      expect(router.state.location.pathname).toBe("/en/contact");
    } finally {
      await act(async () => root.unmount()); container.remove(); router.dispose(); media.mockRestore();
      if (shareDescriptor) Object.defineProperty(navigator, "share", shareDescriptor); else Reflect.deleteProperty(navigator, "share");
      if (canShareDescriptor) Object.defineProperty(navigator, "canShare", canShareDescriptor); else Reflect.deleteProperty(navigator, "canShare");
    }
  });

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
