// Generated from src/showroomUpdates.ts by scripts/generate-anzhe-boot.mjs.
(()=>{var E=e=>e==="zh"?"zh-CN":e==="ms"?"ms-MY":"en";var A="flashcast_lang",S="flashcast_site_lang",p="flashcast.com.my",C=e=>[p,"www."+p,"locks."+p].includes(e),N=e=>e==="en"||e==="zh"||e==="ms",K=e=>e.trim().toLowerCase().replace(/_/g,"-"),v=e=>{var o;let t=K((o=e[0])!=null?o:"");return t==="zh"||t.startsWith("zh-")?"zh":t==="ms"||t.startsWith("ms-")?"ms":"en"};var k={zh:{skipToContent:"\u8DF3\u5230\u4E3B\u8981\u5185\u5BB9",title:"\u9009\u62E9\u8BED\u8A00",description:"\u9009\u62E9\u4F60\u4E60\u60EF\u7684\u8BED\u8A00\uFF0C\u7EE7\u7EED\u6D4F\u89C8\u5F53\u524D\u9875\u9762\u3002",trigger:"\u5207\u6362\u8BED\u8A00",selected:"\u5F53\u524D\u8BED\u8A00",close:"\u5173\u95ED\u8BED\u8A00\u9009\u62E9",names:{zh:"\u7B80\u4F53\u4E2D\u6587",en:"\u82F1\u8BED",ms:"\u9A6C\u6765\u8BED"},shortNames:{zh:"\u4E2D\u6587",en:"EN",ms:"BM"},fallback:"\u90E8\u5206\u5185\u5BB9\u6682\u4EE5\u82F1\u6587\u663E\u793A\u3002"},en:{skipToContent:"Skip to main content",title:"Choose your language",description:"Choose a language to continue on this page.",trigger:"Change language",selected:"Selected",close:"Close language selection",names:{zh:"Simplified Chinese",en:"English",ms:"Malay"},shortNames:{zh:"ZH",en:"EN",ms:"BM"},fallback:"Some content is currently available in English."},ms:{skipToContent:"Langkau ke kandungan utama",title:"Pilih bahasa",description:"Pilih bahasa untuk terus melayari halaman ini.",trigger:"Tukar bahasa",selected:"Dipilih",close:"Tutup pilihan bahasa",names:{zh:"Bahasa Cina Ringkas",en:"Bahasa Inggeris",ms:"Bahasa Melayu"},shortNames:{zh:"ZH",en:"EN",ms:"BM"},fallback:"Sesetengah kandungan dipaparkan dalam Bahasa Inggeris buat sementara waktu."}};var _=k,de=Object.keys(k).map(e=>({code:e,tag:E(e)}));var Y=(e,t)=>{if(typeof document!="undefined")try{document.cookie=`${encodeURIComponent(e)}=${encodeURIComponent(t)}; Max-Age=31536000; Path=/; SameSite=Lax`}catch(o){}};var Q=(e,t)=>{if(typeof window!="undefined")try{window.localStorage.setItem(e,t)}catch(o){}};var V=(e,t,o=e)=>{Q(e,t),Y(o,t)};var J="fc-lang",Z=null,w=e=>N(e),U=(e=window.location.pathname)=>{let t=e.split("/").filter(Boolean)[0];return w(t)?t:null};var y=e=>{if(Z=e,V(J,e,A),C(location.hostname)&&location.protocol==="https:")try{document.cookie=`${S}=${e}; Domain=${p}; Path=/; Max-Age=31536000; Secure; SameSite=Lax`}catch(t){}};function R(){var d;let e=document.querySelector("details.lang-switch"),t=e==null?void 0:e.querySelector("[data-lang-trigger]");if(!e||!t)return;let o=e.querySelectorAll("a[data-lang]"),a=U();a&&y(a);function s(){var i,l;let n=new URL(location.href);n.searchParams.has("lang")&&n.searchParams.delete("lang");let r=(i=history.state)==null?void 0:i.showroomReturn;if(typeof r=="string"){let u=new URLSearchParams({"fc-return":r});n.hash&&u.set("section",n.hash.slice(1)),n.hash=u.toString()}for(let u of o){let m=new URL(u.href);m.search=n.search,m.hash=n.hash,n.protocol==="file:"&&(m.pathname=n.pathname.replace(/\/(zh|en|ms)\/((?:lock\/.*\/)?index\.html)$/,`/${u.dataset.lang}/$2`),(l=window.showroom)!=null&&l.setOfflineLanguage&&m.searchParams.set("lang",u.dataset.lang)),u.href=m.pathname+m.search+m.hash}}function c(n){let r=_[n];t.setAttribute("aria-label",`${r.trigger}: ${r.names[n]}`),t.querySelector(".lang-current-label").textContent=r.shortNames[n],e.querySelector("nav").setAttribute("aria-label",r.title);for(let i of o){let l=i.dataset.lang;w(l)&&(l===n?i.setAttribute("aria-current","page"):i.removeAttribute("aria-current"),i.querySelector(".lang-code").textContent=r.shortNames[l],i.querySelector(".lang-name").textContent=r.names[l])}}s(),(d=window.showroom)!=null&&d.setOfflineLanguage&&c(window.showroom.lang),e.addEventListener("toggle",()=>{e.open&&s()}),window.addEventListener("hashchange",s),window.addEventListener("popstate",s),window.addEventListener("pagehide",()=>{e.open=!1}),window.addEventListener("pageshow",n=>{n.persisted&&(a&&y(a),e.open=!1,s())}),document.addEventListener("click",n=>{var l;if(!(n.target instanceof Element)||!e.contains(n.target))return;let r=n.target.closest("a[data-lang]");if(!r||(s(),n.button!==0||n.ctrlKey||n.metaKey||n.shiftKey||n.altKey))return;e.open=!1;let i=r.dataset.lang;w(i)&&((l=window.showroom)!=null&&l.setOfflineLanguage?(n.preventDefault(),window.showroom.setOfflineLanguage(i),y(i),c(i)):r.hasAttribute("aria-current")&&n.preventDefault(),n.defaultPrevented&&t.focus({preventScroll:!0}))}),e.addEventListener("focusout",n=>{n.relatedTarget instanceof Node&&!e.contains(n.relatedTarget)&&(e.open=!1)})}var T={en:{title:"A newer version is ready",description:"Refresh to view the latest website content and design.",refresh:"Refresh now",dismiss:"Not now"},zh:{title:"\u7F51\u7AD9\u5DF2\u6709\u65B0\u7248\u672C",description:"\u5237\u65B0\u540E\u5373\u53EF\u67E5\u770B\u6700\u65B0\u7684\u7F51\u7AD9\u5185\u5BB9\u548C\u8BBE\u8BA1\u3002",refresh:"\u7ACB\u5373\u5237\u65B0",dismiss:"\u6682\u4E0D\u5237\u65B0"},ms:{title:"Versi yang lebih baharu sudah sedia",description:"Muat semula untuk melihat kandungan dan reka bentuk tapak web terkini.",refresh:"Muat semula sekarang",dismiss:"bukan sekarang"}};var D=`.fc-update-notice {
  --notice-floating-bottom: var(--public-floating-bottom, clamp(1rem, 2vw, 2rem));
  --notice-floating-height: var(--public-floating-height, 88px);
  --notice-bottom: calc(var(--notice-floating-bottom) + var(--notice-floating-height) + 1rem + env(safe-area-inset-bottom));
  position: fixed;
  z-index: 115;
  inset-inline: max(1rem, env(safe-area-inset-left)) max(1rem, env(safe-area-inset-right));
  bottom: var(--notice-bottom);
  box-sizing: border-box;
  max-width: 36rem;
  max-height: calc(100vh - var(--notice-bottom) - 1rem);
  max-height: calc(100dvh - var(--notice-bottom) - 1rem);
  margin: 0 auto;
  padding: 1rem;
  overflow-y: auto;
  border: 1px solid rgb(255 255 255 / 15%);
  border-radius: 1rem;
  color: #fff;
  background: rgb(17 20 17 / 95%);
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 25%);
  backdrop-filter: blur(12px);
  font: 400 .875rem/1.25rem system-ui, "PingFang SC", "Microsoft YaHei", sans-serif;
  text-align: start;
}

.fc-update-notice--admin {
  --notice-bottom: max(1rem, env(safe-area-inset-bottom));
}

.fc-update-notice__copy { min-width: 0; flex: 1; }
.fc-update-notice .fc-update-notice__title {
  margin: 0;
  color: #fff;
  font: inherit;
  font-weight: 600;
  letter-spacing: .025em;
}
.fc-update-notice .fc-update-notice__description {
  margin: .25rem 0 0;
  color: rgb(255 255 255 / 70%);
  font: inherit;
  line-height: 1.5rem;
}
.fc-update-notice__actions {
  display: flex;
  align-items: stretch;
  gap: .5rem;
  margin-top: .75rem;
}
.fc-update-notice button {
  box-sizing: border-box;
  min-width: 0;
  min-height: 2.75rem;
  margin: 0;
  padding: .375rem 1rem;
  border: 0;
  border-radius: 9999px;
  color: rgb(255 255 255 / 75%);
  background: transparent;
  font: inherit;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
}
.fc-update-notice [data-update-refresh] {
  flex: 1;
  padding-inline: 1.25rem;
  color: #111411;
  background: #d5ff3f;
  font-weight: 600;
}
.fc-update-notice button:focus-visible { outline: 2px solid white; outline-offset: 2px; }
@media (hover: hover) {
  .fc-update-notice [data-update-refresh]:hover { background: #e2ff78; }
  .fc-update-notice [data-update-dismiss]:hover { color: #fff; background: rgb(255 255 255 / 10%); }
}
@media (min-width: 768px) {
  .fc-update-notice {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding-inline: 1.25rem;
  }
  .fc-update-notice__actions { flex-shrink: 0; margin-top: 0; }
  .fc-update-notice [data-update-refresh] { flex: none; }
}
@media (min-width: 768px) and (max-width: 1023px) {
  .fc-update-notice { --notice-floating-height: var(--public-floating-height, 72px); }
}
@media (max-width: 767px) {
  .fc-update-notice {
    --notice-floating-bottom: var(--public-floating-bottom, calc(68px + 1rem));
    --notice-floating-height: var(--public-floating-height, 68px);
  }
}
@media (max-width: 359px) {
  .fc-update-notice button, .fc-update-notice [data-update-refresh] { padding-inline: .5rem; }
}
@media print { .fc-update-notice { display: none; } }
`;var ee=new Set;var O=!1;var te=()=>ee.size>0;var ne="flashcast-navigation-confirm",oe=()=>te()?new Promise(e=>window.dispatchEvent(new CustomEvent(ne,{detail:{resolve:e}}))):Promise.resolve(!0);async function re(e){if(!await oe())return!1;O=!0;try{return await e(),!0}catch(t){throw O=!1,t}}var I=()=>re(()=>window.location.reload());var B=e=>typeof e=="string"?e.trim().slice(0,128):"",z=e=>{let t=e.trim().toLowerCase();return t!=="localhost"&&t!=="127.0.0.1"&&t!=="::1"};var ae=e=>{let t=e&&typeof e=="object"&&!Array.isArray(e)?e:{};return{deploymentVersion:B(t.deploymentVersion),contentVersion:B(t.contentVersion)}},M=async e=>{let t=await fetch("/__flashcast/version",{cache:"no-store",credentials:"same-origin",headers:{Accept:"application/json","Cache-Control":"no-cache"},signal:e});if(!t.ok)throw new Error(`Public version check failed with HTTP ${t.status}.`);return ae(await t.json())},$=(e,t)=>{let o=!!(e.deploymentVersion&&t.deploymentVersion&&e.deploymentVersion!==t.deploymentVersion),a=!!(e.contentVersion&&t.contentVersion&&e.contentVersion!==t.contentVersion);return o||a};var ie={feedbackDelay:180,recoveryDelay:5e3,readTimeout:15e3,searchDelay:300,publicStaleTime:6e4,adminListStaleTime:3e5,defaultStaleTime:12e4,gcTime:18e5};async function G(e,t){let o=new AbortController,a=()=>o.abort(e==null?void 0:e.reason);e!=null&&e.aborted?a():e==null||e.addEventListener("abort",a,{once:!0});let s,c,d=new Promise((n,r)=>{c=()=>{var i;return r((i=o.signal.reason)!=null?i:new DOMException("Read cancelled","AbortError"))},o.signal.addEventListener("abort",c,{once:!0}),s=setTimeout(()=>o.abort(new DOMException("Read deadline exceeded","TimeoutError")),ie.readTimeout)});try{if(o.signal.aborted)throw o.signal.reason;return await Promise.race([t(o.signal),d])}finally{clearTimeout(s),e==null||e.removeEventListener("abort",a),o.signal.removeEventListener("abort",c)}}function F(e,t){let o=null,a=!1;async function s(n=!1){if(!(a||o||t()||!n&&document.visibilityState==="hidden")){o=new AbortController;try{let r=await G(o.signal,M);a||await e(r)}catch(r){}finally{o=null}}}let c=()=>{s()};s(!0);let d=window.setInterval(c,3e4);return window.addEventListener("focus",c),document.addEventListener("visibilitychange",c),()=>{a=!0,o==null||o.abort(),window.clearInterval(d),window.removeEventListener("focus",c),document.removeEventListener("visibilitychange",c)}}function q(e,t){let o=e.ownerDocument,a=o.createElement("aside");a.className=t.surface==="admin"?"fc-update-notice fc-update-notice--admin":"fc-update-notice public-update-notice",a.setAttribute("role","status"),a.setAttribute("aria-live","polite");let s=o.createElement("div");s.className="fc-update-notice__copy";let c=o.createElement("p");c.className="fc-update-notice__title";let d=o.createElement("p");d.className="fc-update-notice__description",s.append(c,d);let n=o.createElement("div");n.className="fc-update-notice__actions";let r=o.createElement("button");r.type="button",r.setAttribute("data-update-refresh","");let i=o.createElement("button");i.type="button",i.setAttribute("data-update-dismiss",""),n.append(r,i),a.append(s,n);let l=o.createElement("style");l.textContent=D;let{baseline:u,language:m,blocked:x}=t,f=null,L=!1;function h(){if(L||!f||x){a.remove();return}let g=T[m];c.textContent=g.title,d.textContent=g.description,r.textContent=g.refresh,i.textContent=g.dismiss,l.isConnected||o.head.append(l),a.parentNode||e.append(a)}r.onclick=async()=>{r.disabled=!0;try{await I()}finally{r.disabled=!1}},i.onclick=()=>{f&&(u=f),f=null,h()};let j=F(async g=>{var P;let b={deploymentVersion:g.deploymentVersion||u.deploymentVersion,contentVersion:g.contentVersion||u.contentVersion};u.contentVersion&&b.contentVersion!==u.contentVersion&&(await((P=t.onContentChange)==null?void 0:P.call(t)),L)||($(u,{...b,contentVersion:u.contentVersion})?(f=b,h()):u=b)},()=>f!==null);return{setLanguage(g){g!==m&&(m=g,h())},setBlocked(g){g!==x&&(x=g,h())},dispose(){L=!0,j(),a.remove(),l.remove(),r.onclick=null,i.onclick=null}}}function H(){var r;let e=(r=document.querySelector('meta[name="flashcast-deployment-version"]'))==null?void 0:r.content;if(!e||!z(location.hostname))return;let t=()=>v([document.documentElement.lang]),o=()=>!!document.querySelector('dialog[open], #quick-contact [aria-expanded="true"]'),a=t(),s=o(),c=document.createElement("div");document.body.append(c);let d=q(c,{baseline:{deploymentVersion:decodeURIComponent(e),contentVersion:""},language:a,blocked:s}),n=new MutationObserver(()=>{let i=t();a!==i&&(a=i,d.setLanguage(a));let l=o();s!==l&&(s=l,d.setBlocked(s))});return n.observe(document.documentElement,{attributes:!0,attributeFilter:["lang"]}),n.observe(document.body,{subtree:!0,childList:!0,attributes:!0,attributeFilter:["open","aria-expanded"]}),()=>{n.disconnect(),d.dispose(),c.remove()}}R();H();})();
