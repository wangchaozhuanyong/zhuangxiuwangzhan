import { AsyncLocalStorage } from "node:async_hooks";
import { describe, expect, it, vi } from "vitest";
import { createPublicHtmlGenerationCoalescer, restorePublicResponse, snapshotPublicResponse } from "../../functions/publicHtmlGeneration";
import { createPublicHtmlBrowserResponse } from "../../functions/publicHtmlCache";

describe("public document generation singleflight", () => {
  it("shares generation while keeping bodies and conditional requests independent", async () => {
    const run = createPublicHtmlGenerationCoalescer();
    let finish!: () => void;
    const generate = vi.fn(async () => {
      await new Promise<void>(resolve => { finish = resolve; });
      return { response: new Response("DOCUMENT", { headers: { etag: '"a"' } }), cacheWrite: null };
    });
    const a = run("same", generate); const b = run("same", generate);
    expect(generate).toHaveBeenCalledOnce(); finish();
    const first = createPublicHtmlBrowserResponse((await a).response, new Request("https://fixture/", { headers: { "if-none-match": '"a"' } }), "miss");
    const second = createPublicHtmlBrowserResponse((await b).response, new Request("https://fixture/"), "miss");
    expect(first.status).toBe(304); expect(await second.text()).toBe("DOCUMENT");
  });

  it("retires a failed generation so a later request can retry", async () => {
    const run = createPublicHtmlGenerationCoalescer();
    await expect(run("retry", async () => { throw new Error("failed"); })).rejects.toThrow("failed");
    const result = await run("retry", async () => ({ response: new Response("recovered"), cacheWrite: null }));
    expect(await result.response.text()).toBe("recovered");
  });

  it("reads the stream in the generating request and gives overlapping visitors independent bytes", async () => {
    const context = new AsyncLocalStorage<string>();
    const run = createPublicHtmlGenerationCoalescer();
    const source = new Response(new Uint8Array([0, 255, 128]), {
      status: 206, statusText: "Partial Content", headers: { "content-type": "application/octet-stream" },
    });
    const readBytes = source.arrayBuffer.bind(source);
    vi.spyOn(source, "arrayBuffer").mockImplementation(() => {
      expect(context.getStore()).toBe("first");
      return readBytes();
    });
    vi.spyOn(source, "clone").mockImplementation(() => { throw new Error("Request-owned stream"); });
    const generate = vi.fn(async () => ({ response: source, cacheWrite: null }));
    const results = await Promise.all(["first", "second"].map(id => context.run(id, () => run("same", generate))));
    expect(generate).toHaveBeenCalledOnce();
    for (const { response } of results) {
      expect(response.status).toBe(206);
      expect(response.statusText).toBe("Partial Content");
      expect(response.headers.get("content-type")).toBe("application/octet-stream");
      expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([0, 255, 128]));
    }
  });

  it("retains the absent body on a bodyless shell", async () => {
    const snapshot = await snapshotPublicResponse(new Response(null, { status: 204 }));
    expect(restorePublicResponse(snapshot).body).toBeNull();
  });
});
