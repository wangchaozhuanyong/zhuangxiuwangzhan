import { beforeAll, describe, expect, it } from "vitest";
import { buildReadablePublicBody } from "../../functions/readablePublicBody";
import { serviceDetailPageText } from "@/i18n/serviceDetailPageText";
import { mediaLabels } from "@/i18n/mediaLabels";
import { loadMalayContent } from "@/i18n/malayContentRuntime";

beforeAll(async () => { await loadMalayContent(); });

describe("existing Malay no-script content", () => {
  it.each(["builtin", "kitchen", "renovation"])("renders %s without falling into the HTML transform recovery", slug => {
    const row = { status: "published", slug, title_ms: "Perkhidmatan", content_ms: "<p>Kandungan asal</p><script>bad()</script>",
      suitable_for_ms: ["Rumah"], scope_items_ms: ["Skop asal"], common_projects_ms: ["Projek asal"],
      process_steps_ms: [{ title: "Langkah asal", desc: "Butiran asal" }], faqs_ms: [{ q: "Soalan asal", a: "Jawapan asal" }] };
    const before = JSON.stringify(row);
    const body = buildReadablePublicBody(`/ms/services/${slug}`, row);
    const document = new DOMParser().parseFromString(body, "text/html");
    expect(document.querySelector("main")?.lang).toBe("ms-MY");
    expect(document.querySelector("h1")?.textContent).toBe(row.title_ms);
    expect(document.body.textContent).toContain("Kandungan asal");
    for (const label of [serviceDetailPageText.ms.suitableFor, serviceDetailPageText.ms.offer, serviceDetailPageText.ms.commonProjects, serviceDetailPageText.ms.process, serviceDetailPageText.ms.faq]) expect(document.body.textContent).toContain(label);
    expect(document.querySelector("script")).toBeNull();
    expect(document.querySelector("[data-flashcast-reviewed-cta]")).toBeNull();
    expect(JSON.stringify(row)).toBe(before);
    expect(buildReadablePublicBody(`/ms/services/${slug}`, { ...row, content_ms: "" })).toBe("");
    expect(buildReadablePublicBody(`/ms/services/${slug}`, { ...row, status: "draft" })).toBe("");
  });
  it("uses existing Malay project labels without adding an unreviewed English CTA", () => {
    const body = buildReadablePublicBody("/ms/projects/bangsar-walk-in-wardrobe-system", {
      status: "published", slug: "bangsar-walk-in-wardrobe-system", title_ms: "Projek", content_ms: "<p>Kandungan asal</p>",
      highlights_ms: ["Sorotan asal"], scope: ["Skop asal"], materials: ["Bahan asal"],
    });
    expect(body).toContain(mediaLabels.ms.renderingConcept);
    expect(body).not.toContain("data-flashcast-reviewed-cta");
  });
});
