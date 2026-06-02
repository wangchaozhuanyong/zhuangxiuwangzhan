import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const truncate = (value, max = 1000) => {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const loadDotEnv = (root = process.cwd(), file = ".env") => {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return;
  for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=");
  }
};

const safeMetadata = (metadata = {}) => {
  const text = JSON.stringify(metadata);
  if (text.length > 4000) return { truncated: truncate(text, 4000) };
  return JSON.parse(text);
};

export async function logSystemHealthEvent(event, root = process.cwd()) {
  if (process.env.DISABLE_SYSTEM_HEALTH_LOG === "1") return;
  loadDotEnv(root);

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return;

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { error } = await supabase.from("system_event_logs").insert({
      event_type: event.event_type,
      severity: event.severity || "info",
      source: "ops",
      message: truncate(event.message, 1000),
      metadata: safeMetadata(event.metadata || {}),
      actor_id: null,
    });
    if (error) throw error;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[system-health-events] skipped log write: ${message}`);
  }
}
