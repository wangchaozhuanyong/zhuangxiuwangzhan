import { describe, expect, it } from "vitest";
import { sanitizeServiceOverviewHtml } from "@/lib/serviceOverviewHtml";

describe("sanitizeServiceOverviewHtml", () => {
  it.each(["en", "zh"] as const)("keeps same-language CMS links for %s", (language) => {
    const html = `<p>Review <a href="/${language}/services/kitchen" onclick="alert(1)" target="_blank">kitchen</a> and <a href="/${language}/quote">quote</a>.</p>`;
    const output = sanitizeServiceOverviewHtml(html, language);
    const container = document.createElement("div");
    container.innerHTML = output;
    expect(Array.from(container.querySelectorAll("a"), (anchor) => anchor.getAttribute("href"))).toEqual([
      `/${language}/services/kitchen`, `/${language}/quote`,
    ]);
    expect(output).not.toMatch(/onclick|target=/);
  });

  it("unwraps off-site and wrong-language links and removes active content", () => {
    const html = `<p><a href="https://evil.test/">external</a> <a href="/zh/quote">wrong locale</a> <a href="//evil.test/">protocol relative</a> <a href="/en/../zh/quote">traversal</a> <a href="javascript:alert(1)">script link</a></p><script>alert(2)</script><svg onload="alert(3)"></svg>`;
    const output = sanitizeServiceOverviewHtml(html, "en");
    expect(output).toContain("external");
    expect(output).toContain("wrong locale");
    expect(output).not.toMatch(/<a|<script|<svg|alert\(/);
  });
});
