import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PublicChromeProvider, usePublicChrome } from "@/contexts/PublicChromeContext";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import PublicUpdateNotice from "./PublicUpdateNotice";
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: "zh" }) }));
vi.mock("@/lib/publicVersion", () => ({
  isPublicVersionEndpointAvailable: () => true,
  createCurrentPublicVersion: () => ({ deploymentVersion: "old", contentVersion: "" }),
  fetchPublicVersion: vi.fn(async () => ({ deploymentVersion: "new", contentVersion: "" })),
  hasNewPublicVersion: () => true,
}));
const queryClient = new QueryClient();
let root: Root;
let container: HTMLDivElement;
let setMenuOpen: (open: boolean) => void;
function Controls() { setMenuOpen = usePublicChrome().setMenuOpen; return null; }
const render = async (open = false, second = false) => act(async () => root.render(
  <QueryClientProvider client={queryClient}><PublicChromeProvider isAdminRoute={false} routeKey="/zh">
    <Controls /><PublicUpdateNotice />
    <Dialog open={open}><DialogContent><DialogTitle>Preview</DialogTitle><DialogDescription>Example</DialogDescription></DialogContent></Dialog>
    <Dialog open={second}><DialogContent><DialogTitle>Map</DialogTitle><DialogDescription>Example</DialogDescription></DialogContent></Dialog>
  </PublicChromeProvider></QueryClientProvider>,
));
beforeEach(() => { container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
describe("public update layer coordination", () => {
  it("defers an available update while the menu is open and resumes it afterwards", async () => {
    await render(); expect(container.querySelector(".public-update-notice")).not.toBeNull();
    await act(async () => setMenuOpen(true)); expect(container.querySelector(".public-update-notice")).toBeNull();
    await act(async () => setMenuOpen(false)); expect(container.querySelector(".public-update-notice")).not.toBeNull();
  });
  it("waits until every shared dialog has closed", async () => {
    await render(true, true); expect(container.querySelector(".public-update-notice")).toBeNull();
    await render(false, true); expect(container.querySelector(".public-update-notice")).toBeNull();
    await render(false, false); expect(container.querySelector(".public-update-notice")).not.toBeNull();
  });
  it("does not resurrect a dismissed notice after menu or dialog changes", async () => {
    await render();
    await act(async () => (container.querySelectorAll(".public-update-notice button")[1] as HTMLButtonElement).click());
    await render(true); await render(false);
    expect(container.querySelector(".public-update-notice")).toBeNull();
  });
  it("keeps shared dialog use safe outside the public provider", async () => {
    await act(async () => root.render(<Dialog open><DialogContent><DialogTitle>Admin</DialogTitle><DialogDescription>Example</DialogDescription></DialogContent></Dialog>));
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });
});
