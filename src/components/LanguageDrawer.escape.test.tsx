import { act, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LanguageDrawer from "./LanguageDrawer";

const state = vi.hoisted(() => ({ language: "zh" as "zh" | "en" | "ms" }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/contexts/PublicChromeContext", () => ({ usePublicDialogLayer: () => {} }));
vi.mock("@/lib/publicRoutePrefetch", () => ({ prefetchPublishedRouteContent: vi.fn(async () => {}) }));

let root: Root;
let container: HTMLDivElement;
let client: QueryClient;
function Harness() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return <QueryClientProvider client={client}><MemoryRouter initialEntries={[`/${state.language}/services`]}>
    <button ref={triggerRef} onClick={() => setOpen(true)}>Language trigger</button>
    {open && <LanguageDrawer triggerRef={triggerRef} close={() => setOpen(false)} />}
  </MemoryRouter></QueryClientProvider>;
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.useFakeTimers();
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  await act(async () => { await vi.runAllTimersAsync(); });
  client.clear(); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers();
});

describe("offline language drawer keyboard ownership", () => {
  it.each(["zh", "en", "ms"] as const)("closes %s and restores focus before the document Escape hook is ready", async (language) => {
    state.language = language;
    await act(async () => { root.render(<Harness />); });
    const trigger = container.querySelector("button")!;
    const nativeAdd = document.addEventListener.bind(document);
    let deferredEscapeHooks = 0;
    // A portal may already own focus before its document-level dismiss hook is
    // ready. The content must still own Escape; do not replace other listeners.
    vi.spyOn(document, "addEventListener").mockImplementation((type, listener, options) => {
      if (type === "keydown") { deferredEscapeHooks++; return; }
      nativeAdd(type, listener, options);
    });
    await act(async () => { trigger.click(); });
    await act(async () => { await vi.runAllTimersAsync(); });
    const close = document.querySelector<HTMLButtonElement>(".language-drawer__close")!;
    expect(close).not.toBeNull();
    expect(deferredEscapeHooks).toBeGreaterThan(0);
    await act(async () => {
      close.focus();
      close.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    });
    await act(async () => { await vi.runAllTimersAsync(); });
    expect(document.querySelector(".language-drawer")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
