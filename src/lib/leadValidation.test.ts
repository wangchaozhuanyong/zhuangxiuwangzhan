import { describe, expect, it } from "vitest";
import { isValidLeadEmail, isValidLeadPhone } from "@/lib/leadValidation";

describe("lead validation", () => {
  it("accepts common Malaysia phone formats", () => {
    expect(isValidLeadPhone("+601128853888")).toBe(true);
    expect(isValidLeadPhone("+60 11-2885 3888")).toBe(true);
  });

  it("rejects phone values that the submit-lead function rejects", () => {
    expect(isValidLeadPhone("123456")).toBe(false);
    expect(isValidLeadPhone("+601128853888999999999")).toBe(false);
    expect(isValidLeadPhone("phone12345")).toBe(false);
  });

  it("validates optional email consistently", () => {
    expect(isValidLeadEmail("customer@example.com")).toBe(true);
    expect(isValidLeadEmail("bad-email")).toBe(false);
  });
});
