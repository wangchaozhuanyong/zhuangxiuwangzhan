import { createCipheriv, createDecipheriv, randomBytes, scryptSync, createHash } from "node:crypto";

const MAGIC = Buffer.from("FCBK0001");
export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

// The existing private database password unlocks the archive. No key is saved beside it.
export function encryptBackup(bytes, password) {
  if (!password || password.length < 8) throw new Error("A private backup password is required.");
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(password, salt, 32);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(MAGIC);
  const encrypted = Buffer.concat([cipher.update(bytes), cipher.final()]);
  key.fill(0);
  return Buffer.concat([MAGIC, salt, iv, cipher.getAuthTag(), encrypted]);
}

export function decryptBackup(bytes, password) {
  if (bytes.length < 53 || !bytes.subarray(0, 8).equals(MAGIC)) throw new Error("Invalid encrypted backup.");
  const key = scryptSync(password || "", bytes.subarray(8, 24), 32);
  const cipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(24, 36));
  cipher.setAAD(MAGIC);
  cipher.setAuthTag(bytes.subarray(36, 52));
  try { return Buffer.concat([cipher.update(bytes.subarray(52)), cipher.final()]); }
  catch { throw new Error("Backup authentication failed. Nothing was restored."); }
  finally { key.fill(0); }
}

export function assertLocalRestoreContainer(name) {
  if (!/^supabase_db_flashcast-full-restore-\d{8}$/.test(name)) {
    throw new Error("Restore is restricted to the dedicated local FLASH CAST rehearsal container.");
  }
}

export function assertArchivePath(value) {
  if (typeof value !== "string" || !value || value.startsWith("/") || value.includes("\\")
    || value.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error("Invalid backup object path.");
  }
  return value;
}
