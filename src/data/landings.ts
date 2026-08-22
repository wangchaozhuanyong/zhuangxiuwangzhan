/** * Landing page data for SEO-targeted service/product pages. * To add a new landing page, simply add a new entry here - no code changes needed. */
const residentialImg = "/images/projects/residential-renovation.webp";
const commercialImg = "/images/projects/commercial-renovation.webp";
const kitchenImg = "/images/services/kitchen-cabinet.webp";
const warehouseImg = "/images/services/warehouse-shelving.webp";
const exteriorImg = "/images/services/exterior-works.webp";
export interface LandingProject {
  title: string;
  location: string;
  image: string;
}
export interface LandingData {
  title: string;
  subtitle: string;
  heroImage: string;
  heroAlt?: string;
  description: string;
  benefits: string[];
  relatedProjects: LandingProject[];
  faqs: { q: string; a: string }[];
  seoTitle?: string;
  seoDescription?: string;
}
export const landingPages: Record<string, LandingData> = {
  flooring: {
    title: "Flooring Solutions in Kuala Lumpur",
    subtitle:
      "SPC Vinyl, Laminate & Engineered Wood Flooring - Supply & Install",
    heroImage: residentialImg,
    description:
      "FLASH CAST provides professional flooring supply and installation services across Kuala Lumpur and Selangor. Choose from our wide range of SPC vinyl, laminate, and engineered wood flooring - all installed by our experienced team with precision and care.",
    benefits: [
      "Wide range of flooring materials",
      "Professional installation team",
      "Free on-site measurement",
      "Competitive pricing",
      "Suitable for residential & commercial",
      "Warranty included",
    ],
    relatedProjects: [
      {
        title: "SPC Vinyl Flooring for Condo",
        location: "Mont Kiara, KL",
        image: residentialImg,
      },
      {
        title: "Laminate Flooring for Office",
        location: "Petaling Jaya",
        image: commercialImg,
      },
    ],
    faqs: [
      {
        q: "What types of flooring do you offer?",
        a: "We offer SPC vinyl, laminate, engineered wood, and timber flooring in various styles and finishes.",
      },
      {
        q: "Can measurement be arranged for flooring?",
        a: "Measurement can be arranged based on area, project type, access, and schedule.",
      },
      {
        q: "How long does flooring installation take?",
        a: "A typical condo unit (800-1200 sqft) takes 1-2 days for installation.",
      },
    ],
  },
  "kitchen-cabinet": {
    title: "Custom Kitchen Cabinets in Kuala Lumpur",
    subtitle: "Made-to-Measure Kitchen Cabinets - Design, Build & Install",
    heroImage: kitchenImg,
    description:
      "Get custom kitchen cabinets designed and built to your exact kitchen layout. FLASH CAST manufactures high-quality kitchen cabinets using melamine, acrylic, solid wood, and other premium materials.",
    benefits: [
      "Custom-made to your kitchen size",
      "3D design visualization",
      "Multiple material options",
      "Soft-close hardware",
      "Factory-manufactured quality",
      "Professional installation",
    ],
    relatedProjects: [
      {
        title: "Modern Kitchen in Bangsar Condo",
        location: "Bangsar, KL",
        image: kitchenImg,
      },
      {
        title: "Open Kitchen Renovation",
        location: "Subang Jaya",
        image: residentialImg,
      },
    ],
    faqs: [
      {
        q: "How long does a custom kitchen take?",
        a: "From measurement to installation, a custom kitchen typically takes 3-4 weeks.",
      },
      {
        q: "What materials are available?",
        a: "We offer melamine, acrylic, solid wood, and laminate finishes with various countertop options including quartz and granite.",
      },
      {
        q: "Can I see a 3D design first?",
        a: "Yes. We provide 3D kitchen design visualization before manufacturing begins.",
      },
    ],
  },
  "office-renovation": {
    title: "Office Renovation in Kuala Lumpur",
    subtitle: "Workspace planning, fit-out coordination and renovation delivery",
    heroImage: commercialImg,
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
      {
        title: "Office Space Planning Reference",
        location: "Kuala Lumpur",
        image: commercialImg,
      },
      {
        title: "Office Refurbishment Reference",
        location: "Selangor",
        image: residentialImg,
      },
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
  "shop-renovation": {
    title: "Shop Renovation in Kuala Lumpur",
    subtitle: "Retail & F&B Shop Renovation - Shopfront, Interior & Signage",
    heroImage: exteriorImg,
    description:
      "FLASH CAST delivers complete shop renovation services including shopfront design, interior fit-out, signage installation, and display systems.",
    benefits: [
      "Shopfront & signage design",
      "Interior layout optimization",
      "Display & counter fabrication",
      "F&B kitchen setup",
      "Lighting design",
      "Fast turnaround",
    ],
    relatedProjects: [
      {
        title: "Retail Shop in Bangsar",
        location: "Bangsar, KL",
        image: exteriorImg,
      },
      {
        title: "Cafe Renovation in SS2",
        location: "Petaling Jaya",
        image: commercialImg,
      },
    ],
    faqs: [
      {
        q: "How long does a shop renovation take?",
        a: "A typical shoplot renovation takes 4-8 weeks depending on scope and permit requirements.",
      },
      {
        q: "Do you handle signage?",
        a: "Yes. We design, fabricate, and install shopfront signage including lightbox, 3D lettering, and digital signage.",
      },
      {
        q: "Can you help with renovation permits for shop?",
        a: "Yes. We handle all management office and local council permit applications for shop renovations.",
      },
    ],
  },
  "warehouse-shelving": {
    title: "Warehouse Shelving & Racking in Malaysia",
    subtitle:
      "Commercial Shelving, Heavy-Duty Racking & Industrial Storage Solutions",
    heroImage: warehouseImg,
    description:
      "FLASH CAST provides warehouse racking, commercial shelving, and industrial storage solutions for businesses across Kuala Lumpur and Selangor.",
    benefits: [
      "Heavy-duty warehouse racking",
      "Commercial shelving systems",
      "Custom layout design",
      "Professional installation",
      "Load capacity engineering",
      "Competitive pricing",
    ],
    relatedProjects: [
      {
        title: "Warehouse Racking in Shah Alam",
        location: "Shah Alam, Selangor",
        image: warehouseImg,
      },
      {
        title: "Storage System for Logistics Co.",
        location: "Puchong",
        image: warehouseImg,
      },
    ],
    faqs: [
      {
        q: "What types of racking do you provide?",
        a: "We provide selective pallet racking, long-span shelving, medium-duty shelving, and boltless rack systems.",
      },
      {
        q: "Do you do site surveys?",
        a: "Yes. We provide free site surveys to assess your warehouse layout and storage requirements.",
      },
      {
        q: "Can you install in an operating warehouse?",
        a: "Yes. We can phase the installation to allow continued operations during setup.",
      },
    ],
  },
};
