import { ProjectItem } from "./types";

import proj1Img1 from "@/assets/projects/proj1-condo-1.jpg";
import proj1Img2 from "@/assets/projects/proj1-condo-2.jpg";
import proj2Img1 from "@/assets/projects/proj2-office-1.jpg";
import proj2Img2 from "@/assets/projects/proj2-office-2.jpg";
import proj3Img1 from "@/assets/projects/proj3-kitchen-1.jpg";
import proj3Img2 from "@/assets/projects/proj3-kitchen-2.jpg";
import proj4Img1 from "@/assets/projects/proj4-warehouse-1.jpg";
import proj4Img2 from "@/assets/projects/proj4-warehouse-2.jpg";
import proj5Img1 from "@/assets/projects/proj5-shopfront-1.jpg";
import proj5Img2 from "@/assets/projects/proj5-shopfront-2.jpg";
import proj6Img1 from "@/assets/projects/proj6-bedroom-1.jpg";
import proj6Img2 from "@/assets/projects/proj6-bedroom-2.jpg";
import proj7Img1 from "@/assets/projects/proj7-restaurant-1.jpg";
import proj7Img2 from "@/assets/projects/proj7-restaurant-2.jpg";
import proj8Img1 from "@/assets/projects/proj8-homeoffice-1.jpg";
import proj8Img2 from "@/assets/projects/proj8-homeoffice-2.jpg";

export const projectsData: ProjectItem[] = [
  {
    id: "proj-1",
    slug: "modern-condo-mont-kiara",
    title: "Modern Condo Full Renovation",
    type: "Residential",
    location: "Mont Kiara, Kuala Lumpur",
    description: "Complete renovation of a 1,500 sqft condo including custom built-in wardrobes, kitchen cabinets, feature wall, new flooring, and full electrical rewiring. The client wanted a modern minimalist design with warm wood tones.",
    clientNeed: "The homeowner wanted to transform a dated unit into a modern living space with maximum storage and clean lines.",
    materialsUsed: ["SPC Vinyl Flooring - Natural Oak", "Melamine Cabinet - Grey Oak", "Fluted Panel - Charcoal", "Porcelain Tile 60x60 - Carrara White"],
    scope: ["Custom Wardrobes", "Kitchen Cabinets", "TV Feature Wall", "SPC Vinyl Flooring", "Ceiling & Lighting", "Electrical Rewiring", "Painting"],
    highlights: ["Open-concept kitchen with island counter", "Walk-in wardrobe with LED lighting", "Hidden storage in every room", "Smart home lighting controls"],
    duration: "8 weeks",
    testimonial: "FLASH CAST turned our old condo into a dream home. The attention to detail was impressive, and the project was delivered on time.",
    images: [proj1Img1, proj1Img2],
    thumbnail: proj1Img1,
  },
  {
    id: "proj-2",
    slug: "corporate-office-petaling-jaya",
    title: "Corporate Office Fit-Out",
    type: "Commercial",
    location: "Petaling Jaya, Selangor",
    description: "Full office renovation for a 3,000 sqft corporate office including glass partitions, meeting rooms, pantry, reception counter, and 50 workstations. The design focused on a professional, modern aesthetic with good acoustics.",
    clientNeed: "A growing tech company needed a professional workspace that accommodates 50 staff with meeting rooms, a pantry, and a welcoming reception area.",
    materialsUsed: ["Laminate Flooring - Grey Stone", "Frameless Glass Door - Clear", "Acrylic Cabinet - High Gloss White"],
    scope: ["Glass Partitioning", "Ceiling & Lighting", "Flooring", "Custom Reception Counter", "Pantry & Washroom", "Electrical & Data Cabling", "Air-Conditioning"],
    highlights: ["Glass-enclosed meeting rooms for privacy", "Open-plan workstation layout", "Custom reception with backlit signage", "Integrated cable management"],
    duration: "10 weeks",
    testimonial: "Professional team, excellent communication, and the office looks amazing. Our staff love the new workspace.",
    images: [proj2Img1, proj2Img2],
    thumbnail: proj2Img1,
  },
  {
    id: "proj-3",
    slug: "custom-kitchen-bangsar",
    title: "Custom Kitchen & Built-In Cabinets",
    type: "Built-In",
    location: "Bangsar, Kuala Lumpur",
    description: "Complete kitchen renovation with custom cabinets, quartz countertop, and integrated appliances. Also included built-in shoe cabinet at the entrance and TV console in the living room.",
    clientNeed: "The client wanted a modern kitchen with maximum storage, a large island for dining, and matching built-in furniture throughout the home.",
    materialsUsed: ["Acrylic Cabinet - High Gloss White", "Solid Timber Door - Walnut", "Porcelain Tile 60x60 - Carrara White"],
    scope: ["Kitchen Cabinets (upper & lower)", "Quartz Countertop", "Kitchen Island", "Shoe Cabinet", "TV Console", "Tiling"],
    highlights: ["Handleless cabinet design for clean lines", "Quartz waterfall island counter", "Built-in appliance integration", "Soft-close on all doors and drawers"],
    duration: "5 weeks",
    images: [proj3Img1, proj3Img2],
    thumbnail: proj3Img1,
  },
  {
    id: "proj-4",
    slug: "warehouse-racking-shah-alam",
    title: "Industrial Warehouse Racking Setup",
    type: "Warehouse",
    location: "Shah Alam, Selangor",
    description: "Design and installation of a complete warehouse racking system for a 10,000 sqft logistics warehouse. The solution included heavy-duty pallet racking, medium-duty shelving, and a dedicated packing area.",
    clientNeed: "A logistics company needed to maximize storage capacity in their warehouse while maintaining efficient picking and packing workflows.",
    materialsUsed: ["Heavy-duty pallet racking", "Medium-duty shelving", "Wire mesh decking", "Industrial safety barriers"],
    scope: ["Warehouse Layout Design", "Heavy-Duty Pallet Racking", "Medium-Duty Shelving", "Packing Station Setup", "Safety Barriers", "Signage"],
    highlights: ["Increased storage capacity by 300%", "Clear aisle layout for forklift access", "Dedicated packing and dispatch area", "Safety barriers at all column bases"],
    duration: "3 weeks",
    images: [proj4Img1, proj4Img2],
    thumbnail: proj4Img1,
  },
  {
    id: "proj-5",
    slug: "shopfront-renovation-cheras",
    title: "Retail Shopfront Renovation",
    type: "Exterior",
    location: "Cheras, Kuala Lumpur",
    description: "Complete shopfront renovation including new glass façade, 3D signage with LED backlight, roller shutter replacement, and interior retail display setup.",
    clientNeed: "A retail business wanted to modernize their shopfront to attract more foot traffic and create a stronger brand presence on the street.",
    materialsUsed: ["Aluminium composite panel", "Tempered glass", "3D acrylic lettering", "LED strip lighting"],
    scope: ["Shopfront Glass Works", "3D Signage Fabrication & Installation", "Roller Shutter Replacement", "Interior Display Counter", "Exterior Painting", "Electrical"],
    highlights: ["Eye-catching LED backlit signage", "Full glass facade for product visibility", "Matching interior and exterior design language", "Completed within tight timeline"],
    duration: "4 weeks",
    images: [proj5Img1, proj5Img2],
    thumbnail: proj5Img1,
  },
  {
    id: "proj-6",
    slug: "luxury-master-bedroom-damansara",
    title: "Luxury Master Bedroom Suite",
    type: "Residential",
    location: "Damansara Heights, Kuala Lumpur",
    description: "A luxury master bedroom renovation featuring a walk-in wardrobe with LED-lit shelving, feature wall with hidden lighting, custom vanity table, and premium flooring.",
    clientNeed: "The homeowner wanted a hotel-quality master suite with custom storage, ambient lighting, and premium finishes.",
    materialsUsed: ["Engineered Wood - Walnut Herringbone", "Fluted Panel - Charcoal", "Melamine Cabinet - Grey Oak"],
    scope: ["Walk-In Wardrobe", "Feature Wall with Hidden Lighting", "Custom Vanity", "Engineered Wood Flooring", "Ceiling & Downlights", "Painting"],
    highlights: ["Walk-in wardrobe with sensor-activated LED lighting", "Charcoal fluted feature wall as bed backdrop", "Herringbone flooring for luxury feel", "Integrated bedside USB charging"],
    duration: "4 weeks",
    testimonial: "The bedroom feels like a five-star hotel. FLASH CAST understood exactly what we wanted.",
    images: [proj6Img1, proj6Img2],
    thumbnail: proj6Img1,
  },
  {
    id: "proj-7",
    slug: "restaurant-fitout-subang",
    title: "F&B Restaurant Fit-Out",
    type: "Commercial",
    location: "Subang Jaya, Selangor",
    description: "Full restaurant renovation including commercial kitchen setup, dining area interior design, bar counter, feature ceiling, and signage. Designed for a modern casual dining concept.",
    clientNeed: "An F&B operator launching a new casual dining restaurant needed a complete fit-out from bare unit to opening day.",
    materialsUsed: ["Wood-Look Tile", "Timber Cladding - Oak", "Subway Tile - White Glossy"],
    scope: ["Commercial Kitchen Setup", "Dining Area Design", "Bar Counter", "Feature Ceiling", "Flooring & Tiling", "Electrical & Plumbing", "Signage"],
    highlights: ["Open kitchen concept with glass partition", "Timber cladding feature wall", "Custom bar counter with stone top", "Subway tile kitchen backsplash"],
    duration: "8 weeks",
    images: [proj7Img1, proj7Img2],
    thumbnail: proj7Img1,
  },
  {
    id: "proj-8",
    slug: "home-office-puchong",
    title: "Home Office Built-In Solution",
    type: "Office",
    location: "Puchong, Selangor",
    description: "Custom home office renovation featuring a built-in desk with cable management, bookshelf wall, overhead cabinets, and a reading nook with window seat.",
    clientNeed: "A remote worker needed a dedicated home office that maximizes a small bedroom into a productive workspace.",
    materialsUsed: ["Melamine Cabinet - Grey Oak", "SPC Vinyl Flooring - Natural Oak", "Laminate Door - White Oak"],
    scope: ["Built-In Desk", "Bookshelf Wall", "Overhead Cabinets", "Window Seat", "Flooring", "Lighting"],
    highlights: ["Integrated cable management system", "Floor-to-ceiling bookshelf with LED strips", "Window seat with hidden storage", "Acoustic panel on one wall"],
    duration: "3 weeks",
    images: [proj8Img1, proj8Img2],
    thumbnail: proj8Img1,
  },
];
