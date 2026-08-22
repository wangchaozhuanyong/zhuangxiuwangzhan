import { readPreloadedPublicData } from "@/lib/publicPreload";

export type PublicVersion = {
  deploymentVersion: string;
  contentVersion: string;
};

const readVersionText = (value: unknown) => (typeof value === "string" ? value.trim().slice(0, 128) : "");

export const createCurrentPublicVersion = (): PublicVersion => ({
  deploymentVersion: readVersionText(import.meta.env.VITE_APP_VERSION),
  contentVersion: readVersionText(readPreloadedPublicData()?.siteSettings?.updated_at),
});

export const parsePublicVersion = (value: unknown): PublicVersion => {
  const record = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  return {
    deploymentVersion: readVersionText(record.deploymentVersion),
    contentVersion: readVersionText(record.contentVersion),
  };
};

export const fetchPublicVersion = async (signal?: AbortSignal) => {
  const response = await fetch("/__flashcast/version", {
    cache: "no-store",
    credentials: "same-origin",
    headers: { Accept: "application/json", "Cache-Control": "no-cache" },
    signal,
  });
  if (!response.ok) throw new Error(`Public version check failed with HTTP ${response.status}.`);
  return parsePublicVersion(await response.json());
};

export const hasNewPublicVersion = (current: PublicVersion, latest: PublicVersion) => {
  const deploymentChanged = Boolean(
    current.deploymentVersion &&
    latest.deploymentVersion &&
    current.deploymentVersion !== latest.deploymentVersion,
  );
  const contentChanged = Boolean(
    current.contentVersion &&
    latest.contentVersion &&
    current.contentVersion !== latest.contentVersion,
  );
  return deploymentChanged || contentChanged;
};
