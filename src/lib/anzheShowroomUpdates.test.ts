import { afterEach, describe, expect, it, vi } from "vitest";
import { initializeShowroomUpdates } from "./anzheShowroomUpdates";
import { reloadDocumentSafely } from "./navigationProtection";

vi.mock("./navigationProtection", () => ({ reloadDocumentSafely: vi.fn(async () => true) }));

function mount() {
  document.head.innerHTML = '<meta name="flashcast-deployment-version" content="original">';
  document.documentElement.lang = "zh-CN";
  document.body.innerHTML = '<aside id="showroom-update" hidden><strong></strong><button data-update-refresh></button><button data-update-dismiss></button></aside>';
  return document.getElementById("showroom-update")!;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  document.head.innerHTML = "";
  document.body.innerHTML = "";
});

describe("showroom version updates", () => {
  it("keeps the current page available offline, respects postponement and refreshes only on request", async () => {
    const notice = mount();
    const fetch = vi.fn().mockRejectedValueOnce(new TypeError("Offline"));
    vi.stubGlobal("fetch", fetch);
    const dispose = initializeShowroomUpdates();
    try {
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(notice.hidden).toBe(true);
      fetch.mockImplementation(async () => Response.json({ deploymentVersion: "second" }));
      window.dispatchEvent(new Event("focus"));
      await vi.waitFor(() => expect(notice.hidden).toBe(false));
      expect(reloadDocumentSafely).not.toHaveBeenCalled();
      document.documentElement.lang = "ms-MY";
      await vi.waitFor(() => expect(notice.textContent).toContain("Muat semula"));
      notice.querySelector<HTMLButtonElement>("[data-update-dismiss]")!.click();
      window.dispatchEvent(new Event("focus"));
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(notice.hidden).toBe(true);
      fetch.mockImplementation(async () => Response.json({ deploymentVersion: "third" }));
      window.dispatchEvent(new Event("focus"));
      await vi.waitFor(() => expect(notice.hidden).toBe(false));
      notice.querySelector<HTMLButtonElement>("[data-update-refresh]")!.click();
      expect(reloadDocumentSafely).toHaveBeenCalledTimes(1);
    } finally {
      dispose?.();
    }
  });
});
