import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".env"), "utf8")
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1)];
    }),
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const startedAt = Date.now() - 5000;
const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

async function invoke(body) {
  const { data, error } = await supabase.functions.invoke("submit-lead", { body });
  return { data, error: error ? { message: error.message } : null };
}

const contact = await invoke({
  type: "contact",
  name: `Launch Contact ${stamp}`,
  phone: "+601128853888",
  email: "launch-test@flashcast.com.my",
  message: "Prelaunch launch smoke test — contact form integration.",
  sourcePath: "/zh/contact",
  website: "",
  startedAt,
});

const quote = await invoke({
  type: "quote",
  name: `Launch Quote ${stamp}`,
  phone: "+601128853888",
  email: "launch-test@flashcast.com.my",
  projectType: "Kitchen",
  location: "Kuala Lumpur",
  propertySize: "900 sqft",
  budget: "RM 80,000",
  details: "Prelaunch launch smoke test — quote form integration.",
  sourcePath: "/zh/quote",
  website: "",
  startedAt,
});

const anonInsert = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/leads`, {
  method: "POST",
  headers: {
    apikey: env.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  },
  body: JSON.stringify({
    name: "Should fail",
    phone: "+60110000002",
    message: "anon probe",
    status: "new",
    source: "probe",
  }),
});

const summary = {
  contact,
  quote,
  anonInsertStatus: anonInsert.status,
  anonInsertBlocked: anonInsert.status === 401 || anonInsert.status === 403,
};

console.log(JSON.stringify(summary, null, 2));

const contactOk = contact.data?.ok && !contact.error;
const quoteOk = quote.data?.ok && !quote.error;
if (!contactOk || !quoteOk || anonInsert.status === 201) process.exit(1);
