import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import ProductGallery from "@/components/ProductGallery";
import type { MaterialCatalogImage } from "@/lib/materialCatalog";

const images: MaterialCatalogImage[] = Array.from({ length: 10 }, (_, index) => ({
  id: `image-${index + 1}`,
  image: `/images/materials/gallery-${index + 1}.webp`,
  type: index === 0 ? "cover" : "scene",
  alt: `商品效果图 ${index + 1}`,
  sortOrder: index * 10,
}));

const containers: HTMLDivElement[] = [];

afterEach(() => {
  containers.splice(0).forEach((container) => container.remove());
});

describe("ProductGallery", () => {
  it("renders ten square-ready images and switches the active selection", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    containers.push(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ProductGallery
          images={images}
          fallbackImage="/images/materials/fallback.webp"
          fallbackAlt="商品图"
          navigationLabel="商品图片"
          positionLabel={(current, total) => `第 ${current} 张，共 ${total} 张`}
          typeLabels={{
            cover: "商品主图",
            scene: "空间效果",
            detail: "材质细节",
            installation: "安装示意",
            specification: "规格说明",
          }}
        />,
      );
    });

    const thumbnails = [...container.querySelectorAll<HTMLButtonElement>(".product-gallery__thumbnail")];
    expect(thumbnails).toHaveLength(10);
    expect(thumbnails[0]).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector<HTMLImageElement>(".product-gallery__stage img")).toHaveAttribute("alt", "商品效果图 1");

    await act(async () => {
      thumbnails[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(thumbnails[0]).toHaveAttribute("aria-pressed", "false");
    expect(thumbnails[1]).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector<HTMLImageElement>(".product-gallery__stage img")).toHaveAttribute("alt", "商品效果图 2");

    await act(async () => root.unmount());
  });

  it("falls back to the product cover when no gallery is available", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    containers.push(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ProductGallery
          images={[]}
          fallbackImage="/images/materials/fallback.webp"
          fallbackAlt="备用商品图"
          navigationLabel="商品图片"
          positionLabel={(current, total) => `第 ${current} 张，共 ${total} 张`}
          typeLabels={{
            cover: "商品主图",
            scene: "空间效果",
            detail: "材质细节",
            installation: "安装示意",
            specification: "规格说明",
          }}
        />,
      );
    });

    expect(container.querySelector<HTMLImageElement>(".product-gallery__stage img")).toHaveAttribute("alt", "备用商品图");
    expect(container.querySelector(".product-gallery__rail")).not.toBeInTheDocument();

    await act(async () => root.unmount());
  });
});
