import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1)];
    }),
);

const url = env.VITE_SUPABASE_URL;
const anon = env.VITE_SUPABASE_ANON_KEY;
const startedAt = Date.now() - 5000;

async function probe(name, fn) {
  try {
    const result = await fn();
    console.log(`[ok] ${name}`, JSON.stringify(result));
  } catch (error) {
    console.log(`[fail] ${name}`, error?.message || error);
  }
}

await probe("anon insert leads (should fail after migration)", async () => {
  const res = await fetch(`${url}/rest/v1/leads`, {
    method: "POST",
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      name: "RLS Probe",
      phone: "+60110000999",
      message: "probe",
      status: "new",
      source: "probe",
    }),
  });
  const text = await res.text();
  return { status: res.status, body: text.slice(0, 200) };
});

await probe("submit-lead contact", async () => {
  const res = await fetch(`${url}/functions/v1/submit-lead`, {
    method: "POST",
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "contact",
      name: "Launch Test Contact",
      phone: "+601128853888",
      email: "launch-test@flashcast.com.my",
      message: "Prelaunch integration test contact form.",
      sourcePath: "/zh/contact",
      website: "",
      startedAt,
    }),
  });
  const text = await res.text();
  return { status: res.status, body: text.slice(0, 300) };
});

await probe("form_submission_attempts table", async () => {
  const res = await fetch(`${url}/rest/v1/form_submission_attempts?select=id&limit=1`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  });
  const text = await res.text();
  return { status: res.status, body: text.slice(0, 200) };
});
