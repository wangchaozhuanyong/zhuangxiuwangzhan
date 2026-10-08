import { act, Suspense, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ServiceDetail from "./ServiceDetail";
import { surfaceRepairServiceForLanguage } from "@/data/surfaceRepairService";

const state = vi.hoisted(() => ({ language: "zh" as "zh" | "en", pending: false }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/hooks/usePublishedContent", () => ({
  usePublishedServiceBySlug: () => ({ data: state.pending ? undefined : surfaceRepairServiceForLanguage(state.language), isLoading: state.pending, isInitialError: false }),
  usePublishedServices: () => ({ data: undefined }),
}));
vi.mock("@/components/services/SurfaceRepairContent", () => ({ default: function RepairFixture() {
  const [value, setValue] = useState("");
  return <input id="draft-fixture" value={value} onChange={event => setValue(event.target.value)} />;
} }));
let container: HTMLDivElement;
let root: Root;
beforeEach(() => { vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); state.language = "zh"; state.pending = false; container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
const render = async () => { await act(async () => { root.render(<MemoryRouter initialEntries={["/zh/services/surface-repair"]}><Suspense fallback={null}><Routes><Route path="/:lang/services/:slug" element={<ServiceDetail />} /></Routes></Suspense></MemoryRouter>); }); };

describe("repair detail draft while localized CMS data changes", () => {
  it("keeps the same form during a pending language query and its result", async () => {
    await render();
    const input = container.querySelector<HTMLInputElement>("#draft-fixture")!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "Keep my draft");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    state.language = "en"; state.pending = true; await render();
    expect(container.querySelector("#draft-fixture")).toBe(input); expect(input.value).toBe("Keep my draft");
    state.pending = false; await render();
    expect(container.querySelector("#draft-fixture")).toBe(input); expect(input.value).toBe("Keep my draft");
  });
});
