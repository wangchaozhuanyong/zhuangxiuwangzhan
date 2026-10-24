import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminMalayFields from "./AdminMalayFields";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { hasProtectedChanges, navigateAfterSave } from "@/lib/navigationProtection";

vi.mock("@/pages/admin/AdminAuthProvider", () => ({ useAdminAuth: () => ({ role: "content_editor" }) }));
vi.mock("@/lib/adminPreferences", () => ({ useAdminLang: () => "zh" }));
const generate = vi.hoisted(() => vi.fn());
vi.mock("@/backend/modules/system", () => ({ generateAdminEnglishContent: generate, requestPublicContentInvalidation: vi.fn() }));
let root: Root | undefined;
let node: HTMLDivElement;
let client: QueryClient;
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined; node?.remove(); client?.clear(); vi.unstubAllGlobals();
});

describe("Malay editor preserves the existing form contract", () => {
  it("displays a saved translation's unconfirmed job receipt without repeating generation", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    generate.mockResolvedValue({ ok: true, warnings: ["Translation job status could not be confirmed."] });
    client = new QueryClient(); node = document.createElement("div"); document.body.append(node); root = createRoot(node);
    await act(async () => root!.render(<QueryClientProvider client={client}><AdminMalayFields
      record={{ id: "synthetic-service", title_en: "Existing English", title_ms: null }} table="services" onChange={vi.fn()} />
    </QueryClientProvider>));
    const button = Array.from(node.querySelectorAll("button")).find(button => button.textContent?.includes("补齐马来语翻译"))!;
    await act(async () => button.click());
    expect(node.querySelector('[role="status"]')).toHaveTextContent("勿重复翻译");
    expect(generate).toHaveBeenCalledExactlyOnceWith({ table: "services", id: "synthetic-service", targetLanguage: "ms", force: false });
  });
  it("edits only Malay content and uses the parent form's existing navigation protection", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const observed = vi.fn();
    function Form() {
      const [record, setRecord] = useState({ id: "synthetic-service", title_en: "Existing English", title_zh: "原有中文", title_ms: "Tajuk asal" });
      const [dirty, setDirty] = useState(false);
      useUnsavedChangesWarning(dirty);
      return <AdminMalayFields record={record} table="services" dirty={dirty} onChange={(patch) => {
        setRecord((current) => { const next = { ...current, ...patch }; observed(next); return next; }); setDirty(true);
      }} />;
    }
    client = new QueryClient(); node = document.createElement("div"); document.body.append(node); root = createRoot(node);
    await act(async () => root!.render(<QueryClientProvider client={client}><Form /></QueryClientProvider>));
    const input = node.querySelector<HTMLInputElement>('input[lang="ms-MY"]')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "Tajuk baharu");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(observed).toHaveBeenLastCalledWith(expect.objectContaining({ title_en: "Existing English", title_zh: "原有中文", title_ms: "Tajuk baharu" }));
    expect(hasProtectedChanges()).toBe(true);
    // A duplicate child registration would block the existing save-and-navigate flow.
    expect(navigateAfterSave(() => false, vi.fn())).toBe(true);
    expect(Array.from(node.querySelectorAll("button")).find((button) => button.textContent?.includes("补齐马来语翻译"))).toBeDisabled();
    await act(async () => root!.unmount()); root = undefined;
    expect(hasProtectedChanges()).toBe(false);
  });
});
