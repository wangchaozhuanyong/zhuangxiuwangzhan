import { formatAdminDateTime } from "../_shared/admin-notification-format.ts";
import { categoryLabelMap, itemTitleMap, siteUrl } from "./config.ts";
import {
  collectMaintenanceMetrics,
  fetchMaintenanceSettings,
  fetchReminderItems,
  insertMaintenanceReminderFailureEvent,
  updateMaintenanceLastSentAt,
} from "./repository.ts";
import type {
  DeliveryResult,
  MaintenanceClient,
  MaintenanceMetrics,
  MaintenanceReminderInput,
  MaintenanceReminderResult,
  ReminderItem,
  TelegramSettings,
} from "./types.ts";

const groupItems = (items: ReminderItem[]) => {
  const grouped = new Map<string, ReminderItem[]>();
  for (const item of items) {
    grouped.set(item.category, [...(grouped.get(item.category) || []), item]);
  }
  return grouped;
};

const buildMessage = (items: ReminderItem[], metrics: MaintenanceMetrics, includeMonthly: boolean, timezone: string) => {
  const reminderTime = formatAdminDateTime(new Date(), timezone);

  const lines = [
    "FLASH CAST 本周维护提醒",
    includeMonthly ? "这次包含：每周检查 + 每月内容任务" : "这次包含：每周检查",
    `时间：${reminderTime}`,
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

const sendTelegramMessage = async (settings: TelegramSettings, message: string): Promise<DeliveryResult> => {
  const token = settings.telegram_bot_token?.trim() || Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = settings.telegram_chat_id?.trim() || Deno.env.get("TELEGRAM_CHAT_ID");
  const enabled = settings.telegram_enabled ?? Boolean(token && chatId);

  if (!enabled) return { skipped: true, reason: "Telegram notification is disabled" };
  if (!token || !chatId) return { skipped: true, reason: "Telegram Bot Token or Chat ID is missing" };

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message.slice(0, 3900),
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) return { skipped: false, ok: false, error: await response.text() };
  return { skipped: false, ok: true };
};

const shouldLogTelegramResult = (result: DeliveryResult) =>
  result.ok === false || (result.skipped === true && result.reason !== "Telegram notification is disabled");

export async function runMaintenanceReminder(
  input: MaintenanceReminderInput,
  client: MaintenanceClient,
): Promise<MaintenanceReminderResult> {
  const settings = await fetchMaintenanceSettings(client);

  if (!input.isTest && input.mode === "cron" && settings?.maintenance_reminders_enabled === false) {
    return { body: { ok: true, skipped: true, reason: "Maintenance reminders are disabled" } };
  }

  const [items, metrics] = await Promise.all([
    fetchReminderItems(client, input.includeMonthly),
    collectMaintenanceMetrics(client),
  ]);
  const message = buildMessage(items, metrics, input.includeMonthly, settings?.maintenance_timezone || "Asia/Kuala_Lumpur");
  const telegram = await sendTelegramMessage(settings || {}, message);

  if (shouldLogTelegramResult(telegram)) {
    await insertMaintenanceReminderFailureEvent(
      client,
      telegram.ok === false ? "error" : "warn",
      "Maintenance reminder Telegram notification was not delivered",
      {
        channel: "telegram",
        mode: input.mode,
        include_monthly: input.includeMonthly,
        test: input.isTest,
        result: telegram,
      },
    );
  }

  if (!input.isTest && telegram.ok) {
    await updateMaintenanceLastSentAt(client, new Date().toISOString());
  }

  return { body: { ok: true, telegram, preview: message } };
}
