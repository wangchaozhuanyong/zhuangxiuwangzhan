import { PUBLIC_HTML_CACHE_TAG } from "./publicHtmlCache";

const VALID_FOR_MS = 5_000;
type Settings = { updated_at?: string | null };
type Snapshot = { revision: string; startedAt: number; expiresAt: number };
type SnapshotCache = {
  match: (request: Request) => Promise<Response | undefined>;
  put: (request: Request, response: Response) => Promise<void>;
};
type ReadOptions<T> = {
  key: string;
  cache?: SnapshotCache | null;
  snapshotRequest?: Request;
  readFull: () => Promise<T | null>;
  readRevision: () => Promise<string | null>;
  background?: (promise: Promise<unknown>) => void;
  onColdRead?: () => void;
};

/** A hard five-second lease, measured from source-read start, never cache-read time. */
export function createPublicSettingsReader<T extends Settings = Settings>({ now = () => Date.now() }: { now?: () => number } = {}) {
  const fullValues = new Map<string, { value: T; startedAt: number; expiresAt: number }>();
  const versions = new Map<string, Snapshot>();
  const fullReads = new Map<string, Promise<T | null>>();
  const revisionReads = new Map<string, Promise<string | null>>();
  const valid = (snapshot: Snapshot | undefined): boolean => !!snapshot
    && typeof snapshot.revision === "string" && !!snapshot.revision.trim()
    && Number.isFinite(snapshot.startedAt) && Number.isFinite(snapshot.expiresAt)
    && snapshot.startedAt <= now() && snapshot.expiresAt > now()
    && snapshot.expiresAt === snapshot.startedAt + VALID_FOR_MS;
  const remember = async (options: ReadOptions<T>, revision: string, startedAt: number) => {
    const snapshot = { revision, startedAt, expiresAt: startedAt + VALID_FOR_MS };
    if (!valid(snapshot)) return;
    versions.set(options.key, snapshot);
    if (!options.cache || !options.snapshotRequest) return;
    const write = Promise.resolve().then(() => options.cache!.put(options.snapshotRequest!, Response.json(snapshot, { headers: {
      "cache-control": `public, max-age=${Math.ceil((snapshot.expiresAt - now()) / 1000)}`,
      "cache-tag": PUBLIC_HTML_CACHE_TAG,
    } }))).catch(() => undefined);
    if (options.background) options.background(write);
    else await write;
  };
  const full = (options: ReadOptions<T>): Promise<T | null> => {
    const cached = fullValues.get(options.key);
    if (cached && cached.expiresAt > now()) return Promise.resolve(cached.value);
    const pending = fullReads.get(options.key);
    if (pending) return pending;
    const startedAt = now();
    const read = options.readFull().catch(() => null).then(async value => {
      if (value?.updated_at && startedAt + VALID_FOR_MS > now()) {
        fullValues.set(options.key, { value, startedAt, expiresAt: startedAt + VALID_FOR_MS });
        await remember(options, value.updated_at, startedAt);
      }
      return value;
    }).finally(() => { fullReads.delete(options.key); });
    fullReads.set(options.key, read);
    return read;
  };
  const revision = (options: ReadOptions<T>): Promise<string | null> => {
    const current = versions.get(options.key);
    if (valid(current)) return Promise.resolve(current.revision);
    const pending = revisionReads.get(options.key);
    if (pending) return pending;
    const read = (async () => {
      let known = current;
      if (options.cache && options.snapshotRequest) {
        try {
          const response = await options.cache.match(options.snapshotRequest);
          const cached = response ? await response.json() as Snapshot : undefined;
          if (valid(cached)) { versions.set(options.key, cached); return cached.revision; }
          // An expired but well-formed observation is only a hint to issue the
          // smaller version SELECT; it never authorizes serving cached HTML.
          if (cached && typeof cached.revision === "string" && cached.revision.trim()
            && Number.isFinite(cached.startedAt) && cached.startedAt <= now()
            && cached.expiresAt === cached.startedAt + VALID_FOR_MS) known = cached;
        } catch { /* A missing/broken snapshot must fall back to the source. */ }
      }
      if (!known || fullReads.has(options.key)) {
        // A genuinely cold request needs these same settings to generate HTML.
        // Starting preparation here overlaps its shell/route reads with this read.
        const loading = full(options);
        options.onColdRead?.();
        const value = await loading;
        const observed = versions.get(options.key);
        return value?.updated_at && valid(observed) ? value.updated_at : null;
      }
      const startedAt = now();
      const value = await options.readRevision().catch(() => null);
      if (!value || startedAt + VALID_FOR_MS <= now()) return null;
      await remember(options, value, startedAt);
      return value;
    })().finally(() => { revisionReads.delete(options.key); });
    revisionReads.set(options.key, read);
    return read;
  };
  return { full, revision, peek: (key: string) => versions.get(key) };
}
