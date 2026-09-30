import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import PublicRoutePrefetch from "@/components/PublicRoutePrefetch";
import { prefetchPublishedRouteContent } from "@/lib/publicRoutePrefetch";
vi.mock("@/lib/publicRoutePrefetch", () => ({ prefetchPublishedRouteContent: vi.fn(() => Promise.resolve()) }));

describe("public navigation intent", () => {
  it("warms internal content on pointer and keyboard intent without intercepting navigation", async () => {
    const element = document.createElement("div");
    document.body.appendChild(element);
    const root = createRoot(element);
    const client = new QueryClient();
    await act(async () => root.render(<QueryClientProvider client={client}><PublicRoutePrefetch />
      <a href="/zh/materials"><span>Materials</span></a>
      <a href="https://shop.flashcast.com.my/">Shop</a>
      <a href="/admin">Admin</a>
      <a href="/zh/report" download>Download</a>
      <a href="/en/services" target="_blank">New tab</a>
    </QueryClientProvider>));
    const request = vi.mocked(prefetchPublishedRouteContent);
    request.mockClear();
    const event = new Event("pointerover", { bubbles:true, cancelable:true });
    await act(async () => element.querySelector("span")?.dispatchEvent(event));
    expect(request).toHaveBeenCalledWith(client, "/zh/materials", "zh");
    expect(event.defaultPrevented).toBe(false);
    request.mockClear();
    for (const link of Array.from(element.querySelectorAll("a")).slice(1)) {
      await act(async () => link.dispatchEvent(new Event("focusin", {bubbles:true})));
    }
    expect(request).not.toHaveBeenCalled();
    await act(async () => root.unmount());
    client.clear();
    element.remove();
  });
});
