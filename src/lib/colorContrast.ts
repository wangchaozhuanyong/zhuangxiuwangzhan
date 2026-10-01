export type RgbColor = { r: number; g: number; b: number; a: number };

const clamp = (value: number, maximum = 255) => Math.min(maximum, Math.max(0, value));
const parseChannel = (value: string, maximum: number) =>
  value.endsWith("%") ? Number(value.slice(0, -1)) * maximum / 100 : Number(value);

/** Parse resolved CSS colors; unresolved variables and unknown colors stay unknown. */
export const parseCssColor = (color: string): RgbColor | null => {
  const normalized = color.trim().toLowerCase();
  if (normalized === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  const named = normalized === "black" ? "#000000" : normalized === "white" ? "#ffffff" : normalized;
  const hex = named.match(/^#([a-f\d]{3,4}|[a-f\d]{6}|[a-f\d]{8})$/i)?.[1];
  if (hex) {
    const value = hex.length <= 4 ? Array.from(hex, (digit) => digit + digit).join("") : hex;
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
      a: value.length === 8 ? parseInt(value.slice(6, 8), 16) / 255 : 1,
    };
  }
  // Chromium serializes color-mix() as color(srgb ...), rather than rgb().
  const srgb = normalized.match(/^color\(srgb\s+([^)]*)\)$/);
  if (srgb) {
    const values = srgb[1].replace(/\//g, " ").split(/\s+/).filter(Boolean);
    if (values.length !== 3 && values.length !== 4) return null;
    const channels = values.slice(0, 3).map((value) => parseChannel(value, 1));
    const alpha = values[3] === undefined ? 1 : parseChannel(values[3], 1);
    if ([...channels, alpha].some((value) => !Number.isFinite(value))) return null;
    return { r: clamp(channels[0], 1) * 255, g: clamp(channels[1], 1) * 255, b: clamp(channels[2], 1) * 255, a: clamp(alpha, 1) };
  }
  const match = normalized.match(/^(rgba?|hsla?)\(([^)]+)\)$/);
  if (!match) return null;
  const channels = match[2].replace(/\//g, " ").split(/[\s,]+/).filter(Boolean);
  if (channels.length < 3 || channels.length > 4) return null;
  const alpha = channels[3] === undefined ? 1 : parseChannel(channels[3], 1);
  if (!Number.isFinite(alpha)) return null;
  if (match[1].startsWith("rgb")) {
    const rgb = channels.slice(0, 3).map((value) => parseChannel(value, 255));
    if (rgb.some((value) => !Number.isFinite(value))) return null;
    return { r: clamp(rgb[0]), g: clamp(rgb[1]), b: clamp(rgb[2]), a: clamp(alpha, 1) };
  }
  const hue = Number(channels[0].replace(/deg$/, ""));
  const saturation = parseChannel(channels[1], 1);
  const lightness = parseChannel(channels[2], 1);
  if (![hue, saturation, lightness].every(Number.isFinite)) return null;
  const segment = ((hue % 360) + 360) % 360 / 60;
  const chroma = (1 - Math.abs(2 * clamp(lightness, 1) - 1)) * clamp(saturation, 1);
  const x = chroma * (1 - Math.abs(segment % 2 - 1));
  const values = segment < 1 ? [chroma, x, 0] : segment < 2 ? [x, chroma, 0]
    : segment < 3 ? [0, chroma, x] : segment < 4 ? [0, x, chroma]
      : segment < 5 ? [x, 0, chroma] : [chroma, 0, x];
  const offset = clamp(lightness, 1) - chroma / 2;
  return { r: (values[0] + offset) * 255, g: (values[1] + offset) * 255, b: (values[2] + offset) * 255, a: clamp(alpha, 1) };
};

export const compositeColors = (foreground: RgbColor, background: RgbColor): RgbColor => {
  const alpha = foreground.a + background.a * (1 - foreground.a);
  const channel = (front: number, back: number) => alpha === 0 ? 0
    : (front * foreground.a + back * background.a * (1 - foreground.a)) / alpha;
  return { r: channel(foreground.r, background.r), g: channel(foreground.g, background.g), b: channel(foreground.b, background.b), a: alpha };
};

export const getRelativeLuminance = ({ r, g, b }: Pick<RgbColor, "r" | "g" | "b">) => {
  const linear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};

/** A translucent background needs an opaque backdrop; missing evidence is not a pass. */
export const getContrastRatio = (foreground: string, background: string, backdrop?: string): number | null => {
  const front = parseCssColor(foreground);
  let back = parseCssColor(background);
  if (!front || !back) return null;
  if (back.a < 1) {
    const base = backdrop ? parseCssColor(backdrop) : null;
    if (!base || base.a < 1) return null;
    back = compositeColors(back, base);
  }
  const frontLuminance = getRelativeLuminance(compositeColors(front, back));
  const backLuminance = getRelativeLuminance(back);
  return (Math.max(frontLuminance, backLuminance) + 0.05) / (Math.min(frontLuminance, backLuminance) + 0.05);
};

export const getReadableTextColor = (background: string, darkText = "#000000", lightText = "#ffffff", backdrop?: string) => {
  const darkRatio = getContrastRatio(darkText, background, backdrop);
  const lightRatio = getContrastRatio(lightText, background, backdrop);
  return lightRatio !== null && (darkRatio === null || lightRatio > darkRatio) ? lightText : darkText;
};

export type AdaptiveTextColor = { color: string; outline: boolean; minimumRatio: number | null };

/** Keep the skin color when it works. Judge the local samples, never a photo's average color. */
export const chooseAdaptiveTextColor = (
  samples: (RgbColor | null)[], preferred: string, previous?: string, minimum = 4.5,
): AdaptiveTextColor => {
  const known = samples.filter((sample): sample is RgbColor => sample !== null && sample.a === 1);
  const uncertain = !samples.length || known.length !== samples.length;
  // Unknown pixels are not evidence for changing the authored foreground.
  // Keep the last stable glyph color while photos, overlays or fonts settle.
  if (uncertain) return { color: previous || preferred, outline: true, minimumRatio: null };
  const ratio = (color: string) => {
    const foreground = parseCssColor(color);
    if (!foreground || !known.length) return 0;
    const values = known.map((background) => {
      const front = getRelativeLuminance(compositeColors(foreground, background));
      const back = getRelativeLuminance(background);
      return (Math.max(front, back) + 0.05) / (Math.min(front, back) + 0.05);
    });
    return Math.min(...values);
  };
  if (!uncertain && ratio(preferred) >= minimum) return { color: preferred, outline: false, minimumRatio: ratio(preferred) };
  if (!uncertain && previous && ratio(previous) >= minimum + 0.25) return { color: previous, outline: false, minimumRatio: ratio(previous) };
  const dark = ratio("#000000");
  const light = ratio("#ffffff");
  // A small dead band prevents black/white chatter at a moving image boundary.
  const color = previous && Math.abs(dark - light) < 0.25 && ["#000000", "#ffffff"].includes(previous)
    ? previous : light > dark ? "#ffffff" : "#000000";
  const selectedRatio = ratio(color);
  return { color, outline: uncertain || selectedRatio < minimum, minimumRatio: uncertain ? null : selectedRatio };
};

type ImageGeometry = { width: number; height: number; naturalWidth: number; naturalHeight: number; fit: string; position: string };

/** Map a viewport-local point through object-fit and object-position into source pixels. */
export const getImageSourcePoint = (image: ImageGeometry, x: number, y: number): { x: number; y: number } | null => {
  if ([image.width, image.height, image.naturalWidth, image.naturalHeight].some((value) => value <= 0)) return null;
  const contain = Math.min(image.width / image.naturalWidth, image.height / image.naturalHeight);
  const scale = image.fit === "cover" ? Math.max(image.width / image.naturalWidth, image.height / image.naturalHeight)
    : image.fit === "none" ? 1 : image.fit === "scale-down" ? Math.min(1, contain) : contain;
  const width = image.fit === "fill" ? image.width : image.naturalWidth * scale;
  const height = image.fit === "fill" ? image.height : image.naturalHeight * scale;
  const positions = image.position.trim().split(/\s+/);
  if (positions.length > 2) return null; // Unsupported edge-offset syntax stays unknown.
  if (positions.length === 1) positions.push("50%");
  if (["top", "bottom"].includes(positions[0])) positions.reverse();
  const offset = (value: string, space: number) => {
    if (["left", "top"].includes(value)) return 0;
    if (["right", "bottom"].includes(value)) return space;
    if (value === "center") return space / 2;
    if (/^-?[\d.]+%$/.test(value)) return space * parseFloat(value) / 100;
    if (/^-?[\d.]+px$/.test(value)) return parseFloat(value);
    return Number.NaN;
  };
  const sourceX = (x - offset(positions[0], image.width - width)) / width * image.naturalWidth;
  const sourceY = (y - offset(positions[1], image.height - height)) / height * image.naturalHeight;
  if (!Number.isFinite(sourceX + sourceY) || sourceX < 0 || sourceY < 0 || sourceX >= image.naturalWidth || sourceY >= image.naturalHeight) return null;
  return { x: sourceX, y: sourceY };
};
