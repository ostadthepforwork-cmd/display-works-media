import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const migration = readFileSync(resolve(root, "supabase/migrations/20260901040100_batch_3_erp_expense_management.sql"), "utf8");

test("Batch 3 migration is isolated, private, and preserves legacy estimated costs", () => {
  assert.match(migration, /save_erp_expense_v1/i);
  assert.match(migration, /private\.is_admin\(\)/i);
  assert.match(migration, /security definer/i);
  assert.match(migration, /revoke all on function public\.save_erp_expense_v1/i);
  assert.match(migration, /'erp-expense-evidence',[\s\S]{0,120}false/i);
  assert.doesNotMatch(migration, /create policy[^;]+for delete[^;]+erp-expense-evidence/i);
  assert.doesNotMatch(migration, /update\s+public\.erp_documents/i);
  assert.doesNotMatch(migration, /insert\s+into\s+public\.erp_expenses[\s\S]{0,300}internal_expenses/i);
  assert.doesNotMatch(migration, /erp_document_number_counters|save_erp_document_v1/i);
});

test("financial semantics are exact and payment states exclude partial payment", () => {
  assert.match(migration, /amount numeric\(14,2\)/i);
  assert.match(migration, /generated always as \(amount \+ vat_amount\) stored/i);
  assert.match(migration, /withholding_amount[^;]+withholding_amount <= amount \+ vat_amount/i);
  assert.match(migration, /payment_status in \('unpaid', 'paid'\)/i);
  assert.doesNotMatch(migration, /partial_paid|partial payment/i);
});

test("audit and trusted workflow tables do not expose client mutation", () => {
  assert.match(migration, /revoke all on table public\.erp_expense_events from public, anon, authenticated/i);
  assert.match(migration, /grant select on table public\.erp_expense_events to authenticated/i);
  assert.doesNotMatch(migration, /grant (insert|update|delete)[^;]+erp_expense_events/i);
  assert.doesNotMatch(migration, /grant (insert|update|delete)[^;]+erp_expense_number_counters/i);
  assert.doesNotMatch(migration, /grant (insert|update|delete)[^;]+erp_expense_save_requests/i);
});
