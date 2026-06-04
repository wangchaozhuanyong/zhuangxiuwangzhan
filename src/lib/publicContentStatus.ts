import { publicContentStatusText } from "@/i18n/publicContentStatusText";

export type PublicContentSource = "remote" | "local-fallback";

export type PublicContentReason =
  | "remote-ok"
  | "supabase-not-configured"
  | "remote-empty"
  | "remote-error";

export type PublicContentResult<T> = {
  data: T;
  source: PublicContentSource;
  reason: PublicContentReason;
  errorMessage?: string;
};

export const createRemoteContent = <T>(data: T): PublicContentResult<T> => ({
  data,
  source: "remote",
  reason: "remote-ok",
});

export const createLocalFallbackContent = <T>(
  data: T,
  reason: Exclude<PublicContentReason, "remote-ok">,
  error?: unknown,
): PublicContentResult<T> => ({
  data,
  source: "local-fallback",
  reason,
  errorMessage: getPublicContentErrorMessage(error),
});

export const getPublicContentErrorMessage = (error: unknown) => {
  if (!error) return undefined;
  return "remote-error";
};

export const isPublicContentDegraded = (result: PublicContentResult<unknown> | null | undefined) =>
  Boolean(result && result.source !== "remote");

export const getPublicContentStatusLabel = (
  result: PublicContentResult<unknown> | null | undefined,
  language: "en" | "zh",
) => {
  if (!result || result.source === "remote") return null;
  const text = publicContentStatusText[language];

  if (result.reason === "remote-error") {
    return {
      title: text.remoteErrorTitle,
      description: text.remoteErrorDescription,
      action: text.remoteErrorAction,
    };
  }

  return {
    title: text.fallbackTitle,
    description: text.fallbackDescription,
    action: text.fallbackAction,
  };
};
