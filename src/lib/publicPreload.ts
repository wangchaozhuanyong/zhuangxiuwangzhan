import type { UnknownRecord } from "@/lib/recordUtils";

export type PublicDataPayload = {
  projectSummaries?: UnknownRecord[];
  projectDetails?: Record<string, UnknownRecord>;
  homeContentBundle?: UnknownRecord;
};

let preloadedPublicData: PublicDataPayload | null | undefined;

export const readPreloadedPublicData = (): PublicDataPayload | null => {
  if (preloadedPublicData !== undefined) return preloadedPublicData;
  if (typeof document === "undefined") {
    preloadedPublicData = null;
    return preloadedPublicData;
  }

  const node = document.getElementById("flashcast-public-data");
  if (!node?.textContent) {
    preloadedPublicData = null;
    return preloadedPublicData;
  }

  try {
    const parsed = JSON.parse(node.textContent) as PublicDataPayload;
    preloadedPublicData = parsed && typeof parsed === "object" ? parsed : null;
    return preloadedPublicData;
  } catch {
    preloadedPublicData = null;
    return preloadedPublicData;
  }
};
