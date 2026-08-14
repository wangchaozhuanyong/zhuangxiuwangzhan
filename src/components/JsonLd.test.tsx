import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JsonLdBlogPosting } from "@/components/JsonLd";

describe("JsonLdBlogPosting", () => {
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
