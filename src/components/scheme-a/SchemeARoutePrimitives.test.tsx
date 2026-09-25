import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SchemeAGallery, SchemeALinkGrid, SchemeASection } from "@/components/scheme-a/SchemeARoutePrimitives";

describe("SchemeASection", () => {
  it("renders CMS paragraph text as separate escaped paragraphs and keeps single-string callers working", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => root.render(<SchemeASection title="Kuala Lumpur" description={["First detail.", "Second detail.", "Third <script>alert(1)</script> detail."]}><span>Existing service links</span></SchemeASection>));
    expect(Array.from(container.querySelectorAll(".fc-route-section-head p"), (paragraph) => paragraph.textContent)).toEqual([
      "First detail.",
      "Second detail.",
      "Third <script>alert(1)</script> detail.",
    ]);
    expect(container.querySelector("script")).toBeNull();
    expect(container).toHaveTextContent("Existing service links");

    act(() => root.render(<SchemeASection title="Other section" description="Single description"><span>Existing content</span></SchemeASection>));
    expect(Array.from(container.querySelectorAll(".fc-route-section-head p"), (paragraph) => paragraph.textContent)).toEqual(["Single description"]);
    act(() => root.unmount());
    container.remove();
  });
});

describe("SchemeAGallery", () => {
  it("shows up to eight available images instead of truncating the gallery to two", () => {
    const images = Array.from({ length: 10 }, (_, index) => ({
      src: `/images/projects/gallery-${index + 1}.webp`,
      alt: `Gallery image ${index + 1}`,
    }));

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(<SchemeAGallery images={images} />));

    expect(container.querySelectorAll("img")).toHaveLength(8);
    expect(container.querySelector('img[alt="Gallery image 8"]')).toBeInTheDocument();
    expect(container.querySelector('img[alt="Gallery image 9"]')).not.toBeInTheDocument();

    act(() => root.unmount());
    container.remove();
  });
});

describe("SchemeALinkGrid", () => {
  it("renders descriptive localized links without image placeholders", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => root.render(
      <MemoryRouter>
        <SchemeALinkGrid
          items={[
            { id: "guide", label: "Planning guide", title: "Kitchen checklist", description: "Prepare the scope before comparing quotations.", href: "/blog/kitchen-checklist" },
            { id: "area", label: "Service area", title: "Kuala Lumpur", description: "Review local service coverage.", href: "/locations/kuala-lumpur" },
          ]}
          actionLabel="Open resource"
        />
      </MemoryRouter>,
    ));

    const links = Array.from(container.querySelectorAll<HTMLAnchorElement>("a"));
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/en/blog/kitchen-checklist");
    expect(links[0]).toHaveTextContent("Planning guide");
    expect(links[0]).toHaveTextContent("Prepare the scope before comparing quotations.");
    expect(container.querySelector("img")).not.toBeInTheDocument();

    act(() => root.unmount());
    container.remove();
  });
});
