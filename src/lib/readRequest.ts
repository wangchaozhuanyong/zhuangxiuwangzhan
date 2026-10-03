/** Attach query cancellation to the existing PostgREST builder, without a new data layer. */
export function withReadSignal<T>(request: T, signal?: AbortSignal): T {
  const cancellable = request as T & { abortSignal?: (signal: AbortSignal) => T };
  return signal && typeof cancellable.abortSignal === "function" ? cancellable.abortSignal(signal) : request;
}
