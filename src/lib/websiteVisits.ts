const hosts = new Set(["flashcast.com.my", "www.flashcast.com.my"]);

// Separate from GA: one event per public route, with no cookies, query string, referrer or IP in the browser payload.
export async function recordWebsiteVisit(path: string) {
  if (
    typeof window === "undefined" ||
    !hosts.has(window.location.hostname) ||
    !/^\/(en|zh)(?:\/[A-Za-z0-9_%-]+)*\/?$/.test(path) ||
    path.length > 1024
  )
    return;
  const body = JSON.stringify({ eventId: crypto.randomUUID(), path });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch("/__visit", {
        method: "POST",
        credentials: "omit",
        keepalive: true,
        redirect: "error",
        referrerPolicy: "no-referrer",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (response.ok || response.status < 500) return;
    } catch {
      /* Collection must never interrupt a page or form. */
    }
  }
}
