import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const load = (name) => JSON.parse(readFileSync(new URL(`../src/data/${name}`, import.meta.url), "utf8"));
const catalog = load("furnitureCatalog.json");
const zh = load("furnitureCatalogZh.json");
const en = load("furnitureCatalogEn.json");
const chinese = /[\u3400-\u9fff]/;

assert.equal(Object.keys(zh).length, catalog.products.length, "Every product needs Chinese copy");
for (const product of catalog.products) {
  const localized = zh[product.slug];
  assert(localized, `Missing Chinese copy for ${product.slug}`);
  assert(chinese.test(localized.name), `Chinese name has no Chinese text: ${product.slug}`);
  assert(localized.shortDescription || !product.shortDescription, `Missing Chinese summary: ${product.slug}`);
  assert(localized.description || !product.description, `Missing Chinese description: ${product.slug}`);
  if (chinese.test(product.name) || chinese.test(product.description)) {
    const english = en[product.slug];
    assert(english, `Missing English copy for ${product.slug}`);
    assert(!chinese.test(english.name), `English name contains Chinese: ${product.slug}`);
    assert(!chinese.test(english.shortDescription), `English summary contains Chinese: ${product.slug}`);
    assert(!chinese.test(english.description), `English description contains Chinese: ${product.slug}`);
  }
}

console.log(`Furniture locales validated: ${catalog.products.length} Chinese products, ${Object.keys(en).length} English overrides`);
