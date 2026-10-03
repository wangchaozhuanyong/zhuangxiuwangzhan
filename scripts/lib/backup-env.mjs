import fs from "node:fs";
import path from "node:path";

export const readEnvFile = (file) => {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(fs.readFileSync(file, "utf8").split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) return [];
    const [, key, raw] = match;
    const value = /^("|')(.*)\1$/.test(raw) ? raw.slice(1, -1) : raw.replace(/\s+#.*$/, "").trim();
    return [[key, value]];
  }));
};

// Cloud backups consume encrypted Actions secrets directly; no .env file is written.
export function readRecoveryEnv(root, { cloud = false, env = process.env } = {}) {
  if (!cloud) return readEnvFile(path.join(root, ".env.production.local"));
  if (env.GITHUB_ACTIONS !== "true" || env.GITHUB_REPOSITORY !== "wangchaozhuanyong/zhuangxiuwangzhan"
    || env.GITHUB_WORKFLOW !== "FLASH CAST cloud encrypted backup" || env.GITHUB_REF !== "refs/heads/main"
    || !["schedule", "workflow_dispatch"].includes(env.GITHUB_EVENT_NAME) || env.APP_ENV !== "production") {
    throw new Error("Cloud backup requires the governed main-branch Actions workflow.");
  }
  const keys = ["APP_ENV", "VITE_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_DB_PASSWORD",
    "SUPABASE_ACCESS_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "R2_CONFIG_READ_TOKEN",
    "R2_BACKUP_ACCESS_KEY_ID", "R2_BACKUP_SECRET_ACCESS_KEY"];
  if (keys.some(key => !env[key])) throw new Error("Cloud backup credentials are incomplete; no backup started.");
  if (!["https://rbsnyexjifounogswrjp.supabase.co", "https://rbsnyexjifounogswrjp.supabase.co/"].includes(env.VITE_SUPABASE_URL)
    || env.CLOUDFLARE_ACCOUNT_ID !== "a7e061557092f924beb4a7c8adc39c3d") {
    throw new Error("Cloud backup credentials belong to another project or account.");
  }
  return Object.fromEntries(keys.map(key => [key, env[key]]));
}
