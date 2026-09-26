import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import PublicCinematicMotion from "@/components/PublicCinematicMotion";

describe("shared motion for asynchronous public routes", () => {
  afterEach(() => vi.restoreAllMocks());

  it("registers late route sections once and disconnects both observers", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: !query.includes("prefers-reduced-motion"), media: query,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
    }) as unknown as MediaQueryList);
    const observe = vi.fn();
    const disconnect = vi.fn();
    const original = window.IntersectionObserver;
    window.IntersectionObserver = vi.fn().mockImplementation(function () { return { observe, unobserve: vi.fn(), disconnect }; });
    const host = document.createElement("div");
    host.className = "scheme-a-public-shell";
    document.body.append(host);
    const mount = document.createElement("div");
    host.append(mount);
    const root = createRoot(mount);
    try {
      await act(async () => root.render(<MemoryRouter><PublicCinematicMotion /></MemoryRouter>));
      const section = document.createElement("section");
      section.dataset.cinematicSection = "";
      vi.spyOn(section, "getBoundingClientRect").mockReturnValue({ top: 2000 } as DOMRect);
      await act(async () => { host.append(section); });
      expect(section.dataset.cinematicState).toBe("pending");
      expect(observe).toHaveBeenCalledWith(section);
      await act(async () => { section.append(document.createElement("p")); });
      expect(observe).toHaveBeenCalledTimes(1);
      await act(async () => root.unmount());
      expect(disconnect).toHaveBeenCalledOnce();
      const afterUnmount = document.createElement("section");
      afterUnmount.dataset.cinematicSection = "";
      await act(async () => { host.append(afterUnmount); });
      expect(afterUnmount.dataset.cinematicState).toBeUndefined();
    } finally {
      host.remove();
      window.IntersectionObserver = original;
    }
  });

  it("keeps late content visible for reduced motion", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: query.includes("prefers-reduced-motion"), media: query,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
    }) as unknown as MediaQueryList);
    const host = document.createElement("div");
    host.className = "scheme-a-public-shell";
    document.body.append(host);
    const mount = document.createElement("div");
    host.append(mount);
    const root = createRoot(mount);
    await act(async () => root.render(<MemoryRouter><PublicCinematicMotion /></MemoryRouter>));
    const section = document.createElement("section");
    section.dataset.cinematicSection = "";
    await act(async () => { host.append(section); });
    expect(section.dataset.cinematicState).toBe("visible");
    await act(async () => root.unmount());
    host.remove();
  });
});
