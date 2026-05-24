/**
 * Mock data types and structures for FLASH CAST website.
 * All data is static mock — ready to be replaced with API/DB calls later.
 * 
 * Modules:
 * - Services: renovation service categories
 * - Materials: material library items
 * - Projects: completed project showcases
 * - Blog: articles and insights
 * - Leads: customer enquiry submissions
 * - Quotations: quote request submissions
 * - Categories: unified category system
 */

// ============ SERVICES ============
export interface ServiceItem {
  id: string;                // unique identifier, e.g. "svc-1"
  title: string;             // service name, e.g. "Interior Renovation"
  slug: string;              // URL slug, e.g. "renovation"
  summary: string;           // short description for listing
  description: string;       // full description for detail page
  suitableFor: string[];     // target customer types
  commonProjects: string[];  // typical project examples
  processSteps: { title: string; desc: string }[]; // step-by-step process
  items: string[];           // sub-items / scope list
  faqs: { q: string; a: string }[]; // service-specific FAQs
  image: string;             // hero image URL
}

// ============ MATERIALS ============
export interface MaterialItem {
  id: string;                // unique identifier, e.g. "floor-1"
  name: string;              // material name, e.g. "SPC Vinyl Flooring"
  slug: string;              // URL slug
  category: string;          // parent category name
  subcategory: string;       // subcategory slug
  type: string;              // material type, e.g. "SPC Vinyl"
  color: string;             // color / finish name
  texture: string;           // texture description
  suitableSpaces: string[];  // recommended spaces
  recommendedPairing: string; // design pairing suggestion
  description: string;       // detailed description
  note: string;              // additional notes (MOQ, lead time, etc.)
  image: string;             // product image URL
}

export interface MaterialSubcategory {
  name: string;              // subcategory name, e.g. "Kitchen Cabinets"
  slug: string;              // URL slug
  description: string;       // subcategory description
  image: string;             // subcategory thumbnail
}

export interface MaterialCategory {
  name: string;              // category name, e.g. "Whole House Custom"
  slug: string;              // URL slug
  description: string;       // category description
  image: string;             // category thumbnail
  subcategories: MaterialSubcategory[]; // subcategories
  items: MaterialItem[];     // materials in this category
}

// ============ PROJECTS ============
export interface ProjectItem {
  id: string;                // unique identifier, e.g. "proj-1"
  slug: string;              // URL slug
  title: string;             // project title
  type: string;              // project type: Residential, Commercial, etc.
  location: string;          // project location
  description: string;       // full project description
  clientNeed: string;        // what the client needed
  materialsUsed: string[];   // materials used in the project
  scope: string[];           // scope of work items
  highlights: string[];      // key highlights / features
  duration: string;          // project duration, e.g. "8 weeks"
  testimonial?: string;      // optional client testimonial
  images: string[];          // gallery image URLs
  thumbnail: string;         // thumbnail image URL
}

// ============ BLOG ============
export interface BlogPost {
  id: string;                // unique identifier
  slug: string;              // URL slug
  title: string;             // article title
  excerpt: string;           // short excerpt for listing
  content: string;           // full article content (HTML or markdown)
  category: string;          // article category
  date: string;              // publish date string
  readTime: string;          // estimated read time
  image: string;             // featured image URL
  tags: string[];            // article tags
}

// ============ LEADS (Customer Enquiries) ============
export interface LeadItem {
  id: string;                // unique identifier, e.g. "lead-1"
  name: string;              // customer name
  phone: string;             // phone / WhatsApp number
  email: string;             // email address
  message: string;           // enquiry message
  source: string;            // lead source: "website", "whatsapp", "referral", "google_ads"
  serviceInterest: string;   // which service they're interested in
  status: "new" | "contacted" | "quoted" | "converted" | "closed"; // lead status
  createdAt: string;         // submission date ISO string
  notes?: string;            // internal notes
}

// ============ QUOTATIONS (Quote Requests) ============
export interface QuotationItem {
  id: string;                // unique identifier, e.g. "quote-1"
  leadId?: string;           // linked lead ID (optional)
  customerName: string;      // customer name
  customerPhone: string;     // customer phone
  customerEmail: string;     // customer email
  projectType: string;       // e.g. "Residential Renovation", "Kitchen Cabinet"
  location: string;          // project location
  propertySize?: string;     // property size, e.g. "1,200 sqft"
  projectDetails: string;    // description of requirements
  attachments: string[];     // uploaded file URLs
  status: "pending" | "site_visit_scheduled" | "quoted" | "accepted" | "rejected"; // quote status
  estimatedBudget?: string;  // estimated budget range
  quotedAmount?: number;     // final quoted amount (MYR)
  validUntil?: string;       // quote validity date
  createdAt: string;         // submission date ISO string
  updatedAt: string;         // last update date
}

// ============ CATEGORIES (Unified Category System) ============
export interface CategoryItem {
  id: string;                // unique identifier, e.g. "cat-1"
  name: string;              // category name, e.g. "Flooring"
  slug: string;              // URL slug
  type: "service" | "material" | "project"; // which module this category belongs to
  description: string;       // category description
  image?: string;            // category thumbnail
  parentId?: string;         // parent category ID for subcategories (nullable)
  sortOrder: number;         // display order
  isActive: boolean;         // whether category is visible
}
