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
    a: "FLASH CAST publicly lists residential renovation, interior design, kitchen renovation, bathroom renovation, office renovation, shop renovation, custom built-in furniture, artistic wall coating, old-house renovation, approval coordination, and warehouse shelving related space planning.",
    qZh: "FLASH CAST 主要做哪些装修服务？",
    aZh: "FLASH CAST 的公开服务包括住宅装修、室内设计、厨房装修、浴室装修、办公室装修、店铺装修、定制家具、艺术涂料、旧屋翻新、装修申请协调和仓库货架相关空间规划。",
  },
  {
    q: "What should I prepare before requesting a renovation consultation?",
    a: "Prepare the location, property or commercial space type, site photos, current issues, intended scope, design references, and any management-office, landlord, or mall work restrictions.",
    qZh: "装修咨询前需要准备什么？",
    aZh: "建议准备地点、房屋或商业空间类型、现场照片、现有问题、预计装修范围、喜欢的风格参考，以及是否有管理处、业主或商场施工限制。",
  },
  {
    q: "Which areas does FLASH CAST serve?",
    a: "Based on current business data, FLASH CAST mainly serves Kuala Lumpur, Selangor, and the Klang Valley. If your exact area or project type is uncertain, submit the request for confirmation first.",
    qZh: "FLASH CAST 服务哪些地区？",
    aZh: "根据当前业务资料，FLASH CAST 主要服务 Kuala Lumpur、Selangor 与 Klang Valley。若具体地区或项目类型不确定，建议先提交需求确认。",
  },
  {
    q: "Should the homepage show fixed renovation prices or timelines?",
    a: "Not unless confirmed by the owner. Cost and schedule depend on area size, materials, demolition, carpentry, wiring, plumbing, waterproofing, approvals, and site condition.",
    qZh: "首页可以写固定装修价格或工期吗？",
    aZh: "不建议。价格和时间会受面积、材料、拆除、木作、水电、防水、管理处申请和现场条件影响，正式页面应避免未经确认的固定价格和固定工期。",
  },
  {
    q: "Can the homepage show rendering concepts or design ideas?",
    a: "Yes, but they must be clearly labeled as design concepts, rendering concepts, or planning examples, not as completed project proof, customer reviews, or before-after evidence.",
    qZh: "可以在首页展示效果图或设计方案吗？",
    aZh: "可以，但必须清楚标注为设计方案、效果图方案、概念设计或规划示例，不能写成真实完工案例、客户评价或 before/after 证明。",
  },
];
