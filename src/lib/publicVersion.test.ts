import { describe, expect, it } from "vitest";
import {
  hasNewPublicVersion,
  parsePublicVersion,
} from "@/lib/publicVersion";

describe("public document version", () => {
  it("normalizes the lightweight endpoint response", () => {
    expect(parsePublicVersion({ deploymentVersion: " commit-a ", contentVersion: " revision-a " })).toEqual({
      deploymentVersion: "commit-a",
      contentVersion: "revision-a",
    });
  });

  it("detects frontend deployments and CMS content changes", () => {
    const current = { deploymentVersion: "commit-a", contentVersion: "revision-a" };
    const deployed = { deploymentVersion: "commit-b", contentVersion: "revision-a" };
    const published = { deploymentVersion: "commit-a", contentVersion: "revision-b" };

    expect(hasNewPublicVersion(current, deployed)).toBe(true);
    expect(hasNewPublicVersion(current, published)).toBe(true);
  });

  it("ignores an incomplete check response", () => {
    const current = { deploymentVersion: "commit-a", contentVersion: "revision-a" };

    expect(hasNewPublicVersion(current, { deploymentVersion: "", contentVersion: "" })).toBe(false);
  });
});
