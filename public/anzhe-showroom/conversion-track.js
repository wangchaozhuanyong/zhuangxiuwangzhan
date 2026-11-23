// GA4 + Google Ads tagging for the ANZHE showroom.
// Loads the same Google tag IDs as the main site so showroom traffic lands in
// the existing GA4 property, then forwards WhatsApp and phone clicks as events.
// The tag script is deferred until idle or first interaction, matching the main
// site's loading policy.
(function () {
  "use strict";

  var GA_MEASUREMENT_ID = "G-LLJGRG2YNP";
  var GOOGLE_ADS_ID = "AW-18205206146";
  var ANALYTICS_HOSTS = ["locks.flashcast.com.my"];

  if (ANALYTICS_HOSTS.indexOf(window.location.hostname) === -1) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = window.gtag || gtag;

  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);
  gtag("config", GOOGLE_ADS_ID);

  var scriptRequested = false;
  function loadTagScript() {
    if (scriptRequested || document.getElementById("anzhe-google-tag")) return;
    scriptRequested = true;
    var script = document.createElement("script");
    script.id = "anzhe-google-tag";
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(script);
  }

  var loaded = false;
  function scheduleTagScript() {
    if (loaded) return;
    loaded = true;
    var events = ["pointerdown", "keydown", "touchstart"];
    var cleanup = function () {
      events.forEach(function (name) { window.removeEventListener(name, onInteraction); });
      window.removeEventListener("pagehide", loadTagScript);
      document.removeEventListener("visibilitychange", onHidden);
    };
    var onInteraction = function () { cleanup(); loadTagScript(); };
    var onHidden = function () { if (document.visibilityState === "hidden") onInteraction(); };
    events.forEach(function (name) { window.addEventListener(name, onInteraction, { once: true, passive: true }); });
    window.addEventListener("pagehide", loadTagScript);
    document.addEventListener("visibilitychange", onHidden);
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(loadTagScript, { timeout: 3000 });
    } else {
      window.setTimeout(loadTagScript, 2000);
    }
  }

  if (document.readyState === "complete") scheduleTagScript();
  else window.addEventListener("load", scheduleTagScript, { once: true });

  function pageModel() {
    var category = location.pathname.match(/\/lock\/(?:type|feature)\/([a-z0-9-]+)\//);
    if (category) return "category:" + category[1];
    var model = location.pathname.match(/\/lock\/([a-z0-9-]+)\//);
    return model ? model[1] : "home";
  }

  function send(eventName, details) {
    var payload = {
      page_language: document.documentElement.lang || "",
      page_path: location.pathname,
      page_model: pageModel()
    };
    if (details) {
      for (var key in details) {
        if (Object.prototype.hasOwnProperty.call(details, key)) payload[key] = details[key];
      }
    }
    gtag("event", eventName, payload);
  }

  document.addEventListener(
    "click",
    function (event) {
      var target = event.target;
      if (!target || typeof target.closest !== "function") return;
      var link = target.closest("a[href]");
      if (!link) return;
      var href = link.getAttribute("href") || "";
      if (/wa\.me\/|api\.whatsapp\.com/.test(href)) {
        send("whatsapp_click", { link_url: href.split("?")[0] });
      } else if (href.indexOf("tel:") === 0) {
        send("phone_click", { link_url: href });
      }
    },
    { capture: true }
  );
})();
