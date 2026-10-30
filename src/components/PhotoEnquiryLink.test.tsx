import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import PhotoEnquiryLink from "./PhotoEnquiryLink";

vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: "en" }) }));
vi.mock("@/hooks/useSiteSettings", () => ({ useSiteSettings: () => ({ whatsapp_url: () => "https://example.test/fixture-enquiry" }) }));

describe("scoped home photo enquiry label", () => {
  it("changes only an explicitly supplied label while preserving the default wording, destination and link protection elsewhere", () => {
    const container = document.createElement("div"); document.body.append(container); const root = createRoot(container);
    try {
      act(() => root.render(<><PhotoEnquiryLink source="home_hero" label="Send photos, start a conversation" /><PhotoEnquiryLink source="service" service="Kitchen" /></>));
      const links = container.querySelectorAll("a");
      expect(links[0]).toHaveTextContent("Send photos, start a conversation");
      expect(links[1]).toHaveTextContent("Chat on WhatsApp");
      for (const link of links) { expect(link).toHaveAttribute("href", "https://example.test/fixture-enquiry"); expect(link).toHaveAttribute("target", "_blank"); expect(link).toHaveAttribute("rel", "noopener noreferrer"); }
    } finally { act(() => root.unmount()); container.remove(); }
  });
});
