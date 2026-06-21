import { describe, expect, it } from "vitest";
import { normalizeBuiltInLogoUrl, resolveSiteSettings } from "@/lib/siteSettingsApi";

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
    expect(settings.whatsapp_url()).toBe(
      `https://wa.me/601128853888?text=${encodeURIComponent(
        "你好 FLASH CAST，我想咨询装修/翻新服务。我的项目在马来西亚，想先了解施工范围、预算估算和下一步安排。",
      )}`,
    );
    expect(settings.whatsapp_url("Hello")).toBe("https://wa.me/601128853888?text=Hello");

    const englishSettings = resolveSiteSettings(
      {
        phone_e164: "+60 11-2885 3888",
        whatsapp_number: "+60 11-2885 3888",
      },
      "en",
    );
    expect(englishSettings.whatsapp_url()).toBe(
      `https://wa.me/601128853888?text=${encodeURIComponent(
        "Hi FLASH CAST, I'd like to ask about renovation services. My project is in Malaysia. Could you advise on the suitable scope, estimated budget, and next steps?",
      )}`,
    );
  });

  it("normalizes built-in logo settings to the cache-safe WebP URL", () => {
    expect(normalizeBuiltInLogoUrl("/logo-flashcast.png")).toBe("/logo-flashcast-20260605.webp");
    expect(normalizeBuiltInLogoUrl("/logo-flashcast.webp")).toBe("/logo-flashcast-20260605.webp");
    expect(normalizeBuiltInLogoUrl("https://flashcast.com.my/logo-flashcast.png?v=old")).toBe(
      "https://flashcast.com.my/logo-flashcast-20260605.webp?v=old",
    );
    expect(normalizeBuiltInLogoUrl("https://cdn.example.com/logo-flashcast.png")).toBe(
      "https://cdn.example.com/logo-flashcast.png",
    );

    const settings = resolveSiteSettings({ logo_url: "/logo-flashcast.png" }, "zh");
    expect(settings.logo_url).toBe("/logo-flashcast-20260605.webp");
  });
});
