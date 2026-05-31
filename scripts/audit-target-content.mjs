import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [name, ...value] = trimmed.split("=");
    if (!process.env[name]) process.env[name] = value.join("=");
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !key) {
  throw new Error("Missing Supabase environment variables.");
}

const supabase = createClient(supabaseUrl, key, { auth: { persistSession: false } });
const outDir = path.join(process.cwd(), "tmp");
fs.mkdirSync(outDir, { recursive: true });

const targets = {
  services: ["bathroom", "builtin", "kitchen", "office-renovation", "shop-renovation", "warehouse", "old-house"],
  landing_pages: ["kitchen-cabinet", "flooring", "office-renovation", "shop-renovation", "warehouse-shelving"],
  materials: ["anti-slip-bathroom-tile", "subway-wall-tile", "sintered-stone-grey", "solid-surface-warm-white"],
  blog_posts: ["office-fit-out-checklist-selangor", "shop-renovation-opening-timeline-malaysia"],
  projects: [
    "bangsar-walk-in-wardrobe-system",
    "corporate-office-petaling-jaya",
    "damansara-heights-semi-d-refurbishment",
    "home-office-puchong",
    "kl-showroom-gallery-renovation",
    "luxury-master-bedroom-damansara",
    "mont-kiara-luxury-condo-renovation",
    "restaurant-fitout-subang",
    "shopfront-renovation-cheras",
    "sri-petaling-beauty-salon-fit-out",
  ],
};

const result = {};

for (const [table, slugs] of Object.entries(targets)) {
  const { data, error } = await supabase.from(table).select("*").in("slug", slugs).order("slug");
  if (error) throw new Error(`${table}: ${error.message}`);
  result[table] = data;
}

const file = path.join(outDir, `target-content-audit-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
fs.writeFileSync(file, JSON.stringify(result, null, 2));
console.log(file);
for (const [table, rows] of Object.entries(result)) {
  console.log(`${table}: ${rows.length}`);
  for (const row of rows) console.log(`- ${row.slug}`);
}
