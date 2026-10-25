import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { loadEnv } from 'vite';

const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const directory=path.resolve('tmp/performance-evidence/strict-'+sha);
const archive=directory+'.tar';
if(fs.existsSync(directory))throw new Error('Strict build directory already exists; keep its evidence and choose a new source commit.');
fs.mkdirSync(directory,{recursive:true});
execFileSync('git',['archive','--format=tar','--output='+archive,sha]);
execFileSync('tar',['-xf',archive,'-C',directory]);
const root=process.env.PERFORMANCE_PUBLIC_ENV_DIR||path.dirname(path.resolve(execFileSync('git',['rev-parse','--git-common-dir'],{encoding:'utf8'}).trim()));
const env={...process.env,...loadEnv('production',root,'VITE_'),VITE_APP_VERSION:sha};
const child=spawn('npm',['run','build'],{cwd:directory,env,stdio:'inherit'});
const code=await new Promise(resolve=>child.on('exit',resolve));
fs.writeFileSync('tmp/performance-evidence/strict-final-build-receipt.json',JSON.stringify({sha,directory,exactGitArchive:true,exitCode:code,completedAt:new Date().toISOString()},null,2)+'\n');
process.exitCode=code??1;
