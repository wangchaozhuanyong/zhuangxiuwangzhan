// Conversion event tracker for the ANZHE showroom.
// Pushes WhatsApp and phone clicks into GTM's dataLayer and forwards to gtag
// when a Google tag is present. This script loads no third-party code, so the
// showroom CSP (script-src 'self') needs no change.
(function () {
  "use strict";

  function pageModel() {
    var match = location.pathname.match(/\/lock\/(?:type|feature)\/([a-z0-9-]+)\//);
    if (match) return "category:" + match[1];
    var model = location.pathname.match(/\/lock\/([a-z0-9-]+)\//);
    return model ? model[1] : "home";
  }

  function push(eventName, details) {
    var payload = {
      event: eventName,
      page_language: document.documentElement.lang || "",
      page_path: location.pathname,
      page_model: pageModel()
    };
    if (details) {
      for (var key in details) {
        if (Object.prototype.hasOwnProperty.call(details, key)) payload[key] = details[key];
      }
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
    if (typeof window.gtag === "function") window.gtag("event", eventName, payload);
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
        push("whatsapp_click", { link_url: href.split("?")[0] });
      } else if (href.indexOf("tel:") === 0) {
        push("call_click", { link_url: href });
      }
    },
    { capture: true }
  );
})();
