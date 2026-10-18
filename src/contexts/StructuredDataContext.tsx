import { createContext, useCallback, useContext, useId, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { siteConfig } from "@/config/site";
import { getSocialProfileUrls } from "@/lib/socialProfiles";
import { getPublicBrandAliases, getPublicSiteName } from "@/i18n/brandIdentity";

type Node = Record<string, unknown>;
type Registration = { scope: string; node: Node };
type Registry = Record<string, Registration>;
const Context = createContext<{ scope: string; register: (id: string, value: Registration) => () => void } | null>(null);
const globalTypes = new Set(["Organization", "LocalBusiness", "HomeAndConstructionBusiness", "WebSite"]);
const absoluteLogo = (source: string | undefined) => {
  try {
    const url = new URL(source || siteConfig.logoUrl, siteConfig.url);
    return /^https?:$/.test(url.protocol) ? url.href : siteConfig.logoUrl;
  } catch { return siteConfig.logoUrl; }
};

export function useStructuredDataNode(data: unknown) {
  const owner = useContext(Context);
  const id = useId();
  const serialized = JSON.stringify(data);
  const scope = owner?.scope;
  const register = owner?.register;
  useLayoutEffect(() => {
    if (!register || !scope || !serialized || serialized === "null") return;
    return register(id, { scope, node: JSON.parse(serialized) as Node });
  }, [id, register, scope, serialized]);
  return Boolean(owner);
}

// The server owns the initial document; after React commits, one owner replaces
// the entire page graph. Registrations from pending/previous routes never leak.
export function StructuredDataProvider({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation();
  const scope = `${pathname}${search}`;
  const settings = useSiteSettings();
  const [registry, setRegistry] = useState<Registry>({});
  const [initialGlobals] = useState<Node[]>(() => {
    try {
      const graph: unknown = JSON.parse(document.querySelector("script[data-flashcast-edge-schema]")?.textContent || "{}")["@graph"];
      return Array.isArray(graph) ? graph.filter((node: Node) => globalTypes.has(String(node["@type"]))) : [];
    } catch { return []; }
  });
  const register = useCallback((id: string, value: Registration) => {
    setRegistry(current => ({ ...current, [id]: value }));
    return () => setRegistry(current => {
      if (current[id] !== value) return current;
      const next = { ...current }; delete next[id]; return next;
    });
  }, []);
  const owner = useMemo(() => ({ scope, register }), [scope, register]);
  const routeCanonical = new URL(pathname.replace(/\/$/, "") || "/", siteConfig.url).href;
  const nodes = Object.values(registry).filter(value => value.scope === scope).map(value => value.node);
  const page = nodes.find(node => node["@type"] === "WebPage" && typeof node.url === "string" && node.url.split("?")[0] === routeCanonical);
  const canonical = typeof page?.url === "string" ? page.url : routeCanonical;
  const businessId = `${siteConfig.url}/#localbusiness`;
  const websiteId = `${siteConfig.url}/#website`;
  const graph: Node[] = [
    {
      ...initialGlobals.find(node => node["@type"] === "HomeAndConstructionBusiness"),
      "@type": "HomeAndConstructionBusiness", "@id": businessId,
      name: settings.company_name, alternateName: getPublicBrandAliases(settings),
      url: siteConfig.url, telephone: settings.phone_e164, email: settings.email,
      logo: absoluteLogo(settings.logo_url),
      address: { "@type": "PostalAddress", streetAddress: settings.address_en || settings.address_zh || siteConfig.address, addressLocality: "Kuala Lumpur", postalCode: "58200", addressCountry: "MY" },
      sameAs: getSocialProfileUrls(settings),
    },
    { ...initialGlobals.find(node => node["@type"] === "WebSite"), "@type": "WebSite", "@id": websiteId,
      url: siteConfig.url, name: getPublicSiteName(settings), inLanguage: ["en", "zh-CN"], publisher: { "@id": businessId } },
  ];
  if (page) {
    const pageNodes = nodes.filter(node => !globalTypes.has(String(node["@type"])) && node["@type"] !== "WebPage");
    const scopedNodes: Node[] = pageNodes.map(node => {
      const suffix = ({ BreadcrumbList: "breadcrumb", Service: "service", BlogPosting: "article", FAQPage: "faq" } as Record<string, string>)[String(node["@type"])];
      const { "@context": _context, ...value } = node;
      return { ...value, ...(suffix ? { "@id": `${canonical}#${suffix}` } : {}) };
    });
    const mainEntity = scopedNodes.find(node => node["@type"] === "BlogPosting" || node["@type"] === "Service");
    graph.push({ ...page, "@id": `${canonical}#webpage`, isPartOf: { "@id": websiteId }, about: { "@id": businessId },
      ...(scopedNodes.some(node => node["@type"] === "BreadcrumbList") ? { breadcrumb: { "@id": `${canonical}#breadcrumb` } } : {}),
      ...(mainEntity ? { mainEntity: { "@id": mainEntity["@id"] } } : {}),
    }, ...scopedNodes);
  }
  const serialized = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
  useLayoutEffect(() => {
    let script = document.querySelector<HTMLScriptElement>("script[data-flashcast-edge-schema]");
    if (!script) {
      script = document.createElement("script"); script.type = "application/ld+json";
      script.setAttribute("data-flashcast-edge-schema", ""); document.head.appendChild(script);
    }
    script.textContent = serialized;
  }, [serialized]);
  useLayoutEffect(() => () => {
    document.querySelector("script[data-flashcast-edge-schema]")?.remove();
  }, []);
  return <Context.Provider value={owner}>{children}</Context.Provider>;
}
