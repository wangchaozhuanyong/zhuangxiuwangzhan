import { useEffect, useMemo, useState } from "react";
import SmartImage from "@/components/SmartImage";
import type { MaterialCatalogImage } from "@/lib/materialCatalog";

type ProductGalleryProps = {
  images: MaterialCatalogImage[];
  fallbackImage: string;
  fallbackAlt: string;
  navigationLabel: string;
  positionLabel: (current: number, total: number) => string;
  typeLabels: Record<MaterialCatalogImage["type"], string>;
};

const PRODUCT_IMAGE_WIDTHS = [560, 720, 900, 1200];

const ProductGallery = ({
  images,
  fallbackImage,
  fallbackAlt,
  navigationLabel,
  positionLabel,
  typeLabels,
}: ProductGalleryProps) => {
  const gallery = useMemo<MaterialCatalogImage[]>(() => (
    images.length
      ? images
      : [{ id: "cover", image: fallbackImage, type: "cover", alt: fallbackAlt, sortOrder: 0 }]
  ), [fallbackAlt, fallbackImage, images]);
  const [selectedId, setSelectedId] = useState(gallery[0]?.id || "cover");

  useEffect(() => {
    setSelectedId(gallery[0]?.id || "cover");
  }, [gallery]);

  const selectedIndex = Math.max(0, gallery.findIndex((image) => image.id === selectedId));
  const selected = gallery[selectedIndex] || gallery[0];
  if (!selected) return null;

  return (
    <div className="product-gallery">
      <div className="product-gallery__stage">
        <SmartImage
          src={selected.image}
          alt={selected.alt || fallbackAlt}
          width={1200}
          height={1200}
          loading={selectedIndex === 0 ? "eager" : "lazy"}
          fetchPriority={selectedIndex === 0 ? "high" : "auto"}
          sizes="(max-width: 767px) 100vw, 58vw"
          candidateWidths={PRODUCT_IMAGE_WIDTHS}
          quality={78}
        />
        <div className="product-gallery__caption" aria-live="polite">
          <span>{typeLabels[selected.type]}</span>
          <span>{positionLabel(selectedIndex + 1, gallery.length)}</span>
        </div>
      </div>

      {gallery.length > 1 ? (
        <div className="product-gallery__rail" aria-label={navigationLabel} role="group">
          {gallery.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className="product-gallery__thumbnail"
              data-active={image.id === selected.id ? "true" : "false"}
              aria-pressed={image.id === selected.id}
              aria-label={`${positionLabel(index + 1, gallery.length)}：${image.alt || fallbackAlt}`}
              onClick={() => setSelectedId(image.id)}
            >
              <SmartImage
                src={image.image}
                alt=""
                width={144}
                height={144}
                loading={index < 4 ? "eager" : "lazy"}
                fetchPriority={index < 4 ? "low" : "auto"}
                sizes="72px"
                candidateWidths={[360]}
                quality={68}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default ProductGallery;
