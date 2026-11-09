/** Regular script preloads warm the HTTP cache without executing modules or
 * populating WebKit's modulepreload map. Rendering/import() still owns errors. */
export function createRouteHintScript(bundle) {
  const chunks = Object.values(bundle).filter(item => item.type === "chunk");
  const asset = name => {
    const chunk = chunks.find(item => item.name === name);
    if (!chunk || !/^assets\/[\w.-]+\.js$/.test(chunk.fileName)) throw new Error(`Missing safe public script chunk: ${name}`);
    return "/" + chunk.fileName;
  };
  const home = asset("public-home-route");
  const terms = asset("public-language-terms");
  const malay = asset("malayContent");
  const homeStyles = Object.values(bundle).filter(item => item.type === "asset" && /^assets\/public-pages-[\w.-]+\.css$/.test(item.fileName)).map(item => item.fileName);
  if (homeStyles.length !== 1 || !/^assets\/[\w.-]+\.css$/.test(homeStyles[0])) throw new Error("Missing safe public page stylesheet");


  return `(()=>{const p=location.pathname,h=/^\\/(?:en|zh|ms)?\\/?$/.test(p),m=/^\\/ms(?:\\/|$)/.test(p),u=[];if(h)u.push([${JSON.stringify(home)},"low"]);if(h||m)u.push([${JSON.stringify(terms)},m?"high":"low"]);if(m)u.push([${JSON.stringify(malay)},"high"]);if(h){const l=document.createElement("link");l.rel="preload";l.as="style";l.crossOrigin="anonymous";l.fetchPriority="low";l.setAttribute("data-public-route-style","");l.href=${JSON.stringify("/" + homeStyles[0])};document.head.appendChild(l)}for(const [url,priority]of u){const l=document.createElement("link");l.rel="preload";l.as="script";l.crossOrigin="anonymous";l.fetchPriority=priority;l.setAttribute("data-public-route-script","");l.href=url;document.head.appendChild(l)}})()`;
}

export function routeScriptHints() {
  return {
    name: "public-route-script-hints",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html, context) {
        if (!context.bundle) return html;
        const script = createRouteHintScript(context.bundle);
        const marker = '<script type="module"';
        if (!html.includes(marker)) throw new Error("Public module entry is missing");
        return html.replace(marker, `<script data-public-route-hints>${script}</script>\n${marker}`);
      },
    },
  };
}
