import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createWebsiteVisit,
  forwardWebsiteVisit,
  isVisitCollectionConfigured,
} from "./websiteVisitService";

const eventId = "4f7989c2-b347-41f5-98e5-09a74ce303d4";
const secret = "test-secret-with-at-least-thirty-two-characters";

function request(headers: Record<string, string> = {}) {
  return new Request("https://flashcast.com.my/__visit", {
    method: "POST",
    headers: {
      origin: "https://flashcast.com.my",
      "sec-fetch-site": "same-origin",
      "cf-connecting-ip": "203.0.113.19",
      "user-agent": "Mozilla/5.0",
      ...headers,
    },
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("website visit edge service", () => {
  it("accepts a small same-origin public route and takes the IP only from Cloudflare", () => {
    const event = createWebsiteVisit(
      request(),
      { eventId, path: "/zh/services" },
      new Date("2026-09-06T01:02:03.004Z"),
    );
    expect(event).toEqual({
      eventId,
      host: "flashcast.com.my",
      path: "/zh/services",
      ip: "203.0.113.19",
      occurredAt: "2026-09-06T01:02:03.004Z",
    });
  });

  it("rejects spoofable or unwanted requests before forwarding", () => {
    expect(
      createWebsiteVisit(request({ origin: "https://evil.example" }), {
        eventId,
        path: "/zh",
      }),
    ).toBeNull();
    expect(
      createWebsiteVisit(request({ "cf-worker": "attacker.example" }), {
        eventId,
        path: "/zh",
      }),
    ).toBeNull();
    expect(
      createWebsiteVisit(request({ "user-agent": "ExampleBot/1.0" }), {
        eventId,
        path: "/zh",
      }),
    ).toBeNull();
    expect(
      createWebsiteVisit(request(), { eventId, path: "/admin" }),
    ).toBeNull();
    expect(
      createWebsiteVisit(request(), {
        eventId,
        path: "/zh",
        ip: "198.51.100.9",
      }),
    ).toBeNull();
  });

  it("requires one fixed receiver and sends a signed bounded request", async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      expect(init.headers).toMatchObject({
        "x-website-visit-signature": expect.stringMatching(/^[a-f0-9]{64}$/),
      });
      expect(String(init.body)).not.toContain(secret);
      return new Response(
        JSON.stringify({ success: true, data: { accepted: true } }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const env = {
      WEBSITE_VISIT_INGEST_SECRET: secret,
      WEBSITE_VISIT_INGEST_URL:
        "https://54-249-61-238.sslip.io/api/id-business-v2/workspace-website-monitor/visits/ingest",
    };
    expect(isVisitCollectionConfigured(env)).toBe(true);
    expect(
      await forwardWebsiteVisit(
        createWebsiteVisit(request(), { eventId, path: "/en" })!,
        env,
      ),
    ).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
