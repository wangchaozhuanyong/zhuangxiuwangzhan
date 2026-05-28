import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

describe("sanitizeHtml", () => {
  it("removes scripts and inline handlers", () => {
    const input = `<p>Hello</p><script>alert(1)</script><img src=x onerror="alert(2)"><a href="javascript:alert(3)">x</a>`;
    const out = sanitizeHtml(input);
    expect(out).toContain("Hello");
    expect(out).not.toMatch(/script/i);
    expect(out).not.toMatch(/onerror/i);
    expect(out).not.toMatch(/javascript:/i);
  });

  it("keeps basic formatting tags", () => {
    const input = `<h2>Title</h2><p><strong>Bold</strong> <em>Em</em><br/>Line</p><ul><li>A</li></ul>`;
    const out = sanitizeHtml(input);
    expect(out).toContain("<h2>Title</h2>");
    expect(out).toContain("<strong>Bold</strong>");
    expect(out).toContain("<em>Em</em>");
    expect(out).toContain("<br>");
    expect(out).toContain("<ul>");
    expect(out).toContain("<li>A</li>");
  });
});

