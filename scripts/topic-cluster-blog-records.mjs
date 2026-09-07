const topicClusterBlogUpdates = {
  "malaysia-renovation-budget-guide": {
    enMarker: 'href="/en/services/renovation"',
    zhMarker: 'href="/zh/services/renovation"',
    enBlock: '<h2>What changes the renovation budget and programme?</h2><p>Floor area alone is not enough. Property type and condition, demolition and protection, electrical and plumbing work, waterproofing, wet works, carpentry, material grade and lead time, management or landlord requirements, site access and permitted working hours all affect the confirmed scope.</p><p>Before requesting a quotation, prepare the project location, property type, approximate floor area, layout or site photos, current problems, required work, budget direction and intended use or move-in timing.</p><p>If several rooms or trades need to be coordinated, review our <a href="/en/services/renovation">residential renovation planning in Kuala Lumpur and Selangor</a> to understand how site information, scope and quotation preparation connect.</p>',
    zhBlock: '<h2>哪些因素会影响装修预算和工期？</h2><p>只看面积不足以可靠判断。房屋类型与现况、拆除与保护、水电、防水、泥水、木作、材料等级与供货时间、管理处或业主要求、现场出入和允许施工时段，都会影响最终确认范围。</p><p>询价前建议准备项目地点、房屋类型、大约面积、平面图或现场照片、现有问题、必须完成的项目、预算方向和希望使用或入住的时间。</p><p>如果多个空间或工种需要一起协调，可先查看我们的<a href="/zh/services/renovation">吉隆坡与雪兰莪住宅装修规划</a>，了解现场资料、工程范围和报价准备如何衔接。</p>',
    publicPaths: [
      { path: "/en/blog/malaysia-renovation-budget-guide", expected: "Malaysia Renovation Budget Guide" },
      { path: "/zh/blog/malaysia-renovation-budget-guide", expected: "马来西亚装修预算怎么安排" },
    ],
  },
  "kitchen-renovation-quotation-checklist-malaysia": {
    enMarker: 'href="/en/services/kitchen"',
    zhMarker: 'href="/zh/services/kitchen"',
    enBlock: '<p>If the quotation needs to coordinate demolition, cabinets, countertops, appliances, finishes and service connections as one scope, review our <a href="/en/services/kitchen">kitchen renovation service in Kuala Lumpur and Selangor</a> before comparing line items.</p>',
    zhBlock: '<p>如果报价需要把拆除、柜体、台面、电器、饰面和水电接口作为同一范围协调，可先查看我们的<a href="/zh/services/kitchen">吉隆坡与雪兰莪厨房装修服务</a>，再比较各项报价。</p>',
    publicPaths: [
      { path: "/en/blog/kitchen-renovation-quotation-checklist-malaysia", expected: "Kitchen Renovation Quotation Checklist for Malaysia" },
      { path: "/zh/blog/kitchen-renovation-quotation-checklist-malaysia", expected: "马来西亚厨房装修报价检查清单" },
    ],
  },
  "bathroom-waterproofing-drainage-planning-malaysia": {
    enMarker: 'href="/en/services/bathroom"',
    zhMarker: 'href="/zh/services/bathroom"',
    enBlock: '<p>If waterproofing, drainage, sanitary fittings and finishes need to be coordinated as one project, review our <a href="/en/services/bathroom">bathroom renovation service in Kuala Lumpur and Selangor</a> before confirming the quotation scope.</p>',
    zhBlock: '<p>如果防水、排水、洁具和饰面需要作为同一项目协调，可先查看我们的<a href="/zh/services/bathroom">吉隆坡与雪兰莪浴室装修服务</a>，再确认报价范围。</p>',
    publicPaths: [
      { path: "/en/blog/bathroom-waterproofing-drainage-planning-malaysia", expected: "Bathroom Waterproofing and Drainage Planning in Malaysia" },
      { path: "/zh/blog/bathroom-waterproofing-drainage-planning-malaysia", expected: "马来西亚浴室防水与排水规划指南" },
    ],
  },
  "office-fit-out-me-it-planning-checklist-malaysia": {
    enMarker: 'href="/en/services/office-renovation"',
    zhMarker: 'href="/zh/services/office-renovation"',
    enBlock: '<p>For a coordinated office scope covering layout, partitions, workstations, lighting, finishes and M&amp;E interfaces, review our <a href="/en/services/office-renovation">office renovation and fit-out service in Kuala Lumpur and Selangor</a>.</p>',
    zhBlock: '<p>如需统一协调办公室布局、隔间、工位、灯光、饰面和机电接口，可查看我们的<a href="/zh/services/office-renovation">吉隆坡与雪兰莪办公室装修和 fit-out 服务</a>。</p>',
    publicPaths: [
      { path: "/en/blog/office-fit-out-me-it-planning-checklist-malaysia", expected: "Office Fit-Out M&amp;E and IT Planning Checklist for Malaysia" },
      { path: "/zh/blog/office-fit-out-me-it-planning-checklist-malaysia", expected: "马来西亚办公室装修 M&amp;E 与 IT 规划清单" },
    ],
  },
  "restaurant-fit-out-planning-checklist-malaysia": {
    enMarker: 'href="/en/services/shop-renovation"',
    zhMarker: 'href="/zh/services/shop-renovation"',
    enBlock: '<p>For a restaurant or retail scope that must coordinate customer flow, equipment, services, finishes and opening preparation, review our <a href="/en/services/shop-renovation">shop renovation and retail fit-out service in Kuala Lumpur and Selangor</a>.</p>',
    zhBlock: '<p>如果餐厅或零售项目需要统一协调顾客动线、设备、机电、饰面和开业准备，可查看我们的<a href="/zh/services/shop-renovation">吉隆坡与雪兰莪店铺装修和零售 fit-out 服务</a>。</p>',
    publicPaths: [
      { path: "/en/blog/restaurant-fit-out-planning-checklist-malaysia", expected: "Restaurant Fit-Out Planning Checklist for Malaysia" },
      { path: "/zh/blog/restaurant-fit-out-planning-checklist-malaysia", expected: "马来西亚餐厅装修开工前规划清单" },
    ],
  },
};

const insertBeforeFirstHeadingOnce = (content, marker, block) => {
  const html = String(content || "");
  if (html.includes(marker)) return html;

  const firstHeading = html.indexOf("<h2>");
  if (firstHeading < 0) {
    throw new Error(`Blog content is missing the first <h2> required for contextual insertion: ${marker}`);
  }

  return `${html.slice(0, firstHeading)}${block}${html.slice(firstHeading)}`;
};

export const topicClusterBlogConfigs = Object.freeze(topicClusterBlogUpdates);

export const buildTopicClusterBlogRecord = (current) => {
  const slug = String(current?.slug || "");
  const update = topicClusterBlogUpdates[slug];
  if (!update) throw new Error(`Unsupported topic-cluster blog slug: ${slug || "(missing)"}`);

  return {
    ...current,
    content_en: insertBeforeFirstHeadingOnce(current.content_en, update.enMarker, update.enBlock),
    content_zh: insertBeforeFirstHeadingOnce(current.content_zh, update.zhMarker, update.zhBlock),
    status: "published",
  };
};
