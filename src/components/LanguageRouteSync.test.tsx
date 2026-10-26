import { act, Suspense, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes, useNavigate, type NavigateFunction } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { LanguageRouteSync, prepareMalayContent } from "./LanguageRouteSync";

describe("asynchronous locale route identity", () => {
  it("retains existing input DOM and unsaved value through the first Malay load and POP", async () => {
    const container = document.createElement("div"); document.body.append(container);
    const root = createRoot(container);
    let navigate: NavigateFunction, mounts = 0;
    function Draft() {
      navigate = useNavigate();
      useEffect(() => { mounts++; }, []);
      return <input defaultValue="Original draft" aria-label="Draft" />;
    }
    try {
      await act(async () => root.render(<LanguageProvider><MemoryRouter initialEntries={["/en"]}><Suspense fallback={<span>Resource pending</span>}><Routes><Route path="/:lang" element={<LanguageRouteSync><Draft /></LanguageRouteSync>} /></Routes></Suspense></MemoryRouter></LanguageProvider>));
      const input = container.querySelector("input")!; input.value = "Unsaved draft";
      await act(async () => { void navigate!("/ms"); await prepareMalayContent(); });
      expect(container.querySelector("input")).toBe(input);
      expect(input.value).toBe("Unsaved draft");
      await act(async () => { void navigate!("/zh"); });
      await act(async () => { void navigate!(-1); });
      expect(container.querySelector("input")).toBe(input);
      expect(input.value).toBe("Unsaved draft");
      expect(mounts).toBe(1);
    } finally { await act(async () => root.unmount()); container.remove(); }
  });
});
