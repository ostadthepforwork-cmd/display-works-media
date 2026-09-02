import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const migration = readFileSync(resolve(root, "supabase/migrations/20260901083556_batch_5a_independent_master_data.sql"), "utf8");
const adminPage = readFileSync(resolve(root, "src/app/admin/page.tsx"), "utf8");

test("Batch 5A migration is isolated from document and later ERP batches", () => {
  assert.match(migration, /erp_supplier_items/i);
  assert.match(migration, /archived_at/i);
  assert.match(migration, /import_legacy_suppliers_v1/i);
  assert.doesNotMatch(migration, /save_erp_document_v1|erp_document_number_counters|customer_snapshot|company_snapshot/i);
  assert.doesNotMatch(migration, /erp_expenses|erp_jobs|profitability/i);
});

test("Batch 5A protects new data API structures and denies master hard deletes", () => {
  assert.match(migration, /enable row level security/g);
  assert.match(migration, /private\.is_admin\(\)/i);
  assert.match(migration, /revoke all on function public\.import_legacy_suppliers_v1/i);
  assert.match(migration, /grant execute on function public\.import_legacy_suppliers_v1\(text, jsonb\) to authenticated/i);
  assert.match(migration, /revoke delete on public\.erp_customers, public\.erp_products, public\.erp_suppliers from authenticated/i);
});

test("admin no longer imports or clears suppliers during ordinary page load", () => {
  assert.doesNotMatch(adminPage, /supplierRows\.length === 0[\s\S]{0,1500}from\("erp_suppliers"\)\.insert/i);
  assert.doesNotMatch(adminPage, /saveLocal\("erp_suppliers", \[\]\)/);
  assert.match(adminPage, /previewLegacySuppliers/);
  assert.match(adminPage, /import_legacy_suppliers_v1/);
});

test("master UI archives instead of hard deleting and hides archived choices from new documents", () => {
  assert.doesNotMatch(adminPage, /from\("erp_customers"\)\.delete\(/);
  assert.doesNotMatch(adminPage, /from\("erp_products"\)\.delete\(/);
  assert.doesNotMatch(adminPage, /from\("erp_suppliers"\)\.delete\(/);
  assert.match(adminPage, /customers\.filter\(c => !c\.archivedAt \|\| c\.id === f\.customerId\)/);
  assert.match(adminPage, /products\.filter\(p => !p\.archivedAt \|\| p\.id === item\.productId\)/);
});

test("Batch 5A keeps document snapshots and save behavior out of scope", () => {
  assert.doesNotMatch(adminPage, /customerSnapshot|companySnapshot|snapshot-first/i);
  assert.match(adminPage, /saveErpDocument/);
});
