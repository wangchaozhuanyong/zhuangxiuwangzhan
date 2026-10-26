import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { collectInitialJavaScriptAssets } from '../lib/performance-budget.mjs';

const directory=path.resolve('tmp/performance-evidence');
const output=path.resolve('reports/performance-evidence-2026-10-26');
const read=name=>JSON.parse(fs.readFileSync(path.join(directory,name),'utf8'));
const median=values=>{const sorted=[...values].sort((a,b)=>a-b);return sorted.length%2?sorted[(sorted.length-1)/2]:(sorted[sorted.length/2-1]+sorted[sorted.length/2])/2;};
const range=values=>({median:median(values),min:Math.min(...values),max:Math.max(...values)});
const profiles={};
for(const profile of ['baseline','candidate']){
  const evidence=read(profile+'-evidence/results.json'),dist=path.join(directory,profile);
  const gzip=files=>files.reduce((sum,file)=>sum+gzipSync(fs.readFileSync(path.join(dist,file))).length,0);
  const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
  const refs=[...html.matchAll(/(?:src|href)=["'](\/assets\/[^"']+\.js)["']/g)].map(match=>match[1]);
  const initial=collectInitialJavaScriptAssets(dist,refs);
  const inline=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(([,attributes])=>!/(?:^|\s)src\s*=/i.test(attributes)&&(!/\btype\s*=/i.test(attributes)||/\btype\s*=\s*["'](?:module|(?:text|application)\/javascript)["']/i.test(attributes))).map(([, ,body])=>body).filter(body=>body.trim());
  const groups=new Map();
  for(const row of evidence.results){
    const key=[row.key,row.width,row.cache,row.network].join('|');
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);
  }
  const cohorts=[];
  for(const [key,rows]of groups){
    const [language,width,cache,network]=key.split('|');
    const jsFiles=row=>[...new Set(row.requests.filter(request=>request.path.startsWith('/assets/')&&request.path.endsWith('.js')&&request.start<=row.fullyVisibleObservedAt).map(request=>request.path))];
    cohorts.push({language,width:Number(width),cache,network,samples:rows.length,readyMs:range(rows.map(row=>row.readyAt)),brandRetiredMs:range(rows.map(row=>row.fullyVisibleObservedAt)),fontStableObservedMs:range(rows.map(row=>row.fontStableObservedAt)),lcpMs:range(rows.map(row=>row.lcp)),cls:range(rows.map(row=>row.cls)),initiallyInitiatedTransferBytes:range(rows.map(row=>row.initiatedBeforeVisibleWireBytes)),settledTransferBytes:range(rows.map(row=>row.settledWireBytes)),allScriptWireBytesBeforeVisible:range(rows.map(row=>row.allScriptWireBytesBeforeVisible)),allScriptWireBytesSettled:range(rows.map(row=>row.allScriptWireBytesSettled)),jsGzipBeforeVisible:range(rows.map(row=>gzip(jsFiles(row)))),jsFilesBeforeVisible:range(rows.map(row=>jsFiles(row).length)),longTaskCount:range(rows.map(row=>row.longTasks.length)),longTaskTotalMs:range(rows.map(row=>row.longTasks.reduce((sum,task)=>sum+task.duration,0))),suppressedCollectorIntents:rows.reduce((sum,row)=>sum+(row.suppressedCollectors||0),0),pending:rows.map(row=>row.pendingRequests),routeStates:rows.map(row=>row.routeState)});
  }
  const blockedKinds=[...new Set(evidence.results.flatMap(row=>row.requests.filter(request=>request.blocked).map(request=>`${request.method} ${request.path.replace(/\/\d+(?=\/|$)/g,'/:id')} ${request.type}`)))];
  profiles[profile]={sourceVersion:evidence.sourceVersion,browserVersion:evidence.browserVersion,testedAt:evidence.testedAt,initialStaticJsGzip:gzip(initial),inlineExecutableScripts:inline.length,inlineJsStandaloneGzip:inline.length?gzipSync(inline.join('\n')).length:0,staticModules:initial.length,htmlModuleReferences:new Set(refs).size,isolatedProductionHost:evidence.isolatedProductionHost,blockedThirdPartyRequestKinds:blockedKinds,cohorts,journeys:evidence.journeys.map(row=>({section:row.section,detail:row.detail,readCount:row.interaction.reads.length,interactionEventDurationsMs:row.interaction.events.map(event=>event.duration),longTasks:row.interaction.longTasks.length})),writesBlocked:evidence.writesBlocked};
}
const before=read('baseline-handoff.json').results,after=read('candidate-handoff.json').results;
const handoff=before.map((row,index)=>({path:row.path,beforeReads:row.browserReads.length,afterReads:after[index].browserReads.length,beforeSeedBytes:row.seedBytes,afterSeedBytes:after[index].seedBytes,textEqual:row.text===after[index].text,originalImagesAndOrderEqual:JSON.stringify(row.images)===JSON.stringify(after[index].images),beforeMaterialResponses:row.serverReads.filter(read=>read.path.startsWith('/rest/v1/materials?')).map(read=>read.bytes),afterMaterialResponses:after[index].serverReads.filter(read=>read.path.startsWith('/rest/v1/materials?')).map(read=>read.bytes)}));
const acceptance={};
for(const profile of ['baseline','candidate']){
  const value=read(profile+'-acceptance/results.json');
  acceptance[profile]={passed:value.results.filter(row=>row.status==='passed').length,total:value.results.length,failures:value.results.filter(row=>row.status!=='passed')};
}
const css=profile=>fs.readdirSync(path.join(directory,profile,'assets')).filter(name=>name.endsWith('.css')).map(name=>fs.readFileSync(path.join(directory,profile,'assets',name)).toString('base64')).sort();
const summary={profiles,handoff,selectedFields:read('public-select-comparison.json'),acceptance,cssBytesEqual:JSON.stringify(css('baseline'))===JSON.stringify(css('candidate')),occlusion:{before:read('baseline-listener-profile.json'),after:read('candidate-listener-profile.json')},failureRecovery:read('failure-recovery.json'),prefetch:{before:read('baseline-prefetch.json').results.map(({bodyText,...row})=>row),after:read('candidate-prefetch.json').results.map(({bodyText,...row})=>row)},strictBuild:read('strict-final-build-receipt.json'),fieldMetrics:{mobileP75:'NOT_MEASURED',desktopP75:'NOT_MEASURED',realUserINP:'NOT_MEASURED',physicalAndroidIPhoneSafari:'NOT_MEASURED'}};
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');
const columns=['profile','language','width','cache','network','samples','readyMs','brandRetiredMs','fontStableObservedMs','lcpMs','cls','initiallyInitiatedTransferBytes','settledTransferBytes','allScriptWireBytesBeforeVisible','allScriptWireBytesSettled','jsGzipBeforeVisible','jsFilesBeforeVisible','longTaskCount','longTaskTotalMs'];
const csv=[columns.join(',')];
for(const [profile,value]of Object.entries(profiles))for(const row of value.cohorts)csv.push(columns.map(column=>JSON.stringify(column==='profile'?profile:typeof row[column]==='object'?row[column].median:row[column])).join(','));
fs.writeFileSync(path.join(output,'home-cohorts.csv'),csv.join('\n')+'\n');
console.log(JSON.stringify({output,before:profiles.baseline.initialStaticJsGzip,after:profiles.candidate.initialStaticJsGzip,cssBytesEqual:summary.cssBytesEqual,handoffEqual:handoff.every(row=>row.textEqual&&row.originalImagesAndOrderEqual)}));
