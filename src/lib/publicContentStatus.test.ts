import { describe, expect, it } from "vitest";
import {
  createLocalFallbackContent,
  createRemoteContent,
  getPublicContentStatusLabel,
  isPublicContentDegraded,
} from "@/lib/publicContentStatus";

describe("publicContentStatus", () => {
  it("marks remote content as healthy", () => {
    const result = createRemoteContent({ title: "Remote" });

    expect(result.source).toBe("remote");
    expect(result.reason).toBe("remote-ok");
    expect(isPublicContentDegraded(result)).toBe(false);
    expect(getPublicContentStatusLabel(result, "en")).toBeNull();
  });

  it("marks failed public content reads as local fallback with retry copy", () => {
    const result = createLocalFallbackContent({ title: "Fallback" }, "remote-error", new Error("timeout"));
    const copy = getPublicContentStatusLabel(result, "en");

    expect(result.source).toBe("local-fallback");
    expect(result.reason).toBe("remote-error");
    expect(result.errorMessage).toBe("remote-error");
    expect(isPublicContentDegraded(result)).toBe(true);
    expect(copy?.action).toBe("Retry");
  });
});
