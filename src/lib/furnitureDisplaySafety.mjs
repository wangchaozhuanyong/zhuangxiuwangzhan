import displaySafety from "../data/furnitureDisplaySafety.json" with { type: "json" };

// Bound to the reviewed supplier snapshot, never to a managed CMS row.
export function resolveFurnitureDisplay(product, language) {
  const reviewed = displaySafety[product.slug];
  if (!reviewed || product.sourceUrl !== reviewed.sourceUrl) return product;
  return {
    ...product,
    ...reviewed[language],
    sku: reviewed.sku,
    skuLabel: reviewed.skuLabel[language],
    price: reviewed.priceDisplay[language],
    availabilityNote: reviewed.availabilityNote[language],
  };
}
