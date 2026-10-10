// Historical publisher tests execute exact frozen bytes in an owned local fixture.
// This helper never changes the real publisher, its guards, or its reviewed proof.
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, lstatSync, realpathSync, rmSync, symlinkSync, existsSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { isMainThread } from "node:worker_threads";
import { targetConfigs } from "../../../scripts/publish-content-trust-fixes.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const assert = (value, message) => { if (!value) throw Error(message); };
const historicalMiddlewareSha = "2c4c0e84bf3160ab60ac9e386a1084509158ec63f5ef4f56eefa3ef2928f382b";
const reviewedCurrentMiddlewareSha = "05d0ca998b4ecc2260d02cfd4d5ac01e55ddbac561f96e500ff975dce3d87708";
const middlewarePath = "functions/_middleware.ts";
const readableBodyPath = "functions/readablePublicBody.ts";
const historicalReadableBodySha = "4d67bd215b6e5c050d0be9d8bb562c0efdfaf7ae56fc01610a12323885f61293";
const reviewedCurrentReadableBodySha = "a9297e52fa9f7e892faea23bbd3a22a6d554d814a6091c1741984ddaf9ce27e1";

export function restoreFrozenPublisherMiddleware(bytes, expectedFrozenSha = historicalMiddlewareSha) {
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
      const current = readFileSync(sourcePath(file));
      const bytes = file === middlewarePath ? restoreFrozenPublisherMiddleware(current, digest)
        : file === readableBodyPath ? restoreFrozenPublisherReadableBody(current, digest) : current;
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
