type RgbColor = {
  r: number;
  g: number;
  b: number;
};

const clampRgb = (value: number) => Math.min(255, Math.max(0, value));

const parseHexColor = (color: string): RgbColor | null => {
  const normalized = color.trim().replace(/^#/, "");
  const hex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;

  if (!/^[0-9a-f]{6}$/i.test(hex)) {
    return null;
  }

  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
};

const parseRgbColor = (color: string): RgbColor | null => {
  const match = color.match(/rgba?\(([^)]+)\)/i);

  if (!match) {
    return null;
  }

  const channels = match[1]
    .split(",")
    .slice(0, 3)
    .map((channel) => Number(channel.trim()));

  if (channels.length < 3 || channels.some((channel) => Number.isNaN(channel))) {
    return null;
  }

  return {
    r: clampRgb(channels[0]),
    g: clampRgb(channels[1]),
    b: clampRgb(channels[2]),
  };
};

const hslToRgb = (h: number, s: number, l: number): RgbColor => {
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = h / 60;
  const x = chroma * (1 - Math.abs((segment % 2) - 1));
  const match =
    segment >= 0 && segment < 1
      ? [chroma, x, 0]
      : segment >= 1 && segment < 2
        ? [x, chroma, 0]
        : segment >= 2 && segment < 3
          ? [0, chroma, x]
          : segment >= 3 && segment < 4
            ? [0, x, chroma]
            : segment >= 4 && segment < 5
              ? [x, 0, chroma]
              : [chroma, 0, x];
  const m = lightness - chroma / 2;

  return {
    r: clampRgb(Math.round((match[0] + m) * 255)),
    g: clampRgb(Math.round((match[1] + m) * 255)),
    b: clampRgb(Math.round((match[2] + m) * 255)),
  };
};

const parseHslColor = (color: string): RgbColor | null => {
  const match = color.match(/hsla?\(([^)]+)\)/i);

  if (!match) {
    return null;
  }

  const channels = match[1].replace(/\//g, " ").split(/[\s,]+/).filter(Boolean);
  const hue = Number(channels[0]);
  const saturation = Number(channels[1]?.replace("%", ""));
  const lightness = Number(channels[2]?.replace("%", ""));

  if ([hue, saturation, lightness].some((channel) => Number.isNaN(channel))) {
    return null;
  }

  return hslToRgb(((hue % 360) + 360) % 360, saturation, lightness);
};

export const parseCssColor = (color: string): RgbColor | null => {
  if (!color) {
    return null;
  }

  return parseHexColor(color) || parseRgbColor(color) || parseHslColor(color);
};

export const getRelativeLuminance = ({ r, g, b }: RgbColor) => {
  const [red, green, blue] = [r, g, b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

export const getReadableTextColor = (
  backgroundColor: string,
  darkText = "hsl(var(--foreground))",
  lightText = "hsl(var(--surface-dark-foreground))",
) => {
  const rgb = parseCssColor(backgroundColor);

  if (!rgb) {
    return darkText;
  }

  return getRelativeLuminance(rgb) > 0.48 ? darkText : lightText;
};
