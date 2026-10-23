import { localizeContentLink, localizeHtmlLinks, stableTranslationField } from "../_shared/content-links.mjs";

type TranslateFormat = "text" | "html";
type TranslatePath = Array<string | number>;
type TranslateTask = {
  path: TranslatePath;
  value: string;
  format: TranslateFormat;
};

const isHtmlText = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

const collectTranslateTasks = (value: unknown, path: TranslatePath = []): TranslateTask[] => {
  if (typeof value === "string") {
    return [{ path, value, format: isHtmlText(value) ? "html" : "text" }];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectTranslateTasks(item, [...path, index]));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => collectTranslateTasks(child, [...path, key]));
  }

  return [];
};

const protectTranslation = (text: string, language: "en" | "ms") => {
  const tokens: string[] = [];
  let prefix = "ZXQ";
  while (text.includes(prefix)) prefix += "X";
  const protectedText = text.replace(/\{[^{}]+\}|<!--[\s\S]*?-->|<\/?[a-z][^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>|https?:\/\/[^\s<>"']+|\/(?:en|zh|ms)\/[^\s<>"')]+|\bFLASH CAST(?: SDN\. BHD\.)?\b|\bWhatsApp\b/gi, (token) => {
    tokens.push(token); return `${prefix}${tokens.length - 1}QXZ`;
  });
  return { text: protectedText, restore: (translated: string) => {
    let result = translated;
    for (let index = 0; index < tokens.length; index++) {
      const marker = `${prefix}${index}QXZ`;
      if (result.split(marker).length !== 2) throw new Error("Translation changed a protected placeholder. No content was saved.");
      const original = tokens[index];
      result = result.replace(marker, original.startsWith("<") ? localizeHtmlLinks(original, language) : localizeContentLink(original, language));
    }
    const tags = /<!--[\s\S]*?-->|<\/?[a-z][^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>/gi;
    const expectedTags = (text.match(tags) || []).map(tag => localizeHtmlLinks(tag, language));
    if (new RegExp(`${prefix}\\d+QXZ`).test(result)
        || JSON.stringify(result.match(tags) || []) !== JSON.stringify(expectedTags)) {
      throw new Error("Translation changed protected HTML or placeholders. No content was saved.");
    }
    return result;
  } };
};

const translateMalayText = async (protectedText: string): Promise<string> => {
  const parts: string[] = [];
  let remaining = protectedText;
  while (remaining.length > 1800) {
    const space = remaining.lastIndexOf(" ", 1800);
    let boundary = space > 900 ? space + 1 : 1800;
    // A long word must not split a protected URL/tag placeholder between requests.
    const token = /ZXQX*\d+QXZ/g;
    for (const match of remaining.matchAll(token)) {
      if (match.index < boundary && match.index + match[0].length > boundary) boundary = match.index;
    }
    parts.push(remaining.slice(0, boundary)); remaining = remaining.slice(boundary);
  }
  if (remaining) parts.push(remaining);
  const translated: string[] = [];
  for (const part of parts) {
    const params = new URLSearchParams({ client: "dict-chrome-ex", sl: "auto", tl: "ms", q: part });
    const response = await fetch(`https://clients5.google.com/translate_a/t?${params}`);
    if (!response.ok) throw new Error("Malay translation service is unavailable. Please try again later.");
    const result = await response.json();
    const value = Array.isArray(result) ? typeof result[0] === "string" ? result[0] : Array.isArray(result[0]) ? result[0][0] : null : null;
    if (typeof value !== "string" || !value.trim()) throw new Error("Malay translation returned an empty response.");
    translated.push(value + (/\s$/.test(part) ? " " : ""));
  }
  return translated.join("");
};

const cloneValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map((item) => cloneValue(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, cloneValue(child)]));
  }
  return value;
};

const setAtPath = (target: unknown, path: TranslatePath, value: unknown) => {
  if (path.length === 0) return value;
  if (!target || typeof target !== "object") return target;

  const container = target as Record<string, unknown> | unknown[];
  let cursor: Record<string, unknown> | unknown[] = container;
  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index];
    const next = Array.isArray(cursor) && typeof segment === "number" ? cursor[segment] : (cursor as Record<string, unknown>)[String(segment)];
    if (!next || typeof next !== "object") return target;
    cursor = next as Record<string, unknown> | unknown[];
  }

  const lastSegment = path[path.length - 1];
  if (Array.isArray(cursor) && typeof lastSegment === "number") {
    cursor[lastSegment] = value;
  } else {
    (cursor as Record<string, unknown>)[String(lastSegment)] = value;
  }
  return target;
};

const chunk = <T,>(items: T[], size: number) => {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
};

const translateSingle = async (text: string, targetLanguage: "en" | "ms" = "en") => {
  const protectedValue = protectTranslation(text, targetLanguage);
  if (targetLanguage === "ms") {
    return protectedValue.restore(await translateMalayText(protectedValue.text));
  }
  const params = new URLSearchParams({
    client: "gtx",
    sl: "zh-CN",
    tl: "en",
    dt: "t",
    q: protectedValue.text,
  });

  const response = await fetch("https://translate.googleapis.com/translate_a/single", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": "FLASH CAST Website Translation",
    },
    body: params,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.error?.message || "Google Translate request failed");
  }

  const translatedParts = result?.[0];
  if (!Array.isArray(translatedParts)) {
    throw new Error("Google Translate response did not include translated text");
  }

  const translated = translatedParts.map((part: unknown) => (Array.isArray(part) ? part[0] || "" : "")).join("");
  if (!translated.trim()) throw new Error("Translation returned an empty response. No content was saved.");
  return protectedValue.restore(translated);
};

const translateBatch = async (tasks: TranslateTask[], targetLanguage: "en" | "ms" = "en"): Promise<string[]> => {
  if (tasks.length === 0) return [];
  if (targetLanguage === "ms") {
    const result: string[] = [];
    for (const group of chunk(tasks, 3)) result.push(...await Promise.all(group.map((task) => translateSingle(task.value, targetLanguage))));
    return result;
  }
  return Promise.all(tasks.map((task) => translateSingle(task.value, targetLanguage)));
};

export const isBlankValue = (value: unknown) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length === 0;
  return false;
};

export const translateValue = async (value: unknown, targetLanguage: "en" | "ms" = "en") => {
  if (typeof value === "string") {
    const [translated] = await translateBatch([{ path: [], value, format: isHtmlText(value) ? "html" : "text" }], targetLanguage);
    return translated || value;
  }

  const tasks = collectTranslateTasks(value).filter((task) => !stableTranslationField.test(String(task.path[task.path.length - 1] || "")));

  const translatedByPath = new Map<string, string>();
  for (const format of ["text", "html"] as const) {
    const formattedTasks = tasks.filter((task) => task.format === format);
    for (const batch of chunk(formattedTasks, 20)) {
      const translated = await translateBatch(batch, targetLanguage);
      batch.forEach((task, index) => translatedByPath.set(JSON.stringify(task.path), translated[index] || task.value));
    }
  }

  const localizeStableLinks = (child: unknown, field = ""): unknown => {
    if (stableTranslationField.test(field)) {
      return typeof child === "string" && /^(?:href|url|link|button_url|primary_url|secondary_url)$/.test(field)
        ? localizeContentLink(child, targetLanguage) : cloneValue(child);
    }
    if (Array.isArray(child)) return child.map(item => localizeStableLinks(item));
    if (child && typeof child === "object") return Object.fromEntries(Object.entries(child).map(([key, item]) => [key, localizeStableLinks(item, key)]));
    return child;
  };
  const cloned = localizeStableLinks(value);
  for (const task of tasks) {
    const key = JSON.stringify(task.path);
    const translatedText = translatedByPath.get(key) || task.value;
    if (task.path.length === 0) {
      return translatedText;
    }
    setAtPath(cloned, task.path, translatedText);
  }

  return cloned;
};
