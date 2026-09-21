import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyCrawler,
  crawlerCategoryLabel,
  maskContactName,
  maskEmail,
  maskPhone,
  maskTaxId,
} from "../src/lib/admin-display";

test("customer PII is masked for list views", () => {
  assert.equal(maskContactName("สมชาย"), "ส****");
  assert.equal(maskPhone("081-234-5678"), "•••-•••-5678");
  assert.equal(maskEmail("owner@example.com"), "o***@example.com");
  assert.equal(maskTaxId("1234567890123"), "*********0123");
});

test("crawler categories do not report social previews as AI", () => {
  assert.equal(classifyCrawler("facebookexternalhit/1.1"), "social");
  assert.equal(classifyCrawler("Googlebot"), "search");
  assert.equal(classifyCrawler("GPTBot"), "ai");
  assert.equal(classifyCrawler("custom-monitor"), "other");
  assert.equal(crawlerCategoryLabel("social"), "Social preview");
});
