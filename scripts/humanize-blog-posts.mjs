import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { humanizedBlogUpdates } from "./humanized-blog-content.mjs";

const root = process.cwd();
const envPath = path.join(root, ".env");

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [name, ...value] = trimmed.split("=");
    if (!process.env[name]) process.env[name] = value.join("=");
  }
}

const shouldWrite = process.argv.includes("--write");
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
const readKey = serviceKey || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !readKey) {
  console.error("[humanize-blog-posts] Missing VITE_SUPABASE_URL and a Supabase read key.");
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(root, "backups");
const tmpDir = path.join(root, "tmp");
fs.mkdirSync(backupDir, { recursive: true });
fs.mkdirSync(tmpDir, { recursive: true });

const reader = createClient(supabaseUrl, readKey, { auth: { persistSession: false } });

const columns = [
  "id",
  "slug",
  "title_zh",
  "title_en",
  "excerpt_zh",
  "excerpt_en",
  "content_zh",
  "content_en",
  "category",
  "tags",
  "seo_title_zh",
  "seo_title_en",
  "seo_description_zh",
  "seo_description_en",
  "status",
  "published_at",
  "updated_at",
].join(",");

const { data: currentRows, error: fetchError } = await reader
  .from("blog_posts")
  .select(columns)
  .eq("status", "published")
  .order("published_at", { ascending: false });

if (fetchError) {
  console.error(`[humanize-blog-posts] Failed to fetch blog_posts: ${fetchError.message}`);
  process.exit(1);
}

const backupPath = path.join(backupDir, `blog-posts-before-humanize-${timestamp}.json`);
fs.writeFileSync(backupPath, JSON.stringify(currentRows || [], null, 2));

const updatesBySlug = new Map(humanizedBlogUpdates.map((item) => [item.slug, item]));
const currentBySlug = new Map((currentRows || []).map((item) => [item.slug, item]));
const matchedUpdates = humanizedBlogUpdates.filter((item) => currentBySlug.has(item.slug));
const missingInDatabase = humanizedBlogUpdates.filter((item) => !currentBySlug.has(item.slug)).map((item) => item.slug);
const databaseNotCovered = (currentRows || []).filter((item) => !updatesBySlug.has(item.slug)).map((item) => item.slug);

const aiMarkers = [
  /why this topic matters/i,
  /what to prepare before asking for a quote/i,
  /how flash cast can help/i,
  /helps owners understand budget/i,
  /complete guide/i,
  /comprehensive/i,
  /here are/i,
  /key factors/i,
  /one of the most/i,
  /our recommendation/i,
  /can feel overwhelming/i,
  /step[- ]by[- ]step/i,
  /essential checklist/i,
  /transform a room/i,
  /contact flash cast/i,
  /free quotation/i,
  /銆|锛|鍚|闆|瑁|淇|鐨|搴|绠|瀹|鏈|閫|鐜/,
];

const stripHtml = (value) =>
  String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function auditRow(row) {
  const text = [
    row.title_zh,
    row.title_en,
    row.excerpt_zh,
    row.excerpt_en,
    row.content_zh,
    row.content_en,
    row.seo_description_zh,
    row.seo_description_en,
  ]
    .map(stripHtml)
    .join(" ");
  const hits = aiMarkers
    .map((pattern) => ({ marker: String(pattern), count: (text.match(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`)) || []).length }))
    .filter((item) => item.count > 0);
  const repeatedHeadingCount = [
    "Why this topic matters",
    "What to prepare before asking for a quote",
    "How FLASH CAST can help",
    "为什么这个主题重要",
    "询价前要准备什么",
    "FLASH CAST 可以怎么协助",
  ].filter((heading) => text.toLowerCase().includes(heading.toLowerCase())).length;
  const headingCount = (String(row.content_en || "").match(/<h2\b/gi) || []).length + (String(row.content_zh || "").match(/<h2\b/gi) || []).length;
  return {
    slug: row.slug,
    title_en: row.title_en,
    title_zh: row.title_zh,
    markerHits: hits,
    repeatedHeadingCount,
    headingCount,
    score: hits.reduce((sum, hit) => sum + hit.count * 10, 0) + repeatedHeadingCount * 20 + Math.max(0, headingCount - 8) * 2,
  };
}

const beforeAudit = (currentRows || []).map(auditRow).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
const preparedRows = matchedUpdates.map((patch) => ({ ...currentBySlug.get(patch.slug), ...patch }));
const preparedAudit = preparedRows.map(auditRow).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);

const previewPath = path.join(tmpDir, `blog-humanize-preview-${timestamp}.json`);
fs.writeFileSync(
  previewPath,
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      write_requested: shouldWrite,
      backup_path: backupPath,
      update_count: matchedUpdates.length,
      missing_in_database: missingInDatabase,
      database_not_covered: databaseNotCovered,
      before_ai_like_count: beforeAudit.length,
      prepared_ai_like_count: preparedAudit.length,
      before_top_issues: beforeAudit.slice(0, 10),
      prepared_issues: preparedAudit,
      updates: preparedRows,
    },
    null,
    2,
  ),
);

let blockedWrite = false;

if (shouldWrite) {
  if (!serviceKey) {
    console.error("[humanize-blog-posts] Write mode requires SUPABASE_SERVICE_ROLE_KEY or SERVICE_ROLE_KEY. Backup and preview were created, but database was not changed.");
    console.log(
      JSON.stringify(
        {
          mode: "blocked",
          reason: "missing_service_role_key",
          backupPath,
          previewPath,
          currentPublishedPosts: currentRows?.length || 0,
          preparedUpdates: matchedUpdates.length,
          beforeAiLikeCount: beforeAudit.length,
          preparedAiLikeCount: preparedAudit.length,
          missingInDatabase,
          databaseNotCovered,
        },
        null,
        2,
      ),
    );
    blockedWrite = true;
  }

  if (serviceKey) {
    const writer = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    for (const patch of matchedUpdates) {
      const { slug, ...body } = patch;
      const { error } = await writer
        .from("blog_posts")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("slug", slug);
      if (error) {
        console.error(`[humanize-blog-posts] Failed to update ${slug}: ${error.message}`);
        process.exit(1);
      }
      console.log(`updated blog_posts/${slug}`);
    }
  }
}

if (!blockedWrite) {
  console.log(
    JSON.stringify(
      {
        mode: shouldWrite ? "write" : "preview",
        backupPath,
        previewPath,
        currentPublishedPosts: currentRows?.length || 0,
        preparedUpdates: matchedUpdates.length,
        beforeAiLikeCount: beforeAudit.length,
        preparedAiLikeCount: preparedAudit.length,
        missingInDatabase,
        databaseNotCovered,
      },
      null,
      2,
    ),
  );
}

if (blockedWrite) process.exitCode = 2;
