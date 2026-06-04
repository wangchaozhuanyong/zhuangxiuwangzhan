export type SupabaseRenderOptions = {
  width?: number;
  height?: number;
  quality?: number;
  resize?: "contain" | "cover" | "fill";
  format?: "origin" | "webp";
};

const DEFAULT_QUALITY = 75;
const DEFAULT_FORMAT: SupabaseRenderOptions["format"] = "webp";

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

/**
 * Supabase publicUrl shape (returned by storage.getPublicUrl):
 *   https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
 *
 * Supabase image transform endpoint:
 *   https://<project>.supabase.co/storage/v1/render/image/public/<bucket>/<path>?width=...&quality=...
 */
export function isSupabasePublicObjectUrl(url: string) {
  return isHttpUrl(url) && url.includes("/storage/v1/object/public/");
}

export function toSupabaseRenderImageUrl(url: string, opts: SupabaseRenderOptions = {}) {
  if (!isSupabasePublicObjectUrl(url)) return url;

  const renderBase = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
  const params = new URLSearchParams();

  const quality = Math.min(100, Math.max(20, opts.quality ?? DEFAULT_QUALITY));
  params.set("quality", String(quality));

  if (opts.width) params.set("width", String(Math.round(opts.width)));
  if (opts.height) params.set("height", String(Math.round(opts.height)));
  if (opts.resize) params.set("resize", opts.resize);
  const format = opts.format ?? DEFAULT_FORMAT;
  if (format) params.set("format", format);

  const qs = params.toString();
  return qs ? `${renderBase}${renderBase.includes("?") ? "&" : "?"}${qs}` : renderBase;
}

export function buildSupabaseSrcSet(url: string, widths: number[], opts: Omit<SupabaseRenderOptions, "width"> = {}) {
  if (!isSupabasePublicObjectUrl(url)) return undefined;
  const uniqueSorted = Array.from(new Set(widths.filter(Boolean))).sort((a, b) => a - b);
  return uniqueSorted.map((w) => `${toSupabaseRenderImageUrl(url, { ...opts, width: w })} ${w}w`).join(", ");
}

