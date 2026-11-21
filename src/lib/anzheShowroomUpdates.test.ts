// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://locks.flashcast.com.my/zh/"}
import { afterEach, describe, expect, it, vi } from "vitest";
import { initializeShowroomUpdates } from "./anzheShowroomUpdates";
import { reloadDocumentSafely } from "./navigationProtection";

vi.mock("./navigationProtection", () => ({ reloadDocumentSafely: vi.fn(async () => true) }));

const notice = () => document.querySelector<HTMLElement>(".public-update-notice");

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  document.head.replaceChildren();
  document.body.replaceChildren();
});

describe("showroom version updates", () => {
  it("skips a static document without a deployment identity", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(initializeShowroomUpdates()).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
    expect(notice()).toBeNull();
  });

  it("uses the shared actions, language and layer policy and keeps the page available offline", async () => {
    document.head.innerHTML = '<meta name="flashcast-deployment-version" content="original">';
    document.documentElement.lang = "zh-CN";
    document.body.innerHTML = '<div id="quick-contact"><button aria-expanded="false"></button></div>';
    const menu = document.querySelector("button")!;
    const fetch = vi.fn().mockRejectedValue(new TypeError("Offline"));
    vi.stubGlobal("fetch", fetch);
    const dispose = initializeShowroomUpdates();
    try {
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(fetch).toHaveBeenCalled();
      expect(notice()).toBeNull();
      fetch.mockImplementation(async () => Response.json({ deploymentVersion: "second" }));
      window.dispatchEvent(new Event("focus"));
      await vi.waitFor(() => expect(notice()?.textContent).toContain("刷新后即可查看"));
      expect(reloadDocumentSafely).not.toHaveBeenCalled();

      const dialog = document.createElement("dialog");
      dialog.open = true;
      document.body.append(dialog);
      await vi.waitFor(() => expect(notice()).toBeNull());
      menu.setAttribute("aria-expanded", "true");
      dialog.remove();
      document.documentElement.lang = "ms-MY";
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(notice()).toBeNull();
      menu.setAttribute("aria-expanded", "false");
      await vi.waitFor(() => expect(notice()?.textContent).toContain("Muat semula"));

      notice()!.querySelector<HTMLButtonElement>("[data-update-dismiss]")!.click();
      window.dispatchEvent(new Event("focus"));
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(notice()).toBeNull();
      fetch.mockImplementation(async () => Response.json({ deploymentVersion: "third" }));
      window.dispatchEvent(new Event("focus"));
      await vi.waitFor(() => expect(notice()).not.toBeNull());
      notice()!.querySelector<HTMLButtonElement>("[data-update-refresh]")!.click();
      expect(reloadDocumentSafely).toHaveBeenCalledTimes(1);
    } finally {
      dispose?.();
    }
    expect(notice()).toBeNull();
  });
});
