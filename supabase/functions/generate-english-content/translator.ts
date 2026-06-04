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
  let cursor: any = container;
  for (let index = 0; index < path.length - 1; index += 1) {
    cursor = cursor[path[index] as any];
    if (cursor === undefined || cursor === null) return target;
  }

  cursor[path[path.length - 1] as any] = value;
  return target;
};

const chunk = <T,>(items: T[], size: number) => {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
};

const translateSingle = async (text: string) => {
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

const translateBatch = async (tasks: TranslateTask[]): Promise<string[]> => {
  if (tasks.length === 0) return [];
  return Promise.all(tasks.map((task) => translateSingle(task.value)));
};

export const isBlankValue = (value: unknown) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length === 0;
  return false;
};

export const translateValue = async (value: unknown) => {
  if (typeof value === "string") {
    const [translated] = await translateBatch([{ path: [], value, format: isHtmlText(value) ? "html" : "text" }]);
    return translated || value;
  }

  const tasks = collectTranslateTasks(value);
  if (tasks.length === 0) return value;

  const translatedByPath = new Map<string, string>();
  for (const format of ["text", "html"] as const) {
    const formattedTasks = tasks.filter((task) => task.format === format);
    for (const batch of chunk(formattedTasks, 20)) {
      const translated = await translateBatch(batch);
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
