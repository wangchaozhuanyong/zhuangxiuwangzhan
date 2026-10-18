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

const stableMalayPath = /^(?:id|slug|path|href|url|src|icon|image|image_url|button_url|type|step|sku)$/;

const translateMalayText = async (text: string): Promise<string> => {
  const tokens: string[] = [];
  const protectedText = text.replace(/\{[^{}]+\}|<[^>]+>|https?:\/\/[^\s<>]+|\bFLASH CAST(?: SDN\. BHD\.)?\b|\bWhatsApp\b/g, (token) => {
    tokens.push(token); return `ZXQ${tokens.length - 1}QXZ`;
  });
  const parts: string[] = [];
  let remaining = protectedText;
  while (remaining.length > 1800) {
    const space = remaining.lastIndexOf(" ", 1800);
    const boundary = space > 900 ? space + 1 : 1800;
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
  let result = translated.join("");
  for (let index = 0; index < tokens.length; index++) {
    const token = `ZXQ${index}QXZ`;
    if (result.split(token).length !== 2) throw new Error("Malay translation changed a protected placeholder. No content was saved.");
    result = result.replaceAll(token, tokens[index]);
  }
  return result;
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
  if (targetLanguage === "ms") {
    return translateMalayText(text);
  }
  const params = new URLSearchParams({
    client: "gtx",
    sl: "zh-CN",
    tl: "en",
    dt: "t",
    q: text,
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

  return translatedParts.map((part: unknown) => (Array.isArray(part) ? part[0] || "" : "")).join("") || text;
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

  const tasks = collectTranslateTasks(value).filter((task) => targetLanguage !== "ms" || !stableMalayPath.test(String(task.path[task.path.length - 1] || "")));
  if (tasks.length === 0) return value;

  const translatedByPath = new Map<string, string>();
  for (const format of ["text", "html"] as const) {
    const formattedTasks = tasks.filter((task) => task.format === format);
    for (const batch of chunk(formattedTasks, 20)) {
      const translated = await translateBatch(batch, targetLanguage);
      batch.forEach((task, index) => translatedByPath.set(JSON.stringify(task.path), translated[index] || task.value));
    }
  }

  const cloned = cloneValue(value);
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
