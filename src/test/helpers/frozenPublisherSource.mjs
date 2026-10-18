// Historical publisher tests execute exact frozen bytes in an owned local fixture.
// This helper never changes the real publisher, its guards, or its reviewed proof.
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, lstatSync, realpathSync, rmSync, symlinkSync, existsSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { isMainThread } from "node:worker_threads";
import { gunzipSync } from "node:zlib";
import { targetConfigs } from "../../../scripts/publish-content-trust-fixes.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
// Historical approvals are tested against their pinned pre-repair source,
// never against new runtime code or by changing an approved proof hash.
const baselineCommit = "d33175ae32a9a857ddc0744b5f1bd7cf0a54b1ec";
let baselineSources;
export function readFrozenPublisherBaselineSource(file) {
  assert(typeof file === "string" && !file.startsWith("/") && !file.includes("..") && !file.split("/").some(part => part.startsWith(".env")), "Only explicit non-credential source paths are allowed");
  if (!baselineSources) {
    const archive = readFileSync(join(projectRoot, "src/test/fixtures/frozen-publisher-baseline-d33175ae.json.gz"));
    assert(hash(archive) === "8a373576d5a27f7e88ee59cf59d037f2dbb644a51953a7aa8f6dfa5181534873", "The historical source archive must remain unchanged");
    baselineSources = JSON.parse(gunzipSync(archive));
    assert(baselineSources.commit === baselineCommit && Object.keys(baselineSources.files).length === 52, "The pinned 52-source baseline is required");
  }
  assert(Object.hasOwn(baselineSources.files, file), "Only the original historical source closure is allowed");
  const bytes = Buffer.from(baselineSources.files[file]);
  assert(hash(bytes) === baselineSources.sha256[file], "Each archived source must match its pin");
  return bytes;
}
const assert = (value, message) => { if (!value) throw Error(message); };
const historicalMiddlewareSha = "2c4c0e84bf3160ab60ac9e386a1084509158ec63f5ef4f56eefa3ef2928f382b";
const reviewedCurrentMiddlewareSha = "05d0ca998b4ecc2260d02cfd4d5ac01e55ddbac561f96e500ff975dce3d87708";
const middlewarePath = "functions/_middleware.ts";
const readableBodyPath = "functions/readablePublicBody.ts";
const historicalReadableBodySha = "4d67bd215b6e5c050d0be9d8bb562c0efdfaf7ae56fc01610a12323885f61293";
const reviewedCurrentReadableBodySha = "a9297e52fa9f7e892faea23bbd3a22a6d554d814a6091c1741984ddaf9ce27e1";
const displayLabelsPath = "src/i18n/displayLabels.ts";
const historicalDisplayLabelsSha = "af4259387632733ddd96a75c2d5cec7aefc6c876c7c13dc4aa51cb5b2278000a";
const reviewedCurrentDisplayLabelsSha = "49cb866ef8d30edb3562b0b13ec53bc0cda0ef12ee2f78d80b0b1636bbbedd9b";

export function restoreFrozenPublisherMiddleware(bytes, expectedFrozenSha = historicalMiddlewareSha) {
  // Reverse only the exact furniture identity candidate inside this offline fixture.
  // Both endpoints stay pinned; unknown middleware bytes still fail closed below.
  if (hash(bytes) === "8276dc6b6f79975f4318bfdf27e6558882273d7a63401e36bed79c2b7042997d") {
    const reversal = JSON.parse(readFileSync(join(projectRoot, "src/test/fixtures/product316-middleware-reversal.json"), "utf8"));
    assert(reversal.candidate_sha256 === hash(bytes)
      && reversal.parent_sha256 === "4f4227d45137df084b3e80c7f161841ba2e660a0d923ab1b6a6a1fe83b9a2061",
    "Only the exact furniture candidate and its reviewed parent may be reversed");
    let current = bytes.toString("utf8");
    for (const [candidate, reviewed] of reversal.substitutions) {
      assert(current.split(candidate).length === 2, "Only the exact reviewed furniture substitutions may be reversed");
      current = current.replace(candidate, reviewed);
    }
    bytes = Buffer.from(current);
    assert(hash(bytes) === reversal.parent_sha256, "Furniture reversal must equal the exact existing reviewed parent");
  }
  // Admit only this exact summary candidate, then restore the already reviewed baseline bytes.
  if (hash(bytes) === "4f4227d45137df084b3e80c7f161841ba2e660a0d923ab1b6a6a1fe83b9a2061") {
    let current = bytes.toString("utf8");
    const substitutions = [
      [
        "const injectGeoSummary = (html: string, meta: SeoEntry, readableBody = \"\", brandLine: string | null = null, dynamicRouteState?: Pick<DynamicRouteState, \"kind\" | \"row\"> | null) => {",
        "const injectGeoSummary = (html: string, meta: SeoEntry, readableBody = \"\", brandLine: string | null = null) => {"
      ],
      [
        "  const kitchenRow = /^\\/(en|zh)\\/services\\/kitchen$/.test(publicKey)\n    && dynamicRouteState?.kind === \"service\"\n    && dynamicRouteState.row.slug === \"kitchen\" && dynamicRouteState.row.status === \"published\"\n    ? dynamicRouteState.row : null;\n  const title = escapeHtml(categoryCopy?.h1 || (kitchenRow && readString(kitchenRow, `title_${meta.lang}`).trim()) || meta.title);\n  const description = escapeHtml(categoryCopy?.intro || (kitchenRow && readString(kitchenRow, `excerpt_${meta.lang}`).trim()) || meta.description);",
        "  const title = escapeHtml(categoryCopy?.h1 || meta.title);\n  const description = escapeHtml(categoryCopy?.intro || meta.description);"
      ],
      [
        "const injectSeo = (html: string, meta: SeoEntry, siteSettings?: SiteSettingsHead | null, readableBody = \"\", dynamicRouteState?: Pick<DynamicRouteState, \"kind\" | \"row\"> | null) => {",
        "const injectSeo = (html: string, meta: SeoEntry, siteSettings?: SiteSettingsHead | null, readableBody = \"\") => {"
      ],
      [
        "  out = injectGeoSummary(out, safeMeta, readableBody, getChineseBrandLine(siteSettings, meta.lang), dynamicRouteState);",
        "  out = injectGeoSummary(out, safeMeta, readableBody, getChineseBrandLine(siteSettings, meta.lang));"
      ],
      [
        "  let transformed = meta ? injectSeo(html, meta, siteSettings, readableBody, dynamicRouteState) : injectNoIndexNotFound(html, siteSettings, key);",
        "  let transformed = meta ? injectSeo(html, meta, siteSettings, readableBody) : injectNoIndexNotFound(html, siteSettings, key);"
      ]
    ];
    for (const [candidate, reviewed] of substitutions) {
      assert(current.split(candidate).length === 2, "Only the five reviewed kitchen summary substitutions may be reversed");
      current = current.replace(candidate, reviewed);
    }
    bytes = Buffer.from(current);
    assert(hash(bytes) === reviewedCurrentMiddlewareSha, "Summary reversal must equal the exact existing reviewed baseline");
  }
  assert(expectedFrozenSha === historicalMiddlewareSha && hash(bytes) === reviewedCurrentMiddlewareSha,
    "Historical publisher fixture only admits the exact reviewed current middleware bytes");
  const current = bytes.toString("utf8"), start = current.indexOf("type SiteSettingsHead = {"), end = current.indexOf("\n};", start);
  assert(start >= 0 && end > start, "Exact reviewed settings type is required");
  let scope = current.slice(start, end);
  for (const line of ["  id?: string | null;\n", "  phone_display?: string | null;\n", "  whatsapp_number?: string | null;\n"]) {
    assert(scope.split(line).length === 2, "Only the three reviewed public type additions may be reversed");
    scope = scope.replace(line, "");
  }
  const selected = "select=id,company_name,brand_name,logo_url,favicon_url,og_image_url,phone_e164,phone_display,whatsapp_number,email,address_en,address_zh,map_latitude,map_longitude,facebook_url,instagram_url,tiktok_url,xiaohongshu_url,updated_at&id=eq.default&limit=1";
  const historical = "select=company_name,brand_name,logo_url,favicon_url,og_image_url,phone_e164,email,address_en,address_zh,map_latitude,map_longitude,facebook_url,instagram_url,tiktok_url,xiaohongshu_url,updated_at&id=eq.default&limit=1";
  let restored = current.slice(0, start) + scope + current.slice(end);
  assert(restored.split(selected).length === 2, "Only the exact reviewed REST projection may be reversed");
  restored = Buffer.from(restored.replace(selected, historical));
  assert(hash(restored) === expectedFrozenSha, "Restored historical middleware must equal the existing frozen proof hash");
  return restored;
}

export function restoreFrozenPublisherReadableBody(bytes, expectedHistoricalSha) {
  assert(expectedHistoricalSha === historicalReadableBodySha && hash(bytes) === reviewedCurrentReadableBodySha,
    "Historical publisher fixture only admits the exact reviewed current readable body bytes");
  const current = bytes.toString("utf8");
  const reviewed = '"/services/builtin", "/services/kitchen", "/services/renovation",';
  assert(current.split(reviewed).length === 2, "Only the two exact reviewed service path additions may be reversed");
  const restored = Buffer.from(current.replace(reviewed, '"/services/builtin",'));
  assert(hash(restored) === expectedHistoricalSha, "Restored historical readable body must equal the existing frozen proof hash");
  return restored;
}

export function restoreFrozenPublisherDisplayLabels(bytes, expectedHistoricalSha) {
  assert(expectedHistoricalSha === historicalDisplayLabelsSha && hash(bytes) === reviewedCurrentDisplayLabelsSha,
    "Historical publisher fixture only admits the exact reviewed current display label bytes");
  const reviewedAddition = [
    '  "mont-kiara-luxury-condo-renovation": {',
    '    scope: {',
    '      "Living and dining layout concept": "客餐厅布局概念",',
    '      "Feature-wall direction": "背景墙设计方向",',
    '      "Built-in storage planning": "定制收纳规划",',
    '      "Lighting concept": "灯光设计概念",',
    '    },',
    '  },',
    '',
  ].join("\n");
  const current = bytes.toString("utf8");
  assert(current.split(reviewedAddition).length === 2, "Only the four exact reviewed concept label additions may be reversed");
  const restored = Buffer.from(current.replace(reviewedAddition, ""));
  assert(hash(restored) === expectedHistoricalSha, "Restored historical display labels must equal the existing frozen proof hash");
  return restored;
}

export function createFrozenPublisherSourceFixture() {
  const sourcePath = file => {
    assert(typeof file === "string" && !file.startsWith("/") && !file.split(/[\\/]/).includes(".."), "Only explicit project paths are allowed");
    const absolute = resolve(projectRoot, file);
    assert(absolute.startsWith(projectRoot + sep) && !file.split(/[\\/]/).some(part => part.startsWith(".env")), "Credentials cannot enter a test fixture");
    return absolute;
  };
  const readPinnedJson = (file, expected) => {
    const bytes = readFileSync(sourcePath(file));
    assert(hash(bytes) === expected, "Original frozen publisher evidence must remain unchanged");
    return JSON.parse(bytes);
  };
  const eightPath = "drafts/publishing/fc-20261010-remainder8-after-38037667102-v1/registry.json";
  const ninePath = "drafts/publishing/fc-20261009-remainder9-after-37903094390-v1/registry.json";
  const originalPath = "drafts/publishing/fc-20261009-remaining-completion-v1/registry.json";
  const eight = readPinnedJson(eightPath, "3a24f1dcabcb53ad61af0c5503be9317d593ffb06db69b8243a5217e0392b6c4");
  const nine = readPinnedJson(ninePath, "d9c7dec224d23bd82ee62937b4a19ab563c40681e7f6605ae685f6f58c611475");
  const original = readPinnedJson(originalPath, "8dec1fa819f93602470e4cf236973431261b26330309b43469660f43689a82eb");
  const proof = readPinnedJson(eight.completedProofPath, eight.completedProofSha256);
  const previous = readPinnedJson(nine.completedProofPath, nine.completedProofSha256);
  const review = readPinnedJson(previous.rendererReviewPath, previous.rendererReviewSha256);
  const pins = {};
  for (const set of [proof.sourceRendererSha256, proof.reviewedPipelineSourceSha256, proof.metadataSourceSha256, proof.nativeRevisionSourceSha256]) {
    for (const [file, digest] of Object.entries(set)) {
      assert(!pins[file] || pins[file] === digest, "Historical source closures cannot disagree"); pins[file] = digest;
    }
  }
  assert(Object.keys(pins).length === 52 && Object.keys(proof.metadataSourceSha256).length === 42
    && pins[middlewarePath] === historicalMiddlewareSha, "The exact historical 52-source closure is required");
  const parent = join(projectRoot, "tmp"); mkdirSync(parent, { recursive: true });
  assert(realpathSync(parent) === parent, "Test output must stay inside this project");
  const root = mkdtempSync(join(parent, "frozen-publisher-source-"));
  const owner = randomUUID(), identity = lstatSync(root), marker = join(root, ".owned-fixture");
  writeFileSync(marker, owner, { flag: "wx", mode: 0o600 });
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    const current = lstatSync(root);
    assert(dirname(root) === parent && current.isDirectory() && !current.isSymbolicLink() && current.ino === identity.ino
      && current.dev === identity.dev && readFileSync(marker, "utf8") === owner, "Only this owned synthetic fixture may be removed");
    rmSync(root, { recursive: true, force: false }); disposed = true;
  };
  const write = (file, bytes) => {
    const target = join(root, file); mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, bytes, { flag: "wx", mode: 0o600 });
  };
  try {
    for (const [file, digest] of Object.entries(pins)) {
      const restore = current => file === middlewarePath ? restoreFrozenPublisherMiddleware(current, digest)
        : file === readableBodyPath ? restoreFrozenPublisherReadableBody(current, digest)
        : file === displayLabelsPath ? restoreFrozenPublisherDisplayLabels(current, digest) : current;
      let bytes;
      try { bytes = restore(readFileSync(sourcePath(file))); } catch { /* A new runtime is outside the historical approval. */ }
      if (!bytes || hash(bytes) !== digest) bytes = restore(readFrozenPublisherBaselineSource(file));
      assert(hash(bytes) === digest, "Every historical source byte must match its unchanged proof"); write(file, bytes);
    }
    const evidence = new Set([eightPath, ninePath, originalPath, eight.completedProofPath, nine.completedProofPath,
      previous.rendererReviewPath, review.originalCompletedProofPath, original.primarySourceProof.path,
      ...original.sourceQaReceipts.map(item => item.path), ...original.entries.map(entry => entry.sourceCandidatePath)]);
    const nativeIndexPath = "drafts/seo/fc-20260927-cms-native-admission-contract-v1/binding-index.json";
    const nativeIndex = JSON.parse(readFileSync(sourcePath(nativeIndexPath)));
    evidence.add(nativeIndexPath);
    for (const binding of Object.values(nativeIndex)) {
      for (const key of ["sourceCandidate", "rollbackRecord", "rollbackPackage"]) {
        readPinnedJson(binding[key + "Path"], binding[key + "Sha256"]);
        evidence.add(binding[key + "Path"]);
      }
    }
    // Target modules load only their explicitly bound public candidates at import.
    for (const config of Object.values(targetConfigs)) {
      const file = config.lockedCandidate?.sourceCandidatePath;
      if (file && existsSync(sourcePath(file))) evidence.add(file);
    }
    for (const entry of original.entries.slice(11)) evidence.add(targetConfigs[entry.target].lockedCandidate.rollbackRecordPath);
    for (const file of evidence) {
      assert(typeof file === "string" && /^(?:drafts|backups)\/.+\.json$/.test(file), "Only designated public publisher JSON dependencies may be copied");
      write(file, readFileSync(sourcePath(file)));
    }
    // Its unchanged fileURL root must resolve to the historical physical sources.
    // Registry readers stay the real project modules and read this fixture cwd.
    const metadataHelper = "scripts/lib/publisher-reviewed-metadata.mjs";
    write(metadataHelper, readFileSync(sourcePath(metadataHelper)));
    // No environment files or credentials are linked or copied.
    symlinkSync(join(projectRoot, "node_modules"), join(root, "node_modules"), "dir");
    write("package.json", Buffer.from('{"type":"module"}\n'));
    const withCwd = callback => {
      assert(isMainThread, "Historical registry fixtures require the project's isolated Vitest fork pool");
      const previousCwd = process.cwd();
      try {
        process.chdir(root); const value = callback();
        assert(!value || typeof value.then !== "function", "The fixture cwd wrapper only permits synchronous registry guards");
        return value;
      } finally {
        process.chdir(previousCwd); assert(process.cwd() === previousCwd, "Fixture cwd must always be restored");
      }
    };
    return { root, projectRoot, withCwd, dispose, sourceSha256: pins, historicalMiddlewareSha, reviewedCurrentMiddlewareSha,
      readRegistry: reader => { try { return withCwd(reader); } catch (error) { dispose(); throw error; } } };
  } catch (error) { dispose(); throw error; }
}
