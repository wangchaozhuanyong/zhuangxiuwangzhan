import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/LanguageContext";
import LanguageSelector from "./LanguageSelector";

const prepareMalay = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock("./LanguageRouteSync", () => ({ prepareMalayContent: prepareMalay }));
vi.mock("./LanguageDrawer", () => ({ default: () => <div /> }));

const announceReady = (routeKey: string, degraded = false) => window.dispatchEvent(
  new CustomEvent("public-route-ready", { detail: { routeKey, degraded } }),
);

describe("Malay preparation for the catalog language switch", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    prepareMalay.mockClear();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  async function mount(path: string) {
    await act(async () => root.render(<LanguageProvider><MemoryRouter initialEntries={[path]}>
      <LanguageSelector />
    </MemoryRouter></LanguageProvider>));
  }

  it.each(["/zh/custom-cabinets", "/en/furniture/dining/sideboard?page=2"])("warms on successful readiness for %s", async (path) => {
    await mount(path);
    announceReady("/zh/contact");
    announceReady(path, true);
    expect(prepareMalay).not.toHaveBeenCalled();
    announceReady(path);
    expect(prepareMalay).toHaveBeenCalledTimes(1);
  });

  it("warms immediately when opening on touch or keyboard without prior hover", async () => {
    await mount("/zh/furniture");
    expect(prepareMalay).not.toHaveBeenCalled();
    await act(async () => container.querySelector("button")!.click());
    expect(prepareMalay).toHaveBeenCalledTimes(1);
  });

  it("does not warm on contact or unrelated public pages", async () => {
    await mount("/zh/contact");
    announceReady("/zh/contact");
    await act(async () => container.querySelector("button")!.click());
    expect(prepareMalay).not.toHaveBeenCalled();
  });
});
