import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { collectContentLinks, contentLinkTarget, localizeContentLink } from "../supabase/functions/_shared/content-links.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Check the exact repaired anchors; unrelated citations may be filtered by the public renderer. */
export function inspectContentRepairReadback(html, before, after) {
  const original = collectContentLinks(before), desired = collectContentLinks(after);
  const shapeMatches = original.length === desired.length && original.every((link, index) => link.field === desired[index].field);
  if (!shapeMatches) return { ok: false, shapeMatches, changedLinks: [], missing: [], stale: [] };
  const changedLinks = original.flatMap((link, index) => link.href === desired[index].href ? []
    : [{ field: link.field, before: link.href, after: desired[index].href }]);
  const visible = new Set(collectContentLinks(html).map(link => link.href));
  const missing = [...new Set(changedLinks.map(link => link.after))].filter(href => !visible.has(href));
  const stale = [...new Set(changedLinks.map(link => link.before))].filter(href => visible.has(href));
  return { ok: changedLinks.length > 0 && !missing.length && !stale.length, shapeMatches, changedLinks, missing, stale };
}

const prefixes = { services: "services", projects: "projects", blog_posts: "blog", materials: "materials", service_areas: "locations", landing_pages: "landing" };
const canonical = href => href.replace(/^\/(?:en|zh|ms)(?=\/|$)/, "") || "/";
const digest = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const groupBy = (items, getKey) => items.reduce((groups, item) => {
  const key = getKey(item);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(item);
  return groups;
}, new Map());
const visibleRows = rows => rows.filter(row => !row.fields?.deleted_at);
const fieldKeys = field => field.replace(/\[(\d+)\]/g, ".$1").split(".");
const readField = (record, field) => fieldKeys(field).reduce((value, key) => value?.[key], record);
const writeField = (record, field, value) => {
  const keys = fieldKeys(field), last = keys.pop();
  const parent = keys.reduce((child, key) => child[key], record);
  parent[last] = value;
};

function publishedPaths(rows, sitemapPaths) {
  const paths = new Set(sitemapPaths.map(canonical));
  for (const row of visibleRows(rows)) {
    if (prefixes[row.table_name] && row.slug) paths.add(`/${prefixes[row.table_name]}/${row.slug}`);
    if (row.table_name === "cms_pages" && row.path && !row.path.includes(":")) paths.add(row.path);
  }
  return paths;
}

export function auditContentSnapshot(rows, sitemapPaths = []) {
  const paths = publishedPaths(rows, sitemapPaths);
  const issues = [], references = [];
  for (const row of visibleRows(rows)) for (const link of collectContentLinks(row.fields)) {
    let target;
    try { target = contentLinkTarget(link.href, link.language); }
    catch { issues.push({ table: row.table_name, id: row.id, slug: row.slug || row.page_key, ...link, reason: "invalid_url" }); continue; }
    if (!target) continue;
    const reference = { table: row.table_name, id: row.id, slug: row.slug || row.page_key, ...link };
    references.push(reference);
    if (link.language && target.language && target.language !== link.language) issues.push({ ...reference, reason: "wrong_language" });
    else if (!target.static && !paths.has(target.canonicalPath)) issues.push({ ...reference, reason: "missing_published_target" });
  }
  return { recordCount: visibleRows(rows).length, referenceCount: references.length, issueCount: issues.length,
    affectedRecordCount: new Set(issues.map(issue => `${issue.table}:${issue.id}`)).size, issues, references };
}

export function buildContentLinkRepairPlan(rows, sitemapPaths = []) {
  const audit = auditContentSnapshot(rows, sitemapPaths);
  const paths = publishedPaths(rows, sitemapPaths), candidates = [], unresolved = [];
  const groups = groupBy(audit.issues, issue => `${issue.table}:${issue.id}`);
  for (const [key, issues] of groups) {
    const row = rows.find(item => `${item.table_name}:${item.id}` === key);
    const fields = structuredClone(row.fields), repairs = [];
    for (const [field, fieldIssues] of groupBy(issues, issue => issue.field)) {
      const language = fieldIssues[0].language;
      const sourceField = field.replace(/_(?:en|zh|ms)(?=[.\[]|$)/, "_en");
      const source = readField(row.fields, sourceField), before = readField(row.fields, field);
      if (language !== "ms" || sourceField === field || typeof source !== "string" || typeof before !== "string") {
        unresolved.push(...fieldIssues.map(issue => ({ ...issue, reason: "source_alignment_unavailable" }))); continue;
      }
      const originalLinks = collectContentLinks(source, { field: sourceField, language: "en" });
      const localizedLinks = collectContentLinks(before, { field, language });
      const aligned = originalLinks.length === localizedLinks.length && localizedLinks.every((link, index) => {
        const original = contentLinkTarget(originalLinks[index].href, "en");
        const current = contentLinkTarget(link.href, language);
        return !original && !current || original && current &&
          (original.canonicalPath === current.canonicalPath || fieldIssues.some(issue => issue.start === link.start));
      });
      if (!aligned) { unresolved.push(...fieldIssues.map(issue => ({ ...issue, reason: "ambiguous_source_alignment" }))); continue; }
      const replacements = [];
      for (const issue of fieldIssues) {
        const index = localizedLinks.findIndex(link => link.start === issue.start);
        const sourceLink = originalLinks[index];
        const sourceTarget = contentLinkTarget(sourceLink.href, "en");
        if (!sourceTarget || !sourceTarget.static && !paths.has(sourceTarget.canonicalPath)) {
          unresolved.push({ ...issue, reason: "source_target_unavailable" }); continue;
        }
        const after = localizeContentLink(sourceLink.href, language);
        replacements.push({ ...issue, before: issue.href, after, sourceField, sourceHref: sourceLink.href, sourceLinkIndex: index });
      }
      let after = before;
      for (const repair of replacements.sort((a, b) => b.start - a.start)) after = after.slice(0, repair.start) + repair.after + after.slice(repair.end);
      writeField(fields, field, after); repairs.push(...replacements);
    }
    if (repairs.length) {
      const changedFields = [...new Set(repairs.map(repair => fieldKeys(repair.field)[0]))];
      candidates.push({ table: row.table_name, id: row.id, slug: row.slug, expectedUpdatedAt: row.updated_at,
        sourceFieldsSha256: digest(row.fields), changedFields,
        before: Object.fromEntries(changedFields.map(field => [field, row.fields[field]])),
        patch: Object.fromEntries(changedFields.map(field => [field, fields[field]])), repairs });
    }
  }
  const simulatedRows = rows.map(row => {
    const candidate = candidates.find(item => item.table === row.table_name && item.id === row.id);
    return candidate ? { ...row, fields: { ...row.fields, ...candidate.patch } } : row;
  });
  return { kind: "review-only-content-link-repair-plan", executable: false, productionWrites: 0,
    snapshotSha256: digest(rows), audit, candidates, unresolved,
    simulatedAudit: auditContentSnapshot(simulatedRows, sitemapPaths) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const option = name => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : null; };
  const snapshot = option("--snapshot"), sitemap = option("--sitemap"), output = option("--out");
  if (!snapshot || !sitemap || !output) throw new Error("Usage: npm run verify:content-links -- --snapshot <public snapshot.json> --sitemap <sitemap snapshot.json> --out <project report directory>");
  const out = path.resolve(output);
  if (!out.startsWith(`${root}${path.sep}`)) throw new Error("Content-link reports must remain inside this website project.");
  const rows = JSON.parse(fs.readFileSync(snapshot, "utf8")).rows;
  const sitemapSnapshot = JSON.parse(fs.readFileSync(sitemap, "utf8"));
  const plan = buildContentLinkRepairPlan(rows, sitemapSnapshot.paths);
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "audit-and-repair-plan.json"), JSON.stringify(plan, null, 2) + "\n");
  console.log(JSON.stringify({ records: plan.audit.recordCount, internalReferences: plan.audit.referenceCount,
    currentIssues: plan.audit.issueCount, affectedRecords: plan.audit.affectedRecordCount,
    candidateRecords: plan.candidates.length, unresolved: plan.unresolved.length,
    simulatedIssuesAfterRepairs: plan.simulatedAudit.issueCount, productionWrites: 0 }, null, 2));
  process.exitCode = plan.audit.issueCount ? 1 : 0;
}
