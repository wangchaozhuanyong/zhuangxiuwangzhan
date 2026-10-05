import type {
  ContentPublishClient,
  ContentPublishMode,
  ContentPublishRequest,
  ContentPublishResult,
  ContentStatus,
  PublishContext,
} from "./types.ts";

type SpecializedContentType = "media" | "homepage" | "blog" | "material" | "service_area" | "project" | "site_page";
type PublishHandler = (
  input: ContentPublishRequest,
  client: ContentPublishClient,
  context: PublishContext,
  mode: ContentPublishMode,
  nextStatus: ContentStatus,
) => Promise<ContentPublishResult>;

// Called only after the entry service has completed its existing authorization,
// exact managed-target checks, and cache-invalidation handling.
export function dispatchContentPublish(
  input: ContentPublishRequest,
  client: ContentPublishClient,
  context: PublishContext,
  mode: ContentPublishMode,
  nextStatus: ContentStatus,
  handlers: Record<SpecializedContentType, PublishHandler>,
): Promise<ContentPublishResult> | null {
  const type = input.contentType;
  if (type === "media" || type === "homepage" || type === "blog" || type === "material"
    || type === "service_area" || type === "project" || type === "site_page") {
    return handlers[type](input, client, context, mode, nextStatus);
  }
  // Service publishing and exact FAQ patches retain their existing entry paths.
  return null;
}
