// Publishes only the owner-approved repair service through content-publish.
// Credentials stay in process memory; artifacts contain public content only.
import fs from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { execFileSync } from "node:child_process";
import { loadEnv } from "vite";

const root = process.cwd();
const args = process.argv.slice(2);
const option = (name) => args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const execute = args.includes("--execute");
const env = { ...loadEnv("production", option("env-dir") || root, ""), ...process.env };
const api = (env.VITE_SUPABASE_URL || env.SUPABASE_URL || "").replace(/\/$/, "");
const key = env.VITE_SUPABASE_ANON_KEY;
const secret = env.CONTENT_PUBLISH_SECRET;
if (!api || !key || !secret) throw new Error("Configured content-publish credentials are required.");
if (new URL(api).hostname !== "rbsnyexjifounogswrjp.supabase.co") throw new Error("Unexpected project.");
const approvalId = option("approval-id");
const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (execute && (!approvalId || option("expected-source-sha") !== head)) throw new Error("Execution requires approval-id and the exact expected-source-sha.");
const artifact = path.resolve(option("artifact-dir") || path.join(root, "audits/repair-unified-release-20260927/cms"));
if (!artifact.startsWith(root + path.sep)) throw new Error("Evidence must stay inside this project checkout.");
fs.mkdirSync(artifact, { recursive: true });
const save = (name, data) => fs.writeFileSync(path.join(artifact, name), JSON.stringify(data, null, 2) + "\n");
const source = fs.readFileSync(path.join(root, "src/i18n/surfaceRepairPageText.ts"), "utf8");
const copy = JSON.parse(source.slice(source.indexOf("{"), source.lastIndexOf("}") + 1));
const record = { slug: "surface-repair", image_url: "/images/services/surface-repair/hero.webp", sort_order: 1000 };
for (const lang of ["zh", "en"]) {
  const c = copy[lang];
  Object.assign(record, {
    [`title_${lang}`]: c.siteHero.titleLines.join(lang === "zh" ? "" : " "),
    [`excerpt_${lang}`]: c.siteHero.description,
    [`content_${lang}`]: c.scopeDescription,
    [`alt_${lang}`]: c.siteHero.imageAlt,
    [`seo_title_${lang}`]: c.metaTitle,
    [`seo_description_${lang}`]: c.metaDescription,
    [`suitable_for_${lang}`]: c.situations.split(" · "),
    [`common_projects_${lang}`]: c.damageExamples.map(item => item.title),
    [`scope_items_${lang}`]: c.services.map(item => `${item.title}: ${item.summary}`),
    [`process_steps_${lang}`]: c.process.map(item => ({ title: item.title, desc: item.description })),
    [`faqs_${lang}`]: c.faqs.map(item => ({ q: item.question, a: item.answer })),
  });
}
const readPublished = async () => {
  const response = await fetch(`${api}/rest/v1/services?slug=eq.surface-repair&select=*&limit=2`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!response.ok) throw new Error(`Service readback failed (${response.status}).`);
  const rows = await response.json();
  if (rows.length > 1) throw new Error("Service slug is not unique.");
  return rows[0] || null;
};
const before = await readPublished();
// This release creates one new record, and must not overwrite existing content.
if (before) {
  const identical = before.status === "published" && Object.entries(record).every(([field, value]) => isDeepStrictEqual(before[field], value));
  if (!identical) throw new Error("An existing repair service differs from this candidate; review the conflict before publishing.");
  save("already-published.json", { saved_id: before.id, saved_updated_at: before.updated_at, source: head });
  console.log(JSON.stringify({ ok: true, alreadyPublished: true, saved_id: before.id }));
  process.exit(0);
}
save("baseline.json", { source: head, slug: record.slug, record: before });
save("candidate.json", record);
const publish = async (mode) => {
  const response = await fetch(`${api}/functions/v1/content-publish`, {
    method: "POST", headers: { "Content-Type": "application/json", apikey: key, "x-cron-secret": secret },
    body: JSON.stringify({ contentType: "service", mode, nextStatus: "published", record, expectedUpdatedAt: "1970-01-01T00:00:00.000Z", ownerApproved: execute, explicitExecution: execute, approvalId, source: "owner-approved-surface-repair-20260927" }),
  });
  const result = await response.json();
  save(mode === "dry-run" ? "dry-run.json" : "publish-receipt.json", result);
  if (!response.ok || !result.ok) throw new Error(`Protected content publish rejected ${mode}: ${result.error || response.status}`);
  return result;
};
const dryRun = await publish("dry-run");
if (dryRun.existing_id) throw new Error("An unpublished record already uses this slug; refusing to replace it.");
if (!execute) { console.log(JSON.stringify({ ok: true, dryRun: true, slug: record.slug, source: head })); process.exit(0); }
const live = await fetch("https://flashcast.com.my/__flashcast/version", { cache: "no-store" }).then(response => response.json());
if (live.deploymentVersion !== head) throw new Error("Deploy and verify this exact main revision before publishing the service.");
for (const name of ["hero", "damage-cabinet", "damage-wood", "damage-tile", "damage-stone"]) {
  const response = await fetch(`https://flashcast.com.my/images/services/surface-repair/${name}.webp`, { method: "HEAD" });
  if (!response.ok || !response.headers.get("content-type")?.includes("image")) throw new Error(`Live image is not ready: ${name}.`);
}
const receipt = await publish("publish");
const after = await readPublished();
save("readback.json", after);
const mismatches = Object.entries(record).filter(([field, value]) => !isDeepStrictEqual(after?.[field], value)).map(([field]) => field);
if (!after || after.id !== receipt.saved_id || after.status !== "published" || mismatches.length) throw new Error(`Saved service requires review: ${mismatches.join(", ")}. Do not retry blindly.`);
save("rollback.json", { action: "archive-created-service-through-content-publish", saved_id: after.id, expectedUpdatedAt: after.updated_at, prior_record: null, note: "Restore visibility by archiving this exact newly-created row through the same protected API, never deleting the row." });
console.log(JSON.stringify({ ok: true, published: true, saved_id: after.id, saved_updated_at: after.updated_at, source: head }));
