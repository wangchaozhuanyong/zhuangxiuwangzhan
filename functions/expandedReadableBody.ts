import { buildMaterialCategoryGuidanceBody, readableBodyPaths, sanitizeReadableContent } from "./readablePublicBody";
import { oldHouseRenovationPageText } from "../src/i18n/oldHouseRenovationPageText";
import { beforeAfterPageText } from "../src/i18n/beforeAfterPageText";
import customCabinetsText from "../src/i18n/customCabinetsText.json";
import { processPageText } from "../src/i18n/processPageText";
import { designServicePageText } from "../src/i18n/designServicePageText";
import { surfaceRepairPageText } from "../src/i18n/surfaceRepairPageText";
import { servicesPageText } from "../src/i18n/servicesPageText";
import { projectsPageText } from "../src/i18n/projectsPageText";
import { materialsPageText } from "../src/i18n/materialsPageText";
import { blogPageText } from "../src/i18n/blogPageText";
import { locationsPageText, promotionsPageText } from "../src/i18n/newClientPageText";
import { aboutCopy, aboutMilestoneCopy, aboutStatCopy, aboutTeamCopy, aboutValueCopy } from "../src/i18n/aboutContent";
import { contactLocationOptions, contactPageText, contactProjectTypeOptions, contactServiceItems } from "../src/i18n/contactPageText";
import { quotePageText } from "../src/i18n/quotePageText";
import { fallbackServiceAreas } from "./serviceAreasFallback";
import { materialCategoryPageText } from "../src/i18n/materialCategoryPageText";
import { materialSubcategoryPageText } from "../src/i18n/materialSubcategoryPageText";
import { materialsData } from "../src/data/materials";
import { getServiceProjectGuidance, serviceDetailPageText } from "../src/i18n/serviceDetailPageText";
import { materialDetailPageText } from "../src/i18n/materialDetailPageText";
import { projectDetailPageText } from "../src/i18n/projectDetailPageText";
import { mediaLabels } from "../src/i18n/mediaLabels";
import { getServiceContextLinks } from "../src/i18n/serviceContextLinks";
import { translateDisplayText, translateMaterialCategory, translateMaterialSubcategory, translateProjectScopedLabel, translateSpaceLabel } from "../src/i18n/displayLabels";
import { getMaterialSubcategoryGuidance } from "../src/i18n/materialSubcategoryGuidance";
import { mapOldHousePublicFaqs, mapPublicServiceFaqs } from "../src/lib/publicServiceFaqs";
import { isRenderingConceptProject } from "../src/lib/projectContentClassification";
import { stripHtml } from "../src/lib/text";

type Row = Record<string, unknown>;
type Lang = "en" | "zh" | "ms";
type ResolveMaterialLink = (href: string) => string | undefined;
type Sources = { row?: Row | null; services?: Row[] | null; materials?: Row[] | null; projects?: Row[] | null; blogPosts?: Row[] | null; serviceAreas?: Row[] | null; processSteps?: Row[] | null; resolveMaterialLink?: ResolveMaterialLink };
const text = (value: unknown) => typeof value === "string" ? value : "";
const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const plain = (value: unknown, lang: Lang) => stripHtml(translateDisplayText(text(value), lang));
const paragraph = (value: string) => value ? `<p>${escape(value)}</p>` : "";
const heading = (value: string) => value ? `<h2>${escape(value)}</h2>` : "";
const taxonomy = (value: unknown) => text(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const safeSlug = (value: unknown) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text(value)) ? text(value) : "";
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const records = (value: unknown): Row[] => Array.isArray(value) ? value.filter((item): item is Row => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
const list = (label: string, values: string[]) => values.length ? `${heading(label)}<ul>${values.map(value => `<li>${escape(value)}</li>`).join("")}</ul>` : "";
const faqs = (label: string, values: { question: string; answer: string }[]) => values.length
  ? `${heading(label)}${values.map(value => `<h3>${escape(value.question)}</h3>${paragraph(value.answer)}`).join("")}` : "";
const link = (path: string, label: string, lang: Lang) => `<a href="/${lang}${escape(path)}">${escape(label)}</a>`;
const navigation = (lang: Lang) => `<nav>${[
  link("/services", servicesPageText[lang].title, lang), link("/projects", projectsPageText[lang].title, lang),
  link("/materials", materialsPageText[lang].title, lang), link("/blog", blogPageText[lang].title, lang),
].join(" · ")}</nav>`;
const wrap = (body: string, lang: Lang) => body && body.length <= 262144
  ? `<main data-flashcast-readable-body lang="${lang === "zh" ? "zh-CN" : lang === "ms" ? "ms-MY" : "en"}">${body}${navigation(lang)}</main>` : "";

function customCabinetsBody(lang: Lang) {
  const copy = customCabinetsText[lang];
  let body = `<h1>${escape(copy.landingTitle || copy.title)}</h1>`;
  if (copy.landingIntro) body += paragraph(copy.landingIntro);
  if (copy.intro) body += paragraph(copy.intro);

  if (copy.packagesTitle) {
    body += heading(copy.packagesTitle);
    if (copy.packagesIntro) body += paragraph(copy.packagesIntro);
    if (copy.packages) {
      body += `<ul>${Object.values(copy.packages).map(p =>
        `<li><h3>${escape(p.title)}</h3>${paragraph(p.scope)}${paragraph(p.description)}</li>`
      ).join("")}</ul>`;
    }
  }

  if (copy.configTitle) {
    body += heading(copy.configTitle);
    if (copy.configIntro) body += paragraph(copy.configIntro);
    if (copy.styles) {
      body += `<h3>${escape(copy.styleStep || "Styles")}</h3><ul>${Object.values(copy.styles).map(s =>
        `<li><strong>${escape(s.title)}</strong>: ${escape(s.description)}</li>`
      ).join("")}</ul>`;
    }
    if (copy.palettes) {
      body += `<h3>${escape(copy.paletteStep || "Palettes")}</h3><ul>${Object.values(copy.palettes).map(pal =>
        `<li><strong>${escape(pal.name)}</strong> - ${escape(pal.countertop)}: ${escape(pal.description)}</li>`
      ).join("")}</ul>`;
    }
  }

  if (copy.materialsTitle) {
    body += heading(copy.materialsTitle);
    if (copy.materialsIntro) body += paragraph(copy.materialsIntro);
    body += (copy.materialItems || []).map(m =>
      `<h3>${escape(m.title)}</h3>${paragraph(m.description)}`
    ).join("");
  }

  if (copy.processTitle) {
    body += heading(copy.processTitle);
    body += (copy.process || []).map(pr =>
      `<h3>${escape(pr.title)}</h3>${paragraph(pr.description)}`
    ).join("");
  }

  if (copy.faqTitle && copy.faqs?.length) {
    body += heading(copy.faqTitle) + copy.faqs.map(f =>
      `<h3>${escape(f.question)}</h3>${paragraph(f.answer)}`
    ).join("");
  }

  if (copy.finalTitle) {
    body += heading(copy.finalTitle);
    if (copy.finalDescription) body += paragraph(copy.finalDescription);
  }
  if (copy.quoteNote) body += paragraph(copy.quoteNote);

  return wrap(body, lang);
}

function aboutBody(lang: Lang) {
  const copy = aboutCopy[lang];
  let body = `<h1>${escape(copy.title)}</h1>${paragraph(copy.description)}`;
  if (copy.introTitle) body += heading(copy.introTitle);
  if (copy.intro?.length) {
    body += copy.intro.map(paragraph).join("");
  }
  if (copy.tags?.length) {
    body += `<ul>${copy.tags.map(t => `<li>${escape(t)}</li>`).join("")}</ul>`;
  }
  if (copy.valuesTitle) {
    body += heading(copy.valuesTitle) + paragraph(copy.valuesDescription);
    const values = aboutValueCopy[lang] || [];
    if (values.length) {
      body += `<ul>${values.map(v => `<li><h3>${escape(v.title)}</h3>${paragraph(v.desc)}</li>`).join("")}</ul>`;
    }
  }
  if (copy.teamTitle) {
    body += heading(copy.teamTitle) + paragraph(copy.teamDescription);
    const team = aboutTeamCopy[lang] || [];
    if (team.length) {
      body += `<ul>${team.map(t => `<li><h3>${escape(t.title)}</h3>${paragraph(t.desc)}</li>`).join("")}</ul>`;
    }
  }
  if (copy.journeyTitle) {
    body += heading(copy.journeyTitle) + paragraph(copy.journeyDescription);
    const milestones = aboutMilestoneCopy[lang] || [];
    if (milestones.length) {
      body += `<ol>${milestones.map(m => `<li><h3>${escape(m.year)}. ${escape(m.title)}</h3>${paragraph(m.desc)}</li>`).join("")}</ol>`;
    }
  }
  const stats = aboutStatCopy[lang] || [];
  if (stats.length) {
    body += heading(lang === "zh" ? "服务概览" : lang === "ms" ? "Gambaran Perkhidmatan" : "Service Overview");
    body += `<ul>${stats.map(s => `<li><strong>${escape(s.value)}</strong>: ${escape(s.label)}</li>`).join("")}</ul>`;
  }
  if (copy.officeTitle) {
    const address = lang === "zh"
      ? "94, Jalan Mega Mendung, Taman United, 58200 吉隆坡，马来西亚"
      : "94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur, Malaysia";
    const officeAddr = (copy.officeAddress || "").replace("{address}", address);
    body += heading(copy.officeTitle) + paragraph(copy.officeDescription) + paragraph(officeAddr) + paragraph(copy.visitNote);
  }

  const aboutFaqHeading = lang === "zh" ? "常见规划问题与合作保障" : lang === "ms" ? "Soalan Lazim Perancangan dan Jaminan Kerjasama" : "Planning FAQs and Project Assurance";
  const aboutFaqs = lang === "zh" ? [
    { q: "从初步咨询到正式报价需要经历哪些步骤？", a: "首先由专属顾问了解您的空间现况、户型图与预算期望；接着进行现场实测或深度空间核对，确认水电动线、拆改可行性与定制尺寸；最后出具透明分项的书面报价单，清晰载明材料品牌、规格与施工工期。" },
    { q: "FLASH CAST 在材料环保与施工品质上如何把控？", a: "严选符合马来西亚及国际标准的环保板材、低甲醛胶水与品牌五金配件。施工全流程由经验丰富的项目管理团队按工序验收，确保隐蔽工程、泥水、木工及油漆达到交付标准。" },
    { q: "住宅与商业空间装修的施工审批如何办理？", a: "对于公寓与商业写字楼，我们协助业主准备施工图纸、押金文件并与物业管理处（Management Office）对接进场审批；对于独立洋房或结构扩建，按需配合注册建筑师向当地市政局（DBKL/MBPJ/MBSA 等）办理相关准证。" },
  ] : lang === "ms" ? [
    { q: "Apakah langkah dari perundingan awal hingga sebut harga rasmi?", a: "Pertama, perunding kami memahami keadaan ruang anda, pelan lantai dan jangkaan belanjawan; kemudian tinjauan tapak atau semakan ruang dijalankan untuk mengesahkan dimensi dan kebolehlaksanaan kerja; akhirnya kami menyediakan sebut harga bertulis terperinci yang menyenaraikan jenama bahan, spesifikasi dan tempoh masa projek." },
    { q: "Bagaimanakah FLASH CAST mengawal kualiti bahan dan pembinaan?", a: "Kami memilih bahan mesra alam yang mematuhi piawaian Malaysia dan antarabangsa, pelekat rendah formaldehid serta aksesori perkakasan berjenama. Seluruh proses pembinaan dipantau oleh pengurus projek berpengalaman mengikut peringkat kerja." },
    { q: "Bagaimanakah permohonan permit pengubahsuaian diuruskan?", a: "Bagi kondominium dan bangunan komersial, kami membantu pemilik menyediakan lukisan kerja dan berhubung dengan pihak pengurusan (Management Office) untuk kelulusan tapak; bagi banglo atau sambungan struktur, kami membantu urusan permohonan dengan pihak berkuasa tempatan (seperti DBKL/MBPJ/MBSA)." },
  ] : [
    { q: "What are the stages from initial enquiry to a formal quotation?", a: "First, our consultant reviews your current space, floor plans and budget expectations; next, a detailed site visit or space assessment confirms exact dimensions, services and feasibility; finally, a transparent itemised written quotation is issued detailing material brands, specifications and work programmes." },
    { q: "How does FLASH CAST control material safety and build quality?", a: "We select eco-friendly boards, low-formaldehyde adhesives and established hardware fittings adhering to Malaysian and international standards. The entire build sequence is supervised by experienced project managers with stage-by-stage verification." },
    { q: "How are renovation permits and building management approvals handled?", a: "For condominiums and commercial developments, we assist owners in submitting technical drawings, deposits and coordination with building management; for landed structural extensions, we coordinate with registered consultants for local council submissions (such as DBKL/MBPJ/MBSA)." },
  ];
  body += heading(aboutFaqHeading) + aboutFaqs.map(f => `<h3>${escape(f.q)}</h3>${paragraph(f.a)}`).join("");

  if (copy.ctaTitle) {
    body += heading(copy.ctaTitle) + paragraph(copy.ctaDescription);
    const quoteTxt = copy.quoteLabel || (lang === "zh" ? "获取报价" : "Request a Quote");
    body += `<p>${link("/quote", quoteTxt, lang)} · ${link("/contact", lang === "zh" ? "联系我们" : "Contact Us", lang)}</p>`;
  }

  return wrap(body, lang);
}

function contactBody(lang: Lang) {
  const copy = contactPageText[lang];
  let body = `<h1>${escape(copy.heroTitle)}</h1>${paragraph(copy.heroText)}`;
  body += heading(copy.infoTitle);
  const address = copy.addressText || (lang === "zh"
    ? "94, Jalan Mega Mendung, Taman United, 58200 吉隆坡，马来西亚"
    : "94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur, Malaysia");
  body += `<h3>${escape(copy.addressTitle)}</h3>${paragraph(address)}`;
  body += `<h3>${escape(copy.phoneTitle)}</h3><p><a href="tel:+601128853888">+60 11-2885 3888</a></p>`;
  body += `<h3>${escape(copy.hoursTitle)}</h3>${paragraph(copy.hoursText)}`;

  if (copy.servicesTitle) {
    body += heading(copy.servicesTitle);
    const services = contactServiceItems[lang] || [];
    body += `<ul>${services.map(s => `<li>${escape(s)}</li>`).join("")}</ul>`;
  }

  if (copy.locationHelp) {
    body += heading(copy.selectArea || "Service Areas") + paragraph(copy.locationHelp);
    const locs = contactLocationOptions.map(l => l[lang] || l.en);
    body += `<ul>${locs.map(l => `<li>${escape(l)}</li>`).join("")}</ul>`;
  }

  if (copy.formTitle) {
    body += heading(copy.formTitle);
    if (copy.measurementHelp) body += paragraph(copy.measurementHelp);
    if (copy.responseNote) body += paragraph(copy.responseNote);
    const types = contactProjectTypeOptions.map(t => t[lang] || t.en);
    body += `<ul>${types.map(t => `<li>${escape(t)}</li>`).join("")}</ul>`;
  }

  if (copy.navigationTitle) {
    body += heading(copy.navigationTitle) + paragraph(copy.navigationDescription);
    body += `<ul><li>Google Maps</li><li>Waze</li><li>Apple Maps</li></ul>`;
  }

  const contactGuideHeading = lang === "zh" ? "到访预约与线上咨询指引" : lang === "ms" ? "Panduan Temu Janji dan Perundingan Dalam Talian" : "Appointment and Online Consultation Guide";
  const contactGuide = lang === "zh" ? [
    "面谈预约：为确保设计师与项目顾问有充分时间与您深入探讨，到访展厅或办公室前请至少提前 1 个工作日预约。",
    "准备资料：携带户型图、现场照片、物业管理装修规程或喜欢的参考案例，能帮助我们在初次沟通中快速梳理预算与工期方向。",
    "快速响应：通过 WhatsApp 或电话联系时，我们的客服与项目团队会在工作时间内迅速响应，安排专属人员跟进您的需求。",
    "交通停车：办公室与展厅周边停车便利，支持 Google Maps、Waze 等主流导航直接搜索 FLASH CAST 即可到达。",
  ] : lang === "ms" ? [
    "Temu Janji: Sila buat temu janji sekurang-kurangnya 1 hari bekerja lebih awal supaya pereka kami dapat meluangkan masa membincangkan projek anda dengan teliti.",
    "Bahan Rujukan: Membawa pelan lantai, foto tapak, garis panduan pengurusan bangunan atau contoh reka bentuk yang digemari membantu kami menyusun belanjawan dengan lebih cepat.",
    "Maklum Balas Pantas: Pasukan khidmat pelanggan kami memberi maklum balas pantas melalui WhatsApp atau telefon semasa waktu operasi untuk menyelaraskan perundingan anda.",
    "Tempat Letak Kereta: Kawasan sekitar pejabat kami menyediakan tempat letak kereta yang mudah; cari FLASH CAST di Google Maps atau Waze untuk navigasi langsung.",
  ] : [
    "Appointments: Please book at least 1 working day in advance so our design and project consultants can dedicate focused time to your project.",
    "Preparation: Bringing floor plans, site photos, management fit-out rules or preferred reference styles helps us establish scope and budget directions quickly during the first meeting.",
    "Prompt Response: Our customer support and project team responds promptly via WhatsApp or telephone during office hours to coordinate your consultation.",
    "Parking & Access: Ample parking is available nearby; simply search for FLASH CAST on Google Maps or Waze for direct driving directions.",
  ];
  body += heading(contactGuideHeading) + `<ul>${contactGuide.map(g => `<li>${escape(g)}</li>`).join("")}</ul>`;

  return wrap(body, lang);
}

function quoteBody(lang: Lang) {
  const copy = quotePageText[lang];
  let body = `<h1>${escape(copy.heroTitle)}</h1>${paragraph(copy.heroText)}`;

  if (copy.formTitle) {
    body += heading(copy.formTitle);
    if (copy.formGuideText) body += paragraph(copy.formGuideText);
    if (copy.formSteps?.length) {
      body += `<ul>${copy.formSteps.map(s => `<li>${escape(s)}</li>`).join("")}</ul>`;
    }
    if (copy.detailsPlaceholder) body += paragraph(copy.detailsPlaceholder);
  }

  if (copy.trustTitle) {
    body += heading(copy.trustTitle);
    if (copy.trustPoints?.length) {
      body += `<ul>${copy.trustPoints.map(p => `<li>${escape(p)}</li>`).join("")}</ul>`;
    }
  }

  if (copy.preparation) {
    body += heading(copy.preparation.heading) + paragraph(copy.preparation.paragraphOne)
      + `<p>${escape(copy.preparation.paragraphTwoBeforeLink)}${link("/blog/renovation-quotation-checklist-malaysia", copy.preparation.linkText, lang)}${escape(copy.preparation.paragraphTwoAfterLink)}</p>`;
  }

  if (copy.photoTitle) {
    body += heading(copy.photoTitle) + paragraph(`${copy.photoText} WhatsApp ${copy.photoTextEnd || ""}`);
  }

  if (copy.chatTitle) {
    body += heading(copy.chatTitle) + paragraph(copy.chatText);
  }

  if (copy.contactLabel) {
    body += heading(copy.contactLabel) + paragraph(`${copy.office} · ${copy.hours} · ${copy.sunday}`);
  }

  if (copy.navServices) {
    body += heading(copy.navServices) + `<ul>`
      + `<li>${link("/projects", copy.navProjects, lang)}: ${escape(copy.navProjectsHint)}</li>`
      + `<li>${link("/faq", copy.navFaq, lang)}: ${escape(copy.navFaqHint)}</li>`
      + `</ul>`;
  }

  const quoteFaqHeading = lang === "zh" ? "报价常见问题与透明度保障" : lang === "ms" ? "Soalan Lazim Sebut Harga dan Jaminan Ketelusan" : "Quotation FAQs and Transparency Assurance";
  const quoteFaqs = lang === "zh" ? [
    { q: "报价单中包含哪些费用项目？", a: "FLASH CAST 的报价单采取清晰分项原则，详细列出拆除、泥水、水电、木工定制、油漆及清洁等各项的人工与材料明细，绝不包含未说明的隐形费用或模糊包干套项。" },
    { q: "提交报价需求后多久可以收到正式方案？", a: "在收到清晰的户型平面图与需求清单后，初步估算通常在 2-3 个工作日内出具；若涉及现场实地勘测与深度定制设计，详细分项方案在 3-5 个工作日内完成。" },
    { q: "施工期间是否会出现中途加价的情况？", a: "除非业主主动要求调整设计方案、增加施工项目或升级既定材料等级，否则所有已在合同报价单中确认的工作内容一律按约定执行，严禁无故增项加价。" },
    { q: "付款方式与施工进度如何挂钩？", a: "项目实行按施工节点分期验收付款制度（订金、拆除水电验收、泥水木工验收、最终交付验收），每个阶段验收合格并签字后再进行下一期款项支付，保障业主资金安全。" },
  ] : lang === "ms" ? [
    { q: "Apakah yang terkandung dalam sebut harga?", a: "Sebut harga FLASH CAST disediakan secara berasingan dengan jelas, menyenaraikan butiran kos buruh dan bahan untuk perobohan, kerja paip, elektrik, kerja kayu tersuai, mengecat dan pembersihan tanpa sebarang caj tersembunyi." },
    { q: "Berapa lamakah masa yang diambil untuk menerima sebut harga?", a: "Selepas menerima pelan lantai dan keperluan ruang yang lengkap, anggaran awal biasanya disiapkan dalam masa 2-3 hari bekerja; bagi projek yang memerlukan tinjauan tapak dan reka bentuk terperinci, dokumen penuh disediakan dalam 3-5 hari bekerja." },
    { q: "Adakah terdapat kos tambahan semasa pembinaan?", a: "Kecuali pemilik meminta perubahan skop kerja, penambahan ruang atau naik taraf bahan secara sukarela, semua item yang disahkan dalam sebut harga kontrak akan dilaksanakan mengikut harga yang dipersetujui." },
    { q: "Bagaimanakah jadual pembayaran diselaraskan?", a: "Pembayaran dibuat secara berperingkat mengikut pencapaian kerja sebenar (deposit, kerja kasar/elektrik, pertukangan/jubin, dan penyerahan akhir selepas pemeriksaan memuaskan) untuk memastikan keselamatan kewangan anda." },
  ] : [
    { q: "What is included in the quotation?", a: "FLASH CAST quotations are fully itemised, clearly stating labor and material details for demolition, plumbing, electrical, custom carpentry, painting and cleaning without hidden charges or ambiguous lumped sums." },
    { q: "How long does it take to receive a formal quotation?", a: "Once we receive a clear floor plan and project brief, an initial estimate is typically ready in 2-3 working days; projects involving detailed site assessments and tailored cabinetry take 3-5 working days." },
    { q: "Will there be unexpected price increases during construction?", a: "Unless the client explicitly requests changes to the scope, layout additions or upgraded finishes, all confirmed works in the signed quotation are executed at the agreed figures." },
    { q: "How are payment stages tied to project progress?", a: "Payments are scheduled across verified milestones (deposit, preliminary services, carpentry/tiling, and final handover inspection), ensuring total financial transparency and accountability." },
  ];
  body += heading(quoteFaqHeading) + quoteFaqs.map(f => `<h3>${escape(f.q)}</h3>${paragraph(f.a)}`).join("");

  if (copy.privacyNote) body += paragraph(copy.privacyNote);

  return wrap(body, lang);
}

function promotionsBody(lang: Lang) {
  const copy = promotionsPageText[lang];
  let body = `<h1>${escape(copy.title)}</h1>${paragraph(copy.intro)}`;
  if (copy.listTitle) body += heading(copy.listTitle);
  if (copy.defaultOffers?.length) {
    body += `<ul>${copy.defaultOffers.map(offer =>
      `<li><h3>${escape(offer.title)}</h3>${paragraph(offer.description)}${paragraph(`${copy.conditions || "Conditions"}: ${offer.terms}`)}</li>`
    ).join("")}</ul>`;
  }

  const consultHeading = lang === "zh" ? "优惠咨询与报价确认流程" : lang === "ms" ? "Proses perundingan promosi dan sebut harga" : "Promotions enquiry and quotation process";
  const consultPoints = lang === "zh" ? [
    "第一步：提供现场照片与基本需求（房屋类型、大约面积、重点装修空间）。",
    "第二步：沟通设计与材料方向，确认施工可行性与样品。",
    "第三步：出具明确分项的书面报价单，包含所有适用的优惠条款与保修范围。",
    "适用区域涵盖吉隆坡与雪兰莪全区（包括 PJ、Subang、Cheras、Mont Kiara、Puchong、Shah Alam 等）。",
  ] : lang === "ms" ? [
    "Langkah 1: Sediakan foto tapak dan keperluan asas (jenis hartanah, anggaran keluasan, ruang utama).",
    "Langkah 2: Bincangkan arah reka bentuk dan bahan, sahkan kebolehlaksanaan dan sampel fizikal.",
    "Langkah 3: Keluarkan sebut harga bertulis terperinci termasuk faedah pakej yang berkenaan.",
    "Kawasan liputan merangkumi seluruh Kuala Lumpur dan Selangor (termasuk PJ, Subang, Cheras, Mont Kiara, Puchong, Shah Alam).",
  ] : [
    "Step 1: Provide site photos and basic needs (property type, estimated area, priority rooms).",
    "Step 2: Discuss design and material direction, confirm feasibility and physical samples.",
    "Step 3: Receive an itemised written quotation reflecting any applicable package benefit and warranty terms.",
    "Coverage spans all of Kuala Lumpur and Selangor (including PJ, Subang, Cheras, Mont Kiara, Puchong, Shah Alam).",
  ];

  body += heading(consultHeading) + `<ul>${consultPoints.map(p => `<li>${escape(p)}</li>`).join("")}</ul>`;

  const promoPolicyHeading = lang === "zh" ? "优惠条款细则与品质保障说明" : lang === "ms" ? "Terma Promosi dan Jaminan Kualiti" : "Promotion Terms and Quality Assurance";
  const promoPolicies = lang === "zh" ? [
    "名额锁定与排期保障：优惠名额按签约或支付意向定金的时间顺序确认，锁定优惠后可按业主的交房时间灵活排期施工，避免因材料通胀或工期紧张造成延误。",
    "用料标准与质保完全一致：所有享受优惠折扣或套餐减免的项目，均采用与标准方案完全一致的正品环保板材、品牌五金配件与专业施工工序，绝不以次充好，享有完整官方保修服务。",
    "方案透明无捆绑：促销活动所赠送或升级的工程项目均明细列于报价单内，业主可根据实际户型需求自主选择，不强制捆绑任何不必要的附加消费。",
    "全区适用无隐形远途费：优惠适用于吉隆坡及雪兰莪所有已公布的服务区域，无任何额外的远途派工附加费，享受同等的现场勘测与全案交付标准。",
  ] : lang === "ms" ? [
    "Tempahan Tawaran & Penjadualan: Tawaran disahkan mengikut giliran perjanjian atau deposit; selepas dikunci, tarikh pembinaan boleh dijadualkan secara fleksibel mengikut tarikh penyerahan kunci hartanah anda.",
    "Kualiti Bahan & Jaminan Sama: Semua projek promosi menggunakan bahan mesra alam standard, perkakasan berjenama dan proses pembinaan profesional yang sama dengan perlindungan waranti penuh.",
    "Ketelusan Tanpa Ikatan Tersembunyi: Setiap pakej promosi dinyatakan secara jelas dalam sebut harga tanpa sebarang pakej tambahan paksaan.",
    "Liputan Penuh Tanpa Caj Jauh: Terpakai untuk semua kawasan perkhidmatan yang diterbitkan di Kuala Lumpur dan Selangor tanpa sebarang surcaj lokasi tambahan.",
  ] : [
    "Slot Reservation & Flexible Scheduling: Promotional offers are reserved upon signing or initial commitment deposit, allowing flexible construction start dates tailored to your property handover timeline.",
    "Identical Material & Warranty Standards: All promotional packages use identical certified materials, branded hardware and professional workmanship with full official warranty coverage.",
    "Transparent Scope with No Hidden Bundles: Every promotion benefit is clearly itemised in your written quotation with no compulsory extra fees or unwanted add-ons.",
    "Full Regional Coverage with No Travel Surcharge: Promotional terms apply across all published service districts in Kuala Lumpur and Selangor without extra location fees.",
  ];
  body += heading(promoPolicyHeading) + `<ul>${promoPolicies.map(p => `<li>${escape(p)}</li>`).join("")}</ul>`;

  const promoValidityHeading = lang === "zh" ? "优惠有效期与价格锁定承诺" : lang === "ms" ? "Tempoh Sah Promosi dan Jaminan Kunci Harga" : "Promotion Validity and Price Lock Guarantee";
  const promoValidity = lang === "zh" ? [
    "报价有效期：活动专享优惠报价单自正式出具之日起 30 天内有效，方便业主充分对比与家人商榷规划。",
    "施工价格锁定承诺：签约并支付意向金后，所享优惠价格与材料配置即刻锁定，即使后续遇市场原材料价格波动，已签约项目绝不上调价格。",
    "工期透明履约：所有特惠套餐项目均严格按照合同约定的工期节点推进，按期验收交付，保障业主顺利入住。",
  ] : lang === "ms" ? [
    "Tempoh Sah Sebut Harga: Sebut harga promosi sah selama 30 hari dari tarikh dikeluarkan untuk perancangan teliti.",
    "Jaminan Kunci Harga: Selepas perjanjian dimeterai, harga promosi dikunci sepenuhnya walaupun terdapat turun naik kos bahan pasaran.",
    "Komitmen Jadual Pembinaan: Semua projek pakej promosi dilaksanakan mengikut jadual yang dipersetujui dalam kontrak.",
  ] : [
    "Quotation Validity: Promotional quotations remain valid for 30 days from date of issue, giving you ample time to evaluate.",
    "Price Lock Commitment: Upon signing and confirmation, your package price is locked against any upcoming market material price fluctuations.",
    "Schedule Transparency: Every promotional package is delivered according to agreed contract milestones with strict stage-by-stage accountability.",
  ];
  body += heading(promoValidityHeading) + `<ul>${promoValidity.map(v => `<li>${escape(v)}</li>`).join("")}</ul>`;

  if (copy.actionTitle) {
    body += heading(copy.actionTitle);
    const quoteLabel = copy.quote || (lang === "zh" ? "提交报价需求" : "Request quotation");
    const enquireLabel = copy.enquire || (lang === "zh" ? "联系咨询" : "Enquire now");
    body += `<p>${link("/quote", quoteLabel, lang)} · ${link("/contact", enquireLabel, lang)}</p>`;
  }

  return wrap(body, lang);
}

function oldHouseBody(row: Row | null | undefined, lang: Lang) {
  const copy = oldHouseRenovationPageText[lang];
  const faqItems = mapOldHousePublicFaqs(row?.status === "published" ? row[`faqs_${lang}`] : copy.faqs);
  let body = `<h1>${escape(copy.title)}</h1>${paragraph(mediaLabels[lang].renderingConcept)}${paragraph(copy.description)}`;
  body += heading(copy.introTitle) + copy.intro.map(paragraph).join("");
  body += heading(copy.comparisonsTitle) + paragraph(copy.comparisonsDescription)
    + copy.comparisons.map(item => `<h3>${escape(item.title)}</h3>${paragraph(item.meta)}${paragraph(item.description)}`).join("");
  body += heading(copy.challengesTitle) + paragraph(copy.challengesDescription)
    + copy.challenges.map(item => `<h3>${escape(item.title)}</h3>${paragraph(item.desc)}`).join("");
  body += paragraph(copy.scopeDescription) + list(copy.scopeTitle, [...copy.scope]);
  body += heading(copy.processTitle) + paragraph(copy.processDescription)
    + copy.process.map(item => `<h3>${escape(item.title)}</h3>${paragraph(item.desc)}`).join("");
  body += heading(copy.priceTitle) + paragraph(copy.priceDescription)
    + copy.prices.map(item => `<h3>${escape(item.type)}</h3>${paragraph(item.range)}${paragraph(item.desc)}`).join("");
  body += heading(copy.resourceTitle) + paragraph(copy.resourceDescription)
    + getServiceContextLinks("old-house", lang).map(item => heading(item.title) + paragraph(item.description) + link(item.href, item.title, lang)).join("");
  body += copy.planningAnswers.map(item => heading(item.title) + paragraph(item.paragraph)).join("");
  body += faqs(copy.faqTitle, faqItems) + heading(copy.ctaTitle) + paragraph(copy.ctaDescription);
  body += `<nav>${copy.internalLinks.map(item => link(item.to, item.label, lang)).join(" · ")}</nav>`;
  return wrap(body, lang);
}

function processBody(sources: Sources, lang: Lang) {
  const copy = processPageText[lang];
  const row = sources.row?.status === "published" ? sources.row : null;
  const field = (name: string) => plain(row?.[`${name}_${lang}`], lang);
  const steps = sources.processSteps?.filter(step => step.status === "published");
  const visible = steps?.length ? steps.map((step, index) => ({
    title: plain(step[`title_${lang}`], lang), desc: plain(step[`description_${lang}`], lang),
    details: copy.steps[index]?.details?.length ? [...copy.steps[index].details] : [plain(step[`description_${lang}`], lang)],
  })) : copy.steps;
  return wrap(`<h1>${escape(field("title") || copy.title)}</h1>${paragraph(field("description") || copy.description)}${heading(copy.sectionTitle)}${paragraph(field("content") || copy.sectionDescription)}<ol>${visible.map(step =>
    `<li><h3>${escape(step.title)}</h3>${paragraph(step.desc)}${list("", [...step.details])}</li>`
  ).join("")}</ol>`, lang);
}

function materialSubcategoryGuidanceBody(
  categorySlug: string,
  categoryName: string,
  subcategoryName: string,
  lang: Lang,
  renderLink: (path: string, label: string) => string,
) {
  const guidance = getMaterialSubcategoryGuidance(categorySlug, categoryName, subcategoryName, lang);
  return heading(guidance.checklistTitle) + paragraph(guidance.checklistDescription)
    + guidance.checklist.map(item => heading(item.title) + paragraph(item.description)).join("")
    + heading(guidance.relatedTitle) + paragraph(guidance.relatedDescription)
    + guidance.relatedLinks.map(item => renderLink(item.href, item.title)).join(" · ");
}

function materialTaxonomyFallbackBody(
  categorySlug: string,
  subcategorySlug: string | undefined,
  lang: Lang,
  resolveLink?: ResolveMaterialLink,
) {
  // Use the same static categories that the browser merges with published data.
  // In particular, their furniture branch is separate from the furniture store.
  const category = materialsData.find(item => item.slug === categorySlug);
  if (!category) return "";
  const subcategory = category.subcategories.find(item => item.slug === subcategorySlug);
  if (subcategorySlug && !subcategory) return "";

  const renderLink = (path: string, title: string) => {
    const href = resolveLink?.(`/${lang}${path}`);
    return href ? `<a href="${escape(href)}">${escape(title)}</a>` : escape(title);
  };
  const categoryCopy = materialCategoryPageText[lang];
  const subcategoryCopy = materialSubcategoryPageText[lang];
  const categoryPath = `/materials/category/${category.slug}`;
  const categoryName = translateMaterialCategory(category.name, lang);
  const name = subcategory ? translateMaterialSubcategory(subcategory.name, lang) : categoryName;
  let body = `<h1>${escape(name)}</h1>${paragraph(plain((subcategory || category).description, lang))}`;

  if (subcategory) {
    body += materialSubcategoryGuidanceBody(category.slug, categoryName, name, lang, renderLink);
  } else if (category.subcategories.length) {
    body += heading(categoryCopy.browseSubcategories) + `<ul>${category.subcategories.map(item =>
      `<li><h3>${renderLink(`${categoryPath}/${item.slug}`, translateMaterialSubcategory(item.name, lang))}</h3>${paragraph(plain(item.description, lang))}</li>`
    ).join("")}</ul>`;
  }
  const items = category.items.filter(item => !subcategory || item.subcategory === subcategory.slug);
  if (items.length) {
    body += heading(subcategory ? subcategoryCopy.products(name) : categoryCopy.allProducts(name));
    body += `<ul>${items.map(item => {
      const title = plain(item.name, lang);
      const spaces = item.suitableSpaces.map(space => translateSpaceLabel(space, lang)).join(" / ");
      return `<li><h3>${renderLink(`/materials/${item.slug}`, title)}</h3>${paragraph(spaces)}</li>`;
    }).join("")}</ul>`;
  } else if (subcategory) {
    body += heading(subcategoryCopy.products(name)) + paragraph(subcategoryCopy.comingSoon);
  }
  if (!subcategory) body += buildMaterialCategoryGuidanceBody(category.slug, lang);
  return wrap(body, lang);
}

// This supplements the existing reviewed renderers without rewriting their
// frozen source or falling back to a different language or an unpublished row.
export function buildExpandedReadableBody(key: string, sources: Sources) {
  const match = key.match(/^\/(en|zh|ms)(\/.*)$/);
  if (!match) return "";
  const lang = match[1] as Lang, path = match[2];
  if (path === "/custom-cabinets") return customCabinetsBody(lang);
  if (path === "/about") return aboutBody(lang);
  if (path === "/contact") return contactBody(lang);
  if (path === "/quote") return quoteBody(lang);
  if (path === "/promotions") return promotionsBody(lang);
  if (path === "/before-after") {
    const copy = beforeAfterPageText[lang];
    const topics = copy.fallbackItems.map(item => `<h3>${escape(item.title)}</h3>${paragraph(item.description)}`).join("");
    return wrap(`<h1>${escape(copy.heroTitle)}</h1>${paragraph(mediaLabels[lang].renderingConcept)}${paragraph(copy.heroDescription)}`
      + heading(copy.sectionTitle) + paragraph(copy.sectionDescription) + topics
      + heading(copy.ctaTitle) + paragraph(copy.ctaDescription) + link("/quote#quote-form", copy.ctaPrimary, lang), lang);
  }
  if (path === "/services/old-house") return oldHouseBody(sources.row, lang);
  if (path === "/process") return processBody(sources, lang);
  if (readableBodyPaths.some(reviewed => reviewed === path)) return "";
  const detail = path.match(/^\/(services|blog|projects|materials)\/([^/]+)$/);
  const row = sources.row;
  if (detail && row?.status === "published" && row.slug === decodeURIComponent(detail[2])) {
    const kind = detail[1];
    const field = (name: string) => plain(row[`${name}_${lang}`], lang);
    const title = field("title");
    const content = text(row[`content_${lang}`]) || text(row[`excerpt_${lang}`]);
    if (!title || !content.trim() || content.length > 131072) return "";
    let body = `<h1>${escape(title)}</h1>`;
    if (kind === "projects" && isRenderingConceptProject({ ...row, images: records(row.project_images).map(image => text(image.image_url)) })) body += paragraph(mediaLabels[lang].renderingConcept);
    if (field("excerpt")) body += paragraph(field("excerpt"));
    // Project and material pages display plain paragraphs; preserve that same
    // text. Blogs/services retain their authored headings and safe links.
    body += kind === "projects" || kind === "materials"
      ? paragraph(plain(content, lang)) : sanitizeReadableContent(content, lang);
    const values = (name: string) => strings(row[`${name}_${lang}`]).map(item => plain(item, lang)).filter(Boolean);
    if (kind === "services") {
      const copy = serviceDetailPageText[lang];
      if (detail[2] === "design") {
        const design = designServicePageText[lang];
        body += heading(design.worksTitle) + paragraph(design.worksSummary)
          + paragraph(design.conceptDisclosure) + heading(design.courtyardTitle) + paragraph(design.courtyardDescription)
          + heading(design.readingTitle) + paragraph(design.readingDescription)
          + heading(design.approachTitle) + paragraph(design.approachSummary)
          + heading(design.designReasons3) + paragraph(design.designReasons4)
          + heading(design.designReasons) + paragraph(design.designReasons2)
          + heading(design.designReasons5) + paragraph(design.designReasons6)
          + heading(design.materialsTitle) + paragraph(design.materialsSummary)
          + heading(design.woodMaterialTitle) + paragraph(design.materialWood)
          + heading(design.stoneMaterialTitle) + paragraph(design.materialStone)
          + heading(design.linenMaterialTitle) + paragraph(design.materialLinen)
          + heading(design.bronzeMaterialTitle) + paragraph(design.materialBronze)
          + heading(design.servicesTitle) + paragraph(design.servicesSummary);
        body += [[design.serviceItem, design.serviceContent], [design.serviceItem2, design.serviceContent2],
          [design.serviceItem3, design.serviceContent3], [design.serviceItem4, design.serviceContent4],
          [design.processTitle, design.processSummary], [design.processGrid, design.processGrid2],
          [design.processGrid3, design.processGrid4], [design.processGrid5, design.processGrid6],
          [design.processGrid7, design.processGrid8], [design.processGrid9, design.processGrid10],
          [design.processGrid11, design.processGrid12]].map(([title, description]) => heading(title) + paragraph(description)).join("");
        return wrap(body + faqs(design.faqTitle, mapPublicServiceFaqs(row[`faqs_${lang}`])), lang);
      }
      if (detail[2] === "surface-repair") {
        const repair = surfaceRepairPageText[lang];
        body += heading(repair.scopeTitle) + repair.damageExamples.map(item =>
          heading(item.title) + paragraph(item.condition) + paragraph(item.approach) + paragraph(item.boundary)).join("");
        body += heading(repair.allScopeTitle) + repair.services.map(item => heading(item.title) + paragraph(item.summary)
          + paragraph(item.problems) + paragraph(item.direction) + paragraph(item.boundary)).join("");
        body += heading(repair.assessmentTitle) + paragraph(repair.assessmentDescription)
          + repair.assessment.map(item => heading(item.title) + paragraph(item.description) + paragraph(item.label) + paragraph(item.details)).join("");
        const steps = records(row[`process_steps_${lang}`]);
        body += heading(repair.processTitle) + paragraph(repair.processDescription)
          + (steps.length ? steps.map(item => heading(plain(item.title, lang)) + paragraph(plain(item.desc, lang)))
            : repair.process.map(item => heading(item.title) + paragraph(item.description))).join("");
        body += paragraph(repair.situations) + heading(repair.priceTitle)
          + repair.priceFactors.map(item => heading(item.title) + paragraph(item.description)).join("")
          + faqs(repair.faqTitle, mapPublicServiceFaqs(row[`faqs_${lang}`]))
          + heading(repair.consultTitle) + paragraph(repair.consultDescription)
          + repair.photoGuide.map(item => heading(item.title) + paragraph(item.description)).join("")
          + heading(repair.relatedTitle) + paragraph(repair.relatedDescription)
          + repair.related.map(item => link(item.path, item.title, lang)).join(" · ");
        return wrap(body, lang);
      }
      body += list(copy.suitableFor, values("suitable_for")) + list(copy.offer, values("scope_items")) + list(copy.commonProjects, values("common_projects"));
      body += records(row[`process_steps_${lang}`]).map(step => `<h3>${escape(plain(step.title, lang))}</h3>${paragraph(plain(step.desc, lang))}`).join("");
      if (detail[2] === "shop-renovation" && (lang === "en" || lang === "zh")) {
        body += getServiceProjectGuidance(detail[2], lang).map(block =>
          `<section>${heading(block.heading)}${block.body.split("\n").map(paragraph).join("")}</section>`
        ).join("");
      }
      body += faqs(copy.faq, mapPublicServiceFaqs(row[`faqs_${lang}`]));
      body += getServiceContextLinks(detail[2], lang).map(item => heading(item.title) + paragraph(item.description) + link(item.href, item.title, lang)).join("");
    } else if (kind === "projects") {
      const copy = projectDetailPageText[lang];
      body += heading(copy.clientRequirements) + paragraph(field("client_need"));
      body += list(copy.solution, values("highlights"));
      body += list(copy.scope, strings(row.scope).map(value => translateProjectScopedLabel(value, lang, detail[2], "scope")));
      body += list(copy.materials, strings(row.materials).map(value => translateProjectScopedLabel(value, lang, detail[2], "materials")));
    } else if (kind === "materials") {
      const copy = materialDetailPageText[lang];
      body += list(copy.suitableSpaces, strings(row[`suitable_spaces_${lang}`]).map(value => translateSpaceLabel(value, lang)));
      body += list(copy.pros, values("pros")) + list(copy.cons, values("cons"));
      body += paragraph(field("recommended_pairing")) + paragraph(field("note"));
    }
    return wrap(body, lang);
  }
  const category = path.match(/^\/materials\/category\/([^/]+)(?:\/([^/]+))?$/);
  const kind = path.slice(1);
  const collection = ({
    services: sources.services,
    projects: sources.projects,
    materials: sources.materials,
    blog: sources.blogPosts,
    locations: sources.serviceAreas && sources.serviceAreas.length ? sources.serviceAreas : (kind === "locations" ? fallbackServiceAreas : undefined),
  } as Record<string, Row[] | null | undefined>)[category ? "materials" : kind];
  const rows = collection?.filter(item => item.status === "published" && safeSlug(item.slug)
    && (text(item[`title_${lang}`]).trim() || text(item.title_en).trim() || text(item.area_name).trim() || text(item.title_zh).trim() || safeSlug(item.slug))
    && (!category || taxonomy(item.category) === category[1] && (!category[2] || taxonomy(item.subcategory) === category[2]))) || [];
  if (!rows.length) return category ? materialTaxonomyFallbackBody(category[1], category[2], lang, sources.resolveMaterialLink) : "";
  const copy = ({
    services: servicesPageText,
    projects: projectsPageText,
    materials: materialsPageText,
    blog: blogPageText,
    locations: locationsPageText,
  } as const)[category ? "materials" : kind as "services" | "projects" | "materials" | "blog" | "locations"];
  if (!copy) return "";
  const categoryName = category ? translateMaterialCategory(text(rows[0].category), lang) : "";
  const categoryTitle = category?.[2] ? translateMaterialSubcategory(text(rows[0].subcategory), lang) : categoryName;
  let body = `<h1>${escape(categoryTitle || copy[lang].title)}</h1>${paragraph(category ? plain(rows[0][`excerpt_${lang}`], lang) : copy[lang].intro)}`;
  if (category?.[2]) {
    body += materialSubcategoryGuidanceBody(category[1], categoryName, categoryTitle, lang, (href, title) => link(href, title, lang));
  }
  body += `<ul>${rows.map(item => {
    const itemTitle = plain(item[`title_${lang}`], lang)
      || (lang === "ms" ? plain(item.title_en, lang) : "")
      || plain(item.area_name, lang)
      || plain(item.title_zh, lang)
      || safeSlug(item.slug);
    const itemExcerpt = plain(item[`excerpt_${lang}`], lang)
      || plain(item[`seo_description_${lang}`], lang)
      || (lang === "ms" ? (plain(item.excerpt_en, lang) || plain(item.seo_description_en, lang)) : "")
      || plain(item.excerpt_zh, lang)
      || plain(item.seo_description_zh, lang);
    return `<li><h2>${link(`/${category ? "materials" : kind}/${safeSlug(item.slug)}`, itemTitle, lang)}</h2>${paragraph(itemExcerpt)}</li>`;
  }).join("")}</ul>`;
  if (category && !category[2]) body += buildMaterialCategoryGuidanceBody(category[1], lang);
  return wrap(body, lang);
}
