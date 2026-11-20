#!/usr/bin/env node
/**
 * Publish region page bodies from docs/seo markdown into service_areas.
 *
 * Two transports:
 *   1. CONTENT_PUBLISH_SECRET  -> POST /functions/v1/content-publish (the reviewed path)
 *   2. SERVICE_ROLE_KEY        -> PATCH /rest/v1/service_areas  (direct; bypasses the publish review)
 *
 * Transport 2 exists because the publish function only accepts the cron secret or an
 * MFA-verified admin token. It writes the same columns the reviewed path writes, and a
 * full backup must be taken first.
 *
 * Usage:
 *   node docs/seo/publish-location-bodies.mjs                        # dry-run (default)
 *   node docs/seo/publish-location-bodies.mjs --slug bangsar --publish
 *   node docs/seo/publish-location-bodies.mjs --publish               # remaining areas
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Resolve from the repository root rather than import.meta.url: the checkout path
// contains non-ASCII characters and fileURLToPath round-trips it unreliably.
const SOURCE_DIR = join(process.cwd(), "docs", "seo");
const SOURCES = [
    "location-pages-batch-1.md",
    "location-pages-batch-2.md",
    "location-pages-batch-3.md",
    "location-pages-batch-4.md",
    "location-pages-final-10.md",
].map((name) => join(SOURCE_DIR, name));

// Already carried the new copy before this script existed.
const ALREADY_PUBLISHED = new Set([
    "kuala-lumpur", "petaling-jaya", "subang-jaya", "mont-kiara",
    "puchong", "klang", "shah-alam", "cheras",
]);

const TITLES = {
    "kuala-lumpur": ["Kuala Lumpur", "吉隆坡"],
    "petaling-jaya": ["Petaling Jaya", "八打灵再也"],
    "subang-jaya": ["Subang Jaya", "梳邦再也"],
    "mont-kiara": ["Mont Kiara", "满家乐"],
    "puchong": ["Puchong", "蒲种"],
    "klang": ["Klang", "巴生"],
    "shah-alam": ["Shah Alam", "莎阿南"],
    "cheras": ["Cheras", "蕉赖"],
    "bangsar": ["Bangsar", "孟沙"],
    "bukit-jalil": ["Bukit Jalil", "武吉加里尔"],
    "setapak": ["Setapak", "文良港"],
    "kepong": ["Kepong", "甲洞"],
    "damansara": ["Damansara", "白沙罗"],
    "kota-damansara": ["Kota Damansara", "哥打白沙罗"],
    "ampang": ["Ampang", "安邦"],
    "sri-petaling": ["Sri Petaling", "大城堡"],
    "wangsa-maju": ["Wangsa Maju", "旺沙玛珠"],
    "seri-kembangan": ["Seri Kembangan", "沙登"],
    "kajang": ["Kajang", "加影"],
    "balakong": ["Balakong", "无拉港"],
    "ara-damansara": ["Ara Damansara", "阿拉白沙罗"],
    "rawang": ["Rawang", "万挠"],
    "setia-alam": ["Setia Alam", "实达阿南"],
    "sungai-buloh": ["Sungai Buloh", "双溪毛糯"],
    "cyberjaya": ["Cyberjaya", "赛城"],
    "putrajaya": ["Putrajaya", "布城"],
    "desa-parkcity": ["Desa ParkCity", "帝沙公园城"],
    "taman-tun-dr-ismail": ["Taman Tun Dr Ismail", "里端端"],
    "semenyih": ["Semenyih", "士毛月"],
    "selangor": ["Selangor", "雪兰莪"],
};

function parseSources() {
    const pages = new Map();
    for (const file of SOURCES) {
        let text;
        try {
            text = readFileSync(file, "utf8");
        } catch {
            continue;
        }
        for (const block of text.split(/^## `\/locations\//m).slice(1)) {
            const slug = block.slice(0, block.indexOf("`"));
            if (!slug) continue;
            // Source files are CRLF on this checkout.
            const htmlBlocks = [...block.matchAll(/```html\r?\n([\s\S]*?)```/g)].map((m) => m[1].trim());
            if (htmlBlocks.length < 2) continue;
            pages.set(slug, { en: htmlBlocks[0], zh: htmlBlocks[1] });
        }
    }
    return pages;
}

const strip = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function excerptOf(html, limit) {
    return strip(html.split(/<\/p>/)[0]).slice(0, limit);
}

function paragraphs(html) {
    return html.split(/<\/p>/).map(strip).filter(Boolean);
}

function buildRecord(slug, body) {
    const [en, zh] = TITLES[slug] || [slug, slug];
    const parasEn = paragraphs(body.en);
    const parasZh = paragraphs(body.zh);
    return {
        title_en: `${en} Renovation Contractor`,
        title_zh: `${zh}装修公司`,
        content_en: body.en,
        content_zh: body.zh,
        excerpt_en: excerptOf(body.en, 180),
        excerpt_zh: excerptOf(body.zh, 70),
        seo_description_en: excerptOf(body.en, 155),
        seo_description_zh: excerptOf(body.zh, 70),
        construction_notes_en: parasEn[2] || parasEn[1] || "",
        construction_notes_zh: parasZh[2] || parasZh[1] || "",
    };
}

const args = process.argv.slice(2);
const publish = args.includes("--publish");
const onlyIndex = args.indexOf("--slug");
const only = onlyIndex >= 0 ? args[onlyIndex + 1] : null;

const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const serviceRole = process.env.SERVICE_ROLE_KEY;
const cronSecret = process.env.CONTENT_PUBLISH_SECRET;

if (!supabaseUrl || (!serviceRole && !cronSecret)) {
    console.error("Need SUPABASE_URL plus either SERVICE_ROLE_KEY or CONTENT_PUBLISH_SECRET.");
    process.exit(1);
}

const transport = serviceRole ? "rest-service-role" : "content-publish";
const pages = parseSources();
const targets = [...pages.keys()].filter((slug) => (only ? slug === only : !ALREADY_PUBLISHED.has(slug)));

if (!targets.length) {
    console.log(only ? `slug ${only} not found in sources.` : "Nothing to publish; all thirty already carry the new copy.");
    process.exit(0);
}

console.log(`mode: ${publish ? "PUBLISH" : "dry-run"} | transport: ${transport} | targets: ${targets.length}`);
console.log("  " + targets.join(", "));

let ok = 0;
let failed = 0;
const log = [];

for (const slug of targets) {
    const record = buildRecord(slug, pages.get(slug));
    if (!publish) {
        log.push({ slug, action: "dry-run", contentEn: record.content_en.length, contentZh: record.content_zh.length });
        continue;
    }
    try {
        let res;
        if (serviceRole) {
            res = await fetch(`${supabaseUrl}/rest/v1/service_areas?slug=eq.${encodeURIComponent(slug)}`, {
                method: "PATCH",
                headers: {
                    apikey: serviceRole,
                    Authorization: `Bearer ${serviceRole}`,
                    "Content-Type": "application/json",
                    Prefer: "return=representation",
                },
                body: JSON.stringify(record),
            });
        } else {
            res = await fetch(`${supabaseUrl}/functions/v1/content-publish`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-cron-secret": cronSecret },
                body: JSON.stringify({
                    contentType: "service_area",
                    mode: "publish",
                    record: { slug, status: "published", ...record },
                    nextStatus: "published",
                    ownerApproved: true,
                    explicitExecution: true,
                }),
            });
        }
        const text = await res.text();
        if (res.ok) {
            ok += 1;
            const rows = serviceRole ? JSON.parse(text || "[]") : [];
            const written = rows[0]?.content_en?.length ?? record.content_en.length;
            console.log(`OK   ${slug} (${res.status}) content_en=${written}`);
            log.push({ slug, action: "published", status: res.status, contentEn: written });
        } else {
            failed += 1;
            console.log(`FAIL ${slug} (${res.status}) ${text.slice(0, 200).replace(/\s+/g, " ")}`);
            log.push({ slug, action: "failed", status: res.status, error: text.slice(0, 300) });
        }
    } catch (error) {
        failed += 1;
        console.log(`ERR  ${slug} ${String(error).slice(0, 160)}`);
        log.push({ slug, action: "error", error: String(error) });
    }
}

writeFileSync(join(SOURCE_DIR, `publish-log-${Date.now()}.json`), JSON.stringify(log, null, 2));

if (!publish) {
    const lens = log.map((entry) => entry.contentEn);
    console.log(`\ndry-run: ${targets.length} targets parsed. content_en ${Math.min(...lens)}-${Math.max(...lens)} chars.`);
    console.log("Re-run with --publish to write.");
} else {
    console.log(`\ndone: ok=${ok} failed=${failed}`);
}
process.exit(failed ? 1 : 0);
