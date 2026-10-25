import { describe, expect, it, vi } from "vitest";

describe("Malay content resource boundary", () => {
  it("requires real resource readiness, preserving reviewed translation and stable fields", async () => {
    vi.resetModules();
    const runtime = await import("./malayContentRuntime");
    expect(() => runtime.localizeMalayContent("Timber")).toThrow("not ready");
    await runtime.loadMalayContent();
    const eager = await import("./malayContent");
    const content = { texture: "Tempered", name: "Residential", slug: "Residential", href: "/en/materials/Timber", title_zh: "住宅" };
    expect(runtime.localizeMalayContent(content)).toEqual(eager.localizeMalayContent(content));
    expect(runtime.localizeMalayContent(content)).toMatchObject({ texture: "Terbaja", slug: "Residential", href: "/en/materials/Timber", title_zh: "住宅" });
  });
});
