import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, MemoryRouter, RouterProvider, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import LanguageRouteLink from "@/components/LanguageRouteLink";
import { LanguageRouteSync } from "@/components/LanguageRouteSync";
import { PublicRouteImageGate } from "@/components/PublicRouteImageGate";

vi.mock("@/lib/publicRoutePrefetch", () => ({ prefetchPublishedRouteContent: vi.fn(() => new Promise<void>(() => {})) }));
const Location = () => <output>{useLocation().pathname}</output>;

function LanguageScene() {
  const location = useLocation();
  const { language } = useLanguage();
  const [draft, setDraft] = useState("");
  return <>
    <LanguageRouteSync />
    <LanguageRouteLink targetLanguage="zh" to="/zh/contact">Chinese</LanguageRouteLink>
    <LanguageRouteLink targetLanguage="en" to="/en/contact">English</LanguageRouteLink>
    <output>{location.pathname}:{language}</output>
    <PublicRouteImageGate routeKey={location.pathname}>
      <main id="main-content" tabIndex={-1} data-route-pending={language === "en" || undefined}>
        <input aria-label="Draft" value={draft} onChange={(event) => setDraft(event.target.value)} />
      </main>
    </PublicRouteImageGate>
  </>;
}

describe("language navigation", () => {
  it.each(["input", "textarea", "select", "contenteditable"] as const)("keeps pointer editing focus and selection in %s while its click still navigates", async (editorKind) => {
    const onPointerDown = vi.fn();
    const onClick = vi.fn();
    const onTouchStart = vi.fn();
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    try {
      await act(async () => root.render(<QueryClientProvider client={client}><LanguageProvider><MemoryRouter initialEntries={["/zh/services"]}>
        {editorKind === "input" ? <input defaultValue="Unsent draft" /> : editorKind === "textarea" ? <textarea defaultValue="Unsent draft" />
          : editorKind === "select" ? <select defaultValue="draft"><option value="draft">Unsent draft</option></select>
            : <div contentEditable suppressContentEditableWarning tabIndex={0}>Unsent draft</div>}
        <LanguageRouteLink targetLanguage="en" to="/en/services" onPointerDown={onPointerDown} onClick={onClick} onTouchStart={onTouchStart}>English</LanguageRouteLink><Location />
      </MemoryRouter></LanguageProvider></QueryClientProvider>));
      const editor = container.querySelector<HTMLElement>("input,textarea,select,[contenteditable]")!;
      const anchor = container.querySelector("a")!;
      editor.focus();
      if (editor instanceof HTMLInputElement || editor instanceof HTMLTextAreaElement) editor.setSelectionRange(2, 7, "backward");
      if (editorKind === "contenteditable") {
        // JSDOM does not expose the native inherited content-editability flag.
        Object.defineProperty(editor, "isContentEditable", { configurable: true, value: true });
        const range = document.createRange(); range.setStart(editor.firstChild!, 2); range.setEnd(editor.firstChild!, 7);
        const selection = window.getSelection()!; selection.removeAllRanges(); selection.addRange(range);
      }
      await act(async () => anchor.dispatchEvent(new Event("touchstart", { bubbles: true, cancelable: true })));
      const pointerDown = new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0 });
      Object.defineProperty(pointerDown, "isPrimary", { value: true });
      await act(async () => {
        anchor.dispatchEvent(pointerDown);
        // Model the browser's default pointer focus, which JSDOM omits.
        if (!pointerDown.defaultPrevented) anchor.focus();
      });
      expect(pointerDown.defaultPrevented).toBe(true);
      await act(async () => anchor.click());
      expect(container.querySelector("output")).toHaveTextContent("/en/services");
      expect(document.activeElement).toBe(editor);
      if (editor instanceof HTMLInputElement || editor instanceof HTMLTextAreaElement) {
        expect(editor.value).toBe("Unsent draft");
        expect([editor.selectionStart, editor.selectionEnd, editor.selectionDirection]).toEqual([2, 7, "backward"]);
      } else if (editorKind === "contenteditable") expect(window.getSelection()?.toString()).toBe("sent ");
      else expect((editor as HTMLSelectElement).value).toBe("draft");
      expect(onPointerDown).toHaveBeenCalledOnce();
      expect(onClick).toHaveBeenCalledOnce();
      expect(onTouchStart).toHaveBeenCalledOnce();
    } finally {
      await act(async () => root.unmount()); client.clear(); container.remove(); window.getSelection()?.removeAllRanges();
    }
  });

  it("retains native non-editing pointer focus and keyboard activation", async () => {
    const container = document.createElement("div"); document.body.append(container);
    const root = createRoot(container); const client = new QueryClient();
    try {
      await act(async () => root.render(<QueryClientProvider client={client}><LanguageProvider><MemoryRouter initialEntries={["/zh/services"]}>
        <button>Other control</button><LanguageRouteLink targetLanguage="en" to="/en/services">English</LanguageRouteLink><Location />
      </MemoryRouter></LanguageProvider></QueryClientProvider>));
      const anchor = container.querySelector("a")!; container.querySelector("button")!.focus();
      const pointerDown = new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0 });
      Object.defineProperty(pointerDown, "isPrimary", { value: true });
      await act(async () => anchor.dispatchEvent(pointerDown));
      expect(pointerDown.defaultPrevented).toBe(false);
      anchor.focus(); // Native Tab focus is kept on the language anchor.
      await act(async () => anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, detail: 0 })));
      expect(container.querySelector("output")).toHaveTextContent("/en/services"); expect(document.activeElement).toBe(anchor);
    } finally { await act(async () => root.unmount()); client.clear(); container.remove(); }
  });

  it.each([{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { isPrimary: false }, { target: "_blank" }])("keeps modifier, secondary pointer and new-tab defaults: %j", async (options) => {
    const container = document.createElement("div"); document.body.append(container);
    const root = createRoot(container); const client = new QueryClient();
    const onPointerDown = vi.fn();
    try {
      await act(async () => root.render(<QueryClientProvider client={client}><LanguageProvider><MemoryRouter initialEntries={["/zh/services"]}>
        <input defaultValue="Unsent draft" /><LanguageRouteLink targetLanguage="en" to="/en/services" target={"target" in options ? options.target : undefined} onPointerDown={onPointerDown}>English</LanguageRouteLink><Location />
      </MemoryRouter></LanguageProvider></QueryClientProvider>));
      container.querySelector("input")!.focus();
      const event = new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0, ...options });
      Object.defineProperty(event, "isPrimary", { value: "isPrimary" in options ? options.isPrimary : true });
      await act(async () => container.querySelector("a")!.dispatchEvent(event));
      expect(event.defaultPrevented).toBe(false); expect(onPointerDown).toHaveBeenCalledOnce();
      expect(container.querySelector("output")).toHaveTextContent("/zh/services");
    } finally { await act(async () => root.unmount()); client.clear(); container.remove(); }
  });

  it("keeps the final URL, language and focused form together through twenty Data router updates", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const router = createMemoryRouter([{ path: "/:lang/contact", element: <LanguageScene /> }], { initialEntries: ["/zh/contact"] });
    try {
      await act(async () => root.render(<QueryClientProvider client={client}><LanguageProvider><RouterProvider router={router} /></LanguageProvider></QueryClientProvider>));
      await act(async () => vi.advanceTimersByTime(40));
      const input = container.querySelector("input")!;
      input.focus();
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      await act(async () => { setter.call(input, "Synthetic unsent draft"); input.dispatchEvent(new Event("input", { bubbles: true })); });
      for (let index = 0; index < 20; index++) {
        const target = index % 2 ? "zh" : "en";
        await act(async () => container.querySelector<HTMLAnchorElement>(`a[href="/${target}/contact"]`)!.click());
        expect(container.querySelector("output")).toHaveTextContent(`/${target}/contact:${target}`);
        expect(document.documentElement.lang).toBe(target === "zh" ? "zh-CN" : "en");
        expect(container.querySelector("input")).toBe(input);
        expect(input.value).toBe("Synthetic unsent draft");
        expect(document.activeElement).toBe(input);
        expect(container.querySelector(".public-route-content")).not.toHaveAttribute("inert");
        expect(container.querySelector(".public-route-scene")).not.toHaveAttribute("data-pending");
      }
    } finally {
      await act(async () => root.unmount());
      router.dispose();
      client.clear();
      container.remove();
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });
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
