import { chromium } from "@playwright/test";
import { diagnosticUrl, diagnosticMessage, diagnosticTiming, isCriticalPublicRequest, normalizePublicReadIdentity } from "./lib/public-network-diagnostics.mjs";
import { installPublicInteractionMetrics, exercisePublicLanguageSwitch } from "./lib/public-interaction-metrics.mjs";

const baseUrl = (process.env.PUBLIC_PERFORMANCE_BASE_URL || process.env.PREVIEW_URL || "http://127.0.0.1:8788").replace(/\/+$/, "");
const chromiumChannel = process.env.PLAYWRIGHT_CHROMIUM_CHANNEL;
const firstImageStartMaxMs = Number(process.env.PUBLIC_PERFORMANCE_FIRST_IMAGE_START_MAX_MS || 3000);
const lateImageStartMs = Number(process.env.PUBLIC_PERFORMANCE_LATE_IMAGE_START_MS || 3500);
const maxLateSupabaseImages = Number(process.env.PUBLIC_PERFORMANCE_MAX_LATE_SUPABASE_IMAGES || 20);
const projectDetailPath =
  process.env.PUBLIC_PERFORMANCE_PROJECT_DETAIL_PATH || "/zh/projects/damansara-heights-semi-d-refurbishment";
const productDetailPath =
  process.env.PUBLIC_PERFORMANCE_PRODUCT_DETAIL_PATH || "/zh/products/vinyl-plank-ash-grey";

const pages = [
  {
    name: "home",
    path: "/zh",
    requireSiteSettingsPreload: true,
    requireHomeBundlePreload: true,
    maxPreloadBytes: 55_000,
    maxHomeBundleFetches: 0,
    maxSupabaseRestFetches: 0,
    allowOptionalHomeVisibility: true,
    highRiskDynamicImages: true,
    minSupabaseImagesBeforeLateThreshold: 2,
  },
  {
    name: "projects",
    path: "/zh/projects",
    requireSiteSettingsPreload: true,
    requireSitePagePreload: "projects",
    requireProjectSummariesPreload: true,
    maxPreloadBytes: 55_000,
    maxProjectRestFetches: 0,
    maxSupabaseRestFetches: 0,
    highRiskDynamicImages: true,
    minSupabaseImagesBeforeLateThreshold: 12,
  },
  {
    name: "project-detail",
    path: projectDetailPath,
    requireSiteSettingsPreload: true,
    requireProjectDetailPreload: true,
    requireProjectSummariesPreload: true,
    requireCtaBlockPreload: "home_final",
    maxPreloadBytes: 60_000,
    maxProjectRestFetches: 0,
    maxSupabaseRestFetches: 0,
    highRiskDynamicImages: true,
    minSupabaseImagesBeforeLateThreshold: 3,
  },
  {
    name: "services",
    path: "/zh/services",
    requireSiteSettingsPreload: true,
    requireSitePagePreload: "services",
    requireServicesPreload: true,
    maxPreloadBytes: 25_000,
    maxSupabaseRestFetches: 0,
    checkLanguageSwitch: true,
    forbidFurnitureCatalog: true,
  },
  {
    name: "furniture",
    path: "/zh/furniture",
    requireSiteSettingsPreload: true,
    requireFurnitureCatalogPreload: true,
    maxSupabaseRestFetches: 0,
    checkLanguageSwitch: true,
  },
  {
    name: "materials",
    path: "/zh/materials",
    requireSiteSettingsPreload: true,
    requireSitePagePreload: "materials",
    requireMaterialsPreload: true,
    maxPreloadBytes: 75_000,
    maxSupabaseRestFetches: 0,
  },
  {
    name: "products",
    path: "/zh/products",
    requireSiteSettingsPreload: true,
    requireMaterialsPreload: true,
    maxPreloadBytes: 75_000,
    maxSupabaseRestFetches: 0,
  },
  {
    name: "product-detail",
    path: productDetailPath,
    requireSiteSettingsPreload: true,
    requireMaterialsPreload: true,
    requireMaterialDetailPreload: productDetailPath.split("/").filter(Boolean).at(-1),
    requireCtaBlockPreload: "home_final",
    maxPreloadBytes: 80_000,
    maxSupabaseRestFetches: 0,
  },
  {
    name: "promotions",
    path: "/zh/promotions",
    requireSiteSettingsPreload: true,
    requireSitePagePreload: "promotions",
    maxPreloadBytes: 15_000,
    maxSupabaseRestFetches: 0,
  },
  {
    name: "locations",
    path: "/zh/locations",
    requireSiteSettingsPreload: true,
    requireServiceAreasPreload: true,
    maxPreloadBytes: 55_000,
    maxSupabaseRestFetches: 0,
  },
  {
    name: "blog",
    path: "/zh/blog",
    requireSiteSettingsPreload: true,
    requireSitePagePreload: "blog",
    requireBlogPostsPreload: true,
    requireCtaBlockPreload: "home_final",
    maxPreloadBytes: 90_000,
    maxSupabaseRestFetches: 0,
  },
];

const countDuplicates = (items) => {
  const counts = new Map();
  for (const item of items) counts.set(item, (counts.get(item) || 0) + 1);
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([endpoint, count]) => ({ endpoint: diagnosticUrl(endpoint), count }));
};

const scrollThroughPage = async (page) => {
  const height = await page.evaluate(() => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight));
  const steps = Math.max(4, Math.ceil(height / 900));
  for (let index = 1; index <= steps; index += 1) {
    await page.evaluate((target) => window.scrollTo({ top: target, behavior: "auto" }), Math.round((height / steps) * index));
    await page.waitForTimeout(160);
  }
  await page.waitForTimeout(1600);
};

const collectPageMetrics = async (page, lateThreshold) =>
  page.evaluate((threshold) => {
    const preloadNode = document.getElementById("flashcast-public-data");
    let preload = null;
    if (preloadNode?.textContent) {
      try {
        preload = JSON.parse(preloadNode.textContent);
      } catch {
        preload = null;
      }
    }

    const entries = performance.getEntriesByType("resource").map((entry) => ({
      name: entry.name,
      startTime: Math.round(entry.startTime),
      duration: Math.round(entry.duration),
      initiatorType: entry.initiatorType,
    }));

    const supabaseRenderImages = entries.filter((entry) => entry.name.includes("/storage/v1/render/image/public/"));
    const supabaseRestEntries = entries.filter((entry) => entry.name.includes("/rest/v1/"));
    const projectRestEntries = entries.filter((entry) => entry.name.includes("/rest/v1/projects"));
    const homeBundleEntries = entries.filter((entry) => entry.name.includes("/rest/v1/rpc/get_public_home_bundle"));
    const seededHomeVisibilityKeys = (preload?.homeContentBundle?.home_sections || [])
      .filter((row) => ["brand_partners", "testimonials"].includes(row?.section_key)).map((row) => `eq.${row.section_key}`);
    const optionalHomeVisibilityKeys = supabaseRestEntries.flatMap((entry) => {
      const url = new URL(entry.name);
      const section = url.searchParams.get("section_key");
      return url.pathname === "/rest/v1/home_sections" && url.searchParams.get("status") === "eq.published" &&
        url.searchParams.get("select") === "*" && url.searchParams.get("order") === "sort_order.asc" &&
        url.searchParams.get("limit") === "1" && !seededHomeVisibilityKeys.includes(section) &&
        ["eq.brand_partners", "eq.testimonials"].includes(section) ? [section] : [];
    });
    const visibleImages = Array.from(document.images).filter((img) => {
      const rect = img.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 1 && rect.height > 1;
    });
    const loadedImages = Array.from(document.images).filter((img) => img.currentSrc);

    return {
      preloadKeys: preload ? Object.keys(preload).sort() : [],
      preloadJsonBytes: new TextEncoder().encode(preloadNode?.textContent || "").byteLength,
      hasSiteSettings: Boolean(preload?.siteSettings),
      hasHomeBundle: Boolean(preload?.homeContentBundle),
      hasFurnitureCatalog: Boolean(preload?.furnitureCatalog && !preload.furnitureCatalog.detailSlug),
      furnitureCatalogScriptCount: entries.filter((entry) => entry.initiatorType === "script" && /\/(?:furnitureCatalog(?:Presentation)?|(?:public)?[Ff]urnitureQuerySeed)-[^/]+\.js(?:\?|$)/.test(entry.name)).length,
      sitePageKeys: preload?.sitePages ? Object.keys(preload.sitePages).sort() : [],
      services: Array.isArray(preload?.services) ? preload.services.length : 0,
      materials: Array.isArray(preload?.materials) ? preload.materials.length : 0,
      materialDetailSlugs: Array.isArray(preload?.materials)
        ? preload.materials
            .filter((row) => row && typeof row === "object" && Array.isArray(row.material_images))
            .map((row) => String(row.slug || ""))
            .filter(Boolean)
        : [],
      productHighlights: Array.isArray(preload?.productHighlights) ? preload.productHighlights.length : 0,
      serviceAreas: Array.isArray(preload?.serviceAreas) ? preload.serviceAreas.length : 0,
      blogPosts: Array.isArray(preload?.blogPosts) ? preload.blogPosts.length : 0,
      ctaBlockKeys: preload?.ctaBlocks ? Object.keys(preload.ctaBlocks).sort() : [],
      projectSummaries: Array.isArray(preload?.projectSummaries) ? preload.projectSummaries.length : 0,
      projectDetailSlugs: preload?.projectDetails ? Object.keys(preload.projectDetails) : [],
      imageCount: document.images.length,
      visibleImageCount: visibleImages.length,
      incompleteRequestedImageCount: loadedImages.filter((img) => !img.complete || img.naturalWidth === 0).length,
      brokenVisibleImageCount: visibleImages.filter((img) => !img.complete || img.naturalWidth === 0).length,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      homeBundleFetchCount: homeBundleEntries.length,
      projectRestFetchCount: projectRestEntries.length,
      supabaseRestFetchCount: supabaseRestEntries.length,
      optionalHomeVisibilityKeys,
      seededHomeVisibilityKeys,
      duplicatedRestEndpoints: [],
      supabaseRenderImageCount: supabaseRenderImages.length,
      firstSupabaseImageStart: supabaseRenderImages.length
        ? Math.min(...supabaseRenderImages.map((entry) => entry.startTime))
        : null,
      supabaseImagesBefore2000: supabaseRenderImages.filter((entry) => entry.startTime <= 2000).length,
      supabaseImagesBeforeLateThreshold: supabaseRenderImages.filter((entry) => entry.startTime <= threshold).length,
      supabaseImagesAfterLateThreshold: supabaseRenderImages.filter((entry) => entry.startTime >= threshold).length,
      lateImageStartMs: threshold,
      restResourcePaths: supabaseRestEntries.map((entry) => entry.name),
    };
  }, lateThreshold);

const requestedPages = new Set(process.argv.filter((argument) => argument.startsWith("--page=")).map((argument) => argument.slice(7)));
for (const name of requestedPages) if (!pages.some((page) => page.name === name)) throw new Error(`Unknown public performance page: ${name}`);
const selectedPages = requestedPages.size ? pages.filter((page) => requestedPages.has(page.name)) : pages;
const browser = await chromium.launch({ headless: true, ...(chromiumChannel ? { channel: chromiumChannel } : {}) });
const results = [];
const failures = [];
const warnings = [];

for (const pageSpec of selectedPages) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();
  await context.addInitScript(installPublicInteractionMetrics);
  const consoleErrors = [];
  const pageErrors = [];
  const failedAssets = [];
  const httpErrors = [];
  const networkFailures = [];
  const slowResponses = [];
  const responses = new Map();

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push({ message: diagnosticMessage(message.text()),
      url: diagnosticUrl(message.location().url), line: message.location().lineNumber });
  });
  page.on("pageerror", (error) => {
    pageErrors.push(diagnosticMessage(error.message));
  });
  page.on("response", (response) => {
    const url = response.url();
    const request = response.request();
    const receipt = { url: diagnosticUrl(url), status: response.status(), resourceType: request.resourceType(),
      critical: isCriticalPublicRequest(url, request.resourceType(), baseUrl), ...diagnosticTiming(request) };
    responses.set(request, receipt);
    if (response.status() >= 400) {
      httpErrors.push(receipt);
      if (receipt.critical) failedAssets.push(receipt);
    }
  });
  page.on("requestfinished", (request) => {
    const receipt = responses.get(request);
    if (!receipt) return;
    Object.assign(receipt, diagnosticTiming(request));
    if (receipt.responseEndMs >= 3000) slowResponses.push(receipt);
    responses.delete(request);
  });
  page.on("requestfailed", (request) => {
    networkFailures.push({ url: diagnosticUrl(request.url()), resourceType: request.resourceType(),
      critical: isCriticalPublicRequest(request.url(), request.resourceType(), baseUrl),
      error: diagnosticMessage(request.failure()?.errorText || "unknown"), ...diagnosticTiming(request) });
  });

  const url = `${baseUrl}${pageSpec.path}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  let readinessError = null;
  try {
    await page.waitForFunction(() => {
      const content = document.querySelector("[data-route-visual-state]");
      return content && !content.hasAttribute("inert") && !document.getElementById("root")?.hasAttribute("inert") &&
        !content.querySelector('[data-route-pending="true"]') && ["ready", "degraded", "handoff"].includes(content.getAttribute("data-route-visual-state"));
    }, undefined, { timeout: 20_000 });
  } catch {
    readinessError = "必要正文在 20 秒内仍未解除交互等待。";
  }
  await scrollThroughPage(page);

  const metrics = await collectPageMetrics(page, lateImageStartMs);
  const navigationTiming = await page.evaluate(() => {
    const timing = performance.getEntriesByType("navigation")[0];
    return timing ? { responseStartMs: timing.responseStart, responseEndMs: timing.responseEnd,
      domContentLoadedMs: timing.domContentLoadedEventEnd, durationMs: timing.duration,
      transferSize: timing.transferSize } : null;
  });
  metrics.duplicatedRestEndpoints = countDuplicates(metrics.restResourcePaths.map(normalizePublicReadIdentity));
  delete metrics.restResourcePaths;
  let languageSwitch = [];
  let languageSwitchError = null;
  if (pageSpec.checkLanguageSwitch && !readinessError) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    try {
      languageSwitch = await exercisePublicLanguageSwitch(page, pageSpec.path);
    } catch {
      languageSwitchError = "语言切换未能在 15 秒内显示对应正文并恢复操作。";
    }
  }
  const interactionMetrics = await page.evaluate(() => window.__flashcastInteractionMetrics?.read() ?? null);

  const result = {
    name: pageSpec.name,
    path: pageSpec.path,
    url,
    ...metrics,
    navigationTiming,
    interactionMetrics,
    languageSwitch,
    consoleErrorCount: consoleErrors.length,
    pageErrorCount: pageErrors.length,
    failedAssetCount: failedAssets.length,
    consoleErrors,
    pageErrors: pageErrors.slice(0, 3),
    failedAssets,
    httpErrors,
    networkFailures,
    slowResponses,
  };
  results.push(result);

  const addFailure = (message) => failures.push({ page: pageSpec.name, path: pageSpec.path, message });
  const addWarning = (message) => warnings.push({ page: pageSpec.name, path: pageSpec.path, message });
  if (readinessError) addFailure(readinessError);
  if (languageSwitchError) addFailure(languageSwitchError);
  if (pageSpec.forbidFurnitureCatalog && result.furnitureCatalogScriptCount > 0) addFailure("非家具页面初始加载包含完整家具目录脚本。");
  if (pageSpec.requireFurnitureCatalogPreload && !result.hasFurnitureCatalog) addFailure("家具列表缺少完整 HTML 初始目录数据。");
  for (const receipt of languageSwitch) {
    if (receipt.lockDurationMs > 0 || receipt.ongoingLockMs > 0) addFailure(`同页语言切换重新锁住正文：${receipt.language}, ${receipt.lockDurationMs}ms`);
    if (receipt.clickToTranslatedContentMs > 200) addWarning(`语言正文更新时间超过项目目标：${receipt.language}, ${Math.round(receipt.clickToTranslatedContentMs)}ms > 200ms`);
  }

  if (result.horizontalOverflow) addFailure(`页面存在横向溢出：scrollWidth=${result.scrollWidth}, innerWidth=${result.innerWidth}`);
  if (result.brokenVisibleImageCount > 0) addFailure(`页面当前可见区域存在破图：visible=${result.brokenVisibleImageCount}`);
  if (result.pageErrorCount > 0) addFailure(`页面运行错误：${result.pageErrors.join(" | ")}`);
  if (result.failedAssetCount > 0) addFailure(`资源请求失败：${JSON.stringify(result.failedAssets)}`);
  for (const receipt of networkFailures.filter((item) => item.critical && !item.error.includes("ERR_ABORTED"))) {
    addFailure(`网络请求失败：${JSON.stringify(receipt)}`);
  }
  for (const receipt of httpErrors.filter((item) => !item.critical)) addWarning(`第三方请求失败：${JSON.stringify(receipt)}`);
  if (consoleErrors.length) addWarning(`浏览器控制台错误：${JSON.stringify(consoleErrors)}`);
  if (typeof pageSpec.maxPreloadBytes === "number" && result.preloadJsonBytes > pageSpec.maxPreloadBytes) {
    addFailure(`HTML 预注入 JSON 过大：${result.preloadJsonBytes} bytes > ${pageSpec.maxPreloadBytes} bytes`);
  }

  if (pageSpec.requireSiteSettingsPreload && !result.hasSiteSettings) addFailure("缺少 HTML 预注入 siteSettings。");
  if (pageSpec.requireHomeBundlePreload && !result.hasHomeBundle) addFailure("首页缺少 HTML 预注入 homeContentBundle。");
  if (pageSpec.requireSitePagePreload && !result.sitePageKeys.includes(pageSpec.requireSitePagePreload)) {
    addFailure(`缺少 HTML 预注入 sitePages.${pageSpec.requireSitePagePreload}。`);
  }
  if (pageSpec.requireServicesPreload && result.services <= 0) addFailure("服务页缺少 HTML 预注入 services。");
  if (pageSpec.requireMaterialsPreload && result.materials <= 0) addFailure("材料页缺少 HTML 预注入 materials。");
  if (pageSpec.requireMaterialDetailPreload && !result.materialDetailSlugs.includes(pageSpec.requireMaterialDetailPreload)) {
    addFailure(`产品详情页缺少完整 HTML 预注入材料：${pageSpec.requireMaterialDetailPreload}。`);
  }
  if (pageSpec.requireServiceAreasPreload && result.serviceAreas <= 0) addFailure("地区页缺少 HTML 预注入 serviceAreas。");
  if (pageSpec.requireBlogPostsPreload && result.blogPosts <= 0) addFailure("博客页缺少 HTML 预注入 blogPosts。");
  if (pageSpec.requireCtaBlockPreload && !result.ctaBlockKeys.includes(pageSpec.requireCtaBlockPreload)) {
    addFailure(`缺少 HTML 预注入 ctaBlocks.${pageSpec.requireCtaBlockPreload}。`);
  }
  if (pageSpec.requireProjectSummariesPreload && result.projectSummaries <= 0) addFailure("缺少 HTML 预注入 projectSummaries。");
  if (pageSpec.requireProjectDetailPreload && result.projectDetailSlugs.length <= 0) addFailure("项目详情页缺少 HTML 预注入 projectDetails。");
  if (typeof pageSpec.maxHomeBundleFetches === "number" && result.homeBundleFetchCount > pageSpec.maxHomeBundleFetches) {
    addFailure(`浏览器端重复请求 home_bundle：${result.homeBundleFetchCount}`);
  }
  if (typeof pageSpec.maxProjectRestFetches === "number" && result.projectRestFetchCount > pageSpec.maxProjectRestFetches) {
    addFailure(`浏览器端重复请求 projects：${result.projectRestFetchCount}`);
  }
  const optionalVisibilityReads = pageSpec.allowOptionalHomeVisibility ? result.optionalHomeVisibilityKeys.length : 0;
  if (pageSpec.allowOptionalHomeVisibility && (optionalVisibilityReads > 2 || new Set(result.optionalHomeVisibilityKeys).size !== optionalVisibilityReads)) {
    addFailure("首页可选显示规则发生重复读取；每个可选区块最多一次。");
  }
  const unseededCoreReads = result.supabaseRestFetchCount - optionalVisibilityReads;
  if (typeof pageSpec.maxSupabaseRestFetches === "number" && unseededCoreReads > pageSpec.maxSupabaseRestFetches) {
    addFailure(`浏览器端仍有未预注入的必要 Supabase REST 请求：${unseededCoreReads} > ${pageSpec.maxSupabaseRestFetches}`);
  }

  const shouldCheckDynamicImages = pageSpec.highRiskDynamicImages || result.supabaseRenderImageCount >= 6;
  if (shouldCheckDynamicImages && result.supabaseRenderImageCount > 0) {
    if (result.firstSupabaseImageStart > firstImageStartMaxMs) {
      addFailure(`Supabase 图片开始请求太晚：${result.firstSupabaseImageStart}ms > ${firstImageStartMaxMs}ms`);
    }
    if (
      typeof pageSpec.minSupabaseImagesBeforeLateThreshold === "number" &&
      result.supabaseImagesBeforeLateThreshold < pageSpec.minSupabaseImagesBeforeLateThreshold
    ) {
      addFailure(
        `${lateImageStartMs}ms 内开始请求的 Supabase 图片太少：${result.supabaseImagesBeforeLateThreshold} < ${pageSpec.minSupabaseImagesBeforeLateThreshold}`,
      );
    }
    if (result.supabaseImagesAfterLateThreshold > maxLateSupabaseImages) {
      addFailure(
        `${lateImageStartMs}ms 后才开始请求的 Supabase 图片过多：${result.supabaseImagesAfterLateThreshold} > ${maxLateSupabaseImages}`,
      );
    }
  }

  if (result.duplicatedRestEndpoints.length > 0) {
    addWarning(`存在重复 Supabase REST 请求：${JSON.stringify(result.duplicatedRestEndpoints.slice(0, 3))}`);
  }

  await context.close();
}

await browser.close();

const report = {
  ok: failures.length === 0,
  baseUrl,
  thresholds: {
    firstImageStartMaxMs,
    lateImageStartMs,
    maxLateSupabaseImages,
  },
  checkedPages: pages.map((page) => page.path),
  results,
  warnings,
  failures,
};

console.log(JSON.stringify(report, null, 2));

if (failures.length > 0) {
  throw new Error(`Public performance verification failed: ${failures.map((failure) => `${failure.path}: ${failure.message}`).join("; ")}`);
}
