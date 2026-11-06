/** The shared shell is unconditional; browser validators apply to final HTML. */
export function createUnconditionalPublicShellRequest(request: Request) {
  const url = new URL("/", request.url);
  const headers = new Headers(request.headers);
  for (const name of ["if-none-match", "if-modified-since", "if-match", "if-unmodified-since", "range", "if-range"]) headers.delete(name);
  return new Request(url.toString(), { method: "GET", headers });
}

/** Share only unconditional generated documents; every caller owns its response. */
export function createPublicHtmlGenerationCoalescer<T extends { response: Response; cacheWrite: Promise<unknown> | null }>() {
  const pending = new Map<string, Promise<T>>();
  return async (key: string, generate: () => Promise<T>): Promise<T> => {
    let flight = pending.get(key);
    if (!flight) {
      flight = generate();
      pending.set(key, flight);
      const current = flight;
      const clear = () => { if (pending.get(key) === current) pending.delete(key); };
      // Keep the flight joinable until its cache write finishes, without making
      // the first response wait for that background write.
      void flight.then(result => result.cacheWrite).then(clear, clear);
    }
    const result = await flight;
    return { ...result, response: result.response.clone() };
  };
}
