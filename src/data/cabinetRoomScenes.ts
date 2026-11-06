import { schemeById, styleById, studioImage, type CabinetKind, type FinishRole, type Finishes, type StudioScene, type StudioStyle } from './cabinetStudio';

import { cabinetRoomVariants } from './cabinetRoomVariants';

// Curated surface coordinates on the 512 × 341 reference grid. Each template
// uses one fixed camera; only exposed joinery is admitted into material masks.
export type RoomPoint = readonly [number, number];
export type RoomQuad = readonly [RoomPoint, RoomPoint, RoomPoint, RoomPoint];
export type RoomPolygon = readonly RoomPoint[];
export type RoomRect = readonly [number, number, number, number];
export interface RoomSurface {
  kind: CabinetKind; role: FinishRole; quad: RoomQuad; holes?: readonly RoomPolygon[];
  columns?: number; rows?: number; // For alternate door profiles / hardware.
  panels?: readonly RoomQuad[]; // Individually traced faces; gaps/hardware remain in the source image.
  hardware?: readonly RoomPolygon[]; // Preserved while the original door/handle profile is selected.
  relief?: readonly RoomPolygon[]; // Decorative structure inside a timber panel, distinct from grain.
}
export interface CabinetRoomScene {
  image: string; surfaces: RoomSurface[]; baseline: Finishes;
  baselineDoor: string; baselineHandle: string;
}
export const roomRect = ([x, y, right, bottom]: RoomRect): RoomQuad => [[x, y], [right, y], [right, bottom], [x, bottom]];
const zone = (kind: CabinetKind, role: FinishRole, box: RoomRect, columns?: number, holes?: readonly RoomRect[]): RoomSurface => ({ kind, role, quad: roomRect(box), columns, holes: holes?.map(roomRect) });
function front(kind: CabinetKind, box: RoomRect, columns = 4, holes: readonly RoomRect[] = []): RoomSurface[] {
  return [zone(kind, 'front', box, columns, holes)];
}
function top(kind: CabinetKind, box: RoomRect): RoomSurface {
  return { kind, role: 'top', quad: roomRect(box) };
}
interface KitchenLayout { upper: RoomRect[]; lower: RoomRect; trim?: RoomRect[]; holes?: RoomRect[]; countertop?: RoomRect }
const kitchens: Record<StudioStyle, KitchenLayout> = {
  modern: { upper: [[115,39,342,141],[390,34,475,95]], lower:[73,198,387,262], trim:[[77,32,381,38],[382,22,389,269],[476,24,480,268]], countertop:[72,193,387,197] },
  cream: { upper: [[82,56,330,140]], lower:[73,196,373,253], trim:[[63,56,81,139],[375,55,397,190],[468,57,479,258],[398,55,467,103],[56,196,71,252]], countertop:[55,190,393,194] },
  natural: { upper: [[72,50,261,142],[362,50,417,142]], lower:[63,200,426,265], trim:[[65,42,418,49],[425,48,432,269],[435,45,497,95],[499,45,503,272]], countertop:[60,196,424,201] },
  wabi: { upper:[[80,63,155,147],[192,64,376,147]], lower:[78,207,420,272], trim:[[75,57,420,63],[423,136,431,275]], countertop:[77,200,421,205] },
  nordic: { upper:[[104,55,359,141],[427,45,498,95]], lower:[44,204,421,269], trim:[[47,47,415,54],[421,43,427,279]], countertop:[44,197,422,201] },
  oriental: { upper:[[104,55,249,139],[315,55,401,139]], lower:[55,208,462,266], trim:[[57,47,451,53],[57,55,102,139],[405,55,451,139]], countertop:[54,201,462,206] },
  chinese: { upper:[[86,59,174,137],[249,60,277,137],[363,59,422,137]], lower:[78,197,427,250], trim:[[82,53,422,59],[431,52,436,258]], countertop:[77,191,427,196] },
  european: { upper:[[59,55,106,257],[122,56,193,148],[269,56,410,148],[432,54,471,136]], lower:[115,213,421,262], trim:[[111,48,417,55],[422,48,430,269]], countertop:[114,205,422,211] },
  classic: { upper:[[115,54,153,154],[156,57,251,125],[255,56,405,154]], lower:[51,214,446,267], trim:[[108,43,408,53],[43,205,50,269],[448,153,456,269]], countertop:[50,205,446,211] },
  french: { upper:[[178,73,312,152],[317,73,388,153],[404,72,448,141]], lower:[117,211,396,271], trim:[[114,57,391,66],[400,61,406,276]], countertop:[116,205,397,210] },
  midcentury: { upper:[[96,65,159,151],[234,65,384,151]], lower:[44,207,424,259], trim:[[92,57,421,64],[425,57,433,264]], countertop:[43,200,424,205] },
  italian: { upper:[[47,54,116,256],[251,54,339,143]], lower:[119,206,438,258], trim:[[42,46,440,54],[476,55,480,273]], countertop:[118,199,438,204] },
};
interface BedroomLayout { doors: RoomRect[]; holes?: RoomRect[]; trim?: RoomRect[]; open?: RoomRect[] }
const bedrooms: Record<StudioStyle, BedroomLayout> = {
  modern: { doors:[[84,39,236,251],[311,39,440,251],[239,202,308,251]], holes:[[77,237,210,260]], trim:[[83,32,441,38],[441,25,477,261]], open:[[240,40,307,48],[242,93,306,99]] },
  cream: { doors:[[102,52,182,250],[223,52,399,250]], trim:[[80,53,101,232],[400,53,426,250],[184,199,220,250]], open:[[186,72,219,88]] },
  natural: { doors:[[73,51,345,251],[350,196,463,251]], holes:[[70,215,154,264]], trim:[[70,45,464,50],[464,47,471,258]], open:[[353,53,458,65]] },
  wabi: { doors:[[64,54,269,242],[316,54,444,242]], trim:[[57,37,487,53],[444,54,448,242],[270,197,314,242]], open:[[272,59,311,67]] },
  nordic: { doors:[[127,54,246,259],[247,39,447,72],[322,73,447,259],[250,196,318,257]], holes:[[123,236,204,264]], trim:[[121,48,127,263],[449,36,472,266]], open:[[252,81,317,91]] },
  oriental: { doors:[[89,49,232,245],[280,49,425,245],[236,176,276,245]], holes:[[82,222,232,255]], trim:[[86,41,427,49],[428,48,435,251]], open:[[239,57,273,71]] },
  chinese: { doors:[[156,47,278,253],[347,47,467,253],[282,211,342,253]], trim:[[151,39,470,47],[156,255,469,261]], open:[[283,51,340,65]] },
  european: { doors:[[84,43,370,253],[374,199,457,253]], holes:[[80,223,169,263]], trim:[[79,33,464,42],[79,254,464,261]], open:[[376,50,455,63]] },
  classic: { doors:[[114,51,244,246],[335,51,450,246],[251,204,328,246]], holes:[[110,227,215,258]], trim:[[102,37,456,47],[107,250,458,260]], open:[[254,91,325,105]] },
  french: { doors:[[198,81,451,258],[198,42,451,78]], holes:[[188,247,276,270]], trim:[[192,30,458,40],[453,44,464,266]], open:[[90,58,190,69]] },
  midcentury: { doors:[[75,35,149,226],[151,35,222,226],[302,35,411,244],[226,189,299,244]], holes:[[68,211,177,257]], trim:[[69,28,453,34],[414,35,420,251]], open:[[228,38,295,52]] },
  italian: { doors:[[84,82,210,260],[258,84,305,260],[360,82,453,260],[213,204,257,260]], holes:[[79,238,161,277]], trim:[[81,40,455,47],[307,82,312,260],[455,40,466,266]], open:[[216,88,253,97]] },
};
// Trace foreground beds instead of erasing rectangular chunks of the doors.
const bedroomOcclusions: Record<StudioStyle,RoomPolygon[]> = {
  modern:[[[0,232],[83,238],[180,239],[196,244],[205,250],[215,263],[215,342],[0,342]]],
  cream:[[[0,230],[56,231],[107,232],[149,234],[176,236],[188,241],[196,249],[202,263],[206,342],[0,342]]],
  natural:[[[0,221],[55,224],[101,228],[141,234],[171,241],[182,247],[188,259],[190,342],[0,342]]],
  wabi:[[[0,221],[65,222],[112,222],[152,224],[176,224],[190,228],[200,239],[204,253],[206,342],[0,342]],roomRect([34,174,80,222])],
  nordic:[[[0,219],[60,228],[121,237],[157,239],[187,244],[205,251],[219,265],[224,342],[0,342]]],
  oriental:[[[0,224],[65,225],[111,225],[161,225],[195,229],[214,236],[226,247],[232,261],[240,342],[0,342]]],
  chinese:[],
  european:[[[0,219],[100,222],[147,223],[178,226],[199,232],[218,243],[230,260],[236,279],[236,342],[0,342]]],
  classic:[[[0,222],[103,226],[163,232],[201,239],[228,249],[245,261],[258,282],[261,342],[0,342]]],
  french:[[[0,244],[150,244],[197,246],[224,250],[243,259],[258,273],[266,291],[268,342],[0,342]]],
  midcentury:[[[0,215],[76,218],[133,221],[179,228],[211,237],[226,249],[238,271],[244,342],[0,342]]],
  italian:[[[0,238],[77,241],[127,244],[165,249],[188,258],[204,273],[212,294],[215,342],[0,342]]],
};
interface LivingLayout { doors: RoomRect[]; lower: RoomRect; trim?: RoomRect[]; countertop?: RoomRect }
const livingRooms: Record<StudioStyle, LivingLayout> = {
  modern: { doors:[[55,46,125,201],[128,46,382,92],[386,46,466,201]], lower:[55,205,466,235], trim:[[52,36,469,44],[169,96,336,109]], countertop:[128,201,382,204] },
  cream: { doors:[[61,33,451,81]], lower:[58,224,452,256], trim:[[54,27,459,33],[453,36,473,258]], countertop:[57,219,452,223] },
  natural: { doors:[[60,40,121,205],[178,40,348,89],[402,40,464,205]], lower:[61,212,464,244], trim:[[55,33,466,39],[180,91,345,109]], countertop:[61,206,464,211] },
  wabi: { doors:[[112,51,447,96]], lower:[72,225,452,258], trim:[[67,47,111,52],[113,98,351,116],[114,205,350,225]], countertop:[71,219,451,224] },
  nordic: { doors:[[73,46,113,202],[163,46,352,90],[401,46,459,202]], lower:[74,207,459,241], trim:[[69,39,462,45],[165,92,350,112],[165,190,350,201]], countertop:[72,201,461,205] },
  oriental: { doors:[[132,49,384,103]], lower:[84,223,432,256], trim:[[61,46,85,257],[434,47,463,257],[133,105,379,124]], countertop:[84,217,432,222] },
  chinese: { doors:[[79,39,122,198],[160,39,362,103],[402,39,445,198]], lower:[80,202,445,245], trim:[[73,33,450,39],[163,108,361,118]], countertop:[78,198,447,201] },
  european: { doors:[[65,38,113,210],[161,38,365,82],[416,38,461,210]], lower:[67,216,461,244], trim:[[60,31,465,37],[164,90,363,110]], countertop:[115,210,415,215] },
  classic: { doors:[[60,48,97,248],[104,49,405,82],[414,48,450,248]], lower:[102,223,410,246], trim:[[101,39,408,48],[99,83,104,216],[405,83,414,216],[58,249,453,255]], countertop:[99,217,412,222] },
  french: { doors:[[70,44,106,210],[169,44,347,103],[414,44,461,210]], lower:[74,218,461,257], trim:[[64,36,465,43],[171,108,344,122]], countertop:[73,211,461,216] },
  midcentury: { doors:[[60,50,101,202],[150,50,370,98],[410,50,451,202]], lower:[58,211,452,237], trim:[[54,43,455,49],[151,104,368,115]], countertop:[58,204,452,209] },
  italian: { doors:[[131,51,212,101],[353,51,413,101]], lower:[73,212,474,242], trim:[[69,45,130,51],[116,103,412,122]], countertop:[73,206,474,211] },
};

export function cabinetRoomScene(style: StudioStyle, scene: StudioScene, schemeId = `${style}-1`): CabinetRoomScene {
  const requested = schemeById(schemeId);
  const scheme = requested?.style === style ? requested : schemeById(`${style}-1`)!;
  if (scheme.variant !== 1 && ['kitchen', 'bedroom', 'living'].includes(scene)) {
    const regions = cabinetRoomVariants[`${scheme.id}-${scene}`];
    if (!regions) throw new Error('Missing scheme surface map');
    const kind = scene === 'bedroom' ? 'wardrobe' : scene === 'living' ? 'tv' : 'wall';
    const surfaces: RoomSurface[] = [
      ...(regions.wall ?? []).flatMap(box => front('wall', box)),
      ...(regions.base ?? []).flatMap(box => front('base', box, 6)),
      ...(regions.faces ?? []).flatMap(box => front(kind, box)),
      ...(regions.body ?? []).map(box => zone(kind, 'body', box)),
      ...(regions.open ?? []).map(box => zone(kind, 'open', box)),
      ...(regions.top ?? []).map(box => top(scene === 'kitchen' ? 'base' : kind, box)),
    ];
    for (const surface of surfaces) surface.holes = regions.holes?.map(roomRect);
    const defaults = styleById(style);
    return { image: studioImage(scheme.id, scene), surfaces, baseline: scheme.finishes, baselineDoor: defaults.door, baselineHandle: defaults.handles };
  }
  const styleDefaults = styleById(style);
  const surfaces: RoomSurface[] = [];
  if (scene === 'kitchen') {
    const layout = kitchens[style];
    surfaces.push(...(layout.trim ?? []).map(box => zone('wall','body',box)), ...layout.upper.flatMap(box => front('wall',box)), ...front('base',layout.lower,6,layout.holes));
    surfaces.push(zone('base','body',[layout.lower[0],layout.lower[3],layout.lower[2],layout.lower[3]+5],undefined,layout.holes));
    surfaces.push(top('base', layout.countertop ?? [layout.lower[0],layout.lower[1]-5,layout.lower[2],layout.lower[1]-1]));
    if (style === 'cream') {
      const panels = (boxes: RoomRect[]) => boxes.map(roomRect);
      const upper = surfaces.find(surface => surface.kind === 'wall' && surface.role === 'front')!;
      upper.panels = panels([
        [82,56,126,140], [126,56,167,140], [167,56,208,140],
        [208,56,242,140], [242,56,302,134], [302,56,330,140],
      ]);
      // The extractor is hardware, not a colourable cabinet face.
      upper.holes = [roomRect([241.5,134,302,140])];
      const lower = surfaces.find(surface => surface.kind === 'base' && surface.role === 'front')!;
      lower.panels = panels([
        [73,196,117,253], [117,196,157,253], [157,196,200,253], [200,196,239,253],
        [239,196,302,210], [239,210,302,226], [239,226,302,253],
        [302,196,339,253], [339,196,373,253],
      ]);
    }
    if (style === 'natural') {
      const panels = (boxes: RoomRect[]) => boxes.map(roomRect);
      const upper = surfaces.filter(surface => surface.kind === 'wall' && surface.role === 'front');
      upper[0]!.panels = [72,106,141,181,221].map((x,i) => roomRect([x,50,[106,141,181,221,261][i]!,142]));
      upper[0]!.holes = [roomRect([140.5,139,221.5,142])];
      upper[0]!.hardware = panels([[104.5,120,107,141],[179,120,182,138]]);
      upper[1]!.panels = [roomRect([362,50,389,142]),roomRect([389,50,417,142])];
      upper[1]!.hardware = [roomRect([388,120,391,141])];
      const lower = surfaces.find(surface => surface.kind === 'base' && surface.role === 'front')!;
      lower.panels = panels([[63,200,136,215],[63,215,136,235],[63,235,136,265],[136,200,220,235],[136,235,220,265],[220,200,286,235],[220,235,286,265],[286,200,331,265],[331,200,376,265],[376,200,426,265]]);
      lower.hardware = panels([[81,200,119,204],[81,216,119,220],[81,236,119,240],[153,200,201,204],[153,236,201,240],[228,200,273,204],[228,236,273,240],[330,201,333,222]]);
    }
    if(style==='modern')for(const surface of surfaces.filter(s=>s.kind==='base'))surface.holes=[...(surface.holes??[]),
      [[0,219],[71,220],[91,224],[102,225],[103,228],[101,232],[94,236],[72,242],[0,259]],
      [[0,244],[48,244],[70,240],[84,237],[92,236],[95,238],[95,244],[93,251],[90,257],[84,262],[58,265],[0,265]],
      [[89,251],[94,265],[99,333],[95,333],[90,270],[87,255]],
    ];
  } else if (scene === 'bedroom') {
    const layout = bedrooms[style];
    surfaces.push(...(layout.trim ?? []).map(box => zone('wardrobe','body',box)), ...layout.doors.flatMap(box => front('wardrobe',box,Math.max(1,Math.round((box[2]-box[0])/45)))), ...(layout.open ?? []).map(box => zone('wardrobe','open',box)));
    if (style === 'chinese') {
      const faces=surfaces.filter(surface=>surface.role==='front');
      faces[0]!.panels=[roomRect([156,47,197,253]),roomRect([197,47,237,253]),roomRect([237,47,278,253])];
      faces[1]!.panels=[roomRect([347,47,387,253]),roomRect([387,47,427,253]),roomRect([427,47,467,253])];
      for(const face of faces.slice(0,2)){
        const left=face.quad[0][0],right=face.quad[1][0];
        face.relief=[roomRect([left,47,right,66]),roomRect([left,232,right,253])];
        face.hardware=(left<200?[197,237]:[387,427]).map(x=>Array.from({length:24},(_,i)=>[x+6.5*Math.cos(i*Math.PI/12),175+6.5*Math.sin(i*Math.PI/12)] as RoomPoint));
      }
    }
    for(const surface of surfaces)surface.holes=[...(surface.holes??[]),...bedroomOcclusions[style]];
  } else if (scene === 'living') {
    const layout = livingRooms[style];
    surfaces.push(...(layout.trim ?? []).map(box => zone('tv','body',box)), ...layout.doors.flatMap(box => front('tv',box)), ...front('tv',layout.lower,6), top('tv',layout.countertop ?? [layout.lower[0],layout.lower[1]-4,layout.lower[2],layout.lower[1]-1]));
  } else if (scene === 'entry') {
    surfaces.push(zone('shoe','body',[150,30,364,266],undefined,[[152,33,345,259]]), ...front('shoe',[152,33,345,259],4));
  } else if (scene === 'dining') {
    surfaces.push(zone('sideboard','body',[124,184,433,249],undefined,[[125,187,335,245],[338,189,381,241],[386,189,428,241]]), ...front('sideboard',[125,187,335,245],4), zone('sideboard','open',[338,189,381,241]),zone('sideboard','open',[386,189,428,241]),top('sideboard',[124,182,433,186]));
  } else {
    const holes: RoomRect[]=[];
    for (const [left,right] of [[129,191],[199,266],[275,339],[348,411]]) for (const [y,bottom] of [[50,90],[96,139],[145,188],[194,232],[238,263]]) holes.push([left,y,right,bottom]);
    surfaces.push(zone('bookcase','body',[118,39,422,274],undefined,holes),...holes.map(box=>zone('bookcase','open',box)));
  }
  const extra = !['kitchen','bedroom','living'].includes(scene);
  return { image:extra ? `/images/custom-cabinets/room-preview/${scene}.webp` : studioImage(`${style}-1`,scene), surfaces, baseline:extra ? {front:'white',body:'cream',open:'pale-oak',top:'warm-stone'} : scheme.finishes, baselineDoor:extra?'flat':styleDefaults.door, baselineHandle:extra?'hidden':styleDefaults.handles };
}
