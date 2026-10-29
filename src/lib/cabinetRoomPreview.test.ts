import { describe,expect,it,vi } from 'vitest';
import { existsSync } from 'node:fs';
import { cabinetRoomScene,roomRect,type RoomQuad } from '@/data/cabinetRoomScenes';
import { studioScenes,studioStyles,studioSchemes,studioImage } from '@/data/cabinetStudio';
import { designForScheme } from './cabinetStudio';
import { loadRoomImage,invertMatrix,projectPoint,quadMatrix,roomPreviewSignature,transferMaterialLight,inRoomPolygon } from './cabinetRoomPreview';

describe('full-room cabinet preview contract',()=>{
  it('binds every catalogue variant to its own image and regions, never the first variant',()=>{
    for (const scheme of studioSchemes) for (const room of ['kitchen','bedroom','living'] as const) {
      const scene = cabinetRoomScene(scheme.style,room,scheme.id);
      expect(scene.image).toBe(studioImage(scheme.id,room));
      expect(scene.baseline).toEqual(scheme.finishes);
      expect(scene.surfaces.length).toBeGreaterThan(0);
      expect(existsSync(`public${scene.image}`)).toBe(true);
      for (const surface of scene.surfaces) for (const [x,y] of surface.quad) {
        expect(x).toBeGreaterThanOrEqual(0);expect(x).toBeLessThanOrEqual(512);
        expect(y).toBeGreaterThanOrEqual(0);expect(y).toBeLessThanOrEqual(1024/3);
      }
      if(scheme.variant!==1) expect(scene.surfaces).not.toEqual(cabinetRoomScene(scheme.style,room).surfaces);
    }
  });
  it('only changes the scene identity for an intentional style change, not a finish change',()=>{
    const original=designForScheme('cream-2');
    const changed=structuredClone(original);changed.cabinets[0]!.finishes.front='walnut';
    expect(JSON.parse(roomPreviewSignature(original))[0]).toBe(JSON.parse(roomPreviewSignature(changed))[0]);
    expect(cabinetRoomScene('natural','kitchen',original.scheme).image).toBe(studioImage('natural-1','kitchen'));
  });
  it('provides real local images and valid material regions for every style and room',()=>{
    for(const style of studioStyles)for(const room of studioScenes){
      const scene=cabinetRoomScene(style.id,room);
      expect(existsSync(`public${scene.image}`),scene.image).toBe(true);
      expect(scene.surfaces.length).toBeGreaterThan(0);
      for(const surface of scene.surfaces){
        for(const [x,y] of surface.quad){expect(x).toBeGreaterThanOrEqual(0);expect(x).toBeLessThanOrEqual(512);expect(y).toBeGreaterThanOrEqual(0);expect(y).toBeLessThanOrEqual(1024/3);}
        const inverse=invertMatrix(quadMatrix(surface.quad));
        const corner=projectPoint(inverse,...surface.quad[0]);expect(corner[0]).toBeCloseTo(0,8);expect(corner[1]).toBeCloseTo(0,8);
      }
    }
  });
  it('maps material samples to a perspective face without changing its corners',()=>{
    for(const quad of [roomRect([30,50,230,250]),[[40,80],[260,35],[230,290],[70,260]]] as RoomQuad[]){
      const m=quadMatrix(quad),inverse=invertMatrix(m);
      for(const [u,v] of [[0,0],[1,0],[1,1],[0,1],[.37,.62]]){
        const point=projectPoint(m,u!,v!);const restored=projectPoint(inverse,...point);
        expect(restored[0]).toBeCloseTo(u!,8);expect(restored[1]).toBeCloseTo(v!,8);
      }
    }
  });
  it('invalidates the visual for every finish, grain and door edit, including glass interiors',()=>{
    const initial=designForScheme('italian-1');const first=initial.cabinets[0]!;
    const signature=roomPreviewSignature(initial,first.id);
    for(const field of ['front','body','open','top'] as const){
      const edited=structuredClone(initial);edited.cabinets[0]!.finishes[field]=field==='top'?'black-stone':'sage';
      expect(roomPreviewSignature(edited,first.id)).not.toBe(signature);
    }
    const locked=structuredClone(initial);locked.cabinets[0]!.locks=['front'];
    expect(roomPreviewSignature(locked,first.id)).toBe(signature);
  });
  it('retains subtle relief and full light-to-shadow contrast when replacing a solid finish',()=>{
    const input=[.08,.3,.31,.6];
    for(const target of [.04,.4,.82]){
      const output=input.map(pixel=>transferMaterialLight(pixel,.8,target));
      expect(output[2]!-output[1]!).toBeGreaterThan(0);
      expect(output[0]!/output[3]!).toBeCloseTo(input[0]!/input[3]!,10);
      expect((output[2]!-output[1]!)/output[2]!).toBeCloseTo((input[2]!-input[1]!)/input[2]!,10);
    }
  });
  it('does not relight an unchanged material and remains finite for black finishes',()=>{
    for(const source of [0,.01,.25,.7,1])for(const material of [0,.2,.8,1]){
      expect(transferMaterialLight(source,material,material)).toBeCloseTo(source,12);
      expect(Number.isFinite(transferMaterialLight(source,material,0))).toBe(true);
    }
  });
  it('traces individual cream doors and drawers while excluding the metal extractor',()=>{
    const scene=cabinetRoomScene('cream','kitchen');
    const upper=scene.surfaces.find(s=>s.kind==='wall'&&s.role==='front')!;
    const lower=scene.surfaces.find(s=>s.kind==='base'&&s.role==='front')!;
    expect(upper.panels).toHaveLength(6);expect(lower.panels).toHaveLength(9);
    expect(upper.holes!.some(hole=>inRoomPolygon(270,137,hole))).toBe(true);
    for(const surface of [upper,lower])for(const panel of surface.panels!){
      const m=invertMatrix(quadMatrix(surface.quad));
      for(const point of panel){const [u,v]=projectPoint(m,...point);expect(u).toBeGreaterThanOrEqual(0);expect(u).toBeLessThanOrEqual(1);expect(v).toBeGreaterThanOrEqual(0);expect(v).toBeLessThanOrEqual(1);}
    }
  });
});


describe('preview image decode readiness',()=>{
  it('waits for decoded pixels and removes a failed decode from the retry cache',async()=>{
    let resolveDecode!:()=>void;
    const decoded=new Promise<void>(resolve=>{resolveDecode=resolve;});
    const instances:{onload:(()=>void)|null;decode:()=>Promise<void>}[]=[];
    class PreviewImage {
      decoding='';src='';onload:(()=>void)|null=null;onerror:(()=>void)|null=null;
      decode=()=>decoded;
      constructor(){instances.push(this);}
    }
    vi.stubGlobal('Image',PreviewImage);
    try {
      let ready=false;
      const loaded=loadRoomImage('/decode-readiness-test.webp');void loaded.then(()=>{ready=true;});
      instances[0]!.onload?.();await Promise.resolve();expect(ready).toBe(false);
      resolveDecode();expect(await loaded).toBe(instances[0]);expect(ready).toBe(true);
      const failed=loadRoomImage('/decode-retry-test.webp');
      instances[1]!.decode=()=>Promise.reject(new Error('decode failed'));instances[1]!.onload?.();
      await expect(failed).rejects.toThrow('Image unavailable');
      const retried=loadRoomImage('/decode-retry-test.webp');expect(instances).toHaveLength(3);
      instances[2]!.onload?.();await expect(retried).resolves.toBe(instances[2]);
    } finally {vi.unstubAllGlobals();}
  });
});
