import { beforeEach, describe, expect, it, vi } from "vitest";
import { MaterialTerminologyError } from "../../supabase/functions/_shared/material-terminology.mjs";

const { saveAdminRecord } = vi.hoisted(() => ({ saveAdminRecord: vi.fn(async () => ({ id: "saved-material" })) }));
vi.mock("@/lib/adminMutation", () => ({ saveAdminRecord, requestPublicContentInvalidation: vi.fn() }));
import { saveAdminMaterial } from "@/backend/modules/materials/service/materialService";

beforeEach(() => saveAdminRecord.mockClear());
const record = { slug: "new-material", category: "Flooring", subcategory: "SPC Vinyl", material_type: "SPC Vinyl", color: "Natural Oak", texture: "New unreviewed texture" };

describe("admin material terminology gate", () => {
  it("blocks publication before the write and allows saving the same content as a draft", async () => {
    await expect(saveAdminMaterial({ record: { ...record, status: "draft" }, nextStatus: "published" })).rejects.toBeInstanceOf(MaterialTerminologyError);
    expect(saveAdminRecord).not.toHaveBeenCalled();
    await expect(saveAdminMaterial({ record: { ...record, status: "published" }, nextStatus: "draft" })).resolves.toMatchObject({ savedId: "saved-material" });
    expect(saveAdminRecord).toHaveBeenCalledOnce();
  });

  it("also blocks saving an already published row with an unknown specification", async () => {
    await expect(saveAdminMaterial({ record: { ...record, status: "published" } })).rejects.toBeInstanceOf(MaterialTerminologyError);
    expect(saveAdminRecord).not.toHaveBeenCalled();
  });

  it("allows reviewed material publication and leaves furniture supplier terms alone", async () => {
    await saveAdminMaterial({ record: { ...record, texture: "Tempered", status: "published" } });
    await saveAdminMaterial({ record: { ...record, category: "furniture", status: "published" } });
    expect(saveAdminRecord).toHaveBeenCalledTimes(2);
  });
});
