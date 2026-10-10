import { act, Suspense, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ServiceDetail from "./ServiceDetail";
import { PublicRouteImageGate } from "@/components/PublicRouteImageGate";
import { surfaceRepairServiceForLanguage } from "@/data/surfaceRepairService";

const state = vi.hoisted(() => ({ language: "zh" as "zh" | "en", pending: false, failed: false }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/hooks/usePublishedContent", () => ({
  usePublishedServiceBySlug: () => ({ data: state.pending || state.failed ? undefined : surfaceRepairServiceForLanguage(state.language), isLoading: state.pending, isInitialError: state.failed }),
  usePublishedServices: () => ({ data: undefined }),
}));
vi.mock("@/components/services/SurfaceRepairContent", () => ({ default: function RepairFixture({ pending }: { pending?: boolean }) {
  const [value, setValue] = useState("");
  return <main data-route-pending={pending || undefined}><input id="draft-fixture" value={value} onChange={event => setValue(event.target.value)} /></main>;
} }));
let container: HTMLDivElement;
let root: Root;
let client: QueryClient;
beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); state.language = "zh"; state.pending = false; state.failed = false; container = document.createElement("div"); document.body.append(container); root = createRoot(container); client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); });
afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); delete document.documentElement.dataset.publicRouteLoading; vi.useRealTimers(); vi.unstubAllGlobals(); });
const render = async () => {
  await act(async () => { root.render(<QueryClientProvider client={client}><MemoryRouter initialEntries={["/zh/services/surface-repair"]}><PublicRouteImageGate routeKey={`/${state.language}/services/surface-repair`}><div id="main-content"><Suspense fallback={null}><Routes><Route path="/:lang/services/:slug" element={<ServiceDetail />} /></Routes></Suspense></div></PublicRouteImageGate></MemoryRouter></QueryClientProvider>); });
  await act(async () => vi.advanceTimersByTime(40));
};

describe("repair detail draft while localized CMS data changes", () => {
  it("keeps the same form during a pending language query and its result", async () => {
    await render();
    const input = container.querySelector<HTMLInputElement>("#draft-fixture")!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "Keep my draft");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    input.focus();
    const ready = vi.fn();
    window.addEventListener("public-route-ready", ready);
    try {
      state.language = "en"; state.pending = true; await render();
      expect(container.querySelector("#draft-fixture")).toBe(input); expect(input.value).toBe("Keep my draft");
      expect(document.activeElement).toBe(input);
      expect(container.querySelector("main")).toHaveAttribute("data-route-pending", "true");
      expect(container.querySelector("[data-route-visual-state]")).toHaveAttribute("data-route-visual-state", "waiting");
      expect(container.querySelector("[data-route-visual-state]")).not.toHaveAttribute("inert");
      expect(ready).not.toHaveBeenCalled();
      state.pending = false; await render();
      expect(container.querySelector("#draft-fixture")).toBe(input); expect(input.value).toBe("Keep my draft");
      expect(document.activeElement).toBe(input);
      expect(container.querySelector("main")).not.toHaveAttribute("data-route-pending");
      expect(ready).toHaveBeenCalledOnce();
    } finally { window.removeEventListener("public-route-ready", ready); }
  });

  it("ends the pending marker after a failed language read while retaining the draft for recovery", async () => {
    await render();
    const input = container.querySelector<HTMLInputElement>("#draft-fixture")!;
    input.focus();
    state.language = "en"; state.pending = true; await render();
    expect(container.querySelector("main")).toHaveAttribute("data-route-pending", "true");
    state.pending = false; state.failed = true; await render();
    expect(container.querySelector("main")).not.toHaveAttribute("data-route-pending");
    expect(container.querySelector("#draft-fixture")).toBe(input);
    expect(document.activeElement).toBe(input);
  });
});
