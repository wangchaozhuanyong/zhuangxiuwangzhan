import { resolveTelegramSettings, sendTelegramMessage } from "../_shared/telegram-delivery.ts";
import { fetchGrowthTelegramSettings, insertGrowthNotificationEvent } from "./repository.ts";
import type { GrowthEventType, GrowthNotifyClient, GrowthNotifyRequest, GrowthNotifyResult } from "./types.ts";

const EVENT_LABELS: Record<GrowthEventType, string> = {
  system_test: "通知通道联调测试",
  seo_publish: "SEO 服务页已更新",
  negative_keyword: "Google Ads 已添加精确否定词",
  campaign_pause: "Google Ads 已执行紧急暂停",
  rollback: "SEO 服务页已自动回滚",
  execution_failure: "推广自动执行失败",
};
const VALID_EVENTS = new Set(Object.keys(EVENT_LABELS));
const clean = (value: unknown, max = 500) => String(value ?? "").trim().slice(0, max);

export const buildGrowthTelegramMessage = (input: GrowthNotifyRequest) => {
  const eventType = clean(input.eventType, 40) as GrowthEventType;
  if (!VALID_EVENTS.has(eventType)) throw new Error("Invalid growth notification event type");
  const evidence = Array.isArray(input.evidence)
    ? input.evidence.map((item) => clean(item, 300)).filter(Boolean).slice(0, 8)
    : [];
  const lines = [
    `【FLASH CAST 受控推广】${EVENT_LABELS[eventType]}`,
    `变更编号：${clean(input.changeId, 120) || "未提供"}`,
    `内容：${clean(input.title, 300) || EVENT_LABELS[eventType]}`,
    `原因：${clean(input.reason, 600) || "未提供"}`,
  ];
  if (input.before || input.after) {
    lines.push(`变更前：${clean(input.before, 500) || "-"}`);
    lines.push(`变更后：${clean(input.after, 500) || "-"}`);
  }
  if (evidence.length) {
    lines.push("证据：");
    lines.push(...evidence.map((item) => `- ${item}`));
  }
  if (input.reportPath) lines.push(`报告：${clean(input.reportPath, 500)}`);
  if (input.rollbackId) lines.push(`回滚编号：${clean(input.rollbackId, 120)}`);
  return lines.join("\n").slice(0, 3500);
};

export async function notifyGrowthEvent(
  input: GrowthNotifyRequest,
  client: GrowthNotifyClient,
): Promise<GrowthNotifyResult> {
  let message: string;
  try {
    message = buildGrowthTelegramMessage(input);
  } catch (error) {
    return { status: 400, body: { ok: false, error: error instanceof Error ? error.message : "Invalid notification" } };
  }

  const settings = resolveTelegramSettings(await fetchGrowthTelegramSettings(client));
  const delivery = await sendTelegramMessage(message, settings);
  const severity = input.eventType === "execution_failure" || delivery.ok === false ? "error" : "info";
  await insertGrowthNotificationEvent(
    client,
    `managed_growth_${input.eventType}`,
    severity,
    EVENT_LABELS[input.eventType as GrowthEventType],
    {
      change_id: clean(input.changeId, 120),
      report_path: clean(input.reportPath, 500),
      rollback_id: clean(input.rollbackId, 120),
      telegram_delivered: delivery.ok === true,
      telegram_skipped: delivery.skipped === true,
    },
  );

  return {
    status: delivery.ok === false ? 502 : 200,
    body: {
      ok: delivery.ok !== false,
      telegram: delivery,
      change_id: clean(input.changeId, 120),
    },
  };
}
