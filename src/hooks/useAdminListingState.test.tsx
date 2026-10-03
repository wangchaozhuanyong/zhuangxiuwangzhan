import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAdminListingState } from "./useAdminListingState";

let root: Root, node: HTMLDivElement, router: ReturnType<typeof createMemoryRouter>;
let listing: ReturnType<typeof useAdminListingState>;
function Probe() { listing = useAdminListingState(); return null; }
beforeEach(() => { vi.useFakeTimers(); node = document.createElement("div"); document.body.append(node); root = createRoot(node); });
afterEach(async () => { await act(async () => root.unmount()); router.dispose(); node.remove(); vi.useRealTimers(); });
async function render(path: string) {
  router = createMemoryRouter([{ path: "/admin/:list", element: <Probe /> }], { initialEntries: [path] });
  await act(async () => root.render(<RouterProvider router={router} />));
}
describe("admin list URL and private search", () => {
  it("keeps filter and page updates atomic and resets pagination after debounced search", async () => {
    await render("/admin/services?page=3&status=draft");
    await act(async () => { listing.setFilter("status", "published"); listing.setPage(2); });
    expect(new URLSearchParams(router.state.location.search).get("page")).toBe("2");
    expect(new URLSearchParams(router.state.location.search).get("status")).toBe("published");
    await act(async () => listing.setSearch("Synthetic search"));
    expect(listing.deferredSearch).toBe("");
    await act(async () => vi.advanceTimersByTime(300));
    expect(listing.deferredSearch).toBe("Synthetic search");
    expect(router.state.location.search).toBe("?status=published");
  });
  it("restores customer search only from session memory after returning to the list", async () => {
    await render("/admin/leads?status=new");
    await act(async () => listing.setSearch("Synthetic customer lookup"));
    await act(async () => vi.advanceTimersByTime(300));
    expect(router.state.location.search).not.toContain("Synthetic");
    expect(JSON.stringify(localStorage)).not.toContain("Synthetic customer lookup");
    await act(async () => router.navigate("/admin/quotes"));
    expect(listing.search).toBe("");
    await act(async () => router.navigate(-1));
    expect(listing.search).toBe("Synthetic customer lookup");
    expect(listing.filter("status")).toBe("new");
  });
});
