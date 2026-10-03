import { describe, expect, it } from "vitest";
import { ADMIN_TITLE_SUFFIX, copy } from "@/lib/adminLayoutConfig";

describe("admin layout language", () => {
  it("uses English FAQ and brand navigation labels", () => {
    expect(copy.en.faqs).toBe("FAQs");
    expect(copy.en.brandLogos).toBe("Brand Partners");
  });

  it("localizes the browser title suffix", () => {
    expect(ADMIN_TITLE_SUFFIX.en).toBe("FLASH CAST Admin");
    expect(ADMIN_TITLE_SUFFIX.zh).toBe("FLASH CAST 后台管理");
  });
});
