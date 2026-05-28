import { spawn } from "node:child_process";

const url = process.env.PREVIEW_URL || "http://127.0.0.1:4191";

const startPreview = () => {
  const args = ["run", "preview", "--", "--host", "127.0.0.1", "--port", "4191", "--strictPort"];
  const child = spawn("npm.cmd", args, { stdio: "inherit", shell: true });
  return child;
};

const waitForHealthy = async (timeoutMs = 30_000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.ok) return;
    } catch {
      // ignore
    }
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

const preview = startPreview();
try {
  await waitForHealthy();
  await runVerify();
} finally {
  preview.kill();
}

