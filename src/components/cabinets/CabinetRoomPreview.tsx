import { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, ZoomIn } from 'lucide-react';
import SmartImage from '@/components/SmartImage';
import { useLanguage } from '@/i18n/LanguageContext';
import labels from '@/i18n/cabinetStudioCatalog.json';
import text from '@/i18n/cabinetStudioText.json';
import { cabinetRoomScene } from '@/data/cabinetRoomScenes';
import { cabinetScene, type StudioDesign } from '@/lib/cabinetStudio';
import { changedRoomSurfaces, loadRoomImage, renderCabinetRoom, roomPreviewSignature } from '@/lib/cabinetRoomPreview';

export default function CabinetRoomPreview({ design, selectedId, onSelect, onZoom, compact=false }: { design:StudioDesign;selectedId?:string;onSelect?:(id:string)=>void;onZoom?:()=>void;compact?:boolean }) {
  const {language}=useLanguage();const t=text[language];const l=labels[language];
  const scene=useMemo(()=>cabinetRoomScene(design.style,design.scene,design.scheme),[design.style,design.scene,design.scheme]);
  const signature=roomPreviewSignature(design,selectedId);
  const canvas=useRef<HTMLCanvasElement>(null);const frame=useRef('');
  const latest=useRef({design,selectedId});latest.current={design,selectedId};
  const [retry,setRetry]=useState(0);
  const [mobile,setMobile]=useState(()=>window.matchMedia('(max-width:900px)').matches);
  const resolution=compact||mobile?768:1536;
  const [result,setResult]=useState<{signature:string;status:'loading'|'ready'|'error'}>({signature:'',status:'loading'});
  const [admitted,setAdmitted]=useState(!compact);const container=useRef<HTMLElement>(null);
  const needsCanvas=changedRoomSurfaces(design,selectedId,scene).length>0;
  const renderKey=`${signature}:${resolution}:${needsCanvas}`;
  const status=result.signature===renderKey?result.status:'loading';
  const cabinets=design.cabinets.filter(c=>cabinetScene(c)===design.scene);
  useEffect(()=>{const query=window.matchMedia('(max-width:900px)');const changed=()=>setMobile(query.matches);query.addEventListener('change',changed);return()=>query.removeEventListener('change',changed);},[]);
  useEffect(()=>{
    if(!compact||!container.current)return;
    const observer=new IntersectionObserver(entries=>setAdmitted(entries.some(entry=>entry.isIntersecting)),{rootMargin:'700px'});
    observer.observe(container.current);return()=>observer.disconnect();
  },[compact]);
  useEffect(()=>{
    if(!admitted){if(canvas.current){canvas.current.width=1;canvas.current.height=1;}frame.current='';setResult({signature:renderKey,status:'loading'});return;}
    let cancelled=false;const controller=new AbortController();
    setResult({signature:renderKey,status:'loading'});
    const input=latest.current;
    const task=needsCanvas?renderCabinetRoom(input.design,input.selectedId,resolution,controller.signal):loadRoomImage(scene.image).then(()=>null);
    void task.then(rendered=>{
      if(!rendered){if(!cancelled){frame.current='';setResult({signature:renderKey,status:'ready'});}return;}
      if(cancelled||!canvas.current)return;
      const target=canvas.current;target.width=rendered.width;target.height=rendered.height;const context=target.getContext('2d',{willReadFrequently:true});const source=rendered.getContext('2d');if(!context||!source)throw new Error('Preview unavailable');
      // Commit the compositor's pixels synchronously before advertising readiness.
      context.putImageData(source.getImageData(0,0,rendered.width,rendered.height),0,0);
      frame.current=scene.image;setResult({signature:renderKey,status:'ready'});
    }).catch(()=>{if(!cancelled)setResult({signature:renderKey,status:'error'});});
    return()=>{cancelled=true;controller.abort();};
  },[renderKey,retry,admitted,resolution,compact,scene.image,needsCanvas]);
  const groups=Array.from(new Set(scene.surfaces.map(s=>s.kind))).flatMap(kind=>{
    const cabinet=cabinets.find(c=>c.id===selectedId&&c.kind===kind)??cabinets.find(c=>c.kind===kind);if(!cabinet)return[];
    const points=scene.surfaces.filter(s=>s.kind===kind).flatMap(s=>s.quad);
    const x=Math.min(...points.map(p=>p[0])),y=Math.min(...points.map(p=>p[1]));
    return[{cabinet,x,y,width:Math.max(...points.map(p=>p[0]))-x,height:Math.max(...points.map(p=>p[1]))-y}];
  });
  return <figure ref={container} className={`studio-preview studio-room-preview${compact?' studio-room-preview--compact':''}`} data-room-render-state={cabinets.length?status:'empty'} data-room-layer={needsCanvas?'material':'photo'} data-room-scene={design.scene} data-room-image={scene.image}>
    <div className="studio-room-preview__frame" aria-busy={status==='loading'}>
      <SmartImage key={`${scene.image}-${retry}`} src={scene.image} width={1536} height={1024} sizes={compact?'(max-width:600px) 92vw, 30vw':'(max-width:900px) 94vw, 65vw'} loading={compact?'lazy':'eager'} fetchPriority={compact?'auto':'high'} revealOnLoad retryOnError alt={`${l.styles[design.style]} · ${l.scenes[design.scene]}`} />
      <canvas ref={canvas} aria-hidden={!needsCanvas} className={needsCanvas&&frame.current===scene.image?'is-painted':''} aria-label={`${t.roomPreview} · ${l.scenes[design.scene]}`} role="img" data-configuration={signature} />
      {!compact&&status==='loading'&&<span className="studio-room-preview__status" role="status">{t.roomUpdating}</span>}
      {status==='error'&&<div className="studio-room-preview__error" role="alert"><span>{t.roomPreviewError}</span><button onClick={()=>setRetry(v=>v+1)}><RotateCcw size={15}/>{t.roomRetry}</button></div>}
      {!cabinets.length&&<div className="studio-room-preview__empty">{t.emptyRoom}</div>}
      {!compact&&onSelect&&groups.map(({cabinet,x,y,width,height})=><button key={cabinet.kind} className="studio-room-hotspot" aria-label={`${t.selectCabinet} · ${l.kinds[cabinet.kind]}`} aria-pressed={selectedId===cabinet.id} style={{left:`${x/512*100}%`,top:`${y/(1024/3)*100}%`,width:`${width/512*100}%`,height:`${height/(1024/3)*100}%`}} onClick={()=>onSelect(cabinet.id)} />)}
    </div>
    {!compact&&onZoom&&<figcaption><button onClick={onZoom}><ZoomIn size={16}/>{t.zoom}</button></figcaption>}
  </figure>;
}
