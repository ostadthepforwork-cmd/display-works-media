import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const migration = readFileSync(resolve(root, "supabase/migrations/20260901030106_batch_2_erp_data_integrity.sql"), "utf8");
const adminPage = readFileSync(resolve(root, "src/app/admin/page.tsx"), "utf8");
const precheck = readFileSync(resolve(root, "supabase/batch-2-erp-data-integrity-precheck.sql"), "utf8");

test("Batch 2 migration is additive and preserves historical classifications", () => {
  assert.match(migration, /security invoker/i);
  assert.match(migration, /private\.is_admin\(\)/i);
  assert.match(migration, /where deleted is not true/i);
  assert.match(migration, /timezone\('Asia\/Bangkok', now\(\)\)/i);
  assert.doesNotMatch(migration, /update\s+public\.erp_document_items\s+set\s+product_id/i);
  assert.doesNotMatch(migration, /where\s+status\s*=\s*'paid'[\s\S]{0,300}update\s+public\.erp_documents/i);
  assert.doesNotMatch(migration, /service_role/i);
});

test("Admin document save uses the RPC and has no browser max-number allocator or committed shadow", () => {
  assert.match(adminPage, /saveErpDocument\(supabase, args\)/);
  assert.doesNotMatch(adminPage, /nextDocNoForType/);
  assert.doesNotMatch(adminPage, /erp_document_field_shadow/);
  assert.doesNotMatch(adminPage, /saveErpDocumentShadow|applyErpDocumentShadow/);
});

test("production precheck remains read-only", () => {
  assert.doesNotMatch(precheck, /\b(insert|update|delete|alter|create|drop|truncate)\b/i);
});
