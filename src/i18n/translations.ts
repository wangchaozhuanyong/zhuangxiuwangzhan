/**
 * Complete bilingual content for FLASH CAST website.
 * Every user-facing string must go through this file.
 * Usage: const t = useT(); t("nav.home")
 */

type Translations = Record<string, Record<string, string>>;

export const translations: Translations = {
  // ============ NAVIGATION ============
  "nav.home": { en: "Home", zh: "首页" },
  "nav.about": { en: "About", zh: "关于我们" },
  "nav.services": { en: "Services", zh: "服务项目" },
  "nav.materials": { en: "Materials", zh: "材料库" },
  "nav.projects": { en: "Projects", zh: "项目案例" },
  "nav.process": { en: "Process", zh: "施工流程" },
  "nav.blog": { en: "Blog", zh: "博客" },
  "nav.faq": { en: "FAQ", zh: "常见问题" },
  "nav.contact": { en: "Contact", zh: "联系我们" },
  "nav.navigation": { en: "Navigation", zh: "导航" },

  // ============ CTA BUTTONS ============
  "cta.getQuote": { en: "Get Free Quote", zh: "获取免费报价" },
  "cta.getAQuote": { en: "Get a Quote", zh: "获取报价" },
  "cta.whatsapp": { en: "WhatsApp Us", zh: "WhatsApp 咨询" },
  "cta.contactUs": { en: "Contact Us", zh: "联系我们" },
  "cta.viewAll": { en: "View All", zh: "查看全部" },
  "cta.viewAllServices": { en: "View All Services", zh: "查看全部服务" },
  "cta.viewAllProjects": { en: "View All Projects", zh: "查看全部案例" },
  "cta.viewAllFAQ": { en: "View All FAQ", zh: "查看全部问答" },
  "cta.sendMessage": { en: "Send Message", zh: "发送消息" },
  "cta.sending": { en: "Sending...", zh: "发送中..." },
  "cta.sendAnother": { en: "Send Another Message", zh: "再发送一条" },
  "cta.viewDetails": { en: "View Full Details", zh: "查看详情" },

  // ============ HERO SECTION ============
  "hero.badge": { en: "FLASH CAST SDN. BHD. — Kuala Lumpur", zh: "FLASH CAST SDN. BHD. — 吉隆坡" },
  "hero.title.line1": { en: "Condo, Landed &", zh: "公寓、排屋 &" },
  "hero.title.line2": { en: "Commercial Renovation", zh: "商业装修" },
  "hero.title.line3": { en: "in Kuala Lumpur", zh: "吉隆坡专业施工" },
  "hero.subtitle": {
    en: "We provide renovation, interior design, carpentry, and construction solutions for homes and commercial spaces in Kuala Lumpur and Selangor. Our focus is on quality workmanship, clear communication, and reliable project delivery.",
    zh: "我们为吉隆坡和雪兰莪州的住宅及商业空间提供装修、室内设计、定制木工及施工服务。专注于高质量施工、清晰沟通和可靠的项目交付。",
  },

  // ============ STATS / TRUST SECTION ============
  "stats.projects.value": { en: "200+", zh: "200+" },
  "stats.projects.label": { en: "Completed Projects", zh: "已完成项目" },
  "stats.projects.desc": { en: "Across Kuala Lumpur and Selangor — residential, commercial, and industrial", zh: "覆盖吉隆坡和雪兰莪 — 住宅、商业及工业项目" },
  "stats.experience.value": { en: "10+", zh: "10+" },
  "stats.experience.label": { en: "Years Experience", zh: "年行业经验" },
  "stats.experience.desc": { en: "A decade of renovation experience in the Malaysian market", zh: "十年马来西亚装修行业经验" },
  "stats.trusted.value": { en: "Trusted", zh: "信赖" },
  "stats.trusted.label": { en: "By Homeowners & Businesses", zh: "业主和企业的选择" },
  "stats.trusted.desc": { en: "Repeat clients and referrals are our strongest endorsement", zh: "回头客和转介绍是我们最好的证明" },
  "stats.ssm.value": { en: "SSM", zh: "SSM" },
  "stats.ssm.label": { en: "Registered Company", zh: "注册公司" },
  "stats.ssm.desc": { en: "Fully registered with workmanship warranty on all projects", zh: "正规注册公司，所有项目提供施工保修" },

  // ============ SERVICES SECTION ============
  "services.title": { en: "Our Renovation Services", zh: "我们的装修服务" },
  "services.subtitle": {
    en: "From residential interiors to commercial fit-outs — professional renovation solutions for every space in Kuala Lumpur and Selangor.",
    zh: "从住宅室内到商业装修 — 为吉隆坡和雪兰莪州每一个空间提供专业装修方案。",
  },
  "services.fullRenovation": { en: "Full Renovation", zh: "全屋装修" },
  "services.fullRenovation.desc": {
    en: "Complete renovation for condos and landed properties, including hacking, tiling, electrical, carpentry, painting, and finishing works.",
    zh: "公寓和排屋的全面装修，包括拆除、铺砖、电气、木工、油漆和收尾工程。",
  },
  "services.interiorDesign": { en: "Interior Design", zh: "室内设计" },
  "services.interiorDesign.desc": {
    en: "We design spaces that are functional, modern, and tailored to your lifestyle — with 3D visualization before any work begins.",
    zh: "我们设计功能性强、现代且适合您生活方式的空间 — 施工前提供3D效果图预览。",
  },
  "services.builtIn": { en: "Custom Built-In Furniture", zh: "定制内嵌家具" },
  "services.builtIn.desc": {
    en: "Made-to-measure cabinets, wardrobes, TV consoles, shoe cabinets, vanities, and storage solutions built for durability.",
    zh: "量身定制的橱柜、衣柜、电视柜、鞋柜、洗手台柜和储物方案，坚固耐用。",
  },
  "services.kitchen": { en: "Kitchen Renovation", zh: "厨房装修" },
  "services.kitchen.desc": {
    en: "Complete kitchen renovation including cabinet replacement, countertop upgrade, tiling, plumbing, and appliance integration.",
    zh: "完整厨房装修，包括橱柜更换、台面升级、铺砖、水管及电器集成安装。",
  },
  "services.bathroom": { en: "Bathroom Renovation", zh: "浴室装修" },
  "services.bathroom.desc": {
    en: "Full bathroom renovation with proper waterproofing, modern tiling, vanity installation, and shower system upgrade.",
    zh: "完整浴室装修，专业防水处理、现代瓷砖、洗手台安装和淋浴系统升级。",
  },
  "services.office": { en: "Office Renovation", zh: "办公室装修" },
  "services.office.desc": {
    en: "Practical office layout planning, partition works, furniture installation, data cabling, and professional finishing.",
    zh: "实用的办公室布局规划、隔断工程、家具安装、网络布线和专业收尾。",
  },
  "services.shoplot": { en: "Shoplot Renovation", zh: "店铺装修" },
  "services.shoplot.desc": {
    en: "Complete shop lot fit-out for retail, F&B, clinic, and service businesses — from shopfront design to interior and signage.",
    zh: "零售、餐饮、诊所和服务业的完整店铺装修 — 从店面设计到室内装修和招牌。",
  },
  "services.artisticCoating": { en: "Artistic Wall Coating", zh: "艺术墙面涂料" },
  "services.artisticCoating.desc": {
    en: "Authorized German Remmers applicator. Premium textured wall finishes for feature walls and luxury interiors.",
    zh: "德国 Remmers 授权施工商。高端纹理墙面涂装，适用于特色墙和豪华室内空间。",
  },
  "services.oldHouse": { en: "Old House Renovation", zh: "老房翻新" },
  "services.oldHouse.desc": {
    en: "Comprehensive renovation for aging terrace houses and bungalows — structural repair, rewiring, replumbing, and full makeover.",
    zh: "老旧排屋和独栋别墅的综合翻新 — 结构修复、重新布线、更换管道及全面改造。",
  },
  "services.permit": { en: "Permit & Drawing Support", zh: "申请许可与图纸支持" },
  "services.permit.desc": {
    en: "Renovation permit applications, management office coordination, architectural drawings, and documentation services.",
    zh: "装修许可申请、管理处协调、建筑图纸及文件服务。",
  },

  // ============ WHY CHOOSE US ============
  "whyUs.title": { en: "Why Choose FLASH CAST", zh: "为什么选择 FLASH CAST" },
  "whyUs.subtitle": {
    en: "We focus on practical renovation planning, reliable execution, and quality finishing. Here's what sets us apart.",
    zh: "我们专注于实用的装修规划、可靠的施工执行和高品质收尾。以下是我们的优势。",
  },
  "whyUs.design.title": { en: "In-House Design & Coordination", zh: "自有设计与项目协调" },
  "whyUs.design.desc": {
    en: "Our design team creates 3D visualizations and construction drawings. A dedicated project manager coordinates every trade so you only deal with one team.",
    zh: "我们的设计团队提供3D效果图和施工图纸。专属项目经理协调所有工种，您只需对接一个团队。",
  },
  "whyUs.quotation.title": { en: "Clear Quotation Breakdown", zh: "报价明细清晰透明" },
  "whyUs.quotation.desc": {
    en: "Every quotation is itemized with clear pricing — no lump sums, no hidden costs. You know exactly what you're paying for before any work begins.",
    zh: "每份报价都逐项列明价格 — 不打包、不隐藏费用。施工前您清楚知道每一分钱花在哪里。",
  },
  "whyUs.material.title": { en: "Material Selection Support", zh: "材料选择支持" },
  "whyUs.material.desc": {
    en: "We source materials from trusted suppliers and help you compare options. Visit our showroom to see and touch samples before committing.",
    zh: "我们从可靠供应商采购材料，帮您对比选择。欢迎到展厅亲自查看和触摸样品再做决定。",
  },
  "whyUs.supervision.title": { en: "Regular Site Supervision", zh: "定期工地监督" },
  "whyUs.supervision.desc": {
    en: "Our project managers conduct regular site inspections and provide weekly photo updates so you always know the progress of your renovation.",
    zh: "我们的项目经理定期巡查工地，每周提供照片更新，让您随时了解装修进度。",
  },
  "whyUs.workmanship.title": { en: "Quality Workmanship", zh: "高品质施工" },
  "whyUs.workmanship.desc": {
    en: "We focus on practical renovation planning, reliable execution, and quality finishing. Every project is built to last, not just to look good.",
    zh: "我们注重实用的装修规划、可靠的施工和高品质收尾。每个项目都要经久耐用，不仅仅是好看。",
  },
  "whyUs.ssm.title": { en: "SSM Registered & Warranty", zh: "SSM 注册 & 施工保修" },
  "whyUs.ssm.desc": {
    en: "FLASH CAST SDN. BHD. is a fully SSM-registered company. All renovation works come with workmanship warranty for your peace of mind.",
    zh: "FLASH CAST SDN. BHD. 是一家完全 SSM 注册的公司。所有装修工程均提供施工保修，让您安心无忧。",
  },

  // ============ PROCESS SECTION ============
  "process.title": { en: "Our Renovation Process", zh: "我们的施工流程" },
  "process.subtitle": {
    en: "A clear, structured process from first contact to project handover. Every step is designed to give you confidence and control over your renovation.",
    zh: "从首次咨询到项目交付的清晰结构化流程。每一步都旨在让您对装修项目充满信心和掌控力。",
  },
  "process.step1.title": { en: "Consultation", zh: "咨询沟通" },
  "process.step1.desc": { en: "We understand your goals, space, style, and budget.", zh: "我们了解您的需求、空间、风格和预算。" },
  "process.step2.title": { en: "Site Measurement", zh: "现场测量" },
  "process.step2.desc": { en: "We inspect the site and confirm key dimensions.", zh: "我们实地勘察并确认关键尺寸。" },
  "process.step3.title": { en: "Design Proposal", zh: "设计方案" },
  "process.step3.desc": { en: "We prepare layout ideas and visual direction.", zh: "我们准备布局方案和视觉方向。" },
  "process.step4.title": { en: "Quotation & Material Selection", zh: "报价与材料选择" },
  "process.step4.desc": { en: "We provide a clear breakdown and discuss materials.", zh: "我们提供明细报价并讨论材料选择。" },
  "process.step5.title": { en: "Construction", zh: "施工阶段" },
  "process.step5.desc": { en: "Work is managed by our team with site supervision.", zh: "由我们的团队管理施工，进行工地监督。" },
  "process.step6.title": { en: "Handover", zh: "验收交付" },
  "process.step6.desc": { en: "Final quality check and project delivery.", zh: "最终质量检查和项目交付。" },

  // ============ TESTIMONIALS ============
  "testimonials.title": { en: "What Our Clients Say", zh: "客户评价" },
  "testimonials.subtitle": {
    en: "Real feedback from homeowners and business clients across Kuala Lumpur and Selangor.",
    zh: "来自吉隆坡和雪兰莪州业主及企业客户的真实反馈。",
  },
  "testimonials.1.text": {
    en: "Very responsive team and solid workmanship. The project was delivered on time and the final result looks clean and premium. The quotation was transparent with no hidden costs.",
    zh: "团队响应迅速，施工质量扎实。项目按时交付，最终效果干净高级。报价透明，没有隐藏费用。",
  },
  "testimonials.2.text": {
    en: "Good communication throughout the renovation process. The site supervisor was always available and the weekly photo updates gave us confidence. The final result matches the 3D design perfectly.",
    zh: "整个装修过程中沟通非常顺畅。现场监理随时到位，每周的照片更新让我们很放心。最终效果与3D设计图完全一致。",
  },
  "testimonials.3.text": {
    en: "We chose FLASH CAST for our kitchen renovation. The cabinet quality is excellent, soft-close hardware works perfectly, and the countertop installation was precise. Will use them again for our bedroom.",
    zh: "我们选择了 FLASH CAST 来装修厨房。橱柜质量出色，缓冲五金件运行完美，台面安装精准。下次卧室装修还会找他们。",
  },

  // ============ FAQ SECTION ============
  "faq.title": { en: "Frequently Asked Questions", zh: "常见问题" },
  "faq.subtitle": {
    en: "Common questions about our renovation services, process, and pricing in Kuala Lumpur and Selangor.",
    zh: "关于我们在吉隆坡和雪兰莪州的装修服务、流程和报价的常见问题。",
  },
  "faq.q1": { en: "What types of renovation do you handle?", zh: "你们承接哪些类型的装修？" },
  "faq.a1": {
    en: "We handle full residential renovation (condo and landed), kitchen renovation, bathroom renovation, office fit-out, shop lot renovation, custom built-in furniture, artistic wall coating, and old house renovation. We also assist with permit applications and architectural drawings.",
    zh: "我们承接全屋住宅装修（公寓和排屋）、厨房装修、浴室装修、办公室装修、店铺装修、定制内嵌家具、艺术墙面涂料和老房翻新。我们也协助办理装修许可申请和建筑图纸。",
  },
  "faq.q2": { en: "Do you provide a quotation after site visit?", zh: "现场勘察后会提供报价吗？" },
  "faq.a2": {
    en: "Yes. We provide free site measurements and detailed itemized quotations for all projects in Kuala Lumpur and Selangor — no obligation, no hidden charges.",
    zh: "是的。我们为吉隆坡和雪兰莪州所有项目提供免费现场测量和详细逐项报价 — 无需任何承诺，无隐藏费用。",
  },
  "faq.q3": { en: "Do you serve Kuala Lumpur and Selangor only?", zh: "只服务吉隆坡和雪兰莪吗？" },
  "faq.a3": {
    en: "Yes, we currently serve all areas in Kuala Lumpur and Selangor including Mont Kiara, Bangsar, Cheras, Petaling Jaya, Subang Jaya, Shah Alam, Puchong, and surrounding areas.",
    zh: "是的，我们目前服务吉隆坡和雪兰莪州所有区域，包括满家乐、孟沙、蕉赖、八打灵再也、梳邦再也、莎阿南、蒲种及周边地区。",
  },
  "faq.q4": { en: "Can you handle condo renovation approval?", zh: "能处理公寓装修审批吗？" },
  "faq.a4": {
    en: "Yes. We handle all permit applications — condo management office applications, DBKL permits, and local council approvals. This is included in our project management service.",
    zh: "可以。我们处理所有许可申请 — 公寓管理处申请、DBKL 许可和地方政府审批。这包含在我们的项目管理服务中。",
  },
  "faq.q5": { en: "Do you provide design and carpentry work?", zh: "提供设计和木工服务吗？" },
  "faq.a5": {
    en: "Yes. We have an in-house design team for space planning and 3D visualization, and an in-house carpentry team for custom built-in furniture including wardrobes, kitchen cabinets, and storage solutions.",
    zh: "是的。我们有自己的设计团队负责空间规划和3D效果图，以及自己的木工团队负责定制内嵌家具，包括衣柜、厨柜和储物方案。",
  },
  "faq.q6": { en: "How long does a renovation project usually take?", zh: "装修工程通常需要多长时间？" },
  "faq.a6": {
    en: "Most residential renovations take 6-12 weeks. Kitchen projects take 3-5 weeks. Bathroom renovations take 2-3 weeks. Office and shop lot fit-outs take 4-8 weeks. We provide a detailed timeline with milestones.",
    zh: "大多数住宅装修需要6-12周。厨房项目需要3-5周。浴室装修需要2-3周。办公室和店铺装修需要4-8周。我们会提供详细的时间表和里程碑节点。",
  },
  "faq.q7": { en: "Do you provide warranty or after-sales support?", zh: "提供保修或售后服务吗？" },
  "faq.a7": {
    en: "Yes. All renovation works come with workmanship warranty. We also provide after-sales support for any issues that arise after handover.",
    zh: "是的。所有装修工程均提供施工保修。我们也为交付后出现的任何问题提供售后支持。",
  },

  // ============ CTA SECTION ============
  "ctaSection.title": { en: "Planning to Renovate Your Home or Office?", zh: "计划装修您的住宅或办公室？" },
  "ctaSection.desc": {
    en: "Get a free consultation and quotation today. We serve Kuala Lumpur, Selangor, and surrounding areas.",
    zh: "立即获取免费咨询和报价。我们服务吉隆坡、雪兰莪及周边地区。",
  },

  // ============ ABOUT PAGE ============
  "about.label": { en: "About Us", zh: "关于我们" },
  "about.heroTitle": { en: "Building Spaces, Building Trust", zh: "打造空间，建立信任" },
  "about.heroDesc": {
    en: "FLASH CAST SDN. BHD. — a registered renovation and interior design company based in Kuala Lumpur, providing complete design-and-build solutions for residential, commercial, and industrial spaces across KL and Selangor since 2015.",
    zh: "FLASH CAST SDN. BHD. — 一家注册的装修和室内设计公司，总部位于吉隆坡。自2015年以来，为吉隆坡和雪兰莪州的住宅、商业和工业空间提供完整的设计与施工解决方案。",
  },
  "about.whoWeAre": { en: "Who We Are", zh: "公司简介" },
  "about.whoWeAre.p1": {
    en: "Founded in 2015, FLASH CAST SDN. BHD. has grown from a small residential renovation team into a full-service design and build company serving clients across Kuala Lumpur and Selangor.",
    zh: "成立于2015年，FLASH CAST SDN. BHD. 从一个小型住宅装修团队发展成为服务吉隆坡和雪兰莪州客户的全方位设计与施工公司。",
  },
  "about.whoWeAre.p2": {
    en: "We are SSM-registered and operate from our office at 94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur. Our team handles every aspect of the renovation process.",
    zh: "我们是 SSM 注册公司，办公室位于吉隆坡58200 Taman United, Jalan Mega Mendung 94号。我们的团队负责装修过程的每一个环节。",
  },
  "about.whoWeAre.p3": {
    en: "As an authorized applicator for German Remmers artistic coatings, we also bring European-quality decorative wall finishes to Malaysian homes and commercial spaces.",
    zh: "作为德国 Remmers 艺术涂料的授权施工商，我们也为马来西亚住宅和商业空间带来欧洲品质的装饰墙面涂装。",
  },
  "about.coreValues": { en: "Our Core Values", zh: "核心价值观" },
  "about.coreValues.desc": { en: "These principles guide every project we take on.", zh: "这些原则指导着我们承接的每一个项目。" },
  "about.team": { en: "Our Team", zh: "我们的团队" },
  "about.team.desc": { en: "A dedicated in-house team of professionals — no outsourced labour.", zh: "一支专业的自有团队 — 不外包劳务。" },
  "about.journey": { en: "Our Journey", zh: "发展历程" },
  "about.journey.desc": {
    en: "From a small residential renovation team to a full-service design-and-build company serving Kuala Lumpur and Selangor.",
    zh: "从一个小型住宅装修团队发展成为服务吉隆坡和雪兰莪州的全方位设计施工公司。",
  },
  "about.visitOffice": { en: "Visit Our Office", zh: "参观我们的办公室" },
  "about.visitOffice.desc": { en: "Located in Taman United, Kuala Lumpur.", zh: "位于吉隆坡 Taman United。" },

  // ============ CONTACT PAGE ============
  "contact.label": { en: "Get In Touch", zh: "联系方式" },
  "contact.heroTitle": { en: "Contact Us", zh: "联系我们" },
  "contact.heroDesc": {
    en: "Ready to start your renovation project? Get in touch with FLASH CAST — we serve Kuala Lumpur, Selangor, and surrounding areas.",
    zh: "准备好开始您的装修项目了吗？联系 FLASH CAST — 我们服务吉隆坡、雪兰莪及周边地区。",
  },
  "contact.getInTouch": { en: "Get In Touch", zh: "联系方式" },
  "contact.sendMessage": { en: "Send Us a Message", zh: "给我们留言" },
  "contact.messageSent": { en: "Message Sent!", zh: "消息已发送！" },
  "contact.thankYou": { en: "Thank you", zh: "感谢您" },
  "contact.replyPromise": { en: "We'll get back to you within 24 hours.", zh: "我们将在24小时内回复您。" },
  "contact.address": { en: "Address", zh: "地址" },
  "contact.phone": { en: "Phone / WhatsApp", zh: "电话 / WhatsApp" },
  "contact.email": { en: "Email", zh: "邮箱" },
  "contact.hours": { en: "Business Hours", zh: "营业时间" },
  "contact.hoursText": { en: "Mon – Sat: 9:00 AM – 6:00 PM\nSun: By Appointment", zh: "周一至周六：上午9:00 – 下午6:00\n周日：预约制" },
  "contact.ourServices": { en: "Our Services", zh: "我们的服务" },
  "contact.visitOffice": { en: "Visit Our Office", zh: "参观办公室" },
  "contact.visitOffice.desc": { en: "Located in Taman United, Kuala Lumpur — serving KL, Selangor, and the Klang Valley", zh: "位于吉隆坡 Taman United — 服务吉隆坡、雪兰莪和巴生谷地区" },
  "contact.noSpam": { en: "We'll respond within 24 hours. No spam.", zh: "我们将在24小时内回复。不会发送垃圾信息。" },

  // ============ FORM FIELDS ============
  "form.name": { en: "Name", zh: "姓名" },
  "form.name.placeholder": { en: "Your full name", zh: "您的全名" },
  "form.phone": { en: "Phone / WhatsApp", zh: "电话 / WhatsApp" },
  "form.phone.placeholder": { en: "+60 12-345 6789", zh: "+60 12-345 6789" },
  "form.email": { en: "Email", zh: "邮箱" },
  "form.email.placeholder": { en: "your@email.com", zh: "your@email.com" },
  "form.email.optional": { en: "(optional)", zh: "（选填）" },
  "form.projectType": { en: "Project Type", zh: "项目类型" },
  "form.projectType.placeholder": { en: "Select type...", zh: "选择类型..." },
  "form.projectType.condo": { en: "Condo Renovation", zh: "公寓装修" },
  "form.projectType.landed": { en: "Landed House Renovation", zh: "排屋装修" },
  "form.projectType.kitchen": { en: "Kitchen Renovation", zh: "厨房装修" },
  "form.projectType.bathroom": { en: "Bathroom Renovation", zh: "浴室装修" },
  "form.projectType.office": { en: "Office Renovation", zh: "办公室装修" },
  "form.projectType.shoplot": { en: "Shoplot / Commercial", zh: "店铺 / 商业装修" },
  "form.projectType.builtin": { en: "Custom Built-In Furniture", zh: "定制内嵌家具" },
  "form.projectType.oldHouse": { en: "Old House Renovation", zh: "老房翻新" },
  "form.projectType.other": { en: "Other", zh: "其他" },
  "form.location": { en: "Location", zh: "地点" },
  "form.location.placeholder": { en: "Select area...", zh: "选择区域..." },
  "form.location.klCity": { en: "KL City Centre", zh: "吉隆坡市中心" },
  "form.location.montKiara": { en: "Mont Kiara / Sri Hartamas", zh: "满家乐 / Sri Hartamas" },
  "form.location.bangsar": { en: "Bangsar / Mid Valley", zh: "孟沙 / Mid Valley" },
  "form.location.cheras": { en: "Cheras", zh: "蕉赖" },
  "form.location.kepong": { en: "Kepong / Sentul", zh: "甲洞 / Sentul" },
  "form.location.pj": { en: "Petaling Jaya", zh: "八打灵再也" },
  "form.location.subang": { en: "Subang Jaya", zh: "梳邦再也" },
  "form.location.shahAlam": { en: "Shah Alam / Setia Alam", zh: "莎阿南 / Setia Alam" },
  "form.location.puchong": { en: "Puchong", zh: "蒲种" },
  "form.location.other": { en: "Other", zh: "其他" },
  "form.message": { en: "Message", zh: "留言" },
  "form.message.placeholder": {
    en: "Tell us about your project — property type, approximate size, timeline, budget range, and any specific requirements...",
    zh: "告诉我们您的项目 — 物业类型、大概面积、时间要求、预算范围及任何具体需求...",
  },
  "form.required": { en: "Required", zh: "必填" },
  "form.error.name": { en: "Please enter your name", zh: "请输入您的姓名" },
  "form.error.phone": { en: "Please enter your phone number", zh: "请输入您的电话号码" },
  "form.error.phoneInvalid": { en: "Please enter a valid phone number", zh: "请输入有效的电话号码" },
  "form.error.emailInvalid": { en: "Please enter a valid email", zh: "请输入有效的邮箱地址" },
  "form.error.message": { en: "Please enter your message", zh: "请输入您的留言" },
  "form.error.messageShort": { en: "Please provide more details (at least 10 characters)", zh: "请提供更多详情（至少10个字符）" },

  // ============ SERVICES PAGE ============
  "servicesPage.label": { en: "What We Do", zh: "我们的业务" },
  "servicesPage.heroTitle": { en: "Our Services", zh: "服务项目" },
  "servicesPage.heroDesc": {
    en: "Comprehensive renovation services across Kuala Lumpur and Selangor — from interior design and custom built-in to commercial fit-out, artistic wall coating, and warehouse systems.",
    zh: "覆盖吉隆坡和雪兰莪州的全面装修服务 — 从室内设计、定制家具到商业装修、艺术涂料和仓储系统。",
  },
  "servicesPage.suitableFor": { en: "Suitable For:", zh: "适合人群：" },
  "servicesPage.notSure": { en: "Not Sure What You Need?", zh: "不确定需要什么服务？" },
  "servicesPage.notSure.desc": { en: "Contact us for a free consultation. We'll assess your space and recommend the right approach.", zh: "联系我们获取免费咨询。我们会评估您的空间并推荐合适的方案。" },

  // ============ PROCESS PAGE ============
  "processPage.label": { en: "How We Work", zh: "工作方式" },
  "processPage.heroTitle": { en: "Our Renovation Process", zh: "我们的施工流程" },
  "processPage.heroDesc": {
    en: "A clear, structured approach from first consultation to final handover. Transparent pricing, regular updates, and professional project management at every step.",
    zh: "从首次咨询到最终交付的清晰结构化方法。透明报价、定期更新和每一步的专业项目管理。",
  },
  "processPage.stepsTitle": { en: "6 Steps to Your Dream Space", zh: "6步打造您的理想空间" },
  "processPage.stepsDesc": {
    en: "Every project follows the same proven process — designed for transparency, efficiency, and client satisfaction.",
    zh: "每个项目都遵循相同的成熟流程 — 旨在确保透明、高效和客户满意。",
  },
  "processPage.readyTitle": { en: "Ready to Start?", zh: "准备好开始了吗？" },
  "processPage.readyDesc": { en: "Get in touch today — the first step is a simple conversation.", zh: "今天就联系我们 — 第一步只是一次简单的沟通。" },

  // ============ FAQ PAGE ============
  "faqPage.label": { en: "Help Center", zh: "帮助中心" },
  "faqPage.heroTitle": { en: "Frequently Asked Questions", zh: "常见问题" },
  "faqPage.heroDesc": {
    en: "Common questions about our renovation services, process, pricing, and materials.",
    zh: "关于我们的装修服务、流程、报价和材料的常见问题。",
  },
  "faqPage.stillQuestions": { en: "Still Have Questions?", zh: "还有疑问？" },
  "faqPage.stillQuestions.desc": { en: "Reach out to us directly — we're happy to help.", zh: "直接联系我们 — 我们很乐意帮忙。" },

  // ============ PROJECTS PAGE ============
  "projectsPage.title": { en: "Our Projects", zh: "项目案例" },
  "projectsPage.subtitle": {
    en: "Browse our completed renovation projects across Kuala Lumpur and Selangor.",
    zh: "浏览我们在吉隆坡和雪兰莪州完成的装修项目。",
  },

  // ============ FOOTER ============
  "footer.cta.title": { en: "Ready to Transform Your Space?", zh: "准备好改变您的空间了吗？" },
  "footer.cta.desc": { en: "Get a free consultation and quote for your dream renovation.", zh: "获取免费咨询和梦想装修的报价。" },
  "footer.brand.desc": {
    en: "Professional renovation & interior design company in Kuala Lumpur, Malaysia. Specializing in residential renovation, custom built-in furniture, commercial fit-out, and artistic wall coating (German Remmers).",
    zh: "马来西亚吉隆坡专业装修和室内设计公司。专注于住宅装修、定制内嵌家具、商业装修和艺术墙面涂料（德国 Remmers）。",
  },
  "footer.brand.registration": { en: "SSM Registered · In-House Design & Build Team", zh: "SSM 注册 · 自有设计施工团队" },
  "footer.services": { en: "Services", zh: "服务" },
  "footer.company": { en: "Company", zh: "公司" },
  "footer.serviceAreas": { en: "Service Areas", zh: "服务区域" },
  "footer.rights": { en: "All rights reserved.", zh: "版权所有。" },
  "footer.privacy": { en: "Privacy", zh: "隐私政策" },
  "footer.terms": { en: "Terms", zh: "服务条款" },

  // ============ BEFORE/AFTER ============
  "beforeAfter.title": { en: "Before & After", zh: "装修前后对比" },
  "beforeAfter.subtitle": {
    en: "See the transformation — real renovation projects by FLASH CAST.",
    zh: "看看变化 — FLASH CAST 真实装修项目。",
  },
  "beforeAfter.before": { en: "Before", zh: "装修前" },
  "beforeAfter.after": { en: "After", zh: "装修后" },

  // ============ BRAND LOGOS ============
  "brands.title": { en: "Trusted Partners & Materials", zh: "合作伙伴与材料品牌" },
  "brands.subtitle": {
    en: "We work with established brands to deliver quality renovation results.",
    zh: "我们与知名品牌合作，确保高品质的装修成果。",
  },
};
