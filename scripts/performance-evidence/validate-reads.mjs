import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import { loadEnv } from 'vite';
const env = loadEnv('production',process.env.PERFORMANCE_PUBLIC_ENV_DIR || path.dirname(path.resolve(execFileSync('git',['rev-parse','--git-common-dir'],{encoding:'utf8'}).trim())),'VITE_');
const compiled = await build({ entryPoints:['src/lib/publicContentFields.ts'],bundle:true,platform:'node',format:'esm',write:false });
const fields = await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const results = [];
for (const [table,select,order] of [['services',fields.PUBLIC_SERVICE_FIELDS,'sort_order.asc'],['blog_posts',fields.PUBLIC_BLOG_FIELDS,'published_at.desc']]) {
  const read = async selection => {
    const url = new URL(env.VITE_SUPABASE_URL+'/rest/v1/'+table);
    url.search = new URLSearchParams({select:selection,status:'eq.published',order}).toString();
    const response = await fetch(url,{headers:{apikey:env.VITE_SUPABASE_ANON_KEY,Authorization:'Bearer '+env.VITE_SUPABASE_ANON_KEY}});
    if (!response.ok) throw new Error(table+' public select failed: '+response.status);
    const text = await response.text(); return { bytes:Buffer.byteLength(text),rows:JSON.parse(text) };
  };
  const [before,after] = await Promise.all([read('*'),read(select.join(','))]);
  const same = JSON.stringify(before.rows.map(row=>select.map(key=>row[key])))===JSON.stringify(after.rows.map(row=>select.map(key=>row[key])));
  if (!same) throw new Error('Selected presentation fields differ: '+table);
  results.push({table,beforeBytes:before.bytes,afterBytes:after.bytes,rows:after.rows.length,allSelectedValuesAndOrderEqual:true,fields:select});
}
fs.writeFileSync('tmp/performance-evidence/public-select-comparison.json',JSON.stringify(results,null,2)+'\n'); console.log(JSON.stringify(results));
