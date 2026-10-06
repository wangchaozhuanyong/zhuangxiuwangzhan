import { sourceKinds, sourceFields, knownSourceTemplates, qualifiesLocale, currentSourcePath, serializeSourcePath } from "../src/lib/publicContentQualification.mjs";
export { qualifiesLocale, currentSourcePath, serializeSourcePath };
import { build } from "esbuild";

let materialDataPromise;

const slugToTitle = (slug) =>
  slug
    .split("-")
    .filter(Boolean)
    .map((part) => (part.toUpperCase() === part ? part : `${part.charAt(0).toUpperCase()}${part.slice(1)}`))
    .join(" ");

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const categoryZhLabels = {
  "kitchen cabinets": "厨房橱柜",
  "whole house custom": "全屋定制",
  furniture: "家具",
  bathroom: "浴室",
  "countertops & stone surfaces": "台面与石材表面",
  flooring: "地板",
  "doors & windows": "门窗",
  "wall & panels": "墙面与饰板",
  "art paint": "艺术涂料",
};

const subcategoryZhLabels = {
  "melamine cabinets": "美耐板橱柜",
  "acrylic cabinets": "亚克力橱柜",
  "solid wood cabinets": "实木橱柜",
  "kitchen cabinets": "厨房橱柜",
  wardrobes: "衣柜",
  "tv cabinets": "电视柜",
  "shoe cabinets": "鞋柜",
  "storage cabinets": "收纳柜",
  "walk-in wardrobe": "步入式衣帽间",
  "study desk": "书桌",
  sofa: "沙发",
  bed: "床",
  "coffee table": "茶几",
  "dining table": "餐桌",
  chairs: "椅子",
  "side table": "边几",
  bathtub: "浴缸",
  basin: "洗手盆",
  toilet: "马桶",
  "shower system": "淋浴系统",
  "bathroom cabinet": "浴室柜",
  "anti slip tile": "防滑砖",
  "floor tile": "地砖",
  "porcelain tile": "瓷砖",
  "shower screen": "浴室玻璃隔断",
  "wall tile": "墙砖",
  "quartz countertops": "石英石台面",
  "sintered stone": "岩板",
  "solid surface": "人造石",
  "porcelain slab": "大板瓷砖",
  "spc vinyl": "SPC 地板",
  laminate: "复合材料",
  "engineered wood": "工程木地板",
  "vinyl plank": "PVC 地板",
  "solid timber door": "实木门",
  "laminate door": "复合门",
  "barn door": "谷仓门",
  "aluminium sliding door": "铝合金推拉门",
  "frameless glass door": "无框玻璃门",
  "frameless glass": "无框玻璃",
  "fluted panel": "格栅饰板",
  "timber cladding": "木饰面",
  "feature wall tile": "背景墙砖",
  "wall panel": "墙板",
  "acoustic wall panel": "吸音墙板",
  "solid wood finish": "实木饰面",
  "venetian plaster": "威尼斯灰泥",
  microcement: "微水泥",
  "metallic paint": "金属漆",
  "texture paint": "纹理漆",
  "lime wash": "石灰洗墙漆",
};

const zhLabel = (map, value) => map[normalizeKey(value)] || value;

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const buildCategorySeoEntry = (category) => {
  const nameEn = category.name || slugToTitle(category.slug);
  const nameZh = zhLabel(categoryZhLabels, nameEn);
  return {
    slug: category.slug,
    title_en: `${nameEn} Materials`,
    title_zh: `${nameZh}材料`,
    description_en:
      category.description ||
      `${nameEn} material options for renovation projects in Kuala Lumpur and Selangor.`,
    description_zh: `${nameZh}材料选项，适合吉隆坡与雪兰莪装修项目参考。`,
    subcategories: (category.subcategories || []).map((subcategory) => {
      const subNameEn = subcategory.name || slugToTitle(subcategory.slug);
      const subNameZh = zhLabel(subcategoryZhLabels, subNameEn);
      return {
        slug: subcategory.slug,
        title_en: `${subNameEn} | ${nameEn}`,
        title_zh: `${subNameZh} | ${nameZh}`,
        description_en:
          subcategory.description ||
          `${subNameEn} options under ${nameEn} materials for renovation projects in Kuala Lumpur.`,
        description_zh: `${subNameZh}属于${nameZh}材料分类，可用于吉隆坡装修项目的材料选择参考。`,
      };
    }),
  };
};

const loadMaterialsData = async () => {
  if (!materialDataPromise) {
    materialDataPromise = build({
      stdin: {
        contents: 'export { materialsData } from "./src/data/materials.ts"; export { translateDisplayText } from "./src/i18n/displayLabels.ts"; export { materialSubcategoryPageText } from "./src/i18n/materialSubcategoryPageText.ts";',
        resolveDir: process.cwd(),
      },
      bundle: true,
      write: false,
      platform: "node",
      format: "esm",
      logLevel: "silent",
    }).then(async (result) => {
      const code = result.outputFiles[0]?.text || "";
      const moduleUrl = `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
      const module = await import(moduleUrl);
      return module;
    });
  }
  return materialDataPromise;
};

export const loadMaterialSeoCategories = async (publishedMaterialRows = []) => {
  const { materialsData: categories, translateDisplayText, materialSubcategoryPageText } = await loadMaterialsData();
  const merged = new Map(categories.map((category) => {
    const entry = buildCategorySeoEntry(category);
    return [entry.slug, entry];
  }));

  for (const row of publishedMaterialRows) {
    const categoryName = String(row?.category || "Materials").trim() || "Materials";
    const subcategoryName = String(row?.subcategory || categoryName).trim() || categoryName;
    const categorySlug = slugify(categoryName);
    const subcategorySlug = slugify(subcategoryName);
    if (!categorySlug || !subcategorySlug) continue;

    let category = merged.get(categorySlug);
    if (!category) {
      category = buildCategorySeoEntry({
        name: categoryName,
        slug: categorySlug,
        subcategories: [],
      });
      merged.set(categorySlug, category);
    }

    if (category.subcategories.some((subcategory) => subcategory.slug === subcategorySlug)) continue;
    const nameZh = zhLabel(categoryZhLabels, categoryName);
    const subNameZh = zhLabel(subcategoryZhLabels, subcategoryName);
    category.subcategories.push({
      slug: subcategorySlug,
      title_en: `${subcategoryName} | ${categoryName}`,
      title_zh: `${subNameZh} | ${nameZh}`,
      description_en: `${subcategoryName} options under ${categoryName} materials for renovation projects in Kuala Lumpur.`,
      description_zh: `${subNameZh}属于${nameZh}材料分类，可用于吉隆坡装修项目的材料选择参考。`,
    });
  }

  // Match the client catalog: the first published row in each subcategory
  // supplies its localized excerpt. Keep the remaining taxonomy unchanged.
  const selected = merged.get("whole-house-custom");
  for (const slug of ["wardrobes", "storage-cabinets"]) {
    const subcategory = selected?.subcategories.find((entry) => entry.slug === slug);
    if (!subcategory) continue;
    const row = publishedMaterialRows.find((entry) =>
      slugify(entry?.category) === "whole-house-custom" && slugify(entry?.subcategory) === slug,
    );
    const fallback = categories.find((entry) => entry.slug === "whole-house-custom")
      ?.subcategories.find((entry) => entry.slug === slug);
    for (const language of ["en", "zh"]) {
      const name = language === "zh" ? zhLabel(subcategoryZhLabels, row?.subcategory || fallback.name) : row?.subcategory || fallback.name;
      const excerpt = row ? String(row[`excerpt_${language}`] || "") : fallback.description;
      const description = translateDisplayText(excerpt, language);
      subcategory[`description_${language}`] = materialSubcategoryPageText[language].metaDescription(description, name);
    }
  }
  return Array.from(merged.values());
};

export const loadMaterialSeoPaths = async (publishedMaterialRows = []) => {
  const categories = await loadMaterialSeoCategories(publishedMaterialRows);
  return categories.flatMap((category) => [
    `/materials/category/${category.slug}`,
    ...category.subcategories.map((subcategory) => `/materials/category/${category.slug}/${subcategory.slug}`),
  ]);
};


// One complete, current public source snapshot drives all three documents.
// Missing access or any later-page failure is unknown, never an empty success.
export const readCompleteSeoSources = async ({url,key,fetchImpl=fetch,readAt=new Date().toISOString()}) => {
 if(!url||!key) throw new Error("seo_source_access_missing");
 const rows={};
 for(const [table,kind] of Object.entries(sourceKinds)) {
  const all=[];let cursor;
  while(true) {
   const endpoint=new URL(`/rest/v1/${table}`,url);
   endpoint.searchParams.set("select",sourceFields[table]);endpoint.searchParams.set("status","eq.published");endpoint.searchParams.set("order","id.asc");endpoint.searchParams.set("limit","500");
   if(table==="cms_pages")endpoint.searchParams.set("deleted_at","is.null");
   if(cursor)endpoint.searchParams.set("id",`gt.${cursor}`);
   const response=await fetchImpl(endpoint,{signal:AbortSignal.timeout(15000),headers:{apikey:key,Authorization:`Bearer ${key}`}});
   if(!response.ok)throw new Error(`seo_source_unavailable:${table}:${response.status}`);
   const data=await response.json();if(!Array.isArray(data))throw new Error(`seo_source_invalid:${table}`);
   if(!data.length)break;
   for(const row of data) {
    const knownTemplate = knownSourceTemplates[table]?.has(row?.path) === true;
    if(typeof row?.id!=="string"||!row.id||(cursor&&row.id<=cursor)||row.status!=="published"||(!knownTemplate&&!currentSourcePath(row,kind))||(table==="cms_pages"&&row.deleted_at))throw new Error(`seo_source_invalid:${table}`);
    cursor=row.id;all.push(row);
   }
  }
  rows[table]=all;
 }
 const {createHash}=await import("node:crypto");
 const sourceHash=createHash("sha256").update(JSON.stringify(rows)).digest("hex");
 return {rows,readAt,sourceHash,sourceVersion:`${readAt}:${sourceHash}`,complete:true};
};
export const snapshotProvenance=(snapshot,kind,recordRef,lang,ownedStatic=false)=>({source_kind:kind,record_ref:recordRef,language:lang,owned_static:ownedStatic,read_at:snapshot.readAt,source_hash:snapshot.sourceHash,source_version:snapshot.sourceVersion,qualification:"eligible",source_complete:snapshot.complete});
export const isGeneratorEntry = metaUrl => process.argv[1] && decodeURIComponent(new URL(metaUrl).pathname) === process.argv[1];
export async function runQualifiedSeoGeneration() {
 const {existsSync,readFileSync,mkdirSync,writeFileSync,renameSync,rmSync}=await import("node:fs");
 const {resolve}=await import("node:path");
 if(existsSync(".env"))for(const line of readFileSync(".env","utf8").split(/\r?\n/)){const match=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);if(match&&!process.env[match[1]])process.env[match[1]]=match[2].replace(/^["']|["']$/g,"");}
 const snapshot=await readCompleteSeoSources({url:process.env.VITE_SUPABASE_URL,key:process.env.VITE_SUPABASE_ANON_KEY});
 const {buildQualifiedManifest}=await import("./generate-seo-manifest.mjs");
 const {buildQualifiedSitemap}=await import("./generate-sitemap.mjs");
 const {buildQualifiedLlms}=await import("./generate-llms.mjs");
 const manifest=await buildQualifiedManifest(snapshot);
 const artifacts={"public/sitemap.xml":buildQualifiedSitemap(manifest),"functions/seo-manifest.json":JSON.stringify(manifest),"public/seo-manifest.json":JSON.stringify(manifest),"public/llms.txt":buildQualifiedLlms(manifest)};
 // No output is touched before all reads, qualifications and document builds succeed.
 // Stage beside targets. If an IO replacement fails, restore prior bytes.
 const staged=[],before=new Map();
 try {
  for(const [path,body] of Object.entries(artifacts)){mkdirSync(resolve(path,".."),{recursive:true});before.set(path,existsSync(path)?readFileSync(path):null);const tmp=`${path}.seo-stage-${process.pid}`;writeFileSync(tmp,body,"utf8");staged.push([path,tmp]);}
  for(const [path,tmp] of staged)renameSync(tmp,path);
 }catch(error){for(const [path,bytes] of before){if(bytes)writeFileSync(path,bytes);else rmSync(path,{force:true});}throw error;}
 finally{for(const [,tmp] of staged)rmSync(tmp,{force:true});}
 console.log(JSON.stringify({ok:true,urls:Object.keys(manifest).length,sourceVersion:snapshot.sourceVersion,outputs:Object.keys(artifacts)}));
}
