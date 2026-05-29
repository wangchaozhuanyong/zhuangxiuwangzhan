import manifest from "./seo-manifest.json";

type SeoEntry = {
  lang: string;
  title: string;
  description: string;
  canonical: string;
  hreflang: { en: string; zh: string; xDefault: string };
  ogImage: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const normalizePath = (pathname: string) => {
  const cleaned = pathname.replace(/\/+$/, "") || "/";
  if (cleaned === "/") return "/en";
  return cleaned;
};

const injectSeo = (html: string, meta: SeoEntry) => {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const canonical = escapeHtml(meta.canonical);
  const ogImage = escapeHtml(meta.ogImage);
  const lang = meta.lang === "zh" ? "zh-CN" : "en";

  let out = html.replace(/<html\s+lang="[^"]*"/i, `<html lang="${lang}"`);
  out = out.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${description}" />`,
  );

  const headTags = `
    <link rel="canonical" href="${canonical}" />
    <link rel="alternate" hreflang="zh-CN" href="${escapeHtml(meta.hreflang.zh)}" />
    <link rel="alternate" hreflang="en" href="${escapeHtml(meta.hreflang.en)}" />
    <link rel="alternate" hreflang="x-default" href="${escapeHtml(meta.hreflang.xDefault)}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:url" content="${canonical}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImage}" />`;

  if (!out.includes('rel="canonical"')) {
    out = out.replace("</head>", `${headTags}\n  </head>`);
  }

  return out;
};

const isAssetPath = (pathname: string) => /\.[a-z0-9]+$/i.test(pathname) && !pathname.endsWith(".html");

export const onRequest: PagesFunction = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);

  if (request.method !== "GET" && request.method !== "HEAD") {
    return next();
  }

  if (isAssetPath(url.pathname)) {
    return next();
  }

  const response = await next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
    const html = await response.text();
    const robotsTag = '<meta name="robots" content="noindex, nofollow" />';
    const transformed = html.includes("noindex")
      ? html
      : html.replace("</head>", `    ${robotsTag}\n  </head>`);
    const headers = new Headers(response.headers);
    headers.set("content-type", "text/html; charset=utf-8");
    return new Response(transformed, { status: response.status, headers });
  }

  const key = normalizePath(url.pathname);
  const meta = (manifest as Record<string, SeoEntry>)[key];
  if (!meta) {
    return response;
  }

  const html = await response.text();
  const transformed = injectSeo(html, meta);
  const headers = new Headers(response.headers);
  headers.set("content-type", "text/html; charset=utf-8");
  return new Response(transformed, { status: response.status, headers });
};
