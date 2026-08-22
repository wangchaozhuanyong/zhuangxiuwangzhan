/**
 * Location data for all service area pages.
 * To add a new location, simply add a new entry here — no code changes needed.
 */

const residentialImg = "/images/projects/residential-renovation.webp";
const commercialImg = "/images/projects/commercial-renovation.webp";
const kitchenImg = "/images/projects/kitchen-cabinet.webp";

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
    description: "Plan residential or commercial renovation in Kuala Lumpur with attention to site condition, building rules, materials, coordination, and quotation scope.",
    intro: "Kuala Lumpur projects can involve high-rise access, building-management requirements, landed-property conditions, commercial operations, and different approval needs. Start by confirming the property, current site, intended changes, and applicable requirements.",
    propertyTypes: ["High-rise condominiums (Mont Kiara, KLCC, Bangsar)", "Serviced apartments", "Landed houses (semi-D, bungalows, terraces)", "Shop lots and commercial units", "Office spaces in commercial towers", "F&B outlets and retail stores"],
    commonNeeds: ["Full condo renovation with management office permit", "Kitchen cabinet replacement and built-in furniture", "Master bedroom and wardrobe upgrade", "Bathroom renovation with waterproofing", "Open-concept living room redesign", "Office partition and fit-out"],
    constructionNotes: "Requirements vary by building, property type, scope, and current authority rules. Confirm access, protection, deposits, approved hours, drawings, submissions, and responsible parties with the management, landlord, consultants, or relevant authority before work.",
    projects: [
      { title: "Modern Condo Renovation in Mont Kiara", type: "Residential", image: residentialImg },
      { title: "Office Fit-Out in KL Sentral", type: "Commercial", image: commercialImg },
      { title: "Custom Kitchen in Bangsar", type: "Built-In", image: kitchenImg },
    ],
    faqs: [
      { q: "Do you provide renovation services throughout Kuala Lumpur?", a: "Yes. We cover all areas in Kuala Lumpur including Mont Kiara, Bangsar, Cheras, Kepong, Wangsa Maju, Sentul, Sri Hartamas, Damansara Heights, Taman Tun Dr Ismail, and the city centre." },
      { q: "Can approval or management documents be discussed?", a: "Yes. Required documents and coordination can be reviewed after the scope is clear. Exact responsibility, fees, timing, and outcome depend on the management or relevant authority." },
      { q: "What affects a possible start date in KL?", a: "Site access, confirmed scope, approvals, material availability, building rules, contractor scheduling, and project documents all affect timing." },
      { q: "What affects condo renovation cost in Kuala Lumpur?", a: "Condo renovation cost depends on scope, size, materials, management rules, and site condition. A quotation should be prepared after reviewing the project details." },
    ],
  },
  "selangor": {
    name: "Selangor",
    slug: "selangor",
    metaTitle: "Renovation Company Selangor | Shah Alam, PJ, Subang | FLASH CAST",
    description: "Discuss renovation planning for selected Selangor areas, including residential, commercial, built-in, and fit-out scope based on the real site.",
    intro: "Selangor includes different local-authority areas, strata buildings, landed homes, commercial units, and industrial spaces. The relevant site, management, landlord, and authority requirements should be checked for each project.",
    propertyTypes: ["Double-storey terrace houses", "Semi-detached and bungalows", "Condominiums and apartments", "Shop lots (single and double storey)", "Industrial units and warehouses", "Office units in commercial complexes"],
    commonNeeds: ["Full landed house renovation and extension", "Kitchen and bathroom overhaul for older homes", "Shop lot renovation for new business setup", "Warehouse racking and storage solutions", "Custom built-in furniture for family homes", "Office renovation and partitioning"],
    constructionNotes: "Requirements vary by local-authority area, property type, management rules, and proposed work. Confirm extension, structural, external, strata, access, and document requirements with the relevant current parties before construction.",
    projects: [
      { title: "Landed House Renovation in Shah Alam", type: "Residential", image: residentialImg },
      { title: "Shop Renovation in Klang", type: "Commercial", image: commercialImg },
      { title: "Custom Kitchen in Subang Jaya", type: "Built-In", image: kitchenImg },
    ],
    faqs: [
      { q: "Which areas in Selangor do you serve?", a: "We serve all major areas including Shah Alam, Petaling Jaya, Subang Jaya, Puchong, Klang, Ampang, Kajang, Rawang, Setia Alam, Kota Kemuning, and surrounding areas." },
      { q: "Can site measurement be arranged in Selangor?", a: "Site measurement can be arranged based on area, project type, access, and schedule." },
      { q: "Can a landed-house extension be assessed?", a: "Yes. Share the existing condition and proposed changes so structural, consultant, authority, neighbour, access, and quotation requirements can be identified." },
      { q: "How are different Selangor approval requirements handled?", a: "First identify the current relevant authority and property rules. The required drawings, submissions, responsible parties, fees, and timing should then be confirmed for that exact scope." },
    ],
  },
  "petaling-jaya": {
    name: "Petaling Jaya",
    slug: "petaling-jaya",
    metaTitle: "Renovation Services Petaling Jaya | Interior Design PJ | FLASH CAST",
    description: "Renovation and interior design services in Petaling Jaya. Custom built-in, office fit-outs, and residential renovation by FLASH CAST SDN. BHD.",
    intro: "Petaling Jaya includes established landed neighbourhoods, strata homes, shop lots, and commercial offices. Renovation planning should reflect the property condition, access, management or landlord rules, services, and confirmed work scope.",
    propertyTypes: ["Terrace houses (SS2, Section 17, Taman SEA)", "Condominiums (Kelana Jaya, Damansara)", "Semi-detached and bungalows (Damansara Heights area)", "Shop lots (SS2, PJ New Town)", "Office units (Kelana Jaya, PJ Trade Centre)"],
    commonNeeds: ["Terrace house full renovation", "Condo interior redesign", "Office partition and modern fit-out", "Kitchen cabinet replacement", "Bathroom waterproofing and upgrade", "Feature wall and built-in furniture"],
    constructionNotes: "Check the current local-authority, management, landlord, access, protection, work-hour, drawing, and submission requirements for the specific PJ property and proposed scope before work.",
    projects: [
      { title: "Condo Renovation in Damansara", type: "Residential", image: residentialImg },
      { title: "Office Renovation in Kelana Jaya", type: "Commercial", image: commercialImg },
    ],
    faqs: [
      { q: "Do you do renovations in all PJ areas?", a: "Yes. We cover SS2, Damansara, Kelana Jaya, PJ New Town, Section 17, Taman SEA, SS15, Tropicana, and all surrounding areas in Petaling Jaya." },
      { q: "Can an office renovation in PJ be assessed?", a: "Yes. Share the floor plan or photos, area, headcount, business use, management guide, M&E needs, and intended timing for an initial scope review." },
      { q: "What affects terrace house renovation cost in PJ?", a: "Terrace house renovation cost in PJ depends on size, structure, wiring, plumbing, materials, and confirmed scope." },
    ],
  },
  "cheras": {
    name: "Cheras",
    slug: "cheras",
    metaTitle: "Renovation Planning Cheras | Homes, Condos & Shops | FLASH CAST",
    description: "Plan renovation, interior layouts, built-in storage, and selected fit-out scope for homes, condos, and commercial spaces in Cheras.",
    intro: "Cheras includes older landed homes, strata properties, and commercial units. Existing wiring, plumbing, moisture, structure, access, management rules, and retained finishes should be reviewed before defining scope.",
    propertyTypes: ["Older terrace houses (Taman Connaught, Taman Midah)", "Modern condominiums (EkoCheras, Southgate)", "Apartments and flats", "Shop lots along Jalan Cheras", "Commercial units"],
    commonNeeds: ["Older terrace house modernization with rewiring and replumbing", "Kitchen and bathroom renovation for aging properties", "Built-in wardrobes and storage maximization", "Condo interior design for new units", "Shop lot renovation for F&B and retail"],
    constructionNotes: "Older properties may need additional checks for electrical wiring, plumbing, moisture, waterproofing, roof condition, structure, and previous alterations. Requirements depend on the real site and proposed work.",
    projects: [
      { title: "Terrace House Renovation in Cheras", type: "Residential", image: residentialImg },
      { title: "Custom Built-In Cabinets in Taman Connaught", type: "Built-In", image: kitchenImg },
    ],
    faqs: [
      { q: "Do you serve all areas in Cheras?", a: "Yes. We cover Taman Connaught, Taman Midah, Cheras Leisure Mall area, Taman Segar, Batu 9, Taman Yulek, Bandar Tun Razak, and all Cheras neighborhoods." },
      { q: "Can an older terrace house in Cheras be assessed?", a: "Yes. The site should first be reviewed for existing alterations, wiring, plumbing, moisture, roof, structure, access, and the intended renovation scope." },
      { q: "What affects renovation cost in Cheras?", a: "Property size, existing condition, demolition, repairs, services, materials, access, approvals, and confirmed scope all affect the quotation." },
    ],
  },
  "mont-kiara": {
    name: "Mont Kiara",
    slug: "mont-kiara",
    metaTitle: "Mont Kiara Condo Renovation Planning | FLASH CAST",
    description: "Plan a Mont Kiara condo renovation with attention to layout, built-ins, materials, building rules, access, protection, and quotation scope.",
    intro: "Mont Kiara includes high-rise condominiums with building-specific access, protection, work-hour, delivery, deposit, and document requirements. Confirm the exact management guide and unit condition before planning work.",
    propertyTypes: ["Premium condominiums (i-Zen, 28 Mont Kiara, Arcoris)", "Serviced apartments (Solaris Dutamas)", "Penthouse units", "Landed properties in surrounding areas"],
    commonNeeds: ["Condo renovation scope planning", "Walk-in wardrobe and storage planning", "Kitchen layout, countertop, and cabinet review", "Feature-wall and material direction", "Lighting and smart-system coordination", "Bedroom and bathroom planning"],
    constructionNotes: "Rules differ by development. Obtain the current guide for the exact building and confirm approved hours, protection, lift booking, deliveries, deposits, drawings, forms, insurance, and contractor documents.",
    projects: [
      { title: "Luxury Condo Renovation in i-Zen", type: "Residential", image: residentialImg },
      { title: "Premium Kitchen in Solaris Dutamas", type: "Built-In", image: kitchenImg },
    ],
    faqs: [
      { q: "Can you assess a Mont Kiara condo renovation?", a: "Yes. Share the building name, unit condition, management requirements, and intended scope so access, protection, and approval needs can be reviewed before quotation." },
      { q: "Can stone, timber, acrylic, or artistic wall finishes be discussed?", a: "Yes. Suitability depends on the exact product, substrate, sample approval, installation detail, maintenance needs, building access, and confirmed quotation scope." },
      { q: "What affects Mont Kiara condo renovation cost?", a: "Mont Kiara condo renovation cost depends on size, material selection, management requirements, and confirmed scope." },
    ],
  },
  "bangsar": {
    name: "Bangsar",
    slug: "bangsar",
    metaTitle: "Renovation Services Bangsar | Interior Design Bangsar South | FLASH CAST",
    description: "Renovation services in Bangsar and Bangsar South. Interior design, shop renovation, F&B fit-out, and residential renovation by FLASH CAST SDN. BHD.",
    intro: "Bangsar includes older landed properties, strata homes, shophouses, F&B units, and offices. Planning should account for the existing building, neighbours, access, operations, services, approvals, and the intended character of the space.",
    propertyTypes: ["Heritage bungalows and semi-detached houses", "Modern condominiums (Bangsar South, The Vertical)", "Shophouses along Jalan Telawi", "F&B outlets and cafés", "Office units in Bangsar South towers"],
    commonNeeds: ["Heritage home renovation preserving character", "Modern condo interior redesign", "Café and restaurant fit-out", "Shop renovation on Jalan Telawi", "Boutique retail interior", "Custom built-in furniture for character homes"],
    constructionNotes: "Older properties, strata developments, and F&B premises can have different planning, management, landlord, fire-safety, ventilation, drainage, signage, or authority requirements. Confirm the current rules for the exact property and use.",
    projects: [
      { title: "Semi-D Renovation in Bangsar", type: "Residential", image: residentialImg },
      { title: "Café Fit-Out in Bangsar South", type: "Commercial", image: commercialImg },
    ],
    faqs: [
      { q: "Can older and newer Bangsar properties be assessed?", a: "Yes. The review should identify existing condition, structure, services, access, management or neighbour constraints, and the intended scope." },
      { q: "Can an F&B or retail fit-out in Bangsar be discussed?", a: "Yes. Share the business use, tenancy condition, floor plan, landlord or management guide, equipment, services, and intended opening direction for a scope review." },
      { q: "What should be checked for parking and material delivery?", a: "Confirm loading access, lift or stair route, delivery booking, protection, approved hours, vehicle limits, storage, and disruption controls with the relevant property manager." },
    ],
  },
  "subang-jaya": {
    name: "Subang Jaya",
    slug: "subang-jaya",
    metaTitle: "Renovation Company Subang Jaya | USJ, SS Areas | FLASH CAST",
    description: "Plan residential or commercial renovation, built-in storage, and interior fit-out scope in Subang Jaya based on site condition and current requirements.",
    intro: "Subang Jaya includes landed homes, strata properties, shop lots, and office units. The site condition, local requirements, management or landlord rules, access, services, and intended scope should be reviewed together.",
    propertyTypes: ["Double-storey terrace houses (USJ, SS areas)", "Semi-detached and bungalows", "Condominiums (Sunway area)", "Shop lots and commercial units", "Office spaces"],
    commonNeeds: ["Family home renovation and modernization", "Kitchen and bathroom upgrade for older terraces", "Double-storey house extension", "Shop lot renovation for new businesses", "Built-in furniture for growing families", "Home office setup"],
    constructionNotes: "For extensions, structural or external work, identify the current relevant authority and required qualified parties. Strata and commercial properties may also have separate management or landlord requirements.",
    projects: [
      { title: "Double-Storey House Renovation in USJ", type: "Residential", image: residentialImg },
      { title: "Retail Shop Fit-Out in Subang", type: "Commercial", image: commercialImg },
    ],
    faqs: [
      { q: "Do you cover USJ and SS areas in Subang Jaya?", a: "Yes. We serve all areas in Subang Jaya including USJ 1-27, SS15, SS16, SS17, SS18, SS19, Sunway, Putra Heights, and surrounding neighborhoods." },
      { q: "Can a landed-house extension in Subang be assessed?", a: "Yes. Share the existing condition and proposed changes so structural, consultant, authority, access, neighbour, and quotation requirements can be identified." },
      { q: "What affects a terrace-house renovation timeline?", a: "Confirmed scope, site condition, approvals, structural or service work, materials, access, sequencing, and change requests all affect timing." },
    ],
  },
  "puchong": {
    name: "Puchong",
    slug: "puchong",
    metaTitle: "Renovation Company Puchong | Home, Office & Shop Renovation | FLASH CAST",
    description: "Discuss renovation planning in Puchong for landed homes, condos, offices, shops, and selected commercial spaces based on the real site and scope.",
    intro: "Puchong has a strong mix of family homes, new condominiums, shop lots, and light commercial spaces. FLASH CAST supports homeowners and business owners with practical renovation planning, custom built-in work, waterproofing, electrical upgrades, office fit-outs, and shop renovations across Bandar Puchong Jaya, Bandar Puteri, IOI Boulevard, Taman Kinrara, and surrounding areas.",
    propertyTypes: ["Double-storey terrace houses", "Condominiums and serviced apartments", "Shop lots and retail units", "Offices around IOI Boulevard and Bandar Puteri", "Light industrial and warehouse units"],
    commonNeeds: ["Kitchen and bathroom renovation", "Full landed house refurbishment", "Custom built-in cabinets and wardrobes", "Retail shop and office fit-out", "Waterproofing and repair works", "Space planning for growing families"],
    constructionNotes: "Most Puchong landed house extensions require local council checks, while strata properties need management approval before work starts. FLASH CAST helps coordinate site measurement, renovation scope, material planning, and required approval documents before construction begins.",
    projects: [
      { title: "Home Office Renovation in Puchong", type: "Residential", image: residentialImg },
      { title: "Retail Fit-Out near Bandar Puteri", type: "Commercial", image: commercialImg },
      { title: "Kitchen Cabinet Upgrade in Taman Kinrara", type: "Built-In", image: kitchenImg },
    ],
    faqs: [
      { q: "Do you provide renovation service in all Puchong areas?", a: "Yes. We cover Bandar Puchong Jaya, Bandar Puteri, Taman Kinrara, Puchong South, IOI Boulevard, and nearby Klang Valley areas." },
      { q: "Can a Puchong terrace-house renovation be phased while occupied?", a: "It may be possible for limited scopes, but dust, noise, safety, services, access, protection, and sequencing must be reviewed first. Some work may require temporary vacancy." },
      { q: "Can site measurement be arranged in Puchong?", a: "Site measurement in Puchong can be arranged based on project type, access, and schedule." },
    ],
  },
};
