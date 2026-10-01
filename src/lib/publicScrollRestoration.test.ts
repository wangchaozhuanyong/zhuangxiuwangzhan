import { describe, expect, it } from "vitest";
import { getFurnitureListingOrigin, getListingScrollPosition, getPublicScrollTarget, ELEMENT_SCROLL_INTENT, LISTING_SCROLL_INTENT } from "./publicScrollRestoration";

describe("public navigation intents", () => {
  it("retains the exact source category, subcategory, query and scroll position", () => {
    const furnitureOrigin = { pathname: "/zh/furniture/bedroom/double-beds", search: "?page=2", top: 820 };
    expect(getFurnitureListingOrigin({ furnitureOrigin })).toEqual(furnitureOrigin);
    expect(getFurnitureListingOrigin({ furnitureOrigin: { ...furnitureOrigin, pathname: "/en/furniture" } })).toEqual({ ...furnitureOrigin, pathname: "/en/furniture" });
  });
  it.each([null, {}, { furnitureOrigin: { pathname: "https://example.com/furniture", search: "", top: 0 } },
    { furnitureOrigin: { pathname: "/zh/furniture/product/example", search: "", top: 0 } },
    { furnitureOrigin: { pathname: "/zh/furniture/../contact", search: "", top: 0 } },
    { furnitureOrigin: { pathname: "/zh/furniture", search: "#outside", top: 0 } },
    { furnitureOrigin: { pathname: "/zh/furniture", search: "", top: NaN } }])("rejects unsafe or incomplete catalog origins: %j", (state) => {
    expect(getFurnitureListingOrigin(state)).toBeNull();
  });
  it("accepts only the named typed scroll intents", () => {
    expect(getPublicScrollTarget({ scrollIntent: ELEMENT_SCROLL_INTENT, scrollTarget: "articles" })).toBe("articles");
    expect(getPublicScrollTarget({ scrollTarget: "articles" })).toBeNull();
    expect(getListingScrollPosition({ scrollIntent: LISTING_SCROLL_INTENT, scrollTop: 0 })).toBe(0);
    expect(getListingScrollPosition({ scrollIntent: LISTING_SCROLL_INTENT, scrollTop: Infinity })).toBeNull();
  });
});
