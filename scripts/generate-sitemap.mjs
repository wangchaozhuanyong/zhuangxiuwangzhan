import { isGeneratorEntry, runQualifiedSeoGeneration } from "./seo-material-pages.mjs";
const escapeXml=value=>String(value).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
export function buildQualifiedSitemap(manifest) {
 const rows=Object.entries(manifest).sort(([a],[b])=>a.localeCompare(b));
 if(!rows.length||rows.some(([,meta])=>!meta.source_complete||meta.qualification!=="eligible"))throw new Error("seo_manifest_unqualified");
 return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${rows.map(([,meta])=>`  <url>
    <loc>${escapeXml(meta.canonical)}</loc>
${Object.entries(meta.hreflang||{}).map(([lang,url])=>`    <xhtml:link rel="alternate" hreflang="${lang==="zh"?"zh-CN":lang==="xDefault"?"x-default":lang}" href="${escapeXml(url)}" />`).join("\n")}
  </url>`).join("\n")}
</urlset>
`;
}
if(isGeneratorEntry(import.meta.url)) runQualifiedSeoGeneration().catch(error=>{console.error(error.message);process.exitCode=1;});
