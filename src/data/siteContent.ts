/** * Site-wide content data - about page and default CMS seed content. */ import { LucideIcon } from "lucide-react";
import {
  Clock,
  Award,
  Eye,
  Heart,
  Hammer,
  Users,
  Target,
  Star,
} from "lucide-react"; // ============ ABOUT PAGE ============
export interface MilestoneItem {
  year: string;
  title: string;
  desc: string;
}
export const companyMilestones: MilestoneItem[] = [
  {
    year: "2015",
    title: "Company Founded",
    desc: "FLASH CAST SDN. BHD. established in Kuala Lumpur, starting with residential renovation projects.",
  },
  {
    year: "2017",
    title: "Commercial Expansion",
    desc: "Expanded into commercial fit-out and office renovation, serving corporate clients across KL.",
  },
  {
    year: "2019",
    title: "Artistic Wall Coating Service",
    desc: "Expanded artistic wall coating options for selected feature wall projects.",
  },
  {
    year: "2021",
    title: "Industrial Division",
    desc: "Launched warehouse shelving and industrial racking division to serve manufacturing and logistics sectors.",
  },
  {
    year: "2023",
    title: "Broader Project Coverage",
    desc: "Expanded renovation references across residential, commercial, and selected industrial spaces.",
  },
  {
    year: "2025",
    title: "Regional Growth",
    desc: "Expanded service coverage to all major areas across Kuala Lumpur and Selangor.",
  },
];
export interface CoreValueItem {
  icon: LucideIcon;
  title: string;
  desc: string;
}
export const coreValues: CoreValueItem[] = [
  {
    icon: Award,
    title: "Quality Craftsmanship",
    desc: "Every project is executed with precision and attention to detail. We use premium materials and proven construction methods.",
  },
  {
    icon: Eye,
    title: "Transparency",
    desc: "Clear quotations, itemized pricing, regular progress updates, and direct communication throughout the project.",
  },
  {
    icon: Clock,
    title: "On-Time Delivery",
    desc: "We respect your timeline. Our project management system ensures milestones are met and your renovation is completed as scheduled.",
  },
  {
    icon: Heart,
    title: "Client-First Approach",
    desc: "Your vision drives our work. We listen carefully, provide professional advice, and adapt our solutions to your needs and budget.",
  },
];
export interface TeamHighlightItem {
  icon: LucideIcon;
  title: string;
  desc: string;
}
export const teamHighlights: TeamHighlightItem[] = [
  {
    icon: Hammer,
    title: "Skilled Carpenters",
    desc: "In-house carpentry team specializing in custom built-in furniture, cabinetry, and millwork.",
  },
  {
    icon: Users,
    title: "Design Consultants",
    desc: "Experienced interior designers who translate your ideas into practical, beautiful living spaces.",
  },
  {
    icon: Target,
    title: "Project Managers",
    desc: "Dedicated coordinators who oversee every phase - from permits and procurement to quality checks.",
  },
  {
    icon: Star,
    title: "Specialist Applicators",
    desc: "Wall coating applicators familiar with selected decorative finishing methods.",
  },
];
export const companyStats = [
  { value: "Scope", label: "Clear Project Planning" },
  { value: "KL & Selangor", label: "Local Service Areas" },
  { value: "Homes", label: "Residential Projects" },
  { value: "Business", label: "Commercial Projects" },
]; // ============ TESTIMONIALS ============
export interface Testimonial {
  text: string;
  client: string;
  location: string;
  type: string;
}
export const testimonials: Testimonial[] = []; // ============ HOMEPAGE FAQ ============
export interface FAQItem {
  q: string;
  a: string;
  qZh?: string;
  aZh?: string;
}
export const homeFAQs: FAQItem[] = [
  {
    q: "What types of renovation do you handle?",
    a: "FLASH CAST plans and coordinates residential and commercial renovation, including kitchens, bathrooms, offices, shops, old-house upgrades, custom built-ins, selected finishes, and related installation work. The final scope is confirmed after reviewing your site and requirements.",
    qZh: "FLASH CAST 提供哪些装修服务？",
    aZh: "FLASH CAST 提供住宅与商业空间装修规划及施工协调，包括厨房、浴室、办公室、店铺、旧屋翻新、定制柜、部分饰面与相关安装工程。最终范围会在了解现场与需求后确认。",
  },
  {
    q: "How do I request a renovation quote?",
    a: "Share the location, space type, approximate area, site photos, current issues, and the work you are considering. We can then clarify the scope, arrange a site review where needed, and prepare a written proposal or quotation for the confirmed items.",
    qZh: "如何申请装修报价？",
    aZh: "请提供地点、空间类型、大约面积、现场照片、现有问题和计划进行的项目。我们会先梳理需求，必要时安排现场评估，再按确认范围准备书面方案或报价。",
  },
  {
    q: "Which areas does FLASH CAST serve?",
    a: "FLASH CAST mainly serves Kuala Lumpur, Selangor, and the Klang Valley. Send us the exact project location so we can confirm availability for your area and project type.",
    qZh: "FLASH CAST 服务哪些地区？",
    aZh: "FLASH CAST 主要服务吉隆坡、雪兰莪与巴生谷。请提供具体项目地点，我们会根据地区与项目类型确认是否可以安排。",
  },
  {
    q: "What should I prepare before the consultation?",
    a: "Useful information includes the property or business type, floor area, photos or floor plans, preferred style, must-have work, target use, and any management-office, landlord, or mall renovation rules.",
    qZh: "装修咨询前要准备什么资料？",
    aZh: "建议准备房屋或商业空间类型、面积、现场照片或平面图、喜欢的风格、必须完成的项目、空间用途，以及管理处、业主或商场的装修规定。",
  },
  {
    q: "Can you help coordinate condominium or commercial renovation requirements?",
    a: "Where included in the confirmed scope, we can help coordinate the documents and work requirements requested by the management office, landlord, or mall. Final approval remains subject to the relevant management or authority.",
    qZh: "可以协助处理公寓或商业空间的装修要求吗？",
    aZh: "如确认范围包含相关工作，我们可协助整理和协调管理处、业主或商场要求的文件与施工条件；最终批准仍以相关管理单位或主管机构为准。",
  },
  {
    q: "How are renovation cost and timeline determined?",
    a: "They depend on the site condition, floor area, demolition, wet works, wiring, plumbing, carpentry, materials, lead times, and approval requirements. A reliable cost and schedule can only be prepared after the scope is confirmed.",
    qZh: "装修费用和工期如何确定？",
    aZh: "费用和工期会受现场状况、面积、拆除、泥水、水电、木作、材料、供货时间与审批要求影响。确认项目范围后，才能提供较可靠的报价与进度安排。",
  },
  {
    q: "Is after-sales support or warranty included?",
    a: "After-sales follow-up is handled according to the confirmed project scope. Any workmanship coverage, supplier warranty, exclusions, and duration should be stated in the quotation or project documents for your review.",
    qZh: "是否提供售后跟进或保修？",
    aZh: "售后会按已确认的项目范围跟进。施工保障、供应商保修、适用范围、例外情况与期限，应以报价单或项目文件中的书面说明为准。",
  },
];
