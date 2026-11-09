import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createRouteHintScript, routeScriptHints } from "./vite-route-script-hints.mjs";
const bundle = Object.fromEntries(["public-home-route", "public-language-terms", "malayContent"].map(name => [name, { type: "chunk", name, fileName: `assets/${name}-fixture.js` }]));
bundle.publicPages = { type: "asset", name: "public-pages.css", fileName: "assets/public-pages-fixture.css" };
function hints(pathname) {
  const links = [];
  vm.runInNewContext(createRouteHintScript(bundle), { location: { pathname }, document: {
    createElement: tag => { assert.equal(tag, "link"); return { setAttribute() {} }; },
    head: { appendChild: link => links.push(link) },
  } });
  return links;
}
test("home-only chunks are hinted for each canonical home, never ordinary pages", () => {
  for (const p of ["/", "/en", "/zh/", "/ms"]) assert(hints(p).some(l => l.href.includes("public-home-route")));
  for (const p of ["/en/contact", "/zh/quote", "/ms/contact", "/admin", "/msadmin", "/unknown"]) assert(!hints(p).some(l => l.href.includes("public-home-route")));
});
test("Malay pages warm required language data with higher priority", () => {
  for (const p of ["/ms", "/ms/contact"]) {
    const links = hints(p);
    for (const name of ["malayContent", "public-language-terms"]) assert.equal(links.find(l => l.href.includes(name)).fetchPriority, "high");
  }
  for (const p of ["/en", "/zh", "/en/contact"]) assert(!hints(p).some(l => l.href.includes("malayContent")));
});
test("hints fetch regular scripts with matching CORS credentials and no execution", () => {
  for (const link of hints("/ms")) { assert.equal(link.rel, "preload"); assert(["script", "style"].includes(link.as)); assert.equal(link.crossOrigin, "anonymous"); }
  assert.equal(hints("/en").find(l => l.href.includes("public-home-route")).fetchPriority, "low");
});
test("missing or unsafe build outputs stop the build", () => {
  assert.throws(() => createRouteHintScript({}), /Missing safe/);
  assert.throws(() => createRouteHintScript({ ...bundle, malayContent: { ...bundle.malayContent, fileName: "https://invalid.example/x.js" } }), /Missing safe/);
});
test("production injects before module entry while dev remains unchanged", () => {
  const handler = routeScriptHints().transformIndexHtml.handler;
  const html = '<head><script type="module" src="/assets/index.js"></script></head>';
  assert.equal(handler(html, {}), html);
  const output = handler(html, { bundle });
  assert(output.indexOf("data-public-route-hints") < output.indexOf('type="module"'));
  assert.throws(() => handler("<head></head>", { bundle }), /entry is missing/);
});

test("home warms its existing stylesheet without applying it to other pages", () => {
  assert.equal(hints("/ms").find(link => link.as === "style").href, "/assets/public-pages-fixture.css");
  assert(!hints("/ms/contact").some(link => link.as === "style"));
  assert.throws(() => createRouteHintScript({ ...bundle, publicPages: { ...bundle.publicPages, fileName: "https://invalid.example/css" } }), /Missing safe public page stylesheet/);
});
