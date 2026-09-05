import {
  createWebsiteVisit,
  forwardWebsiteVisit,
  isVisitCollectionConfigured,
  type WebsiteVisitEnvironment,
} from "../service/websiteVisitService";

const json = (ok: boolean, status: number) =>
  new Response(JSON.stringify({ ok }), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "private, no-store",
    },
  });

async function readBody(request: Request): Promise<unknown> {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new Error("invalid");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("empty");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 4096) throw new Error("oversized");
      chunks.push(chunk.value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function handleWebsiteVisit(
  request: Request,
  env: WebsiteVisitEnvironment,
) {
  if (request.method !== "POST") return json(false, 405);
  if (!isVisitCollectionConfigured(env)) return json(false, 503);
  let event;
  try {
    event = createWebsiteVisit(request, await readBody(request));
  } catch {
    return json(false, 400);
  }
  if (!event) return json(false, 400);
  const accepted = await forwardWebsiteVisit(event, env);
  return json(accepted, accepted ? 200 : 503);
}
