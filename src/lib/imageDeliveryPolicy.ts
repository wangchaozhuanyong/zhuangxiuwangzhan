export type ImageDeliveryUsage =
  | "hero"
  | "project"
  | "material"
  | "blog"
  | "logo"
  | "icon"
  | "og"
  | "before_after"
  | "general";

export type ImageDeliveryProfile = {
  usage: ImageDeliveryUsage;
  maxEdge: number;
  maxBytes: number;
};

const KB = 1024;

export const IMAGE_DELIVERY_PROFILES: Record<ImageDeliveryUsage, ImageDeliveryProfile> = {
  hero: { usage: "hero", maxEdge: 2400, maxBytes: 650 * KB },
  project: { usage: "project", maxEdge: 2000, maxBytes: 350 * KB },
  material: { usage: "material", maxEdge: 1600, maxBytes: 240 * KB },
  blog: { usage: "blog", maxEdge: 1800, maxBytes: 300 * KB },
  logo: { usage: "logo", maxEdge: 1200, maxBytes: 200 * KB },
  icon: { usage: "icon", maxEdge: 512, maxBytes: 120 * KB },
  og: { usage: "og", maxEdge: 1200, maxBytes: 300 * KB },
  before_after: { usage: "before_after", maxEdge: 2000, maxBytes: 400 * KB },
  general: { usage: "general", maxEdge: 2000, maxBytes: 450 * KB },
};

export function resolveImageDeliveryProfile({
  usageType,
  previewVariant,
}: {
  usageType?: string | null;
  previewVariant?: string | null;
}): ImageDeliveryProfile {
  if (previewVariant === "icon") return IMAGE_DELIVERY_PROFILES.icon;
  if (previewVariant === "logo") return IMAGE_DELIVERY_PROFILES.logo;
  if (previewVariant === "og") return IMAGE_DELIVERY_PROFILES.og;

  const normalized = String(usageType || "general") as ImageDeliveryUsage;
  return IMAGE_DELIVERY_PROFILES[normalized] || IMAGE_DELIVERY_PROFILES.general;
}
