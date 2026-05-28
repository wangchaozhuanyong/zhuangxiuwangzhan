import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const BUCKET = process.env.MIGRATE_BUCKET || "site-images";

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

const stripWeird = (value) =>
  String(value ?? "")
    .trim()
    // remove zero-width + BOM
    .replace(/[\u200B-\u200D\uFEFF]/g, "");

const assertAscii = (label, value) => {
  // HTTP header values must be ByteString (latin1). We reject non-ASCII early with a readable message.
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code > 127) {
      throw new Error(`${label} contains non-ASCII characters at index ${i} (code=${code}). Please re-copy the key without any extra text/quotes.`);
    }
  }
};

const assertJwtLike = (label, value) => {
  // Supabase keys are JWT-like (3 base64url parts separated by dots).
  // If the user pasted "..." or truncated text, Supabase returns "Invalid Compact JWS".
  const jwtLike = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
  if (!jwtLike.test(value)) {
    throw new Error(
      `${label} is not a valid JWT string. It must look like "xxxxx.yyyyy.zzzzz" (3 parts separated by dots). ` +
        `Make sure you pasted the FULL service_role key, not a shortened one like "...".`
    );
  }
};

const SUPABASE_URL = stripWeird(process.env.VITE_SUPABASE_URL);
const SERVICE_ROLE_KEY = stripWeird(process.env.SUPABASE_SERVICE_ROLE_KEY);

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const LIMIT = Number.parseInt(process.env.MIGRATE_LIMIT || "", 10) || Infinity;

if (!SUPABASE_URL) {
  throw new Error("Missing env: VITE_SUPABASE_URL");
}
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
if (!DRY_RUN && !SERVICE_ROLE_KEY) {
  throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY (required for storage + DB updates)");
}
if (DRY_RUN && !SERVICE_ROLE_KEY && !ANON_KEY) {
  throw new Error("Missing env: VITE_SUPABASE_ANON_KEY (needed for dry-run when service role is not provided)");
}

const supabaseKey = stripWeird(SERVICE_ROLE_KEY || ANON_KEY);
assertAscii("Supabase key", supabaseKey);
// service role + anon keys are JWT-like; validate structure for clearer errors
assertJwtLike("Supabase key", supabaseKey);

const supabase = createClient(SUPABASE_URL, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const isImageExt = (name) => /\.(png|jpe?g)$/i.test(name);
const toWebpPath = (path) => path.replace(/\.(png|jpe?g)$/i, ".webp");

const toPublicUrl = (path) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
const shouldSkip = (path) => path.endsWith(".webp");

const updateTargets = [
  { table: "project_images", columns: ["image_url"] },
  { table: "blog_posts", columns: ["cover_image_url"] },
  { table: "materials", columns: ["image_url"] },
  { table: "hero_slides", columns: ["image_url"] },
  { table: "landing_pages", columns: ["hero_image_url"] },
  { table: "site_settings", columns: ["logo_url", "favicon_url", "og_image_url"] },
  { table: "home_sections", columns: ["image_url"] },
  { table: "before_after_items", columns: ["before_image_url", "after_image_url"] },
  { table: "brand_partners", columns: ["logo_url"] },
];

async function listAllPaths() {
  const paths = [];
  const queue = [""];

  while (queue.length) {
    const prefix = queue.shift();
    let offset = 0;

    while (true) {
      const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
        limit: 1000,
        offset,
      });
      if (error) throw error;
      if (!data?.length) break;

      for (const item of data) {
        const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
        // folders in list() typically have null metadata
        if (!item.metadata) {
          queue.push(fullPath);
          continue;
        }
        paths.push(fullPath);
      }

      if (data.length < 1000) break;
      offset += data.length;
    }
  }

  return paths;
}

async function updateDbUrls(oldUrl, newUrl) {
  if (DRY_RUN) return;
  for (const target of updateTargets) {
    for (const column of target.columns) {
      const { error } = await supabase.from(target.table).update({ [column]: newUrl }).eq(column, oldUrl);
      if (error) throw error;
    }
  }
}

async function migrateOne(path) {
  if (shouldSkip(path)) return { status: "skipped", path };
  if (!isImageExt(path)) return { status: "skipped", path };

  const webpPath = toWebpPath(path);
  const oldUrl = toPublicUrl(path);
  const newUrl = toPublicUrl(webpPath);

  const { data: fileBlob, error: downloadError } = await supabase.storage.from(BUCKET).download(path);
  if (downloadError) throw downloadError;
  const input = Buffer.from(await fileBlob.arrayBuffer());

  const output = await sharp(input)
    .rotate()
    .webp({ quality: 82 })
    .toBuffer();

  if (DRY_RUN) {
    // eslint-disable-next-line no-console
    console.log(`[dry-run] ${path} -> ${webpPath} (${Math.round(input.length / 1024)}KB -> ${Math.round(output.length / 1024)}KB)`);
  } else {
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(webpPath, output, {
      cacheControl: "31536000",
      upsert: false,
      contentType: "image/webp",
    });
    // If already exists, we keep it and still update DB URLs (idempotent-ish)
    if (uploadError && !String(uploadError.message || "").toLowerCase().includes("already exists")) {
      throw uploadError;
    }
  }

  await updateDbUrls(oldUrl, newUrl);
  return { status: "migrated", path, webpPath };
}

async function main() {
  try {
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) throw bucketError;
    // eslint-disable-next-line no-console
    console.log(`Buckets in project: ${(buckets || []).map((b) => b.name).join(", ") || "(none)"}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(`Warning: failed to list buckets (${String(err?.message || err)})`);
  }

  const all = await listAllPaths();
  const candidates = all.filter((p) => isImageExt(p) && !p.endsWith(".webp"));

  // eslint-disable-next-line no-console
  console.log(`Found ${all.length} objects, ${candidates.length} convertible images in bucket "${BUCKET}".`);
  // eslint-disable-next-line no-console
  console.log(DRY_RUN ? "Running in DRY RUN mode." : "Running in APPLY mode (will upload + update DB).");

  let done = 0;
  for (const path of candidates) {
    if (done >= LIMIT) break;
    const result = await migrateOne(path);
    if (result.status === "migrated") done += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`Completed. Migrated: ${done}${Number.isFinite(LIMIT) ? ` (limit=${LIMIT})` : ""}`);

  if (all.length === 0) {
    // eslint-disable-next-line no-console
    console.log(
      `Tip: bucket "${BUCKET}" is empty or not the one used for images. ` +
        `If your images are in a different bucket, run with: $env:MIGRATE_BUCKET="the-bucket-name"`
    );
  }
}

await main();

