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
