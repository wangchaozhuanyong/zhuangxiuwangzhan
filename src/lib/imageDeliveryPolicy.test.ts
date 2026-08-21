import { describe, expect, it } from "vitest";
import { IMAGE_DELIVERY_PROFILES, resolveImageDeliveryProfile } from "@/lib/imageDeliveryPolicy";

describe("image delivery policy", () => {
  it("uses stricter limits for material cards than hero images", () => {
    expect(IMAGE_DELIVERY_PROFILES.material.maxBytes).toBeLessThan(IMAGE_DELIVERY_PROFILES.hero.maxBytes);
    expect(IMAGE_DELIVERY_PROFILES.material.maxEdge).toBeLessThan(IMAGE_DELIVERY_PROFILES.hero.maxEdge);
  });

  it("lets the preview role override a generic usage type", () => {
    expect(resolveImageDeliveryProfile({ usageType: "general", previewVariant: "icon" }).usage).toBe("icon");
    expect(resolveImageDeliveryProfile({ usageType: "general", previewVariant: "og" }).usage).toBe("og");
  });

  it("falls back safely for unknown admin usage types", () => {
    expect(resolveImageDeliveryProfile({ usageType: "unknown" })).toEqual(IMAGE_DELIVERY_PROFILES.general);
  });
});
