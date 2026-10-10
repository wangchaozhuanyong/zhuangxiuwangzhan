import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JsonLdBlogPosting, JsonLdLocalBusiness, JsonLdOrganization } from "@/components/JsonLd";
import { fallbackSiteSettings } from "@/lib/siteSettingsApi";
import { MemoryRouter } from "react-router-dom";
import { SchemeAFooter, SchemeANavbar } from "@/components/scheme-a/SchemeAPublicChrome";
import { PublicChromeProvider } from "@/contexts/PublicChromeContext";
import { contactPageText } from "@/i18n/contactPageText";
import { footerCopy } from "@/i18n/footerText";

vi.hoisted(() => { vi.stubEnv("VITE_SITE_URL", "https://flashcast.com.my"); });
const languageState = vi.hoisted(() => ({ language: "en" as "en" | "zh" }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: languageState.language }) }));
beforeEach(() => { languageState.language = "en"; });

describe("JsonLdBlogPosting", () => {
  it("retains article metadata without advertising an unverified cover", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const html = renderToStaticMarkup(<QueryClientProvider client={queryClient}>
      <JsonLdBlogPosting headline="Office checklist" description="Published article" imageAlt="" datePublished="2026-09-25" dateModified="2026-09-25" canonicalPath="/blog/office-renovation-checklist-malaysia" keywords={["office"]} />
    </QueryClientProvider>);
    const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] || "{}");
    expect(data["@type"]).toBe("BlogPosting");
    expect(data.headline).toBe("Office checklist");
    expect(data).not.toHaveProperty("image");
  });
  it("renders localized article metadata from the public blog model", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <JsonLdBlogPosting
          headline="Kitchen Renovation Planning Guide"
          description="Plan layout, storage, and materials before renovation."
          image="/images/blog/kitchen-planning.webp"
          imageAlt="Kitchen renovation planning concept"
          datePublished="2026-08-10T08:00:00.000Z"
          dateModified="2026-08-14T08:00:00.000Z"
          canonicalPath="/blog/kitchen-renovation-planning"
          keywords={["kitchen", "planning"]}
        />
      </QueryClientProvider>,
    );

    const script = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] || "{}";
    const data = JSON.parse(script) as Record<string, unknown>;

    expect(data["@type"]).toBe("BlogPosting");
    expect(data["@id"]).toBe("https://flashcast.com.my/en/blog/kitchen-renovation-planning#article");
    expect(data.headline).toBe("Kitchen Renovation Planning Guide");
    expect(data.dateModified).toBe("2026-08-14T08:00:00.000Z");
    expect(data.image).toMatchObject({
      url: "https://flashcast.com.my/images/blog/kitchen-planning.webp",
      caption: "Kitchen renovation planning concept",
    });
  });
});

describe("JsonLdLocalBusiness", () => {
  it.each(["en", "zh"] as const)("associates all confirmed Chinese names with the same organization and business in %s", (language) => {
    languageState.language = language;
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(["site-settings"], fallbackSiteSettings);
    const html = renderToStaticMarkup(<QueryClientProvider client={queryClient}><JsonLdOrganization /><JsonLdLocalBusiness /></QueryClientProvider>);
    const document = new DOMParser().parseFromString(html, "text/html");
    const identities = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((script) => JSON.parse(script.textContent || "{}"));
    expect(identities.map((identity) => identity["@type"])).toEqual(["Organization", "HomeAndConstructionBusiness"]);
    for (const identity of identities) {
      expect(identity.name).toBe(fallbackSiteSettings.company_name);
      expect(identity.url).toBe("https://flashcast.com.my");
      expect(identity.alternateName).toEqual(expect.arrayContaining(["FLASH CAST", "闪铸装饰", "闪铸设计", "闪铸装修"]));
      expect(identity.alternateName).not.toContain(identity.name);
      expect(new Set(identity.alternateName).size).toBe(identity.alternateName.length);
    }
  });

  it.each(["en", "zh"] as const)("renders the Chinese brand association as ordinary footer text only in Chinese (%s)", (language) => {
    languageState.language = language;
    const route = `/${language}/`;
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(["site-settings"], fallbackSiteSettings);
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={[route]}><QueryClientProvider client={queryClient}>
      <PublicChromeProvider isAdminRoute={false} routeKey={route}><SchemeAFooter /></PublicChromeProvider>
    </QueryClientProvider></MemoryRouter>);
    const document = new DOMParser().parseFromString(html, "text/html");
    const footer = document.querySelector(".scheme-a-footer__studio")!;
    const line = "中文品牌：闪铸装饰 · 闪铸设计 · 闪铸装修";
    expect(footer).not.toBeNull();
    if (language === "zh") {
      const brandText = Array.from(footer.querySelectorAll("*")).find((element) => element.textContent === line);
      expect(brandText).not.toBeUndefined();
      expect(brandText?.closest('[aria-hidden="true"], [hidden], .sr-only, script, noscript')).toBeNull();
      expect(footer.textContent).toContain(line);
    } else {
      for (const name of ["闪铸装饰", "闪铸设计", "闪铸装修"]) expect(footer.textContent).not.toContain(name);
      expect(footer.textContent).not.toContain("中文品牌");
    }
  });

  it("does not assign FLASH CAST Chinese names to another configured company", () => {
    languageState.language = "zh";
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(["site-settings"], { ...fallbackSiteSettings, company_name: "Different company", brand_name: "Different brand" });
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={["/zh/"]}><QueryClientProvider client={queryClient}>
      <PublicChromeProvider isAdminRoute={false} routeKey="/zh/"><SchemeAFooter /><JsonLdOrganization /><JsonLdLocalBusiness /></PublicChromeProvider>
    </QueryClientProvider></MemoryRouter>);
    for (const name of ["闪铸装饰", "闪铸设计", "闪铸装修"]) expect(html).not.toContain(name);
    const document = new DOMParser().parseFromString(html, "text/html");
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      const identity = JSON.parse(script.textContent || "{}");
      expect(identity.name).toBe("Different company");
      expect(identity.alternateName).toEqual(["Different brand"]);
    }
  });

  it("shows the owner-confirmed daily hours in English and Chinese contact and footer copy", () => {
    expect(contactPageText.en.hoursText).toBe("Daily, 10:00 AM–7:00 PM (Malaysia time). Visits and consultations by prior arrangement");
    expect(contactPageText.zh.hoursText).toBe("每天10:00–19:00（马来西亚时间）。到访与咨询请提前联系安排");
    expect(footerCopy.en.hours).toBe("Business hours: Daily, 10:00 AM–7:00 PM (Malaysia time). Visits and consultations by prior arrangement");
    expect(footerCopy.zh.hours).toBe("营业时间：每天10:00–19:00（马来西亚时间）。到访与咨询请提前联系确认");
  });

  it("publishes the confirmed daily hours for all seven days", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const html = renderToStaticMarkup(<QueryClientProvider client={queryClient}><JsonLdLocalBusiness /></QueryClientProvider>);
    const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] || "{}");
    expect(data.openingHoursSpecification).toEqual([{
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => `https://schema.org/${day}`),
      opens: "10:00",
      closes: "19:00",
    }]);
  });

  it("omits unconfirmed social accounts from the directory, footer and JSON-LD", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(["site-settings"], {
      ...fallbackSiteSettings,
      facebook_url: "https://www.facebook.com/not-created-yet/",
      instagram_url: "https://www.instagram.com/not-created-yet/",
      tiktok_url: "https://www.tiktok.com/@not-created-yet",
    });
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={["/en/"]}><QueryClientProvider client={queryClient}>
      <PublicChromeProvider isAdminRoute={false} routeKey="/en/">
        <SchemeANavbar />
        <SchemeAFooter />
        <JsonLdLocalBusiness />
      </PublicChromeProvider>
    </QueryClientProvider></MemoryRouter>);
    const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] || "{}");
    expect(data.sameAs).toEqual([]);
    expect(html).not.toContain("scheme-a-footer__socials");
    expect(html).not.toContain("scheme-a-directory__social-group");
    expect(html).not.toContain("not-created-yet");
  });

  it("keeps directory, footer and JSON-LD profiles in sync after edits and clearing", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const render = (profiles: { facebook_url: string; instagram_url: string; tiktok_url: string; xiaohongshu_url: string }) => {
      queryClient.setQueryData(["site-settings"], { ...fallbackSiteSettings, ...profiles });
      return renderToStaticMarkup(<MemoryRouter initialEntries={["/en/"]}><QueryClientProvider client={queryClient}>
        <PublicChromeProvider isAdminRoute={false} routeKey="/en/">
          <SchemeANavbar /><SchemeAFooter /><JsonLdLocalBusiness />
        </PublicChromeProvider>
      </QueryClientProvider></MemoryRouter>);
    };
    const profiles = {
      facebook_url: "https://www.facebook.com/flashcast111",
      instagram_url: "https://www.instagram.com/flashcast2025/",
      tiktok_url: "https://www.tiktok.com/@flashcast121",
      xiaohongshu_url: "https://www.xiaohongshu.com/user/profile/62088ac5000000001000ac0a",
    };
    const html = render(profiles);
    const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] || "{}");
    expect(data.sameAs).toEqual(Object.values(profiles));
    const document = new DOMParser().parseFromString(html, "text/html");
    for (const selector of [".scheme-a-directory__socials a", ".scheme-a-footer__socials a"]) {
      const links = [...document.querySelectorAll(selector)];
      expect(links.map(link => link.getAttribute("href"))).toEqual(Object.values(profiles));
      expect(links.map(link => link.getAttribute("aria-label"))).toEqual(["Facebook", "Instagram", "TikTok", "REDnote (Xiaohongshu)"]);
      for (const link of links) {
        expect(link.getAttribute("target")).toBe("_blank");
        expect(link.getAttribute("rel")).toBe("noopener noreferrer");
        expect(link.hasAttribute("aria-current")).toBe(false);
      }
    }
    expect(document.querySelector(".scheme-a-directory__body > .scheme-a-directory__social-group")).not.toBeNull();
    expect(document.querySelector(".scheme-a-directory__foot .scheme-a-directory__social-group")).toBeNull();
    for (const [label, url] of [["Facebook", profiles.facebook_url], ["Instagram", profiles.instagram_url], ["TikTok", profiles.tiktok_url], ["REDnote (Xiaohongshu)", profiles.xiaohongshu_url]]) {
      expect(html).toContain(`href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${label}"`);
    }
    const changed = render({ ...profiles, tiktok_url: "https://www.tiktok.com/@new_account" });
    expect(changed).toContain("https://www.tiktok.com/@new_account");
    expect(changed).not.toContain(profiles.tiktok_url);
    expect(new DOMParser().parseFromString(changed, "text/html").querySelectorAll('a[href="https://www.tiktok.com/@new_account"]')).toHaveLength(2);
    const cleared = render({ facebook_url: "", instagram_url: "", tiktok_url: "", xiaohongshu_url: "" });
    expect(cleared).not.toContain("scheme-a-footer__socials");
    expect(cleared).not.toContain("scheme-a-directory__social-group");
    expect(JSON.parse(cleared.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] || "{}").sameAs).toEqual([]);
    const onlyRednote = render({ facebook_url: "", instagram_url: "", tiktok_url: "", xiaohongshu_url: profiles.xiaohongshu_url });
    expect(onlyRednote).toContain("scheme-a-footer__socials");
    expect(onlyRednote).toContain(profiles.xiaohongshu_url);
    const rednoteDocument = new DOMParser().parseFromString(onlyRednote, "text/html");
    expect(rednoteDocument.querySelectorAll(".scheme-a-directory__socials a")).toHaveLength(1);
    expect(rednoteDocument.querySelectorAll(".scheme-a-footer__socials a")).toHaveLength(1);
  });
});
