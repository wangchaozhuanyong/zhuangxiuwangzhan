import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "vite";
import { archiveMaterialSlugs, materialCatalogRecords } from "./material-catalog-data.mjs";

const args = process.argv.slice(2);
const validateOnly = args.includes("--validate");
const execute = args.includes("--execute");
const skipArchive = args.includes("--skip-archive");
const requestedSlugs = args.filter((arg) => arg.startsWith("--slug=")).map((arg) => arg.slice("--slug=".length)).filter(Boolean);
const approvalId = args.find((arg) => arg.startsWith("--approval-id="))?.slice("--approval-id=".length) || "";
const envDir = path.resolve(args.find((arg) => arg.startsWith("--env-dir="))?.slice("--env-dir=".length) || process.cwd());
const assetRoot = path.resolve(args.find((arg) => arg.startsWith("--asset-root="))?.slice("--asset-root=".length) || process.cwd());

const fail = (message) => {
  throw new Error(message);
};

const validateCatalog = () => {
  if (materialCatalogRecords.length !== 45) fail(`Expected 45 active products, found ${materialCatalogRecords.length}.`);
  if (archiveMaterialSlugs.length !== 16) fail(`Expected 16 archived duplicate/placeholder slugs, found ${archiveMaterialSlugs.length}.`);

  const slugs = materialCatalogRecords.map((item) => item.record.slug);
  if (new Set(slugs).size !== slugs.length) fail("Active material slugs must be unique.");
  if (archiveMaterialSlugs.some((slug) => slugs.includes(slug))) fail("A slug cannot be active and archived at the same time.");

  for (const { record, research_sources: researchSources } of materialCatalogRecords) {
    if (record.gallery.length !== 10) fail(`${record.slug} must have exactly 10 gallery images.`);
    if (new Set(record.gallery.map((image) => image.image_url)).size !== record.gallery.length) {
      fail(`${record.slug} contains duplicate gallery image URLs.`);
    }
    if (record.gallery[0]?.image_type !== "cover") fail(`${record.slug} must start with a cover image.`);
    if (!record.title_zh || !record.title_en || !record.content_zh || !record.content_en) fail(`${record.slug} is missing bilingual content.`);
    if (!record.price_scope_zh || !record.price_scope_en || !record.price_note_zh || !record.price_note_en) {
      fail(`${record.slug} is missing bilingual pricing context.`);
    }
    if (!researchSources.length || researchSources.some((source) => !source.startsWith("https://"))) {
      fail(`${record.slug} requires HTTPS research sources.`);
    }

    for (const image of record.gallery) {
      if (!image.alt_zh || !image.alt_en) fail(`${record.slug} contains an image without bilingual alt text.`);
      if (image.image_url.startsWith("/")) {
        const localPath = path.join(assetRoot, "public", image.image_url.replace(/^\//, ""));
        if (!fs.existsSync(localPath)) fail(`${record.slug} references a missing local image: ${image.image_url}`);
      }
    }
  }

  return {
    activeProducts: materialCatalogRecords.length,
    archivedDuplicatesAndPlaceholders: archiveMaterialSlugs.length,
    galleryImages: materialCatalogRecords.reduce((total, item) => total + item.record.gallery.length, 0),
    uniqueResearchSources: new Set(materialCatalogRecords.flatMap((item) => item.research_sources)).size,
  };
};

const postPublishRequest = async (functionUrl, secret, body) => {
  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cron-secret": secret,
    },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
  if (!response.ok || result.ok === false) fail(`${body.record?.slug || "material"}: ${result.error || `HTTP ${response.status}`}`);
  return result;
};

const publishRecord = async ({ functionUrl, secret, record, nextStatus }) => {
  const preview = await postPublishRequest(functionUrl, secret, {
    contentType: "material",
    mode: "dry-run",
    nextStatus,
    record,
    source: "material-catalog-2026-08-22",
  });
  if (!execute) return { slug: record.slug, action: preview.action, mode: "dry-run" };

  const published = await postPublishRequest(functionUrl, secret, {
    contentType: "material",
    mode: "publish",
    nextStatus,
    expectedUpdatedAt: preview.existing_updated_at || null,
    ownerApproved: true,
    explicitExecution: true,
    approvalId,
    record,
    source: "material-catalog-2026-08-22",
  });
  return { slug: record.slug, action: published.action, mode: "publish", galleryCount: published.gallery_count || 0 };
};

const main = async () => {
  const summary = validateCatalog();
  if (validateOnly) {
    console.log(JSON.stringify({ ok: true, mode: "validate", ...summary }, null, 2));
    return;
  }

  if (execute && !approvalId) fail("--execute requires --approval-id=<owner approval reference>.");
  const env = loadEnv("", envDir, "");
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const secret = env.CONTENT_PUBLISH_SECRET;
  if (!supabaseUrl || !secret) fail("SUPABASE_URL (or VITE_SUPABASE_URL) and CONTENT_PUBLISH_SECRET are required.");
  const functionUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/content-publish`;
  const selectedRecords = requestedSlugs.length
    ? materialCatalogRecords.filter((item) => requestedSlugs.includes(item.record.slug))
    : materialCatalogRecords;
  const selectedSlugs = new Set(selectedRecords.map((item) => item.record.slug));
  const missingSlugs = requestedSlugs.filter((slug) => !selectedSlugs.has(slug));
  if (missingSlugs.length) fail(`Unknown material slug(s): ${missingSlugs.join(", ")}.`);

  const results = [];
  for (const item of selectedRecords) {
    results.push(await publishRecord({ functionUrl, secret, record: item.record, nextStatus: "published" }));
  }
  for (const slug of skipArchive || requestedSlugs.length ? [] : archiveMaterialSlugs) {
    const preview = await postPublishRequest(functionUrl, secret, {
      contentType: "material",
      mode: "dry-run",
      nextStatus: "archived",
      record: { slug, status: "archived" },
      source: "material-catalog-2026-08-22",
    });
    if (!preview.existing_id) {
      results.push({ slug, action: "skip-missing", mode: execute ? "publish" : "dry-run" });
      continue;
    }
    if (!execute) {
      results.push({ slug, action: "archive", mode: "dry-run" });
      continue;
    }
    results.push(await publishRecord({ functionUrl, secret, record: { slug, status: "archived" }, nextStatus: "archived" }));
  }

  console.log(JSON.stringify({ ok: true, mode: execute ? "publish" : "dry-run", ...summary, selectedProducts: selectedRecords.length, archivedRecordsIncluded: !skipArchive && !requestedSlugs.length, results }, null, 2));
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
