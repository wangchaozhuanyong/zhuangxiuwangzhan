/**
 * Landing page data for SEO-targeted service/product pages.
 * To add a new landing page, simply add a new entry here — no code changes needed.
 */

import residentialImg from "@/assets/residential-renovation.jpg";
import commercialImg from "@/assets/commercial-renovation.jpg";
import kitchenImg from "@/assets/kitchen-cabinet.jpg";
import warehouseImg from "@/assets/warehouse-shelving.jpg";
import exteriorImg from "@/assets/exterior-works.jpg";

export interface LandingProject {
  title: string;
  location: string;
  image: string;
}

export interface LandingData {
  title: string;
  subtitle: string;
  heroImage: string;
  description: string;
  benefits: string[];
  relatedProjects: LandingProject[];
  faqs: { q: string; a: string }[];
}

export const landingPages: Record<string, LandingData> = {
  flooring: {
    title: "Flooring Solutions in Kuala Lumpur",
    subtitle: "SPC Vinyl, Laminate & Engineered Wood Flooring — Supply & Install",
    heroImage: residentialImg,
    description: "FLASH CAST provides professional flooring supply and installation services across Kuala Lumpur and Selangor. Choose from our wide range of SPC vinyl, laminate, and engineered wood flooring — all installed by our experienced team with precision and care.",
    benefits: ["Wide range of flooring materials", "Professional installation team", "Free on-site measurement", "Competitive pricing", "Suitable for residential & commercial", "Warranty included"],
    relatedProjects: [
      { title: "SPC Vinyl Flooring for Condo", location: "Mont Kiara, KL", image: residentialImg },
      { title: "Laminate Flooring for Office", location: "Petaling Jaya", image: commercialImg },
    ],
    faqs: [
      { q: "What types of flooring do you offer?", a: "We offer SPC vinyl, laminate, engineered wood, and timber flooring in various styles and finishes." },
      { q: "Do you provide free measurement for flooring?", a: "Yes. Free site measurement is included for all flooring projects in KL and Selangor." },
      { q: "How long does flooring installation take?", a: "A typical condo unit (800-1200 sqft) takes 1-2 days for installation." },
    ],
  },
  "kitchen-cabinet": {
    title: "Custom Kitchen Cabinets in Kuala Lumpur",
    subtitle: "Made-to-Measure Kitchen Cabinets — Design, Build & Install",
    heroImage: kitchenImg,
    description: "Get custom kitchen cabinets designed and built to your exact kitchen layout. FLASH CAST manufactures high-quality kitchen cabinets using melamine, acrylic, solid wood, and other premium materials.",
    benefits: ["Custom-made to your kitchen size", "3D design visualization", "Multiple material options", "Soft-close hardware", "Factory-manufactured quality", "Professional installation"],
    relatedProjects: [
      { title: "Modern Kitchen in Bangsar Condo", location: "Bangsar, KL", image: kitchenImg },
      { title: "Open Kitchen Renovation", location: "Subang Jaya", image: residentialImg },
    ],
    faqs: [
      { q: "How long does a custom kitchen take?", a: "From measurement to installation, a custom kitchen typically takes 3-4 weeks." },
      { q: "What materials are available?", a: "We offer melamine, acrylic, solid wood, and laminate finishes with various countertop options including quartz and granite." },
      { q: "Can I see a 3D design first?", a: "Yes. We provide 3D kitchen design visualization before manufacturing begins." },
    ],
  },
  "office-renovation": {
    title: "Office Renovation in Kuala Lumpur",
    subtitle: "Professional Office Fit-Out & Renovation — Design to Completion",
    heroImage: commercialImg,
    description: "Transform your workspace with FLASH CAST's professional office renovation services. We handle everything from space planning and design to partitioning, ceiling, electrical, and furniture.",
    benefits: ["Complete office fit-out services", "Space planning & design", "Glass & gypsum partitioning", "Workstation setup", "Meeting room & reception design", "Minimal disruption to operations"],
    relatedProjects: [
      { title: "Corporate Office in KL Sentral", location: "KL Sentral", image: commercialImg },
      { title: "Co-Working Space in PJ", location: "Petaling Jaya", image: residentialImg },
    ],
    faqs: [
      { q: "Can you renovate while we continue working?", a: "Yes. We can phase the renovation to minimize disruption to your daily operations." },
      { q: "Do you handle office permits?", a: "Yes. We manage all building management applications and permits required for office renovations." },
      { q: "What's included in office fit-out?", a: "Our office fit-out covers partitioning, ceiling, flooring, electrical, networking, painting, furniture, and reception design." },
    ],
  },
  "shop-renovation": {
    title: "Shop Renovation in Kuala Lumpur",
    subtitle: "Retail & F&B Shop Renovation — Shopfront, Interior & Signage",
    heroImage: exteriorImg,
    description: "FLASH CAST delivers complete shop renovation services including shopfront design, interior fit-out, signage installation, and display systems.",
    benefits: ["Shopfront & signage design", "Interior layout optimization", "Display & counter fabrication", "F&B kitchen setup", "Lighting design", "Fast turnaround"],
    relatedProjects: [
      { title: "Retail Shop in Bangsar", location: "Bangsar, KL", image: exteriorImg },
      { title: "Café Renovation in SS2", location: "Petaling Jaya", image: commercialImg },
    ],
    faqs: [
      { q: "How long does a shop renovation take?", a: "A typical shoplot renovation takes 4-8 weeks depending on scope and permit requirements." },
      { q: "Do you handle signage?", a: "Yes. We design, fabricate, and install shopfront signage including lightbox, 3D lettering, and digital signage." },
      { q: "Can you help with renovation permits for shop?", a: "Yes. We handle all management office and local council permit applications for shop renovations." },
    ],
  },
  "warehouse-shelving": {
    title: "Warehouse Shelving & Racking in Malaysia",
    subtitle: "Commercial Shelving, Heavy-Duty Racking & Industrial Storage Solutions",
    heroImage: warehouseImg,
    description: "FLASH CAST provides warehouse racking, commercial shelving, and industrial storage solutions for businesses across Kuala Lumpur and Selangor.",
    benefits: ["Heavy-duty warehouse racking", "Commercial shelving systems", "Custom layout design", "Professional installation", "Load capacity engineering", "Competitive pricing"],
    relatedProjects: [
      { title: "Warehouse Racking in Shah Alam", location: "Shah Alam, Selangor", image: warehouseImg },
      { title: "Storage System for Logistics Co.", location: "Puchong", image: warehouseImg },
    ],
    faqs: [
      { q: "What types of racking do you provide?", a: "We provide selective pallet racking, long-span shelving, medium-duty shelving, and boltless rack systems." },
      { q: "Do you do site surveys?", a: "Yes. We provide free site surveys to assess your warehouse layout and storage requirements." },
      { q: "Can you install in an operating warehouse?", a: "Yes. We can phase the installation to allow continued operations during setup." },
    ],
  },
};

/** All landing page slugs for navigation and sitemap */
export const landingSlugs = Object.keys(landingPages);
