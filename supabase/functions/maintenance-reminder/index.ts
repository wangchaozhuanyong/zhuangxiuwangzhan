import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

type TelegramSettings = {
  telegram_enabled?: boolean;
  telegram_bot_token?: string | null;
  telegram_chat_id?: string | null;
  maintenance_reminders_enabled?: boolean;
  maintenance_reminder_day?: string;
  maintenance_reminder_time?: string;
  maintenance_timezone?: string;
  maintenance_last_sent_at?: string | null;
};

type ReminderItem = {
  id: string;
  category: string;
  title: string;
  description: string;
  frequency: "weekly" | "monthly";
  sort_order: number;
};

const categoryLabelMap: Record<string, string> = {
  "Traffic and SEO": "流量与 SEO",
  "Lead Handling": "线索处理",
  "Content Health": "内容健康",
  "Technical Checks": "技术检查",
  "Monthly Tasks": "每月任务",
};

const itemTitleMap: Record<string, string> = {
  "seo-search-console": "检查 Google Search Console",
  "seo-sitemap-robots": "确认 sitemap 和 robots",
  "seo-page-tags": "抽查 SEO 标签",
  "leads-new-review": "查看新线索和报价请求",
  "leads-older-than-24h": "跟进超过 24 小时的提交",
  "telegram-health": "确认 Telegram 提醒正常送达",
  "content-homepage": "检查首页和 CTA 文案",
  "content-cases": "检查新案例内容",
  "content-blog-location": "检查博客和地区页",
  "technical-smoke-test": "执行生产环境烟测",
  "technical-mobile-cta": "检查移动端 CTA",
  "technical-cloudflare-supabase": "检查 Cloudflare 和 Supabase 健康状态",
  "monthly-blog": "发布至少一篇 SEO 博客",
  "monthly-case-study": "新增或更新一个案例",
  "monthly-location-material": "扩充一个地区页或材料页",
};

const getServiceRoleKey = () =>
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");

const siteUrl = () => Deno.env.get("SITE_URL") || "https://flashcast.com.my";

const requireAdmin = async (
  req: Request,
  supabase: ReturnType<typeof createClient>,
) => {
  const cronSecret = Deno.env.get("MAINTENANCE_REMINDER_CRON_SECRET");
  const incomingSecret = req.headers.get("x-cron-secret");
  if (cronSecret && incomingSecret && incomingSecret === cronSecret) {
    return { ok: true, status: 200, error: null, mode: "cron" };
  }

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { ok: false, status: 401, error: "Missing authorization token", mode: "admin" };

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return { ok: false, status: 401, error: "Invalid authorization token", mode: "admin" };
  }

  const { data: adminRow, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (adminError) return { ok: false, status: 500, error: adminError.message, mode: "admin" };
  if (!adminRow) return { ok: false, status: 403, error: "Admin access required", mode: "admin" };

  return { ok: true, status: 200, error: null, mode: "admin" };
};

const getSettings = async (supabase: ReturnType<typeof createClient>) => {
  const { data, error } = await supabase
    .from("notification_settings")
    .select("telegram_enabled,telegram_bot_token,telegram_chat_id,maintenance_reminders_enabled,maintenance_reminder_day,maintenance_reminder_time,maintenance_timezone")
    .eq("id", "default")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as TelegramSettings | null;
};

const getReminderItems = async (supabase: ReturnType<typeof createClient>, includeMonthly: boolean) => {
  const frequencies = includeMonthly ? ["weekly", "monthly"] : ["weekly"];
  const { data, error } = await supabase
    .from("maintenance_reminder_items")
    .select("id,category,title,description,frequency,sort_order")
    .eq("active", true)
    .in("frequency", frequencies)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as ReminderItem[];
};

const countRows = async (
  supabase: ReturnType<typeof createClient>,
  table: string,
  configure?: (query: any) => any,
) => {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (configure) query = configure(query);
  const { count, error } = await query;
  if (error) return null;
  return count || 0;
};

const collectMetrics = async (supabase: ReturnType<typeof createClient>) => {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    newLeads,
    newLeadsOlderThan24h,
    pendingQuotes,
    pendingQuotesOlderThan24h,
    leadsThisWeek,
    quotesThisWeek,
    publishedProjects,
    publishedBlogs,
    publishedMaterials,
    publishedAreas,
  ] = await Promise.all([
    countRows(supabase, "leads", (q) => q.eq("status", "new")),
    countRows(supabase, "leads", (q) => q.eq("status", "new").lt("created_at", since24h)),
    countRows(supabase, "quote_requests", (q) => q.eq("status", "pending")),
    countRows(supabase, "quote_requests", (q) => q.eq("status", "pending").lt("created_at", since24h)),
    countRows(supabase, "leads", (q) => q.gte("created_at", since7d)),
    countRows(supabase, "quote_requests", (q) => q.gte("created_at", since7d)),
    countRows(supabase, "projects", (q) => q.eq("status", "published")),
    countRows(supabase, "blog_posts", (q) => q.eq("status", "published")),
    countRows(supabase, "materials", (q) => q.eq("status", "published")),
    countRows(supabase, "service_areas", (q) => q.eq("status", "published")),
  ]);

  return {
    newLeads,
    newLeadsOlderThan24h,
    pendingQuotes,
    pendingQuotesOlderThan24h,
    leadsThisWeek,
    quotesThisWeek,
    publishedProjects,
    publishedBlogs,
    publishedMaterials,
    publishedAreas,
  };
};

const groupItems = (items: ReminderItem[]) => {
  const grouped = new Map<string, ReminderItem[]>();
  for (const item of items) {
    grouped.set(item.category, [...(grouped.get(item.category) || []), item]);
  }
  return grouped;
};

const buildMessage = (items: ReminderItem[], metrics: Awaited<ReturnType<typeof collectMetrics>>, includeMonthly: boolean) => {
  const lines = [
    "FLASH CAST 本周维护提醒",
    includeMonthly ? "这次包含：每周检查 + 每月内容任务" : "这次包含：每周检查",
    `时间：${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Kuala_Lumpur" })}`,
    "",
    "先看这几个重点",
    `- 新联系线索：${metrics.newLeads ?? "?"}，超过 24 小时未处理：${metrics.newLeadsOlderThan24h ?? "?"}`,
    `- 待处理报价：${metrics.pendingQuotes ?? "?"}，超过 24 小时未处理：${metrics.pendingQuotesOlderThan24h ?? "?"}`,
    `- 近 7 天联系线索：${metrics.leadsThisWeek ?? "?"}，报价请求：${metrics.quotesThisWeek ?? "?"}`,
    `- 已发布内容：案例 ${metrics.publishedProjects ?? "?"} / 博客 ${metrics.publishedBlogs ?? "?"} / 材料 ${metrics.publishedMaterials ?? "?"} / 地区页 ${metrics.publishedAreas ?? "?"}`,
    "",
    "这次要处理的事",
  ];

  for (const [category, categoryItems] of groupItems(items)) {
    lines.push("", categoryLabelMap[category] || category);
    for (const item of categoryItems) {
      lines.push(`- ${itemTitleMap[item.id] || item.title}`);
    }
  }

  lines.push(
    "",
    "后台入口",
    `${siteUrl()}/admin`,
    "",
    "建议：先处理超过 24 小时的新线索和报价，再检查 Search Console、sitemap、首页 CTA 和移动端按钮。",
  );

  return lines.join("\n");
};

const sendTelegramMessage = async (settings: TelegramSettings, message: string) => {
  const token = settings.telegram_bot_token?.trim() || Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = settings.telegram_chat_id?.trim() || Deno.env.get("TELEGRAM_CHAT_ID");
  const enabled = settings.telegram_enabled ?? Boolean(token && chatId);

  if (!enabled) return { skipped: true, reason: "Telegram notification is disabled" };
  if (!token || !chatId) return { skipped: true, reason: "Telegram Bot Token or Chat ID is missing" };

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message.slice(0, 3900),
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) return { skipped: false, ok: false, error: await response.text() };
  return { skipped: false, ok: true };
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const serviceRoleKey = getServiceRoleKey();
    if (!serviceRoleKey) {
      return Response.json({ error: "Service role key is not configured" }, { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    const adminCheck = await requireAdmin(req, supabase);
    if (!adminCheck.ok) {
      return Response.json({ error: adminCheck.error }, { status: adminCheck.status, headers: corsHeaders });
    }

    const body = req.method === "GET" ? {} : await req.json().catch(() => ({}));
    const includeMonthly = Boolean(body.include_monthly);
    const isTest = Boolean(body.test);
    const settings = await getSettings(supabase);

    if (!isTest && adminCheck.mode === "cron" && settings?.maintenance_reminders_enabled === false) {
      return Response.json({ ok: true, skipped: true, reason: "Maintenance reminders are disabled" }, { headers: corsHeaders });
    }

    const [items, metrics] = await Promise.all([
      getReminderItems(supabase, includeMonthly),
      collectMetrics(supabase),
    ]);
    const message = buildMessage(items, metrics, includeMonthly);
    const telegram = await sendTelegramMessage(settings || {}, message);

    if (!isTest && telegram.ok) {
      await supabase
        .from("notification_settings")
        .update({ maintenance_last_sent_at: new Date().toISOString() })
        .eq("id", "default");
    }

    return Response.json({ ok: true, telegram, preview: message }, { headers: corsHeaders });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Maintenance reminder failed" },
      { status: 500, headers: corsHeaders },
    );
  }
});
