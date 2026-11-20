#!/usr/bin/env node
/**
 * Publish region page bodies from docs/seo markdown into service_areas.
 *
 * Usage:
 *   SUPABASE_URL=... CONTENT_PUBLISH_SECRET=... node docs/seo/publish-location-bodies.mjs --dry-run
 *   SUPABASE_URL=... CONTENT_PUBLISH_SECRET=... node docs/seo/publish-location-bodies.mjs --publish --slug bangsar
 *   SUPABASE_URL=... CONTENT_PUBLISH_SECRET=... node docs/seo/publish-location-bodies.mjs --publish
 *
 * --dry-run is the default. Never publishes without --publish.
 * --slug limits the run to one area, for the first verification pass.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCES = [
    "location-pages-batch-1.md",
    "location-pages-batch-2.md",
    "location-pages-batch-3.md",
    "location-pages-batch-4.md",
    "location-pages-final-10.md",
].map((name) => join(here, name));

// Already published during the first pass; kept here so a full run is idempotent.
const ALREADY_PUBLISHED = new Set([
    "kuala-lumpur", "petaling-jaya", "subang-jaya", "mont-kiara",
    "puchong", "klang", "shah-alam", "cheras",
]);

const titles = {
    "kuala-lumpur": ["Kuala Lumpur", "吉隆坡"],
    "petaling-jaya": ["Petaling Jaya", "八打灵再也"],
    "subang-jaya": ["Subang Jaya", "梳邦再也"],
    "mont-kiara": ["Mont Kiara", "满家乐"],
    "puchong": ["Puchong", "蒲种"],
    "klang": ["Klang", "巴生"],
    "shah-alam": ["Shah Alam", "莎阿南"],
    "cheras": ["Cheras", "蕉赖"],
    bangsar: ["Bangsar", "孟沙"],
    "bukit-jalil": ["Bukit Jalil", "武吉加里尔"],
    setapak: ["Setapak", "文良港"],
    kepong: ["Kepong", "甲洞"],
    damansara: ["Damansara", "白沙罗"],
    "kota-damansara": ["Kota Damansara", "哥打白沙罗"],
    ampang: ["Ampang", "安邦"],
    "sri-petaling": ["Sri Petaling", "大城堡"],
    "wangsa-maju": ["Wangsa Maju", "旺沙玛珠"],
    "seri-kembangan": ["Seri Kembangan", "沙登"],
    kajang: ["Kajang", "加影"],
    balakong: ["Balakong", "无拉港"],
    "ara-damansara": ["Ara Damansara", "阿拉白沙罗"],
    rawang: ["Rawang", "万挠"],
    "setia-alam": ["Setia Alam", "实达阿南"],
    "sungai-buloh": ["Sungai Buloh", "双溪毛糯"],
    cyberjaya: ["Cyberjaya", "赛城"],
    putrajaya: ["Putrajaya", "布城"],
    "desa-parkcity": ["Desa ParkCity", "帝沙公园城"],
    "taman-tun-dr-ismail": ["Taman Tun Dr Ismail", "里端端"],
    semenyih: ["Semenyih", "士毛月"],
    selangor: ["Selangor", "雪兰莪"],
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
        const blocks = text.split(/^## `\/locations\//m);
        for (const block of blocks.slice(1)) {
            const slug = block.slice(0, block.indexOf("`"));
            if (!slug) continue;
            const htmlBlocks = [...block.matchAll(/```html\n([\s\S]*?)```/g)].map((m) => m[1].trim());
            if (htmlBlocks.length < 2) continue;
            pages.set(slug, { en: htmlBlocks[0], zh: htmlBlocks[1] });
        }
    }
    return pages;
}

function plain(value) {
    return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function excerpt(html, limit) {
    const first = html.split(/<\/p>/)[0].replace(/<[^>]+>/g, " ");
    const clean = first.replace(/\s+/g, " ").trim();
    return clean.slice(0, limit);
}

function constructionNotes(html, lang) {
    const paras = html.split(/<\/p>/).map((p) => p.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
    // Third paragraph carries access and site conditions in every page.
    return paras[2] || paras[1] || "";
}

function buildRecord(slug, body) {
    const [en, zh] = titles[slug] || [slug, slug];
    const titleEn = `${en} Renovation Contractor`;
    const titleZh = `${zh}装修公司`;
    return {
        slug,
        status: "published",
        title_en: titleEn,
        title_zh: titleZh,
        content_en: body.en,
        content_zh: body.zh,
        excerpt_en: excerpt(body.en, 180),
        excerpt_zh: excerpt(body.zh, 70),
        seo_description_en: excerpt(body.en, 155),
        seo_description_zh: excerpt(body.zh, 70),
        construction_notes_en: constructionNotes(body.en, "en"),
        construction_notes_zh: constructionNotes(body.zh, "zh"),
    };
}

const args = process.argv.slice(2);
const publish = args.includes("--publish");
const onlyIndex = args.indexOf("--slug");
const only = onlyIndex >= 0 ? args[onlyIndex + 1] : null;

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const secret = process.env.CONTENT_PUBLISH_SECRET;
if (!url || !secret) {
    console.error("Missing SUPABASE_URL (or VITE_SUPABASE_URL) and/or CONTENT_PUBLISH_SECRET.");
    console.error("Example:");
    console.error('  $env:SUPABASE_URL="https://xxxx.supabase.co"');
    console.error('  $env:CONTENT_PUBLISH_SECRET="..."');
    process.exit(1);
}

const pages = parseSources();
const targets = [...pages.keys()].filter((slug) => {
    if (only) return slug === only;
    return !ALREADY_PUBLISHED.has(slug);
});

if (!targets.length) {
    console.log(only ? `slug ${only} not found in sources.` : "Nothing to publish; all 30 already done.");
    process.exit(0);
}

console.log(`mode: ${publish ? "PUBLISH" : "dry-run"}`);
console.log(`targets: ${targets.length}`);
for (const slug of targets) console.log("  -", slug);

const endpoint = `${url.replace(/\/$/, "")}/functions/v1/content-publish`;
let ok = 0;
let failed = 0;

for (const slug of targets) {
    const record = buildRecord(slug, pages.get(slug));
    const payload = {
        contentType: "service_area",
        mode: publish ? "publish" : "dry-run",
        record,
        nextStatus: "published",
        ownerApproved: publish ? true : undefined,
        explicitExecution: publish ? true : undefined,
    };
    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-cron-secret": secret },
            body: JSON.stringify(payload),
        });
        const text = await res.text();
        const short = text.slice(0, 220).replace(/\s+/g, " ");
        if (res.ok) {
            ok += 1;
            console.log(`OK   ${slug} (${res.status}) ${short}`);
        } else {
            failed += 1;
            console.log(`FAIL ${slug} (${res.status}) ${short}`);
        }
    } catch (error) {
        failed += 1;
        console.log(`ERR  ${slug} ${String(error).slice(0, 160)}`);
    }
}

console.log(`\ndone: ok=${ok} failed=${failed}`);
if (!publish) console.log("Dry run only. Re-run with --publish to write.");
process.exit(failed ? 1 : 0);
