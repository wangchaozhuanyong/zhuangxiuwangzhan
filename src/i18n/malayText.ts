import translations from "./malayInlineText.json";

export const malayText = (source: string): string =>
  (translations as Record<string, string>)[source] || source;

export const malayFormat = (source: string, values: readonly unknown[]): string =>
  malayText(source).replace(/__FC(\d+)__/g, (_match, index: string) => String(values[Number(index)] ?? ""));
