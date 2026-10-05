import { useQuery, useQueryClient, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import { claimPublicQuerySeed, documentSeedTime } from "@/lib/publicQuerySeedCache";
import { runReadQuery } from "@/lib/interactionPolicy";

/** Shared read lifecycle; an enabled first read also waits while offline-paused. */
export function useInteractionQuery<TQueryFnData = unknown, TError = Error, TData = TQueryFnData>(
  options: UseQueryOptions<TQueryFnData, TError, TData, QueryKey>,
) {
  const client = useQueryClient();
  const read = options.queryFn;
  const seed = () => claimPublicQuerySeed(client, options.queryKey) as TQueryFnData | undefined;
  const result = useQuery({
    ...options,
    initialData: options.initialData ?? seed,
    initialDataUpdatedAt: options.initialDataUpdatedAt ?? documentSeedTime,
    queryFn: typeof read === "function" ? (context) => runReadQuery(context.signal, async (signal) => {
      const value = await read({ ...context, signal });
      // A recovered fallback is useful on first entry; it must not replace a
      // previously successful homepage after a failed background read.
      if (value && typeof value === "object" && "reason" in value && value.reason === "remote-error" && client.getQueryData(options.queryKey) !== undefined) {
        throw new Error("Content refresh unavailable");
      }
      return value;
    }) : read,
  });
  // A disabled observer may share the same paused query. Use the observer's
  // resolved enabled state (including callback/skipToken), not pending alone.
  const isLoading = result.isLoading || (result.isEnabled && result.isPending && result.isPaused && result.data === undefined);
  return { ...result, isLoading, isInitialLoading: isLoading, isInitialError: result.isError && result.data === undefined, isRefreshing: result.isFetching && result.data !== undefined, refreshError: result.isError && result.data !== undefined ? result.error : null };
}
