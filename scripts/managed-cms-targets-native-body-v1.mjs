// Backend-only frozen producer inputs; never imported by the public application.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const root = process.cwd(); // Same repository-root working-directory contract as the existing publisher CLI.
const read = (relative, expected) => {
  if (!/^(drafts\/seo\/fc-20260927-cms-native-admission-contract-v1\/|backups\/fc-20260927-cms-native-admission-contract-v1\/)/.test(relative)
      || relative.includes("..")) throw new Error("Frozen producer path is outside its task package.");
  const bytes = readFileSync(resolve(root, relative));
  if (createHash("sha256").update(bytes).digest("hex") !== expected) throw new Error("Frozen producer source hash differs.");
  return JSON.parse(bytes.toString("utf8"));
};
const index = JSON.parse(readFileSync(resolve(root, "drafts/seo/fc-20260927-cms-native-admission-contract-v1/binding-index.json"), "utf8"));
export const lockedNativeBodyCandidates = Object.freeze(Object.fromEntries(Object.entries(index).map(([name, binding]) => {
  const source = read(binding.sourceCandidatePath, binding.sourceCandidateSha256);
  read(binding.rollbackRecordPath, binding.rollbackRecordSha256);
  read(binding.rollbackPackagePath, binding.rollbackPackageSha256);
  if (source.task_id !== binding.taskId || source.candidate_version !== binding.candidateVersion) {
    throw new Error("Frozen producer task or candidate identity differs.");
  }
  return [name, Object.freeze({ ...binding, desiredFields: source[binding.desiredFieldsSourceKey] })];
})));
