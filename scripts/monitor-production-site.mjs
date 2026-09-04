import { promises as dns } from "node:dns";
import { appendFile, writeFile } from "node:fs/promises";
import tls from "node:tls";
import {
  assessDetailLatency,
  extractSitemapDetailUrls,
  sanitizeMonitorUrl,
  selectDeterministicDetailSamples,
  validateDetailHtml,
} from "./production-detail-monitor.mjs";

const baseUrl = new URL(process.env.MONITOR_BASE_URL || "https://flashcast.com.my");
const reportPath = process.env.MONITOR_REPORT_PATH || "monitor-report.json";
const timeoutMs = Number(process.env.MONITOR_TIMEOUT_MS || "15000");
const retryCount = Math.max(1, Number(process.env.MONITOR_RETRIES || "2"));
const supabaseUrl = process.env.MONITOR_SUPABASE_URL?.trim();
const startedAt = Date.now();

const checks = [];
let deploymentVersion = "";
let contentVersion = "";
let sitemapXml = "";
let dnsDurationMs = null;
let tlsDurationMs = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function mapWithConcurrency(items, concurrency, worker) {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(Math.max(1, concurrency), queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (item !== undefined) await worker(item);
    }
  });
  await Promise.all(runners);
}

function addCheck(name, status, message, details = {}) {
  checks.push({ name, status, message, ...details });
}

function normalizeError(error) {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function fetchWithRetry(url, options = {}) {
  let lastError;
  const priorFailures = [];
  const {
    attemptTimeoutMs = timeoutMs,
    hardFailureMs = 0,
    ...fetchOptions
  } = options;

  for (let attempt = 1; attempt <= retryCount; attempt += 1) {
    const attemptStartedAt = Date.now();
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        redirect: "follow",
        signal: fetchOptions.signal || AbortSignal.timeout(attemptTimeoutMs),
        headers: {
          "user-agent": "FLASH-CAST-Production-Monitor/1.0 (+https://flashcast.com.my)",
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          ...(fetchOptions.headers || {}),
        },
      });

      return {
        response,
        durationMs: Date.now() - attemptStartedAt,
        attempt,
        attemptStartedAt,
        priorFailures,
      };
    } catch (error) {
      lastError = error;
      const durationMs = Date.now() - attemptStartedAt;
      priorFailures.push({
        attempt,
        durationMs,
        error: normalizeError(error),
      });
      if (hardFailureMs && durationMs >= hardFailureMs) break;
      if (attempt < retryCount) await sleep(Math.min(500 * 2 ** (attempt - 1), 2_000));
    }
  }

  const exhausted = new Error(`Network request failed after ${priorFailures.length} attempt(s): ${normalizeError(lastError)}`);
  exhausted.attempts = priorFailures;
  exhausted.hardTimeout = Boolean(hardFailureMs && priorFailures.at(-1)?.durationMs >= hardFailureMs);
  throw exhausted;
}

async function checkDns() {
  const checkStartedAt = Date.now();
  try {
    const addresses = await dns.lookup(baseUrl.hostname, { all: true });
    dnsDurationMs = Date.now() - checkStartedAt;
    if (!addresses.length) throw new Error("DNS lookup returned no address");
    addCheck(
      "DNS resolution",
      "pass",
      `Resolved ${baseUrl.hostname} to ${addresses.map((item) => item.address).join(", ")}`,
      { durationMs: dnsDurationMs },
    );
  } catch (error) {
    dnsDurationMs = Date.now() - checkStartedAt;
    addCheck("DNS resolution", "fail", normalizeError(error), { durationMs: dnsDurationMs });
  }
}

async function readTlsCertificate() {
  const checkStartedAt = Date.now();
  if (baseUrl.protocol !== "https:") {
    addCheck("TLS certificate", "warning", `Skipped because ${baseUrl.href} is not HTTPS`);
    return;
  }

  await new Promise((resolve) => {
    let settled = false;
    const finish = (callback) => {
      if (settled) return;
      settled = true;
      callback();
      resolve();
    };

    const socket = tls.connect(
      {
        host: baseUrl.hostname,
        port: Number(baseUrl.port || 443),
        servername: baseUrl.hostname,
        timeout: timeoutMs,
        rejectUnauthorized: true,
      },
      () => {
        finish(() => {
          tlsDurationMs = Date.now() - checkStartedAt;
          try {
            const certificate = socket.getPeerCertificate();
            const validTo = new Date(certificate.valid_to);
            const remainingDays = Math.floor((validTo.getTime() - Date.now()) / 86_400_000);

            if (!certificate.valid_to || Number.isNaN(validTo.getTime())) {
              addCheck("TLS certificate", "fail", "Certificate expiry date is unavailable", { durationMs: tlsDurationMs });
            } else if (remainingDays < 7) {
              addCheck("TLS certificate", "fail", `Certificate expires in ${remainingDays} day(s)`, {
                validTo: validTo.toISOString(),
                durationMs: tlsDurationMs,
              });
            } else if (remainingDays < 21) {
              addCheck("TLS certificate", "warning", `Certificate expires in ${remainingDays} day(s)`, {
                validTo: validTo.toISOString(),
                durationMs: tlsDurationMs,
              });
            } else {
              addCheck("TLS certificate", "pass", `Certificate valid for ${remainingDays} more day(s)`, {
                validTo: validTo.toISOString(),
                durationMs: tlsDurationMs,
              });
            }
          } catch (error) {
            addCheck("TLS certificate", "fail", normalizeError(error), { durationMs: tlsDurationMs });
          } finally {
            socket.end();
          }
        });
      },
    );

    socket.on("timeout", () => {
      finish(() => {
        tlsDurationMs = Date.now() - checkStartedAt;
        addCheck("TLS certificate", "fail", `TLS handshake timed out after ${timeoutMs} ms`, { durationMs: tlsDurationMs });
        socket.destroy();
      });
    });

    socket.on("error", (error) => {
      finish(() => {
        tlsDurationMs = Date.now() - checkStartedAt;
        addCheck("TLS certificate", "fail", normalizeError(error), { durationMs: tlsDurationMs });
        socket.destroy();
      });
    });
  });
}

const htmlErrorMarkers = [
  /502 Bad Gateway/i,
  /503 Service Unavailable/i,
  /504 Gateway Time-out/i,
  /Web server is returning an unknown error/i,
  /Error 1101/i,
  /Application error: a client-side exception has occurred/i,
];

const pageChecks = [
  { path: "/zh", name: "Chinese homepage", kind: "html", publicCache: true, primary: true },
  { path: "/en", name: "English homepage", kind: "html", publicCache: true },
  { path: "/zh/services", name: "Services page", kind: "html", publicCache: true },
  { path: "/zh/projects", name: "Projects page", kind: "html", publicCache: true },
  { path: "/zh/materials", name: "Materials page", kind: "html", publicCache: true },
  { path: "/zh/blog", name: "Blog page", kind: "html", publicCache: true },
  { path: "/zh/quote", name: "Quote page", kind: "html", publicCache: true },
  { path: "/zh/contact", name: "Contact page", kind: "html", publicCache: true },
  { path: "/zh/process", name: "Process page", kind: "html", publicCache: true },
  { path: "/admin", name: "Admin login", kind: "html", adminCache: true },
  { path: "/__flashcast/version", name: "Public version endpoint", kind: "version" },
  { path: "/offline", name: "Offline fallback", kind: "offline" },
  { path: "/sw.js", name: "Service Worker", kind: "service-worker" },
  { path: "/robots.txt", name: "robots.txt", kind: "robots" },
  { path: "/sitemap.xml", name: "sitemap.xml", kind: "sitemap" },
];

let primaryHtml = "";

async function checkPage(config) {
  const url = new URL(config.path, baseUrl);

  try {
    const { response, durationMs, attempt } = await fetchWithRetry(url);
    const contentType = response.headers.get("content-type") || "";
    const cacheControl = response.headers.get("cache-control") || "";
    const body = await response.text();

    if (!response.ok) {
      addCheck(config.name, "fail", `${response.status} ${response.statusText}`, {
        url: response.url,
        durationMs,
        attempt,
      });
      return;
    }

    if (config.kind === "html" || config.kind === "offline") {
      if (!/<html[\s>]/i.test(body)) {
        addCheck(config.name, "fail", "Response does not contain an HTML document", {
          url: response.url,
          contentType,
          durationMs,
        });
        return;
      }

      if (config.kind === "offline" && !/当前网络不可用/.test(body)) {
        addCheck(config.name, "fail", "Offline document is missing its dedicated offline marker", {
          url: response.url,
          durationMs,
        });
        return;
      }

      const offlineRequiresRevalidation = /(?:no-store|no-cache)/i.test(cacheControl)
        || (/max-age=0/i.test(cacheControl) && /must-revalidate/i.test(cacheControl));
      if (config.kind === "offline" && !offlineRequiresRevalidation) {
        addCheck(config.name, "fail", `Offline document can be reused without revalidation: ${cacheControl || "(missing)"}`, {
          url: response.url,
          durationMs,
        });
        return;
      }

      const matchedError = htmlErrorMarkers.find((pattern) => pattern.test(body));
      if (matchedError) {
        addCheck(config.name, "fail", `Response contains an error-page marker: ${matchedError}`, {
          url: response.url,
          durationMs,
        });
        return;
      }

      if (config.primary && !/FLASH\s*CAST/i.test(body)) {
        addCheck(config.name, "warning", "Homepage source does not contain the FLASH CAST brand marker", {
          url: response.url,
          durationMs,
        });
      } else {
        addCheck(config.name, "pass", `${response.status} in ${durationMs} ms`, {
          url: response.url,
          contentType,
          durationMs,
          attempt,
        });
      }

      if (config.primary) primaryHtml = body;

      if (config.adminCache && !/no-store/i.test(cacheControl)) {
        addCheck("Admin cache policy", "fail", `Expected no-store but received: ${cacheControl || "(missing)"}`, {
          url: response.url,
        });
      } else if (config.adminCache) {
        addCheck("Admin cache policy", "pass", cacheControl, { url: response.url });
      }

      const requiresBrowserRevalidation = /no-cache/i.test(cacheControl)
        && /max-age=0/i.test(cacheControl)
        && /must-revalidate/i.test(cacheControl);
      if (config.publicCache && !requiresBrowserRevalidation) {
        addCheck(`${config.name} browser cache policy`, "fail", `Expected browser revalidation but received: ${cacheControl || "(missing)"}`, {
          url: response.url,
        });
      } else if (config.publicCache) {
        addCheck(`${config.name} browser cache policy`, "pass", cacheControl, { url: response.url });
      }

      return;
    }

    if (config.kind === "version") {
      let payload;
      try {
        payload = JSON.parse(body);
      } catch {
        payload = null;
      }

      if (!payload?.deploymentVersion || !payload?.contentVersion) {
        addCheck(config.name, "fail", "Endpoint did not return deploymentVersion and contentVersion", {
          url: response.url,
          durationMs,
        });
      } else if (!/no-store/i.test(cacheControl)) {
        addCheck(config.name, "fail", `Expected no-store but received: ${cacheControl || "(missing)"}`, {
          url: response.url,
          durationMs,
        });
      } else {
        deploymentVersion = String(payload.deploymentVersion);
        contentVersion = String(payload.contentVersion);
        addCheck(config.name, "pass", `${response.status} in ${durationMs} ms`, {
          url: response.url,
          durationMs,
          deploymentVersion: payload.deploymentVersion,
          contentVersion: payload.contentVersion,
        });
      }
      return;
    }

    if (config.kind === "service-worker") {
      const isNetworkOnlyNavigation = body.includes('event.request.mode !== "navigate"')
        && body.includes('fetch(event.request, { cache: "no-store" })')
        && body.includes('const OFFLINE_URL = "/offline"');

      if (!isNetworkOnlyNavigation) {
        addCheck(config.name, "fail", "Service Worker is missing the network-only navigation fallback", {
          url: response.url,
          durationMs,
        });
      } else if (!/no-store/i.test(cacheControl)) {
        addCheck(config.name, "fail", `Expected no-store but received: ${cacheControl || "(missing)"}`, {
          url: response.url,
          durationMs,
        });
      } else {
        addCheck(config.name, "pass", `${response.status} in ${durationMs} ms`, {
          url: response.url,
          durationMs,
        });
      }
      return;
    }

    if (config.kind === "robots") {
      if (!/User-agent\s*:/i.test(body)) {
        addCheck(config.name, "fail", "robots.txt does not contain a User-agent directive", {
          url: response.url,
          durationMs,
        });
      } else {
        addCheck(config.name, "pass", `${response.status} in ${durationMs} ms`, {
          url: response.url,
          durationMs,
        });
      }
      return;
    }

    if (config.kind === "sitemap") {
      if (!/<(?:urlset|sitemapindex)[\s>]/i.test(body)) {
        addCheck(config.name, "fail", "Sitemap response is not a valid sitemap document", {
          url: response.url,
          durationMs,
        });
      } else {
        sitemapXml = body;
        addCheck(config.name, "pass", `${response.status} in ${durationMs} ms`, {
          url: response.url,
          durationMs,
        });
      }
    }
  } catch (error) {
    addCheck(config.name, "fail", normalizeError(error), { url: url.href });
  }
}

async function readDetailObservation(canonicalUrl, refresh) {
  const requestUrl = new URL(canonicalUrl);
  if (refresh) requestUrl.searchParams.set("__flashcast_refresh", "monitor");

  const result = await fetchWithRetry(requestUrl, { attemptTimeoutMs: 8_000, hardFailureMs: 8_000 });
  const body = await result.response.text();
  const totalMs = Date.now() - result.attemptStartedAt;
  const contentType = result.response.headers.get("content-type") || "";
  const cacheStatus = result.response.headers.get("x-flashcast-html-cache")
    || result.response.headers.get("cf-cache-status")
    || "(missing)";
  const validation = validateDetailHtml({
    body,
    contentType,
    expectedUrl: canonicalUrl,
    responseUrl: result.response.url,
    status: result.response.status,
  });

  return {
    ...result,
    totalMs,
    contentType,
    cacheStatus,
    validation,
  };
}

async function checkDetailVariant(sample, refresh) {
  const variant = refresh ? "refresh" : "canonical";
  const path = new URL(sample.url).pathname;
  const name = `Detail ${sample.language}/${sample.type} ${path.split("/").pop()} (${variant})`;

  try {
    const observations = [await readDetailObservation(sample.url, refresh)];
    let latency = assessDetailLatency(observations.map((item) => item.durationMs));
    if (latency.status === "retry") {
      observations.push(await readDetailObservation(sample.url, refresh));
      latency = assessDetailLatency(observations.map((item) => item.durationMs));
    }
    const observation = observations.at(-1);
    const semanticIssue = observation.validation.issues[0];
    const details = {
      url: sanitizeMonitorUrl(sample.url),
      variant,
      finalUrl: sanitizeMonitorUrl(observation.response.url),
      httpStatus: observation.response.status,
      contentType: observation.contentType,
      cacheStatus: observation.cacheStatus,
      deploymentVersion: deploymentVersion || "unavailable",
      contentVersion: contentVersion || "unavailable",
      failureStage: semanticIssue?.stage || (latency.status === "fail" ? "latency" : "none"),
      dnsMs: dnsDurationMs,
      tlsMs: tlsDurationMs,
      ttfbMs: observation.durationMs,
      totalMs: observation.totalMs,
      bytes: observation.validation.byteLength,
      attempt: observation.attempt,
      networkRetries: observation.priorFailures,
      latencyRecheck: observations.length === 2
        ? observations.map((item) => ({ ttfbMs: item.durationMs, totalMs: item.totalMs }))
        : undefined,
    };

    if (semanticIssue) {
      addCheck(name, "fail", semanticIssue.message, details);
      return;
    }
    if (latency.status === "fail") {
      addCheck(name, "fail", latency.message, details);
      return;
    }
    if (latency.status === "warning") {
      addCheck(name, "warning", latency.message, details);
      return;
    }

    const recovered = observations.length === 2 ? " after latency confirmation" : "";
    addCheck(name, "pass", `HTTP 200 and semantic HTML passed in ${observation.totalMs} ms${recovered}`, details);
  } catch (error) {
    addCheck(name, "fail", normalizeError(error), {
      url: sanitizeMonitorUrl(sample.url),
      variant,
      deploymentVersion: deploymentVersion || "unavailable",
      contentVersion: contentVersion || "unavailable",
      failureStage: error?.hardTimeout ? "latency" : "network",
      networkRetries: Array.isArray(error?.attempts) ? error.attempts : undefined,
      ttfbMs: Array.isArray(error?.attempts) ? error.attempts.at(-1)?.durationMs : undefined,
      totalMs: Array.isArray(error?.attempts)
        ? error.attempts.reduce((total, item) => total + item.durationMs, 0)
        : undefined,
      dnsMs: dnsDurationMs,
      tlsMs: tlsDurationMs,
    });
  }
}

async function checkDetailPages() {
  if (!sitemapXml) {
    addCheck("Detail sitemap sampling", "fail", "Sitemap HTML was unavailable, so no detail routes could be sampled", {
      failureStage: "sitemap",
    });
    return;
  }

  const urls = extractSitemapDetailUrls(sitemapXml, baseUrl);
  const { samples, deficits } = selectDeterministicDetailSamples(urls, baseUrl, 2);
  if (deficits.length) {
    addCheck("Detail sitemap sampling", "fail", "Sitemap does not contain two detail URLs for every language and content type", {
      failureStage: "sampling",
      deficits,
    });
  } else {
    addCheck("Detail sitemap sampling", "pass", `${samples.length} stable detail routes selected across both languages and five content types`, {
      sampledPaths: samples.map((sample) => new URL(sample.url).pathname),
    });
  }

  await mapWithConcurrency(samples, 4, async (sample) => {
    await checkDetailVariant(sample, false);
    await checkDetailVariant(sample, true);
  });
}

function extractSameOriginAssets(html) {
  const assetUrls = new Set();
  const attributePattern = /(?:src|href)=["']([^"']+)["']/gi;
  let match;

  while ((match = attributePattern.exec(html))) {
    const raw = match[1].trim();
    if (!raw || raw.startsWith("data:") || raw.startsWith("blob:") || raw.startsWith("#")) continue;

    try {
      const candidate = new URL(raw, baseUrl);
      if (candidate.origin !== baseUrl.origin) continue;
      if (!/(?:\/assets\/|\.css(?:\?|$)|\.m?js(?:\?|$)|\.webp(?:\?|$)|\.png(?:\?|$)|\.jpe?g(?:\?|$)|\.svg(?:\?|$))/i.test(candidate.pathname + candidate.search)) continue;
      assetUrls.add(candidate.href);
    } catch {
      // Ignore malformed public markup here; browser smoke tests cover rendered-page behavior.
    }
  }

  return [...assetUrls].slice(0, 24);
}

async function checkAssets() {
  if (!primaryHtml) {
    addCheck("Static assets", "warning", "Skipped because the homepage HTML was unavailable");
    return;
  }

  const assetUrls = extractSameOriginAssets(primaryHtml);
  if (!assetUrls.length) {
    addCheck("Static assets", "warning", "No same-origin asset URLs were found in the homepage source");
    return;
  }

  const failures = [];
  const cacheWarnings = [];

  await mapWithConcurrency(assetUrls, 8, async (assetUrl) => {
    try {
      let result = await fetchWithRetry(assetUrl, { method: "HEAD" });
      if (result.response.status === 405 || result.response.status === 403) {
        result = await fetchWithRetry(assetUrl, { method: "GET" });
        await result.response.body?.cancel();
      }

      if (!result.response.ok) {
        failures.push(`${result.response.status} ${assetUrl}`);
        return;
      }

      const cacheControl = result.response.headers.get("cache-control") || "";
      if (/\/assets\//i.test(assetUrl) && !/immutable/i.test(cacheControl)) {
        cacheWarnings.push(`${assetUrl} -> ${cacheControl || "missing cache-control"}`);
      }
    } catch (error) {
      failures.push(`${assetUrl} -> ${normalizeError(error)}`);
    }
  });

  if (failures.length) {
    addCheck("Static assets", "fail", `${failures.length} asset(s) failed`, { failures });
  } else {
    addCheck("Static assets", "pass", `${assetUrls.length} same-origin asset(s) returned successfully`);
  }

  if (cacheWarnings.length) {
    addCheck("Asset cache policy", "warning", `${cacheWarnings.length} hashed asset(s) are missing immutable caching`, {
      warnings: cacheWarnings,
    });
  }

  if (!/https:\/\/wa\.me\//i.test(primaryHtml)) {
    addCheck("WhatsApp link source", "warning", "Homepage source does not expose a wa.me link; browser smoke will verify rendered links");
  } else {
    addCheck("WhatsApp link source", "pass", "Homepage source contains a WhatsApp link");
  }
}

async function checkSecurityHeaders() {
  try {
    const { response, durationMs } = await fetchWithRetry(new URL("/zh", baseUrl), { method: "HEAD" });
    const expectedHeaders = [
      "content-security-policy",
      "strict-transport-security",
      "x-content-type-options",
      "referrer-policy",
    ];
    const missing = expectedHeaders.filter((header) => !response.headers.get(header));

    if (missing.length) {
      addCheck("Security headers", "warning", `Missing header(s): ${missing.join(", ")}`, { durationMs });
    } else {
      addCheck("Security headers", "pass", "Core browser security headers are present", { durationMs });
    }
  } catch (error) {
    addCheck("Security headers", "warning", normalizeError(error));
  }
}

async function checkSupabaseHealth() {
  if (!supabaseUrl) {
    addCheck("Supabase health-check", "warning", "Skipped because MONITOR_SUPABASE_URL is not configured");
    return;
  }

  let endpoint;
  try {
    endpoint = new URL("/functions/v1/health-check", supabaseUrl);
  } catch (error) {
    addCheck("Supabase health-check", "fail", `Invalid MONITOR_SUPABASE_URL: ${normalizeError(error)}`);
    return;
  }

  try {
    const { response, durationMs, attempt } = await fetchWithRetry(endpoint, {
      headers: { accept: "application/json", origin: baseUrl.origin },
    });
    const body = await response.text();
    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      payload = null;
    }

    if (!response.ok) {
      addCheck("Supabase health-check", "fail", `${response.status} ${response.statusText}`, {
        url: endpoint.href,
        durationMs,
      });
    } else if (payload?.ok !== true) {
      addCheck("Supabase health-check", "fail", "Endpoint did not return { ok: true }", {
        url: endpoint.href,
        durationMs,
      });
    } else {
      addCheck("Supabase health-check", "pass", `${response.status} in ${durationMs} ms`, {
        url: endpoint.href,
        durationMs,
        attempt,
      });
    }
  } catch (error) {
    addCheck("Supabase health-check", "fail", normalizeError(error), { url: endpoint.href });
  }
}

function buildMarkdown(report) {
  const symbol = { pass: "✅", warning: "⚠️", fail: "❌" };
  const lines = [
    "## FLASH CAST production monitor",
    "",
    `- Site: ${report.baseUrl}`,
    `- Checked: ${report.checkedAt}`,
    `- Result: ${report.ok ? "healthy" : "incident detected"}`,
    `- Passed: ${report.summary.passed}`,
    `- Warnings: ${report.summary.warnings}`,
    `- Failed: ${report.summary.failed}`,
    "",
    "| Check | Result | Details |",
    "| --- | --- | --- |",
  ];

  for (const check of report.checks) {
    const detail = String(check.message).replaceAll("|", "\\|").replaceAll("\n", " ");
    lines.push(`| ${check.name} | ${symbol[check.status] || check.status} | ${detail} |`);
  }

  return `${lines.join("\n")}\n`;
}

await Promise.all([checkDns(), readTlsCertificate()]);
await Promise.all(pageChecks.map((pageCheck) => checkPage(pageCheck)));
await checkDetailPages();
await Promise.all([checkAssets(), checkSecurityHeaders(), checkSupabaseHealth()]);

const summary = {
  passed: checks.filter((item) => item.status === "pass").length,
  warnings: checks.filter((item) => item.status === "warning").length,
  failed: checks.filter((item) => item.status === "fail").length,
};

const report = {
  ok: summary.failed === 0,
  baseUrl: baseUrl.href,
  checkedAt: new Date().toISOString(),
  durationMs: Date.now() - startedAt,
  summary,
  checks,
};

await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
const markdown = buildMarkdown(report);
console.log(markdown);

if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown, "utf8");
}

process.exit(report.ok ? 0 : 1);
