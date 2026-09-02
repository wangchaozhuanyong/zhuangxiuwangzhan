import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SchemeAGallery, SchemeALinkGrid } from "@/components/scheme-a/SchemeARoutePrimitives";

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
