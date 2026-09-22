import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyManagedIssuerSecret } from "../../supabase/functions/content-publish/permit-auth.ts";

describe("protected managed permit issuer credential", () => {
  it("accepts only the temporary test credential and rejects absent or changed values", async () => {
    const temporaryKey = randomBytes(32).toString("hex");
    expect(await verifyManagedIssuerSecret(temporaryKey, temporaryKey)).toBe(true);
    expect(await verifyManagedIssuerSecret(`${temporaryKey}a`, temporaryKey)).toBe(false);
    expect(await verifyManagedIssuerSecret(null, temporaryKey)).toBe(false);
    expect(await verifyManagedIssuerSecret(temporaryKey, undefined)).toBe(false);
    expect(await verifyManagedIssuerSecret("short", "short")).toBe(false);
  });
});
