import { describe, expect, it, vi } from "vitest";
import { createPublicHtmlGenerationCoalescer } from "../../functions/publicHtmlGeneration";
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
});
