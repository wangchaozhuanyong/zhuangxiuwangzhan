import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

describe("sanitizeHtml", () => {
  it.each([
    "java&#10;script:alert(1)", "java&#x09;script:alert(1)",
    "jav&#13;ascript:alert(1)", "&#32;&#9;JaVaScRiPt:alert(1)",
    "data:text/html,<script>alert(1)</script>", "vbscript:msgbox(1)",
    "file:///tmp/example", "blob:https://example.test/id",
  ])("removes browser-normalized unsafe protocols: %s", (href) => {
    const out = document.createElement("div");
    out.innerHTML = sanitizeHtml(`<a href="${href}">Unsafe link</a>`);
    expect(out.querySelector("a")?.hasAttribute("href")).toBe(false);
  });

  it.each(["/quote?source=cms#form", "../contact", "#faq", "https://example.test", "http://example.test", "mailto:hello@example.test", "tel:+60112345678"])("keeps a supported link: %s", (href) => {
    const out = document.createElement("div");
    out.innerHTML = sanitizeHtml(`<a href="${href}">Safe link</a>`);
    expect(out.querySelector("a")?.getAttribute("href")).toBe(href);
  });

  it("only permits web and relative image URLs", () => {
    const out = document.createElement("div");
    out.innerHTML = sanitizeHtml('<img src="mailto:hello@example.test"><img src="java&#10;script:alert(1)"><img src="https://example.test/photo.webp">');
    expect(out.querySelectorAll("img")).toHaveLength(1);
    expect(out.querySelector("img")?.getAttribute("src")).toBe("https://example.test/photo.webp");
  });
  it("removes scripts and inline handlers", () => {
    const input = `<p>Hello</p><script>alert(1)</script><img src=x onerror="alert(2)"><a href="javascript:alert(3)">x</a>`;
    const out = sanitizeHtml(input);
    expect(out).toContain("Hello");
    expect(out).not.toMatch(/script/i);
    expect(out).not.toMatch(/onerror/i);
    expect(out).not.toMatch(/javascript:/i);
  });

  it("keeps safe images and prefers webp for local paths", () => {
    const input = `<p>Text</p><img src="/images/foo.jpg" alt="Foo" onerror="alert(1)">`;
    const out = sanitizeHtml(input);
    expect(out).toContain('src="/images/foo.webp"');
    expect(out).toContain('alt="Foo"');
    expect(out).toContain('loading="lazy"');
    expect(out).not.toMatch(/onerror/i);
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

  it("demotes CMS h1 headings to h2", () => {
    const input = `<section class="seo-rich-block"><h1 class="lead" id="cms-title" onclick="alert(1)">CMS Title</h1><p>Copy</p></section>`;
    const out = sanitizeHtml(input);

    expect(out).toContain('<h2 class="lead">CMS Title</h2>');
    expect(out).toContain("<p>Copy</p>");
    expect(out).not.toMatch(/section/i);
    expect(out).not.toMatch(/<h1/i);
    expect(out).not.toMatch(/onclick|cms-title/i);
  });
});
