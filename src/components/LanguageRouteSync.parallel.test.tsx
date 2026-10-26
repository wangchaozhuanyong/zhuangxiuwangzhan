import { act, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/LanguageContext";

const resource = vi.hoisted(() => vi.fn());
vi.mock("@/i18n/malayContentRuntime", () => ({ loadMalayContent: resource }));
import { LanguageRouteSync } from "./LanguageRouteSync";

describe("required Malay homepage resources", () => {
  it("starts page preparation before the dictionary completes without rendering untranslated children", async () => {
    let complete!: () => void;
    resource.mockReturnValue(new Promise<void>((resolve) => { complete = resolve; }));
    const preparePage = vi.fn().mockResolvedValue({});
    const container = document.createElement("div"); document.body.append(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<LanguageProvider><MemoryRouter initialEntries={["/ms"]}><Suspense fallback={<span>Resource pending</span>}><Routes><Route path="/:lang" element={<LanguageRouteSync preparePage={preparePage}><h1>Prepared page</h1></LanguageRouteSync>} /></Routes></Suspense></MemoryRouter></LanguageProvider>));
      expect(preparePage).toHaveBeenCalled();
      expect(resource).toHaveBeenCalledOnce();
      expect(container.querySelector("h1")).toBeNull();
      await act(async () => complete());
      expect(container.querySelector("h1")?.textContent).toBe("Prepared page");
    } finally { await act(async () => root.unmount()); container.remove(); }
  });
});
