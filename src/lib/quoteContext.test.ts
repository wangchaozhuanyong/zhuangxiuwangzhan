import { describe, expect, it } from "vitest";
import {
  buildQuotePath,
  parseQuoteContext,
  QUOTE_FORM_PATH,
  quoteProjectTypeFromProjectType,
  quoteProjectTypeFromServiceSlug,
  withQuoteFormHash,
} from "@/lib/quoteContext";

describe("quote context", () => {
  it("uses quote-form-compatible project types from service links", () => {
    const projectType = quoteProjectTypeFromServiceSlug("artistic-coating");
    const parsed = parseQuoteContext(new URLSearchParams({ projectType }), "zh");

    expect(projectType).toBe("Artistic Wall / Coating");
    expect(parsed.projectType).toBe("Artistic Wall / Coating");
  });

  it("normalizes old and fallback project type aliases", () => {
    expect(quoteProjectTypeFromProjectType("Artistic Wall Coating (Remmers)")).toBe("Artistic Wall / Coating");
    expect(quoteProjectTypeFromProjectType("Others")).toBe("Other");
    expect(parseQuoteContext(new URLSearchParams({ projectType: "Exterior / Shopfront Works" }), "en").projectType).toBe("Exterior Works");
  });

  it("targets the quote form while preserving quote context", () => {
    expect(QUOTE_FORM_PATH).toBe("/quote#quote-form");
    expect(withQuoteFormHash("/quote?source=projects#old")).toBe("/quote?source=projects#quote-form");
    expect(buildQuotePath({ source: "project", title: "Living Room" })).toBe(
      "/quote?source=project&title=Living+Room#quote-form",
    );
  });
});
