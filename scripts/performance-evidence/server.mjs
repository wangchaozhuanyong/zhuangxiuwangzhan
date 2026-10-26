import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import { createHash, X509Certificate } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { loadEnv } from 'vite';
const root = process.env.PERFORMANCE_PUBLIC_ENV_DIR || path.dirname(path.resolve(execFileSync('git', ['rev-parse', '--git-common-dir'], { encoding: 'utf8' }).trim()));
const originalFetch = globalThis.fetch;
export async function start(profile, { secure = false } = {}) {
  const port = Number(process.env.PERFORMANCE_PORT || "4387");
  const output = path.resolve('tmp/performance-evidence', profile);
  const bundle = path.resolve('tmp/performance-evidence', `middleware-${profile}.mjs`);
  if (profile === 'baseline' && !fs.existsSync(bundle) && execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim() !== 'c502ed547ff28be63b226e2f87f3ea9e29e2347d') throw new Error('Missing frozen baseline middleware; create it from c502ed54 first.');
  if (process.env.PERFORMANCE_FROZEN_MIDDLEWARE === '1' && !fs.existsSync(bundle)) throw new Error('Missing frozen middleware; preserve the original source bundle rather than rebuilding it from a candidate.');
  if ((profile !== 'baseline' && process.env.PERFORMANCE_FROZEN_MIDDLEWARE !== '1') || !fs.existsSync(bundle)) await build({ entryPoints: ['functions/_middleware.ts'], bundle: true, platform: 'node', format: 'esm', outfile: bundle, logLevel: 'silent' });
  const reads = [];
  globalThis.fetch = async (input, options) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    const method = options?.method || (input instanceof Request ? input.method : 'GET');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !(method === 'POST' && url.pathname === '/rest/v1/rpc/get_public_home_bundle')) throw new Error('Read-only server blocked write');
    const begin = performance.now();
    const response = await originalFetch(input, options);
    if (url.pathname.startsWith('/rest/')) {
      const size = (await response.clone().arrayBuffer()).byteLength;
      reads.push({ path: url.pathname + url.search, status: response.status, bytes: size, duration: performance.now() - begin });
    }
    return response;
  };
  const cache = new Map();
  globalThis.caches = { default: { match: async request => cache.get(request.url)?.clone(), put: async (request, response) => { cache.set(request.url, response.clone()); } } };
  const { onRequest } = await import(pathToFileURL(bundle).href + `?at=${Date.now()}`);
  const env = { ...loadEnv('production', root, 'VITE_'), CF_PAGES_COMMIT_SHA: 'c502ed547ff28be63b226e2f87f3ea9e29e2347d' };
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webm': 'video/webm' };
  const asset = async request => {
    const pathname = decodeURIComponent(new URL(request.url).pathname);
    let file = path.resolve(output, '.' + pathname);
    if (!file.startsWith(output + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(output, 'index.html');
    const headers = { 'content-type': mime[path.extname(file)] || 'application/octet-stream', 'cache-control': file.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable' };
    const size = fs.statSync(file).size;
    const range = request.headers.get('range')?.match(/^bytes=(\d+)-(\d*)$/);
    if (range) {
      const first = Number(range[1]), last = Math.min(size - 1, range[2] ? Number(range[2]) : size - 1);
      const handle = fs.openSync(file, 'r'), data = Buffer.alloc(last - first + 1);
      fs.readSync(handle, data, 0, data.length, first); fs.closeSync(handle);
      return new Response(data, { status: 206, headers: { ...headers, 'content-range': `bytes ${first}-${last}/${size}`, 'content-length': String(data.length) } });
    }
    return new Response(fs.readFileSync(file), { headers });
  };
  env.ASSETS = { fetch: asset };
  let fixture;
  if(secure){
    try{
      // Fixture material stays in this process only: no key/certificate files,
      // no OS trust-store changes, and no production certificates are read.
      const pem=execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout','/dev/stdout','-out','/dev/stdout','-days','1','-subj','/CN=flashcast.com.my'],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
      const key=pem.match(/-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA )?PRIVATE KEY-----/)?.[0];
      const cert=pem.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/)?.[0];
      if(!key||!cert)throw new Error('Invalid fixture');
      const certificatePin=createHash('sha256').update(new X509Certificate(cert).publicKey.export({type:'spki',format:'der'})).digest('base64');
      fixture={key,cert,certificatePin};
    }catch{throw new Error('Ephemeral local TLS fixture could not be created; no fixture output is logged.');}
  }
  const scheme=secure?'https':'http';
  const handler=async (incoming, outgoing) => {
    try {
      const request = new Request(`${scheme}://127.0.0.1:${port}${incoming.url}`, { method: incoming.method, headers: incoming.headers });
      const waits = [];
      const response = await onRequest({ request, env, next: () => asset(request), waitUntil: promise => waits.push(promise), data: {}, params: {} });
      const headers = Object.fromEntries(response.headers);
      // This adapter is loopback HTTP. WebKit upgrades those URLs and cannot
      // connect to its HTTP socket. Keep production source/CSP untouched; omit
      // only that transport directive locally, retaining all script/style hashes.
      if (!secure&&headers['content-security-policy']) headers['content-security-policy'] = headers['content-security-policy'].replace(/(?:^|;\s*)upgrade-insecure-requests\s*(?=;|$)/g, '');
      let bytes = Buffer.from(await response.arrayBuffer());
      if (/gzip/.test(incoming.headers['accept-encoding'] || '') && /text\/|javascript|json|svg/.test(headers['content-type'] || '') && response.status !== 304) {
        bytes = gzipSync(bytes); headers['content-encoding'] = 'gzip'; headers.vary = 'Accept-Encoding'; delete headers['content-length'];
      }
      outgoing.writeHead(response.status, headers);
      outgoing.end(bytes);
      await Promise.allSettled(waits);
    } catch (error) { outgoing.writeHead(500, { 'content-type': 'text/plain' }); outgoing.end(String(error.message)); }
  };
  const server=secure?https.createServer({key:fixture.key,cert:fixture.cert},handler):http.createServer(handler);
  await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
  const url=`${scheme}://127.0.0.1:${port}`;
  const warm=async pathname=>{
    const request=new Request(url+pathname),waits=[];
    const response=await onRequest({request,env,next:()=>asset(request),waitUntil:promise=>waits.push(promise),data:{},params:{}});
    await response.arrayBuffer();await Promise.allSettled(waits);
  };
  return { url, reads, warm, certificatePin:fixture?.certificatePin, close: async () => { globalThis.fetch = originalFetch; await new Promise(resolve => server.close(resolve)); } };
}
