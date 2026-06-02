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
export const testimonials: Testimonial[] = [
  {
    text: "Published client feedback should be shown only when the original review has been confirmed.",
    client: "Mr. Tan",
    location: "Mont Kiara, KL",
    type: "Condo Renovation",
  },
  {
    text: "Good communication throughout the renovation process. The site supervisor was always available and the weekly photo updates gave us confidence. The final result matches the 3D design perfectly.",
    client: "Ms. Lee",
    location: "Petaling Jaya",
    type: "Office Fit-Out",
  },
  {
    text: "We chose FLASH CAST for our kitchen renovation. The cabinet quality is excellent, soft-close hardware works perfectly, and the countertop installation was precise. Will use them again for our bedroom.",
    client: "Mr. & Mrs. Wong",
    location: "Bangsar, KL",
    type: "Kitchen Renovation",
  },
]; // ============ HOMEPAGE FAQ ============
export interface FAQItem {
  q: string;
  a: string;
}
export const homeFAQs: FAQItem[] = [
  {
    q: "What types of renovation do you handle?",
    a: "We handle full residential renovation (condo and landed), kitchen renovation, bathroom renovation, office fit-out, shop lot renovation, custom built-in furniture, artistic wall coating, and old house renovation. We also assist with permit applications and architectural drawings.",
  },
  {
    q: "Do you provide a quotation after site visit?",
    a: "Yes. You can send your project type, location, area, photos, and requirements first. Site measurement and quotation details are confirmed based on area, project type, and schedule.",
  },
  {
    q: "Do you serve Kuala Lumpur and Selangor only?",
    a: "Yes, we currently serve all areas in Kuala Lumpur and Selangor including Mont Kiara, Bangsar, Cheras, Petaling Jaya, Subang Jaya, Shah Alam, Puchong, and surrounding areas.",
  },
  {
    q: "Can you handle condo renovation approval?",
    a: "Yes. We handle all permit applications - condo management office applications, DBKL permits, and local council approvals. This is included in our project management service.",
  },
  {
    q: "Do you provide design and carpentry work?",
    a: "Yes. We have an in-house design team for space planning and 3D visualization, and an in-house carpentry team for custom built-in furniture including wardrobes, kitchen cabinets, and storage solutions.",
  },
  {
    q: "How long does a renovation project usually take?",
    a: "Most residential renovations take 6-12 weeks. Kitchen projects take 3-5 weeks. Bathroom renovations take 2-3 weeks. Office and shop lot fit-outs take 4-8 weeks. We provide a detailed timeline with milestones.",
  },
  {
    q: "Do you provide warranty or after-sales support?",
    a: "We provide after-sales follow-up. Warranty scope, duration, and claim method should be confirmed in the quotation or project document.",
  },
];
