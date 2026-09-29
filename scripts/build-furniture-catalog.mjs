import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import sharp from "sharp";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = resolve(projectRoot, "src/data/furnitureCatalog.json");
const priceAuditPath = resolve(projectRoot, "src/data/furniturePriceAudit.json");
const imageDirectory = resolve(projectRoot, "public/images/furniture/assets");
const siteOrigin = "https://huaxia.my";
const furniturePriceMultiplier = 2;
const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";
const categoryKeys = ["new", "bedroom", "dining", "living", "study", "preorder"];
const categoryLabels = ["New Products", "Bedroom", "Dining Room", "Living Room", "Study Room", "Pre-Order Items"];

const normalizeUrl = (raw) => {
  const url = new URL(raw, siteOrigin);
  url.search = "";
  url.hash = "";
  return url.href;
};

const request = async (url, tries = 3) => {
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": userAgent, accept: "text/html,image/avif,image/webp,image/*,*/*" },
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error) {
      if (attempt === tries) throw new Error(`${url}: ${error.message}`);
      await new Promise((done) => setTimeout(done, attempt * 800));
    }
  }
};

const documentAt = async (url) => new JSDOM(await (await request(url)).text()).window.document;

const cleanText = (element) => {
  if (!element) return "";
  const walk = (node) => {
    if (node.nodeType === 3) return node.textContent || "";
    if (node.nodeType !== 1) return "";
    const tag = node.tagName.toLowerCase();
    if (["script", "style", "img", "noscript"].includes(tag)) return "";
    if (tag === "br") return "\n";
    const value = [...node.childNodes].map(walk).join("");
    return ["p", "li", "div", "h2", "h3", "h4"].includes(tag) ? `\n${value}\n` : value;
  };
  return walk(element).split("\n").map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n").slice(0, 10000);
};

const loadTaxonomy = async () => {
  const document = await documentAt(siteOrigin);
  const navItems = [...document.querySelectorAll("#menu-main-navigation > li")];
  return categoryLabels.map((label, index) => {
    const item = navItems.find((candidate) => candidate.querySelector(":scope > a")?.textContent?.trim() === label);
    if (!item) throw new Error(`Missing category: ${label}`);
    const anchor = item.querySelector(":scope > a");
    return {
      key: categoryKeys[index],
      name: label,
      url: normalizeUrl(anchor.href),
      subcategories: [...item.querySelectorAll("ul.wd-sub-menu > li > a")].map((link) => ({
        key: new URL(link.href).pathname.split("/").filter(Boolean).at(-1),
        name: link.textContent.trim(),
        url: normalizeUrl(link.href),
      })),
    };
  });
};

const pageNumber = (url) => Number(new URL(url).pathname.match(/\/page\/(\d+)\//)?.[1] || 1);

const listProducts = async (base) => {
  const queue = [base];
  const seen = new Set();
  const pages = [];
  let claimedCount = null;
  while (queue.length) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    const document = await documentAt(url);
    const countText = document.querySelector(".woocommerce-result-count")?.textContent || "";
    claimedCount ??= Number(countText.match(/of\s+(\d+)\s+results/)?.[1] || countText.match(/all\s+(\d+)\s+results/)?.[1] || 0);
    const products = [...document.querySelectorAll('h3 a[href*="/product/"]')].map((link) => ({
      url: normalizeUrl(link.href),
      name: link.textContent.trim(),
    }));
    if (!products.length) throw new Error(`No products found at ${url}`);
    pages.push({ number: pageNumber(url), products });
    for (const link of document.querySelectorAll(".woocommerce-pagination a[href]")) {
      const next = normalizeUrl(link.href);
      if (next.startsWith(`${base}page/`) && !seen.has(next) && !queue.includes(next)) queue.push(next);
    }
  }
  pages.sort((a, b) => a.number - b.number);
  const ordered = [...new Map(pages.flatMap((page) => page.products).map((product) => [product.url, product])).values()];
  if (claimedCount && ordered.length !== claimedCount) throw new Error(`${base}: found ${ordered.length}, expected ${claimedCount}`);
  return ordered;
};

const productSlug = (url) => decodeURIComponent(new URL(url).pathname.split("/").filter(Boolean).at(-1));

const loadProduct = async (source) => {
  const document = await documentAt(source.url);
  const title = document.querySelector("h1.product_title")?.textContent?.trim() || source.name;
  const shortDescription = cleanText(document.querySelector(".summary .woocommerce-product-details__short-description"));
  const description = cleanText(document.querySelector("#tab-description")) || shortDescription;
  const sourceImages = [...new Set([...document.querySelectorAll(".woocommerce-product-gallery__image a[href]")]
    .map((anchor) => normalizeUrl(anchor.href))
    .filter((url) => url.startsWith(`${siteOrigin}/wp-content/uploads/`)))];
  const ogImage = document.querySelector('meta[property="og:image"]')?.content;
  if (!sourceImages.length && ogImage) sourceImages.push(normalizeUrl(ogImage));
  return {
    slug: productSlug(source.url),
    name: title,
    shortDescription,
    description,
    sku: document.querySelector(".product_meta .sku")?.textContent?.trim() || "",
    sourceUrl: source.url,
    sourceImages,
    images: [],
    sourceCategories: [...document.querySelectorAll(".product_meta .posted_in a")].map((link) => ({
      name: link.textContent.trim(),
      url: normalizeUrl(link.href),
    })),
    price: null,
  };
};

const runPool = async (items, size, work) => {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      await work(items[index], index);
    }
  }));
};

const loadPriceAudit = () => {
  const audit = JSON.parse(readFileSync(priceAuditPath, "utf8"));
  if (audit.source !== siteOrigin || !audit.products || !audit.capturedAt) {
    throw new Error("Furniture wholesale price audit is missing its source, capture time, or products");
  }
  return audit;
};

const displayPriceFromWholesale = (wholesalePrice) => {
  if (wholesalePrice == null || wholesalePrice === "") return null;
  const match = /^RM([\d,]+)\.(\d{2})(?:\s*–\s*RM([\d,]+)\.(\d{2}))?$/.exec(wholesalePrice);
  if (!match) throw new Error(`Unsupported furniture wholesale price: ${wholesalePrice}`);
  const format = (whole, cents) => {
    const doubledCents = (Number(whole.replaceAll(",", "")) * 100 + Number(cents)) * furniturePriceMultiplier;
    return `RM${Math.floor(doubledCents / 100).toLocaleString("en-MY")}.${String(doubledCents % 100).padStart(2, "0")}`;
  };
  const lower = format(match[1], match[2]);
  return match[3] ? `${lower} – ${format(match[3], match[4])}` : lower;
};

const applyDisplayPrices = (catalog) => {
  const audit = loadPriceAudit();
  for (const product of catalog.products) {
    product.price = displayPriceFromWholesale(audit.products[product.sourceUrl]?.price);
  }
  catalog.pricesCapturedAt = audit.capturedAt;
};

const saveCatalog = (catalog) => {
  applyDisplayPrices(catalog);
  mkdirSync(dirname(catalogPath), { recursive: true });
  writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
};

const checkDisplayPrices = () => {
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  const audit = loadPriceAudit();
  const mismatches = catalog.products.filter((product) =>
    product.price !== displayPriceFromWholesale(audit.products[product.sourceUrl]?.price));
  if (catalog.pricesCapturedAt !== audit.capturedAt || mismatches.length) {
    throw new Error(`Furniture display prices are stale: ${mismatches.length} product mismatch(es)`);
  }
  console.log(`Furniture prices verified: ${catalog.products.filter((product) => product.price).length} priced, ${catalog.products.filter((product) => !product.price).length} awaiting source price`);
};

const crawl = async () => {
  const taxonomy = await loadTaxonomy();
  const catalog = existsSync(catalogPath)
    ? JSON.parse(readFileSync(catalogPath, "utf8"))
    : { source: siteOrigin, capturedAt: new Date().toISOString(), taxonomy: [], products: [] };
  catalog.taxonomy = taxonomy;
  const productMap = new Map(catalog.products.map((product) => [product.sourceUrl, product]));
  for (const category of taxonomy) {
    category.productUrls = (await listProducts(category.url)).map((product) => product.url);
    for (const subcategory of category.subcategories) {
      subcategory.productUrls = (await listProducts(subcategory.url)).map((product) => product.url);
    }
    console.log(`${category.name}: ${category.productUrls.length} products, ${category.subcategories.length} subcategories`);
  }
  const sourceProducts = [...new Map(taxonomy.flatMap((category) => category.productUrls).map((url) => [url, { url }])).values()];
  let completed = 0;
  await runPool(sourceProducts.filter(({ url }) => !productMap.has(url)), 4, async (source) => {
    const product = await loadProduct(source);
    productMap.set(product.sourceUrl, product);
    completed += 1;
    if (completed % 25 === 0) {
      catalog.products = [...productMap.values()];
      saveCatalog(catalog);
      console.log(`Read ${completed} new details`);
    }
  });
  catalog.products = sourceProducts.map(({ url }) => productMap.get(url));
  catalog.capturedAt = new Date().toISOString();
  saveCatalog(catalog);
  console.log(JSON.stringify({ products: catalog.products.length, categories: catalog.taxonomy.length, subcategories: catalog.taxonomy.flatMap((item) => item.subcategories).length, path: catalogPath }));
};

const downloadImages = async () => {
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  mkdirSync(imageDirectory, { recursive: true });
  const imageUrls = [...new Set(catalog.products.flatMap((product) => product.sourceImages))];
  const imagePaths = new Map();
  let completed = 0;
  await runPool(imageUrls, 4, async (url) => {
    const name = `${createHash("sha256").update(url).digest("hex").slice(0, 20)}.webp`;
    const absolutePath = resolve(imageDirectory, name);
    if (!existsSync(absolutePath)) {
      const bytes = Buffer.from(await (await request(url)).arrayBuffer());
      await sharp(bytes).rotate().resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true }).webp({ quality: 76 }).toFile(absolutePath);
    }
    imagePaths.set(url, `/images/furniture/assets/${name}`);
    completed += 1;
    if (completed % 50 === 0) console.log(`Saved ${completed}/${imageUrls.length} images`);
  });
  for (const product of catalog.products) product.images = product.sourceImages.map((url) => imagePaths.get(url)).filter(Boolean);
  saveCatalog(catalog);
  console.log(JSON.stringify({ images: imageUrls.length, path: imageDirectory }));
};

if (process.argv.includes("--check-prices")) checkDisplayPrices();
else if (process.argv.includes("--prices")) {
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  saveCatalog(catalog);
  checkDisplayPrices();
}
else if (process.argv.includes("--images")) await downloadImages();
else await crawl();
