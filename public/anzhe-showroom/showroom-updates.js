// Generated from src/showroomUpdates.ts by scripts/generate-anzhe-boot.mjs.
(()=>{var T=e=>e.trim().toLowerCase().replace(/_/g,"-"),v=e=>{var n;let t=T((n=e[0])!=null?n:"");return t==="zh"||t.startsWith("zh-")?"zh":t==="ms"||t.startsWith("ms-")?"ms":"en"};var w={en:{title:"A newer version is ready",description:"Refresh to view the latest website content and design.",refresh:"Refresh now",dismiss:"Not now"},zh:{title:"\u7F51\u7AD9\u5DF2\u6709\u65B0\u7248\u672C",description:"\u5237\u65B0\u540E\u5373\u53EF\u67E5\u770B\u6700\u65B0\u7684\u7F51\u7AD9\u5185\u5BB9\u548C\u8BBE\u8BA1\u3002",refresh:"\u7ACB\u5373\u5237\u65B0",dismiss:"\u6682\u4E0D\u5237\u65B0"},ms:{title:"Versi yang lebih baharu sudah sedia",description:"Muat semula untuk melihat kandungan dan reka bentuk tapak web terkini.",refresh:"Muat semula sekarang",dismiss:"bukan sekarang"}};var P=`.fc-update-notice {
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
`;var I=new Set;var k=!1;var O=()=>I.size>0;var z="flashcast-navigation-confirm",B=()=>O()?new Promise(e=>window.dispatchEvent(new CustomEvent(z,{detail:{resolve:e}}))):Promise.resolve(!0);async function M(e){if(!await B())return!1;k=!0;try{return await e(),!0}catch(t){throw k=!1,t}}var V=()=>M(()=>window.location.reload());var L=e=>typeof e=="string"?e.trim().slice(0,128):"",A=e=>{let t=e.trim().toLowerCase();return t!=="localhost"&&t!=="127.0.0.1"&&t!=="::1"};var F=e=>{let t=e&&typeof e=="object"&&!Array.isArray(e)?e:{};return{deploymentVersion:L(t.deploymentVersion),contentVersion:L(t.contentVersion)}},E=async e=>{let t=await fetch("/__flashcast/version",{cache:"no-store",credentials:"same-origin",headers:{Accept:"application/json","Cache-Control":"no-cache"},signal:e});if(!t.ok)throw new Error(`Public version check failed with HTTP ${t.status}.`);return F(await t.json())},_=(e,t)=>{let n=!!(e.deploymentVersion&&t.deploymentVersion&&e.deploymentVersion!==t.deploymentVersion),o=!!(e.contentVersion&&t.contentVersion&&e.contentVersion!==t.contentVersion);return n||o};var G={feedbackDelay:180,recoveryDelay:5e3,readTimeout:15e3,searchDelay:300,publicStaleTime:6e4,adminListStaleTime:3e5,defaultStaleTime:12e4,gcTime:18e5};async function C(e,t){let n=new AbortController,o=()=>n.abort(e==null?void 0:e.reason);e!=null&&e.aborted?o():e==null||e.addEventListener("abort",o,{once:!0});let a,r,l=new Promise((d,i)=>{r=()=>{var c;return i((c=n.signal.reason)!=null?c:new DOMException("Read cancelled","AbortError"))},n.signal.addEventListener("abort",r,{once:!0}),a=setTimeout(()=>n.abort(new DOMException("Read deadline exceeded","TimeoutError")),G.readTimeout)});try{if(n.signal.aborted)throw n.signal.reason;return await Promise.race([t(n.signal),l])}finally{clearTimeout(a),e==null||e.removeEventListener("abort",o),n.signal.removeEventListener("abort",r)}}function N(e,t){let n=null,o=!1;async function a(d=!1){if(!(o||n||t()||!d&&document.visibilityState==="hidden")){n=new AbortController;try{let i=await C(n.signal,E);o||await e(i)}catch(i){}finally{n=null}}}let r=()=>{a()};a(!0);let l=window.setInterval(r,3e4);return window.addEventListener("focus",r),document.addEventListener("visibilitychange",r),()=>{o=!0,n==null||n.abort(),window.clearInterval(l),window.removeEventListener("focus",r),document.removeEventListener("visibilitychange",r)}}function R(e,t){let n=e.ownerDocument,o=n.createElement("aside");o.className=t.surface==="admin"?"fc-update-notice fc-update-notice--admin":"fc-update-notice public-update-notice",o.setAttribute("role","status"),o.setAttribute("aria-live","polite");let a=n.createElement("div");a.className="fc-update-notice__copy";let r=n.createElement("p");r.className="fc-update-notice__title";let l=n.createElement("p");l.className="fc-update-notice__description",a.append(r,l);let d=n.createElement("div");d.className="fc-update-notice__actions";let i=n.createElement("button");i.type="button",i.setAttribute("data-update-refresh","");let c=n.createElement("button");c.type="button",c.setAttribute("data-update-dismiss",""),d.append(i,c),o.append(a,d);let m=n.createElement("style");m.textContent=P;let{baseline:u,language:b,blocked:h}=t,p=null,y=!1;function f(){if(y||!p||h){o.remove();return}let s=w[b];r.textContent=s.title,l.textContent=s.description,i.textContent=s.refresh,c.textContent=s.dismiss,m.isConnected||n.head.append(m),o.parentNode||e.append(o)}i.onclick=async()=>{i.disabled=!0;try{await V()}finally{i.disabled=!1}},c.onclick=()=>{p&&(u=p),p=null,f()};let S=N(async s=>{var x;let g={deploymentVersion:s.deploymentVersion||u.deploymentVersion,contentVersion:s.contentVersion||u.contentVersion};u.contentVersion&&g.contentVersion!==u.contentVersion&&(await((x=t.onContentChange)==null?void 0:x.call(t)),y)||(_(u,{...g,contentVersion:u.contentVersion})?(p=g,f()):u=g)},()=>p!==null);return{setLanguage(s){s!==b&&(b=s,f())},setBlocked(s){s!==h&&(h=s,f())},dispose(){y=!0,S(),o.remove(),m.remove(),i.onclick=null,c.onclick=null}}}function U(){var i;let e=(i=document.querySelector('meta[name="flashcast-deployment-version"]'))==null?void 0:i.content;if(!e||!A(location.hostname))return;let t=()=>v([document.documentElement.lang]),n=()=>!!document.querySelector('dialog[open], #quick-contact [aria-expanded="true"]'),o=t(),a=n(),r=document.createElement("div");document.body.append(r);let l=R(r,{baseline:{deploymentVersion:decodeURIComponent(e),contentVersion:""},language:o,blocked:a}),d=new MutationObserver(()=>{let c=t();o!==c&&(o=c,l.setLanguage(o));let m=n();a!==m&&(a=m,l.setBlocked(a))});return d.observe(document.documentElement,{attributes:!0,attributeFilter:["lang"]}),d.observe(document.body,{subtree:!0,childList:!0,attributes:!0,attributeFilter:["open","aria-expanded"]}),()=>{d.disconnect(),l.dispose(),r.remove()}}U();})();
