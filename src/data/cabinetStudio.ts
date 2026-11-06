// Reviewed design-reference catalogue; availability and construction require sample confirmation.
export const studioStyles = [
  {
    "id": "modern",
    "door": "flat",
    "handles": "hidden",
    "doors": [
      "flat",
      "slim"
    ],
    "prompt": "Warm-white flat doors, recessed handleless profiles, perfectly aligned joinery"
  },
  {
    "id": "cream",
    "door": "flat",
    "handles": "hidden",
    "doors": [
      "flat",
      "slim"
    ],
    "prompt": "Cream flat doors with soft rounded end panels, quiet minimal detailing"
  },
  {
    "id": "natural",
    "door": "flat",
    "handles": "nickel",
    "doors": [
      "flat",
      "slim"
    ],
    "prompt": "Continuous vertical natural timber grain, generous open shelves, slim timber pulls"
  },
  {
    "id": "wabi",
    "door": "flat",
    "handles": "hidden",
    "doors": [
      "flat",
      "slim"
    ],
    "prompt": "Quiet low-profile cabinetry, tactile muted wood, asymmetric open niches"
  },
  {
    "id": "nordic",
    "door": "slim",
    "handles": "nickel",
    "doors": [
      "slim",
      "flat"
    ],
    "prompt": "Slim shaker fronts, light airy proportions, small brushed nickel pulls"
  },
  {
    "id": "oriental",
    "door": "reeded",
    "handles": "brass",
    "doors": [
      "reeded",
      "flat",
      "frame"
    ],
    "prompt": "Symmetrical compositions with restrained vertical timber slats and narrow bronze pulls"
  },
  {
    "id": "chinese",
    "door": "lattice",
    "handles": "brass",
    "doors": [
      "lattice",
      "flat",
      "frame"
    ],
    "prompt": "Traditional Chinese framed cabinet doors, subtle geometric lattice detail, bronze round pulls"
  },
  {
    "id": "european",
    "door": "slim",
    "handles": "brass",
    "doors": [
      "slim",
      "flat",
      "frame"
    ],
    "prompt": "Elegant narrow framed doors, understated fine cornice, slim brass pulls"
  },
  {
    "id": "classic",
    "door": "classic",
    "handles": "brass",
    "doors": [
      "classic",
      "flat",
      "frame"
    ],
    "prompt": "European raised-panel cabinet fronts, layered frames, decorative crown cornice and warm brass pulls"
  },
  {
    "id": "french",
    "door": "frame",
    "handles": "brass",
    "doors": [
      "frame",
      "flat"
    ],
    "prompt": "Delicate French panel mouldings, small aged brass knobs, refined cabinet proportions"
  },
  {
    "id": "midcentury",
    "door": "frame",
    "handles": "brass",
    "doors": [
      "frame",
      "flat"
    ],
    "prompt": "Walnut flat fronts mixed with slim framed doors, brass linear pulls, mid-century proportions"
  },
  {
    "id": "italian",
    "door": "glass",
    "handles": "brass",
    "doors": [
      "glass",
      "flat",
      "frame"
    ],
    "prompt": "Large smoked-timber panels, selective tinted glass upper cabinets, slender metal frames"
  }
] as const;
export type StudioStyle = typeof studioStyles[number]["id"];
export const studioFinishes = [
  {
    "id": "pale-oak",
    "colour": "#C4AA83",
    "kind": "wood",
    "tone": "light",
    "temperature": "warm"
  },
  {
    "id": "warm-oak",
    "colour": "#B58E5E",
    "kind": "wood",
    "tone": "light",
    "temperature": "warm"
  },
  {
    "id": "smoked-oak",
    "colour": "#776454",
    "kind": "wood",
    "tone": "dark",
    "temperature": "warm"
  },
  {
    "id": "grey-oak",
    "colour": "#A8A093",
    "kind": "wood",
    "tone": "light",
    "temperature": "cool"
  },
  {
    "id": "brown-oak",
    "colour": "#886446",
    "kind": "wood",
    "tone": "dark",
    "temperature": "warm"
  },
  {
    "id": "black-oak",
    "colour": "#413B32",
    "kind": "wood",
    "tone": "dark",
    "temperature": "warm"
  },
  {
    "id": "elm",
    "colour": "#BAA383",
    "kind": "wood",
    "tone": "light",
    "temperature": "warm"
  },
  {
    "id": "ash",
    "colour": "#C7B699",
    "kind": "wood",
    "tone": "light",
    "temperature": "warm"
  },
  {
    "id": "maple",
    "colour": "#D7BC92",
    "kind": "wood",
    "tone": "light",
    "temperature": "warm"
  },
  {
    "id": "birch",
    "colour": "#DDD0AE",
    "kind": "wood",
    "tone": "light",
    "temperature": "warm"
  },
  {
    "id": "cherry",
    "colour": "#9D6646",
    "kind": "wood",
    "tone": "dark",
    "temperature": "warm"
  },
  {
    "id": "teak",
    "colour": "#A17A4C",
    "kind": "wood",
    "tone": "dark",
    "temperature": "warm"
  },
  {
    "id": "light-walnut",
    "colour": "#A88461",
    "kind": "wood",
    "tone": "light",
    "temperature": "warm"
  },
  {
    "id": "walnut",
    "colour": "#79553A",
    "kind": "wood",
    "tone": "dark",
    "temperature": "warm"
  },
  {
    "id": "dark-walnut",
    "colour": "#4D372B",
    "kind": "wood",
    "tone": "dark",
    "temperature": "warm"
  },
  {
    "id": "honey-oak",
    "colour": "#C19956",
    "kind": "wood",
    "tone": "light",
    "temperature": "warm"
  },
  {
    "id": "white",
    "colour": "#F0ECE3",
    "kind": "solid",
    "tone": "light",
    "temperature": "warm"
  },
  {
    "id": "cream",
    "colour": "#E8E0D1",
    "kind": "solid",
    "tone": "light",
    "temperature": "warm"
  },
  {
    "id": "ivory",
    "colour": "#EDE7D8",
    "kind": "solid",
    "tone": "light",
    "temperature": "warm"
  },
  {
    "id": "oat",
    "colour": "#D2C3AA",
    "kind": "solid",
    "tone": "light",
    "temperature": "warm"
  },
  {
    "id": "sand",
    "colour": "#C4B69C",
    "kind": "solid",
    "tone": "light",
    "temperature": "warm"
  },
  {
    "id": "cashmere",
    "colour": "#BBB1A3",
    "kind": "solid",
    "tone": "light",
    "temperature": "warm"
  },
  {
    "id": "warm-grey",
    "colour": "#A09D94",
    "kind": "solid",
    "tone": "light",
    "temperature": "warm"
  },
  {
    "id": "graphite",
    "colour": "#454844",
    "kind": "solid",
    "tone": "dark",
    "temperature": "cool"
  },
  {
    "id": "sage",
    "colour": "#A3AD94",
    "kind": "solid",
    "tone": "light",
    "temperature": "cool"
  },
  {
    "id": "ink-blue",
    "colour": "#424F5E",
    "kind": "solid",
    "tone": "dark",
    "temperature": "cool"
  },
  {
    "id": "warm-stone",
    "colour": "#DED6C7",
    "kind": "stone",
    "tone": "light",
    "temperature": "warm"
  },
  {
    "id": "grey-stone",
    "colour": "#C8C8C1",
    "kind": "stone",
    "tone": "light",
    "temperature": "cool"
  },
  {
    "id": "sandstone",
    "colour": "#C8B89E",
    "kind": "stone",
    "tone": "light",
    "temperature": "warm"
  },
  {
    "id": "travertine",
    "colour": "#BFB096",
    "kind": "stone",
    "tone": "light",
    "temperature": "warm"
  },
  {
    "id": "cement",
    "colour": "#ABADA6",
    "kind": "stone",
    "tone": "light",
    "temperature": "cool"
  },
  {
    "id": "black-stone",
    "colour": "#363938",
    "kind": "stone",
    "tone": "dark",
    "temperature": "cool"
  }
] as const;
export type FinishId = typeof studioFinishes[number]["id"];
export type FinishRole = "front" | "body" | "open" | "top";
export type Finishes = Record<FinishRole, FinishId>;
export type Door = "flat" | "slim" | "frame" | "classic" | "lattice" | "reeded" | "glass";
export type Handle = "hidden" | "brass" | "nickel" | "black";
export const studioScenes = ["kitchen", "bedroom", "living", "dining", "entry", "study"] as const;
export type StudioScene = typeof studioScenes[number];
export type CabinetKind = "base" | "wall" | "wardrobe" | "tv" | "shoe" | "sideboard" | "bookcase";
export interface StudioScheme { id:string; style:StudioStyle; variant:number; finishes:Finishes; offerId?:string; }
export const studioSchemes: readonly StudioScheme[] = [
  {
    "id": "modern-1",
    "style": "modern",
    "variant": 1,
    "finishes": {
      "front": "white",
      "body": "smoked-oak",
      "open": "smoked-oak",
      "top": "warm-stone"
    }
  },
  {
    "id": "modern-2",
    "style": "modern",
    "variant": 2,
    "finishes": {
      "front": "cashmere",
      "body": "warm-oak",
      "open": "warm-oak",
      "top": "grey-stone"
    },
    "offerId": "grey-home"
  },
  {
    "id": "modern-3",
    "style": "modern",
    "variant": 3,
    "finishes": {
      "front": "graphite",
      "body": "black-oak",
      "open": "black-oak",
      "top": "travertine"
    }
  },
  {
    "id": "cream-1",
    "style": "cream",
    "variant": 1,
    "finishes": {
      "front": "cream",
      "body": "pale-oak",
      "open": "pale-oak",
      "top": "warm-stone"
    },
    "offerId": "cream-essential"
  },
  {
    "id": "cream-2",
    "style": "cream",
    "variant": 2,
    "finishes": {
      "front": "oat",
      "body": "maple",
      "open": "maple",
      "top": "grey-stone"
    }
  },
  {
    "id": "cream-3",
    "style": "cream",
    "variant": 3,
    "finishes": {
      "front": "ivory",
      "body": "light-walnut",
      "open": "light-walnut",
      "top": "travertine"
    }
  },
  {
    "id": "natural-1",
    "style": "natural",
    "variant": 1,
    "finishes": {
      "front": "pale-oak",
      "body": "white",
      "open": "white",
      "top": "warm-stone"
    },
    "offerId": "natural-home"
  },
  {
    "id": "natural-2",
    "style": "natural",
    "variant": 2,
    "finishes": {
      "front": "elm",
      "body": "cream",
      "open": "cream",
      "top": "grey-stone"
    }
  },
  {
    "id": "natural-3",
    "style": "natural",
    "variant": 3,
    "finishes": {
      "front": "light-walnut",
      "body": "oat",
      "open": "oat",
      "top": "travertine"
    }
  },
  {
    "id": "wabi-1",
    "style": "wabi",
    "variant": 1,
    "finishes": {
      "front": "grey-oak",
      "body": "sand",
      "open": "sand",
      "top": "sandstone"
    }
  },
  {
    "id": "wabi-2",
    "style": "wabi",
    "variant": 2,
    "finishes": {
      "front": "sand",
      "body": "grey-oak",
      "open": "grey-oak",
      "top": "travertine"
    }
  },
  {
    "id": "wabi-3",
    "style": "wabi",
    "variant": 3,
    "finishes": {
      "front": "ash",
      "body": "oat",
      "open": "oat",
      "top": "warm-stone"
    }
  },
  {
    "id": "nordic-1",
    "style": "nordic",
    "variant": 1,
    "finishes": {
      "front": "white",
      "body": "birch",
      "open": "birch",
      "top": "warm-stone"
    }
  },
  {
    "id": "nordic-2",
    "style": "nordic",
    "variant": 2,
    "finishes": {
      "front": "sage",
      "body": "pale-oak",
      "open": "pale-oak",
      "top": "grey-stone"
    }
  },
  {
    "id": "nordic-3",
    "style": "nordic",
    "variant": 3,
    "finishes": {
      "front": "birch",
      "body": "white",
      "open": "white",
      "top": "travertine"
    }
  },
  {
    "id": "oriental-1",
    "style": "oriental",
    "variant": 1,
    "finishes": {
      "front": "walnut",
      "body": "ivory",
      "open": "ivory",
      "top": "warm-stone"
    }
  },
  {
    "id": "oriental-2",
    "style": "oriental",
    "variant": 2,
    "finishes": {
      "front": "elm",
      "body": "sand",
      "open": "sand",
      "top": "grey-stone"
    }
  },
  {
    "id": "oriental-3",
    "style": "oriental",
    "variant": 3,
    "finishes": {
      "front": "warm-grey",
      "body": "dark-walnut",
      "open": "dark-walnut",
      "top": "travertine"
    }
  },
  {
    "id": "chinese-1",
    "style": "chinese",
    "variant": 1,
    "finishes": {
      "front": "dark-walnut",
      "body": "ivory",
      "open": "ivory",
      "top": "sandstone"
    }
  },
  {
    "id": "chinese-2",
    "style": "chinese",
    "variant": 2,
    "finishes": {
      "front": "teak",
      "body": "cream",
      "open": "cream",
      "top": "travertine"
    }
  },
  {
    "id": "chinese-3",
    "style": "chinese",
    "variant": 3,
    "finishes": {
      "front": "cherry",
      "body": "sand",
      "open": "sand",
      "top": "warm-stone"
    }
  },
  {
    "id": "european-1",
    "style": "european",
    "variant": 1,
    "finishes": {
      "front": "ivory",
      "body": "light-walnut",
      "open": "light-walnut",
      "top": "warm-stone"
    }
  },
  {
    "id": "european-2",
    "style": "european",
    "variant": 2,
    "finishes": {
      "front": "warm-grey",
      "body": "white",
      "open": "white",
      "top": "grey-stone"
    }
  },
  {
    "id": "european-3",
    "style": "european",
    "variant": 3,
    "finishes": {
      "front": "pale-oak",
      "body": "ivory",
      "open": "ivory",
      "top": "travertine"
    }
  },
  {
    "id": "classic-1",
    "style": "classic",
    "variant": 1,
    "finishes": {
      "front": "cream",
      "body": "brown-oak",
      "open": "brown-oak",
      "top": "warm-stone"
    }
  },
  {
    "id": "classic-2",
    "style": "classic",
    "variant": 2,
    "finishes": {
      "front": "brown-oak",
      "body": "cream",
      "open": "cream",
      "top": "grey-stone"
    }
  },
  {
    "id": "classic-3",
    "style": "classic",
    "variant": 3,
    "finishes": {
      "front": "ivory",
      "body": "dark-walnut",
      "open": "dark-walnut",
      "top": "travertine"
    }
  },
  {
    "id": "french-1",
    "style": "french",
    "variant": 1,
    "finishes": {
      "front": "cream",
      "body": "light-walnut",
      "open": "light-walnut",
      "top": "warm-stone"
    }
  },
  {
    "id": "french-2",
    "style": "french",
    "variant": 2,
    "finishes": {
      "front": "sage",
      "body": "ivory",
      "open": "ivory",
      "top": "grey-stone"
    }
  },
  {
    "id": "french-3",
    "style": "french",
    "variant": 3,
    "finishes": {
      "front": "light-walnut",
      "body": "cream",
      "open": "cream",
      "top": "travertine"
    }
  },
  {
    "id": "midcentury-1",
    "style": "midcentury",
    "variant": 1,
    "finishes": {
      "front": "walnut",
      "body": "cream",
      "open": "cream",
      "top": "warm-stone"
    },
    "offerId": "walnut-home"
  },
  {
    "id": "midcentury-2",
    "style": "midcentury",
    "variant": 2,
    "finishes": {
      "front": "dark-walnut",
      "body": "warm-grey",
      "open": "warm-grey",
      "top": "grey-stone"
    }
  },
  {
    "id": "midcentury-3",
    "style": "midcentury",
    "variant": 3,
    "finishes": {
      "front": "cherry",
      "body": "oat",
      "open": "oat",
      "top": "travertine"
    }
  },
  {
    "id": "italian-1",
    "style": "italian",
    "variant": 1,
    "finishes": {
      "front": "smoked-oak",
      "body": "warm-grey",
      "open": "warm-grey",
      "top": "warm-stone"
    }
  },
  {
    "id": "italian-2",
    "style": "italian",
    "variant": 2,
    "finishes": {
      "front": "graphite",
      "body": "walnut",
      "open": "walnut",
      "top": "grey-stone"
    }
  },
  {
    "id": "italian-3",
    "style": "italian",
    "variant": 3,
    "finishes": {
      "front": "brown-oak",
      "body": "sand",
      "open": "sand",
      "top": "travertine"
    }
  }
];
export const finishById = (id: FinishId) => studioFinishes.find(item => item.id === id)!;
export const styleById = (id: StudioStyle) => studioStyles.find(item => item.id === id)!;
export const schemeById = (id: string) => studioSchemes.find(item => item.id === id);
export const studioImage = (id:string, scene:StudioScene) => `/images/custom-cabinets/v2/${id}-${scene}.webp`;
export const cabinetDefaults: Record<CabinetKind, { scene:StudioScene; width:number; height:number; depth:number }> = {
base:{scene:"kitchen",width:3048,height:850,depth:600}, wall:{scene:"kitchen",width:3048,height:750,depth:350},
wardrobe:{scene:"bedroom",width:2438,height:2400,depth:600},tv:{scene:"living",width:1829,height:450,depth:400},
shoe:{scene:"entry",width:1219,height:2100,depth:350},sideboard:{scene:"dining",width:1800,height:900,depth:400},bookcase:{scene:"study",width:1800,height:2200,depth:350},
};
