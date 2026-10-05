import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminStickyActionBar from "@/components/admin/AdminStickyActionBar";
import AdminFormSection from "@/components/admin/AdminFormSection";
import AdminDataTable from "@/components/admin/AdminDataTable";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setAdminLang } from "@/lib/adminLocale";

describe("admin mobile layout behavior", () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); setAdminLang("zh"); });

  it("keeps one working action bar outside the transformed route and clears its reserved space", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ height: 88, top: 756, bottom: 844 } as DOMRect);
    const shell = document.createElement("div"); shell.dataset.adminShell = ""; document.body.appendChild(shell);
    const save = vi.fn();
    const root = createRoot(shell);
    try {
      await act(async () => root.render(<AdminStickyActionBar mobileSticky left={<span>draft</span>} right={<button type="button" onClick={save}>save</button>} />));
      const bar = document.querySelector("[data-admin-mobile-bar]") as HTMLElement;
      expect(bar.parentElement).toBe(document.body);
      expect(shell.style.getPropertyValue("--admin-mobile-action-height")).toBe("88px");
      expect(document.querySelectorAll("[data-admin-mobile-bar] button")).toHaveLength(1);
      await act(async () => (bar.querySelector("button") as HTMLButtonElement).click());
      expect(save).toHaveBeenCalledOnce();
      await act(async () => root.unmount());
      expect(document.querySelector("[data-admin-mobile-bar]")).toBeNull();
      expect(shell.style.getPropertyValue("--admin-mobile-action-height")).toBe("");
    } finally { shell.remove(); }
  });

  it("expands a collapsed section when its native input fails validation without remounting it", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const container = document.createElement("div"); document.body.appendChild(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<TooltipProvider><AdminFormSection title="SEO" collapsible defaultOpen={false}><input required defaultValue="" /></AdminFormSection></TooltipProvider>));
      const input = container.querySelector("input")!;
      const details = container.querySelector("details")!;
      expect(details.open).toBe(false);
      await act(async () => { input.checkValidity(); });
      expect(details.open).toBe(true);
      input.value = "draft text";
      details.open = false;
      details.open = true;
      expect(container.querySelector("input")).toBe(input);
      expect(input.value).toBe("draft text");
    } finally { await act(async () => root.unmount()); container.remove(); }
  });

  it("does not push the first lines of a tall editor above the keyboard viewport", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList);
    const scroll = vi.spyOn(window, "scrollBy").mockImplementation(() => {});
    const shell = document.createElement("div"); shell.dataset.adminShell = ""; document.body.appendChild(shell);
    const root = createRoot(shell);
    try {
      await act(async () => root.render(<><textarea /><input /><AdminStickyActionBar mobileSticky right={<button>save</button>} /></>));
      const textarea = shell.querySelector("textarea")!;
      const input = shell.querySelector("input")!;
      const bar = document.querySelector("[data-admin-mobile-bar]")!;
      vi.spyOn(bar, "getBoundingClientRect").mockReturnValue({ top: 320, bottom: 392, height: 72 } as DOMRect);
      vi.spyOn(textarea, "getBoundingClientRect").mockReturnValue({ top: 90, bottom: 450, height: 360 } as DOMRect);
      vi.spyOn(input, "getBoundingClientRect").mockReturnValue({ top: 300, bottom: 344, height: 44 } as DOMRect);
      await act(async () => textarea.focus());
      expect(scroll).not.toHaveBeenCalled();
      await act(async () => input.focus());
      expect(scroll).toHaveBeenCalledWith({ top: 36, behavior: "instant" });
    } finally { await act(async () => root.unmount()); shell.remove(); }
  });

  it.each(["input", "textarea"])("keeps %s and the same save button usable when the keyboard resizes both viewports", async (tag) => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList);
    const viewport = Object.assign(new EventTarget(), { height: 844, width: 390, offsetTop: 0, scale: 1 });
    vi.stubGlobal("visualViewport", viewport);
    vi.stubGlobal("innerHeight", 844);
    vi.stubGlobal("innerWidth", 390);
    const scroll = vi.spyOn(window, "scrollBy").mockImplementation(() => {});
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ height: 72, top: 772, bottom: 844 } as DOMRect);
    const save = vi.fn();
    const shell = document.createElement("div"); shell.dataset.adminShell = ""; document.body.appendChild(shell);
    const root = createRoot(shell);
    try {
      await act(async () => root.render(<>{tag === "input" ? <input /> : <textarea rows={20} />}<AdminStickyActionBar mobileSticky right={<button onClick={save}>save</button>} /></>));
      const field = shell.querySelector<HTMLInputElement | HTMLTextAreaElement>(tag)!;
      const bar = document.querySelector<HTMLElement>("[data-admin-mobile-bar]")!;
      const button = bar.querySelector("button")!;
      await act(async () => field.focus());
      scroll.mockClear();
      await act(async () => {
        viewport.height = 460;
        vi.stubGlobal("innerHeight", 460);
        viewport.dispatchEvent(new Event("resize"));
      });
      expect(bar.dataset.adminKeyboardPaused).toBe("true");
      expect(bar.classList.contains("fixed")).toBe(false);
      expect(bar.parentElement).toBe(document.body);
      expect(shell.style.getPropertyValue("--admin-mobile-action-height")).toBe("");
      expect(document.activeElement).toBe(field);
      expect(scroll).not.toHaveBeenCalled();
      await act(async () => button.focus());
      expect(bar.dataset.adminKeyboardPaused).toBe("true");
      await act(async () => {
        viewport.height = 844;
        vi.stubGlobal("innerHeight", 844);
        viewport.dispatchEvent(new Event("resize"));
      });
      expect(document.querySelector("[data-admin-mobile-bar] button")).toBe(button);
      expect(document.activeElement).toBe(button);
      expect(bar.classList.contains("fixed")).toBe(true);
      expect(shell.style.getPropertyValue("--admin-mobile-action-height")).toBe("72px");
      await act(async () => button.click());
      expect(save).toHaveBeenCalledOnce();
    } finally { await act(async () => root.unmount()); shell.remove(); }
  });

  it("ignores pinch zoom and browser chrome changes and resets the baseline after rotation", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList);
    const viewport = Object.assign(new EventTarget(), { height: 844, width: 390, offsetTop: 0, scale: 1 });
    vi.stubGlobal("visualViewport", viewport);
    vi.stubGlobal("innerHeight", 844);
    vi.stubGlobal("innerWidth", 390);
    const shell = document.createElement("div"); shell.dataset.adminShell = ""; document.body.appendChild(shell);
    const root = createRoot(shell);
    try {
      await act(async () => root.render(<><textarea /><AdminStickyActionBar mobileSticky right={<button>save</button>} /></>));
      const field = shell.querySelector("textarea")!;
      const bar = document.querySelector<HTMLElement>("[data-admin-mobile-bar]")!;
      await act(async () => field.focus());
      await act(async () => { viewport.height = 760; viewport.dispatchEvent(new Event("resize")); });
      expect(bar.dataset.adminKeyboardPaused).toBeUndefined();
      await act(async () => { viewport.scale = 2; viewport.height = 422; viewport.dispatchEvent(new Event("resize")); });
      expect(bar.dataset.adminKeyboardPaused).toBeUndefined();
      await act(async () => {
        viewport.scale = 1; viewport.height = 390; viewport.width = 700;
        vi.stubGlobal("innerWidth", 700); vi.stubGlobal("innerHeight", 390);
        viewport.dispatchEvent(new Event("resize"));
      });
      expect(bar.dataset.adminKeyboardPaused).toBeUndefined();
      await act(async () => { viewport.height = 230; vi.stubGlobal("innerHeight", 230); viewport.dispatchEvent(new Event("resize")); });
      expect(bar.dataset.adminKeyboardPaused).toBe("true");
      await act(async () => { viewport.height = 390; vi.stubGlobal("innerHeight", 390); viewport.dispatchEvent(new Event("resize")); });
      expect(bar.dataset.adminKeyboardPaused).toBeUndefined();
    } finally { await act(async () => root.unmount()); shell.remove(); }
  });

  it("pauses for an iOS visual viewport resize and stays paused through rotation until the keyboard closes", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList);
    const viewport = Object.assign(new EventTarget(), { height: 844, width: 390, offsetTop: 0, scale: 1 });
    vi.stubGlobal("visualViewport", viewport);
    vi.stubGlobal("innerHeight", 844);
    vi.stubGlobal("innerWidth", 390);
    vi.spyOn(window, "scrollBy").mockImplementation(() => {});
    const shell = document.createElement("div"); shell.dataset.adminShell = ""; document.body.appendChild(shell);
    const root = createRoot(shell);
    try {
      await act(async () => root.render(<><textarea defaultValue="kept draft" /><AdminStickyActionBar mobileSticky right={<button>save</button>} /></>));
      const field = shell.querySelector("textarea")!;
      const bar = document.querySelector<HTMLElement>("[data-admin-mobile-bar]")!;
      const button = bar.querySelector("button")!;
      await act(async () => field.focus());
      await act(async () => { viewport.height = 460; viewport.dispatchEvent(new Event("resize")); });
      expect(window.innerHeight).toBe(844);
      expect(bar.dataset.adminKeyboardPaused).toBe("true");
      await act(async () => {
        viewport.height = 230; viewport.width = 700;
        vi.stubGlobal("innerWidth", 700); vi.stubGlobal("innerHeight", 390);
        viewport.dispatchEvent(new Event("resize"));
      });
      expect(bar.dataset.adminKeyboardPaused).toBe("true");
      await act(async () => button.focus());
      expect(bar.dataset.adminKeyboardPaused).toBe("true");
      await act(async () => { viewport.height = 390; viewport.dispatchEvent(new Event("resize")); });
      expect(bar.dataset.adminKeyboardPaused).toBeUndefined();
      expect(document.querySelector("[data-admin-mobile-bar] button")).toBe(button);
      expect(field.value).toBe("kept draft");
      expect(document.activeElement).toBe(button);
    } finally { await act(async () => root.unmount()); shell.remove(); }
  });

  it("keeps secondary list fields reachable while identifying each record and its status", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const container = document.createElement("div"); document.body.appendChild(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<AdminDataTable rows={[{ id: "sample" }]} rowKey={row => row.id} columns={[
        { key: "title", header: "Title", mobileRole: "title", cell: () => <a href="#sample">Example case</a> },
        { key: "status", header: "Status", mobileRole: "badge", cell: () => "Draft" },
        { key: "updated", header: "Updated", mobileRole: "detail", cell: () => "2026-10-05" },
      ]} />));
      const article = container.querySelector("article")!;
      expect(article.querySelector("a")?.textContent).toBe("Example case");
      expect(article.querySelector('[aria-label="Status"]')?.textContent).toBe("Draft");
      const details = article.querySelector("details")!;
      expect(details.open).toBe(false);
      expect(details.textContent).toContain("2026-10-05");
      await act(async () => details.querySelector("summary")!.click());
      expect(details.open).toBe(true);
    } finally { await act(async () => root.unmount()); container.remove(); }
  });
});
