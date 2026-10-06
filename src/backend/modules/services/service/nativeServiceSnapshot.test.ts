import { describe, expect, it, vi } from "vitest";
import { canReadNativeServiceSnapshot, nativeServiceSnapshotTargets as targets, serializeNativeServiceSnapshot } from "./nativeServiceSnapshot";
import { loadAdminServiceNativeSnapshot } from "./serviceService";

const { read } = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("../repository/serviceRepository", async (importOriginal) => ({ ...await importOriginal<typeof import("../repository/serviceRepository")>(), fetchAdminServiceDetail: read }));
const timestamp = "2026-10-06T09:00:00.123456+08:00";
const bath = (): Record<string, unknown> => ({
  id: targets.bathroom.id, slug: targets.bathroom.slug, status: "published", version: 4, updated_at: timestamp,
  process_steps_en: [null, { title: "", desc: "  text  ", extra: [false, 0] }], process_steps_zh: [],
  faqs_en: null, faqs_zh: [{ q: "", a: " " }], suitable_for_en: [null, "", "  value  "], suitable_for_zh: [],
  common_projects_en: null, common_projects_zh: [], scope_items_en: [], scope_items_zh: [""],
  content_en: "  content  ", content_zh: null, title_en: "", title_zh: "", excerpt_en: "", excerpt_zh: "",
  image_url: null, alt_en: "", alt_zh: "", seo_title_en: "", seo_title_zh: "", seo_description_en: "", seo_description_zh: "",
  created_at: "not-exported", unrelated: "not-exported",
});
const art = (): Record<string, unknown> => ({ id: targets.artistic.id, slug: targets.artistic.slug, updated_at: timestamp,
  process_steps_en: [null, null, null, null, { title: "not-exported", desc: "  fifth  " }, { desc: "not-exported" }],
  process_steps_zh: [0, false, "", [], { desc: null }], status: "published", version: 8 });

describe("exact native service snapshot contracts", () => {
  it("keeps exactly 28 Bathroom values and their types, whitespace, nulls and order", () => {
    const raw = bath(); const before = JSON.stringify(raw);
    const output = JSON.parse(serializeNativeServiceSnapshot(targets.bathroom.id, raw));
    expect(Object.keys(output)).toHaveLength(28);
    for (const key of Object.keys(output)) expect(output[key]).toEqual(raw[key]);
    expect(output).not.toHaveProperty("unrelated"); expect(output).not.toHaveProperty("created_at");
    expect(JSON.stringify(raw)).toBe(before); expect(output.updated_at).toBe(timestamp);
  });
  it("reads raw index 4 even when the UI would filter preceding entries", () => {
    expect(JSON.parse(serializeNativeServiceSnapshot(targets.artistic.id, art()))).toEqual({
      "process_steps_en[4].desc": "  fifth  ", "process_steps_zh[4].desc": null,
      id: targets.artistic.id, slug: targets.artistic.slug, updated_at: timestamp,
    });
  });
  it.each(["version", "updated_at", "content_en", "process_steps_en"])("rejects missing %s instead of supplying defaults", (field) => {
    const raw = bath(); delete raw[field]; expect(() => serializeNativeServiceSnapshot(targets.bathroom.id, raw)).toThrow();
  });
  it.each([null, 0, "4", 1.2])("rejects a nonnative version %s", (value) => {
    expect(() => serializeNativeServiceSnapshot(targets.bathroom.id, { ...bath(), version: value })).toThrow();
  });
  it.each(["2026-10-06T00:00:00.1234567Z", "2026-10-06T00:00:00", "invalid", null])("rejects an unusable raw timestamp %s", (value) => {
    expect(() => serializeNativeServiceSnapshot(targets.bathroom.id, { ...bath(), updated_at: value })).toThrow();
  });
  it.each([{ id: targets.artistic.id }, { slug: "other" }, { status: "unknown" }, { suitable_for_en: [17] }, { process_steps_en: {} }, { content_en: undefined }])("fails closed on identity or type errors: %j", (change) => {
    expect(() => serializeNativeServiceSnapshot(targets.bathroom.id, { ...bath(), ...change })).toThrow();
  });
  it.each([[{ desc: "only-one" }], [null, null, null, null, {}], [null, null, null, null, { desc: 4 }]])("does not guess missing or nonstring Artistic leaves", (steps) => {
    expect(() => serializeNativeServiceSnapshot(targets.artistic.id, { ...art(), process_steps_en: steps })).toThrow();
  });
  it("rejects sparse arrays and non-JSON values without silently replacing them", () => {
    const sparse = new Array(2); sparse[1] = "text";
    for (const value of [sparse, [undefined], [{ value: NaN }], [new Date()]]) expect(() => serializeNativeServiceSnapshot(targets.bathroom.id, { ...bath(), process_steps_en: value })).toThrow();
  });
  it("keeps Office and all other targets unavailable", () => {
    for (const id of [undefined, "a87541ac", "office-renovation", "other"]) expect(canReadNativeServiceSnapshot(id)).toBe(false);
    expect(() => serializeNativeServiceSnapshot("office-renovation", bath())).toThrow();
  });
});

describe("fresh normal detail reads", () => {
  it("performs a new normal read for each snapshot and only returns the bounded serialized values", async () => {
    read.mockReset().mockResolvedValue(bath());
    const signal = new AbortController().signal;
    for (let index = 0; index < 2; index++) expect(Object.keys(JSON.parse(await loadAdminServiceNativeSnapshot(targets.bathroom.id, signal)))).toHaveLength(28);
    expect(read).toHaveBeenCalledTimes(2); expect(read).toHaveBeenCalledWith(targets.bathroom.id, signal);
  });
  it("does not query unadmitted Office or unknown targets", async () => {
    read.mockReset();
    await expect(loadAdminServiceNativeSnapshot("office-renovation", new AbortController().signal)).rejects.toThrow();
    expect(read).not.toHaveBeenCalled();
  });
  it("does not read an already cancelled request", async () => {
    read.mockReset(); const controller = new AbortController(); controller.abort();
    await expect(loadAdminServiceNativeSnapshot(targets.bathroom.id, controller.signal)).rejects.toThrow(); expect(read).not.toHaveBeenCalled();
  });
  it("rejects a late response even when the underlying read ignored cancellation", async () => {
    const controller = new AbortController();
    read.mockReset().mockImplementation(async () => { controller.abort(); return bath(); });
    await expect(loadAdminServiceNativeSnapshot(targets.bathroom.id, controller.signal)).rejects.toThrow();
  });
  it("does not fall back to cached or edited data after a read error", async () => {
    read.mockReset().mockRejectedValue(new Error("fixture read failed"));
    await expect(loadAdminServiceNativeSnapshot(targets.bathroom.id, new AbortController().signal)).rejects.toThrow("fixture read failed");
    expect(read).toHaveBeenCalledTimes(1);
  });
});
