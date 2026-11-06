const stages = ["revision", "cache", "route", "data", "transform"] as const;
type Stage = typeof stages[number];

/** Timings belong to this request, never to a previously cached response. */
export function createPublicServerTiming() {
  const started = performance.now();
  const durations: Partial<Record<Stage, number>> = {};
  const start = (stage: Stage) => {
    const at = performance.now();
    return () => { durations[stage] = (durations[stage] || 0) + performance.now() - at; };
  };
  const measure = async <T>(stage: Stage, operation: () => Promise<T>) => {
    const finish = start(stage);
    try { return await operation(); } finally { finish(); }
  };
  const finish = (response: Response) => {
    const headers = new Headers(response.headers);
    headers.set("server-timing", [...stages.map(stage => `${stage};dur=${(durations[stage] || 0).toFixed(1)}`),
      `total;dur=${(performance.now() - started).toFixed(1)}`].join(", "));
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  };
  return { start, measure, finish };
}
