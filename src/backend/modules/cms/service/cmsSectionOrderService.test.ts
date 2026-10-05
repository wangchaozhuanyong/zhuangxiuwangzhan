import { describe, expect, it, vi } from "vitest";
import { CmsSectionOrderError, persistCmsSectionOrder } from "./cmsSectionOrderService";
import type { CmsSection } from "@/lib/adminCmsBuilderModel";

const section = (id: string, sort_order: number, updated_at = "v1"): CmsSection => ({
  id, page_id: "page-a", section_key: id, section_type: "hero", status: "draft", sort_order,
  updated_at, content_zh: {}, content_en: {}, settings: {},
});

describe("CMS section order recovery", () => {
  it("returns new versions for subsequent operations and does not resave unchanged rows", async () => {
    const save = vi.fn(async (row: CmsSection, sortOrder: number) => ({ ...row, sort_order: sortOrder, updated_at: "v2" }));
    const result = await persistCmsSectionOrder("page-a", [section("a", 20), section("b", 10)], save);
    expect(result.sections.map((row) => [row.sort_order, row.updated_at])).toEqual([[10, "v2"], [20, "v2"]]);
    expect(save).toHaveBeenCalledTimes(2);
    await persistCmsSectionOrder("page-a", result.sections, save);
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("stops after the first failure and reads actual partial results before a retry", async () => {
    const current = [section("a", 20), section("b", 10)];
    const save = vi.fn(async (row: CmsSection, sortOrder: number) => {
      if (row.id === "b") throw new Error("transport failure");
      const updated = { ...row, sort_order: sortOrder, updated_at: "v2" };
      current[0] = updated;
      return updated;
    });
    const read = vi.fn(async () => current);
    const error = await persistCmsSectionOrder("page-a", [...current, section("c", 40)], save, read).catch((failure: unknown) => failure);
    expect(error).toBeInstanceOf(CmsSectionOrderError);
    expect((error as CmsSectionOrderError).completedIds).toEqual(["a"]);
    expect((error as CmsSectionOrderError).confirmedSections?.[0]?.updated_at).toBe("v2");
    expect(save).toHaveBeenCalledTimes(2);
    expect(read).toHaveBeenCalledOnce();
  });

  it("marks readback failure distinctly rather than pretending the old order is current", async () => {
    const error = await persistCmsSectionOrder("page-a", [section("a", 20)],
      async () => { throw new Error("save failed"); }, async () => { throw new Error("read failed"); })
      .catch((failure: unknown) => failure);
    expect(error).toBeInstanceOf(CmsSectionOrderError);
    expect((error as CmsSectionOrderError).confirmedSections).toBeNull();
  });

  it("rejects mixed pages and duplicate IDs before any write", async () => {
    const save = vi.fn();
    await expect(persistCmsSectionOrder("page-a", [{ ...section("a", 10), page_id: "page-b" }], save))
      .rejects.toMatchObject({ invalidInput: true });
    await expect(persistCmsSectionOrder("page-a", [section("a", 10), section("a", 20)], save))
      .rejects.toMatchObject({ invalidInput: true });
    expect(save).not.toHaveBeenCalled();
  });
});
