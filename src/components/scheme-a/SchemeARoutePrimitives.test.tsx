import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { SchemeAGallery } from "@/components/scheme-a/SchemeARoutePrimitives";

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
