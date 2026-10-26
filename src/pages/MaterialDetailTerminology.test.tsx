// Standalone rendering bypasses the production language route resource gate.
import "@/i18n/malayContent";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { materialCatalogRecords } from "../../scripts/material-catalog-data.mjs";
import { reviewedMaterialMalayTerm, reviewedMaterialChineseTerm } from "../../supabase/functions/_shared/material-terminology.mjs";
import { translateMaterialCategory } from "@/i18n/displayLabels";
import type { MaterialCatalogCategory } from "@/lib/materialCatalog";
import { mapPublishedMaterialRows } from "@/lib/contentApi";
import MaterialDetail from "./MaterialDetail";

const state = vi.hoisted(() => ({ language: "ms" as "ms" | "zh" | "en", category: null as MaterialCatalogCategory | null, meta: null as { malayReady?: boolean } | null }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language, setLanguage: vi.fn() }) }));
vi.mock("@/hooks/usePublishedContent", () => ({ usePublishedMaterialBySlug: () => ({ data: { category: state.category }, isPending: false, isInitialError: false }) }));
vi.mock("@/components/PageMeta", () => ({ default: (props: { malayReady?: boolean }) => { state.meta = props; return null; } }));
vi.mock("@/components/JsonLd", () => ({ JsonLdBreadcrumb: () => null }));
vi.mock("@/components/ImmersiveHero", () => ({ default: () => null }));
let root: Root | undefined;
let container: HTMLDivElement;
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  container?.remove();
  vi.unstubAllGlobals();
  state.language = "ms";
});

const renderMaterial = async (record: Record<string, unknown>) => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  state.category = mapPublishedMaterialRows([record], state.language)[0];
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => root!.render(<MemoryRouter initialEntries={[`/ms/materials/${record.slug}`]}><Routes><Route path="/:lang/materials/:slug" element={<MaterialDetail />} /></Routes></MemoryRouter>));
  return { container };
};

describe("material detail Malay specifications", () => {
  it.each(materialCatalogRecords.map(({ record }: { record: Record<string, unknown> }) => [record.slug, record] as const))("renders complete Chinese specifications and retains English values for %s", async (_slug, record) => {
      state.language = "zh";
      const { container } = await renderMaterial(record);
      const values = () => Array.from(container.querySelectorAll(".fc-route-facts strong")).map(node => node.textContent);
      expect(values()).toEqual([reviewedMaterialChineseTerm("type", record.material_type), reviewedMaterialChineseTerm("color", record.color),
        reviewedMaterialChineseTerm("texture", record.texture), translateMaterialCategory(String(record.category), "zh")]);
      state.language = "en";
      await act(async () => root!.render(<MemoryRouter initialEntries={[`/en/materials/${record.slug}`]}><Routes><Route path="/:lang/materials/:slug" element={<MaterialDetail />} /></Routes></MemoryRouter>));
      expect(values()).toEqual([record.material_type, record.color, record.texture, record.category]);
    });
  it.each(materialCatalogRecords.map(({ record }: { record: Record<string, unknown> }) => [record.slug, record] as const))("renders reviewed specifications in the actual page for %s", async (_slug, record) => {
      const { container } = await renderMaterial(record);
      const facts = container.querySelector(".fc-route-facts")!;
      const values = Array.from(facts.querySelectorAll("strong")).map(node => node.textContent);
      expect(values).toEqual([
        reviewedMaterialMalayTerm("type", record.material_type), reviewedMaterialMalayTerm("color", record.color),
        reviewedMaterialMalayTerm("texture", record.texture), reviewedMaterialMalayTerm("category", record.category),
      ]);
      expect(Array.from(facts.querySelectorAll("span")).map(node => node.textContent)).toEqual(["Jenis", "Warna", "Tekstur", "Kategori"]);
      expect(facts.textContent).not.toMatch(/pemarah|Adat Seluruh Rumah|Pandangan Marmar|Tulang herring|kayu balak/);
    });

  it("withholds unreviewed specifications and disqualifies Malay SEO readiness", async () => {
    const record = { ...materialCatalogRecords[0].record, texture: "Unreviewed specification", title_ms: "Lantai SPC", seo_title_ms: "Lantai SPC", seo_description_ms: "Penerangan lantai" };
    const { container } = await renderMaterial(record);
    expect(container.querySelector(".fc-route-facts")?.textContent).toContain("Hubungi kami untuk mengesahkan spesifikasi ini");
    expect(container.querySelector(".fc-route-facts")?.textContent).not.toContain("Unreviewed specification");
    expect(state.meta?.malayReady).toBe(false);
  });
});
