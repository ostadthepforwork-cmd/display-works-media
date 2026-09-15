import assert from "node:assert/strict";
import test from "node:test";
import { buildMarketingExportFiles } from "../src/lib/marketing-export";

test("marketing export is aggregate per ad, excludes PII, and keeps unattributed revenue", () => {
  const files = buildMarketingExportFiles({
    rangeLabel: "2026-09-01 to 2026-09-15",
    ads: [{ id: "ad-1", name: "Creative A", spend: 200, impressions: 5000, reach: 3000, clicks: 50, leads: 4 }],
    leads: [
      { id: "lead-1", adId: "ad-1", qualifiedStatus: "qualified", status: "closed_won", creativeId: "creative-1" },
      { id: "lead-2", qualifiedStatus: "unreviewed", status: "new" },
    ],
    mappings: [{ lead_id: "lead-1", quote_id: "quote-1", receipt_id: "receipt-1" }],
    receipts: [{ id: "receipt-1", revenue: 1070, actualCost: null }, { id: "receipt-2", revenue: 500, actualCost: null }],
  });
  assert.deepEqual(Object.keys(files).sort(), ["00_data_notes.md", "01_ads_performance.csv", "02_ads_sales_funnel.csv", "03_creative_insights.csv"]);
  assert.equal(files["01_ads_performance.csv"].split("\r\n").length, 2);
  assert.match(files["02_ads_sales_funnel.csv"], /"ad-1".*"1070"/);
  assert.match(files["02_ads_sales_funnel.csv"], /"unattributed".*"500"/);
  assert.match(files["02_ads_sales_funnel.csv"], /"1070",""/);
  const csvPayload = Object.entries(files)
    .filter(([filename]) => filename.endsWith(".csv"))
    .map(([, content]) => content)
    .join("\n");
  for (const pii of ["customer_name", "phone", "address", "chat_text"]) assert.equal(csvPayload.includes(pii), false);
});
