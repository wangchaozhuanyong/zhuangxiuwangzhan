export const onRequest: PagesFunction = async () => {
  const upstream = "https://rbsnyexjifounogswrjp.functions.supabase.co/sitemap";

  const res = await fetch(upstream, {
    headers: {
      "user-agent": "cloudflare-pages-sitemap-proxy",
      accept: "application/xml,text/xml;q=0.9,*/*;q=0.8",
    },
  });

  const body = await res.text();
  const contentType = res.headers.get("content-type") || "application/xml; charset=utf-8";

  return new Response(body, {
    status: res.status,
    headers: {
      "content-type": contentType,
      // Cache sitemap briefly, but allow quick updates after content changes.
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
};

