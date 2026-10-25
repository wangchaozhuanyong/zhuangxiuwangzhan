import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildReadablePublicBody } from "../../functions/readablePublicBody";

const row = {
  slug: "office-renovation", status: "published", title_en: "Office renovation",
  content_en: "<p>Existing office overview remains.</p>",
  process_steps_en: [{ title: "Original process", desc: "Original process description" }],
  faqs_en: [{ q: "Original question?", a: "Original answer remains." }],
};
const hash = (body: string) => createHash("sha256").update(body).digest("hex");

describe("existing English office readable fallback", () => {
  it("uses the same two approved bodies once after process and before resources", () => {
    const html = buildReadablePublicBody("/en/services/office-renovation", row);
    const document = new DOMParser().parseFromString(html, "text/html");
    const sections = Array.from(document.querySelectorAll("section"));
    const process = sections.find(section => section.querySelector("h3")?.textContent === "Original process")!;
    const resources = sections.find(section => section.querySelector("a"))!;
    const units = [
      ["Who checks information at each office fit-out stage?", "0d9ee2ce3b92f1271904fb850daef6902c1c3fbd891146d558bc79ab09f598d6"],
      ["Can the office remain open during work?", "5c41032b82e86f8929f13eb0ceee9c67be5d3e323dab9ab5af36523674ee5458"],
    ];
    const positions: number[] = [];
    for (const [heading, bodyHash] of units) {
      const matches = sections.filter(section => section.querySelector("h2")?.textContent === heading);
      expect(matches).toHaveLength(1);
      const section = matches[0];
      expect(hash(Array.from(section.querySelectorAll("p")).map(p => p.textContent).join("\n"))).toBe(bodyHash);
      positions.push(sections.indexOf(section));
      expect(sections.indexOf(section)).toBeGreaterThan(sections.indexOf(process));
      expect(sections.indexOf(section)).toBeLessThan(sections.indexOf(resources));
    }
    expect(positions[1]).toBeGreaterThan(positions[0]);
    expect(html).toContain("Existing office overview remains.");
    expect(html).toContain("Original answer remains.");
  });

  it("does not expand the existing no-JS path registry into Malay or shop routes", () => {
    expect(buildReadablePublicBody("/ms/services/office-renovation", row)).toBe("");
    expect(buildReadablePublicBody("/en/services/shop-renovation", { ...row, slug: "shop-renovation" })).toBe("");
  });
});
