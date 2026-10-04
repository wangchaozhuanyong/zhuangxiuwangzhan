import { spawnSync } from "node:child_process";
import { loadProjectEnv } from "./lib/project-env.mjs";

const [mode, separator, command, ...args] = process.argv.slice(2);
if (separator !== "--" || !command) throw new Error("Usage: node scripts/run-with-env.mjs <mode> -- <command> [arguments]");
loadProjectEnv({ mode });
const result = spawnSync(command, args, { env: process.env, stdio: "inherit", shell: false });
process.exit(result.status ?? 1);
