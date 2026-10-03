import { describe, expect, it } from "vitest";
import {
  detectLanguageFromTags,
  parseAcceptLanguage,
  readCookieValue,
  resolvePreferredLanguage,
} from "@/i18n/languageDetection";

describe("language detection", () => {
  it("recognizes simplified, traditional, Hong Kong, Singapore, and underscore Chinese tags", () => {
    for (const tag of ["zh", "zh-CN", "zh-TW", "zh-HK", "zh-SG", "zh_Hans_CN", "zh-Hant", " ZH-hk "]) {
      expect(detectLanguageFromTags([tag])).toBe("zh");
    }
  });

  it.each(["en-US", "ms-MY", "ja-JP", "fr-FR", "ar-SA"])(
    "uses English when the first browser language is %s even if Chinese is second",
    (tag) => {
      expect(detectLanguageFromTags([tag, "zh-CN", "en-US"])).toBe("en");
    },
  );

  it("uses Chinese when it is first and defaults missing language preferences to English", () => {
    expect(detectLanguageFromTags(["zh-TW", "ja-JP", "en-US"])).toBe("zh");
    expect(detectLanguageFromTags([])).toBe("en");
    expect(detectLanguageFromTags([""])).toBe("en");
  });

  it("orders Accept-Language tags by quality and ignores disabled or wildcard values", () => {
    expect(parseAcceptLanguage("en-US;q=0.7, zh-CN;q=0.9, *;q=1, zh-TW;q=0")).toEqual([
      "zh-CN",
      "en-US",
    ]);
  });

  it("gives a saved user choice priority over Accept-Language", () => {
    expect(resolvePreferredLanguage({ savedLanguage: "en", acceptLanguage: "zh-CN,zh;q=0.9" })).toBe("en");
    expect(resolvePreferredLanguage({ savedLanguage: "zh", acceptLanguage: "en-US,en;q=0.9" })).toBe("zh");
  });

  it("falls back to weighted Accept-Language and then English", () => {
    expect(resolvePreferredLanguage({ acceptLanguage: "en-US;q=0.8,zh-CN;q=0.9" })).toBe("zh");
    expect(resolvePreferredLanguage({ acceptLanguage: "ms-MY,ja-JP;q=0.8" })).toBe("en");
    expect(resolvePreferredLanguage({})).toBe("en");
  });

  it("does not promote lower priority Chinese from Accept-Language", () => {
    expect(resolvePreferredLanguage({ acceptLanguage: "ja-JP,zh-CN;q=0.9,en;q=0.8" })).toBe("en");
    expect(resolvePreferredLanguage({ acceptLanguage: "zh-CN;q=0.8,ja-JP;q=1" })).toBe("en");
    expect(resolvePreferredLanguage({ acceptLanguage: "ja-JP;q=0.9,zh-CN;q=0.9" })).toBe("en");
    expect(resolvePreferredLanguage({ acceptLanguage: "zh-CN;q=0,ja-JP;q=0.8" })).toBe("en");
    expect(resolvePreferredLanguage({ savedLanguage: "invalid", acceptLanguage: "ja-JP,zh-CN;q=0.9" })).toBe("en");
  });

  it("reads the exact language cookie without confusing similarly named cookies", () => {
    const header = "flashcast_lang_backup=zh; session=abc; flashcast_lang=en";
    expect(readCookieValue(header, "flashcast_lang")).toBe("en");
    expect(readCookieValue(header, "missing")).toBeNull();
  });
});
