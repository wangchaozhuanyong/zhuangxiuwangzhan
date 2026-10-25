import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useLocation, useNavigate, type NavigateFunction } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { afterEach, expect, it, vi } from "vitest";
import { StructuredDataProvider } from "./StructuredDataContext";
import PageMeta from "@/components/PageMeta";
import { JsonLdBreadcrumb, JsonLdFAQ, JsonLdService, JsonLdBlogPosting } from "@/components/JsonLd";
import { fallbackSiteSettings } from "@/lib/siteSettingsApi";

const state = vi.hoisted(() => { vi.stubEnv("VITE_SITE_URL", "https://flashcast.com.my"); return { language: "en" as "en" | "zh" }; });
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/hooks/useSiteSettings", () => ({ useSiteSettings: () => fallbackSiteSettings }));
let navigate: NavigateFunction;
function Page() {
  navigate = useNavigate();
  const location = useLocation();
  const article = location.pathname.includes("/blog/");
  const service = location.pathname.includes("/services/");
  return <>
    <PageMeta title={`Current ${location.pathname}`} description="Current description" canonicalPath={location.pathname + (location.search.includes("page=") ? location.search : "")} noIndex={location.pathname.endsWith("/missing")} />
    <JsonLdBreadcrumb items={[{ name: "Home", url: "/" }, { name: "Current", url: location.pathname }]} />
    {service && <><JsonLdService name="Current service" description="Service scope" /><JsonLdFAQ faqs={[{ question: "Current question", answer: "Current answer" }]} /></>}
    {article && <JsonLdBlogPosting headline="Current article" description="Article summary" imageAlt="" datePublished="2026-10-01" dateModified="2026-10-18" canonicalPath={location.pathname} keywords={[]} />}
  </>;
}
afterEach(() => { document.querySelectorAll("script[data-flashcast-edge-schema]").forEach(node => node.remove()); vi.unstubAllEnvs(); });

it("replaces initial server page data in production, follows language/history and removes obsolete FAQ, service and article nodes", async () => {
  vi.stubEnv("DEV", false);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  state.language = "en";
  const script = document.createElement("script"); script.type = "application/ld+json"; script.setAttribute("data-flashcast-edge-schema", "");
  script.textContent = JSON.stringify({ "@graph": [{ "@type": "WebPage", url: "https://flashcast.com.my/en/quote" }, { "@type": "FAQPage", mainEntity: ["OLD FAQ"] }] });
  document.head.append(script);
  const container = document.createElement("div"); document.body.append(container);
  const root = createRoot(container);
  const graph = () => JSON.parse(document.querySelector("script[data-flashcast-edge-schema]")!.textContent!)["@graph"] as Record<string, unknown>[];
  const check = (path: string) => {
    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
    expect(graph().filter(node => node["@type"] === "WebPage")).toEqual([expect.objectContaining({ url: `https://flashcast.com.my${path}`, inLanguage: state.language === "zh" ? "zh-CN" : "en" })]);
    expect(JSON.stringify(graph())).not.toContain("OLD FAQ");
    const websites = graph().filter(node => node["@type"] === "WebSite");
    const businesses = graph().filter(node => node["@type"] === "HomeAndConstructionBusiness");
    expect(websites).toHaveLength(1); expect(businesses).toHaveLength(1);
    expect(websites[0]).toMatchObject({ "@id": "https://flashcast.com.my/#website", name: "FLASH CAST" });
    expect((websites[0].alternateName as string[])[0]).toBe("闪铸装饰");
    expect((businesses[0].alternateName as string[])[0]).toBe("闪铸装饰");
    expect(graph().some(node => node["@type"] === "Organization")).toBe(false);
    const breadcrumb = graph().find(node => node["@type"] === "BreadcrumbList");
    expect(JSON.stringify(breadcrumb)).toContain(`https://flashcast.com.my/${state.language}`);
  };
  try {
    await act(async () => root.render(<HelmetProvider><MemoryRouter initialEntries={["/en/quote"]}><StructuredDataProvider><Page /></StructuredDataProvider></MemoryRouter></HelmetProvider>));
    check("/en/quote");
    await act(async () => navigate("/en/services/kitchen")); check("/en/services/kitchen");
    expect(graph().some(node => node["@type"] === "FAQPage")).toBe(true);
    state.language = "zh";
    await act(async () => navigate("/zh/process")); check("/zh/process");
    expect(graph().some(node => ["FAQPage", "Service"].includes(String(node["@type"])))).toBe(false);
    await act(async () => navigate("/zh/blog/current")); check("/zh/blog/current");
    expect(graph().some(node => node["@type"] === "BlogPosting")).toBe(true);
    await act(async () => navigate(-1)); check("/zh/process");
    expect(graph().some(node => node["@type"] === "BlogPosting")).toBe(false);
    await act(async () => navigate("/zh/furniture/dining?page=2")); check("/zh/furniture/dining?page=2");
    await act(async () => navigate("/zh/missing"));
    expect(graph().some(node => node["@type"] === "WebPage" || node["@type"] === "BreadcrumbList")).toBe(false);
  } finally {
    await act(async () => root.unmount()); container.remove();
  }
  expect(document.querySelector("script[data-flashcast-edge-schema]")).toBeNull();
});
