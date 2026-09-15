import assert from "node:assert/strict";
import test from "node:test";
import {
  assertLeadTransition,
  calculateFunnelMetrics,
  creativeRecommendation,
  resolveAttribution,
  suggestQualified,
} from "../src/lib/marketing-attribution";

test("attribution follows explicit evidence order and supports unattributed", () => {
  assert.deepEqual(resolveAttribution({ adId: "ad-1", referralId: "ref-1", utmSource: "facebook" }), {
    method: "automatic",
    evidence: "ad_id",
  });
  assert.deepEqual(resolveAttribution({ referralId: "ref-1", utmSource: "facebook" }), {
    method: "automatic",
    evidence: "referral_id",
  });
  assert.equal(resolveAttribution({ utmCampaign: "launch" }).evidence, "utm");
  assert.equal(resolveAttribution({ fbclid: "click" }).evidence, "fbclid");
  assert.deepEqual(resolveAttribution({ campaignId: "campaign-1", manualSelectionConfirmed: true }), {
    method: "manual",
    evidence: "manual_selection",
  });
  assert.deepEqual(resolveAttribution({ campaignId: "campaign-1" }), { method: "unattributed", evidence: "none" });
  assert.deepEqual(resolveAttribution({ adId: "ad-1", forceUnattributed: true }), { method: "unattributed", evidence: "none" });
});

test("qualification suggestion requires product and one operational detail", () => {
  assert.equal(suggestQualified({ product: "Vinyl" }), false);
  assert.equal(suggestQualified({ sizeOrArea: "2x3m" }), false);
  assert.equal(suggestQualified({ product: "Vinyl", quantity: 0 }), true);
  assert.equal(suggestQualified({ product: "Vinyl", deadlineOrUseDate: "2026-09-30" }), true);
});

test("all funnel divisions return null when denominator is zero", () => {
  assert.deepEqual(calculateFunnelMetrics({
    totalLeads: 0,
    qualifiedLeads: 0,
    quotes: 0,
    won: 0,
    lost: 0,
    spend: 0,
    attributedRevenue: 0,
    grossProfit: null,
  }), {
    qualifiedRate: null,
    quoteRate: null,
    closeRate: null,
    costPerQualified: null,
    costPerQuote: null,
    cac: null,
    roas: null,
    revenue: 0,
    grossProfit: null,
    lost: 0,
  });
});

test("creative recommendation never calls volume-only leads good", () => {
  assert.equal(
    creativeRecommendation({ spend: 1000, qualifiedLeads: 0, quotes: 0, won: 0, attributedRevenue: 0 }),
    "ยังไม่มีหลักฐาน Qualified, Quote หรือ Won",
  );
  assert.match(creativeRecommendation({ spend: 1000, qualifiedLeads: 1, quotes: 0, won: 0, attributedRevenue: 0 }), /Qualified/);
  assert.match(creativeRecommendation({ spend: 1000, qualifiedLeads: 1, quotes: 1, won: 1, attributedRevenue: 5000 }), /Won/);
});

test("closed states enforce evidence and manual qualification", () => {
  assert.throws(() => assertLeadTransition({ leadStatus: "closed_lost", qualifiedStatus: "unreviewed" }), /lost reason/i);
  assert.throws(() => assertLeadTransition({ leadStatus: "closed_won", qualifiedStatus: "qualified", qualificationMethod: "manual" }), /receipt/i);
  assert.throws(() => assertLeadTransition({ leadStatus: "contacted", qualifiedStatus: "qualified" }), /manual/i);
  assert.doesNotThrow(() => assertLeadTransition({
    leadStatus: "closed_won",
    qualifiedStatus: "qualified",
    qualificationMethod: "manual",
    hasReceiptMapping: true,
  }));
});
