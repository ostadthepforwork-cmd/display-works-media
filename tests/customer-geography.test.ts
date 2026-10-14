import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { THAI_PROVINCES, customerProvince, customerPostalCode, validateCustomerLocation } from "../src/lib/customer-geography";

test("province options contain 77 unique provinces and explicit fields take precedence", () => {
  assert.equal(THAI_PROVINCES.length, 77);
  assert.equal(new Set(THAI_PROVINCES).size, 77);
  assert.equal(customerProvince({ province: "จันทบุรี", address: "กรุงเทพมหานคร" }), "จันทบุรี");
  assert.equal(customerProvince({ address: "คลองพลู เขาคิชฌกูฏ จันทบุรี 2221" }), "จันทบุรี");
  assert.equal(customerProvince({ province: "กรุงเทพฯ" }), "กรุงเทพมหานคร");
  assert.equal(customerProvince({}), "ไม่ระบุ");
});

test("postal codes are optional strings of five digits, never guessed or padded", () => {
  for (const postalCode of ["2221", "22a10", "221100", "-2211"]) assert(validateCustomerLocation({ postalCode }));
  assert.equal(validateCustomerLocation({ province: "จันทบุรี", postalCode: "22110" }), "");
  assert.equal(validateCustomerLocation({}), "");
  assert.equal(customerPostalCode({ address: "จันทบุรี 2221" }), "ไม่ระบุ");
  assert.equal(customerPostalCode({ address: "โทร 0651465392" }), "ไม่ระบุ");
  assert.equal(customerPostalCode({ address: "จันทบุรี 22110" }), "22110");
  assert.equal(customerPostalCode({ postal_code: "22110", address: "10400" }), "22110");
});

test("customer fields persist, reload, export, and feed Marketing geography", () => {
  const admin = readFileSync("src/app/admin/page.tsx", "utf8");
  assert.match(admin, /province: c.province/);
  assert.match(admin, /postalCode: c.postal_code/);
  assert.match(admin, /postal_code: String\(form.postalCode/);
  assert.match(admin, /validateCustomerLocation\(form\)/);
  const marketing = readFileSync("src/app/admin/MarketingKpiDashboard.tsx", "utf8");
  assert.match(marketing, /summarizeRows\(customers, customerPostalCode\)/);
  assert.match(marketing, /รหัสไปรษณีย์ลูกค้า/);
  assert.match(readFileSync("src/app/admin/dashboard/ErpDataExport.tsx", "utf8"), /\['รหัสไปรษณีย์', 'postal_code'\]/);
});
