export const cabinetModules = ["kitchen", "wardrobe", "tv", "shoe", "sideboard"] as const;
export type CabinetModule = typeof cabinetModules[number];
export const cabinetScenes = ["kitchen", "bedroom", "living"] as const;
export type CabinetScene = typeof cabinetScenes[number];
export const cabinetStyleIds = ["cream", "natural", "grey", "walnut"] as const;
export type CabinetStyleId = typeof cabinetStyleIds[number];
export const cabinetPackageIds = ["kitchen-wardrobe", "whole-home", "free"] as const;
export type CabinetPackageId = typeof cabinetPackageIds[number];

export const cabinetPackages: Record<CabinetPackageId, readonly CabinetModule[]> = {
  "kitchen-wardrobe": ["kitchen", "wardrobe"],
  "whole-home": ["kitchen", "wardrobe", "tv", "shoe"],
  free: [],
};

export const cabinetPalettes = [
  { id: "cream-oak", style: "cream", colours: ["#E8E0D1", "#BA9770", "#45443B"] },
  { id: "oat-wood", style: "cream", colours: ["#D2C3AA", "#CAA982", "#5A5144"] },
  { id: "oak-white", style: "natural", colours: ["#BE9C72", "#F0ECE3", "#48453D"] },
  { id: "light-walnut", style: "natural", colours: ["#A68466", "#E9E1D2", "#52463C"] },
  { id: "cashmere-oak", style: "grey", colours: ["#BBB1A3", "#AF8E65", "#45453F"] },
  { id: "grey-smoke", style: "grey", colours: ["#A09D94", "#716252", "#363833"] },
  { id: "walnut-cream", style: "walnut", colours: ["#79553A", "#E9E0CE", "#A18A62"] },
  { id: "dark-walnut", style: "walnut", colours: ["#4D372B", "#B2A899", "#91754C"] },
] as const satisfies readonly { id: string; style: CabinetStyleId; colours: readonly string[] }[];

export type CabinetPaletteId = typeof cabinetPalettes[number]["id"];
export const cabinetPaletteFor = (id: CabinetPaletteId) => cabinetPalettes.find((palette) => palette.id === id)!;
export const cabinetPalettesForStyle = (style: CabinetStyleId) => cabinetPalettes.filter((palette) => palette.style === style);
export const cabinetPreviewPath = (palette: CabinetPaletteId, scene: CabinetScene) => `/images/custom-cabinets/v1/${palette}-${scene}.webp`;

export interface CabinetSelection {
  offerId?: import("./cabinetOffers").CabinetOffer["id"];
  packageId: CabinetPackageId;
  styleId: CabinetStyleId;
  paletteId: CabinetPaletteId;
  modules: CabinetModule[];
  scene: CabinetScene;
}
