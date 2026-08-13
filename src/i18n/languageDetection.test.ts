import { describe, expect, it } from "vitest";
import {
  detectLanguageFromTags,
  parseAcceptLanguage,
  readCookieValue,
  resolvePreferredLanguage,
} from "@/i18n/languageDetection";

describe("language detection", () => {
  it("recognizes simplified, traditional, Hong Kong, Singapore, and underscore Chinese tags", () => {
    for (const tag of ["zh", "zh-CN", "zh-TW", "zh-HK", "zh-SG", "zh_Hans_CN"]) {
      expect(detectLanguageFromTags([tag])).toBe("zh");
    }
  });

  it("uses the first supported browser language and defaults unsupported languages to English", () => {
    expect(detectLanguageFromTags(["ms-MY", "zh-CN", "en-US"])).toBe("zh");
    expect(detectLanguageFromTags(["ms-MY", "en-GB", "zh-CN"])).toBe("en");
    expect(detectLanguageFromTags(["ms-MY"])).toBe("en");
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

  it("reads the exact language cookie without confusing similarly named cookies", () => {
    const header = "flashcast_lang_backup=zh; session=abc; flashcast_lang=en";
    expect(readCookieValue(header, "flashcast_lang")).toBe("en");
    expect(readCookieValue(header, "missing")).toBeNull();
  });
});
