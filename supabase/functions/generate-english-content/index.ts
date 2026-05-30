import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const allowedTables = new Set([
  "services",
  "projects",
  "project_images",
  "blog_posts",
  "materials",
  "testimonials",
  "hero_slides",
  "service_areas",
  "landing_pages",
  "home_sections",
  "about_sections",
  "faqs",
  "cta_blocks",
  "site_pages",
  "cms_pages",
  "cms_sections",
  "cms_content_entries",
]);

const getServiceRoleKey = () =>
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");

const createJob = async (
  supabase: ReturnType<typeof createClient>,
  table: string,
  id: string,
  status: "processing" | "completed" | "failed",
  errorMessage?: string,
) =>
  supabase.from("translation_jobs").insert({
    table_name: table,
    record_id: id,
    status,
    error_message: errorMessage ?? null,
    regenerated_at: status === "completed" ? new Date().toISOString() : null,
  });

const requireAdmin = async (
  req: Request,
  supabase: ReturnType<typeof createClient>,
) => {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { ok: false, status: 401, error: "Missing authorization token" };

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return { ok: false, status: 401, error: "Invalid authorization token" };

  const { data: adminRow, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (adminError) return { ok: false, status: 500, error: adminError.message };
  if (!adminRow) return { ok: false, status: 403, error: "Admin access required" };

  return { ok: true, status: 200, error: null };
};

type TranslateFormat = "text" | "html";
type TranslatePath = Array<string | number>;
type TranslateTask = {
  path: TranslatePath;
  value: string;
  format: TranslateFormat;
};

const isHtmlText = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);
const isBlankValue = (value: unknown) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length === 0;
  return false;
};

const collectTranslateTasks = (value: unknown, path: TranslatePath = []): TranslateTask[] => {
  if (typeof value === "string") {
    return [{ path, value, format: isHtmlText(value) ? "html" : "text" }];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectTranslateTasks(item, [...path, index]));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => collectTranslateTasks(child, [...path, key]));
  }

  return [];
};

const cloneValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map((item) => cloneValue(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, cloneValue(child)]));
  }
  return value;
};

const setAtPath = (target: unknown, path: TranslatePath, value: unknown) => {
  if (path.length === 0) return value;
  if (!target || typeof target !== "object") return target;

  const container = target as Record<string, unknown> | unknown[];
  let cursor: any = container;
  for (let index = 0; index < path.length - 1; index += 1) {
    cursor = cursor[path[index] as any];
    if (cursor === undefined || cursor === null) return target;
  }

  cursor[path[path.length - 1] as any] = value;
  return target;
};

const chunk = <T,>(items: T[], size: number) => {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
};

const translateSingle = async (text: string) => {
  const params = new URLSearchParams({
    client: "gtx",
    sl: "zh-CN",
    tl: "en",
    dt: "t",
    q: text,
  });

  const response = await fetch("https://translate.googleapis.com/translate_a/single", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": "FLASH CAST Website Translation",
    },
    body: params,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.error?.message || "Google Translate request failed");
  }

  const translatedParts = result?.[0];
  if (!Array.isArray(translatedParts)) {
    throw new Error("Google Translate response did not include translated text");
  }

  return translatedParts.map((part: unknown) => (Array.isArray(part) ? part[0] || "" : "")).join("") || text;
};

const translateBatch = async (tasks: TranslateTask[]): Promise<string[]> => {
  if (tasks.length === 0) return [];
  return Promise.all(tasks.map((task) => translateSingle(task.value)));
};

const translateValue = async (value: unknown) => {
  if (typeof value === "string") {
    const [translated] = await translateBatch([{ path: [], value, format: isHtmlText(value) ? "html" : "text" }]);
    return translated || value;
  }

  const tasks = collectTranslateTasks(value);
  if (tasks.length === 0) return value;

  const translatedByPath = new Map<string, string>();
  for (const format of ["text", "html"] as const) {
    const formattedTasks = tasks.filter((task) => task.format === format);
    for (const batch of chunk(formattedTasks, 20)) {
      const translated = await translateBatch(batch);
      batch.forEach((task, index) => translatedByPath.set(JSON.stringify(task.path), translated[index] || task.value));
    }
  }

  const cloned = cloneValue(value);
  for (const task of tasks) {
    const key = JSON.stringify(task.path);
    const translatedText = translatedByPath.get(key) || task.value;
    if (task.path.length === 0) {
      return translatedText;
    }
    setAtPath(cloned, task.path, translatedText);
  }

  return cloned;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const { table, id, force = false } = await req.json();
  const serviceRoleKey = getServiceRoleKey();
  if (!serviceRoleKey) {
    return Response.json({ error: "Service role key is not configured" }, { status: 500, headers: corsHeaders });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

  const adminCheck = await requireAdmin(req, supabase);
  if (!adminCheck.ok) {
    return Response.json({ error: adminCheck.error }, { status: adminCheck.status, headers: corsHeaders });
  }

  if (!allowedTables.has(table)) {
    return Response.json({ error: `Translation is not enabled for table: ${table}` }, { status: 400, headers: corsHeaders });
  }

  const { data: record, error: fetchError } = await supabase.from(table).select("*").eq("id", id).single();
  if (fetchError) return Response.json({ error: fetchError.message }, { status: 400, headers: corsHeaders });

  await createJob(supabase, table, id, "processing");

  const translatable = Object.fromEntries(
    Object.entries(record).filter(([key, value]) => key.endsWith("_zh") && value !== null && value !== undefined && value !== ""),
  );
  const expectedKeys = Object.keys(translatable).map((key) => key.replace(/_zh$/, "_en"));

  if (expectedKeys.length === 0) {
    const message = "No Chinese fields ending with _zh were found to translate";
    await createJob(supabase, table, id, "failed", message);
    return Response.json({ error: message }, { status: 400, headers: corsHeaders });
  }

  const translatedRaw: Record<string, unknown> = {};

  try {
    for (const [sourceKey, sourceValue] of Object.entries(translatable)) {
      const targetKey = sourceKey.replace(/_zh$/, "_en");
      if (!force && !isBlankValue((record as Record<string, unknown>)[targetKey])) continue;
      translatedRaw[targetKey] = await translateValue(sourceValue);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Translate web translation failed";
    await createJob(supabase, table, id, "failed", message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }

  const translated = Object.fromEntries(
    Object.entries(translatedRaw).filter(([key]) => expectedKeys.includes(key)),
  );

  if (Object.keys(translated).length === 0) {
    await createJob(supabase, table, id, "completed");
    return Response.json({ ok: true, translated: {}, skipped_existing_english: true }, { headers: corsHeaders });
  }

  const { error: updateError } = await supabase.from(table).update(translated).eq("id", id);
  if (updateError) {
    await createJob(supabase, table, id, "failed", updateError.message);
    return Response.json({ error: updateError.message }, { status: 400, headers: corsHeaders });
  }

  await createJob(supabase, table, id, "completed");
  return Response.json({ ok: true, translated }, { headers: corsHeaders });
});
