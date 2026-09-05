import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState({}, "", "/");
});

describe("browser website visit recorder", () => {
  it("sends only event id and public path without query data", async () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("https://flashcast.com.my/zh/services?private=1"),
    });
    const fetchMock = vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { recordWebsiteVisit } = await import("./websiteVisits");
    await recordWebsiteVisit("/zh/services");
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init.body))).toEqual({
      eventId: expect.stringMatching(/^[0-9a-f-]{36}$/),
      path: "/zh/services",
    });
    expect(init).toMatchObject({ credentials: "omit", referrerPolicy: "no-referrer" });
    expect(String(init.body)).not.toContain("private");
  });

  it("does not send admin or invalid routes", async () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("https://flashcast.com.my/admin"),
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { recordWebsiteVisit } = await import("./websiteVisits");
    await recordWebsiteVisit("/admin");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
