import test from "node:test";
import assert from "node:assert/strict";
import {
  findCustomerDuplicateWarnings,
  normalizeProductCode,
  normalizeTaxId,
  parseOptionalNonNegativeNumber,
  previewLegacySuppliers,
} from "../src/lib/erp-master-data";

test("tax IDs and optional product codes normalize deterministically", () => {
  assert.equal(normalizeTaxId("010-555-0000000"), "0105550000000");
  assert.equal(normalizeTaxId(""), null);
  assert.equal(normalizeProductCode(" sign-001 "), "SIGN-001");
  assert.equal(normalizeProductCode("  "), null);
});

test("product cost parsing preserves unknown versus intentional zero", () => {
  assert.equal(parseOptionalNonNegativeNumber("", "Cost"), null);
  assert.equal(parseOptionalNonNegativeNumber("0", "Cost"), 0);
  assert.throws(() => parseOptionalNonNegativeNumber("not-a-number", "Cost"));
  assert.throws(() => parseOptionalNonNegativeNumber("-1", "Cost"));
});

test("customer duplicate detection warns but never chooses a merge", () => {
  const warnings = findCustomerDuplicateWarnings({
    name: "Acme Co.", taxId: "010-555-0000000", phone: "02-123-4567", email: "sales@acme.test",
  }, [{
    id: "customer-1", name: "Acme Co.", taxId: "0105550000000", phone: "02-123-4567", email: "sales@acme.test",
  }]);
  assert.deepEqual(warnings.map((warning) => warning.confidence), ["high", "medium", "low"]);
  assert.ok(warnings.every((warning) => warning.recordIds.includes("customer-1")));
});

test("legacy supplier preview only auto-classifies exact tax identity", () => {
  const preview = previewLegacySuppliers([
    { id: "same-tax", name: "Different label", taxId: "010-555-0000000" },
    { id: "same-name", name: "Known Supplier" },
    { id: "new", name: "New Supplier" },
    { id: "bad", name: "" },
  ], [{ id: "supplier-1", name: "Known Supplier", taxId: "0105550000000" }]);
  assert.deepEqual(preview.map((row) => row.classification), ["existing", "conflict", "new", "invalid"]);
});
