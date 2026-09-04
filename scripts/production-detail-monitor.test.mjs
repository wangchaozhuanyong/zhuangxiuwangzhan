import assert from "node:assert/strict";
import test from "node:test";
import {
  DETAIL_LANGUAGES,
  DETAIL_ROUTE_TYPES,
  HIGH_RISK_BLOG_SLUG,
  assessDetailLatency,
  extractSitemapDetailUrls,
  sanitizeMonitorUrl,
  selectDeterministicDetailSamples,
  validateDetailHtml,
} from "./production-detail-monitor.mjs";

const baseUrl = "https://flashcast.com.my";

const buildSitemap = () => {
  const urls = [];
  for (const language of DETAIL_LANGUAGES) {
    for (const type of DETAIL_ROUTE_TYPES) {
      urls.push(`${baseUrl}/${language}/${type}/alpha`);
      urls.push(`${baseUrl}/${language}/${type}/omega`);
      urls.push(`${baseUrl}/${language}/${type}/middle`);
    }
    urls.push(`${baseUrl}/${language}/blog/${HIGH_RISK_BLOG_SLUG}`);
    urls.push(`${baseUrl}/${language}/blog/zulu-last-stable-sample`);
  }
  return `<urlset>${urls.map((url) => `<url><loc>${url}</loc></url>`).join("")}</urlset>`;
};

const validHtml = (path = "/en/blog/example") => {
  const alternatePath = path.replace(/^\/en/, "/zh");
  return `<!doctype html><html lang="en"><head>
    <title>Example detail | FLASH CAST</title>
    <link rel="canonical" href="${baseUrl}${path}">
    <link rel="alternate" hreflang="en" href="${baseUrl}${path}">
    <link rel="alternate" hreflang="zh-CN" href="${baseUrl}${alternatePath}">
    <link rel="alternate" hreflang="x-default" href="${baseUrl}${path}">
  </head><body><h1>Example detail</h1><p>${"content ".repeat(150)}</p><p>FLASH CAST</p></body></html>`;
};

test("extracts only same-origin localized detail URLs", () => {
  const xml = `${buildSitemap()}<loc>https://attacker.example/en/blog/nope</loc><loc>${baseUrl}/en/blog</loc>`;
  const urls = extractSitemapDetailUrls(xml, baseUrl);

  assert.ok(urls.length > 20);
  assert.ok(urls.every((url) => url.startsWith(baseUrl)));
  assert.ok(urls.every((url) => /^\/(en|zh)\/(blog|projects|materials|services|locations)\/[^/]+$/.test(new URL(url).pathname)));
});

test("selects two stable samples per language and type and pins DBKL", () => {
  const urls = extractSitemapDetailUrls(buildSitemap(), baseUrl);
  const first = selectDeterministicDetailSamples(urls, baseUrl);
  const second = selectDeterministicDetailSamples([...urls].reverse(), baseUrl);

  assert.deepEqual(first, second);
  assert.deepEqual(first.deficits, []);
  assert.equal(first.samples.length, (DETAIL_LANGUAGES.length * DETAIL_ROUTE_TYPES.length * 2) + DETAIL_LANGUAGES.length);
  for (const language of DETAIL_LANGUAGES) {
    assert.ok(first.samples.some((item) => new URL(item.url).pathname === `/${language}/blog/${HIGH_RISK_BLOG_SLUG}`));
  }
});

test("reports a sampling deficit instead of silently reducing coverage", () => {
  const result = selectDeterministicDetailSamples([
    `${baseUrl}/en/blog/only-one`,
  ], baseUrl);

  assert.ok(result.deficits.some((item) => item.language === "en" && item.type === "blog" && item.found === 1));
  assert.ok(result.deficits.some((item) => item.language === "zh" && item.type === "locations" && item.found === 0));
});

test("accepts semantic detail HTML with canonical and language alternates", () => {
  const path = "/en/blog/example";
  const result = validateDetailHtml({
    body: validHtml(path),
    contentType: "text/html; charset=UTF-8",
    expectedUrl: `${baseUrl}${path}`,
    responseUrl: `${baseUrl}${path}`,
    status: 200,
  });

  assert.deepEqual(result.issues, []);
});

test("rejects a generic homepage, error marker and oversized response", () => {
  const path = "/en/blog/example";
  const body = `<!doctype html><html lang="en"><head><title>FLASH CAST</title>
    <link rel="canonical" href="${baseUrl}/en">
  </head><body><h1>Home</h1><p>502 Bad Gateway</p>${"x".repeat(260 * 1024)}</body></html>`;
  const result = validateDetailHtml({
    body,
    contentType: "text/html",
    expectedUrl: `${baseUrl}${path}`,
    responseUrl: `${baseUrl}/en`,
    status: 200,
  });

  assert.ok(result.issues.some((item) => item.stage === "canonical"));
  assert.ok(result.issues.some((item) => item.stage === "hreflang"));
  assert.ok(result.issues.some((item) => item.stage === "error-marker"));
  assert.ok(result.issues.some((item) => item.stage === "size"));
  assert.ok(result.issues.some((item) => item.stage === "redirect"));
});

test("sanitizes query strings from monitor report URLs", () => {
  assert.equal(
    sanitizeMonitorUrl(`${baseUrl}/en/blog/example?__flashcast_refresh=1&token=secret`),
    `${baseUrl}/en/blog/example`,
  );
});

test("enforces the 2.5, 5 and 8 second detail latency thresholds", () => {
  assert.equal(assessDetailLatency([2_499]).status, "pass");
  assert.equal(assessDetailLatency([3_000]).status, "warning");
  assert.equal(assessDetailLatency([6_000]).status, "retry");
  assert.equal(assessDetailLatency([6_000, 2_000]).status, "pass");
  assert.equal(assessDetailLatency([6_000, 3_000]).status, "warning");
  assert.deepEqual(assessDetailLatency([6_000, 6_100]).reason, "sustained");
  assert.deepEqual(assessDetailLatency([8_001]).reason, "hard-limit");
});
