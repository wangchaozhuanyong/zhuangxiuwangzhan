import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminSimpleCms from "./AdminSimpleCms";
import { adminSimpleCmsConfigText } from "@/i18n/adminSimpleCmsText";

vi.mock("@/lib/adminLocale", async original => ({ ...await original<typeof import("@/lib/adminLocale")>(), getAdminLang: () => "zh" }));
vi.mock("@/lib/supabase", () => ({ isSupabaseConfigured: true, supabase: {} }));
vi.mock("@/lib/adminCmsQueries", () => ({ useAdminSimpleCmsRows: () => ({ data: [], isLoading: false, isFetching: false }) }));
vi.mock("@/components/admin/AdminMalayFields", () => ({ default: () => null }));
vi.mock("@/components/admin/AdminHomeSectionVisibility", () => ({ default: () => null }));
vi.mock("./AdminImageUpload", () => ({ default: () => null, getAdminImagePreviewVariant: () => "cover" }));
let root: Root | undefined; let node: HTMLDivElement; let client: QueryClient;
afterEach(async () => { if (root) await act(async () => root!.unmount()); root = undefined; node?.remove(); client?.clear(); vi.unstubAllGlobals(); });

describe("CMS image URL labels identify their inputs", () => {
  it.each([["brand_partners", "logo_url"], ["before_after_items", "before_image_url"], ["before_after_items", "after_image_url"]] as const)(
    "%s %s has an explicit label association across the upload wrapper", async (module, field) => {
      vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); client = new QueryClient(); node = document.createElement("div"); document.body.append(node); root = createRoot(node);
      await act(async () => root!.render(<QueryClientProvider client={client}><MemoryRouter><TooltipProvider><AdminSimpleCms module={module} /></TooltipProvider></MemoryRouter></QueryClientProvider>));
      const label = Array.from(node.querySelectorAll("label")).find(label => label.textContent?.trim() === adminSimpleCmsConfigText.zh[module].fields[field])!;
      expect(label.control).toBeInstanceOf(HTMLInputElement);
      expect(label.control?.getAttribute("type")).not.toBe("file");
    },
  );
});
