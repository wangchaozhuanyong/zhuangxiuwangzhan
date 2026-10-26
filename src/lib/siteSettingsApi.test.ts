import { describe, expect, it } from "vitest";
import { normalizeBuiltInLogoUrl, normalizeDisplayAddress, resolveSiteSettings } from "@/lib/siteSettingsApi";

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
    const chineseUrl = new URL(settings.whatsapp_url());
    expect(chineseUrl.origin + chineseUrl.pathname).toBe("https://wa.me/601128853888");
    expect(chineseUrl.searchParams.get("text")).toBe("你好 FLASH CAST，我想咨询装修/翻新服务。我的项目在马来西亚，想先了解施工范围、预算估算和下一步安排。\n\n来源（浏览器参考）: 不确定");
    expect(new URL(settings.whatsapp_url("Hello")).searchParams.get("text")).toBe("Hello\n\n来源（浏览器参考）: 不确定");

    const englishSettings = resolveSiteSettings(
      {
        phone_e164: "+60 11-2885 3888",
        whatsapp_number: "+60 11-2885 3888",
      },
      "en",
    );
    expect(new URL(englishSettings.whatsapp_url()).searchParams.get("text")).toBe("Hi FLASH CAST, I'd like to ask about renovation services. My project is in Malaysia. Could you advise on the suitable scope, estimated budget, and next steps?\n\nSource (browser reference): Unknown");
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

  it("normalizes admin-entered address punctuation before public display", () => {
    expect(normalizeDisplayAddress("  94, Jalan Mega Mendung,Taman United,  58200 Kuala Lumpur  ")).toBe(
      "94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur",
    );

    const settings = resolveSiteSettings(
      {
        address_zh: "94, Jalan Mega Mendung,Taman United, 58200 Kuala Lumpur",
        short_address_zh: "94, Jalan Mega Mendung,58200",
      },
      "zh",
    );

    expect(settings.address).toBe("94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur");
    expect(settings.short_address).toBe("94, Jalan Mega Mendung, 58200");
  });
});
