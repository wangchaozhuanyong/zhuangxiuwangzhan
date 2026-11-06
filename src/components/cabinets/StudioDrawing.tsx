import { useId } from 'react';
import { cabinetScene, type StudioCabinet, type StudioDesign } from '@/lib/cabinetStudio';
import { finishById, type FinishId } from '@/data/cabinetStudio';
import labels from '@/i18n/cabinetStudioCatalog.json';
import text from '@/i18n/cabinetStudioText.json';
import { useLanguage } from '@/i18n/LanguageContext';

export function FinishPattern({ id, finish, horizontal = false }: { id: string; finish: FinishId; horizontal?: boolean }) {
  const f = finishById(finish);
  return <pattern id={id} width="180" height="240" patternUnits="userSpaceOnUse" patternTransform={horizontal ? 'rotate(90)' : undefined}>
    <rect width="180" height="240" fill={f.colour} />
    {f.kind !== 'solid' && <image href={`/images/custom-cabinets/v2/textures/${finish}.webp`} width="180" height="240" preserveAspectRatio="xMidYMid slice" />}
  </pattern>;
}
export function FinishSwatch({ finish, large = false }: { finish: FinishId; large?: boolean }) {
  const id = useId().replaceAll(':', '');
  return <svg className={large ? 'studio-texture studio-texture--large' : 'studio-texture'} viewBox="0 0 180 180" aria-hidden="true"><defs><FinishPattern id={id} finish={finish} /></defs><rect width="180" height="180" fill={`url(#${id})`} /></svg>;
}

function CabinetShape({ cabinet: c, x, y, width, height, prefix }: { cabinet: StudioCabinet; x: number; y: number; width: number; height: number; prefix: string }) {
  const panels = Math.max(1, Math.min(10, Math.round(c.width / 500), Math.floor(width / 22)));
  const frame = c.door !== 'flat';
  const body = finishById(c.finishes.body).colour;
  const handle = { hidden: body, brass: '#A38855', nickel: '#C1C4C0', black: '#343833' }[c.handle];
  const projection = Math.max(6, Math.min(24, c.depth / 30));
  return <>
    <defs>{Object.entries(c.finishes).map(([role, finish]) => <FinishPattern key={role} id={`${prefix}-${role}`} finish={finish} horizontal={c.grain === 'horizontal'} />)}</defs>
    <path d={`M ${x + width} ${y} l ${projection} -${projection / 2} v ${height} l -${projection} ${projection / 2} Z`} fill={`url(#${prefix}-body)`} stroke="#34382f" strokeOpacity=".3" />
    <rect x={x} y={y} width={width} height={height} fill={body} stroke="#34382f" strokeOpacity=".3" />
    {Array.from({ length: panels }, (_, n) => {
      const gap = Math.min(3, width / panels / 8);
      const w = width / panels - gap; const px = x + n * width / panels + gap / 2;
      const detailed = w > 26 && height > 40;
      const open = c.kind === 'bookcase' || c.kind === 'sideboard' && n === panels - 1;
      const glass = c.door === 'glass' && n % 3 === 1;
      return <g key={n}>
        <rect x={px} y={y + Math.min(3, height / 8)} width={w} height={height - Math.min(6, height / 4)} fill={`url(#${prefix}-${open ? 'open' : 'front'})`} />
        {detailed && frame && !open && <rect x={px + 9} y={y + 13} width={w - 18} height={height - 26} fill={glass ? `url(#${prefix}-open)` : 'none'} stroke="#484132" strokeOpacity=".35" strokeWidth={c.door === 'classic' ? 4 : 1.6} />}
        {detailed && glass && <rect x={px + 9} y={y + 13} width={w - 18} height={height - 26} fill="#38433C" fillOpacity=".35" />}
        {detailed && c.door === 'classic' && <rect x={px + 15} y={y + 20} width={Math.max(2, w - 30)} height={height - 40} fill="none" stroke="#FFF8E6" strokeOpacity=".45" strokeWidth="2" />}
        {(open || glass) && [1, 2, 3].map(v => <rect key={v} x={px} y={y + height * v / 4} width={w} height="4" fill={body} />)}
        {detailed && c.door === 'reeded' && Array.from({ length: 8 }, (_, i) => <path key={i} d={`M ${px + w * (i + 1) / 9} ${y + 5} v ${height - 10}`} stroke="#2C291F" strokeOpacity=".2" />)}
        {detailed && c.door === 'lattice' && [1, 2, 3].map(v => <path key={v} d={`M ${px + 12} ${y + height * v / 4} h ${w - 24} M ${px + w / 2} ${y + 14} v ${height - 28}`} stroke="#332B20" strokeOpacity=".45" strokeWidth="3" />)}
        {detailed && !open && (c.handle === 'hidden' ? <path d={`M ${px + 4} ${y + 8} h ${w - 8}`} stroke="#3D3930" strokeWidth="3" strokeOpacity=".6" /> : <rect x={px + w - 12} y={y + height * .45} width="3" height={Math.min(25, height / 4)} rx="1.5" fill={handle} />)}
      </g>;
    })}
    {['base', 'tv', 'sideboard'].includes(c.kind) && <rect x={x - 3} y={y - 5} width={width + 6} height="7" fill={`url(#${prefix}-top)`} stroke="#6A675C" strokeOpacity=".3" />}
    {c.door === 'classic' && <><rect x={x - 5} y={y - 8} width={width + 10} height="8" fill={body} /><rect x={x - 8} y={y - 12} width={width + 16} height="4" fill={`url(#${prefix}-front)`} /></>}
  </>;
}

export default function StudioDrawing({ design, selected, onSelect }: { design: StudioDesign; selected?: string; onSelect?: (id: string) => void }) {
  const { language } = useLanguage(); const l = labels[language]; const t = text[language];
  const prefix = useId().replaceAll(':', '');
  const cabinets = design.cabinets.filter(c => cabinetScene(c) === design.scene);
  const kitchen = design.scene === 'kitchen';
  const rowWidth = (upper: boolean) => cabinets.filter(c => !kitchen || (c.kind === 'wall') === upper).reduce((sum, c) => sum + c.width, 0);
  const total = kitchen ? Math.max(rowWidth(true), rowWidth(false), 1) : rowWidth(false) || 1;
  const kitchenHeight = Math.max(850, ...cabinets.filter(c => c.kind === 'base').map(c => c.height)) + 650 + Math.max(750, ...cabinets.filter(c => c.kind === 'wall').map(c => c.height));
  const rowCount = (upper: boolean) => cabinets.filter(c => !kitchen || (c.kind === 'wall') === upper).length;
  const maxGaps = Math.max(0, Math.max(rowCount(true), rowCount(false)) - 1) * 18;
  const scale = Math.min((700 - maxGaps) / total, 360 / (kitchen ? kitchenHeight : Math.max(2400, ...cabinets.map(c => c.height))));
  const rowStart = (upper: boolean) => (900 - rowWidth(upper) * scale - Math.max(0, rowCount(upper) - 1) * 18) / 2;
  const offsets = { upper: rowStart(true), lower: rowStart(false) };
  return <svg className="studio-drawing" viewBox="0 0 900 600" role="group" aria-label={`${t.study} · ${l.scenes[design.scene]}`}>
    <rect width="900" height="600" fill="#EEEAE2" /><path d="M 0 505 H 900 V 600 H 0 Z" fill="#DDD5C8" /><path d="M 0 505 H 900" stroke="#CFC7BA" />
    {cabinets.map(c => {
      const width = c.width * scale; const height = c.height * scale;
      const row = kitchen && c.kind === 'wall' ? 'upper' : 'lower';
      const x = offsets[row]; offsets[row] += width + 18;
      const y = row === 'upper' ? 495 - (Math.max(850, ...cabinets.filter(item => item.kind === 'base').map(item => item.height)) + 650 + c.height) * scale : 495 - height;
      const labelY = row === 'upper' ? y - 32 : 524;
      return <g key={c.id} role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined} aria-label={`${l.kinds[c.kind]} ${c.width} × ${c.height} × ${c.depth} ${t.mm}`} aria-pressed={onSelect ? c.id === selected : undefined} onClick={() => onSelect?.(c.id)} onKeyDown={event => { if (onSelect && ['Enter', ' '].includes(event.key)) { event.preventDefault(); onSelect(c.id); } }} className={onSelect ? 'studio-drawing__cabinet' : undefined}>
        <CabinetShape cabinet={c} x={x} y={y} width={width} height={height} prefix={`${prefix}-${c.id}`} />
        {c.id === selected && <rect x={x - 4} y={y - 16} width={width + 8} height={height + 21} fill="none" stroke="#3F4E42" strokeWidth="2.5" strokeDasharray="6 4" />}
        <path d={`M ${x} ${labelY} h ${width} M ${x} ${labelY - 4} v 8 M ${x + width} ${labelY - 4} v 8`} stroke="#73786C" />
        <text x={x + width / 2} y={labelY + (row === 'upper' ? -8 : 23)} textAnchor="middle" fill="#444B40" fontSize="14">{c.width} {t.mm}</text>
      </g>;
    })}
    {!cabinets.length && <text x="450" y="300" textAnchor="middle" fill="#687064" fontSize="18">{t.emptyRoom}</text>}
  </svg>;
}
