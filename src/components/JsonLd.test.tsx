import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { JsonLdBlogPosting, JsonLdLocalBusiness } from "@/components/JsonLd";
import { fallbackSiteSettings } from "@/lib/siteSettingsApi";
import { MemoryRouter } from "react-router-dom";
import { SchemeAFooter } from "@/components/scheme-a/SchemeAPublicChrome";

vi.hoisted(() => { vi.stubEnv("VITE_SITE_URL", "https://flashcast.com.my"); });

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

  it("omits unconfirmed social accounts from Footer and JSON-LD", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(["site-settings"], {
      ...fallbackSiteSettings,
      facebook_url: "https://www.facebook.com/not-created-yet/",
      instagram_url: "https://www.instagram.com/not-created-yet/",
    });
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={["/en/"]}><QueryClientProvider client={queryClient}>
      <>
        <SchemeAFooter />
        <JsonLdLocalBusiness />
      </>
    </QueryClientProvider></MemoryRouter>);
    const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] || "{}");
    expect(data.sameAs).toEqual([]);
    expect(html).not.toContain("scheme-a-footer__socials");
    expect(html).not.toContain("not-created-yet");
  });
});
