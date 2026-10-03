import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const BUCKET = "flashcast-recovery-backups";
const CONFIG_PATHS = new Set(["", "/domains/managed", "/domains/custom", "/lifecycle", "/lock"]);

// Bucket-scoped R2 tokens use S3. Configuration checks use a separate read-only token.
// Signing stays in the official AWS CLI already installed on the hosted runner.
export function scopedR2Request(root, env, { execute = spawnSync, request = fetch } = {}) {
  const account = env.CLOUDFLARE_ACCOUNT_ID;
  if (account !== "a7e061557092f924beb4a7c8adc39c3d" || !env.R2_CONFIG_READ_TOKEN
    || !env.R2_BACKUP_ACCESS_KEY_ID || !env.R2_BACKUP_SECRET_ACCESS_KEY) {
    throw new Error("Dedicated backup bucket credentials are required.");
  }
  const prefix = `/client/v4/accounts/${account}/r2/buckets/${BUCKET}`;
  return async (url, options = {}) => {
    const target = new URL(url);
    if (target.origin !== "https://api.cloudflare.com" || !target.pathname.startsWith(prefix)
      || target.search || target.hash) throw new Error("R2 requests are restricted to this project's backup bucket.");
    const suffix = target.pathname.slice(prefix.length);
    const method = options.method || "GET";
    if (CONFIG_PATHS.has(suffix) && method === "GET") {
      return request(url, { method: "GET", redirect: "error", signal: options.signal,
        headers: { Authorization: `Bearer ${env.R2_CONFIG_READ_TOKEN}` } });
    }
    const key = decodeURIComponent(suffix.replace(/^\/objects\//, ""));
    if (!suffix.startsWith("/objects/") || !/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\/(recovery\.fcbackup|manifest\.json)$/.test(key)
      || !["GET", "PUT"].includes(method)) throw new Error("Only dated encrypted backup objects may be transferred.");
    if (method === "PUT" && options.headers?.["If-None-Match"] !== "*") {
      throw new Error("Backup uploads must preserve any existing object.");
    }
    const base = path.join(root, ".release/r2-s3-transfer-readback");
    fs.mkdirSync(base, { recursive: true, mode: 0o700 });
    const temporary = fs.mkdtempSync(path.join(base, "transfer-"));
    const file = path.join(temporary, "encrypted-object");
    try {
      const cliEnv = { ...process.env, AWS_ACCESS_KEY_ID: env.R2_BACKUP_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: env.R2_BACKUP_SECRET_ACCESS_KEY, AWS_EC2_METADATA_DISABLED: "true",
        AWS_CONFIG_FILE: "/dev/null", AWS_SHARED_CREDENTIALS_FILE: "/dev/null", AWS_PAGER: "",
        AWS_REQUEST_CHECKSUM_CALCULATION: "WHEN_REQUIRED", AWS_RESPONSE_CHECKSUM_VALIDATION: "WHEN_REQUIRED" };
      for (const key of ["AWS_PROFILE", "AWS_DEFAULT_PROFILE", "AWS_SESSION_TOKEN", "AWS_SECURITY_TOKEN"]) delete cliEnv[key];
      const args = ["s3api", method === "GET" ? "get-object" : "put-object", "--bucket", BUCKET, "--key", key,
        "--endpoint-url", `https://${account}.r2.cloudflarestorage.com`, "--region", "auto", "--no-cli-pager"];
      if (method === "GET") args.push(file);
      else {
        fs.writeFileSync(file, Buffer.from(options.body), { mode: 0o600, flag: "wx" });
        args.push("--body", file, "--content-type", options.headers?.["Content-Type"] || "application/octet-stream", "--if-none-match", "*");
      }
      const result = execute("aws", args, { cwd: root, env: cliEnv, encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"], timeout: 120000 });
      if (result.status !== 0) {
        if (method === "GET" && /\(NoSuchKey\)/.test(result.stderr || "")) return new Response("Missing object", { status: 404 });
        throw new Error("Official S3 backup transfer failed; private output withheld.");
      }
      if (method === "PUT") return Response.json({ success: true, result: { key } });
      if (!fs.existsSync(file)) throw new Error("S3 client did not save the downloaded backup object.");
      return new Response(fs.readFileSync(file));
    } finally {
      fs.rmSync(temporary, { recursive: true, force: true });
    }
  };
}
