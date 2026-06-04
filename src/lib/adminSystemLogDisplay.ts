import type { SystemLogRow } from "@/backend/modules/system/service/systemEventService";
import {
  adminSystemLogsText,
  adminSystemLogCategoryLabels,
  adminSystemLogEventTypeLabels,
  adminSystemLogMessageLabels,
  adminSystemLogSeverityLabels,
  adminSystemLogSourceLabels,
} from "@/i18n/adminSystemLogsText";
import type { AdminLang } from "@/lib/adminLocale";
import { getFriendlySystemMessage, getSystemEventCategory } from "@/lib/chunkLoadRecovery";
import { isTechnicalFieldLeak } from "@/lib/userFacingText";

type LabelTable = Record<string, string>;

const readLabel = (labels: LabelTable, key?: string | null) => (key ? labels[key] : undefined);
const readDisplayText = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : undefined);

const getDisplayCategory = (row: SystemLogRow, language: AdminLang) => {
  const text = adminSystemLogsText[language];
  const categoryLabels = adminSystemLogCategoryLabels[language] as LabelTable;
  const metadataCategory = readDisplayText(row.metadata?.category);
  const metadataCategoryLabel = readDisplayText(row.metadata?.categoryLabel);
  const fallbackCategory = getSystemEventCategory(row.message, row.event_type).label;

  const displayCategory =
    readLabel(categoryLabels, row.event_type) ||
    readLabel(categoryLabels, metadataCategory) ||
    metadataCategoryLabel ||
    fallbackCategory;

  return isTechnicalFieldLeak(displayCategory, language) ? text.unknownCategory : displayCategory;
};

const getDisplayMessage = (row: SystemLogRow, language: AdminLang) => {
  const text = adminSystemLogsText[language];
  const messageLabels = adminSystemLogMessageLabels[language] as LabelTable;
  const friendlyMessage = getFriendlySystemMessage(row.message, row.event_type);
  const mappedMessage = readLabel(messageLabels, row.message) || readLabel(messageLabels, friendlyMessage);

  if (mappedMessage) return mappedMessage;
  if (friendlyMessage !== row.message && !isTechnicalFieldLeak(friendlyMessage, language)) return friendlyMessage;
  if (!isTechnicalFieldLeak(row.message, language)) return row.message;

  return text.unknownMessage;
};

export const formatAdminSystemLogRow = (row: SystemLogRow, language: AdminLang) => {
  const text = adminSystemLogsText[language];
  const severityLabels = adminSystemLogSeverityLabels[language] as LabelTable;
  const sourceLabels = adminSystemLogSourceLabels[language] as LabelTable;
  const eventTypeLabels = adminSystemLogEventTypeLabels[language] as LabelTable;

  return {
    severity: readLabel(severityLabels, row.severity) || text.unknownSeverity,
    source: readLabel(sourceLabels, row.source) || text.unknownSource,
    category: getDisplayCategory(row, language),
    eventType: readLabel(eventTypeLabels, row.event_type) || text.unknownEventType,
    message: getDisplayMessage(row, language),
  };
};
