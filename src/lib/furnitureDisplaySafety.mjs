import displaySafety from "../data/furnitureDisplaySafety.json" with { type: "json" };

// Bound to the reviewed supplier snapshot, never to a managed CMS row.
export function resolveFurnitureDisplay(product, language) {
  const displayLanguage = language === "ms" ? "en" : language;
  const reviewed = displaySafety[product.slug];
  if (!reviewed || product.sourceUrl !== reviewed.sourceUrl) return product;
  return {
    ...product,
    ...reviewed[displayLanguage],
    sku: reviewed.sku,
    skuLabel: reviewed.skuLabel[displayLanguage],
    price: reviewed.priceDisplay[displayLanguage],
    availabilityNote: reviewed.availabilityNote[displayLanguage],
  };
}
