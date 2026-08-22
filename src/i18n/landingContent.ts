type LandingCopy = {
  title: string;
  subtitle: string;
  heroAlt?: string;
  description: string;
  benefits: string[];
  relatedProjects: Array<{ title: string; location: string }>;
  faqs: Array<{ q: string; a: string }>;
  seoTitle?: string;
  seoDescription?: string;
};

type LocalizedLandingCopy = {
  en: LandingCopy;
  zh: LandingCopy;
};

export const landingContent: Record<string, LocalizedLandingCopy> = {
  "office-renovation": {
    en: {
      title: "Office Renovation in Kuala Lumpur",
      subtitle: "Workspace planning, fit-out coordination and renovation delivery",
      heroAlt: "Office renovation and workspace planning in Kuala Lumpur",
      description:
        "Office renovation should begin with team size, work patterns, visitor flow, meeting needs and future growth. FLASH CAST plans the layout, partitions, lighting, power, data points, storage and construction sequence for offices across Kuala Lumpur, Selangor and Klang Valley.",
      benefits: [
        "Team capacity and workflow planning",
        "Reception, meeting room and work area layout",
        "Partition, ceiling, lighting and flooring coordination",
        "Power, data and equipment point planning",
        "Building-management requirement coordination",
        "Phased construction and handover checks",
      ],
      relatedProjects: [
        { title: "Office Space Planning Reference", location: "Kuala Lumpur" },
        { title: "Office Refurbishment Reference", location: "Selangor" },
      ],
      faqs: [
        {
          q: "Can renovation continue while the team is working?",
          a: "It may be possible to phase the works by zone or schedule noisier tasks outside working hours, subject to the confirmed scope and building rules.",
        },
        {
          q: "What should we prepare before planning an office renovation?",
          a: "Prepare the floor plan or approximate area, team size, meeting and reception needs, current site photos, target move-in date, and any landlord or building-management requirements.",
        },
        {
          q: "Can you help coordinate building-management requirements?",
          a: "Where included in the confirmed scope, we can help organise the required drawings, work schedules, contractor information and submission documents. Final approval remains with the relevant management or authority.",
        },
      ],
      seoTitle: "Office Renovation Kuala Lumpur | Workspace Planning | FLASH CAST",
      seoDescription:
        "Plan office renovation in Kuala Lumpur, Selangor and Klang Valley, including layout, reception, meeting rooms, partitions, lighting, power, data points and construction coordination.",
    },
    zh: {
      title: "吉隆坡办公室装修与空间规划",
      subtitle: "从工位、会议室和接待区，到弱电、照明与施工协调",
      heroAlt: "吉隆坡办公室装修与办公空间规划",
      description:
        "办公室装修要先梳理团队人数、协作方式、访客动线、会议需求和未来扩充，再确定隔间、工作位、照明、电源、网络与收纳。FLASH CAST 服务吉隆坡、雪兰莪与巴生谷，根据现场条件整理施工范围、材料方向和分项报价。",
      benefits: [
        "团队人数与办公动线规划",
        "前台、会议室与工作区布局",
        "隔间、天花、照明与地面协调",
        "电源、网络与设备点位规划",
        "大楼管理要求与施工时段协调",
        "分阶段施工与交付检查",
      ],
      relatedProjects: [
        { title: "办公空间布局规划参考", location: "吉隆坡" },
        { title: "办公空间改造与协作区参考", location: "雪兰莪" },
      ],
      faqs: [
        {
          q: "可以一边办公一边装修吗？",
          a: "可根据确认范围分区施工，并把噪音较大的工序安排在非办公时段；实际安排仍要配合大楼规定、现场安全和项目工序。",
        },
        {
          q: "规划办公室装修前要准备什么？",
          a: "建议准备平面图或大约面积、团队人数、会议与接待需求、现场照片、计划使用时间，以及业主或大楼管理处的施工要求。",
        },
        {
          q: "可以协助处理大楼管理处要求吗？",
          a: "如确认范围包含相关工作，我们可协助整理图纸、施工时间表、承包商资料和申请文件；最终批准仍以管理处或相关主管单位为准。",
        },
      ],
      seoTitle: "吉隆坡办公室装修与空间规划 | FLASH CAST",
      seoDescription:
        "FLASH CAST 提供吉隆坡、雪兰莪与巴生谷办公室装修规划，涵盖前台、会议室、工作区、隔间、照明、电源、网络点位和施工协调。",
    },
  },
};
