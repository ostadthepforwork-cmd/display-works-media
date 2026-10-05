import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("cookie consent UI never becomes part of customer print/PDF output", async () => {
  const source = await readFile(new URL("../src/components/PDPAConsent.tsx", import.meta.url), "utf8");
  assert.match(source, /className="pdpa-detail-modal"/);
  assert.match(source, /@media print\s*\{\s*\.pdpa-banner-wrap, \.pdpa-backdrop, \.pdpa-detail-modal\s*\{\s*display: none !important;/);
});
