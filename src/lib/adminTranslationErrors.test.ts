import { afterEach, describe, expect, it } from "vitest";
import { friendlyTranslationError, classifyTranslationFailure } from "./adminTranslation";
import { setAdminLang } from "./adminPreferences";
afterEach(() => setAdminLang("zh"));

describe("safe localized translation failures", () => {
  it.each(["zh", "en"] as const)("hides unknown private error details in %s", (lang) => {
    setAdminLang(lang);
    const raw = "Unexpected database error: token=synthetic-secret https://private.invalid/internal";
    const message = friendlyTranslationError(raw);
    expect(message).not.toContain("synthetic-secret"); expect(message).not.toContain("private.invalid");
    expect(message).not.toBe(raw);
    expect(lang === "zh" ? /[\u4e00-\u9fff]/.test(message) : !/[\u4e00-\u9fff]/.test(message)).toBe(true);
    expect(friendlyTranslationError("Unexpected postgres failure synthetic-private-fragment")).not.toContain("synthetic-private-fragment");
  });
  it.each([
    "Malay translation changed a protected placeholder. No content was saved.",
    "Translation changed protected HTML or placeholders. No content was saved.",
  ])("explains rejected protected content without rendering internal errors: %s", (raw) => {
    setAdminLang("zh");
    expect(friendlyTranslationError(raw)).toContain("原内容未改动");
    expect(classifyTranslationFailure(raw)).toBe("内容保护检查未通过");
    setAdminLang("en");
    expect(friendlyTranslationError(raw)).toContain("original content is unchanged");
    expect(classifyTranslationFailure(raw)).toBe("Content protection check failed");
  });
  it("explains invalid links and concurrent editing in the current language", () => {
    setAdminLang("zh");
    expect(friendlyTranslationError("Translated content has invalid page links. Correct the source links before translating.")).toContain("链接");
    expect(friendlyTranslationError("Content has changed. Reload before translating again.")).toContain("重新载入");
    setAdminLang("en");
    expect(friendlyTranslationError("Content has changed. Reload before translating again.")).toContain("Reload");
  });
});
