import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAdminAboutEditorData, fetchAdminHomeEditorData } from "@/lib/adminEditorData";
import {
  fetchAboutEditorCtaBlock,
  fetchAboutSectionRecord,
  fetchHomeEditorAuxiliaryRows,
  fetchHomeSectionRecord,
  hasAdminEditorDatabaseClient,
} from "./adminEditorRepository";
import * as home from "@/backend/modules/home";
import * as company from "@/backend/modules/company";

type ReadResponse = { data: unknown; error: Error | null };

const { responses, from, abortSignal, configuration, queryShapes } = vi.hoisted(() => ({
  responses: new Map<string, ReadResponse>(),
  from: vi.fn(),
  abortSignal: vi.fn(),
  configuration: { available: true },
  queryShapes: [] as { table: string; filters: [string, unknown][]; orders: string[]; limit?: number }[],
}));

vi.mock("@/lib/supabase", () => ({
  get isSupabaseConfigured() { return configuration.available; },
  supabase: { from },
  requireSupabase: () => ({ from }),
}));

function readBuilder(table: string) {
  const filters = new Map<string, unknown>();
  const shape: (typeof queryShapes)[number] = { table, filters: [], orders: [] };
  queryShapes.push(shape);
  const response = () => responses.get(`${table}:${filters.get("section_key") || filters.get("block_key") || ""}`)
    || responses.get(table)
    || { data: table === "cta_blocks" ? null : [], error: null };
  const builder = {
    select: () => builder,
    eq: (column: string, value: unknown) => { filters.set(column, value); shape.filters.push([column, value]); return builder; },
    order: (column: string) => { shape.orders.push(column); return builder; },
    limit: (limit: number) => { shape.limit = limit; return builder; },
    maybeSingle: () => builder,
    abortSignal: (signal: AbortSignal) => { abortSignal(table, signal); return builder; },
    then: <TResult1 = ReadResponse, TResult2 = never>(
      fulfilled?: ((value: ReadResponse) => TResult1 | PromiseLike<TResult1>) | null,
      rejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ) => Promise.resolve(response()).then(fulfilled, rejected),
  };
  return builder;
}

const homeKey = ["admin", "home_editor"];
const aboutKey = ["admin", "about_editor"];
const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });

describe("admin homepage and about editor read failures", () => {
  beforeEach(() => {
    responses.clear();
    configuration.available = true;
    queryShapes.length = 0;
    from.mockReset().mockImplementation(readBuilder);
    abortSignal.mockReset();
  });

  it.each([
    "home_sections:stats",
    "home_sections:why_choose_us",
    "home_sections:brand_partners",
    "process_steps",
    "faqs",
    "cta_blocks:home_final",
  ])("keeps a failed %s read out of the successful home cache", async (resource) => {
    const error = new Error("Read unavailable");
    responses.set(resource, { data: null, error });
    const client = makeClient();
    try {
      await expect(client.fetchQuery({ queryKey: homeKey, queryFn: ({ signal }) => fetchAdminHomeEditorData(signal) })).rejects.toBe(error);
      expect(client.getQueryState(homeKey)?.status).toBe("error");
      expect(client.getQueryData(homeKey)).toBeUndefined();
    } finally {
      client.clear();
    }
  });

  it.each(["about_sections:hero", "cta_blocks:about_final"])(
    "keeps a failed %s read out of the successful about cache", async (resource) => {
      const error = new Error("Read unavailable");
      responses.set(resource, { data: null, error });
      const client = makeClient();
      try {
        await expect(client.fetchQuery({ queryKey: aboutKey, queryFn: ({ signal }) => fetchAdminAboutEditorData(signal) })).rejects.toBe(error);
        expect(client.getQueryState(aboutKey)?.status).toBe("error");
        expect(client.getQueryData(aboutKey)).toBeUndefined();
      } finally {
        client.clear();
      }
    },
  );

  it("retains the last real home bundle after a refresh fails and recovers on retry", async () => {
    responses.set("home_sections:stats", { data: [{ id: "test-stats", section_key: "stats", items_zh: [{ value: "10" }] }], error: null });
    responses.set("process_steps", { data: [{ id: "test-step", step_number: 1 }], error: null });
    const client = makeClient();
    try {
      const options = { queryKey: homeKey, queryFn: ({ signal }: { signal: AbortSignal }) => fetchAdminHomeEditorData(signal) };
      const saved = await client.fetchQuery(options);
      responses.set("process_steps", { data: null, error: new Error("Refresh unavailable") });
      await expect(client.fetchQuery(options)).rejects.toThrow("Refresh unavailable");
      expect(client.getQueryData(homeKey)).toBe(saved);
      expect(client.getQueryState(homeKey)?.status).toBe("error");

      responses.set("process_steps", { data: [{ id: "test-new-step", step_number: 2 }], error: null });
      const refreshed = await client.fetchQuery(options);
      expect(refreshed.processSteps[0]?.id).toBe("test-new-step");
      expect(client.getQueryState(homeKey)?.status).toBe("success");
    } finally {
      client.clear();
    }
  });

  it("accepts successfully empty rows as empty data rather than a read failure", async () => {
    await expect(fetchAdminHomeEditorData()).resolves.toEqual({
      stats: null, why: null, brandPartnersVisibility: null, processSteps: [], faqRows: [], ctaBlock: null,
    });
    const about = await fetchAdminAboutEditorData();
    expect(Object.values(about.sections).every((row) => row === null)).toBe(true);
    expect(about.ctaBlock).toBeNull();
  });

  it.each([
    { name: "home", read: fetchAdminHomeEditorData, tables: ["home_sections", "home_sections", "home_sections", "process_steps", "faqs", "cta_blocks"] },
    { name: "about", read: fetchAdminAboutEditorData, tables: ["about_sections", "about_sections", "about_sections", "about_sections", "about_sections", "about_sections", "about_sections", "cta_blocks"] },
  ])("attaches the same cancellation signal to every $name transport", async ({ read, tables }) => {
    const controller = new AbortController();
    await read(controller.signal);
    expect(abortSignal.mock.calls.map(([table]) => table).sort()).toEqual([...tables].sort());
    expect(abortSignal.mock.calls.every(([, signal]) => signal === controller.signal)).toBe(true);
  });

  it("keeps the existing compatibility exports bound to the owning modules", () => {
    expect(fetchAdminHomeEditorData).toBe(home.loadAdminHomeEditorData);
    expect(fetchAdminAboutEditorData).toBe(company.loadAdminAboutEditorData);
    expect(fetchHomeSectionRecord).toBe(home.loadHomeSectionRecord);
    expect(fetchAboutSectionRecord).toBe(company.loadAboutSectionRecord);
    expect(fetchHomeEditorAuxiliaryRows).toBe(company.loadHomeEditorAuxiliaryRows);
    expect(fetchAboutEditorCtaBlock).toBe(company.loadAboutEditorCtaBlock);
    expect(hasAdminEditorDatabaseClient).toBe(home.hasAdminEditorDatabaseClient);
  });

  it("retains homepage record keys and company filters when composing the bundle", async () => {
    responses.set("home_sections:stats", { data: [{ id: "stats", section_key: "stats" }], error: null });
    responses.set("home_sections:why_choose_us", { data: [{ id: "why", section_key: "why_choose_us" }], error: null });
    responses.set("home_sections:brand_partners", { data: [{ id: "partners", section_key: "brand_partners" }], error: null });
    responses.set("cta_blocks:home_final", { data: { block_key: "home_final" }, error: null });
    const bundle = await fetchAdminHomeEditorData();
    expect([bundle.stats?.id, bundle.why?.id, bundle.brandPartnersVisibility?.id]).toEqual(["stats", "why", "partners"]);
    expect(bundle.ctaBlock?.block_key).toBe("home_final");
    expect(queryShapes).toEqual([
      { table: "home_sections", filters: [["section_key", "stats"]], orders: ["sort_order"], limit: 1 },
      { table: "home_sections", filters: [["section_key", "why_choose_us"]], orders: ["sort_order"], limit: 1 },
      { table: "home_sections", filters: [["section_key", "brand_partners"]], orders: ["sort_order"], limit: 1 },
      { table: "process_steps", filters: [], orders: ["sort_order", "step_number"] },
      { table: "faqs", filters: [["page_key", "home"]], orders: ["sort_order"] },
      { table: "cta_blocks", filters: [["block_key", "home_final"]], orders: [] },
    ]);
  });

  it("retains all about keys and the separate about CTA", async () => {
    responses.set("about_sections:intro", { data: [{ section_key: "intro", title_zh: "test intro" }], error: null });
    responses.set("cta_blocks:about_final", { data: { block_key: "about_final" }, error: null });
    const bundle = await fetchAdminAboutEditorData();
    expect(Object.keys(bundle.sections)).toEqual([...company.aboutSectionKeys]);
    expect(bundle.sections.intro?.title_zh).toBe("test intro");
    expect(bundle.ctaBlock?.block_key).toBe("about_final");
    expect(queryShapes.filter((shape) => shape.table === "about_sections").map((shape) => shape.filters[0]?.[1])).toEqual([...company.aboutSectionKeys]);
  });

  it("avoids database reads when the editor client is not configured", async () => {
    configuration.available = false;
    expect(hasAdminEditorDatabaseClient()).toBe(false);
    await expect(fetchAdminHomeEditorData()).resolves.toEqual({ stats: null, why: null, brandPartnersVisibility: null, processSteps: [], faqRows: [], ctaBlock: null });
    await expect(fetchAdminAboutEditorData()).resolves.toEqual({ sections: {}, ctaBlock: null });
    expect(from).not.toHaveBeenCalled();
  });
});
