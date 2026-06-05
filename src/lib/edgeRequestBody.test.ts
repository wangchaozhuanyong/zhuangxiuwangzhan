import { describe, expect, it } from "vitest";
import { BodyTooLargeError, readJsonBody } from "../../supabase/functions/_shared/request-body";

describe("readJsonBody", () => {
  it("parses JSON when the body is within the byte limit", async () => {
    const req = new Request("https://example.test/submit-lead", {
      method: "POST",
      body: JSON.stringify({ type: "contact", phone: "+60123456789" }),
    });

    await expect(readJsonBody(req, 1024)).resolves.toEqual({ type: "contact", phone: "+60123456789" });
  });

  it("rejects bodies that exceed the byte limit while streaming", async () => {
    const req = new Request("https://example.test/submit-lead", {
      method: "POST",
      body: JSON.stringify({ message: "a".repeat(64) }),
    });

    await expect(readJsonBody(req, 16)).rejects.toBeInstanceOf(BodyTooLargeError);
  });
});
