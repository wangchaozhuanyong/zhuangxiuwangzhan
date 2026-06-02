import { describe, expect, it } from "vitest";
import { resolveSiteSettings } from "@/lib/siteSettingsApi";

describe("site settings contact links", () => {
  it("normalizes WhatsApp numbers from admin settings for wa.me links", () => {
    const settings = resolveSiteSettings(
      {
        phone_e164: "+60 11-2885 3888",
        whatsapp_number: "+60 11-2885 3888",
      },
      "zh",
    );

    expect(settings.phone_href).toBe("tel:+601128853888");
    expect(settings.whatsapp_url()).toBe("https://wa.me/601128853888");
    expect(settings.whatsapp_url("Hello")).toBe("https://wa.me/601128853888?text=Hello");
  });
});
