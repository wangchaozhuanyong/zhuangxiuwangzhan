/**
 * Site-wide content data — homepage sections, about page, process steps, etc.
 * All content is centralized here for easy updates without touching components.
 */

import { LucideIcon } from "lucide-react";
import {
  Paintbrush, Wrench, Layers, Clock, MessageCircle, ShieldCheck,
  Award, Eye, Heart, Hammer, Users, Target, Star, CheckCircle, MapPin,
  ClipboardList, Ruler, FileText, Handshake,
  Home, Building2, PaintBucket, Palette, FileCheck, UtensilsCrossed, Bath, Briefcase, Store,
} from "lucide-react";

// ============ SECTION HEADERS ============
export const sectionHeaders = {
  services: {
    title: "Our Renovation Services",
    subtitle: "From residential interiors to commercial fit-outs — professional renovation solutions for every space in Kuala Lumpur and Selangor.",
  },
  whyChooseUs: {
    title: "Why Choose FLASH CAST",
    subtitle: "We focus on practical renovation planning, reliable execution, and quality finishing. Here's what sets us apart.",
  },
};

// ============ HOMEPAGE SERVICES SECTION ============
export interface HomepageService {
  icon: LucideIcon;
  title: string;
  desc: string;
  link: string;
}

export const homepageServices: HomepageService[] = [
  {
    icon: Home,
    title: "Full Renovation",
    desc: "Complete renovation for condos and landed properties, including hacking, tiling, electrical, carpentry, painting, and finishing works.",
    link: "/services/renovation",
  },
  {
    icon: Paintbrush,
    title: "Interior Design",
    desc: "We design spaces that are functional, modern, and tailored to your lifestyle — with 3D visualization before any work begins.",
    link: "/services/design",
  },
  {
    icon: Ruler,
    title: "Custom Built-In Furniture",
    desc: "Made-to-measure cabinets, wardrobes, TV consoles, shoe cabinets, vanities, and storage solutions built for durability.",
    link: "/services/builtin",
  },
  {
    icon: UtensilsCrossed,
    title: "Kitchen Renovation",
    desc: "Complete kitchen renovation including cabinet replacement, countertop upgrade, tiling, plumbing, and appliance integration.",
    link: "/services/kitchen",
  },
  {
    icon: Bath,
    title: "Bathroom Renovation",
    desc: "Full bathroom renovation with proper waterproofing, modern tiling, vanity installation, and shower system upgrade.",
    link: "/services/bathroom",
  },
  {
    icon: Briefcase,
    title: "Office Renovation",
    desc: "Practical office layout planning, partition works, furniture installation, data cabling, and professional finishing.",
    link: "/services/office",
  },
  {
    icon: Store,
    title: "Shoplot Renovation",
    desc: "Complete shop lot fit-out for retail, F&B, clinic, and service businesses — from shopfront design to interior and signage.",
    link: "/services/shoplot",
  },
  {
    icon: Palette,
    title: "Artistic Wall Coating",
    desc: "Authorized German Remmers applicator. Premium textured wall finishes for feature walls and luxury interiors.",
    link: "/services/artistic-coating",
  },
  {
    icon: Wrench,
    title: "Old House Renovation",
    desc: "Comprehensive renovation for aging terrace houses and bungalows — structural repair, rewiring, replumbing, and full makeover.",
    link: "/services/old-house",
  },
  {
    icon: FileCheck,
    title: "Permit & Drawing Support",
    desc: "Renovation permit applications, management office coordination, architectural drawings, and documentation services.",
    link: "/services/approval",
  },
];

// ============ WHY CHOOSE US ============
export interface WhyChooseItem {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export const whyChooseUsReasons: WhyChooseItem[] = [
  {
    icon: Paintbrush,
    title: "In-House Design & Coordination",
    desc: "Our design team creates 3D visualizations and construction drawings. A dedicated project manager coordinates every trade so you only deal with one team.",
  },
  {
    icon: MessageCircle,
    title: "Clear Quotation Breakdown",
    desc: "Every quotation is itemized with clear pricing — no lump sums, no hidden costs. You know exactly what you're paying for before any work begins.",
  },
  {
    icon: Layers,
    title: "Material Selection Support",
    desc: "We source materials from trusted suppliers and help you compare options. Visit our showroom to see and touch samples before committing.",
  },
  {
    icon: Target,
    title: "Regular Site Supervision",
    desc: "Our project managers conduct regular site inspections and provide weekly photo updates so you always know the progress of your renovation.",
  },
  {
    icon: Wrench,
    title: "Quality Workmanship",
    desc: "We focus on practical renovation planning, reliable execution, and quality finishing. Every project is built to last, not just to look good.",
  },
  {
    icon: ShieldCheck,
    title: "SSM Registered & Warranty",
    desc: "FLASH CAST SDN. BHD. is a fully SSM-registered company. All renovation works come with workmanship warranty for your peace of mind.",
  },
];

// ============ TRUST STATS ============
export interface TrustStat {
  icon: LucideIcon;
  value: string;
  label: string;
  desc: string;
  iconClass: string;
}

export const trustStats: TrustStat[] = [
  { icon: Star, value: "200+", label: "Completed Projects", desc: "Across Kuala Lumpur and Selangor — residential, commercial, and industrial", iconClass: "text-gold" },
  { icon: Clock, value: "10+", label: "Years Experience", desc: "A decade of renovation experience in the Malaysian market", iconClass: "text-gold" },
  { icon: Users, value: "Trusted", label: "By Homeowners & Businesses", desc: "Repeat clients and referrals are our strongest endorsement", iconClass: "text-gold" },
  { icon: ShieldCheck, value: "SSM", label: "Registered Company", desc: "Fully registered with workmanship warranty on all projects", iconClass: "text-gold" },
];

// ============ PROCESS STEPS ============
export interface ProcessStep {
  num: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  details: string[];
}

export const processSteps: ProcessStep[] = [
  {
    num: "01",
    icon: ClipboardList,
    title: "Consultation",
    desc: "We understand your goals, space, style, and budget. Tell us about your project via WhatsApp, phone, or our website.",
    details: ["Submit enquiry via website, WhatsApp, or phone", "Discuss requirements, timeline, and budget", "We provide initial advice and recommendations"],
  },
  {
    num: "02",
    icon: Ruler,
    title: "Site Measurement",
    desc: "We inspect the site and take precise measurements. Free for all enquiries in KL and Selangor.",
    details: ["Free on-site measurement", "Assess existing conditions and constraints", "Take photos and notes for design reference"],
  },
  {
    num: "03",
    icon: Paintbrush,
    title: "Design Proposal",
    desc: "We prepare layout ideas and visual direction — including 3D renders so you can see the result before committing.",
    details: ["Space planning and layout design", "3D visualization of proposed design", "Material samples and selection"],
  },
  {
    num: "04",
    icon: FileText,
    title: "Quotation & Material Selection",
    desc: "We provide a clear breakdown and discuss materials. No hidden costs, no lump-sum guesswork.",
    details: ["Itemized quotation with clear pricing", "Material comparison and recommendations", "Payment schedule discussion"],
  },
  {
    num: "05",
    icon: Hammer,
    title: "Construction",
    desc: "Work is managed by our team with site supervision. Weekly progress updates with photos.",
    details: ["Permit application and coordination", "All trades executed by our team", "Regular progress updates with photos"],
  },
  {
    num: "06",
    icon: Handshake,
    title: "Handover",
    desc: "Final quality check, defect rectification, thorough cleaning, and workmanship warranty handover.",
    details: ["Final walkthrough and inspection", "Defect list and rectification", "Professional cleaning", "Warranty handover"],
  },
];

// ============ ABOUT PAGE ============
export interface MilestoneItem {
  year: string;
  title: string;
  desc: string;
}

export const companyMilestones: MilestoneItem[] = [
  { year: "2015", title: "Company Founded", desc: "FLASH CAST SDN. BHD. established in Kuala Lumpur, starting with residential renovation projects." },
  { year: "2017", title: "Commercial Expansion", desc: "Expanded into commercial fit-out and office renovation, serving corporate clients across KL." },
  { year: "2019", title: "Remmers Partnership", desc: "Became an authorized applicator for German Remmers artistic wall coatings in Malaysia." },
  { year: "2021", title: "Industrial Division", desc: "Launched warehouse shelving and industrial racking division to serve manufacturing and logistics sectors." },
  { year: "2023", title: "200+ Projects Milestone", desc: "Completed over 200 projects across residential, commercial, and industrial categories." },
  { year: "2025", title: "Regional Growth", desc: "Expanded service coverage to all major areas across Kuala Lumpur and Selangor." },
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
    desc: "Clear quotations with no hidden costs. Itemized pricing, regular progress updates, and honest communication throughout.",
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
  { icon: Hammer, title: "Skilled Carpenters", desc: "In-house carpentry team specializing in custom built-in furniture, cabinetry, and millwork." },
  { icon: Users, title: "Design Consultants", desc: "Experienced interior designers who translate your ideas into practical, beautiful living spaces." },
  { icon: Target, title: "Project Managers", desc: "Dedicated coordinators who oversee every phase — from permits and procurement to quality checks." },
  { icon: Star, title: "Specialist Applicators", desc: "Certified Remmers coating applicators trained in German artistic wall finishing techniques." },
];

export const companyStats = [
  { value: "200+", label: "Projects Completed" },
  { value: "10+", label: "Years Experience" },
  { value: "50+", label: "Team Members" },
  { value: "98%", label: "Client Satisfaction" },
];

// ============ TESTIMONIALS ============
export interface Testimonial {
  text: string;
  client: string;
  location: string;
  type: string;
}

export const testimonials: Testimonial[] = [
  {
    text: "Very responsive team and solid workmanship. The project was delivered on time and the final result looks clean and premium. The quotation was transparent with no hidden costs.",
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
];

// ============ HOMEPAGE FAQ ============
export interface FAQItem {
  q: string;
  a: string;
}

export const homeFAQs: FAQItem[] = [
  { q: "What types of renovation do you handle?", a: "We handle full residential renovation (condo and landed), kitchen renovation, bathroom renovation, office fit-out, shop lot renovation, custom built-in furniture, artistic wall coating, and old house renovation. We also assist with permit applications and architectural drawings." },
  { q: "Do you provide a quotation after site visit?", a: "Yes. We provide free site measurements and detailed itemized quotations for all projects in Kuala Lumpur and Selangor — no obligation, no hidden charges." },
  { q: "Do you serve Kuala Lumpur and Selangor only?", a: "Yes, we currently serve all areas in Kuala Lumpur and Selangor including Mont Kiara, Bangsar, Cheras, Petaling Jaya, Subang Jaya, Shah Alam, Puchong, and surrounding areas." },
  { q: "Can you handle condo renovation approval?", a: "Yes. We handle all permit applications — condo management office applications, DBKL permits, and local council approvals. This is included in our project management service." },
  { q: "Do you provide design and carpentry work?", a: "Yes. We have an in-house design team for space planning and 3D visualization, and an in-house carpentry team for custom built-in furniture including wardrobes, kitchen cabinets, and storage solutions." },
  { q: "How long does a renovation project usually take?", a: "Most residential renovations take 6-12 weeks. Kitchen projects take 3-5 weeks. Bathroom renovations take 2-3 weeks. Office and shop lot fit-outs take 4-8 weeks. We provide a detailed timeline with milestones." },
  { q: "Do you provide warranty or after-sales support?", a: "Yes. All renovation works come with workmanship warranty. We also provide after-sales support for any issues that arise after handover." },
];

// ============ HOMEPAGE PROCESS STEPS (simplified) ============
export interface HomepageProcessStep {
  num: string;
  title: string;
  desc: string;
}

export const homepageProcessSteps: HomepageProcessStep[] = [
  { num: "01", title: "Consultation", desc: "We understand your goals, space, style, and budget." },
  { num: "02", title: "Site Measurement", desc: "We inspect the site and confirm key dimensions." },
  { num: "03", title: "Design Proposal", desc: "We prepare layout ideas and visual direction." },
  { num: "04", title: "Quotation & Material Selection", desc: "We provide a clear breakdown and discuss materials." },
  { num: "05", title: "Construction", desc: "Work is managed by our team with site supervision." },
  { num: "06", title: "Handover", desc: "Final quality check and project delivery." },
];

export const homepageProcessIntro = "A clear, structured process from first contact to project handover. Every step is designed to give you confidence and control over your renovation.";

// ============ SERVICE AREA SECTION ============
export interface ServiceAreaItem {
  name: string;
  slug: string;
  areas: string;
}

export const serviceAreas: ServiceAreaItem[] = [
  { name: "Kuala Lumpur", slug: "kuala-lumpur", areas: "Mont Kiara, Bangsar, Cheras, Kepong, Sentul, Sri Hartamas, City Centre" },
  { name: "Petaling Jaya", slug: "petaling-jaya", areas: "SS2, Damansara, Kelana Jaya, PJ New Town, Section 17, Taman SEA" },
  { name: "Subang Jaya", slug: "subang-jaya", areas: "USJ, SS15, SS16, Sunway, Putra Heights" },
  { name: "Shah Alam", slug: "selangor", areas: "All sections, Setia Alam, Kota Kemuning, Bukit Jelutong" },
  { name: "Puchong", slug: "selangor", areas: "Bandar Puteri, IOI Boulevard, Taman Puchong" },
  { name: "Cheras", slug: "cheras", areas: "Taman Connaught, Taman Midah, Taman Segar, Batu 9" },
];

export const serviceAreaIntro = "FLASH CAST SDN. BHD. is based in Kuala Lumpur and provides renovation services across the entire KL and Selangor region. Free site measurement for all enquiries within our coverage area.";

export const serviceAreaFooter = {
  text: "Don't see your area? We may still be able to help.",
  link: "/contact",
  linkText: "Contact us",
  suffix: "to check availability.",
};
