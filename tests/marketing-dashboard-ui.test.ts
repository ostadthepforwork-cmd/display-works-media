import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../src/app/admin/MarketingKpiDashboard.tsx", import.meta.url),
  "utf8",
);

test("Ads Performance separates platforms and Meta detail levels", () => {
  for (const label of ["ภาพรวม", "Meta Ads", "Google Ads", "LINE Ads", "Campaign", "Ad Set", "Creative"]) {
    assert.match(source, new RegExp(label));
  }
  assert.match(source, /showMetaCampaigns && <section/);
  assert.match(source, /showMetaAdSets \|\| showMetaCreative/);
});

test("Reports is a compact report center and lead creation is progressive", () => {
  assert.match(source, /Report Center/);
  assert.match(source, /ส่งออกข้อมูลช่วงนี้/);
  assert.match(source, /aria-expanded=\{showLeadForm\}/);
  assert.match(source, /source: "unattributed"/);
  assert.match(source, /service: ""/);
});

test("mobile marketing navigation stays compact and horizontally scrollable", () => {
  assert.match(source, /\.mk-mobile-tabs\{display:flex!important/);
  assert.match(source, /overflow-x:auto!important/);
  assert.match(source, /\.mk-mobile-tabs button\{flex:0 0 auto;min-width:124px;min-height:44px/);
  assert.match(source, /\.mk-sub\{font-size:13px/);
});
