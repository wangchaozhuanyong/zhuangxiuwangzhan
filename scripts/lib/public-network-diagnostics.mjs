// Never retain query values from console locations or network receipts.
export function diagnosticUrl(value) {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.href;
  } catch {
    return "invalid-url";
  }
}

export function diagnosticMessage(value) {
  return String(value).replace(/https?:\/\/[^\s"'<>]+/g, diagnosticUrl).slice(0, 500);
}

export function isCriticalPublicRequest(url, resourceType, baseUrl) {
  if (["document", "script", "stylesheet", "image", "font"].includes(resourceType)) return true;
  try {
    const parsed = new URL(url);
    return parsed.origin === new URL(baseUrl).origin
      || (parsed.hostname.endsWith(".supabase.co") && /^\/(rest|functions|storage)\/v1\//.test(parsed.pathname));
  } catch {
    return false;
  }
}

export function diagnosticTiming(request) {
  const timing = request.timing();
  return {
    startTime: timing.startTime,
    responseStartMs: timing.responseStart >= 0 ? timing.responseStart : null,
    responseEndMs: timing.responseEnd >= 0 ? timing.responseEnd : null,
  };
}

/** Internal read identity. Public diagnostics must still redact the returned URL. */
export function normalizePublicReadIdentity(resourceUrl) {
  try {
    const url = new URL(resourceUrl);
    // section_key/page_key are business filters, not authentication keys.
    for (const key of [...url.searchParams.keys()]) {
      if (/^(?:api_?key|access_token|refresh_token|id_token|token|key|auth|authorization|secret|password)$/i.test(key)) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    return `${url.origin}${url.pathname}${url.search}`;
  } catch {
    return resourceUrl.split("?")[0] || resourceUrl;
  }
}
