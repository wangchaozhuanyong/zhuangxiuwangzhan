import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminContentEditor from "./AdminContentEditor";
import { copy } from "@/lib/adminContentEditorUtils";
import { translateFieldLabel, translateStatusLabel } from "@/i18n/displayLabels";

const fixtures = vi.hoisted(() => ({ lang: "zh" as "zh" | "en", save: vi.fn() }));
vi.mock("@/lib/adminLocale", async original => ({ ...await original<typeof import("@/lib/adminLocale")>(), getAdminLang: () => fixtures.lang }));
vi.mock("@/lib/supabase", () => ({ isSupabaseConfigured: true, supabase: {} }));
vi.mock("@/lib/adminCmsQueries", () => ({ useAdminEditorRows: () => ({ data: [], isFetching: false, isLoading: false, isInitialError: false }), useAdminContentRecord: () => ({ data: undefined }) }));
vi.mock("@/lib/adminMutation", () => ({ saveAdminRecord: fixtures.save, formatAdminMutationError: () => "Save failed" }));
vi.mock("@/components/admin/AdminMalayFields", () => ({ default: () => null }));
vi.mock("./AdminImageUpload", () => ({ default: () => null, getAdminImagePreviewVariant: () => "cover" }));
vi.mock("./AdminProjectImages", () => ({ default: () => null }));
vi.mock("@/components/admin/AdminHomeSectionVisibility", () => ({ default: () => null }));
let root: Root | undefined; let node: HTMLDivElement; let client: QueryClient;
afterEach(async () => { if (root) await act(async () => root!.unmount()); root = undefined; node?.remove(); client?.clear(); vi.unstubAllGlobals(); });

describe("generic content status and field labels", () => {
  it.each(["service_areas", "landing_pages", "testimonials"].flatMap(table => ["zh", "en"].map(lang => [table, lang] as const)))(
    "shows localized allowed statuses and saves the raw contract for %s in %s", async (table, lang) => {
      vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); fixtures.lang = lang as "zh" | "en";
      fixtures.save.mockReset().mockImplementation(async ({ payload }) => ({ ...payload, id: "synthetic-new-record" }));
      node = document.createElement("div"); document.body.append(node); root = createRoot(node); client = new QueryClient();
      await act(async () => root!.render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[`/admin/content/${table}`]}><TooltipProvider><Routes><Route path="/admin/content/:type" element={<AdminContentEditor />} /></Routes></TooltipProvider></MemoryRouter></QueryClientProvider>));
      const label = Array.from(node.querySelectorAll("label")).find(label => label.textContent?.trim() === translateFieldLabel("status", fixtures.lang))!;
      expect(label.control).toBeInstanceOf(HTMLSelectElement);
      const select = label.control as HTMLSelectElement;
      if (table === "landing_pages") {
        const imageLabel = Array.from(node.querySelectorAll("label")).find(label => label.textContent?.trim() === translateFieldLabel("hero_image_url", fixtures.lang))!;
        expect(imageLabel.control).toBeInstanceOf(HTMLInputElement);
      }
      expect(Array.from(select.options).map(option => option.value)).toEqual(["draft", "published", "archived"]);
      expect(select.options[1].textContent).toBe(translateStatusLabel(table, "published", fixtures.lang));
      await act(async () => { select.value = "published"; select.dispatchEvent(new Event("change", { bubbles: true })); });
      await act(async () => Array.from(node.querySelectorAll("button")).find(button => button.textContent === copy[fixtures.lang].save)!.click());
      expect(fixtures.save).toHaveBeenCalledOnce();
      expect(fixtures.save.mock.calls[0][0]).toMatchObject({ table, payload: { status: "published" } });
    },
  );
});
