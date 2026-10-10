import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { inspectRawMetadata, inspectHydratedMetadata } from "../../scripts/lib/publisher-public-readback.mjs";

describe("source-derived exact public metadata", () => {
  it("rejects extra text, altered spaces, and an old brand description in strict raw and hydrated checks", () => {
    const expected = { title: "闪铸设计 | FLASH CAST", description: "完整说明。闪铸设计关联 FLASH CAST。" };
    const html = (title: string, description: string) => `<title>${title}</title><meta name="description" content="${description}">`;
    expect(inspectRawMetadata(html(expected.title, expected.description), expected.title, expected.description, true)).toEqual({ titleFound: true, descriptionMatches: true });
    for (const altered of [{ ...expected, title: `${expected.title} extra` }, { ...expected, title: "闪铸设计  | FLASH CAST" },
      { ...expected, description: "完整说明。" }, { ...expected, description: `${expected.description} extra` }]) {
      expect(Object.values(inspectRawMetadata(html(altered.title, altered.description), expected.title, expected.description, true)).every(Boolean)).toBe(false);
      expect(Object.values(inspectHydratedMetadata(altered, expected)).every(Boolean)).toBe(false);
    }
  });
  it("derives actual mapper/Edge/PageMeta differences and rejects changed public identity before any write", () => {
    // esbuild runs in native Node, outside the DOM-emulator Uint8Array realm.
    const code = `
      import assert from 'node:assert/strict';
      import {readFileSync} from 'node:fs';
      import {deriveReviewedPublicMetadata,readReviewedPublicIdentity} from './scripts/lib/publisher-reviewed-metadata.mjs';
      import {readRemainder9Registry} from './scripts/publish-remainder9-after-37903094390.mjs';
      import {targetConfigs} from './scripts/publish-content-trust-fixes.mjs';
      const prepared=readRemainder9Registry(), reviewed=JSON.parse(readFileSync(prepared.proof.rendererReviewPath));
      const observed=reviewed.metadataContract.rows, results=[];
      for(const [index,entry] of prepared.original.entries.entries()){
        const row=index<11?prepared.proof.completed[index].publicCurrentProjection:targetConfigs[entry.target].buildRecord(JSON.parse(readFileSync(targetConfigs[entry.target].lockedCandidate.rollbackRecordPath)));
        for(const config of targetConfigs[entry.target].publicPaths){
          const language=config.path.startsWith('/zh/')?'zh':'en';
          const value=await deriveReviewedPublicMetadata({entry,row,language,path:config.path,identity:prepared.proof.publicIdentity});
          const frozen=observed.find(page=>page.path===config.path);
          assert.deepEqual(value.raw,frozen.raw);assert.deepEqual(value.hydrated,frozen.hydrated);
          assert.deepEqual(value.mappedPageMetaProps,frozen.mappedPageMetaProps);assert.deepEqual(value.sourceSha256,prepared.proof.metadataSourceSha256);
          results.push({...value,path:config.path});
        }
      }
      assert.equal(results.length,40);
      assert.deepEqual(results.filter(row=>row.raw.title!==row.hydrated.title||row.raw.description!==row.hydrated.description).map(row=>row.path),[
        '/en/services/old-house','/zh/services/old-house',
        '/zh/blog/klang-valley-renovation-cost-2026','/en/blog/small-condo-storage-design-ideas','/en/blog/built-in-furniture-small-condo-storage']);
      const design=results.find(row=>row.path==='/zh/services/design');assert.ok(design.hydrated.title.startsWith('闪铸设计'));
      assert.ok(design.hydrated.description.includes('FLASH CAST'));assert.ok(design.hydrated.description.includes('闪铸设计'));
      const entry=prepared.original.entries[0],row=prepared.proof.completed[0].publicCurrentProjection;
      await assert.rejects(deriveReviewedPublicMetadata({entry,row,language:'zh',path:'/zh/services/other',identity:prepared.proof.publicIdentity}),/Exact reviewed row/);
      const actualFetch=globalThis.fetch;let calls=0;
      globalThis.fetch=async(url,options)=>{calls++;assert.equal(options.method,'GET');assert.equal(new URL(url).pathname,'/rest/v1/site_settings');
        assert.equal(new URL(url).searchParams.get('select'),'id,company_name,brand_name,updated_at');
        return {ok:true,json:async()=>[{...prepared.proof.publicIdentity,brand_name:'Changed identity'}]};};
      await assert.rejects(readReviewedPublicIdentity({VITE_SUPABASE_URL:'https://rbsnyexjifounogswrjp.supabase.co',VITE_SUPABASE_ANON_KEY:'test-placeholder'},prepared.proof.publicIdentity),/identity changed/);
      assert.equal(calls,1);globalThis.fetch=actualFetch;
      console.log(JSON.stringify({pass:true,pages:results.length,productionWrites:0}));
    `;
    const result = spawnSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-"], { input: code, encoding: "utf8", timeout: 30000 });
    expect(result.status, result.stderr.slice(0, 1000)).toBe(0);
    expect(JSON.parse(result.stdout.trim())).toEqual({ pass: true, pages: 40, productionWrites: 0 });
  }, 35000);
});
