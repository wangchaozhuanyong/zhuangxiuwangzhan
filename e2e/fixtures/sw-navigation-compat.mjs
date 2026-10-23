import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

// Frozen pre-candidate behavior, including its original scope and cache name.
const legacyWorker = `const OFFLINE_CACHE = "flashcast-offline-v2";
const OFFLINE_URL = "/offline";
self.addEventListener("install", event => event.waitUntil(
  caches.open(OFFLINE_CACHE)
    .then(cache => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
    .then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith("flashcast-offline-") && key !== OFFLINE_CACHE)
    .map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", event => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request, { cache: "no-store" })
    .catch(async () => (await caches.match(OFFLINE_URL)) || Response.error()));
});`;

export async function startSwNavigationFixture(port = 0) {
  const candidate = await readFile(new URL("../../public/sw.js", import.meta.url), "utf8");
  let version = "legacy";
  let offline = false;
  let documentCount = 0;
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const send = (body, type = "text/html") => {
      res.writeHead(200, { "Content-Type": `${type}; charset=utf-8`, "Cache-Control": "no-store" });
      res.end(body);
    };
    if (url.pathname === "/__sw-test/mode" && req.method === "POST") {
      const selected = url.searchParams.get("version");
      if (selected === "legacy" || selected === "candidate") version = selected;
      if (url.searchParams.has("offline")) offline = url.searchParams.get("offline") === "1";
      send(JSON.stringify({ version, offline, documentCount }), "application/json");
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405); res.end(); return;
    }
    if (url.pathname === "/sw.js") { send(version === "legacy" ? legacyWorker : candidate, "text/javascript"); return; }
    if (url.pathname === "/offline") { send('<h1>旧版定制离线页</h1>'); return; }
    if (url.pathname === "/favicon.ico") { res.writeHead(204); res.end(); return; }
    if (offline) { req.socket.destroy(); return; }
    send(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>装修官网离线服务升级测试</title></head><body>
      <h1>装修官网离线服务升级测试</h1>
      <p>这是本机生命周期测试页，不是装修官网或 HTTPS 真机验收。</p>
      <p>文档编号：<span id="document-id">${++documentCount}</span></p>
      <label>未提交的测试草稿 <input id="draft" autocomplete="off"></label>
      <p><button id="legacy">安装旧版本</button> <button id="candidate">升级候选版本</button>
      <button id="offline">模拟断网</button> <button id="online">恢复联网</button>
      <button id="cleanup">清理本次测试数据</button></p>
      <p><a href="/zh/services" target="_blank">在新标签打开测试导航</a></p>
      <pre id="result" role="status">等待测试</pre>
      <script>
      const result = document.querySelector('#result');
      const mode = query => fetch('/__sw-test/mode?' + query, {method:'POST'});
      const waitForController = previous => new Promise((resolve, reject) => {
        if (navigator.serviceWorker.controller && navigator.serviceWorker.controller !== previous) { resolve(); return; }
        const timer = setTimeout(() => { navigator.serviceWorker.removeEventListener('controllerchange', changed); reject(new Error('Controller timeout')); }, 10000);
        const changed = () => { if (navigator.serviceWorker.controller && navigator.serviceWorker.controller !== previous) { clearTimeout(timer); navigator.serviceWorker.removeEventListener('controllerchange', changed); resolve(); } };
        navigator.serviceWorker.addEventListener('controllerchange', changed);
        changed();
      });
      document.querySelector('#legacy').onclick = async () => {
        try {
          await mode('version=legacy&offline=0');
          const previous = navigator.serviceWorker.controller;
          const registration = await navigator.serviceWorker.register('/sw.js', {scope:'/', updateViaCache:'none'});
          await navigator.serviceWorker.ready;
          if (registration.installing || registration.waiting || !navigator.serviceWorker.controller) await waitForController(previous);
          localStorage.setItem('sw-test-business', 'keep');
          sessionStorage.setItem('sw-test-session', 'keep');
          document.cookie = 'sw-test-cookie=keep; SameSite=Lax; path=/';
          await (await caches.open('sw-test-unrelated')).put('/sentinel', new Response('keep'));
          result.textContent = '旧版本已接管；测试存储已准备';
        } catch(error) { result.textContent = '失败：' + error.message; }
      };
      document.querySelector('#candidate').onclick = async () => {
        try {
          const before = {draft:document.querySelector('#draft').value, document:document.querySelector('#document-id').textContent};
          const previous = navigator.serviceWorker.controller;
          await mode('version=candidate&offline=0');
          const registration = await navigator.serviceWorker.getRegistration('/');
          if (!registration) throw new Error('Legacy registration missing');
          await registration.update();
          await waitForController(previous);
          const snapshot = {
            draftPreserved:document.querySelector('#draft').value === before.draft,
            documentPreserved:document.querySelector('#document-id').textContent === before.document,
            localStoragePreserved:localStorage.getItem('sw-test-business') === 'keep',
            sessionStoragePreserved:sessionStorage.getItem('sw-test-session') === 'keep',
            cookiePreserved:document.cookie.split('; ').includes('sw-test-cookie=keep'),
            unrelatedCachePreserved:await (await caches.match('/sentinel')).text() === 'keep',
            oldOfflineCachePreserved:(await caches.keys()).includes('flashcast-offline-v2')
          };
          result.textContent = JSON.stringify(snapshot, null, 2);
        } catch(error) { result.textContent = '失败：' + error.message; }
      };
      document.querySelector('#offline').onclick = async () => { await mode('offline=1'); result.textContent = '已模拟断网；请用新标签打开测试导航'; };
      document.querySelector('#online').onclick = async () => { await mode('offline=0'); result.textContent = '已恢复联网'; };
      document.querySelector('#cleanup').onclick = async () => {
        await mode('offline=0');
        const registration = await navigator.serviceWorker.getRegistration('/');
        if (registration && registration.active?.scriptURL === location.origin + '/sw.js') await registration.unregister();
        await Promise.all(['flashcast-offline-v2', 'sw-test-unrelated'].map(name => caches.delete(name)));
        localStorage.removeItem('sw-test-business');
        sessionStorage.removeItem('sw-test-session');
        document.cookie = 'sw-test-cookie=; Max-Age=0; SameSite=Lax; path=/';
        result.textContent = '本次本机测试数据已清理';
      };
      </script></body></html>`);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  const address = server.address();
  return {
    origin: `http://127.0.0.1:${address.port}`,
    setVersion: next => { version = next; },
    setOffline: next => { offline = next; },
    close: () => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }),
  };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const fixture = await startSwNavigationFixture(Number(process.argv[2] || 4198));
  console.log(`Local service worker fixture: ${fixture.origin}`);
}
