import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Script } from "node:vm";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { ANZHE_SHOWROOM_ORIGIN, getAnzheShowroomEntry } from "@/config/anzheShowroom";

const folder = join(process.cwd(), "public", "anzhe-showroom");
const scripts = ["strings.js", "catalog.js", "studio.js", "showroom-updates.js"].map(file =>
  new Script(readFileSync(join(folder, file), "utf8"), { filename: file }),
);

function open(url: string, state?: unknown, offline = false) {
  const lang = new URL(url).pathname.split("/")[1] || "zh";
  const html = readFileSync(join(folder, lang, "index.html"), "utf8");
  const dom = new JSDOM(html, { url, runScripts: "outside-only" });
  const { window } = dom;
  if (offline) window.document.body.insertAdjacentHTML("afterbegin", '<script type="application/json" id="offline-images">{}</script>');
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
      const link = window.document.querySelector<HTMLAnchorElement>("[data-main-return]")!;
      expect(link.href).toBe(expected);
      expect(link.hidden).toBe(false);
      expect(window.document.querySelector(".brand")?.getAttribute("href")).toBe("#top");
      expect(window.location.hash).toBe("");
      window.history.pushState(null, "", "#contact");
      window.dispatchEvent(new window.HashChangeEvent("hashchange"));
      const malayUrl = window.document.querySelector<HTMLAnchorElement>('[data-lang="ms"]')!.href;
      expect(new URL(malayUrl).search).toBe("");
      expect(new URL(malayUrl).pathname).toBe("/ms/");
      const malay = open(malayUrl);
      try {
        const back = malay.window.document.querySelector<HTMLAnchorElement>("[data-main-return]")!;
        expect(back.href).toBe(expected);
        expect(back.getAttribute("aria-label")).toBe("Kembali ke FLASH CAST");
        expect(back.textContent).toBe("Laman utama");
        expect(malay.window.location.hash).toBe("#contact");
        const reloaded = open(malay.window.location.href, malay.window.history.state);
        try {
          expect(reloaded.window.document.querySelector<HTMLAnchorElement>("[data-main-return]")!.href).toBe(expected);
        } finally { reloaded.window.close(); }
      } finally { malay.window.close(); }
    } finally { dom.window.close(); }
  });

  it("keeps the single-file catalogue usable without navigating to another document", () => {
    const dom = open(ANZHE_SHOWROOM_ORIGIN + "/zh/", null, true);
    try {
      const doc = dom.window.document;
      doc.querySelector<HTMLElement>("[data-lang-trigger]")!.click();
      doc.querySelector<HTMLAnchorElement>('[data-lang="en"]')!.click();
      expect(doc.querySelector("h1")?.textContent).toBe("ANZHE smart locks");
      expect(doc.querySelector("details.lang-switch")?.hasAttribute("open")).toBe(false);
      expect(doc.querySelector("[data-lang][aria-current]")?.getAttribute("data-lang")).toBe("en");
      expect(doc.querySelector(".lang-current-label")?.textContent).toBe("EN");
    } finally { dom.window.close(); }
  });

  it.each(["", "//other.example/zh", "/admin", "/en/auth", "/zh/projects?email=private"])(
    "keeps direct or invalid entry %j independent", source => {
      const entry = new URL("/zh/", ANZHE_SHOWROOM_ORIGIN);
      if (source) entry.hash = new URLSearchParams({ "fc-return": source }).toString();
      const dom = open(entry.href);
      try {
        const link = dom.window.document.querySelector<HTMLAnchorElement>(".brand")!;
        expect(link.getAttribute("href")).toBe("#top");
        expect(link.querySelector("img")?.alt).toBe("ANZHE 安哲");
        const back = dom.window.document.querySelector<HTMLAnchorElement>("[data-main-return]")!;
        expect(back.hidden).toBe(true);
        expect(back.hasAttribute("href")).toBe(false);
        expect(dom.window.location.hash).toBe("");
      } finally { dom.window.close(); }
    },
  );
});
