import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { readPublicLanguageCookie, resolvePreferredLanguage } from "@/i18n/languageDetection";

it("ships the current shared public boot and exact script and style revisions in all three documents", () => {
  execFileSync(process.execPath, ["scripts/generate-anzhe-boot.mjs", "--check"]);
  for (const lang of ["zh", "en", "ms"]) {
    const dir = resolve("public/anzhe-showroom", lang);
    const html = readFileSync(resolve(dir, "index.html"), "utf8");
    // WebKit may run the deferred catalogue before an earlier async boot, skipping the readiness gate.
    const boot = html.match(/<script\b[^>]*\bsrc="\.\.\/showroom-boot\.js[^"]*"[^>]*>/)?.[0];
    expect(boot).toBeTruthy();
    expect(boot).not.toMatch(/\b(?:defer|async)\b/);
    expect(html.indexOf(boot!)).toBeLessThan(html.indexOf("data-public-style"));
    const styles = Array.from(html.matchAll(/<link data-public-style[^>]*href="([^"]+)"/g));
    expect(styles.length).toBeGreaterThan(0);
    for (const [tag, href] of styles) {
      expect(tag).toContain('media="print"');
      expect(html.split("</head>")[0]).toContain(`<link rel="stylesheet" href="${href}">`);
    }
    for (const [, url, version] of html.matchAll(/(?:src|href)="((?:\.\.\/|\/)[\w-]+\.(?:js|css))\?v=([a-f\d]+)"/g)) {
      const file = url.startsWith("/") ? resolve("public", url.slice(1)) : resolve(dir, url);
      expect(version, url).toBe(createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 12));
    }
  }
});

it("shares priority across the two sites and retains legacy and first-device-language fallbacks", () => {
  for (const hostname of ["flashcast.com.my", "locks.flashcast.com.my"]) {
    const choose = (cookie: string, acceptLanguage = "ja-JP,zh;q=0.8") => resolvePreferredLanguage({
      savedLanguage: readPublicLanguageCookie(cookie, hostname), acceptLanguage,
    });
    expect(choose("flashcast_lang=zh; flashcast_site_lang=ms")).toBe("ms");
    expect(choose("flashcast_site_lang=invalid; flashcast_lang=zh")).toBe("zh");
    expect(choose("")).toBe("en");
    expect(choose("", "en;q=0.3, zh-HK;q=0.9")).toBe("zh");
    expect(choose("", "ms-MY, en;q=0.5")).toBe("ms");
  }
  expect(readPublicLanguageCookie("flashcast_site_lang=zh", "unrelated.example")).toBeNull();
});
