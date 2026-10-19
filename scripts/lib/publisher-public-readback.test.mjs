import assert from "node:assert/strict";
import test from "node:test";
import { withCompanyBrandSuffix } from "./publisher-public-readback.mjs";

test("public metadata matches PageMeta company suffix when the CMS title has no brand", () => {
  assert.equal(withCompanyBrandSuffix("Rental unit renovation", {
    brandName: "FLASH CAST", companyName: "FLASH CAST SDN. BHD.",
  }), "Rental unit renovation | FLASH CAST SDN. BHD.");
});

test("public metadata does not duplicate an existing brand in the CMS title", () => {
  assert.equal(withCompanyBrandSuffix("Renovasi unit sewa | FLASH CAST", {
    brandName: "FLASH CAST", companyName: "FLASH CAST SDN. BHD.",
  }), "Renovasi unit sewa | FLASH CAST");
});

test("public metadata does not duplicate the company name", () => {
  assert.equal(withCompanyBrandSuffix("Renovation | FLASH CAST SDN. BHD.", {
    brandName: "FLASH CAST", companyName: "FLASH CAST SDN. BHD.",
  }), "Renovation | FLASH CAST SDN. BHD.");
});

test("public metadata verification fails closed when the title or public brand settings are missing", () => {
  assert.throws(() => withCompanyBrandSuffix(" ", { companyName: "FLASH CAST SDN. BHD." }));
  assert.throws(() => withCompanyBrandSuffix("Renovation", { brandName: "FLASH CAST" }));
  assert.throws(() => withCompanyBrandSuffix("Renovation", { companyName: "FLASH CAST SDN. BHD." }));
});
