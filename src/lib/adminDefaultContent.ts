import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { blogPosts } from "@/data/blog";
import { landingPages } from "@/data/landings";
import { locationsData } from "@/data/locations";
import { materialsData } from "@/data/materials";
import { projectsData } from "@/data/projects";
import { servicesData } from "@/data/services";
import {
  companyMilestones,
  companyStats,
  coreValues,
  homeFAQs,
  teamHighlights,
  testimonials,
} from "@/data/siteContent";
import { translations } from "@/i18n/translations";
import { translateDisplayText } from "@/i18n/displayLabels";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { fallbackSiteSettings } from "@/lib/siteSettingsApi";

type SeedStatus = "idle" | "running" | "done" | "error";

type SeedSummary = {
  status: SeedStatus;
  inserted: number;
  updated: number;
  error?: string;
};

type DbRow = Record<string, any>;

const AUTO_SEED_CACHE_KEY = "flashcast_admin_default_seed_checked_at";
const AUTO_SEED_CACHE_MS = 12 * 60 * 60 * 1000;

const zh = (value: string) => translateDisplayText(value || "", "zh");
const tr = (key: string, lang: "en" | "zh") => translations[key]?.[lang] || key;

const asPublicImage = (src: string | undefined, folder: string) => {
  if (!src) return "";
  if (src.startsWith("http") || src.startsWith("/images/") || src.startsWith("/videos/") || src.startsWith("/logo-") || src.startsWith("/og-")) {
    return src;
  }
  const filename = src.split(/[?#]/)[0]?.split("/").pop();
  return filename ? `/images/${folder}/${filename}` : src;
};

const escapeHtml = (value: string) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const paragraphsToHtml = (value: string) =>
  String(value || "")
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");

const isBlankValue = (value: unknown) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length === 0;
  return false;
};

const omitReadonly = (row: DbRow) => {
  const copy = { ...row };
  delete copy.id;
  delete copy.created_at;
  delete copy.updated_at;
  return copy;
};

const getAutoSeedCacheTime = () => {
  if (typeof window === "undefined") return 0;
  try {
    const value = Number(window.localStorage.getItem(AUTO_SEED_CACHE_KEY) || "0");
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
};

const shouldSkipAutoSeed = () => {
  const checkedAt = getAutoSeedCacheTime();
  return checkedAt > 0 && Date.now() - checkedAt < AUTO_SEED_CACHE_MS;
};

const rememberAutoSeed = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUTO_SEED_CACHE_KEY, String(Date.now()));
  } catch {
    // Ignore storage failures. The seed still completed; only the browser-side skip cache failed.
  }
};

const scheduleIdleWork = (callback: () => void) => {
  if (typeof window === "undefined") return () => undefined;
  const browserWindow = window as typeof window & {
    requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };

  if (browserWindow.requestIdleCallback) {
    const idleId = browserWindow.requestIdleCallback(callback, { timeout: 3500 });
    return () => browserWindow.cancelIdleCallback?.(idleId);
  }

  const timeoutId = window.setTimeout(callback, 1800);
  return () => window.clearTimeout(timeoutId);
};

const buildBlankPatch = (current: DbRow, defaults: DbRow) => {
  const patch: DbRow = {};
  for (const [key, value] of Object.entries(defaults)) {
    if (["id", "created_at", "updated_at"].includes(key)) continue;
    if (current[key] === undefined || isBlankValue(current[key])) {
      patch[key] = value;
    }
  }
  return patch;
};

const serviceRows = servicesData.map((service, index) => ({
  slug: service.slug,
  title_en: service.title,
  title_zh: zh(service.title),
  excerpt_en: service.summary,
  excerpt_zh: zh(service.summary),
  content_en: paragraphsToHtml(service.description),
  content_zh: paragraphsToHtml(zh(service.description)),
  image_url: asPublicImage(service.image, "services"),
  alt_en: service.title,
  alt_zh: zh(service.title),
  suitable_for_en: service.suitableFor,
  suitable_for_zh: service.suitableFor.map(zh),
  common_projects_en: service.commonProjects,
  common_projects_zh: service.commonProjects.map(zh),
  process_steps_en: service.processSteps,
  process_steps_zh: service.processSteps.map((step) => ({ title: zh(step.title), desc: zh(step.desc) })),
  scope_items_en: service.items,
  scope_items_zh: service.items.map(zh),
  faqs_en: service.faqs,
  faqs_zh: service.faqs.map((faq) => ({ q: zh(faq.q), a: zh(faq.a) })),
  seo_title_en: `${service.title} Kuala Lumpur | FLASH CAST`,
  seo_title_zh: `${zh(service.title)} | FLASH CAST`,
  seo_description_en: service.summary,
  seo_description_zh: zh(service.summary),
  status: "published",
  sort_order: (index + 1) * 10,
}));

const projectRows = projectsData.map((project, index) => ({
  slug: project.slug,
  title_en: project.title,
  title_zh: zh(project.title),
  excerpt_en: project.description,
  excerpt_zh: zh(project.description),
  content_en: paragraphsToHtml(project.description),
  content_zh: paragraphsToHtml(zh(project.description)),
  location: project.location,
  area: project.location,
  duration: project.duration,
  budget: "",
  project_type: project.type,
  materials: project.materialsUsed,
  scope: project.scope,
  highlights_en: project.highlights,
  highlights_zh: project.highlights.map(zh),
  client_need_en: project.clientNeed,
  client_need_zh: zh(project.clientNeed),
  image_url: asPublicImage(project.thumbnail || project.images[0], "projects"),
  seo_title_en: `${project.title} | FLASH CAST Project`,
  seo_title_zh: `${zh(project.title)} | FLASH CAST 案例`,
  seo_description_en: project.description,
  seo_description_zh: zh(project.description),
  status: "published",
  sort_order: (index + 1) * 10,
}));

const projectImageRowsBySlug = Object.fromEntries(
  projectsData.map((project) => [
    project.slug,
    project.images.map((image, index) => ({
      image_url: asPublicImage(image, "projects"),
      image_type: index === 0 ? "cover" : "gallery",
      alt_en: `${project.title} image ${index + 1}`,
      alt_zh: `${zh(project.title)} 图片 ${index + 1}`,
      sort_order: (index + 1) * 10,
    })),
  ]),
);

const materialRows = materialsData.flatMap((category, categoryIndex) =>
  category.items.map((material, itemIndex) => ({
    slug: material.slug,
    title_en: material.name,
    title_zh: zh(material.name),
    excerpt_en: material.description,
    excerpt_zh: zh(material.description),
    content_en: material.description,
    content_zh: zh(material.description),
    category: category.name,
    subcategory: material.subcategory,
    material_type: material.type,
    color: material.color,
    texture: material.texture,
    suitable_spaces_en: material.suitableSpaces,
    suitable_spaces_zh: material.suitableSpaces.map(zh),
    pros_en: [],
    pros_zh: [],
    cons_en: [],
    cons_zh: [],
    recommended_pairing_en: material.recommendedPairing,
    recommended_pairing_zh: zh(material.recommendedPairing),
    note_en: material.note,
    note_zh: zh(material.note),
    reference_price: "",
    image_url: asPublicImage(material.image, "materials"),
    alt_en: material.name,
    alt_zh: zh(material.name),
    seo_title_en: `${material.name} | FLASH CAST Materials`,
    seo_title_zh: `${zh(material.name)} | FLASH CAST 材料库`,
    seo_description_en: material.description,
    seo_description_zh: zh(material.description),
    status: "published",
    sort_order: (categoryIndex + 1) * 100 + itemIndex * 10,
  })),
);

const blogRows = blogPosts.map((post, index) => ({
  slug: post.slug,
  title_en: post.title,
  title_zh: zh(post.title),
  excerpt_en: post.excerpt,
  excerpt_zh: zh(post.excerpt),
  content_en: post.content,
  content_zh: zh(post.content),
  category: post.category,
  tags: post.tags,
  cover_image_url: post.image,
  alt_en: post.title,
  alt_zh: zh(post.title),
  seo_title_en: `${post.title} | FLASH CAST Blog`,
  seo_title_zh: `${zh(post.title)} | FLASH CAST 博客`,
  seo_description_en: post.excerpt,
  seo_description_zh: zh(post.excerpt),
  status: "published",
  sort_order: (index + 1) * 10,
  published_at: post.date,
}));

const serviceAreaRows = Object.values(locationsData).map((location, index) => ({
  slug: location.slug,
  title_en: location.name,
  title_zh: zh(location.name),
  excerpt_en: location.description,
  excerpt_zh: zh(location.description),
  content_en: paragraphsToHtml(location.intro),
  content_zh: paragraphsToHtml(zh(location.intro)),
  area_name: location.name,
  property_types: location.propertyTypes,
  common_needs: location.commonNeeds,
  construction_notes_en: location.constructionNotes,
  construction_notes_zh: zh(location.constructionNotes),
  projects: location.projects.map((project) => ({
    ...project,
    image: asPublicImage(project.image, "projects"),
  })),
  faqs_en: location.faqs,
  faqs_zh: location.faqs.map((faq) => ({ q: zh(faq.q), a: zh(faq.a) })),
  seo_title_en: location.metaTitle,
  seo_title_zh: zh(location.metaTitle),
  seo_description_en: location.description,
  seo_description_zh: zh(location.description),
  status: "published",
  sort_order: (index + 1) * 10,
}));

const landingPageRows = Object.entries(landingPages).map(([slug, page], index) => ({
  slug,
  title_en: page.title,
  title_zh: zh(page.title),
  excerpt_en: page.subtitle,
  excerpt_zh: zh(page.subtitle),
  content_en: page.description,
  content_zh: zh(page.description),
  hero_image_url: asPublicImage(page.heroImage, "services"),
  alt_en: page.heroAlt || page.title,
  alt_zh: zh(page.heroAlt || page.title),
  benefits_en: page.benefits,
  benefits_zh: page.benefits.map(zh),
  related_projects: page.relatedProjects.map((project) => ({
    ...project,
    title: project.title,
    image: asPublicImage(project.image, "projects"),
  })),
  faqs_en: page.faqs,
  faqs_zh: page.faqs.map((faq) => ({ q: zh(faq.q), a: zh(faq.a) })),
  seo_title_en: page.seoTitle || page.title,
  seo_title_zh: zh(page.seoTitle || page.title),
  seo_description_en: page.seoDescription || page.description,
  seo_description_zh: zh(page.seoDescription || page.description),
  status: "published",
  sort_order: (index + 1) * 10,
}));

const sitePageRows = [
  {
    page_key: "about",
    path: "/about",
    seo_title_zh: "关于 FLASH CAST | 吉隆坡装修与室内设计公司",
    seo_title_en: "About FLASH CAST | Renovation Company in Kuala Lumpur",
    seo_description_zh: "FLASH CAST SDN. BHD. 是位于吉隆坡的注册装修与室内设计公司，服务住宅、商业和工业空间。",
    seo_description_en: "FLASH CAST SDN. BHD. is a registered renovation and interior design company based in Kuala Lumpur, Malaysia.",
    content_en: "Learn more about FLASH CAST SDN. BHD., our renovation approach, in-house team, company background, and the way we support residential and commercial projects across Kuala Lumpur and Selangor.",
    image_url: "/images/heroes/hero-about.webp",
    seo_keywords_zh: "FLASH CAST 关于我们, 吉隆坡装修公司, 马来西亚室内设计公司",
    seo_keywords_en: "about FLASH CAST, renovation company KL, interior design company Malaysia",
    status: "published",
    sort_order: 5,
  },
  {
    page_key: "services",
    path: "/services",
    title_zh: "服务项目",
    title_en: "Our Services",
    subtitle_zh: "服务范围",
    subtitle_en: "What We Do",
    description_zh: "覆盖吉隆坡与雪兰莪的装修服务，从室内设计、定制内嵌家具到商业空间装修、艺术墙面涂装和仓储系统。",
    description_en: "Comprehensive renovation services across Kuala Lumpur and Selangor, from interior design and custom built-in to commercial fit-out, artistic wall coating, and warehouse systems.",
    content_zh: "FLASH CAST SDN. BHD. 提供 {count} 项核心装修服务，服务范围覆盖吉隆坡与雪兰莪，涵盖住宅、商业空间、工业设施和德国 Remmers 艺术涂装等专业项目。",
    content_en: "FLASH CAST SDN. BHD. provides {count} core renovation services in Kuala Lumpur and Selangor, Malaysia, covering residential homes, commercial spaces, industrial facilities, and specialty finishes including German Remmers artistic coatings.",
    cta_title_zh: "需要确认适合的装修服务？",
    cta_title_en: "Not Sure What You Need?",
    cta_description_zh: "联系我们免费咨询，我们会根据你的空间和预算建议合适方案。",
    cta_description_en: "Contact us for a free consultation. We will assess your space and recommend the right approach.",
    image_url: "/images/heroes/hero-services.webp",
    alt_zh: "FLASH CAST 吉隆坡装修服务",
    alt_en: "FLASH CAST renovation services in Kuala Lumpur",
    seo_title_zh: "吉隆坡装修服务 | 室内装修、定制家具、商业空间 | FLASH CAST",
    seo_title_en: "Renovation Services Kuala Lumpur | Interior, Built-In, Commercial & Artistic Coating",
    seo_description_zh: "FLASH CAST 提供吉隆坡与雪兰莪装修服务：室内设计、定制家具、商业空间装修、艺术墙面涂装、外墙工程和仓储架系统。",
    seo_description_en: "Explore FLASH CAST's comprehensive renovation services in Kuala Lumpur and Selangor: interior design, custom built-in furniture, commercial fit-out, artistic wall coating, exterior works, and warehouse solutions.",
    seo_keywords_zh: "吉隆坡装修服务, 马来西亚室内设计, 雪兰莪商业装修, 定制家具, Remmers 艺术涂装",
    seo_keywords_en: "renovation services KL, interior design Kuala Lumpur, custom built-in Malaysia, commercial renovation Selangor, artistic wall coating Remmers, shop renovation KL",
    status: "published",
    sort_order: 10,
  },
  {
    page_key: "projects",
    path: "/projects",
    title_zh: "装修案例",
    title_en: "Our Projects",
    subtitle_zh: "案例作品",
    subtitle_en: "Portfolio",
    description_zh: "查看我们在吉隆坡和雪兰莪发布的住宅、商业空间、定制家具和仓储装修项目参考。",
    description_en: "Renovation project references across Kuala Lumpur and Selangor - from residential homes to commercial spaces and warehouses.",
    content_en: "Browse selected renovation project references by FLASH CAST, including residential homes, commercial spaces, custom built-in works, and practical project notes.",
    cta_title_zh: "也想做类似项目？",
    cta_title_en: "Have a Similar Project?",
    cta_description_zh: "告诉我们您的装修需求，我们会根据空间、预算和工期提供合适方案。",
    cta_description_en: "Share your requirements and we'll provide a tailored proposal with accurate pricing.",
    image_url: "/images/heroes/hero-projects.webp",
    alt_zh: "FLASH CAST 装修案例作品",
    alt_en: "FLASH CAST renovation projects portfolio",
    seo_title_zh: "吉隆坡与雪兰莪装修案例 | FLASH CAST 项目作品",
    seo_title_en: "Renovation Projects Kuala Lumpur & Selangor | FLASH CAST Portfolio",
    seo_description_zh: "浏览 FLASH CAST 在吉隆坡和雪兰莪发布的装修项目参考，包括公寓、住宅、办公室、厨房、仓储和店铺装修。",
    seo_description_en: "Explore renovation project references by FLASH CAST across Kuala Lumpur and Selangor - residential condos, commercial offices, custom kitchens, warehouses, and shopfront works.",
    seo_keywords_zh: "吉隆坡装修案例, 雪兰莪装修项目, 马来西亚室内装修, 店铺装修 KL",
    seo_keywords_en: "renovation projects KL, condo renovation Kuala Lumpur, office fit-out Selangor, kitchen renovation Malaysia",
    status: "published",
    sort_order: 15,
  },
  {
    page_key: "materials",
    path: "/materials",
    title_zh: "装修材料库",
    title_en: "Material Library",
    subtitle_zh: "浏览与选择",
    subtitle_en: "Browse & Select",
    description_zh: "浏览适合您装修项目的精选材料，从定制橱柜、家具到浴室配件、地板等，一站式查看。",
    description_en: "Browse our curated selection for your renovation project, from custom cabinetry to furniture, bathroom fittings, flooring, and more.",
    content_en: "Explore renovation materials by category and compare practical options for cabinets, flooring, bathroom fittings, doors, windows, wall panels, and custom built-in works.",
    cta_title_zh: "对某种材料感兴趣？",
    cta_title_en: "Interested in a Material?",
    cta_description_zh: "欢迎联系我们索取样板、确认库存，或获取项目报价。",
    cta_description_en: "Contact us to request samples, check availability, or get a quotation for your project.",
    image_url: "/images/heroes/hero-materials.webp",
    alt_zh: "FLASH CAST 装修材料库",
    alt_en: "FLASH CAST material library",
    seo_title_zh: "装修材料库 | 地板、橱柜、浴室 | FLASH CAST",
    seo_title_en: "Renovation Materials Library | Flooring, Cabinets, Bathroom | Kuala Lumpur",
    seo_description_zh: "浏览 FLASH CAST 精选材料库，了解定制橱柜、家具、浴室配件、地板、门窗与墙板等马来西亚装修常用材料。",
    seo_description_en: "Browse FLASH CAST's curated material library for custom cabinets, furniture, bathroom fittings, flooring, doors, windows, and wall panels for renovation projects in Kuala Lumpur.",
    seo_keywords_zh: "吉隆坡装修材料, 马来西亚厨房橱柜, 浴室配件 KL, 地板 吉隆坡, 定制衣柜 雪兰莪",
    seo_keywords_en: "renovation materials KL, kitchen cabinets Malaysia, bathroom fittings KL, flooring Kuala Lumpur, custom wardrobe Selangor",
    status: "published",
    sort_order: 18,
  },
  {
    page_key: "faq",
    path: "/faq",
    title_zh: "常见问题",
    title_en: "Frequently Asked Questions",
    subtitle_zh: "帮助中心",
    subtitle_en: "Help Center",
    description_zh: "关于装修服务、流程、报价、材料和准证的常见问题整理。",
    description_en: "Common questions about our renovation services, process, pricing, and materials.",
    content_en: "Find answers to common renovation questions about project scope, quotation, materials, condo approvals, timeline, and how FLASH CAST handles enquiries.",
    cta_title_zh: "还有其他问题？",
    cta_title_en: "Still Have Questions?",
    cta_description_zh: "欢迎直接联系我们，我们会根据你的项目情况给出建议。",
    cta_description_en: "Reach out to us directly. We are happy to help.",
    image_url: "/images/heroes/hero-faq.webp",
    alt_zh: "FLASH CAST 装修常见问题",
    alt_en: "FLASH CAST FAQ",
    seo_title_zh: "常见问题 | 吉隆坡装修问答 | FLASH CAST",
    seo_title_en: "FAQ | Renovation Questions Kuala Lumpur | FLASH CAST",
    seo_description_zh: "FLASH CAST 整理马来西亚装修服务、报价、材料、定制家具和准证申请常见问题，服务吉隆坡与雪兰莪。",
    seo_description_en: "Frequently asked questions about renovation services, pricing, materials, custom built-in furniture, and permits in Kuala Lumpur and Selangor by FLASH CAST SDN. BHD.",
    seo_keywords_zh: "马来西亚装修常见问题, 吉隆坡装修问答, 定制家具常见问题, DBKL 装修准证",
    seo_keywords_en: "renovation FAQ Malaysia, renovation questions KL, built-in furniture FAQ, renovation permit KL",
    status: "published",
    sort_order: 20,
  },
  {
    page_key: "contact",
    path: "/contact",
    title_zh: "联系我们",
    title_en: "Contact Us",
    subtitle_zh: "联系我们",
    subtitle_en: "Get In Touch",
    description_zh: "准备开始装修项目？欢迎联系 FLASH CAST。我们服务吉隆坡、雪兰莪与巴生谷周边地区。",
    description_en: "Ready to start your renovation project? Get in touch with FLASH CAST. We serve Kuala Lumpur, Selangor, and surrounding areas.",
    content_en: "Contact FLASH CAST for renovation consultation, site review, quotation, or general project enquiries in Kuala Lumpur, Selangor, and nearby Klang Valley areas.",
    image_url: "/images/heroes/hero-contact.webp",
    alt_zh: "联系 FLASH CAST 装修公司",
    alt_en: "Contact FLASH CAST renovation company",
    seo_title_zh: "联系 FLASH CAST | 吉隆坡装修公司",
    seo_title_en: "Contact FLASH CAST | Renovation Company Kuala Lumpur",
    seo_description_zh: "联系 FLASH CAST SDN. BHD. 咨询吉隆坡与雪兰莪住宅、商业空间、厨房、旧屋翻新和定制家具装修。",
    seo_description_en: "Get in touch with FLASH CAST SDN. BHD. for your renovation project in Kuala Lumpur and Selangor.",
    seo_keywords_zh: "联系吉隆坡装修公司, FLASH CAST 地址, 雪兰莪装修咨询",
    seo_keywords_en: "contact renovation company KL, FLASH CAST address, renovation enquiry Kuala Lumpur",
    status: "published",
    sort_order: 30,
  },
  {
    page_key: "blog",
    path: "/blog",
    title_zh: "装修博客与指南",
    title_en: "Blog & Insights",
    description_zh: "整理装修预算、材料比较、设计灵感和施工注意事项，帮助你更清楚规划马来西亚装修项目。",
    description_en: "Renovation guides, material comparisons, design tips, and industry insights for homeowners and businesses in Malaysia.",
    content_en: "Read practical renovation guides from FLASH CAST, including budgeting, materials, approvals, waterproofing, kitchen cabinets, office fit-out, and planning tips for Malaysia projects.",
    image_url: "/images/heroes/hero-materials.webp",
    seo_title_zh: "装修博客与指南 | 吉隆坡装修知识 | FLASH CAST",
    seo_title_en: "Renovation Blog & Insights | Tips & Guides | FLASH CAST Kuala Lumpur",
    seo_description_zh: "FLASH CAST 分享马来西亚装修预算、材料比较、设计灵感和施工注意事项，帮助吉隆坡与雪兰莪业主更好规划装修。",
    seo_description_en: "Renovation guides, material comparisons, design tips, and industry insights for homeowners and businesses in Kuala Lumpur and Malaysia by FLASH CAST.",
    seo_keywords_zh: "马来西亚装修博客, 吉隆坡装修指南, 装修材料比较, 雪兰莪装修知识",
    seo_keywords_en: "renovation blog Malaysia, interior design tips KL, renovation guide Kuala Lumpur",
    status: "published",
    sort_order: 40,
  },
  {
    page_key: "process",
    path: "/process",
    title_zh: "装修施工流程",
    title_en: "Our Renovation Process",
    subtitle_zh: "我们的做法",
    subtitle_en: "How We Work",
    description_zh: "从第一次咨询到最终交付，我们用清晰、结构化的方式管理每个项目。",
    description_en: "A clear, structured approach from first consultation to final handover.",
    content_zh: "每个项目都遵循同一套成熟流程，确保透明、高效，并让客户安心。",
    content_en: "Every project follows the same proven process, designed for transparency, efficiency, and client satisfaction.",
    cta_title_zh: "准备开始了吗？",
    cta_title_en: "Ready to Start?",
    cta_description_zh: "立即联系我们，第一步只是一次简单沟通。",
    cta_description_en: "Get in touch today. The first step is a simple conversation.",
    image_url: "/images/heroes/hero-process.webp",
    alt_zh: "FLASH CAST 装修流程与项目管理",
    alt_en: "FLASH CAST renovation process and project management",
    seo_title_zh: "施工流程 | FLASH CAST 如何执行项目",
    seo_title_en: "Our Process | How We Work | FLASH CAST",
    seo_description_zh: "了解 FLASH CAST 如何从咨询、设计、施工到交付，全流程透明管理您的装修项目。",
    seo_description_en: "Learn how FLASH CAST handles your renovation project from consultation and design to construction and handover.",
    seo_keywords_zh: "装修流程, 马来西亚装修步骤, 吉隆坡装修流程, FLASH CAST 施工流程",
    seo_keywords_en: "renovation process, how renovation works, step by step renovation, KL renovation process",
    status: "published",
    sort_order: 45,
  },
  {
    page_key: "quote",
    path: "/quote",
    title_zh: "免费装修报价",
    title_en: "Get a Free Renovation Quote",
    subtitle_zh: "获取报价",
    subtitle_en: "Request a Quote",
    description_zh: "向 FLASH CAST 申请装修报价。我们会根据项目地点、照片、范围和预算建议下一步。",
    description_en: "Request a renovation quotation from FLASH CAST. We will review your location, scope, and budget before suggesting next steps.",
    content_en: "Send us your renovation details, photos, location, rough budget, and preferred timeline so the team can review the project and suggest the next step.",
    image_url: "/images/heroes/hero-quote.webp",
    alt_zh: "向 FLASH CAST 获取免费装修报价",
    alt_en: "Get a free renovation quote from FLASH CAST",
    seo_title_zh: "免费装修报价 | 吉隆坡与雪兰莪 | FLASH CAST",
    seo_title_en: "Get a Free Renovation Quote | Kuala Lumpur & Selangor | FLASH CAST",
    seo_description_zh: "向 FLASH CAST SDN. BHD. 申请装修报价。我们会根据项目地点、照片、范围和预算，建议下一步咨询或现场查看。",
    seo_description_en: "Request a renovation quotation from FLASH CAST SDN. BHD. Site review and consultation can be arranged for Kuala Lumpur and Selangor projects.",
    seo_keywords_zh: "免费装修报价, 吉隆坡装修报价, 雪兰莪装修咨询",
    seo_keywords_en: "free renovation quote KL, renovation quotation Malaysia, site measurement Kuala Lumpur",
    status: "published",
    sort_order: 35,
  },
  {
    page_key: "materials_category",
    path: "/materials/category/:categorySlug",
    description_zh: "{description} 浏览 {category} 材料选项，适用于吉隆坡与雪兰莪装修项目。",
    description_en: "{description} Browse {category} options for your renovation project in Kuala Lumpur and Selangor.",
    content_en: "Browse renovation material category options and compare usage, style, durability, maintenance, and budget notes before shortlisting materials for your project.",
    cta_title_zh: "对 {category} 感兴趣？",
    cta_title_en: "Interested in {category}?",
    cta_description_zh: "联系我们索取样板、确认供应情况，或获取项目报价。",
    cta_description_en: "Contact us to request samples, check availability, or get a quotation for your project.",
    seo_title_zh: "{category} | 材料库 | FLASH CAST",
    seo_title_en: "{category} | Materials | FLASH CAST",
    seo_description_zh: "{description} 浏览 {category} 材料选项，适用于吉隆坡与雪兰莪装修项目。",
    seo_description_en: "{description} Browse {category} options for your renovation project in Kuala Lumpur and Selangor.",
    seo_keywords_zh: "{category} 吉隆坡, {category} 装修材料, 马来西亚装修",
    seo_keywords_en: "{category} KL, {category} renovation Malaysia",
    image_url: "/images/heroes/hero-materials.webp",
    status: "published",
    sort_order: 50,
  },
  {
    page_key: "service_detail",
    path: "/services/:slug",
    content_en: "Review each renovation service in detail, including suitable project types, common work scope, process notes, and practical questions before requesting a quotation.",
    cta_description_zh: "联系我们免费咨询和报价。我们服务吉隆坡、雪兰莪与周边地区。",
    cta_description_en: "Contact us for a free consultation and quotation. We serve Kuala Lumpur, Selangor, and surrounding areas.",
    image_url: "/images/heroes/hero-services.webp",
    status: "published",
    sort_order: 60,
  },
];

const cmsPageRows = [
  {
    page_key: "home",
    path: "/",
    title_zh: "首页",
    title_en: "Home",
    seo_title_zh: "吉隆坡装修公司 | FLASH CAST",
    seo_description_zh: "FLASH CAST 提供吉隆坡与雪兰莪住宅装修、商业空间、定制家具、材料建议和项目管理服务。",
    seo_title_en: "Renovation Company Kuala Lumpur | FLASH CAST",
    seo_description_en: "FLASH CAST provides residential renovation, commercial fit-out, custom built-in furniture, material advice, and project management in Kuala Lumpur and Selangor.",
    status: "published",
    sort_order: 0,
  },
];

const homeSections = [
  {
    section_key: "stats",
    title_en: "Trust Stats",
    title_zh: "信任数据",
    subtitle_en: "A quick view of our project focus and service coverage.",
    content_en: "Key proof points shown on the homepage.",
    content_zh: "首页展示的关键信任数据。",
    items_en: [
      { icon: "star", value: "Scope", label_en: "Clear Project Planning", desc_en: "Site condition, usage needs, materials, budget, and timeline are reviewed before quotation." },
      { icon: "clock", value: "KL & Selangor", label_en: "Local Service Areas", desc_en: "Renovation enquiries are handled for Kuala Lumpur, Selangor, and nearby Klang Valley areas." },
      { icon: "users", value: "Trusted", label_en: "By Homeowners & Businesses", desc_en: "Repeat clients and referrals are our strongest endorsement" },
      { icon: "shieldcheck", value: "SSM", label_en: "Registered Company", desc_en: "Company registration and contact details are shown clearly for client verification." },
    ],
    items_zh: [
      { icon: "star", value: "范围", label_zh: "清楚规划范围", desc_zh: "报价前先了解现场情况、使用需求、材料、预算和时间安排。" },
      { icon: "clock", value: "吉隆坡与雪兰莪", label_zh: "本地服务区域", desc_zh: "主要处理吉隆坡、雪兰莪和附近巴生谷区域的装修咨询。" },
      { icon: "users", value: "值得信赖", label_zh: "业主与企业客户信赖", desc_zh: "回头客户与转介绍是我们最重要的认可。" },
      { icon: "shieldcheck", value: "SSM", label_zh: "注册公司", desc_zh: "正规注册公司，项目提供施工保修" },
    ],
    image_url: "/images/heroes/hero-projects.webp",
    status: "published",
    sort_order: 10,
  },
  {
    section_key: "why_choose_us",
    title_en: tr("whyUs.title", "en"),
    title_zh: tr("whyUs.title", "zh"),
    subtitle_en: tr("whyUs.subtitle", "en"),
    subtitle_zh: tr("whyUs.subtitle", "zh"),
    content_en: tr("whyUs.subtitle", "en"),
    content_zh: tr("whyUs.subtitle", "zh"),
    items_en: [
      ["paintbrush", "whyUs.design.title", "whyUs.design.desc"],
      ["message-circle", "whyUs.quotation.title", "whyUs.quotation.desc"],
      ["layers", "whyUs.material.title", "whyUs.material.desc"],
      ["target", "whyUs.supervision.title", "whyUs.supervision.desc"],
      ["wrench", "whyUs.workmanship.title", "whyUs.workmanship.desc"],
      ["shieldcheck", "whyUs.ssm.title", "whyUs.ssm.desc"],
    ].map(([icon, titleKey, descKey]) => ({ icon, title_en: tr(titleKey, "en"), desc_en: tr(descKey, "en") })),
    items_zh: [
      ["paintbrush", "whyUs.design.title", "whyUs.design.desc"],
      ["message-circle", "whyUs.quotation.title", "whyUs.quotation.desc"],
      ["layers", "whyUs.material.title", "whyUs.material.desc"],
      ["target", "whyUs.supervision.title", "whyUs.supervision.desc"],
      ["wrench", "whyUs.workmanship.title", "whyUs.workmanship.desc"],
      ["shieldcheck", "whyUs.ssm.title", "whyUs.ssm.desc"],
    ].map(([icon, titleKey, descKey]) => ({ icon, title_zh: tr(titleKey, "zh"), desc_zh: tr(descKey, "zh") })),
    image_url: "/images/heroes/hero-luxury-living.webp",
    status: "published",
    sort_order: 20,
  },
];

const processStepRows = Array.from({ length: 6 }, (_, index) => ({
  step_number: index + 1,
  title_en: tr(`process.step${index + 1}.title`, "en"),
  title_zh: tr(`process.step${index + 1}.title`, "zh"),
  description_en: tr(`process.step${index + 1}.desc`, "en"),
  description_zh: tr(`process.step${index + 1}.desc`, "zh"),
  icon_key: ["clipboard-list", "ruler", "paintbrush", "file-text", "hammer", "handshake"][index],
  status: "published",
  sort_order: (index + 1) * 10,
}));

const faqRows = {
  home: homeFAQs.map((faq, index) => ({
    page_key: "home",
    question_en: faq.q,
    question_zh: zh(faq.q),
    answer_en: faq.a,
    answer_zh: zh(faq.a),
    status: "published",
    sort_order: (index + 1) * 10,
  })),
  general: [
    { q: "Do you provide free quotation?", a: "Yes. We provide free consultation and quotation for renovation enquiries in Kuala Lumpur and Selangor." },
    { q: "Can you help with condo management approval?", a: "Yes. We can prepare the required documents and coordinate with management office requirements before work starts." },
    { q: "Do you handle residential and commercial projects?", a: "Yes. FLASH CAST handles homes, condos, offices, shop lots, warehouses, and custom built-in work." },
  ].map((faq, index) => ({
    page_key: "general",
    question_en: faq.q,
    question_zh: zh(faq.q),
    answer_en: faq.a,
    answer_zh: zh(faq.a),
    status: "published",
    sort_order: (index + 1) * 10,
  })),
};

const ctaBlocks = [
  {
    block_key: "home_final",
    title_en: tr("ctaSection.title", "en"),
    title_zh: tr("ctaSection.title", "zh"),
    description_en: tr("ctaSection.desc", "en"),
    description_zh: tr("ctaSection.desc", "zh"),
    primary_label_en: tr("cta.getQuote", "en"),
    primary_label_zh: tr("cta.getQuote", "zh"),
    primary_url: "/quote",
    secondary_label_en: tr("cta.whatsapp", "en"),
    secondary_label_zh: tr("cta.whatsapp", "zh"),
    secondary_url: "",
    image_url: "/images/heroes/hero-quote.webp",
    status: "published",
  },
  {
    block_key: "about_final",
    title_en: "Work With Us",
    title_zh: "让我们一起规划你的项目",
    description_en: "Whether you are renovating a home, fitting out an office, or setting up a warehouse, we are ready to help.",
    description_zh: "无论是住宅翻新、办公室装修或仓储空间规划，我们都可以协助评估并提供报价。",
    primary_label_en: "Get a Free Quote",
    primary_label_zh: "获取免费报价",
    primary_url: "/quote",
    secondary_label_en: "WhatsApp Us",
    secondary_label_zh: "WhatsApp 联系",
    secondary_url: "",
    image_url: "/images/heroes/hero-about.webp",
    status: "published",
  },
];

const aboutSections = [
  {
    section_key: "hero",
    title_en: "Building Spaces, Building Trust",
    title_zh: "打造空间，也建立信任",
    subtitle_en: "A renovation partner focused on clear planning, practical workmanship, and dependable project delivery.",
    content_en: "FLASH CAST SDN. BHD. is a registered renovation and interior design company based in Kuala Lumpur, providing complete design-and-build solutions for residential, commercial, and industrial spaces across KL and Selangor since 2015.",
    content_zh: "FLASH CAST SDN. BHD. 是位于吉隆坡的注册装修与室内设计公司，自 2015 年起为吉隆坡和雪兰莪客户提供住宅、商业和工业空间的一站式设计施工服务。",
    image_url: "/images/heroes/hero-about.webp",
    items_en: [
      "Residential and commercial renovation planning",
      "Custom built-in furniture and material advice",
      "Project coordination across Kuala Lumpur and Selangor",
    ],
    items_zh: [],
    status: "published",
    sort_order: 10,
  },
  {
    section_key: "intro",
    title_en: "Who We Are",
    title_zh: "我们是谁",
    subtitle_en: "A Kuala Lumpur based renovation team serving homes and commercial spaces.",
    content_en: "Founded in 2015, FLASH CAST has grown into a full-service design and build company serving clients across Kuala Lumpur and Selangor.",
    content_zh: "FLASH CAST SDN. BHD. 成立于 2015 年，从住宅装修团队逐步发展为服务吉隆坡与雪兰莪的设计施工公司。",
    items_en: [
      "Founded in 2015, FLASH CAST SDN. BHD. has grown from a small residential renovation team into a full-service design and build company serving clients across Kuala Lumpur and Selangor.",
      "We are SSM-registered and operate from our office at 94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur. Our team handles every aspect of the renovation process.",
      "We also discuss artistic wall coating options for homes and commercial spaces when this finish suits the project.",
    ],
    items_zh: [
      "FLASH CAST SDN. BHD. 成立于 2015 年，从住宅装修团队逐步发展为服务吉隆坡与雪兰莪的设计施工公司。",
      "公司已在 SSM 注册，办公室位于 94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur。团队可统筹装修流程中的设计、预算、材料、施工和交付。",
      "我们也是德国 Remmers 艺术涂料授权施工团队，可为住宅和商业空间提供高品质艺术墙面效果。",
    ],
    image_url: "/images/heroes/hero-about.webp",
    status: "published",
    sort_order: 20,
  },
  {
    section_key: "stats",
    title_en: "Company Stats",
    title_zh: "公司数据",
    subtitle_en: "Simple numbers that reflect our focus and service coverage.",
    image_url: "/images/heroes/hero-projects.webp",
    items_en: companyStats,
    items_zh: [
      { value: "范围", label: "清楚规划范围" },
      { value: "吉隆坡与雪兰莪", label: "本地服务区域" },
      { value: "住宅", label: "住宅项目沟通" },
      { value: "商业", label: "商业项目沟通" },
    ],
    status: "published",
    sort_order: 30,
  },
  {
    section_key: "core_values",
    title_en: "Our Core Values",
    title_zh: "我们的核心价值",
    subtitle_en: "The principles we use to guide every renovation project.",
    content_en: "These principles guide every project we take on.",
    content_zh: "这些原则帮助我们把每个装修项目做得更清楚、更可靠。",
    items_en: coreValues.map(({ title, desc }) => ({ title, desc })),
    items_zh: [
      { title: "品质工艺", desc: "每个项目都重视细节、材料和施工方法，让空间不只好看，也经得起长期使用。" },
      { title: "透明沟通", desc: "报价清楚、过程透明，施工期间保持进度沟通，减少预算和时间上的不确定。" },
      { title: "按时交付", desc: "通过项目管理和节点安排，让装修进度更容易被跟踪和控制。" },
      { title: "以客户需求为先", desc: "我们会先理解你的生活方式、预算和目标，再给出适合项目的专业建议。" },
    ],
    image_url: "/images/heroes/hero-process.webp",
    status: "published",
    sort_order: 40,
  },
  {
    section_key: "team",
    title_en: "Our Team",
    title_zh: "我们的团队",
    subtitle_en: "Coordinated design, project management, carpentry, and site teams.",
    content_en: "A dedicated in-house team of professionals with coordinated project delivery.",
    content_zh: "由设计、项目管理、木工和专业施工人员组成的协作团队。",
    items_en: teamHighlights.map(({ title, desc }) => ({ title, desc })),
    items_zh: [
      { title: "专业木工团队", desc: "负责定制柜、衣柜、电视柜、储物和木作细节。" },
      { title: "设计顾问", desc: "把需求转化为空间布局、风格方向和实用设计方案。" },
      { title: "项目经理", desc: "协调准证、材料、工种和现场品质检查。" },
      { title: "艺术涂料施工人员", desc: "接受 Remmers 艺术涂料施工培训，负责特色墙和高级墙面效果。" },
    ],
    image_url: "/images/heroes/hero-services.webp",
    status: "published",
    sort_order: 50,
  },
  {
    section_key: "milestones",
    title_en: "Our Journey",
    title_zh: "公司发展",
    subtitle_en: "How FLASH CAST grew from renovation work into full design-and-build service.",
    content_en: "From a small residential renovation team to a full-service design-and-build company serving Kuala Lumpur and Selangor.",
    content_zh: "从住宅装修团队，发展为覆盖吉隆坡与雪兰莪的一站式设计施工公司。",
    items_en: companyMilestones,
    items_zh: [
      { year: "2015", title: "公司成立", desc: "FLASH CAST SDN. BHD. 于吉隆坡成立，初期专注住宅装修项目。" },
      { year: "2017", title: "拓展商业项目", desc: "开始承接商业空间、办公室装修和企业客户项目。" },
      { year: "2019", title: "Remmers 合作", desc: "成为德国 Remmers 艺术墙面涂料在马来西亚的授权施工团队。" },
      { year: "2021", title: "工业空间服务", desc: "新增仓储架与工业空间规划服务，支持制造与物流客户。" },
      { year: "2023", title: "项目范围扩大", desc: "持续扩展住宅、商业和部分工业空间的装修服务范围。" },
      { year: "2025", title: "区域覆盖扩大", desc: "服务范围覆盖吉隆坡与雪兰莪主要区域。" },
    ],
    image_url: "/images/heroes/hero-about.webp",
    status: "published",
    sort_order: 60,
  },
  {
    section_key: "office",
    title_en: "Visit Our Office",
    title_zh: "欢迎到访办公室",
    subtitle_en: "Visit our Kuala Lumpur office or contact us to discuss your renovation plans.",
    content_en: "Located in Taman United, Kuala Lumpur.",
    content_zh: "办公室位于 Taman United，吉隆坡。",
    items_en: [
      "Office: 94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur",
      "Service area: Kuala Lumpur, Selangor, and nearby Klang Valley areas",
      "Consultation: renovation planning, site review, and quotation",
    ],
    items_zh: [],
    image_url: "/images/heroes/hero-contact.webp",
    status: "published",
    sort_order: 70,
  },
];

const heroSlideRows = [
  {
    title_en: "Renovation & Interior Fit-Out in Malaysia",
    title_zh: "马来西亚专业装修与空间改造公司",
    excerpt_en: "We manage site measurement, space planning, material advice, renovation works, and handover follow-up for residential and commercial projects.",
    excerpt_zh: "FLASH CAST 提供现场测量、空间规划、材料建议、施工管理与交付跟进，让住宅与商业装修更清楚、更安心。",
    button_label_en: "Get Free Quote",
    button_label_zh: "获取免费报价",
    button_url: "/quote",
    image_url: "/videos/home-hero-poster.webp",
    alt_en: "FLASH CAST renovation project film poster",
    alt_zh: "FLASH CAST 装修项目视频封面",
    status: "published",
    sort_order: 10,
  },
];

const beforeAfterRows = [
  ["Kitchen Renovation", "厨房翻新", "Mont Kiara, KL", "Before and after kitchen renovation with new cabinets and countertop.", "厨房翻新前后对比，包含新橱柜与台面。", "/images/before-after/before-kitchen.webp", "/images/before-after/after-kitchen.webp"],
  ["Living Room Makeover", "客厅改造", "Petaling Jaya", "Warm living room makeover with new feature wall and flooring.", "温馨客厅改造，包含背景墙与地板升级。", "/images/before-after/before-living.webp", "/images/before-after/after-living.webp"],
  ["Bathroom Renovation", "浴室翻新", "Cheras", "Bathroom upgrade with waterproofing, tiles, and new fittings.", "浴室升级，包含防水、瓷砖与洁具更换。", "/images/before-after/before-bathroom.webp", "/images/before-after/after-bathroom.webp"],
].map(([title_en, title_zh, location, description_en, description_zh, before_image_url, after_image_url], index) => ({
  title_en,
  title_zh,
  location,
  description_en,
  description_zh,
  before_image_url,
  after_image_url,
  alt_en: `${title_en} before and after`,
  alt_zh: `${title_zh} 前后对比`,
  status: "published",
  sort_order: (index + 1) * 10,
}));

const brandPartnerRows = [
  ["Remmers", "/images/brands/remmers.webp"],
  ["Hafele", "/images/brands/hafele.webp"],
  ["Blum", "/images/brands/blum.webp"],
  ["Nippon Paint", "/images/brands/nippon-paint.webp"],
  ["Bosch", "/images/brands/bosch.webp"],
  ["GROHE", "/images/brands/grohe.webp"],
].map(([name, logo_url], index) => ({
  name,
  logo_url,
  website_url: "",
  status: "published",
  sort_order: (index + 1) * 10,
}));

const testimonialRows = testimonials.map((item, index) => ({
  customer_name: item.client,
  rating: 5,
  content_en: item.text,
  content_zh: zh(item.text),
  status: "published",
  sort_order: (index + 1) * 10,
}));

const patchOrInsertByKey = async (table: string, key: string, rows: DbRow[]) => {
  const fields = Array.from(
    new Set([
      "id",
      key,
      ...rows.flatMap((row) => Object.keys(omitReadonly(row))),
    ]),
  );
  const { data, error } = await supabase!.from(table).select(fields.join(","));
  if (error) throw error;

  let inserted = 0;
  let updated = 0;
  const existingRows = (data || []) as DbRow[];
  const existingByKey = new Map(existingRows.map((row) => [String(row[key]), row]));

  for (const row of rows) {
    const existing = existingByKey.get(String(row[key]));
    if (!existing) {
      const { error: insertError } = await supabase!.from(table).insert(omitReadonly(row));
      if (insertError) throw insertError;
      inserted += 1;
      continue;
    }

    const patch = buildBlankPatch(existing, row);
    if (Object.keys(patch).length) {
      const { error: updateError } = await supabase!.from(table).update(patch).eq("id", existing.id);
      if (updateError) throw updateError;
      updated += 1;
    }
  }

  return { inserted, updated };
};

const insertIfGroupEmpty = async (table: string, rows: DbRow[], filter?: { key: string; value: string }) => {
  let query = supabase!.from(table).select("id", { count: "exact", head: true });
  if (filter) query = query.eq(filter.key, filter.value);
  const { count, error } = await query;
  if (error) throw error;
  if (count && count > 0) return { inserted: 0, updated: 0 };
  const { error: insertError } = await supabase!.from(table).insert(rows.map(omitReadonly));
  if (insertError) throw insertError;
  return { inserted: rows.length, updated: 0 };
};

const seedProjectImages = async () => {
  const { data: projects, error } = await supabase!.from("projects").select("id,slug");
  if (error) throw error;
  let inserted = 0;

  for (const project of (projects || []) as Array<{ id: string; slug: string }>) {
    const defaults = projectImageRowsBySlug[project.slug];
    if (!defaults?.length) continue;
    const { count, error: countError } = await supabase!
      .from("project_images")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id);
    if (countError) throw countError;
    if (count && count > 0) continue;

    const { error: insertError } = await supabase!.from("project_images").insert(
      defaults.map((image) => ({ ...image, project_id: project.id })),
    );
    if (insertError) throw insertError;
    inserted += defaults.length;
  }

  return { inserted, updated: 0 };
};

const seedSiteSettings = async () => {
  const { data, error } = await supabase!.from("site_settings").select("*").eq("id", "default").maybeSingle();
  if (error) throw error;
  if (!data) {
    const { error: insertError } = await supabase!.from("site_settings").insert({ id: "default", ...fallbackSiteSettings });
    if (insertError) throw insertError;
    return { inserted: 1, updated: 0 };
  }

  const patch = buildBlankPatch(data, fallbackSiteSettings);
  if (Object.keys(patch).length) {
    const { error: updateError } = await supabase!.from("site_settings").update(patch).eq("id", "default");
    if (updateError) throw updateError;
    return { inserted: 0, updated: 1 };
  }
  return { inserted: 0, updated: 0 };
};

let seedPromise: Promise<SeedSummary> | null = null;

const formatSeedError = (error: unknown) => {
  const record = error as { code?: string; message?: string; hint?: string; details?: string };
  const message = record?.message || (error instanceof Error ? error.message : String(error));
  if (record?.code === "PGRST205" && message.includes("site_pages")) {
    return "数据库还没有 site_pages 表，请先执行迁移 supabase/migrations/202605290004_site_pages.sql，然后再回到后台同步默认内容。";
  }
  return [message, record?.hint, record?.details].filter(Boolean).join(" ");
};

export async function ensureAdminDefaultContent(): Promise<SeedSummary> {
  if (!isSupabaseConfigured || !supabase) return { status: "done", inserted: 0, updated: 0 };

  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    let inserted = 0;
    let updated = 0;
    const add = (result: { inserted: number; updated: number }) => {
      inserted += result.inserted;
      updated += result.updated;
    };

    add(await seedSiteSettings());
    add(await patchOrInsertByKey("services", "slug", serviceRows));
    add(await patchOrInsertByKey("projects", "slug", projectRows));
    add(await seedProjectImages());
    add(await patchOrInsertByKey("materials", "slug", materialRows));
    add(await patchOrInsertByKey("blog_posts", "slug", blogRows));
    add(await patchOrInsertByKey("service_areas", "slug", serviceAreaRows));
    add(await patchOrInsertByKey("landing_pages", "slug", landingPageRows));
    add(await patchOrInsertByKey("site_pages", "page_key", sitePageRows));
    add(await patchOrInsertByKey("cms_pages", "page_key", cmsPageRows));
    add(await patchOrInsertByKey("home_sections", "section_key", homeSections));
    add(await patchOrInsertByKey("about_sections", "section_key", aboutSections));
    add(await patchOrInsertByKey("cta_blocks", "block_key", ctaBlocks));
    add(await insertIfGroupEmpty("process_steps", processStepRows));
    add(await insertIfGroupEmpty("faqs", faqRows.home, { key: "page_key", value: "home" }));
    add(await insertIfGroupEmpty("faqs", faqRows.general, { key: "page_key", value: "general" }));
    add(await insertIfGroupEmpty("hero_slides", heroSlideRows));
    add(await insertIfGroupEmpty("before_after_items", beforeAfterRows));
    add(await insertIfGroupEmpty("brand_partners", brandPartnerRows));
    add(await insertIfGroupEmpty("testimonials", testimonialRows));

    rememberAutoSeed();
    return { status: "done" as const, inserted, updated };
  })().catch((error) => {
    seedPromise = null;
    return {
      status: "error" as const,
      inserted: 0,
      updated: 0,
      error: formatSeedError(error),
    };
  });

  return seedPromise;
}

export function useAdminDefaultContentSeed() {
  const queryClient = useQueryClient();
  const [summary, setSummary] = useState<SeedSummary>({ status: "idle", inserted: 0, updated: 0 });

  useEffect(() => {
    let active = true;
    if (shouldSkipAutoSeed()) {
      setSummary({ status: "done", inserted: 0, updated: 0 });
      return () => {
        active = false;
      };
    }

    const cancelIdleWork = scheduleIdleWork(() => {
      if (!active) return;
      setSummary((current) => ({ ...current, status: "running" }));
      void ensureAdminDefaultContent().then((result) => {
        if (!active) return;
        setSummary(result);
        if (result.status === "done" && (result.inserted || result.updated)) {
          void queryClient.invalidateQueries({ queryKey: ["admin"], refetchType: "inactive" });
          void queryClient.invalidateQueries({ queryKey: ["published"], refetchType: "inactive" });
          void queryClient.invalidateQueries({ queryKey: ["site-settings"], refetchType: "inactive" });
        }
      });
    });

    return () => {
      active = false;
      cancelIdleWork();
    };
  }, [queryClient]);

  return summary;
}
