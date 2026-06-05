import { chromium } from "@playwright/test";

const baseUrl = (process.env.PUBLIC_PERFORMANCE_BASE_URL || process.env.PREVIEW_URL || "http://127.0.0.1:8788").replace(/\/+$/, "");
const chromiumChannel = process.env.PLAYWRIGHT_CHROMIUM_CHANNEL;
const firstImageStartMaxMs = Number(process.env.PUBLIC_PERFORMANCE_FIRST_IMAGE_START_MAX_MS || 3000);
const lateImageStartMs = Number(process.env.PUBLIC_PERFORMANCE_LATE_IMAGE_START_MS || 3500);
const maxLateSupabaseImages = Number(process.env.PUBLIC_PERFORMANCE_MAX_LATE_SUPABASE_IMAGES || 20);
const projectDetailPath =
  process.env.PUBLIC_PERFORMANCE_PROJECT_DETAIL_PATH || "/zh/projects/damansara-heights-semi-d-refurbishment";

const pages = [
  {
    name: "home",
    path: "/zh",
    requireSiteSettingsPreload: true,
    requireHomeBundlePreload: true,
    maxHomeBundleFetches: 0,
    maxSupabaseRestFetches: 0,
    highRiskDynamicImages: true,
    minSupabaseImagesBeforeLateThreshold: 4,
  },
  {
    name: "projects",
    path: "/zh/projects",
    requireSiteSettingsPreload: true,
    requireSitePagePreload: "projects",
    requireProjectSummariesPreload: true,
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
    maxSupabaseRestFetches: 0,
  },
  {
    name: "materials",
    path: "/zh/materials",
    requireSiteSettingsPreload: true,
    requireSitePagePreload: "materials",
    requireMaterialsPreload: true,
    maxSupabaseRestFetches: 0,
  },
  {
    name: "blog",
    path: "/zh/blog",
    requireSiteSettingsPreload: true,
    requireSitePagePreload: "blog",
    requireBlogPostsPreload: true,
    requireCtaBlockPreload: "home_final",
    maxSupabaseRestFetches: 0,
  },
];

const normalizeResourcePath = (resourceUrl) => {
  try {
    const url = new URL(resourceUrl);
    return `${url.origin}${url.pathname}`;
  } catch {
    return resourceUrl.split("?")[0] || resourceUrl;
  }
};

const countDuplicates = (items) => {
  const counts = new Map();
  for (const item of items) counts.set(item, (counts.get(item) || 0) + 1);
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([endpoint, count]) => ({ endpoint, count }));
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
    const visibleImages = Array.from(document.images).filter((img) => {
      const rect = img.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 1 && rect.height > 1;
    });
    const loadedImages = Array.from(document.images).filter((img) => img.currentSrc);

    return {
      preloadKeys: preload ? Object.keys(preload).sort() : [],
      hasSiteSettings: Boolean(preload?.siteSettings),
      hasHomeBundle: Boolean(preload?.homeContentBundle),
      sitePageKeys: preload?.sitePages ? Object.keys(preload.sitePages).sort() : [],
      services: Array.isArray(preload?.services) ? preload.services.length : 0,
      materials: Array.isArray(preload?.materials) ? preload.materials.length : 0,
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

const browser = await chromium.launch({ headless: true, ...(chromiumChannel ? { channel: chromiumChannel } : {}) });
const results = [];
const failures = [];
const warnings = [];

for (const pageSpec of pages) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedAssets = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  page.on("response", (response) => {
    const url = response.url();
    if ((url.includes("/assets/") || url.includes("/storage/v1/render/image/public/")) && response.status() >= 400) {
      failedAssets.push({ url, status: response.status() });
    }
  });

  const url = `${baseUrl}${pageSpec.path}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForTimeout(900);
  await scrollThroughPage(page);

  const metrics = await collectPageMetrics(page, lateImageStartMs);
  metrics.duplicatedRestEndpoints = countDuplicates(metrics.restResourcePaths.map(normalizeResourcePath));
  delete metrics.restResourcePaths;

  const result = {
    name: pageSpec.name,
    path: pageSpec.path,
    url,
    ...metrics,
    consoleErrorCount: consoleErrors.length,
    pageErrorCount: pageErrors.length,
    failedAssetCount: failedAssets.length,
    consoleErrors: consoleErrors.slice(0, 3),
    pageErrors: pageErrors.slice(0, 3),
    failedAssets: failedAssets.slice(0, 3),
  };
  results.push(result);

  const addFailure = (message) => failures.push({ page: pageSpec.name, path: pageSpec.path, message });
  const addWarning = (message) => warnings.push({ page: pageSpec.name, path: pageSpec.path, message });

  if (result.horizontalOverflow) addFailure(`页面存在横向溢出：scrollWidth=${result.scrollWidth}, innerWidth=${result.innerWidth}`);
  if (result.brokenVisibleImageCount > 0) addFailure(`页面当前可见区域存在破图：visible=${result.brokenVisibleImageCount}`);
  if (result.pageErrorCount > 0) addFailure(`页面运行错误：${result.pageErrors.join(" | ")}`);
  if (result.failedAssetCount > 0) addFailure(`资源请求失败：${JSON.stringify(result.failedAssets)}`);

  if (pageSpec.requireSiteSettingsPreload && !result.hasSiteSettings) addFailure("缺少 HTML 预注入 siteSettings。");
  if (pageSpec.requireHomeBundlePreload && !result.hasHomeBundle) addFailure("首页缺少 HTML 预注入 homeContentBundle。");
  if (pageSpec.requireSitePagePreload && !result.sitePageKeys.includes(pageSpec.requireSitePagePreload)) {
    addFailure(`缺少 HTML 预注入 sitePages.${pageSpec.requireSitePagePreload}。`);
  }
  if (pageSpec.requireServicesPreload && result.services <= 0) addFailure("服务页缺少 HTML 预注入 services。");
  if (pageSpec.requireMaterialsPreload && result.materials <= 0) addFailure("材料页缺少 HTML 预注入 materials。");
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
  if (typeof pageSpec.maxSupabaseRestFetches === "number" && result.supabaseRestFetchCount > pageSpec.maxSupabaseRestFetches) {
    addFailure(`浏览器端仍有 Supabase REST 请求：${result.supabaseRestFetchCount} > ${pageSpec.maxSupabaseRestFetches}`);
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
