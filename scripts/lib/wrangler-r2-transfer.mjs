import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const BUCKET = "flashcast-recovery-backups";

// Authentication remains inside the official CLI. Never read its credential files.
export function wranglerR2Request(root, account, { execute = spawnSync } = {}) {
  const cli = path.join(root, "node_modules/wrangler/bin/wrangler.js");
  const base = path.join(root, ".release/r2-transfer-readback");
  const command = (args) => {
    const env = { ...process.env, CLOUDFLARE_ACCOUNT_ID: account, WRANGLER_SEND_METRICS: "false", NO_COLOR: "1", CI: "true" };
    for (const key of ["CLOUDFLARE_API_TOKEN", "CF_API_TOKEN", "CLOUDFLARE_API_KEY", "CF_API_KEY", "CLOUDFLARE_EMAIL", "CF_EMAIL"]) delete env[key];
    const result = execute(process.execPath, [cli, ...args], {
      cwd: root, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 120000,
    });
    return { ok: result.status === 0, output: `${result.stdout || ""}\n${result.stderr || ""}` };
  };
  const checked = (args) => {
    const result = command(args);
    if (!result.ok) throw new Error("Official Wrangler R2 command failed; private output withheld.");
    return result.output;
  };
  const json = (result) => Response.json({ success: true, result });
  return async (url, options = {}) => {
    const prefix = `/client/v4/accounts/${account}/r2/buckets/${BUCKET}`;
    const target = new URL(url);
    if (target.origin !== "https://api.cloudflare.com" || !target.pathname.startsWith(prefix)
      || target.search || target.hash) throw new Error("Wrangler transfer is restricted to this project's backup bucket.");
    const suffix = target.pathname.slice(prefix.length);
    const method = options.method || "GET";
    if (suffix === "" && method === "GET") {
      let info;
      try { info = JSON.parse(checked(["r2", "bucket", "info", BUCKET, "--json"]).trim()); }
      catch { throw new Error("Unable to verify the backup bucket through the official CLI."); }
      if (info.name !== BUCKET) throw new Error("Wrangler returned another bucket.");
      return json({ name: info.name });
    }
    if (suffix === "/domains/managed" && method === "GET") {
      const output = checked(["r2", "bucket", "dev-url", "get", BUCKET]);
      if (!output.includes("Public access via the r2.dev URL is disabled.")) {
        throw new Error("Wrangler did not confirm disabled public access.");
      }
      return json({ enabled: false });
    }
    if (suffix === "/domains/custom" && method === "GET") {
      const output = checked(["r2", "bucket", "domain", "list", BUCKET]);
      if (!output.includes("There are no custom domains connected to this bucket.")) {
        throw new Error("Wrangler did not confirm the absence of custom domains.");
      }
      return json({ domains: [] });
    }
    if (suffix === "/lifecycle" && method === "GET") {
      const output = checked(["r2", "bucket", "lifecycle", "list", BUCKET]);
      if (output.includes(`There are no lifecycle rules for bucket '${BUCKET}'.`)) return json({ rules: [] });
      const blocks = [...output.matchAll(/^name:\s*(.+)\nenabled:\s*(Yes|No)\nprefix:\s*(.+)\naction:\s*(.+)$/gm)];
      if (!blocks.length || blocks.length !== (output.match(/^name:/gm) || []).length) throw new Error("Unable to parse bucket lifecycle rules.");
      const rules = blocks.map(([, id, enabled, prefix, action]) => {
        const expiration = action.match(/Expire objects after (\d+(?:\.\d+)?) days/);
        if (action.includes("Expire objects") && !expiration) throw new Error("Unsupported expiration rule.");
        return { id: id.trim(), enabled: enabled === "Yes", conditions: { prefix: prefix.trim() === "(all prefixes)" ? "" : prefix.trim() },
          ...(expiration ? { deleteObjectsTransition: { condition: { type: "Age", maxAge: Number(expiration[1]) * 86400 } } } : {}) };
      });
      return json({ rules });
    }
    if (suffix === "/lock" && method === "GET") {
      const output = checked(["r2", "bucket", "lock", "list", BUCKET]);
      if (!output.includes(`There are no lock rules for bucket '${BUCKET}'.`)) throw new Error("Backup retention locks must be reviewed before cleanup.");
      return json({ rules: [] });
    }
    const key = decodeURIComponent(suffix.replace(/^\/objects\//, ""));
    if (!suffix.startsWith("/objects/") || !/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\/(recovery\.fcbackup|manifest\.json)$/.test(key)
      || !["GET", "PUT"].includes(method)) throw new Error("Only dated encrypted backup objects may be transferred.");
    fs.mkdirSync(base, { recursive: true, mode: 0o700 });
    const temporary = fs.mkdtempSync(path.join(base, "readback-"));
    const downloaded = path.join(temporary, "object");
    try {
      const existing = command(["r2", "object", "get", `${BUCKET}/${key}`, "--remote", "--file", downloaded]);
      if (existing.ok) {
        if (method === "PUT") return new Response("Object appeared during preflight; it was preserved.", { status: 412 });
        if (!fs.existsSync(downloaded)) throw new Error("Wrangler did not save the downloaded object.");
        return new Response(fs.readFileSync(downloaded));
      }
      if (!/\[code: 10007\]|object does not exist|object not found|404 Not Found/i.test(existing.output)) {
        throw new Error("Wrangler object lookup failed; private output withheld.");
      }
      if (method === "GET") return new Response("Missing object", { status: 404 });
      const upload = path.join(temporary, "encrypted-object");
      fs.writeFileSync(upload, Buffer.from(options.body), { mode: 0o600 });
      checked(["r2", "object", "put", `${BUCKET}/${key}`, "--remote", "--file", upload,
        "--content-type", options.headers?.["Content-Type"] || "application/octet-stream"]);
      return json({ key });
    } finally {
      // Only this invocation's encrypted transfer files are removed, never backups.
      fs.rmSync(temporary, { recursive: true, force: true });
    }
  };
}
