import { promises as dns } from "node:dns";
import { appendFile, writeFile } from "node:fs/promises";
import tls from "node:tls";

const baseUrl = new URL(process.env.MONITOR_BASE_URL || "https://flashcast.com.my");
const reportPath = process.env.MONITOR_REPORT_PATH || "monitor-report.json";
const timeoutMs = Number(process.env.MONITOR_TIMEOUT_MS || "15000");
const retryCount = Math.max(1, Number(process.env.MONITOR_RETRIES || "2"));
const supabaseUrl = process.env.MONITOR_SUPABASE_URL?.trim();
const startedAt = Date.now();

const checks = [];

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

  for (let attempt = 1; attempt <= retryCount; attempt += 1) {
    const attemptStartedAt = Date.now();
    try {
      const response = await fetch(url, {
        ...options,
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          "user-agent": "FLASH-CAST-Production-Monitor/1.0 (+https://flashcast.com.my)",
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          ...(options.headers || {}),
        },
      });

      return {
        response,
        durationMs: Date.now() - attemptStartedAt,
        attempt,
      };
    } catch (error) {
      lastError = error;
      if (attempt < retryCount) await sleep(Math.min(500 * 2 ** (attempt - 1), 2_000));
    }
  }

  throw lastError;
}

async function checkDns() {
  try {
    const addresses = await dns.lookup(baseUrl.hostname, { all: true });
    if (!addresses.length) throw new Error("DNS lookup returned no address");
    addCheck(
      "DNS resolution",
      "pass",
      `Resolved ${baseUrl.hostname} to ${addresses.map((item) => item.address).join(", ")}`,
    );
  } catch (error) {
    addCheck("DNS resolution", "fail", normalizeError(error));
  }
}

async function readTlsCertificate() {
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
          try {
            const certificate = socket.getPeerCertificate();
            const validTo = new Date(certificate.valid_to);
            const remainingDays = Math.floor((validTo.getTime() - Date.now()) / 86_400_000);

            if (!certificate.valid_to || Number.isNaN(validTo.getTime())) {
              addCheck("TLS certificate", "fail", "Certificate expiry date is unavailable");
            } else if (remainingDays < 7) {
              addCheck("TLS certificate", "fail", `Certificate expires in ${remainingDays} day(s)`, {
                validTo: validTo.toISOString(),
              });
            } else if (remainingDays < 21) {
              addCheck("TLS certificate", "warning", `Certificate expires in ${remainingDays} day(s)`, {
                validTo: validTo.toISOString(),
              });
            } else {
              addCheck("TLS certificate", "pass", `Certificate valid for ${remainingDays} more day(s)`, {
                validTo: validTo.toISOString(),
              });
            }
          } catch (error) {
            addCheck("TLS certificate", "fail", normalizeError(error));
          } finally {
            socket.end();
          }
        });
      },
    );

    socket.on("timeout", () => {
      finish(() => {
        addCheck("TLS certificate", "fail", `TLS handshake timed out after ${timeoutMs} ms`);
        socket.destroy();
      });
    });

    socket.on("error", (error) => {
      finish(() => {
        addCheck("TLS certificate", "fail", normalizeError(error));
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

    if (config.kind === "html") {
      if (!/<html[\s>]/i.test(body)) {
        addCheck(config.name, "fail", "Response does not contain an HTML document", {
          url: response.url,
          contentType,
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

      if (config.publicCache && !/public/i.test(cacheControl)) {
        addCheck(`${config.name} cache policy`, "warning", `Public cache header is missing or unexpected: ${cacheControl || "(missing)"}`, {
          url: response.url,
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
