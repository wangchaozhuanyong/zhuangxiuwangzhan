import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = Deno.env.get("SITE_URL") || "https://flashcast.com.my";
const staticPaths = [
  "/",
  "/about",
  "/services",
  "/services/old-house",
  "/materials",
  "/projects",
  "/process",
  "/faq",
  "/contact",
  "/quote",
  "/blog",
  "/privacy",
  "/terms",
  "/locations/kuala-lumpur",
  "/locations/selangor",
  "/locations/petaling-jaya",
  "/locations/subang-jaya",
  "/locations/puchong",
  "/locations/cheras",
  "/locations/mont-kiara",
  "/locations/bangsar",
  "/landing/flooring",
  "/landing/kitchen-cabinet",
  "/landing/office-renovation",
  "/landing/shop-renovation",
  "/landing/warehouse-shelving",
  "/landing/bathroom-renovation",
  "/landing/old-house-renovation",
];

const urlEntry = (path: string) => `
  <url>
    <loc>${SITE_URL}${path}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}${path.replace(/^\/(zh|en)/, "/en")}" />
    <xhtml:link rel="alternate" hreflang="zh-CN" href="${SITE_URL}${path.replace(/^\/(zh|en)/, "/zh")}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${path.replace(/^\/(zh|en)/, "/en")}" />
  </url>`;

const getServiceRoleKey = () =>
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");

serve(async () => {
  const serviceRoleKey = getServiceRoleKey();
  if (!serviceRoleKey) {
    return new Response("Service role key is not configured", { status: 500 });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
  const [projects, posts, materials, areas, landingPages] = await Promise.all([
    supabase.from("projects").select("slug").eq("status", "published"),
    supabase.from("blog_posts").select("slug").eq("status", "published"),
    supabase.from("materials").select("slug").eq("status", "published"),
    supabase.from("service_areas").select("slug").eq("status", "published"),
    supabase.from("landing_pages").select("slug").eq("status", "published"),
  ]);

  const paths = [
    ...staticPaths,
    ...(projects.data || []).map((item) => `/projects/${item.slug}`),
    ...(posts.data || []).map((item) => `/blog/${item.slug}`),
    ...(materials.data || []).map((item) => `/materials/${item.slug}`),
    ...(areas.data || []).map((item) => `/locations/${item.slug}`),
    ...(landingPages.data || []).map((item) => `/landing/${item.slug}`),
  ];

  const localizedPaths = paths.flatMap((path) => [`/en${path === "/" ? "" : path}`, `/zh${path === "/" ? "" : path}`]);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${localizedPaths.map(urlEntry).join("\n")}
</urlset>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
});
