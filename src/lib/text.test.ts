import { describe, expect, it } from "vitest";
import { plainTextParagraphs } from "@/lib/text";

describe("plainTextParagraphs", () => {
  it("preserves three CMS paragraphs as text", () => {
    expect(plainTextParagraphs("<p>First <strong>detail</strong>.</p><p>Second detail.</p><p>Third detail.</p>")).toEqual([
      "First detail .",
      "Second detail.",
      "Third detail.",
    ]);
  });

  it("keeps plain single-paragraph fallback and blank-separated copy readable", () => {
    expect(plainTextParagraphs("One plain paragraph.")).toEqual(["One plain paragraph."]);
    expect(plainTextParagraphs("First line.\n\nSecond line.")).toEqual(["First line.", "Second line."]);
  });

  it("returns text for React escaping instead of passing through markup", () => {
    expect(plainTextParagraphs('<p><img src=x onerror=alert(1)>Safe text.</p>')).toEqual(["Safe text."]);
  });
});
