import { test, expect } from '@playwright/test';
import p from '../src/i18n/cabinetPaletteText.json' with {type:'json'};
import t from '../src/i18n/cabinetStudioText.json' with {type:'json'};
test('catalogue and one colour dialog preserve the selected scene in this browser',async({page})=>{
  await page.route('**/*',route=>{const r=route.request(),u=new URL(r.url()),read=r.method()==='POST'&&u.pathname==='/rest/v1/rpc/get_public_home_bundle';if((!['GET','HEAD','OPTIONS'].includes(r.method())&&!read)||/google-analytics|googletagmanager|cloudflareinsights|doubleclick/.test(u.hostname)||/\/(?:__visit|functions\/v1\/(?:submit-lead|notify-lead))\b/.test(u.pathname))return route.abort();return route.continue();});
  await page.goto('/zh/custom-cabinets?fc_test=1');await expect(page.locator('[data-scheme]')).toHaveCount(12);
  await page.locator('[data-scheme="cream-1"] .studio-card__actions button').click();await page.getByRole('button',{name:p.zh.customize,exact:true}).click();await expect(page.locator('.studio-product')).toHaveAttribute('data-mode','colours');
  const preview=page.locator('.studio-product [data-room-render-state]');await expect(preview).toHaveAttribute('data-room-render-state','ready');
  const canvas=page.getByRole('dialog').locator('canvas');
  const sample=()=>canvas.evaluate((c:HTMLCanvasElement)=>{const ref=document.createElement('canvas');ref.width=768;ref.height=512;ref.getContext('2d',{willReadFrequently:true})!.drawImage(c,0,0,768,512);const data=ref.getContext('2d')!.getImageData(0,0,768,512).data;const out:number[]=[];for(let y=0;y<512;y+=4)for(let x=0;x<768;x+=4)for(let n=0;n<3;n++)out.push(data[(y*768+x)*4+n]!);return out;});
  await expect(preview).toHaveAttribute('data-room-layer','photo');await page.getByRole('dialog').locator('img').evaluate((img:HTMLImageElement)=>img.decode());await expect(canvas).not.toHaveClass('is-painted');
  const pixelHash=()=>canvas.evaluate((c:HTMLCanvasElement)=>{const data=c.getContext('2d')!.getImageData(0,0,c.width,c.height).data;let hash=2166136261;for(const value of data)hash=Math.imul(hash^value,16777619);return `${c.width}x${c.height}:${hash>>>0}`;});
  const original=await canvas.evaluate((c:HTMLCanvasElement)=>{const image=c.parentElement!.querySelector('img')!;const reference=document.createElement('canvas');reference.width=768;reference.height=512;reference.getContext('2d',{willReadFrequently:true})!.drawImage(image,0,0,768,512);const data=reference.getContext('2d')!.getImageData(0,0,768,512).data;const out:number[]=[];for(let y=0;y<512;y+=4)for(let x=0;x<768;x+=4)for(let n=0;n<3;n++)out.push(data[(y*768+x)*4+n]!);return out;});
  await page.locator('[data-finish="walnut"]').click();await expect(page.locator('[data-finish="walnut"]')).toHaveAttribute('aria-pressed','true');await expect(preview).toHaveAttribute('data-room-render-state','ready');
  await expect(preview).toHaveAttribute('data-room-layer','material');expect(await canvas.evaluate((c:HTMLCanvasElement)=>c.getContext('2d')!.getImageData(1,1,1,1).data[3])).toBe(255);
  const before=await sample(),configuration=await canvas.getAttribute('data-configuration'),beforeHash=await pixelHash();
  const delta=(a:number[],b:number[])=>a.reduce((total,value,i)=>total+Math.abs(value-b[i]!),0)/a.length;
  expect(delta(original,before),'the selected walnut must visibly replace the cream material').toBeGreaterThan(3);
  await expect(page.getByRole('link',{name:p.zh.consult,exact:true})).toBeVisible();
  await page.getByRole('button',{name:t.zh.save,exact:true}).click();await expect(page.getByRole('dialog')).toContainText(t.zh.savedOk);
  await page.reload();await expect(page.locator('[data-finish="walnut"]')).toHaveAttribute('aria-pressed','true');await expect(preview).toHaveAttribute('data-room-render-state','ready');
  // Only the currently painted resolution may be ready; a refresh must restore
  // the same configuration, source and complete raster.
  await expect(canvas).toHaveAttribute('data-configuration',configuration!);
  const after=await sample();expect(delta(original,after)).toBeGreaterThan(3);
  expect(await pixelHash()).toBe(beforeHash);expect(delta(before,after)).toBe(0);
  console.log(JSON.stringify({restoredMeanChannelDifference:delta(before,after),changedFromOriginalBefore:delta(original,before),changedFromOriginalAfter:delta(original,after)}));
  await expect(preview).toHaveAttribute('data-room-image','/images/custom-cabinets/v2/cream-1-kitchen.webp');
  expect(await page.getByRole('dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
});
