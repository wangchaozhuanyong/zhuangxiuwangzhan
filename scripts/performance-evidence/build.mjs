import { build, loadEnv } from 'vite';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = process.env.PERFORMANCE_PUBLIC_ENV_DIR || path.dirname(path.resolve(execFileSync('git', ['rev-parse', '--git-common-dir'], { encoding: 'utf8' }).trim()));
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (process.argv[2] === 'baseline' && sourceSha !== 'c502ed547ff28be63b226e2f87f3ea9e29e2347d') throw new Error('Build baseline only from the recorded c502ed54 source, never from the candidate.');
Object.assign(process.env, loadEnv('production', root, 'VITE_'));
process.env.VITE_APP_VERSION = 'c502ed547ff28be63b226e2f87f3ea9e29e2347d';
await build({ mode: 'production', build: { outDir: `tmp/performance-evidence/${process.argv[2] || 'baseline'}` } });

const profile = process.argv[2] || 'baseline';
const diff=execFileSync('git',['diff','--binary','HEAD'],{maxBuffer:128*1024*1024});
fs.writeFileSync(`tmp/performance-evidence/${profile}-build-receipt.json`, JSON.stringify({ sourceSha, dirty:diff.length>0, trackedPatchSha256:diff.length?createHash('sha256').update(diff).digest('hex'):undefined, profile, compiledVersionPinnedForComparison: process.env.VITE_APP_VERSION, builtAt: new Date().toISOString() }, null, 2) + '\n');
