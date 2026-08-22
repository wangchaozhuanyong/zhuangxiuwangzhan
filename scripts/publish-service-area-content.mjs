import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "vite";

const args = process.argv.slice(2);
const execute = args.includes("--execute");
const target = args.find((arg) => arg.startsWith("--target="))?.slice("--target=".length) || "";
const approvalId = args.find((arg) => arg.startsWith("--approval-id="))?.slice("--approval-id=".length) || "";
const rollbackFrom = args.find((arg) => arg.startsWith("--rollback-from="))?.slice("--rollback-from=".length) || "";
const envDir = path.resolve(args.find((arg) => arg.startsWith("--env-dir="))?.slice("--env-dir=".length) || process.cwd());
const artifactRoot = path.resolve(
  args.find((arg) => arg.startsWith("--artifact-dir="))?.slice("--artifact-dir=".length)
    || path.join(process.cwd(), "audits", "service-area-content-20260822"),
);

const fail = (message) => {
  throw new Error(message);
};

const serviceAreaFields = [
  "id", "slug", "status", "updated_at", "title_zh", "title_en", "excerpt_zh", "excerpt_en", "content_zh", "content_en",
  "area_name", "property_types", "common_needs", "construction_notes_zh", "construction_notes_en", "projects", "faqs_zh", "faqs_en",
  "seo_title_zh", "seo_title_en", "seo_description_zh", "seo_description_en", "sort_order",
];

const unsafePhrases = [
  "Can you provide free site measurement",
  "3-5 working days",
  "5-10 working days",
  "We help prepare the required details",
  "可以免费上门测量吗",
  "3-5 个工作日",
  "5-10 个工作日",
  "协助整理所需资料",
];

const containsUnsafeFaq = (row) => JSON.stringify([row.faqs_en, row.faqs_zh]).toLowerCase()
  .includes("free site measurement")
  || JSON.stringify([row.faqs_en, row.faqs_zh]).includes("3-5 working days")
  || JSON.stringify([row.faqs_en, row.faqs_zh]).includes("5-10 working days")
  || JSON.stringify([row.faqs_en, row.faqs_zh]).includes("We help prepare the required details")
  || JSON.stringify([row.faqs_en, row.faqs_zh]).includes("可以免费上门测量吗")
  || JSON.stringify([row.faqs_en, row.faqs_zh]).includes("3-5 个工作日")
  || JSON.stringify([row.faqs_en, row.faqs_zh]).includes("5-10 个工作日")
  || JSON.stringify([row.faqs_en, row.faqs_zh]).includes("协助整理所需资料");

const buildSafeFaqs = (current) => {
  const areaName = String(current.area_name || current.title_en || current.slug || "this area").trim();
  return {
    faqs_en: [
      {
        q: `Can a site visit or measurement be arranged in ${areaName}?`,
        a: "It can be discussed after we review the project type, location, access, current condition, and schedule. Share photos, approximate size, and intended scope first.",
      },
      {
        q: `What affects quotation preparation for a renovation in ${areaName}?`,
        a: "Timing depends on how clear the scope is, whether a site review is needed, and whether material, technical, management, landlord, consultant, or authority details are outstanding. We confirm the next step after reviewing the information.",
      },
      {
        q: "Can management or approval requirements be reviewed?",
        a: "Yes. We can review the available building guide and project scope with you. Required forms, drawings, qualified parties, fees, deposits, submissions, responsibilities, and approval decisions remain subject to the relevant management, landlord, consultants, or authority.",
      },
    ],
    faqs_zh: [
      {
        q: `${areaName} 可以安排现场查看或测量吗？`,
        a: "可以在初步了解项目类型、地点、出入条件、现场情况和时间安排后讨论。请先提供照片、大约面积和计划施工范围。",
      },
      {
        q: `${areaName} 装修报价准备时间受哪些因素影响？`,
        a: "报价准备时间取决于施工范围是否明确、是否需要现场查看，以及材料、技术、管理处、业主、顾问或相关部门资料是否齐全。我们会在审核资料后说明下一步。",
      },
      {
        q: "可以一起核对管理处或审批要求吗？",
        a: "可以。我们可以根据现有管理指南和项目范围一起核对。具体表格、图纸、合格人员、费用、押金、提交责任和审批结果，仍以相关管理处、业主、顾问或主管部门要求为准。",
      },
    ],
  };
};

const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const writeText = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
};

const stableValue = (value) => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value ?? null;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
};

const valuesMatch = (left, right) => JSON.stringify(stableValue(left)) === JSON.stringify(stableValue(right));

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
  if (!response.ok) fail(body.error || `HTTP ${response.status}`);
  return body;
};

const main = async () => {
  if (execute && !target) fail("--execute requires exactly one --target=<service-area-slug>.");
  if (execute && !approvalId) fail("--execute requires --approval-id=<authorization reference>.");
  if (rollbackFrom && !execute) fail("--rollback-from requires --execute.");

  const env = loadEnv("", envDir, "");
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  const publishSecret = env.CONTENT_PUBLISH_SECRET;
  const publicSiteUrl = (env.VITE_SITE_URL || "https://flashcast.com.my").replace(/\/$/, "");
  if (!supabaseUrl || !anonKey) fail("SUPABASE_URL/VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.");
  if (execute && !publishSecret) fail("CONTENT_PUBLISH_SECRET is required for execution.");

  const restHeaders = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };
  const listUrl = new URL("/rest/v1/service_areas", supabaseUrl);
  listUrl.searchParams.set("status", "eq.published");
  listUrl.searchParams.set("select", serviceAreaFields.join(","));
  listUrl.searchParams.set("order", "sort_order.asc");
  const allRows = await fetchJson(listUrl, { headers: restHeaders });
  const riskyRows = allRows.filter(containsUnsafeFaq);

  if (!target) {
    const scan = {
      ok: true,
      checkedAt: new Date().toISOString(),
      publishedCount: allRows.length,
      pendingCount: riskyRows.length,
      pendingSlugs: riskyRows.map((row) => row.slug),
    };
    writeJson(path.join(artifactRoot, "scan.json"), scan);
    console.log(JSON.stringify(scan, null, 2));
    return;
  }

  const current = allRows.find((row) => row.slug === target);
  if (!current) fail(`Published service area '${target}' was not found.`);
  if (!rollbackFrom && !containsUnsafeFaq(current)) fail(`Service area '${target}' has no recognized pending trust FAQ.`);

  const outputDir = path.join(artifactRoot, target);
  const runDir = path.join(outputDir, new Date().toISOString().replace(/[:.]/g, "-"));
  const backup = {
    target,
    contentType: "service_area",
    table: "service_areas",
    keyField: "slug",
    key: target,
    capturedAt: new Date().toISOString(),
    record: current,
  };
  writeJson(path.join(runDir, "backup.json"), backup);

  let desired;
  let operation = "replace-unsafe-faqs";
  if (rollbackFrom) {
    const rollback = JSON.parse(fs.readFileSync(path.resolve(rollbackFrom), "utf8"));
    if (rollback.target !== target || rollback.key !== target || !rollback.record) fail("Rollback backup does not match the selected target.");
    desired = rollback.record;
    operation = "rollback";
  } else {
    desired = { ...current, ...buildSafeFaqs(current), status: "published" };
  }
  writeJson(path.join(runDir, "desired.json"), { target, operation, record: desired });

  const postContentPublish = async (body) => fetchJson(
    `${supabaseUrl.replace(/\/$/, "")}/functions/v1/content-publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-cron-secret": publishSecret },
      body: JSON.stringify(body),
    },
  );
  const source = `service-area-content-20260822:${target}:${operation}`;
  const dryRun = await postContentPublish({
    contentType: "service_area",
    mode: "dry-run",
    nextStatus: "published",
    expectedUpdatedAt: current.updated_at || null,
    record: desired,
    source,
  });
  writeJson(path.join(runDir, "dry-run.json"), dryRun);

  const backupPath = path.join(runDir, "backup.json");
  const rollbackCommand = `npm run content:service-area-publish -- --target=${target} --execute --approval-id=${approvalId || "OWNER-STANDING-WEBSITE-CONTENT-2026-08-14"} --rollback-from=${backupPath} --env-dir=${envDir}`;
  writeText(
    path.join(runDir, "CHANGELOG.md"),
    `# ${target} service-area content change\n\n- Operation: ${operation}\n- Bilingual pair: /en/locations/${target}, /zh/locations/${target}\n- Changed fields: faqs_en, faqs_zh\n- Backup: \`backup.json\`\n- Dry run: \`dry-run.json\`\n- Rollback command: \`${rollbackCommand}\`\n`,
  );

  if (!execute) {
    console.log(JSON.stringify({ ok: true, mode: "dry-run", target, runDir, dryRun }, null, 2));
    return;
  }

  const published = await postContentPublish({
    contentType: "service_area",
    mode: "publish",
    nextStatus: "published",
    expectedUpdatedAt: current.updated_at || null,
    ownerApproved: true,
    explicitExecution: true,
    approvalId,
    record: desired,
    source,
  });

  const singleUrl = new URL("/rest/v1/service_areas", supabaseUrl);
  singleUrl.searchParams.set("slug", `eq.${target}`);
  singleUrl.searchParams.set("select", serviceAreaFields.join(","));
  singleUrl.searchParams.set("limit", "1");
  const postRecord = (await fetchJson(singleUrl, { headers: restHeaders }))[0];
  const rowMismatches = ["faqs_en", "faqs_zh", "status"].filter((field) => !valuesMatch(postRecord?.[field], desired[field]));
  const expectedFaqs = buildSafeFaqs(current);
  const pageChecks = [];
  for (const page of [
    { path: `/en/locations/${target}`, expected: expectedFaqs.faqs_en[0].q },
    { path: `/zh/locations/${target}`, expected: expectedFaqs.faqs_zh[0].q },
  ]) {
    let last = { path: page.path, status: 0, expected: page.expected, found: false, forbiddenFound: [] };
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${publicSiteUrl}${page.path}?content_audit=${Date.now()}`, { headers: { "cache-control": "no-cache" } });
      const html = await response.text();
      const forbiddenFound = unsafePhrases.filter((phrase) => html.includes(phrase));
      last = { path: page.path, status: response.status, expected: page.expected, found: html.includes(page.expected), forbiddenFound };
      if (last.status === 200 && last.found && forbiddenFound.length === 0) break;
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
    pageChecks.push(last);
  }

  const postcheck = {
    ok: rowMismatches.length === 0 && pageChecks.every((check) => check.status === 200 && check.found && check.forbiddenFound.length === 0),
    checkedAt: new Date().toISOString(),
    rowMismatches,
    pageChecks,
  };
  writeJson(path.join(runDir, "postcheck.json"), postcheck);

  if (!postcheck.ok && operation !== "rollback") {
    const rollbackResult = await postContentPublish({
      contentType: "service_area",
      mode: "publish",
      nextStatus: String(backup.record.status || "published"),
      expectedUpdatedAt: postRecord?.updated_at || published.saved_updated_at || null,
      ownerApproved: true,
      explicitExecution: true,
      approvalId,
      record: backup.record,
      source: `${source}:automatic-rollback`,
    });
    writeJson(path.join(runDir, "publish-receipt.json"), { ok: false, target, operation, published, postcheck, automaticRollback: rollbackResult });
    fail(`Post-publish verification failed for ${target}; the previous content was restored automatically.`);
  }

  const receipt = {
    ok: postcheck.ok,
    target,
    operation,
    approvalId,
    publishedAt: new Date().toISOString(),
    published,
    postcheck,
    rollbackCommand,
  };
  writeJson(path.join(runDir, "publish-receipt.json"), receipt);
  console.log(JSON.stringify({ ok: true, mode: "publish", target, runDir, receipt }, null, 2));
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
