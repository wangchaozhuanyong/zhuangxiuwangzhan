import { finishById } from '@/data/cabinetStudio';
import { cabinetRoomScene, type CabinetRoomScene, type RoomPoint, type RoomPolygon, type RoomQuad, type RoomSurface } from '@/data/cabinetRoomScenes';
import { cabinetScene, type StudioCabinet, type StudioDesign } from './cabinetStudio';

type Matrix = readonly [number,number,number,number,number,number,number,number,number];
export function quadMatrix([p0,p1,p2,p3]: RoomQuad): Matrix {
  const dx1=p1[0]-p2[0], dx2=p3[0]-p2[0], dx3=p0[0]-p1[0]+p2[0]-p3[0];
  const dy1=p1[1]-p2[1], dy2=p3[1]-p2[1], dy3=p0[1]-p1[1]+p2[1]-p3[1];
  const det=dx1*dy2-dx2*dy1;
  const g=Math.abs(dx3)+Math.abs(dy3)<1e-8?0:(dx3*dy2-dx2*dy3)/det;
  const h=Math.abs(dx3)+Math.abs(dy3)<1e-8?0:(dx1*dy3-dx3*dy1)/det;
  return [p1[0]-p0[0]+g*p1[0],p3[0]-p0[0]+h*p3[0],p0[0],p1[1]-p0[1]+g*p1[1],p3[1]-p0[1]+h*p3[1],p0[1],g,h,1];
}
export function invertMatrix([a,b,c,d,e,f,g,h,i]: Matrix): Matrix {
  const det=a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g);
  if(Math.abs(det)<1e-9) throw new Error('Invalid surface');
  return [(e*i-f*h)/det,(c*h-b*i)/det,(b*f-c*e)/det,(f*g-d*i)/det,(a*i-c*g)/det,(c*d-a*f)/det,(d*h-e*g)/det,(b*g-a*h)/det,(a*e-b*d)/det];
}
export function projectPoint(m: Matrix, x: number, y: number): RoomPoint {
  const w=m[6]*x+m[7]*y+m[8];
  return [(m[0]*x+m[1]*y+m[2])/w,(m[3]*x+m[4]*y+m[5])/w];
}
export function inRoomPolygon(x:number,y:number,points:RoomPolygon): boolean {
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++) {
    const a=points[i]!,b=points[j]!;
    if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
  }
  return inside;
}
export function roomCabinetFor(surface: RoomSurface, design: StudioDesign, selectedId?: string) {
  return design.cabinets.find(c=>c.id===selectedId&&c.kind===surface.kind) ?? design.cabinets.find(c=>c.kind===surface.kind);
}
const pictureCache=new Map<string,Promise<HTMLImageElement>>();
const finishCache=new Map<string,Promise<HTMLImageElement>>();
export function loadRoomImage(url:string): Promise<HTMLImageElement> {
  const cache=url.includes('/textures/')?finishCache:pictureCache;
  const previous=cache.get(url); if(previous){cache.delete(url);cache.set(url,previous);return previous;}
  const promise=new Promise<HTMLImageElement>((resolve,reject)=>{
    const image=new Image(); image.decoding='async';
    const failed=()=>{cache.delete(url);reject(new Error('Image unavailable'));};
    // A loaded async image is not necessarily decoded for the first canvas draw.
    image.onload=()=>{void image.decode().then(()=>resolve(image),failed);}; image.onerror=failed; image.src=url;
  });
  cache.set(url,promise);
  if(cache.size>(cache===finishCache?24:3)) cache.delete(cache.keys().next().value!);
  return promise;
}
const colourData=new WeakMap<HTMLImageElement,{raw:ImageData;soft:ImageData;illumination:number[]}>();
const textureData=new WeakMap<HTMLImageElement,ImageData>();
function getContext(canvas:HTMLCanvasElement) {const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)throw new Error('Preview unavailable');return context;}
function sceneData(image:HTMLImageElement) {
  const cached=colourData.get(image); if(cached) return cached;
  const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1024;
  const context=getContext(canvas);context.drawImage(image,0,0,1536,1024);const raw=context.getImageData(0,0,1536,1024);
  // Work at the source resolution. Downsampling to a tiny image erased narrow
  // joinery shadows and produced broad halos around handles and drawer fronts.
  context.clearRect(0,0,1536,1024);context.filter='blur(5px)';
  context.drawImage(image,0,0,1536,1024);context.filter='none';
  const soft=context.getImageData(0,0,1536,1024);
  // A neutral ceiling reference keeps new solid colours under the room's warm
  // light instead of inheriting the red/yellow pigment of the previous timber.
  const ceiling=[[],[],[]] as number[][];
  for(let y=28;y<=70;y+=14)for(let x=460;x<=1075;x+=61){
    const index=(y*1536+x)*4;for(let c=0;c<3;c++)ceiling[c]!.push(linearChannel[raw.data[index+c]!]!);
  }
  const neutral=linearColour('#F0ECE3');
  const illumination=ceiling.map((samples,c)=>{samples.sort((a,b)=>a-b);return clamp(samples[Math.floor(samples.length/2)]!/neutral[c]!,.25,1.1);});
  const value={raw,soft,illumination};colourData.set(image,value);return value;
}
function getTexture(image:HTMLImageElement) {
  const cached=textureData.get(image);if(cached)return cached;
  const canvas=document.createElement('canvas');canvas.width=Math.min(512,image.naturalWidth);canvas.height=Math.max(1,Math.round(canvas.width*image.naturalHeight/image.naturalWidth));
  const context=getContext(canvas);context.drawImage(image,0,0,canvas.width,canvas.height);const data=context.getImageData(0,0,canvas.width,canvas.height);textureData.set(image,data);return data;
}
const luma=(data:Uint8ClampedArray,index:number)=>data[index]!*.2126+data[index+1]!*.7152+data[index+2]!*.0722;
const clamp=(value:number,low:number,high:number)=>Math.min(high,Math.max(low,value));
function path(context:CanvasRenderingContext2D,quad:RoomQuad) {context.beginPath();quad.forEach(([x,y],i)=>i?context.lineTo(x,y):context.moveTo(x,y));context.closePath();}
const linearChannel = Float32Array.from({length:256},(_,i) => {
  const value=i/255; return value<=.04045?value/12.92:Math.pow((value+.055)/1.055,2.4);
});
const displayChannel = Uint8ClampedArray.from({length:4097},(_,i) => {
  const value=i/4096; return 255*(value<=.0031308?value*12.92:1.055*Math.pow(value,1/2.4)-.055);
});
const linearColour = (hex:string) => [1,3,5].map(i=>linearChannel[parseInt(hex.slice(i,i+2),16)]!);
const smoothStep = (low:number,high:number,value:number) => {const t=clamp((value-low)/(high-low),0,1);return t*t*(3-2*t);};

// Preserve the photographed irradiance, white balance and contact shadows.
// A small ambient reflection floor prevents dark matte boards becoming flat
// black cut-outs. This is a fixed-camera photographic study, not a PBR renderer.
export function transferMaterialLight(source:number,baseline:number,target:number) {
  const ambient=.012;
  return source*(target+ambient)/(baseline+ambient);
}
function surfaceLighting(surface:RoomSurface,source:ReturnType<typeof sceneData>) {
  const matrix=quadMatrix(surface.quad);
  const corners=[[.18,.18],[.82,.18],[.18,.82],[.82,.82]].map(([u,v])=>{
    const samples:number[]=[];
    for(let row=-4;row<=4;row++)for(let column=-4;column<=4;column++){
      const [x,y]=projectPoint(matrix,u!+column*.022,v!+row*.022);
      if(surface.holes?.some(hole=>inRoomPolygon(x,y,hole)))continue;
      const index=(clamp(Math.round(y*3),0,1023)*1536+clamp(Math.round(x*3),0,1535))*4;
      samples.push(luma(source.raw.data,index));
    }
    samples.sort((a,b)=>a-b);return samples[Math.floor(samples.length/2)]??128;
  });
  const median=[...corners].sort((a,b)=>a-b);const centre=Math.max(1,(median[1]!+median[2]!)/2);
  return (u:number,v:number)=>{
    const x=clamp((u-.18)/.64,0,1),y=clamp((v-.18)/.64,0,1);
    const top=corners[0]!*(1-x)+corners[1]!*x,bottom=corners[2]!*(1-x)+corners[3]!*x;
    return clamp(Math.pow((top*(1-y)+bottom*y)/centre,2.2),.35,1.6);
  };
}
function textureSample(texture:ImageData,u:number,v:number,colour:Float64Array) {
  // Mirrored tiles and bilinear sampling avoid seams and nearest-pixel aliasing.
  const mirror=(value:number)=>{const p=(value%2+2)%2;return p>1?2-p:p;};
  const x=mirror(u)*(texture.width-1),y=mirror(v)*(texture.height-1);
  const x0=Math.floor(x),y0=Math.floor(y),x1=Math.min(x0+1,texture.width-1),y1=Math.min(y0+1,texture.height-1);
  const dx=x-x0,dy=y-y0;
  for(let c=0;c<3;c++){
    const sample=(px:number,py:number)=>linearChannel[texture.data[(py*texture.width+px)*4+c]!]!;
    colour[c]=(sample(x0,y0)*(1-dx)+sample(x1,y0)*dx)*(1-dy)+(sample(x0,y1)*(1-dx)+sample(x1,y1)*dx)*dy;
  }
}
function paintSurface(context:CanvasRenderingContext2D, surface:RoomSurface,cabinet:StudioCabinet,scene:CabinetRoomScene,source:ReturnType<typeof sceneData>,texture?:ImageData) {
  const scale=context.canvas.width/512;
  const referenceMatrix=quadMatrix(surface.quad),referenceInverse=invertMatrix(referenceMatrix);
  const baseline=finishById(scene.baseline[surface.role]),baseColour=linearColour(baseline.colour);
  const finish=finishById(cabinet.finishes[surface.role]),targetColour=linearColour(finish.colour);
  const changedProfile=surface.role==='front'&&(cabinet.door!==scene.baselineDoor||cabinet.handle!==scene.baselineHandle);
  const sourceScale=1536/context.canvas.width;
  const sourceIndex=(x:number,y:number)=>(clamp(Math.floor(y*sourceScale),0,1023)*1536+clamp(Math.floor(x*sourceScale),0,1535))*4;
  const repeatU=Math.max(.3,cabinet.width/650),repeatV=Math.max(.3,cabinet.height/650);
  const panels=surface.panels??[surface.quad],material=new Float64Array(3);
  const lightField=baseline.kind==='solid'?null:surfaceLighting(surface,source);
  for(let panelIndex=0;panelIndex<panels.length;panelIndex++){
    const panel=panels[panelIndex]!;
    const points=panel.map(([x,y])=>[x*scale,y*scale] as const) as unknown as RoomQuad;
    const left=Math.max(0,Math.floor(Math.min(...points.map(p=>p[0])))),right=Math.min(context.canvas.width,Math.ceil(Math.max(...points.map(p=>p[0]))));
    const top=Math.max(0,Math.floor(Math.min(...points.map(p=>p[1])))),bottom=Math.min(context.canvas.height,Math.ceil(Math.max(...points.map(p=>p[1]))));
    if(right<=left||bottom<=top)continue;
    const inverse=invertMatrix(quadMatrix(points));
    const layer=document.createElement('canvas');layer.width=right-left;layer.height=bottom-top;
    const layerContext=getContext(layer),pixels=layerContext.createImageData(layer.width,layer.height);
    for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
      const [u,v]=projectPoint(inverse,x+.5,y+.5);
      if(u<0||u>1||v<0||v>1||surface.holes?.some(hole=>inRoomPolygon((x+.5)/scale,(y+.5)/scale,hole))||(!changedProfile&&surface.hardware?.some(hole=>inRoomPolygon((x+.5)/scale,(y+.5)/scale,hole))))continue;
      const si=sourceIndex(x,y),soft=luma(source.soft.data,si),original=luma(source.raw.data,si),ratio=original/Math.max(1,soft);
      const edgeDistance=Math.min(u*(right-left),(1-u)*(right-left),v*(bottom-top),(1-v)*(bottom-top));
      const [ru,rv]=projectPoint(referenceInverse,(x+.5)/scale,(y+.5)/scale);
      // A solid source already contains the exact door relief: keep every pixel.
      // For timber/stone, suppress the old fine grain but retain strong joints,
      // frames and hardware rather than applying a hard detail/no-detail cutoff.
      const tracedRelief=surface.relief?.some(region=>inRoomPolygon((x+.5)/scale,(y+.5)/scale,region));
      const detail=changedProfile?0:baseline.kind==='solid'?1:surface.panels
        ? Math.max(tracedRelief?1:0,1-smoothStep(3*scale,6*scale,edgeDistance))
        : Math.max(1-smoothStep(1,5,edgeDistance),smoothStep(.07,.24,Math.abs(ratio-1)));
      const keepHardware=surface.role==='front'&&!changedProfile&&(ratio<.3||ratio>1.8);
      if(texture){
        const offset=panelIndex*.173;
        textureSample(texture,cabinet.grain==='horizontal'?rv*repeatV+offset:ru*repeatU+offset,cabinet.grain==='horizontal'?ru*repeatU:rv*repeatV,material);
      } else material.set(targetColour);
      const dest=((y-top)*layer.width+x-left)*4;
      for(let channel=0;channel<3;channel++){
        const raw=linearChannel[source.raw.data[si+channel]!]!,blurred=linearChannel[source.soft.data[si+channel]!]!;
        const retainedRelief=1+(ratio-1)*detail;
        const light=lightField
          ? baseColour[channel]!*source.illumination[channel]!*lightField(ru,rv)*retainedRelief
          : blurred+(raw-blurred)*detail;
        const result=transferMaterialLight(light,baseColour[channel]!,material[channel]!);
        pixels.data[dest+channel]=keepHardware?source.raw.data[si+channel]!:displayChannel[Math.round(clamp(result,0,1)*4096)]!;
      }
      // Feather the outside silhouette only: exposing the pale source between
      // adjacent dark panels creates bright seams that do not exist in the room.
      const outerEdge=Math.min(ru*(surface.quad[1][0]-surface.quad[0][0])*scale,(1-ru)*(surface.quad[1][0]-surface.quad[0][0])*scale,rv*(surface.quad[3][1]-surface.quad[0][1])*scale,(1-rv)*(surface.quad[3][1]-surface.quad[0][1])*scale);
      pixels.data[dest+3]=Math.round(255*smoothStep(0,.65,outerEdge));
    }
    layerContext.putImageData(pixels,0,0);context.save();path(context,points);context.clip();context.drawImage(layer,left,top);context.restore();
  }
}
function paintProfile(context:CanvasRenderingContext2D,surface:RoomSurface,cabinet:StudioCabinet) {
  const m=quadMatrix(surface.quad);const columns=surface.columns??4;
  const line=(points:RoomPoint[],colour:string,width:number)=>{context.beginPath();points.forEach(([u,v],i)=>{const [x,y]=projectPoint(m,u,v);if(i)context.lineTo(x,y);else context.moveTo(x,y);});context.strokeStyle=colour;context.lineWidth=width;context.stroke();};
  context.save();const scale=context.canvas.width/512;context.scale(scale,scale);path(context,surface.quad);context.clip();
  for(const hole of surface.holes??[]){
    context.beginPath();context.rect(0,0,512,1024/3);
    hole.forEach(([x,y],i)=>i?context.lineTo(x,y):context.moveTo(x,y));context.closePath();context.clip('evenodd');
  }
  for(let i=0;i<columns;i++){
    const a=i/columns,b=(i+1)/columns;
    if(i)line([[a,0],[a,1]],'rgba(30,28,22,.48)',.7);
    if(cabinet.door!=='flat'){
      const inset=.065/columns;const quad:RoomPoint[]=[[a+inset,.055],[b-inset,.055],[b-inset,.945],[a+inset,.945],[a+inset,.055]];
      line(quad,'rgba(30,26,19,.40)',cabinet.door==='classic'?1.7:.8);line(quad.map(([u,v])=>[u+.0015,v+.003]),'rgba(255,249,226,.48)',.6);
      if(cabinet.door==='lattice'||cabinet.door==='reeded')for(let n=1;n<=5;n++)line([[a+(b-a)*n/6,.06],[a+(b-a)*n/6,.94]],'rgba(33,28,20,.30)',.7);
      if(cabinet.door==='glass'){const q=quad.slice(0,4).map(([u,v])=>projectPoint(m,u,v)) as unknown as RoomQuad;path(context,q);context.fillStyle='rgba(32,46,40,.28)';context.fill();}
    }
    if(cabinet.handle==='hidden')line([[a+.04/columns,.035],[b-.04/columns,.035]],'rgba(28,29,25,.48)',1.1);
    else {const colour={brass:'#AC8C51',nickel:'#C8CCC9',black:'#30342F'}[cabinet.handle];line([[b-.1/columns,.46],[b-.1/columns,cabinet.kind==='wardrobe'||cabinet.kind==='shoe'?.65:.56]],'rgba(24,25,20,.38)',2.2);line([[b-.1/columns,.46],[b-.1/columns,cabinet.kind==='wardrobe'||cabinet.kind==='shoe'?.65:.56]],colour,1.2);}
  }
  context.restore();
}
export function roomPreviewSignature(design:StudioDesign,selectedId?:string) {
  const scene=cabinetRoomScene(design.style,design.scene,design.scheme);
  return JSON.stringify([scene.image,scene.surfaces.map(surface=>{const c=roomCabinetFor(surface,design,selectedId);return c?[surface.role,c.finishes,c.door,c.handle,c.grain,c.width,c.height]:null;})]);
}
function yieldPreviewTask() {
  return new Promise<void>(resolve=>{const channel=new MessageChannel();channel.port1.onmessage=()=>{channel.port1.close();channel.port2.close();resolve();};channel.port2.postMessage(0);});
}
export function changedRoomSurfaces(design:StudioDesign,selectedId?:string,scene=cabinetRoomScene(design.style,design.scene,design.scheme)) {
  return scene.surfaces.filter(surface => {
    const c = roomCabinetFor(surface, design, selectedId);
    return c && (c.finishes[surface.role] !== scene.baseline[surface.role] || c.grain !== 'vertical' || surface.role === 'front' && (c.door !== scene.baselineDoor || c.handle !== scene.baselineHandle || c.door === 'glass' && c.finishes.open !== scene.baseline.open));
  });
}
export async function renderCabinetRoom(design:StudioDesign,selectedId?:string,resolution:768|1536=1536,signal?:AbortSignal):Promise<HTMLCanvasElement> {
  const scene=cabinetRoomScene(design.style,design.scene,design.scheme);
  const changed = changedRoomSurfaces(design,selectedId,scene);
  const materials=new Set(changed.flatMap(surface=>{const c=roomCabinetFor(surface,design,selectedId);return c?[c.finishes[surface.role],...(c.door==='glass'?[c.finishes.open]:[])].filter(id=>finishById(id).kind!=='solid'):[];}));
  const [image, ...textures]=await Promise.all([loadRoomImage(scene.image),...Array.from(materials,id=>loadRoomImage(`/images/custom-cabinets/v2/textures/${id}.webp`))]);
  const textureMap=new Map(Array.from(materials).map((id,index)=>[id,getTexture(textures[index]!)]));
  const canvas=document.createElement('canvas');canvas.width=resolution;canvas.height=resolution*2/3;const context=getContext(canvas);context.drawImage(image!,0,0,canvas.width,canvas.height);
  if (!changed.length) return canvas;
  const source=sceneData(image!);
  let painted=0;
  for(const surface of scene.surfaces){
    if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
    const cabinet=roomCabinetFor(surface,design,selectedId);if(!cabinet||cabinetScene(cabinet)!==design.scene)continue;
    const profileChanged=surface.role==='front'&&(cabinet.door!==scene.baselineDoor||cabinet.handle!==scene.baselineHandle);
    const glassChanged=surface.role==='front'&&cabinet.door==='glass'&&cabinet.finishes.open!==scene.baseline.open;
    if(cabinet.finishes[surface.role]===scene.baseline[surface.role]&&cabinet.grain==='vertical'&&!profileChanged&&!glassChanged)continue;
    paintSurface(context,surface,cabinet,scene,source,textureMap.get(cabinet.finishes[surface.role]));
    if(surface.role==='front'&&cabinet.door==='glass'){
      const m=quadMatrix(surface.quad),columns=surface.columns??4;
      for(let i=0;i<columns;i++){
        const a=(i+.08)/columns,b=(i+.92)/columns;
        const quad=[[a,.06],[b,.06],[b,.94],[a,.94]].map(([u,v])=>projectPoint(m,u!,v!)) as unknown as RoomQuad;
        const inner={...surface,role:'open' as const,quad};
        paintSurface(context,inner,cabinet,scene,source,textureMap.get(cabinet.finishes.open));
      }
    }
    if(profileChanged||glassChanged||surface.role==='front'&&cabinet.door==='glass')paintProfile(context,surface,cabinet);
    if(++painted%3===0)await yieldPreviewTask();
  }
  return canvas;
}
