import { describe, expect, it } from "vitest";
import { buildAppleMapNavigationUrl, buildGoogleMapOpenUrl, buildWazeNavigationUrl } from "@/lib/mapUrls";

describe("map navigation URLs", () => {
  it("uses coordinates when valid coordinates are configured", () => {
    expect(buildGoogleMapOpenUrl("Office", "3.0830403", "101.6708234")).toContain("3.0830403%2C101.6708234");
    expect(buildWazeNavigationUrl("Office", "3.0830403", "101.6708234")).toContain("ll=3.0830403%2C101.6708234");
    expect(buildAppleMapNavigationUrl("Office", "3.0830403", "101.6708234")).toContain("daddr=3.0830403%2C101.6708234");
  });

  it("falls back to the address when coordinates are unavailable", () => {
    expect(buildGoogleMapOpenUrl("94 Jalan Mega Mendung")).toContain("94%20Jalan%20Mega%20Mendung");
    expect(buildWazeNavigationUrl("94 Jalan Mega Mendung")).toContain("q=94%20Jalan%20Mega%20Mendung");
    expect(buildAppleMapNavigationUrl("94 Jalan Mega Mendung")).toContain("daddr=94%20Jalan%20Mega%20Mendung");
  });
});
