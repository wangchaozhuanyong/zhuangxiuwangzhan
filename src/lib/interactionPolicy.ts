/** The single source of timings and cache policy for both site surfaces. */
export const INTERACTION_POLICY = {
  feedbackDelay: 180,
  recoveryDelay: 5_000,
  readTimeout: 15_000,
  searchDelay: 300,
  publicStaleTime: 60_000,
  adminListStaleTime: 300_000,
  defaultStaleTime: 120_000,
  gcTime: 1_800_000,
} as const;

export type InteractionState = "loading" | "refreshing" | "success" | "empty" | "error" | "offline" | "submitting";

export function getInteractionState(input: {
  hasData: boolean; fetching: boolean; error?: unknown; empty?: boolean; offline?: boolean; submitting?: boolean;
}): InteractionState {
  if (input.submitting) return "submitting";
  if (!input.hasData && input.offline) return "offline";
  if (!input.hasData && input.error) return "error";
  if (!input.hasData) return "loading";
  if (input.fetching) return "refreshing";
  return input.empty ? "empty" : "success";
}

/** Cancellation and a deadline also work for composite reads and mocked transports. */
export async function runReadQuery<T>(upstream: AbortSignal | undefined, read: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort(upstream?.reason);
  if (upstream?.aborted) abort();
  else upstream?.addEventListener("abort", abort, { once: true });
  let timer: ReturnType<typeof setTimeout>;
  let rejectAbort: () => void;
  const cancelled = new Promise<never>((_, reject) => {
    rejectAbort = () => reject(controller.signal.reason ?? new DOMException("Read cancelled", "AbortError"));
    controller.signal.addEventListener("abort", rejectAbort, { once: true });
    timer = setTimeout(() => controller.abort(new DOMException("Read deadline exceeded", "TimeoutError")), INTERACTION_POLICY.readTimeout);
  });
  try {
    if (controller.signal.aborted) throw controller.signal.reason;
    return await Promise.race([read(controller.signal), cancelled]);
  } finally {
    clearTimeout(timer!);
    upstream?.removeEventListener("abort", abort);
    controller.signal.removeEventListener("abort", rejectAbort!);
  }
}
