import { describe, expect, it } from "vitest";
import { buildAppleMapNavigationUrl, buildGoogleMapOpenUrl, buildWazeNavigationUrl, hasValidMapCoordinates } from "@/lib/mapUrls";

describe("map navigation URLs", () => {
  it.each([["", ""], [null, null], ["  ", "101.67"], ["3.08", undefined], [undefined, "101.67"], [91, 0], [0, 181]])("uses the address for missing/invalid coordinates %s %s", (latitude, longitude) => {
    expect(hasValidMapCoordinates(latitude, longitude)).toBe(false);
    expect(buildGoogleMapOpenUrl("Office address", latitude, longitude)).toContain("query=Office%20address");
    expect(buildWazeNavigationUrl("Office address", latitude, longitude)).toContain("q=Office%20address");
    expect(buildAppleMapNavigationUrl("Office address", latitude, longitude)).toContain("daddr=Office%20address");
  });
  it("keeps explicitly configured zero coordinates", () => {
    expect(hasValidMapCoordinates(0, "0")).toBe(true);
    expect(buildGoogleMapOpenUrl("Office", 0, 0)).toContain("query=0%2C0");
  });
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
