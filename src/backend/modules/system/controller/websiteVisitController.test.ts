import { describe, expect, it } from "vitest";
import { handleWebsiteVisit } from "./websiteVisitController";

const secret = "test-secret-with-at-least-thirty-two-characters";
const configured = {
  WEBSITE_VISIT_INGEST_SECRET: secret,
  WEBSITE_VISIT_INGEST_URL:
    "https://54-249-61-238.sslip.io/api/id-business-v2/workspace-website-monitor/visits/ingest",
};

function request(method = "POST", body = "{}") {
  return new Request("https://flashcast.com.my/__visit", {
    method,
    headers: {
      origin: "https://flashcast.com.my",
      "sec-fetch-site": "same-origin",
      "content-type": "application/json",
      "cf-connecting-ip": "203.0.113.19",
      "user-agent": "Mozilla/5.0",
    },
    ...(method === "POST" ? { body } : {}),
  });
}

describe("website visit edge controller", () => {
  it("rejects unsupported methods, missing runtime configuration and invalid input", async () => {
    expect((await handleWebsiteVisit(request("GET"), configured)).status).toBe(
      405,
    );
    expect((await handleWebsiteVisit(request(), {})).status).toBe(503);
    expect(
      (await handleWebsiteVisit(request("POST", "{"), configured)).status,
    ).toBe(400);
    expect(
      (await handleWebsiteVisit(request("POST", "x".repeat(4097)), configured))
        .status,
    ).toBe(400);
  });
});
