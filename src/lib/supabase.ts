import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const PUBLIC_READ_TIMEOUT_MS = 10_000;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const getRequestUrl = (input: Parameters<typeof fetch>[0]) => {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
};

const getRequestMethod = (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) =>
  (init?.method || (typeof Request !== "undefined" && input instanceof Request ? input.method : "GET")).toUpperCase();

const shouldTimeoutReadRequest = (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
  const url = getRequestUrl(input);
  const method = getRequestMethod(input, init);
  if (method === "POST" && url.includes("/rest/v1/rpc/get_public_home_bundle")) return true;
  if (method !== "GET" && method !== "HEAD") return false;
  return url.includes("/rest/v1/");
};

const fetchWithReadTimeout: typeof fetch = async (input, init) => {
  if (!shouldTimeoutReadRequest(input, init) || typeof AbortController === "undefined") {
    return fetch(input, init);
  }

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), PUBLIC_READ_TIMEOUT_MS);
  const upstreamSignal = init?.signal;
  const abortFromUpstream = () => controller.abort();
  upstreamSignal?.addEventListener("abort", abortFromUpstream, { once: true });

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    globalThis.clearTimeout(timeoutId);
    upstreamSignal?.removeEventListener("abort", abortFromUpstream);
  }
};

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        fetch: fetchWithReadTimeout,
      },
    })
  : null;

export const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.");
  }

  return supabase;
};
