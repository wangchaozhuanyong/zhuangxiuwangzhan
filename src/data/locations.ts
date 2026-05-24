/**
 * Location data for all service area pages.
 * To add a new location, simply add a new entry here — no code changes needed.
 */

import residentialImg from "@/assets/residential-renovation.jpg";
import commercialImg from "@/assets/commercial-renovation.jpg";
import kitchenImg from "@/assets/kitchen-cabinet.jpg";

export interface LocationProject {
  title: string;
  type: string;
  image: string;
}

export interface LocationData {
  name: string;
  slug: string;
  metaTitle: string;
  description: string;
  intro: string;
  propertyTypes: string[];
  commonNeeds: string[];
  constructionNotes: string;
  projects: LocationProject[];
  faqs: { q: string; a: string }[];
}

export const locationsData: Record<string, LocationData> = {
  "kuala-lumpur": {
    name: "Kuala Lumpur",
    slug: "kuala-lumpur",
    metaTitle: "Renovation Services in Kuala Lumpur | Interior Design KL | FLASH CAST",
    description: "Professional renovation and interior design services in Kuala Lumpur. FLASH CAST SDN. BHD. delivers complete renovation solutions for residential, commercial, and industrial projects across KL.",
    intro: "As a Kuala Lumpur-based renovation company, FLASH CAST SDN. BHD. has completed over 200 projects across the city — from luxury condo renovations in Mont Kiara and Bangsar to commercial fit-outs in the city centre. Our local team understands KL building regulations, management office requirements, and DBKL permit processes.",
    propertyTypes: ["High-rise condominiums (Mont Kiara, KLCC, Bangsar)", "Serviced apartments", "Landed houses (semi-D, bungalows, terraces)", "Shop lots and commercial units", "Office spaces in commercial towers", "F&B outlets and retail stores"],
    commonNeeds: ["Full condo renovation with management office permit", "Kitchen cabinet replacement and built-in furniture", "Master bedroom and wardrobe upgrade", "Bathroom renovation with waterproofing", "Open-concept living room redesign", "Office partition and fit-out"],
    constructionNotes: "Most KL condominiums require renovation permits from the management office. Typical renovation hours are 9 AM – 5 PM, Monday to Saturday. DBKL permits are required for structural changes, external modifications, and signage. FLASH CAST handles all permit applications and coordination on your behalf.",
    projects: [
      { title: "Modern Condo Renovation in Mont Kiara", type: "Residential", image: residentialImg },
      { title: "Office Fit-Out in KL Sentral", type: "Commercial", image: commercialImg },
      { title: "Custom Kitchen in Bangsar", type: "Built-In", image: kitchenImg },
    ],
    faqs: [
      { q: "Do you provide renovation services throughout Kuala Lumpur?", a: "Yes. We cover all areas in Kuala Lumpur including Mont Kiara, Bangsar, Cheras, Kepong, Wangsa Maju, Sentul, Sri Hartamas, Damansara Heights, Taman Tun Dr Ismail, and the city centre." },
      { q: "Can you help with DBKL renovation permits and condo management approvals?", a: "Yes. We handle all documentation — DBKL renovation permit applications, management office coordination, deposit processing, and site inspection scheduling. This is included in our project management service." },
      { q: "How quickly can you start a project in KL?", a: "After site measurement and quotation approval, we can typically begin within 1-2 weeks depending on permit requirements and material availability. Urgent projects may start sooner." },
      { q: "What is the average cost of a condo renovation in Kuala Lumpur?", a: "A typical KL condo renovation ranges from RM 30,000 – RM 150,000+ depending on scope, size, and materials. We provide a detailed itemized quotation after a free site measurement." },
    ],
  },
  "selangor": {
    name: "Selangor",
    slug: "selangor",
    metaTitle: "Renovation Company Selangor | Shah Alam, PJ, Subang | FLASH CAST",
    description: "Reliable renovation company serving Selangor — Shah Alam, Petaling Jaya, Subang Jaya, Puchong, Klang, and surrounding areas. Full-service interior design and construction.",
    intro: "FLASH CAST serves the entire Selangor region with professional renovation and interior design services. From landed homes in Shah Alam to shophouses in Klang, we bring the same quality workmanship and attention to detail to every project. Selangor's diverse property types — from modern condos to older terrace houses and commercial shop lots — require versatile expertise, and our team is equipped to handle them all.",
    propertyTypes: ["Double-storey terrace houses", "Semi-detached and bungalows", "Condominiums and apartments", "Shop lots (single and double storey)", "Industrial units and warehouses", "Office units in commercial complexes"],
    commonNeeds: ["Full landed house renovation and extension", "Kitchen and bathroom overhaul for older homes", "Shop lot renovation for new business setup", "Warehouse racking and storage solutions", "Custom built-in furniture for family homes", "Office renovation and partitioning"],
    constructionNotes: "Renovation requirements in Selangor vary by local council — MBSA (Shah Alam), MBPJ (Petaling Jaya), MPSJ (Subang Jaya), etc. Landed property extensions may require council approval. Strata properties require management office permits. FLASH CAST handles all permit coordination across Selangor.",
    projects: [
      { title: "Landed House Renovation in Shah Alam", type: "Residential", image: residentialImg },
      { title: "Shop Renovation in Klang", type: "Commercial", image: commercialImg },
      { title: "Custom Kitchen in Subang Jaya", type: "Built-In", image: kitchenImg },
    ],
    faqs: [
      { q: "Which areas in Selangor do you serve?", a: "We serve all major areas including Shah Alam, Petaling Jaya, Subang Jaya, Puchong, Klang, Ampang, Kajang, Rawang, Setia Alam, Kota Kemuning, and surrounding areas." },
      { q: "Is site measurement free in Selangor?", a: "Yes. We provide free site measurements for all enquiries within Selangor — no obligation, no hidden charges." },
      { q: "Can you handle landed house extensions in Selangor?", a: "Yes. We handle house extensions including structural works, foundations, roofing, and all relevant council permit applications." },
      { q: "Do you handle renovation permits across different Selangor councils?", a: "Yes. We coordinate with MBSA, MBPJ, MPSJ, MPK, and other local councils in Selangor for permit applications and compliance." },
    ],
  },
  "petaling-jaya": {
    name: "Petaling Jaya",
    slug: "petaling-jaya",
    metaTitle: "Renovation Services Petaling Jaya | Interior Design PJ | FLASH CAST",
    description: "Renovation and interior design services in Petaling Jaya. Custom built-in, office fit-outs, and residential renovation by FLASH CAST SDN. BHD.",
    intro: "Petaling Jaya is one of our most active service areas with a diverse mix of residential and commercial properties. From the established neighborhoods of SS2 and Section 17 to modern developments in Damansara and Kelana Jaya, PJ homeowners and businesses trust FLASH CAST for quality renovation work. Our familiarity with MBPJ requirements and PJ's various property types ensures smooth project delivery.",
    propertyTypes: ["Terrace houses (SS2, Section 17, Taman SEA)", "Condominiums (Kelana Jaya, Damansara)", "Semi-detached and bungalows (Damansara Heights area)", "Shop lots (SS2, PJ New Town)", "Office units (Kelana Jaya, PJ Trade Centre)"],
    commonNeeds: ["Terrace house full renovation", "Condo interior redesign", "Office partition and modern fit-out", "Kitchen cabinet replacement", "Bathroom waterproofing and upgrade", "Feature wall and built-in furniture"],
    constructionNotes: "PJ properties fall under MBPJ (Majlis Bandaraya Petaling Jaya). Renovation permits are required for structural work and extensions. Condo management offices in PJ typically allow renovations Monday to Saturday, 9 AM – 5 PM. FLASH CAST coordinates all MBPJ permits and management office approvals.",
    projects: [
      { title: "Condo Renovation in Damansara", type: "Residential", image: residentialImg },
      { title: "Office Renovation in Kelana Jaya", type: "Commercial", image: commercialImg },
    ],
    faqs: [
      { q: "Do you do renovations in all PJ areas?", a: "Yes. We cover SS2, Damansara, Kelana Jaya, PJ New Town, Section 17, Taman SEA, SS15, Tropicana, and all surrounding areas in Petaling Jaya." },
      { q: "Can you renovate my office in PJ?", a: "Yes. We specialize in office fit-outs including glass partitioning, reception counters, workstation setup, and full interior renovation. Many of our commercial projects are in PJ." },
      { q: "How much does a terrace house renovation cost in PJ?", a: "A typical PJ terrace house renovation ranges from RM 50,000 – RM 200,000+ depending on scope. We provide free site measurement and detailed quotation." },
    ],
  },
  "cheras": {
    name: "Cheras",
    slug: "cheras",
    metaTitle: "Renovation Services Cheras | Affordable Quality | FLASH CAST",
    description: "Affordable and professional renovation services in Cheras. Interior design, custom cabinets, and full renovation by FLASH CAST.",
    intro: "FLASH CAST serves the Cheras area with quality renovation services for condos, landed homes, and commercial properties. Cheras has a unique mix of older terrace houses needing modernization and newer condominiums wanting premium upgrades. Our team is experienced with both — from full structural renovation of 1970s-era terraces to modern condo fit-outs in developments like EkoCheras and Southgate.",
    propertyTypes: ["Older terrace houses (Taman Connaught, Taman Midah)", "Modern condominiums (EkoCheras, Southgate)", "Apartments and flats", "Shop lots along Jalan Cheras", "Commercial units"],
    commonNeeds: ["Older terrace house modernization with rewiring and replumbing", "Kitchen and bathroom renovation for aging properties", "Built-in wardrobes and storage maximization", "Condo interior design for new units", "Shop lot renovation for F&B and retail"],
    constructionNotes: "Older properties in Cheras may require additional attention to electrical wiring, plumbing, and waterproofing. Some terrace houses have non-standard layouts that need creative design solutions. FLASH CAST has extensive experience handling the specific challenges of Cheras properties.",
    projects: [
      { title: "Terrace House Renovation in Cheras", type: "Residential", image: residentialImg },
      { title: "Custom Built-In Cabinets in Taman Connaught", type: "Built-In", image: kitchenImg },
    ],
    faqs: [
      { q: "Do you serve all areas in Cheras?", a: "Yes. We cover Taman Connaught, Taman Midah, Cheras Leisure Mall area, Taman Segar, Batu 9, Taman Yulek, Bandar Tun Razak, and all Cheras neighborhoods." },
      { q: "Can you renovate old terrace houses in Cheras?", a: "Yes. We have extensive experience renovating older terrace houses including structural works, rewiring, replumbing, waterproofing, and full interior redesign." },
      { q: "Is renovation in Cheras cheaper than in KL city?", a: "Labour and material costs are generally consistent. However, older properties may require additional preparation work. We always provide transparent, itemized quotations." },
    ],
  },
  "mont-kiara": {
    name: "Mont Kiara",
    slug: "mont-kiara",
    metaTitle: "Luxury Renovation Mont Kiara | Premium Interior Design | FLASH CAST",
    description: "Luxury renovation and interior design in Mont Kiara. High-end condo renovation, custom built-in, and premium finishes by FLASH CAST.",
    intro: "Mont Kiara is home to some of Kuala Lumpur's most prestigious condominiums — i-Zen, 28 Mont Kiara, Arcoris, Residensi 22, and Solaris Dutamas. FLASH CAST has completed numerous luxury renovation projects here, delivering premium finishes, custom built-in furniture, and sophisticated interior designs.",
    propertyTypes: ["Premium condominiums (i-Zen, 28 Mont Kiara, Arcoris)", "Serviced apartments (Solaris Dutamas)", "Penthouse units", "Landed properties in surrounding areas"],
    commonNeeds: ["Premium condo full renovation with luxury finishes", "Walk-in wardrobe with LED lighting systems", "Kitchen upgrade with quartz countertops and premium cabinets", "Feature walls with imported materials", "Smart home integration", "Master bedroom suite renovation"],
    constructionNotes: "Mont Kiara condominiums have strict renovation guidelines — designated renovation hours, noise restrictions, and material delivery scheduling. Some developments require a renovation deposit of RM 5,000 – RM 10,000. FLASH CAST is experienced with all Mont Kiara management offices.",
    projects: [
      { title: "Luxury Condo Renovation in i-Zen", type: "Residential", image: residentialImg },
      { title: "Premium Kitchen in Solaris Dutamas", type: "Built-In", image: kitchenImg },
    ],
    faqs: [
      { q: "Do you have experience with Mont Kiara condos?", a: "Yes. We have completed projects in multiple Mont Kiara developments including i-Zen, 28 Mont Kiara, Arcoris, and Solaris Dutamas." },
      { q: "Can you do high-end finishes like marble and artistic coating?", a: "Absolutely. We work with premium materials including marble, natural stone, solid wood, high-gloss acrylic, and German Remmers artistic wall coatings." },
      { q: "What is the cost range for a Mont Kiara condo renovation?", a: "Premium renovations in Mont Kiara typically range from RM 80,000 – RM 300,000+ depending on size and material selections." },
    ],
  },
  "bangsar": {
    name: "Bangsar",
    slug: "bangsar",
    metaTitle: "Renovation Services Bangsar | Interior Design Bangsar South | FLASH CAST",
    description: "Renovation services in Bangsar and Bangsar South. Interior design, shop renovation, F&B fit-out, and residential renovation by FLASH CAST SDN. BHD.",
    intro: "Bangsar's unique mix of heritage bungalows, modern condominiums, and vibrant commercial shophouses requires a renovation company that understands the area's character. FLASH CAST delivers tailored renovation solutions for both the established Bangsar neighborhood and the contemporary Bangsar South developments.",
    propertyTypes: ["Heritage bungalows and semi-detached houses", "Modern condominiums (Bangsar South, The Vertical)", "Shophouses along Jalan Telawi", "F&B outlets and cafés", "Office units in Bangsar South towers"],
    commonNeeds: ["Heritage home renovation preserving character", "Modern condo interior redesign", "Café and restaurant fit-out", "Shop renovation on Jalan Telawi", "Boutique retail interior", "Custom built-in furniture for character homes"],
    constructionNotes: "Bangsar heritage properties may have specific conservation considerations. Bangsar South developments have modern management office requirements. F&B renovations require compliance with fire safety, ventilation, and grease trap regulations.",
    projects: [
      { title: "Semi-D Renovation in Bangsar", type: "Residential", image: residentialImg },
      { title: "Café Fit-Out in Bangsar South", type: "Commercial", image: commercialImg },
    ],
    faqs: [
      { q: "Do you renovate both old and new properties in Bangsar?", a: "Yes. We handle renovations for older bungalows and semi-detached houses as well as new high-rise condos in Bangsar and Bangsar South." },
      { q: "Can you do F&B renovation in Bangsar?", a: "Yes. We have experience with café, restaurant, and retail fit-outs in the Bangsar area." },
      { q: "What about parking and material delivery in Bangsar?", a: "We coordinate delivery schedules to minimize disruption, especially in busy areas like Jalan Telawi." },
    ],
  },
  "subang-jaya": {
    name: "Subang Jaya",
    slug: "subang-jaya",
    metaTitle: "Renovation Company Subang Jaya | USJ, SS Areas | FLASH CAST",
    description: "Professional renovation company in Subang Jaya. Residential and commercial renovation, custom built-in furniture, and full interior design services.",
    intro: "Subang Jaya is a vibrant township with diverse renovation needs. From family homes in USJ to commercial spaces along Persiaran Kewajipan, FLASH CAST provides complete renovation services backed by quality workmanship.",
    propertyTypes: ["Double-storey terrace houses (USJ, SS areas)", "Semi-detached and bungalows", "Condominiums (Sunway area)", "Shop lots and commercial units", "Office spaces"],
    commonNeeds: ["Family home renovation and modernization", "Kitchen and bathroom upgrade for older terraces", "Double-storey house extension", "Shop lot renovation for new businesses", "Built-in furniture for growing families", "Home office setup"],
    constructionNotes: "Subang Jaya falls under MPSJ (Majlis Perbandaran Subang Jaya). House extensions require MPSJ approval and must comply with setback and coverage requirements.",
    projects: [
      { title: "Double-Storey House Renovation in USJ", type: "Residential", image: residentialImg },
      { title: "Retail Shop Fit-Out in Subang", type: "Commercial", image: commercialImg },
    ],
    faqs: [
      { q: "Do you cover USJ and SS areas in Subang Jaya?", a: "Yes. We serve all areas in Subang Jaya including USJ 1-27, SS15, SS16, SS17, SS18, SS19, Sunway, Putra Heights, and surrounding neighborhoods." },
      { q: "Can you handle landed house extensions in Subang?", a: "Yes. We handle house extensions, structural modifications, roofing, and full renovations with MPSJ permit applications." },
      { q: "How long does a typical terrace house renovation take in Subang?", a: "A full renovation for a standard double-storey terrace typically takes 8-12 weeks." },
    ],
  },
};

/** All location slugs for navigation and sitemap */
export const locationSlugs = Object.keys(locationsData);
