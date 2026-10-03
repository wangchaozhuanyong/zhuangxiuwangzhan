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

export const requestedEnvMode = (args = process.argv.slice(2)) => {
  const argument = args.find((value) => value.startsWith("--mode="));
  if (argument) return argument.slice(7);
  const index = args.indexOf("--mode");
  return index >= 0 ? args[index + 1] || "" : undefined;
};

export function loadProjectEnv({ root = process.cwd(), mode = requestedEnvMode(), env = process.env } = {}) {
  const inherited = { ...env };
  const base = { ...readEnvFile(path.join(root, ".env")), ...readEnvFile(path.join(root, ".env.local")) };
  const selected = mode ?? inherited.APP_ENV ?? inherited.NODE_ENV ?? base.APP_ENV ?? base.NODE_ENV ?? "";
  if (!["development", "test", "staging", "preview", "production"].includes(selected)) {
    throw new Error("Set APP_ENV, NODE_ENV or --mode to a supported environment explicitly.");
  }
  const files = [".env", ".env.local", `.env.${selected}`, `.env.${selected}.local`];
  const values = Object.assign({}, ...files.map((file) => readEnvFile(path.join(root, file))), inherited);
  if (mode !== undefined) values.APP_ENV = selected;
  for (const [key, value] of Object.entries(values)) env[key] = value;
  return { mode: selected, files: files.filter((file) => fs.existsSync(path.join(root, file))) };
}
