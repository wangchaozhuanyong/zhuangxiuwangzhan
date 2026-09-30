import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/LanguageContext";
import LanguageRouteLink from "@/components/LanguageRouteLink";

vi.mock("@/lib/publicRoutePrefetch", () => ({ prefetchPublishedRouteContent: vi.fn(() => new Promise<void>(() => {})) }));
const Location = () => <output>{useLocation().pathname}</output>;

describe("language navigation", () => {
  it("navigates even if the speculative content request never resolves", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const client = new QueryClient();
    await act(async () => root.render(<QueryClientProvider client={client}><LanguageProvider><MemoryRouter initialEntries={["/zh/services"]}>
      <LanguageRouteLink targetLanguage="en" to="/en/services">English</LanguageRouteLink><Location />
    </MemoryRouter></LanguageProvider></QueryClientProvider>));
    await act(async () => container.querySelector("a")?.dispatchEvent(new MouseEvent("click", {bubbles:true,button:0,cancelable:true})));
    expect(container.querySelector("output")).toHaveTextContent("/en/services");
    await act(async () => root.unmount());
    client.clear();
    container.remove();
  });
});
