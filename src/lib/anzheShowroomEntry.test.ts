import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Script } from "node:vm";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { ANZHE_SHOWROOM_ORIGIN, getAnzheShowroomEntry } from "@/config/anzheShowroom";

const folder = join(process.cwd(), "public", "anzhe-showroom");
const html = readFileSync(join(folder, "zh/index.html"), "utf8");
const scripts = ["strings.js", "catalog.js", "studio.js"].map(file =>
  new Script(readFileSync(join(folder, file), "utf8"), { filename: file }),
);

function open(url: string, state?: unknown) {
  const dom = new JSDOM(html, { url, runScripts: "outside-only" });
  const { window } = dom;
  window.history.replaceState(state ?? null, "");
  window.directory = { refresh() {}, syncCompare() {} };
  window.lockPanels = { refresh() {}, count: () => 0 };
  window.lockContact = { refresh() {} };
  for (const script of scripts) script.runInContext(dom.getInternalVMContext());
  return dom;
}

describe("showroom entry and return", () => {
  it("returns to the source page after switching language or refreshing at a section", () => {
    const entry = getAnzheShowroomEntry("zh", {
      pathname: "/zh/furniture/sofa",
      search: "?page=2&email=private&gclid=campaign",
      hash: "#site-footer",
    });
    expect(entry).not.toMatch(/gclid|email|private|campaign/);
    const expected = "https://flashcast.com.my/zh/furniture/sofa?page=2#site-footer";
    const dom = open(entry);
    try {
      const { window } = dom;
      const link = window.document.querySelector<HTMLAnchorElement>(".brand")!;
      expect(link.href).toBe(expected);
      expect(window.location.hash).toBe("");
      window.document.querySelector<HTMLButtonElement>('[data-lang="ms"]')!.click();
      expect(link.getAttribute("aria-label")).toBe("ANZHE 安哲 · Kembali ke FLASH CAST");
      expect(link.querySelector("img")?.alt).toBe("ANZHE 安哲");
      expect(link.querySelector(".brand-return")?.textContent).toBe("← Laman utama");
      expect(link.href).toBe(expected);
      window.history.pushState(null, "", "#contact");
      window.dispatchEvent(new window.HashChangeEvent("hashchange"));
      const reloaded = open(window.location.href, window.history.state);
      try {
        expect(reloaded.window.document.querySelector<HTMLAnchorElement>(".brand")!.href).toBe(expected);
      } finally { reloaded.window.close(); }
    } finally { dom.window.close(); }
  });

  it.each(["", "//other.example/zh", "/admin", "/en/auth", "/zh/projects?email=private"])(
    "keeps direct or invalid entry %j independent", source => {
      const entry = new URL("/zh/", ANZHE_SHOWROOM_ORIGIN);
      if (source) entry.hash = new URLSearchParams({ "fc-return": source }).toString();
      const dom = open(entry.href);
      try {
        const link = dom.window.document.querySelector<HTMLAnchorElement>(".brand")!;
        expect(link.hasAttribute("data-main-return")).toBe(false);
        expect(link.getAttribute("href")).toBe("#top");
        expect(link.querySelector("img")?.alt).toBe("ANZHE 安哲");
        expect(link.querySelector(".brand-return")?.hasAttribute("hidden")).toBe(true);
        expect(dom.window.location.hash).toBe("");
      } finally { dom.window.close(); }
    },
  );
});
