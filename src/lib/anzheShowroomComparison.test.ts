import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Script } from "node:vm";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const showroom = join(process.cwd(), "public", "anzhe-showroom");
const scripts = ["strings.js", "catalog.js", "features.js", "panels.js", "contact.js"].map(
  file => new Script(readFileSync(join(showroom, file), "utf8"), { filename: file }),
);
const locales = ["zh", "en", "ms"] as const;
type Locale = typeof locales[number];

type Row = { group: string; label: string; left: string; right: string };

function openShowroom(lang: Locale) {
  const html = readFileSync(join(showroom, lang, "index.html"), "utf8");
  const dom = new JSDOM(html, { runScripts: "outside-only" });
  const { window } = dom;
  window.showroom = { lang, asset: (file: string) => file };
  const document: Document = window.document;
  const panel = document.querySelector<HTMLDialogElement>("#panel")!;
  panel.showModal = () => panel.setAttribute("open", "");
  for (const script of scripts) script.runInContext(dom.getInternalVMContext());

  function compare(leftModel: string, rightModel: string) {
    window.lockPanels.restoreSelection([leftModel, rightModel]);
    window.lockPanels.resume();
    const rows: Row[] = [];
    for (const tr of panel.querySelectorAll<HTMLTableRowElement>(".pn-spec-table tbody tr")) {
      const [label, left, secondValue] = Array.from(tr.cells, cell => {
        const prefix = cell.querySelector(".pn-both")?.textContent ?? "";
        return cell.textContent!.slice(prefix.length).trim();
      });
      const right = tr.cells[1]?.colSpan === 2 ? left : secondValue;
      const section = tr.closest("details");
      const group = section?.matches(".pn-pending") ? "pending" : section?.matches(".pn-unlisted") ? "unlisted" : "different";
      rows.push({ group, label, left, right });
    }
    for (const field of panel.querySelectorAll(".pn-common-list dt")) {
      const value = field.nextElementSibling!.textContent!.trim();
      rows.push({ group: "shared", label: field.textContent!.trim(), left: value, right: value });
    }
    return rows.sort((a, b) => a.label.localeCompare(b.label) || a.group.localeCompare(b.group));
  }
  return {
    compare,
    models: window.lockCatalog as { id: string; name: string }[],
    panel,
    close: () => window.close(),
  };
}

describe("ANZHE showroom comparison", () => {
  it.each(locales)("keeps cents in installed prices, comparison gaps and WhatsApp messages in %s", lang => {
    const site = openShowroom(lang);
    try {
      site.compare("g13", "g86f-pro");
      expect(Array.from(site.panel.querySelectorAll(".pn-price strong"), price => price.textContent))
        .toEqual(["RM635.20", "RM712"]);
      expect(site.panel.querySelector(".pn-gap strong")?.textContent).toBe("RM76.80");
      const link = site.panel.querySelector<HTMLAnchorElement>("[data-ask-pair]")!;
      const message = new URL(link.href).searchParams.get("text");
      expect(message).toContain("G13 (RM635.20)");
      expect(message).toContain("G86F-Pro (RM712)");
    } finally {
      site.close();
    }
  });

  it.each(locales)("keeps all quoted pairs complete and symmetric in %s", lang => {
    const site = openShowroom(lang);
    try {
      expect(site.models).toHaveLength(17);
      for (const [index, a] of site.models.entries()) {
        for (const b of site.models.slice(index + 1)) {
          const context = [lang, a.name, b.name].join(" / ");
          const rows = site.compare(a.id, b.id);
          expect(rows.length, context).toBeGreaterThan(0);
          const invalidRows = rows.filter(row =>
            [row.label, row.left, row.right].some(value => !value || /\b(undefined|null)\b|\[object Object\]/.test(value)),
          );
          expect(invalidRows, context).toEqual([]);
          const misplaced = rows.filter(row =>
            ["shared", "different"].includes(row.group) &&
            /未列明|待确认|not specified|to confirm|tidak dinyatakan|perlu disahkan/i.test(row.left + " " + row.right),
          );
          expect(misplaced, context).toEqual([]);
          for (const table of site.panel.querySelectorAll<HTMLTableElement>(".pn-spec-table")) {
            expect(Array.from(table.tHead!.rows[0].cells).slice(1).map(cell => cell.textContent), context)
              .toEqual([a.name, b.name]);
          }
          const reversed = site.compare(b.id, a.id);
          expect(reversed, context).toEqual(rows.map(row => ({ ...row, left: row.right, right: row.left })));
        }
      }
    } finally {
      site.close();
    }
  }, 60_000);

  it("distinguishes absent features, optional configurations and missing specifications in the quotation", () => {
    const site = openShowroom("zh");
    try {
      const rows = site.compare("f8", "gp08");
      expect(rows).toEqual(expect.arrayContaining([
        { label: "防猫眼开启", group: "different", left: "不支持", right: "支持" },
        { label: "单把重量", group: "unlisted", left: "2 kg", right: "资料未列明" },
        { label: "面板材质", group: "unlisted", left: "资料未列明", right: "钢化玻璃面板" },
        { label: "手机 App 开锁", group: "shared", left: "选配", right: "选配" },
        { label: "适用 App", group: "pending", left: "待确认（Tuya 或 TT）", right: "待确认（Tuya 或 TT）" },
      ]));
      expect(site.compare("f8", "g86f-pro")).toContainEqual({
        label: "手机 App 开锁", group: "different", left: "选配", right: "支持",
      });
      expect(site.compare("k16j-k19", "k19j")).toContainEqual({
        label: "手机 App 开锁", group: "different", left: "选配", right: "支持",
      });
      const camera = site.compare("r10j-22", "q8j");
      expect(camera).toEqual(expect.arrayContaining([
        { label: "远程对讲", group: "different", left: "不支持", right: "支持" },
        { label: "24 小时抓拍", group: "different", left: "不支持", right: "支持" },
        { label: "远程一键开锁", group: "shared", left: "支持", right: "支持" },
      ]));
      const a88 = site.compare("a88-face-id", "g53-pro");
      expect(a88).toEqual(expect.arrayContaining([
        { label: "门卡开锁", group: "different", left: "支持", right: "不支持" },
        { label: "门卡制式", group: "pending", left: "制式待确认", right: "不适用" },
        { label: "锂电池容量", group: "pending", left: "4200（单位待确认）", right: "不适用" },
      ]));
      const twins = site.compare("k19j", "k26j-pro");
      expect(twins.filter(row => row.group === "different")).toEqual([]);
      expect(site.panel.querySelector(".pn-gap")?.textContent).toContain("RM330");
    } finally {
      site.close();
    }
  });
});
