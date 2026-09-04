export const DETAIL_ROUTE_TYPES = ["blog", "projects", "materials", "services", "locations"];
export const DETAIL_LANGUAGES = ["en", "zh"];
export const HIGH_RISK_BLOG_SLUG = "renovation-permit-dbkl-guide";

const htmlErrorMarkers = [
  /502 Bad Gateway/i,
  /503 Service Unavailable/i,
  /504 Gateway Time-out/i,
  /Web server is returning an unknown error/i,
  /Error 1101/i,
  /Application error: a client-side exception has occurred/i,
];

const decodeXml = (value) => value
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">");

const normalizePath = (value) => value.replace(/\/+$/, "") || "/";

const readAttribute = (tag, name) => {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match?.[1] || "";
};

const linkHref = (html, predicate) => {
  const links = html.match(/<link\b[^>]*>/gi) || [];
  const link = links.find((tag) => predicate({
    rel: readAttribute(tag, "rel"),
    hreflang: readAttribute(tag, "hreflang"),
  }));
  return link ? readAttribute(link, "href") : "";
};

const stableSpread = (values, count) => {
  const sorted = [...new Set(values)].sort();
  if (sorted.length <= count) return sorted;
  if (count === 1) return [sorted[0]];
  return Array.from({ length: count }, (_, index) => (
    sorted[Math.round((index * (sorted.length - 1)) / (count - 1))]
  ));
};

export function extractSitemapDetailUrls(xml, configuredBaseUrl) {
  const baseUrl = new URL(configuredBaseUrl);
  const urls = [];

  for (const match of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)) {
    try {
      const candidate = new URL(decodeXml(match[1]));
      if (candidate.origin !== baseUrl.origin || candidate.search || candidate.hash) continue;
      if (!/^\/(?:en|zh)\/(?:blog|projects|materials|services|locations)\/[^/]+\/?$/.test(candidate.pathname)) continue;
      candidate.pathname = normalizePath(candidate.pathname);
      urls.push(candidate.href);
    } catch {
      // Invalid sitemap URLs are handled by the sitemap check; they are not sampled here.
    }
  }

  return [...new Set(urls)].sort();
}

export function selectDeterministicDetailSamples(urls, configuredBaseUrl, perGroup = 2) {
  const baseUrl = new URL(configuredBaseUrl);
  const samples = [];
  const deficits = [];

  for (const language of DETAIL_LANGUAGES) {
    for (const type of DETAIL_ROUTE_TYPES) {
      const matching = urls.filter((item) => {
        const candidate = new URL(item);
        return candidate.origin === baseUrl.origin
          && candidate.pathname.startsWith(`/${language}/${type}/`);
      });

      if (matching.length < perGroup) {
        deficits.push({ language, type, found: matching.length, required: perGroup });
      }

      let selected = stableSpread(matching, perGroup);
      if (type === "blog") {
        const pinned = matching.find((item) => new URL(item).pathname === `/${language}/blog/${HIGH_RISK_BLOG_SLUG}`);
        if (pinned && !selected.includes(pinned)) {
          selected = [...selected, pinned];
        }
      }

      for (const url of [...new Set(selected)].sort()) {
        samples.push({ language, type, url });
      }
    }
  }

  return { samples, deficits };
}

export function sanitizeMonitorUrl(value) {
  const url = new URL(value);
  return `${url.origin}${normalizePath(url.pathname)}`;
}

export function assessDetailLatency(ttfbValues) {
  const values = ttfbValues.filter((value) => Number.isFinite(value) && value >= 0);
  if (!values.length) return { status: "fail", reason: "missing", message: "TTFB measurement is unavailable" };
  if (values[0] > 8_000) {
    return { status: "fail", reason: "hard-limit", message: `TTFB ${values[0]} ms exceeded the 8000 ms hard limit` };
  }
  if (values[0] > 5_000 && values.length === 1) {
    return { status: "retry", reason: "confirmation", message: "TTFB exceeded 5000 ms; one confirmation request is required" };
  }
  if (values.length > 1 && values[0] > 5_000 && values[1] > 5_000) {
    return { status: "fail", reason: "sustained", message: "TTFB stayed above 5000 ms after one confirmation request" };
  }
  const finalTtfb = values.at(-1);
  if (finalTtfb > 2_500) {
    return { status: "warning", reason: "slow", message: `Semantic checks passed; TTFB was ${finalTtfb} ms` };
  }
  return { status: "pass", reason: "healthy", message: "TTFB is within the 2500 ms target" };
}

export function validateDetailHtml({ body, contentType, expectedUrl, responseUrl, status }) {
  const issues = [];
  const expected = new URL(expectedUrl);
  const finalUrl = new URL(responseUrl || expectedUrl);
  const expectedLanguage = expected.pathname.startsWith("/zh/") ? "zh" : "en";
  const expectedHtmlLanguage = expectedLanguage === "zh" ? "zh-CN" : "en";
  const pathWithoutLanguage = expected.pathname.replace(/^\/(?:en|zh)/, "") || "/";
  const expectedAlternates = {
    en: normalizePath(`/en${pathWithoutLanguage}`),
    "zh-CN": normalizePath(`/zh${pathWithoutLanguage}`),
    "x-default": normalizePath(`/en${pathWithoutLanguage}`),
  };
  const byteLength = new TextEncoder().encode(body).byteLength;

  if (status !== 200) issues.push({ stage: "http", message: `Expected HTTP 200 but received ${status}` });
  if (!/text\/html/i.test(contentType)) issues.push({ stage: "content-type", message: `Expected text/html but received ${contentType || "(missing)"}` });
  if (!/<html[\s>]/i.test(body)) issues.push({ stage: "html", message: "Response is not an HTML document" });
  if (!new RegExp(`<html\\b[^>]*\\blang=["']${expectedHtmlLanguage}["']`, "i").test(body)) {
    issues.push({ stage: "language", message: `Missing html lang=${expectedHtmlLanguage}` });
  }
  if (!/<title\b[^>]*>\s*[^<\s][\s\S]*?<\/title>/i.test(body)) issues.push({ stage: "title", message: "Missing non-empty title" });
  if (!/<h1[\s>]/i.test(body)) issues.push({ stage: "content", message: "Missing detail-page H1 content" });
  if (!/FLASH\s*CAST/i.test(body)) issues.push({ stage: "content", message: "Missing FLASH CAST brand marker" });
  if (byteLength < 1_024) issues.push({ stage: "size", message: `HTML is unexpectedly small (${byteLength} bytes)` });
  if (byteLength > 250 * 1_024) issues.push({ stage: "size", message: `HTML exceeds 250 KB (${byteLength} bytes)` });

  const matchedError = htmlErrorMarkers.find((pattern) => pattern.test(body));
  if (matchedError) issues.push({ stage: "error-marker", message: `Response contains error-page marker ${matchedError}` });

  const canonicalHref = linkHref(body, ({ rel }) => rel.toLowerCase().split(/\s+/).includes("canonical"));
  if (!canonicalHref) {
    issues.push({ stage: "canonical", message: "Missing canonical link" });
  } else {
    try {
      const canonical = new URL(canonicalHref, expected);
      if (canonical.origin !== expected.origin || normalizePath(canonical.pathname) !== normalizePath(expected.pathname) || canonical.search || canonical.hash) {
        issues.push({ stage: "canonical", message: `Canonical does not match ${normalizePath(expected.pathname)}` });
      }
    } catch {
      issues.push({ stage: "canonical", message: "Canonical URL is invalid" });
    }
  }

  for (const [hreflang, expectedPath] of Object.entries(expectedAlternates)) {
    const href = linkHref(body, (attrs) => attrs.hreflang.toLowerCase() === hreflang.toLowerCase());
    if (!href) {
      issues.push({ stage: "hreflang", message: `Missing hreflang=${hreflang}` });
      continue;
    }
    try {
      const alternate = new URL(href, expected);
      if (alternate.origin !== expected.origin || normalizePath(alternate.pathname) !== expectedPath) {
        issues.push({ stage: "hreflang", message: `hreflang=${hreflang} points to the wrong route` });
      }
    } catch {
      issues.push({ stage: "hreflang", message: `hreflang=${hreflang} has an invalid URL` });
    }
  }

  if (finalUrl.origin !== expected.origin || normalizePath(finalUrl.pathname) !== normalizePath(expected.pathname)) {
    issues.push({ stage: "redirect", message: "Final response URL left the expected canonical route" });
  }

  return { issues, byteLength, canonicalHref };
}
