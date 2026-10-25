import { act, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/LanguageContext";

const resource = vi.hoisted(() => vi.fn());
vi.mock("@/i18n/malayContentRuntime", () => ({ loadMalayContent: resource }));
import { LanguageRouteSync, prepareMalayContent } from "./LanguageRouteSync";

describe("failed optional language preparation", () => {
  it("does not poison a later real Malay navigation", async () => {
    resource.mockRejectedValueOnce(new Error("Optional transfer failed")).mockResolvedValueOnce({});
    await expect(prepareMalayContent()).rejects.toThrow("Optional transfer failed");
    const container = document.createElement("div"); document.body.append(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<LanguageProvider><MemoryRouter initialEntries={["/ms"]}><Suspense fallback={<span>Loading resource</span>}><Routes><Route path="/:lang" element={<LanguageRouteSync><h1>Malay page</h1></LanguageRouteSync>} /></Routes></Suspense></MemoryRouter></LanguageProvider>));
      expect(container.querySelector("h1")?.textContent).toBe("Malay page");
      expect(resource).toHaveBeenCalledTimes(2);
    } finally { await act(async () => root.unmount()); container.remove(); }
  });
});
