import { CategoryItem } from "./types";

/**
 * Mock categories data — unified category system for services, materials, and projects.
 * In production, this will be managed via a backend admin panel.
 */
export const categoriesData: CategoryItem[] = [
  // Service categories
  { id: "cat-svc-1", name: "Interior Design & Renovation", slug: "renovation", type: "service", description: "Full interior design and renovation services for residential spaces", sortOrder: 1, isActive: true },
  { id: "cat-svc-2", name: "Commercial Renovation", slug: "commercial", type: "service", description: "Office, retail, and F&B renovation and fit-out", sortOrder: 2, isActive: true },
  { id: "cat-svc-3", name: "Custom Built-In Furniture", slug: "builtin", type: "service", description: "Custom wardrobes, kitchen cabinets, TV consoles, and storage", sortOrder: 3, isActive: true },
  { id: "cat-svc-4", name: "Exterior & Shopfront Works", slug: "exterior", type: "service", description: "Shopfront renovation, signage, and facade works", sortOrder: 4, isActive: true },
  { id: "cat-svc-5", name: "Warehouse & Shelving", slug: "warehouse", type: "service", description: "Industrial racking, shelving, and warehouse setup", sortOrder: 5, isActive: true },
  { id: "cat-svc-6", name: "Design & Permit Coordination", slug: "design", type: "service", description: "Architectural drawings, 3D design, and permit applications", sortOrder: 6, isActive: true },

  // Material categories
  { id: "cat-mat-1", name: "Flooring", slug: "flooring", type: "material", description: "SPC vinyl, laminate, engineered wood, and tile flooring", sortOrder: 1, isActive: true },
  { id: "cat-mat-2", name: "Tiles", slug: "tiles", type: "material", description: "Porcelain, ceramic, and decorative tiles", sortOrder: 2, isActive: true },
  { id: "cat-mat-3", name: "Doors", slug: "doors", type: "material", description: "Solid timber, laminate, and barn doors", sortOrder: 3, isActive: true },
  { id: "cat-mat-4", name: "Glass Doors", slug: "glass-doors", type: "material", description: "Sliding, swing, and frameless glass doors", sortOrder: 4, isActive: true },
  { id: "cat-mat-5", name: "Cabinets", slug: "cabinets", type: "material", description: "Kitchen cabinets, wardrobes, and custom storage", sortOrder: 5, isActive: true },
  { id: "cat-mat-6", name: "Boards & Panels", slug: "boards-panels", type: "material", description: "Feature wall panels, fluted panels, and timber cladding", sortOrder: 6, isActive: true },

  // Project type categories
  { id: "cat-proj-1", name: "Residential", slug: "residential", type: "project", description: "Home and condo renovation projects", sortOrder: 1, isActive: true },
  { id: "cat-proj-2", name: "Commercial", slug: "commercial-project", type: "project", description: "Office, retail, and F&B projects", sortOrder: 2, isActive: true },
  { id: "cat-proj-3", name: "Built-In", slug: "built-in", type: "project", description: "Custom furniture and built-in projects", sortOrder: 3, isActive: true },
  { id: "cat-proj-4", name: "Warehouse", slug: "warehouse-project", type: "project", description: "Industrial and warehouse projects", sortOrder: 4, isActive: true },
  { id: "cat-proj-5", name: "Exterior", slug: "exterior-project", type: "project", description: "Shopfront and exterior works", sortOrder: 5, isActive: true },
];
