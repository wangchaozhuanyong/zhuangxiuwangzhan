import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setAdminLang } from "@/lib/adminLocale";
import AdminLayout from "@/pages/admin/AdminLayout";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/pages/admin/AdminAuthProvider", () => ({ useAdminAuth: () => ({ role: "super_admin" }) }));
vi.mock("@/hooks/useInteractionQuery", () => ({ useInteractionQuery: () => ({ data: undefined }) }));
vi.mock("@/components/PublicUpdateNotice", () => ({ default: () => null }));
vi.mock("@/components/SmartImage", () => ({ default: () => null }));

describe("admin form language transitions", () => {
  afterEach(() => { setAdminLang("zh"); vi.unstubAllGlobals(); });

  it("updates accessible names after a delayed child render even when another scan is queued, retaining input", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    setAdminLang("zh");
    const scheduled = new Map<number, { run: IdleRequestCallback; timeout?: number }>();
    let nextId = 0;
    vi.stubGlobal("requestIdleCallback", (run: IdleRequestCallback, options?: IdleRequestOptions) => {
      const id = ++nextId; scheduled.set(id, { run, timeout: options?.timeout }); return id;
    });
    vi.stubGlobal("cancelIdleCallback", (id: number) => scheduled.delete(id));
    const flushAccessibility = async () => {
      await act(async () => {
        for (const [id, task] of [...scheduled]) {
          if (task.timeout !== 900) continue;
          scheduled.delete(id); task.run({ didTimeout: false, timeRemaining: () => 20 });
        }
      });
    };
    let renderChildLabel: (label: string) => void = () => {};
    function Editor() {
      const [label, setLabel] = useState("中文标题");
      const [value, setValue] = useState("unsaved editor content");
      renderChildLabel = setLabel;
      return <div data-testid="editor"><label>{label}</label><input value={value} onChange={event => setValue(event.target.value)} /></div>;
    }
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const container = document.createElement("div"); document.body.appendChild(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<QueryClientProvider client={client}><MemoryRouter initialEntries={["/admin/services"]}><TooltipProvider><Routes><Route path="/admin" element={<AdminLayout />}><Route path="services" element={<Editor />} /></Route></Routes></TooltipProvider></MemoryRouter></QueryClientProvider>));
      await flushAccessibility();
      const input = container.querySelector("[data-testid=editor] input") as HTMLInputElement;
      expect(input.getAttribute("aria-label")).toBe("中文标题");
      await act(async () => (container.querySelector('button[aria-label="英文"]') as HTMLButtonElement).click());
      await flushAccessibility();
      // A child can commit translated labels after the layout's language effect.
      // Another child insertion has already queued the ordinary field scan.
      await act(async () => container.querySelector("[data-testid=editor]")!.appendChild(document.createElement("span")));
      await act(async () => renderChildLabel("Chinese title"));
      await flushAccessibility();
      expect(input.getAttribute("aria-label")).toBe("Chinese title");
      expect(input.value).toBe("unsaved editor content");
    } finally {
      await act(async () => root.unmount()); client.clear(); container.remove();
    }
  });
});
