/** The shared shell is unconditional; browser validators apply to final HTML. */
export function createUnconditionalPublicShellRequest(request: Request) {
  const url = new URL("/", request.url);
  const headers = new Headers(request.headers);
  for (const name of ["if-none-match", "if-modified-since", "if-match", "if-unmodified-since", "range", "if-range"]) headers.delete(name);
  return new Request(url.toString(), { method: "GET", headers });
}

/** A Workers response stream belongs to the request that opened it. Read it there before sharing. */
export async function snapshotPublicResponse(response: Response) {
  return {
    status: response.status,
    statusText: response.statusText,
    headers: Array.from(response.headers.entries()),
    body: response.body === null ? null : await response.arrayBuffer(),
  };
}

export type PublicResponseSnapshot = Awaited<ReturnType<typeof snapshotPublicResponse>>;

export function restorePublicResponse({ body, ...init }: PublicResponseSnapshot) {
  return new Response(body, init);
}

type GenerationMetadata = { cacheWrite: Promise<void> | null; state?: "miss" | "bypass-admin" | "bypass-not-found" };
type GeneratedDocument = GenerationMetadata & { response: Response };

/** Share the unconditional document's bytes; each caller constructs its own response stream. */
export function createPublicHtmlGenerationCoalescer() {
  const pending = new Map<string, Promise<GenerationMetadata & { document: PublicResponseSnapshot }>>();
  return async (key: string, generate: () => Promise<GeneratedDocument>): Promise<GeneratedDocument> => {
    let flight = pending.get(key);
    if (!flight) {
      flight = generate().then(async ({ response, ...metadata }) => ({
        ...metadata, document: await snapshotPublicResponse(response),
      }));
      pending.set(key, flight);
      const current = flight;
      const clear = () => { if (pending.get(key) === current) pending.delete(key); };
      // Keep the flight joinable until its cache write finishes, without making
      // the first response wait for that background write.
      void flight.then(result => result.cacheWrite).then(clear, clear);
    }
    const { document, ...metadata } = await flight;
    return { ...metadata, response: restorePublicResponse(document) };
  };
}
