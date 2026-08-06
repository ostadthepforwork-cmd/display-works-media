import test from "node:test";
import assert from "node:assert/strict";
import { docVatRate, lineAmount, lineCost, lineQtyForBasis } from "../src/lib/erp-calculations";

test("calculates sqm vinyl cost and revenue from area quantity", () => {
  const item = {
    qty: 2.52,
    pieces: 2,
    widthM: 1.8,
    heightM: 0.7,
    costSnapshot: 200,
    price: 300,
    costUnit: "sqm",
    priceUnit: "sqm",
  };

  assert.equal(lineQtyForBasis(item, "sqm"), 2.52);
  assert.equal(lineCost(item), 504);
  assert.equal(lineAmount(item), 756);
});

test("allows sqm cost with piece-based selling price", () => {
  const item = {
    qty: 2,
    pieces: 1,
    widthM: 2,
    heightM: 1,
    costSnapshot: 170,
    price: 500,
    costUnit: "sqm",
    priceUnit: "piece",
  };

  assert.equal(lineQtyForBasis(item, "sqm"), 2);
  assert.equal(lineQtyForBasis(item, "piece"), 1);
  assert.equal(lineCost(item), 340);
  assert.equal(lineAmount(item), 500);
});

test("uses custom document VAT rate before defaulting to 7 percent", () => {
  assert.equal(docVatRate({ vatRate: 3 }), 3);
  assert.equal(docVatRate({ vat_rate: 5 }), 5);
  assert.equal(docVatRate({}), 7);
});
