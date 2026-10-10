// Real public GETs and browser rendering only. Never submit forms, write telemetry or inject CMS data.
const norm = (value) => String(value || "").replace(/\s+/g, " ").trim();
const decode = (value) => String(value).replace(/&#(x[\da-f]+|\d+);|&(amp|lt|gt|quot|apos|#39);/gi, (_, code, name) => code
  ? String.fromCodePoint(code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : Number(code))
  : ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" })[name.toLowerCase()]);
export function inspectRawMetadata(html, title, description, strictTitle = false) {
  const actualTitle = decode(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
  const tag = (html.match(/<meta\b[^>]*>/gi) || []).find((value) => /\bname\s*=\s*["']description["']/i.test(value));
  const actualDescription = decode(tag?.match(/\bcontent\s*=\s*"([^"]*)"/i)?.[1] ?? tag?.match(/\bcontent\s*=\s*'([^']*)'/i)?.[1] ?? "");
  return { titleFound: Boolean(norm(title)) && (strictTitle ? actualTitle === title : norm(actualTitle).includes(norm(title))),
    descriptionMatches: Boolean(norm(description)) && (strictTitle ? actualDescription === description : norm(actualDescription) === norm(description)) };
}
export function assertRenderedEvidence(evidence, expected, headingsOnly = false) {
  return evidence.status === 200 && evidence.ready === true && evidence.runtimeErrors === 0
    && expected.length > 0 && missingRenderedPhrases(evidence, expected, headingsOnly).length === 0;
}
export function inspectHydratedMetadata(actual, expected) {
  return { titleFound: Boolean(expected?.title) && actual?.title === expected.title,
    descriptionMatches: Boolean(expected?.description) && actual?.description === expected.description };
}
export function missingRenderedPhrases(evidence, expected, headingsOnly = false) {
  // Readiness/status remain required for PASS, but must not turn one missing
  // phrase into a false diagnostic claiming every visible paragraph is absent.
  return expected.filter((phrase) => headingsOnly
    ? !evidence.visibleHeadings.some((heading) => norm(heading) === norm(phrase))
    : !norm(evidence.visibleMainText).includes(norm(phrase)));
}
export function reviewedBodyPhrases(content) {
  if (typeof content !== "string" || !content.trim()) throw Error("Reviewed native body is absent");
  // Inline tags do not create word boundaries: </a>. renders as '.', not ' .'.
  const text = (html) => norm(decode(html.replace(/<\/?(?:p|h[1-6]|li|blockquote|ul|ol|div|section|br)\b[^>]*>/gi, " ").replace(/<[^>]*>/g, "")));
  const blocks = [...content.matchAll(/<(p|h[2-4]|li|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((match) => text(match[2])).filter(Boolean);
  return [...new Set(blocks.length ? blocks : [text(content)])];
}
// Local candidate text semantics only. This is never evidence of live-page acceptance.
export async function verifyCandidateTextContracts(candidates, channel = process.env.PLAYWRIGHT_CHROMIUM_CHANNEL) {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
  const rows = [];
  try {
    const context = await browser.newContext(); await context.route("**/*", (route) => route.abort());
    const page = await context.newPage();
    for (const candidate of candidates) {
      let content = candidate.content; let pipelineSourceSha256;
      if (candidate.entry && candidate.row) {
        const { renderReviewedRow } = await import("./publisher-reviewed-renderer.mjs");
        const rendered = await renderReviewedRow(page, candidate); content = rendered.mappedContent; pipelineSourceSha256 = rendered.sourceSha256;
      } else await page.setContent(`<main>${content}</main>`);
      const actual = norm((await readVisibleBodyEvidence(page)).visibleMainText); const phrases = reviewedBodyPhrases(content);
      const missing = phrases.filter((phrase) => !actual.includes(phrase));
      rows.push({ target: candidate.target, language: candidate.language, checkedBlocks: phrases.length, missingRequired: missing,
        ...(pipelineSourceSha256 ? { actualProductPipeline: true, pipelineSourceSha256 } : {}), ok: missing.length === 0 });
    }
    return { checkedAt: new Date().toISOString(), fixtureOnly: true, livePageAcceptance: false,
      checkedCandidates: rows.length, rows, ok: rows.every((row) => row.ok), productionWrites: 0 };
  } finally { await browser.close(); }
}
export async function reviewedRenderedBodyPhrases(candidate, channel = process.env.PLAYWRIGHT_CHROMIUM_CHANNEL) {
  const { chromium } = await import("@playwright/test"); const { renderReviewedRow } = await import("./publisher-reviewed-renderer.mjs");
  const browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
  try {
    const context = await browser.newContext({ bypassCSP: false }); await context.route("**/*", (route) => route.abort());
    const rendered = await renderReviewedRow(await context.newPage(), candidate);
    return reviewedBodyPhrases(rendered.mappedContent);
  } finally { await browser.close(); }
}
export async function readVisibleBodyEvidence(page) {
  return page.evaluate(() => {
      const main = document.querySelector("main");
      const isVisible = (node) => {
        if (node.closest('[inert], [hidden]')) return false;
        for (let parent = node; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse" || Number(style.opacity) === 0) return false;
        }
        return true;
      };
      const hasRenderedText = (node) => {
        const range = document.createRange(); range.selectNodeContents(node);
        return [...range.getClientRects()].some((rect) => rect.width > 0 && rect.height > 0);
      };
      const visibleText = (node) => {
        if (node.nodeType === Node.TEXT_NODE) return node.parentElement && isVisible(node.parentElement) && hasRenderedText(node) ? node.textContent || "" : "";
        if (!(node instanceof Element)) return "";
        if (!isVisible(node)) return "";
        if (node.tagName === "BR") return "\n";
        const content = [...node.childNodes].map(visibleText).join("");
        return /^(block|list-item|flex|grid|table)/.test(getComputedStyle(node).display) ? `\n${content}\n` : content;
      };
      // Sanitized list items can be direct Text nodes. Traverse the rendered tree
      // once, including boxless containers; actual text ranges still need geometry.
      return { visibleMainText: main ? visibleText(main) : "",
        visibleHeadings: main ? [...main.querySelectorAll("h2, h3, h4")].filter(isVisible).map(visibleText).filter((text) => text.trim()) : [] };
  });
}
export async function verifyPublicPage({ site, path, title, description, requiredText, headingsOnly = false, strictMetadata = false, hydratedMetadata, channel = process.env.PLAYWRIGHT_CHROMIUM_CHANNEL }) {
  if (site !== "https://flashcast.com.my" || !/^\/(en|zh)\//.test(path) || !requiredText?.length) throw Error("Exact public site, language path and reviewed text required");
  const url = `${site}${path}?managed_public_readback=${Date.now()}`;
  const raw = await fetch(url, { method: "GET", cache: "no-store", headers: { "cache-control": "no-cache" }, signal: AbortSignal.timeout(25000) });
  const metadata = inspectRawMetadata(await raw.text(), title, description, strictMetadata);
  if (strictMetadata && (!hydratedMetadata?.title || !hydratedMetadata?.description)) throw Error("Exact current source-derived hydrated metadata required");
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
  let blockedNonReads = 0; let runtimeErrors = 0;
  try {
    const context = await browser.newContext();
    await context.route("**/*", async (route) => {
      const request = route.request(); const requestUrl = new URL(request.url());
      const readRpc = request.method() === "POST" && requestUrl.hostname === "rbsnyexjifounogswrjp.supabase.co"
        && requestUrl.pathname === "/rest/v1/rpc/get_public_home_bundle";
      const telemetry = /(google-analytics\.com|googletagmanager\.com|doubleclick\.net|connect\.facebook\.net|clarity\.ms|hotjar\.|\/page_visits(?:\?|$)|\/g\/collect(?:\?|$))/i.test(request.url());
      if (telemetry || !["GET", "HEAD", "OPTIONS"].includes(request.method()) && !readRpc) { blockedNonReads += 1; return route.abort(); }
      return route.continue();
    });
    const page = await context.newPage(); page.on("pageerror", () => { runtimeErrors += 1; });
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 40000 });
    let ready = true;
    try {
      await page.waitForFunction(({ phrases, headings }) => {
        const main = document.querySelector("main");
        const visible = (node) => !node.closest('[inert], [hidden]') && getComputedStyle(node).display !== "none" && getComputedStyle(node).visibility !== "hidden" && node.getBoundingClientRect().width > 0;
        if (!main || !visible(main) || !main.querySelector("h1")) return false;
        const normText = (value) => String(value || "").replace(/\s+/g, " ").trim();
        const actual = headings ? [...main.querySelectorAll("h2, h3, h4")].filter(visible).map((node) => normText(node.textContent)) : [normText(main.innerText)];
        return phrases.every((phrase) => headings ? actual.includes(normText(phrase)) : actual[0].includes(normText(phrase)));
      }, { phrases: requiredText, headings: headingsOnly }, { timeout: 25000 });
    } catch { ready = false; }
    // Reveal native scroll-driven sections; never change visibility styles or bypass an inert gate.
    const scrollPositions = await page.evaluate(() => {
      const height = document.documentElement.scrollHeight; const step = Math.max(350, Math.floor(innerHeight * 0.75));
      return Array.from({ length: Math.ceil(height / step) + 1 }, (_, index) => Math.min(height, index * step));
    });
    for (const position of scrollPositions) { await page.evaluate((y) => window.scrollTo(0, y), position); await page.waitForTimeout(180); }
    const visible = await readVisibleBodyEvidence(page);
    let hydrated = null;
    if (strictMetadata) {
      try { await page.waitForFunction((expected) => document.title === expected.title
        && document.querySelector('meta[name="description"]')?.getAttribute("content") === expected.description, hydratedMetadata, { timeout: 15000 }); } catch { /* Exact checks below remain false. */ }
      const actual = await page.evaluate(() => ({ title: document.title, description: document.querySelector('meta[name="description"]')?.getAttribute("content") || "" }));
      hydrated = inspectHydratedMetadata(actual, hydratedMetadata);
    }
    const evidence = { status: response?.status() || 0, ready, runtimeErrors, ...visible };
    const renderedOk = assertRenderedEvidence(evidence, requiredText, headingsOnly);
    return { path, checkedAt: new Date().toISOString(), rawStatus: raw.status, metadata, status: evidence.status, ready, runtimeErrors,
      requiredText, headingsOnly, strictMetadata, ...(hydrated ? { hydratedMetadata: hydrated } : {}), found: renderedOk, missingRequired: missingRenderedPhrases(evidence, requiredText, headingsOnly),
      blockedNonReads, productionWrites: 0, renderedOk, ok: raw.status === 200 && Object.values(metadata).every(Boolean)
        && (!strictMetadata || Object.values(hydrated).every(Boolean)) && renderedOk };
  } finally { await browser.close(); }
}
