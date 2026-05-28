import { spawn } from "node:child_process";

const url = process.env.PREVIEW_URL || "http://127.0.0.1:4191";
const port = Number(new URL(url).port || "4191");

const startPreview = () => {
  const args = ["run", "preview", "--", "--host", "127.0.0.1", "--port", String(port), "--strictPort"];
  const child = spawn("npm.cmd", args, { stdio: "inherit", shell: true });
  return child;
};

const isHealthy = async () => {
  try {
    const res = await fetch(url, { method: "GET" });
    return Boolean(res.ok);
  } catch {
    return false;
  }
};

const waitForHealthy = async (timeoutMs = 30_000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isHealthy()) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Preview server did not become ready at ${url} within ${timeoutMs}ms`);
};

const runVerify = async () => {
  const child = spawn("node", ["scripts/verify-preview.mjs"], {
    stdio: "inherit",
    env: { ...process.env, PREVIEW_URL: url },
    shell: true,
  });
  const exitCode = await new Promise((resolve) => child.on("exit", resolve));
  if (exitCode !== 0) {
    throw new Error(`verify-preview failed with exit code ${exitCode}`);
  }
};

// If a preview server is already running (eg. started manually), reuse it and do not kill it.
if (await isHealthy()) {
  await runVerify();
  process.exit(0);
}

const preview = startPreview();
let startedByScript = true;
preview.on("exit", () => {
  startedByScript = false;
});

try {
  await waitForHealthy();
  await runVerify();
} finally {
  if (startedByScript) preview.kill();
}

