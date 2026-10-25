import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { build } from "esbuild";
import { materialCatalogRecords } from "./material-catalog-data.mjs";
import { materialTerminologyIssues, reviewedMaterialMalayTerm, reviewedMaterialMalayText, reviewedMaterialChineseTerm } from "../supabase/functions/_shared/material-terminology.mjs";

// Independent semantic regression expectations: presence and language purity alone are insufficient.
const regressionTerms = [
  ["texture", "Tempered", "Terbaja"], ["category", "Whole House Custom", "Tempahan Khas Seluruh Rumah"],
  ["texture", "Smooth", "Licin"], ["type", "Timber", "Kayu"], ["texture", "Marble Look", "Corak Marmar"],
  ["texture", "Herringbone", "Corak Tulang Ikan"], ["type", "Sliding Barn", "Pintu Gelangsar Gaya Bangsal"],
  ["type", "Lime Wash", "Kemasan Sapuan Kapur"],
];

export async function checkMaterialTerminology(rootDir = process.cwd()) {
  const issues = [];
  const add = (file, text, reason, slug = "") => issues.push({
    type: "Material terminology", locale: "ms-MY", file, line: "N/A",
    url: slug ? `/ms/materials/${slug}` : "N/A", selector: ".fc-route-facts", text, reason,
    suggestedFix: "Review the material meaning and update the shared material terminology. Do not use machine translation or an allowlist to bypass this check.",
  });
  const bundled = await build({
    stdin: { contents: 'export { materialsData } from "./src/data/materials.ts"; export * from "./src/i18n/displayLabels.ts"; export { localizeMalayContent } from "./src/i18n/malayContent.ts"; export { materialDetailPageText } from "./src/i18n/materialDetailPageText.ts";', resolveDir: rootDir },
    absWorkingDir: rootDir, bundle: true, write: false, platform: "node", format: "esm", logLevel: "silent",
  });
  const ui = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`);
  const records = [
    ...materialCatalogRecords.map(({ record }) => ({ file: "scripts/material-catalog-data.mjs", record })),
    ...ui.materialsData.filter(category => category.name.toLowerCase() !== "furniture").flatMap(category => category.items.map(item => ({
      file: "src/data/materials.ts", record: { ...item, category: category.name, material_type: item.type },
    }))),
  ];
  const renderers = { category: ui.translateMaterialCategory, subcategory: ui.translateMaterialSubcategory,
    material_type: ui.translateMaterialType, color: ui.translateMaterialColor, texture: ui.translateMaterialTexture };
  for (const { file, record } of records) {
    for (const issue of materialTerminologyIssues(record)) add(file, `${issue.field}: ${issue.value}`, "This specification has no reviewed Malay term.", record.slug);
    if (record.category?.toLowerCase() === "furniture") continue;
    for (const [field, render] of Object.entries(renderers)) {
      const value = record[field];
      if (!value) continue;
      const expected = reviewedMaterialMalayTerm(field === "material_type" ? "type" : field, value);
      if (!expected) continue;
      const fallback = ui.localizeMalayContent(value);
      if (render(value, "ms") !== expected || render(fallback, "ms") !== expected)
        add(file, `${field}: ${value}`, "The CMS and fallback display paths disagree with the reviewed term.", record.slug);
      if (["material_type", "color", "texture"].includes(field)) {
        const chinese = reviewedMaterialChineseTerm(field === "material_type" ? "type" : field, value);
        if (!chinese || render(value, "zh") !== chinese) add(file, `${field}: ${value}`, "The Chinese material specification is missing or disagrees with the reviewed term.", record.slug);
      }
    }
  }
  for (const [field, source, expected] of regressionTerms) {
    if (reviewedMaterialMalayTerm(field, source) !== expected || ui.translateDisplayText(source, "ms") !== expected)
      add("supabase/functions/_shared/material-terminology.mjs", source, `Semantic regression: expected ${expected}.`);
  }
  const legacy = JSON.parse(readFileSync(path.join(rootDir, "src/i18n/malayFallbackText.json"), "utf8"));
  for (const [source, target] of Object.entries(legacy)) {
    const reviewed = reviewedMaterialMalayText(source);
    if (reviewed && target !== reviewed) add("src/i18n/malayFallbackText.json", source, `Conflicting legacy translation: expected ${reviewed}.`);
  }
  const labels = readFileSync(path.join(rootDir, "src/i18n/displayLabels.ts"), "utf8");
  for (const match of labels.matchAll(/(?:"[^"\n]+"|\w+):\s*\{\s*en:\s*"([^"\n]+)",\s*zh:\s*"[^"\n]*"\s*,\s*ms:\s*"([^"\n]*)"/g)) {
    const reviewed = reviewedMaterialMalayText(match[1]);
    if (reviewed && match[2] !== reviewed) add("src/i18n/displayLabels.ts", match[1], `Conflicting display translation: expected ${reviewed}.`);
  }
  if (ui.materialDetailPageText.ms.type !== "Jenis") add("src/i18n/materialDetailPageText.ts", "Type", "The Malay specification label must be Jenis.");
  if (ui.translateDisplayText("Custom", "ms") !== "Tempahan Khas") add("src/i18n/displayLabels.ts", "Custom", "Customization must not be translated as a social custom.");
  return issues;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const issues = await checkMaterialTerminology();
  if (issues.length) { console.error(JSON.stringify(issues, null, 2)); process.exitCode = 1; }
  else console.log(`Material terminology passed: ${materialCatalogRecords.length} catalog products, static fallback and semantic regressions.`);
}
