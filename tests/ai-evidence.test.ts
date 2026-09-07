import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { aiDateRange, bangkokDay, citationEvidence, citationRateLabel, detectAiReferrer, ownCitationUrls, publicReferralPath, safeUrlList } from "../src/lib/ai-evidence";

test("referrals distinguish general search from AI platform hosts", () => {
  for (const url of ["https://bing.com/search?q=x", "https://openai.com", "https://chatgpt.com.evil.test", "javascript:alert(1)"]) assert.equal(detectAiReferrer(url), null);
  assert.equal(detectAiReferrer("https://chatgpt.com/c/123")?.platform, "chatgpt");
  assert.equal(detectAiReferrer("https://copilot.microsoft.com")?.platform, "copilot");
});
test("referral paths exclude private paths and strip query secrets", () => {
  for (const path of ["/admin?x=1", "/doc/123", "/%61dmin", "/x/../admin", "//evil.test", "/qa", "/a.js?q=1", "/%2561dmin"]) assert.equal(publicReferralPath(path), null, path);
  assert.equal(publicReferralPath("/blog/article?token=secret#secret"), "/blog/article");
});
test("citations require an own-domain safe URL and deduplicate", () => {
  const urls = ["https://displayworksmedia.com/blog/a", "https://displayworksmedia.com/blog/a", "https://displayworksmedia.com.evil.test", "javascript:alert(1)"];
  assert.equal(ownCitationUrls(urls).length, 1);
  assert.equal(safeUrlList("malformed").length, 0);
  assert.equal(citationEvidence({ is_cited: true, cited_urls: [] }), "inconsistent");
  assert.equal(citationEvidence({ is_cited: false, cited_urls: urls }), "inconsistent");
  assert.equal(citationEvidence({ is_cited: true, cited_urls: urls }), "recorded");
  assert.equal(citationRateLabel(null), "-");
  assert.equal(citationRateLabel(0), "0.0%");
});
test("AI date filtering validates dates and uses Bangkok calendar boundaries", () => {
  for (const query of ["startDate=bad", "startDate=2026-02-30&endDate=2026-03-01", "startDate=2026-09-08&endDate=2026-09-07"]) assert.equal(aiDateRange(new Request(`http://localhost/?${query}`)), null);
  assert.deepEqual(aiDateRange(new Request("http://localhost/?startDate=2026-09-07&endDate=2026-09-07")), { startIso: "2026-09-06T17:00:00.000Z", endIso: "2026-09-07T16:59:59.999Z" });
  assert.equal(bangkokDay("2026-09-06T17:00:00Z"), "2026-09-07");
});
test("expense navigation does not alias receipts and renders independent page", () => {
  const source = readFileSync("src/app/admin/page.tsx", "utf8");
  const sidebar = source.slice(source.indexOf("function ErpSidebar"), source.indexOf("function Dashboard"));
  assert.match(sidebar, /id: "expenses"/);
  assert.doesNotMatch(sidebar, /target/);
  assert.match(source, /erpPage === "expenses" && <ExpensePage/);
  assert.match(source, /onClick=\{\(\) => setPage\("expenses"\)\}/);
});
