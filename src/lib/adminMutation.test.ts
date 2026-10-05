import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminMutationError, persistAdminRecord } from "@/backend/modules/system";
import { archiveOrDeleteAdminRecord, formatAdminMutationError, saveAdminRecord } from "@/lib/adminMutation";
import { getPublicSyncIssues, resolvePublicSyncIssue } from "@/lib/publicSyncRecovery";

type Row = Record<string, unknown>;
type TransportError = { message: string; code?: string };
type Result = { data: Row | null; error: TransportError | null };
type Filter = { field: string; value: unknown; operator: "eq" | "is" };
type Write = { operation: string; filters: Filter[]; payload: Row; matched: boolean };
const { from, invoke, getUser } = vi.hoisted(() => ({ from: vi.fn(), invoke: vi.fn(), getUser: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ requireSupabase: () => ({ from, functions: { invoke }, auth: { getUser } }) }));

const initialTime = "2026-10-05T01:02:03.123456+00:00";
const changedTime = "2026-10-05T01:02:03.123457+00:00";
let row: Row | null;
let writes: Write[];
let audits: Row[];
let readError: TransportError | null;
let writeError: TransportError | null;
let beforeWrite: (() => void) | undefined;
let readGate: (() => Promise<void>) | undefined;

// Only the Supabase transport is simulated. Service, repository, facade and QueryClient are real.
function transportBuilder(table: string) {
  let operation = "read";
  let payload: Row = {};
  const filters: Filter[] = [];
  async function execute(): Promise<Result> {
    if (table === "admin_audit_logs") { audits.push(payload); return { data: null, error: null }; }
    if (operation === "read") {
      const snapshot = row ? { ...row } : null;
      if (readGate) await readGate();
      return { data: snapshot, error: readError };
    }
    beforeWrite?.();
    const matched = operation === "insert" || Boolean(row && filters.every(({ field, value }) => row?.[field] === value));
    writes.push({ operation, filters: [...filters], payload: { ...payload }, matched });
    if (writeError) return { data: null, error: writeError };
    if (!matched) return { data: null, error: null };
    const previous = row ? { ...row } : null;
    if (operation === "delete") { row = null; return { data: previous, error: null }; }
    row = { ...(operation === "insert" ? { id: "new-record" } : row), ...payload };
    // Models the existing database timestamp trigger, not a second service implementation.
    if (operation === "insert" || Object.prototype.hasOwnProperty.call(row, "updated_at")) row.updated_at = changedTime;
    return { data: { ...row }, error: null };
  }
  const builder = {
    select: () => builder,
    eq: (field: string, value: unknown) => { filters.push({ field, value, operator: "eq" }); return builder; },
    is: (field: string, value: null) => { filters.push({ field, value, operator: "is" }); return builder; },
    insert: (value: Row) => { operation = "insert"; payload = value; return builder; },
    update: (value: Row) => { operation = "update"; payload = value; return builder; },
    delete: () => { operation = "delete"; return builder; },
    single: execute,
    maybeSingle: execute,
    then: <TResult1 = Result, TResult2 = never>(
      fulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
      rejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ) => execute().then(fulfilled, rejected),
  };
  return builder;
}

function client() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  queryClient.setQueryData(["admin", "blog_posts"], [{ title: "Old fixture" }]);
  queryClient.setQueryData(["published", "blog"], [{ title: "Old fixture" }]);
  return queryClient;
}

beforeEach(() => {
  row = { id: "fixture", title: "Original", status: "published", updated_at: initialTime };
  writes = []; audits = []; readError = null; writeError = null; beforeWrite = undefined; readGate = undefined;
  from.mockReset().mockImplementation(transportBuilder);
  invoke.mockReset().mockResolvedValue({ data: { ok: true, cache_invalidation: { ok: true, revision: changedTime } }, error: null });
  getUser.mockReset().mockResolvedValue({ data: { user: { id: "fixture-admin" } } });
  getPublicSyncIssues().forEach(({ key }) => resolvePublicSyncIssue(key));
});

describe("ordinary admin writes through the real persistence and delivery chain", () => {
  it("admits one of two writes that both read the same version, without auditing or delivering the losing write", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    let readCount = 0;
    readGate = async () => { if (++readCount === 2) release(); await gate; };
    const queryClient = client();
    const invalidation = vi.spyOn(queryClient, "invalidateQueries");
    try {
      const results = await Promise.allSettled(["First", "Second"].map((title) => saveAdminRecord({
        table: "blog_posts", id: "fixture", expectedUpdatedAt: initialTime, payload: { title }, queryClient,
      })));
      expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
      const rejected = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
      expect(rejected?.reason).toBeInstanceOf(AdminMutationError);
      expect(rejected?.reason).toMatchObject({ code: "conflict", stage: "write" });
      expect(rejected?.reason.message).toContain("已经被别人修改");
      expect(writes.filter(({ matched }) => matched)).toHaveLength(1);
      for (const write of writes) expect(write.filters).toContainEqual({ field: "updated_at", value: initialTime, operator: "eq" });
      expect(row?.title).toBe("First");
      expect(audits).toHaveLength(1);
      expect(invoke).toHaveBeenCalledTimes(1);
      expect(invalidation).toHaveBeenCalledTimes(1);
      expect(queryClient.getQueryState(["published", "blog"])?.isInvalidated).toBe(true);
    } finally { queryClient.clear(); }
  });

  it.each([true, false])("rejects a %s soft-delete whose version changes between read and write", async (softDelete) => {
    beforeWrite = () => { row = { ...row, title: "Other editor", updated_at: changedTime }; };
    await expect(archiveOrDeleteAdminRecord({ table: "blog_posts", id: "fixture", expectedUpdatedAt: initialTime, softDelete }))
      .rejects.toMatchObject({ code: "conflict", stage: "write" });
    expect(row).toMatchObject({ title: "Other editor", status: "published" });
    expect(writes[0]?.operation).toBe(softDelete ? "update" : "delete");
    expect(writes[0]?.filters).toContainEqual({ field: "updated_at", value: initialTime, operator: "eq" });
    expect(audits).toHaveLength(0);
    expect(invoke).not.toHaveBeenCalled();
  });

  it.each(["save", "archive", "delete"])("rejects a previously stale %s before issuing a write", async (operation) => {
    row!.updated_at = changedTime;
    const result = operation === "save"
      ? saveAdminRecord({ table: "blog_posts", id: "fixture", expectedUpdatedAt: initialTime, payload: { title: "Stale" } })
      : archiveOrDeleteAdminRecord({ table: "blog_posts", id: "fixture", expectedUpdatedAt: initialTime, softDelete: operation === "archive" });
    await expect(result).rejects.toMatchObject({ code: "conflict", stage: "validation" });
    expect(writes).toHaveLength(0);
    expect(audits).toHaveLength(0);
    expect(invoke).not.toHaveBeenCalled();
  });

  it("distinguishes a real write error from a successful zero-row response", async () => {
    writeError = { code: "PGRST116", message: "database write rejected" };
    await expect(saveAdminRecord({ table: "blog_posts", id: "fixture", payload: { title: "Attempt" } }))
      .rejects.toMatchObject({ code: "database", stage: "write" });
    expect(row?.title).toBe("Original");
    expect(audits).toHaveLength(0);
    expect(invoke).not.toHaveBeenCalled();
    expect(getPublicSyncIssues()).toHaveLength(0);
  });

  it("keeps the read error stage and does not turn a failed read into a missing record", async () => {
    readError = { message: "network unavailable" };
    await expect(saveAdminRecord({ table: "blog_posts", id: "fixture", payload: {} }))
      .rejects.toMatchObject({ code: "database", stage: "read", message: "服务暂时不可用，请稍后再试。" });
    expect(writes).toHaveLength(0);
  });

  it("retains missing-record validation", async () => {
    row = null;
    await expect(saveAdminRecord({ table: "blog_posts", id: "fixture", payload: {} }))
      .rejects.toMatchObject({ code: "validation", stage: "validation", message: "保存失败：这条数据已经不存在，请刷新列表。" });
  });

  it.each([undefined, null])("guards the read snapshot even when the caller passes %s for its historical version", async (expectedUpdatedAt) => {
    await saveAdminRecord({ table: "blog_posts", id: "fixture", expectedUpdatedAt, payload: { title: "Saved" } });
    expect(writes[0]?.filters).toContainEqual({ field: "updated_at", value: initialTime, operator: "eq" });
  });

  it("uses IS NULL for a nullable timestamp instead of accidentally excluding the record", async () => {
    row!.updated_at = null;
    await saveAdminRecord({ table: "blog_posts", id: "fixture", expectedUpdatedAt: null, payload: { title: "Saved" } });
    expect(writes[0]?.filters).toContainEqual({ field: "updated_at", value: null, operator: "is" });
    expect(row?.title).toBe("Saved");
  });

  it("rejects an expected non-null timestamp when the actual timestamp is null", async () => {
    row!.updated_at = null;
    await expect(saveAdminRecord({ table: "blog_posts", id: "fixture", expectedUpdatedAt: initialTime, payload: {} }))
      .rejects.toMatchObject({ code: "conflict", stage: "validation" });
    expect(writes).toHaveLength(0);
  });

  it("uses an existing numeric version if the record has no timestamp column", async () => {
    row = { id: "fixture", file_name: "Original", version: 3 };
    await saveAdminRecord({ table: "media_assets", id: "fixture", payload: { file_name: "Saved" } });
    expect(writes[0]?.filters).toContainEqual({ field: "version", value: 3, operator: "eq" });
    expect(writes[0]?.filters.some(({ field }) => field === "updated_at")).toBe(false);
    expect(writes[0]?.payload.version).toBe(4);
    expect(row?.version).toBe(4);
  });

  it("admits one competing version-only write even when the database has no version trigger", async () => {
    row = { id: "fixture", file_name: "Original", version: 3 };
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    let readCount = 0;
    readGate = async () => { if (++readCount === 2) release(); await gate; };
    const results = await Promise.allSettled(["First", "Second"].map((file_name) => saveAdminRecord({ table: "media_assets", id: "fixture", payload: { file_name } })));
    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    expect(results.find((result): result is PromiseRejectedResult => result.status === "rejected")?.reason)
      .toMatchObject({ code: "conflict", stage: "write" });
    expect(row).toMatchObject({ file_name: "First", version: 4 });
    expect(writes.filter(({ matched }) => !matched)).toHaveLength(1);
    expect(audits).toHaveLength(1);
  });

  it.each([true, false])("uses a safe existing numeric version for %s removal", async (softDelete) => {
    row = { id: "fixture", status: "draft", version: 3 };
    const saved = await archiveOrDeleteAdminRecord({ table: "media_assets", id: "fixture", softDelete });
    expect(writes[0]?.filters).toContainEqual({ field: "version", value: 3, operator: "eq" });
    if (softDelete) {
      expect(writes[0]?.payload.version).toBe(4);
      expect(saved).toMatchObject({ status: "archived", version: 4 });
    } else {
      expect(row).toBeNull();
      expect(saved.version).toBe(3);
    }
  });

  it.each([1.5, Number.MAX_SAFE_INTEGER, Infinity])("does not fabricate a counter from unsafe version %s", async (version) => {
    row = { id: "fixture", version };
    await saveAdminRecord({ table: "synthetic_legacy", id: "fixture", payload: { title: "Saved" } });
    expect(writes[0]?.filters).toEqual([{ field: "id", value: "fixture", operator: "eq" }]);
    expect(writes[0]?.payload).not.toHaveProperty("version");
  });

  it("keeps legacy tables with no version field compatible without inventing a column", async () => {
    row = { id: "fixture", sort_order: 1 };
    await saveAdminRecord({ table: "project_images", id: "fixture", expectedUpdatedAt: null, payload: { sort_order: 2 } });
    expect(writes[0]?.filters).toEqual([{ field: "id", value: "fixture", operator: "eq" }]);
    expect(row?.sort_order).toBe(2);
  });

  it("detects stale microseconds that JavaScript Date would otherwise round together", async () => {
    row!.updated_at = changedTime;
    await expect(saveAdminRecord({ table: "blog_posts", id: "fixture", expectedUpdatedAt: initialTime, payload: {} }))
      .rejects.toMatchObject({ code: "conflict", stage: "validation" });
    expect(writes).toHaveLength(0);
  });

  it("accepts equivalent timezone representations and filters with the exact database value", async () => {
    await saveAdminRecord({ table: "blog_posts", id: "fixture", expectedUpdatedAt: "2026-10-05T09:02:03.123456+08:00", payload: {} });
    expect(writes[0]?.filters).toContainEqual({ field: "updated_at", value: initialTime, operator: "eq" });
  });

  it("preserves custom ID fields and strips client-controlled version fields", async () => {
    row = { key: "fixture", updated_at: initialTime };
    await saveAdminRecord({ table: "synthetic_settings", idField: "key", id: "fixture", payload: { value: "Saved", id: "bad", updated_at: "bad", version: 999, created_at: "bad" } });
    expect(writes[0]?.filters).toContainEqual({ field: "key", value: "fixture", operator: "eq" });
    expect(writes[0]?.payload).toEqual({ value: "Saved" });
  });

  it("preserves inserts with explicit IDs and no unnecessary pre-read", async () => {
    const saved = await saveAdminRecord({ table: "blog_posts", payload: { id: "explicit", title: "Created", status: "draft", version: 99 } });
    expect(saved.id).toBe("explicit");
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({ operation: "insert", payload: { id: "explicit", title: "Created", status: "draft" } });
    expect(writes[0]?.payload).not.toHaveProperty("version");
    expect(invoke).not.toHaveBeenCalled();
  });

  it("keeps a successful save when public sync fails, then retries only delivery and cache", async () => {
    invoke.mockResolvedValueOnce({ data: null, error: { message: "delivery unavailable" } });
    const queryClient = client();
    const invalidation = vi.spyOn(queryClient, "invalidateQueries");
    try {
      await expect(saveAdminRecord({ table: "blog_posts", id: "fixture", payload: { title: "Saved" }, queryClient }))
        .resolves.toMatchObject({ title: "Saved" });
      expect(getPublicSyncIssues()).toHaveLength(1);
      await getPublicSyncIssues()[0]!.retry();
      expect(writes).toHaveLength(1);
      expect(audits).toHaveLength(1);
      expect(invoke).toHaveBeenCalledTimes(2);
      expect(invalidation).toHaveBeenCalledTimes(2);
      expect(getPublicSyncIssues()).toHaveLength(0);
    } finally { queryClient.clear(); }
  });

  it("keeps success after an audit failure and still refreshes caches and public delivery once", async () => {
    getUser.mockRejectedValueOnce(new Error("audit unavailable"));
    const queryClient = client();
    const invalidation = vi.spyOn(queryClient, "invalidateQueries");
    try {
      await expect(saveAdminRecord({ table: "blog_posts", id: "fixture", payload: {}, queryClient })).resolves.toMatchObject({ id: "fixture" });
      expect(writes).toHaveLength(1); expect(invalidation).toHaveBeenCalledTimes(1); expect(invoke).toHaveBeenCalledTimes(1);
    } finally { queryClient.clear(); }
  });

  it("keeps the saved row when client invalidation fails and retries cache without repeating write, audit or public sync", async () => {
    const queryClient = client();
    const invalidation = vi.spyOn(queryClient, "invalidateQueries").mockRejectedValueOnce(new Error("cache unavailable"));
    try {
      await expect(saveAdminRecord({ table: "blog_posts", id: "fixture", payload: {}, queryClient })).resolves.toMatchObject({ id: "fixture" });
      expect(getPublicSyncIssues()).toHaveLength(1);
      await getPublicSyncIssues()[0]!.retry();
      expect(writes).toHaveLength(1); expect(audits).toHaveLength(1); expect(invoke).toHaveBeenCalledTimes(1);
      expect(invalidation).toHaveBeenCalledTimes(2); expect(getPublicSyncIssues()).toHaveLength(0);
    } finally { queryClient.clear(); }
  });

  it("does not repeat a recovered public sync when the client-cache step still needs another retry", async () => {
    invoke.mockResolvedValueOnce({ data: null, error: { message: "delivery unavailable" } });
    const queryClient = client();
    const invalidation = vi.spyOn(queryClient, "invalidateQueries")
      .mockRejectedValueOnce(new Error("initial cache unavailable"))
      .mockRejectedValueOnce(new Error("retry cache unavailable"));
    try {
      await saveAdminRecord({ table: "blog_posts", id: "fixture", payload: {}, queryClient });
      await expect(getPublicSyncIssues()[0]!.retry()).rejects.toThrow("retry cache unavailable");
      expect(getPublicSyncIssues()).toHaveLength(1);
      await getPublicSyncIssues()[0]!.retry();
      expect(writes).toHaveLength(1); expect(audits).toHaveLength(1); expect(invoke).toHaveBeenCalledTimes(2);
      expect(invalidation).toHaveBeenCalledTimes(3); expect(getPublicSyncIssues()).toHaveLength(0);
    } finally { queryClient.clear(); }
  });

  it("keeps a newer failed save pending when an older delivery retry finishes", async () => {
    let completeOlderRetry!: (result: unknown) => void;
    const pending = new Promise((resolve) => { completeOlderRetry = resolve; });
    invoke.mockResolvedValueOnce({ data: null, error: { message: "first delivery unavailable" } })
      .mockReturnValueOnce(pending)
      .mockResolvedValueOnce({ data: null, error: { message: "second delivery unavailable" } });
    const queryClient = client();
    try {
      await saveAdminRecord({ table: "blog_posts", id: "fixture", payload: { title: "First save" }, queryClient });
      const olderRetry = getPublicSyncIssues()[0]!.retry();
      await saveAdminRecord({ table: "blog_posts", id: "fixture", payload: { title: "Second save" }, queryClient });
      const newer = getPublicSyncIssues()[0]!;
      completeOlderRetry({ data: { ok: true, cache_invalidation: { ok: true, revision: changedTime } }, error: null });
      await olderRetry;
      expect(getPublicSyncIssues()).toEqual([newer]);
      expect(writes).toHaveLength(2); expect(audits).toHaveLength(2);
      await newer.retry();
      expect(getPublicSyncIssues()).toHaveLength(0);
      expect(writes).toHaveLength(2); expect(audits).toHaveLength(2); expect(invoke).toHaveBeenCalledTimes(4);
    } finally { queryClient.clear(); }
  });

  it("uses the returned database revision for a second settings save at full timestamp precision", async () => {
    const databaseRevision = "2026-10-05T01:02:04.123456+00:00";
    row = { id: "default", company_name: "Original", updated_at: initialTime };
    invoke.mockImplementation(async () => {
      // Mirrors the existing Edge revision UPDATE plus its BEFORE UPDATE trigger.
      row!.updated_at = databaseRevision;
      return { data: { ok: true, cache_invalidation: { ok: true, revision: databaseRevision } }, error: null };
    });
    const first = await saveAdminRecord({ table: "site_settings", id: "default", payload: { company_name: "First save" }, expectedUpdatedAt: initialTime });
    expect(first.updated_at).toBe(databaseRevision);
    await expect(saveAdminRecord({ table: "site_settings", id: "default", payload: { company_name: "Second save" }, expectedUpdatedAt: String(first.updated_at) }))
      .resolves.toMatchObject({ company_name: "Second save", updated_at: databaseRevision });
    expect(writes).toHaveLength(2);
    expect(writes[1]?.filters).toContainEqual({ field: "updated_at", value: databaseRevision, operator: "eq" });
  });

  it("does not let an earlier successful delivery clear a newer pending save", async () => {
    let completeDelivery!: (result: unknown) => void;
    let markDeliveryStarted!: () => void;
    const pending = new Promise((resolve) => { completeDelivery = resolve; });
    const started = new Promise<void>((resolve) => { markDeliveryStarted = resolve; });
    invoke.mockImplementationOnce(() => { markDeliveryStarted(); return pending; })
      .mockResolvedValueOnce({ data: null, error: { message: "newer delivery unavailable" } });
    const earlier = saveAdminRecord({ table: "blog_posts", id: "fixture", payload: { title: "First save" } });
    await started;
    await saveAdminRecord({ table: "blog_posts", id: "fixture", payload: { title: "Second save" } });
    const newer = getPublicSyncIssues()[0]!;
    completeDelivery({ data: { ok: true, cache_invalidation: { ok: true, revision: changedTime } }, error: null });
    await earlier;
    expect(getPublicSyncIssues()).toEqual([newer]);
    expect(writes).toHaveLength(2); expect(invoke).toHaveBeenCalledTimes(2);
  });

  it.each([true, false])("preserves successful %s removal audit and cache/public delivery", async (softDelete) => {
    const queryClient = client();
    try {
      const saved = await archiveOrDeleteAdminRecord({ table: "blog_posts", id: "fixture", expectedUpdatedAt: initialTime, softDelete, queryClient });
      expect(saved.id).toBe("fixture");
      expect(audits).toHaveLength(1); expect(audits[0]?.action).toBe(softDelete ? "archive" : "delete");
      expect(invoke).toHaveBeenCalledTimes(1);
      expect(queryClient.getQueryState(["published", "blog"])?.isInvalidated).toBe(true);
      expect(row?.status ?? null).toBe(softDelete ? "archived" : null);
    } finally { queryClient.clear(); }
  });

  it("keeps explicit cache suppression and disabled audit compatible", async () => {
    const queryClient = client();
    const invalidation = vi.spyOn(queryClient, "invalidateQueries");
    try {
      await saveAdminRecord({ table: "blog_posts", id: "fixture", payload: {}, queryClient, invalidate: "none", audit: false });
      expect(invalidation).not.toHaveBeenCalled(); expect(audits).toHaveLength(0); expect(invoke).toHaveBeenCalledTimes(1);
    } finally { queryClient.clear(); }
  });

  it("exposes a data-only system core without browser cache or public-delivery side effects", async () => {
    const result = await persistAdminRecord({ table: "blog_posts", id: "fixture", payload: { title: "Core saved" } });
    expect(result).toMatchObject({ table: "blog_posts", id: "fixture", action: "update", record: { title: "Core saved" }, before: { title: "Original" } });
    expect(audits).toHaveLength(1); expect(invoke).not.toHaveBeenCalled(); expect(getPublicSyncIssues()).toHaveLength(0);
  });

  it("keeps landing privacy validation before writes and maps core failures into both languages", async () => {
    row = { id: "fixture", slug: "office-renovation", status: "published", updated_at: initialTime };
    const error = await saveAdminRecord({ table: "landing_pages", id: "fixture", payload: { related_projects: [{ title: "Unapproved fixture", location: "Unknown fixture" }] } }).catch((value: unknown) => value);
    expect(error).toMatchObject({ code: "validation", stage: "validation" });
    expect(formatAdminMutationError(error)).toContain("匿名标题");
    expect(formatAdminMutationError(error, "en")).toContain("anonymous titles");
    expect(writes).toHaveLength(0);
  });

  it("formats permission, unique and stale errors without exposing transport internals", () => {
    expect(formatAdminMutationError({ message: "permission denied for internal_table" })).toBe("保存失败：当前账号没有这个操作权限。");
    expect(formatAdminMutationError({ message: "duplicate key in internal_table", code: "23505" }, "en")).toBe("Save failed: this unique value already exists. Choose another value.");
    const stale = new AdminMutationError("conflict", "technical failure", "write", { reason: "stale", operation: "save" });
    expect(formatAdminMutationError(stale, "en")).toBe("Save failed: someone changed this content. Refresh the page before saving.");
  });
});
