import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const proposal = readFileSync(resolve(root, "supabase/batch-4-profitability-reporting-proposed.sql"), "utf8");
const publicDocument = readFileSync(resolve(root, "src/app/doc/[id]/page.tsx"), "utf8");
const adminPage = readFileSync(resolve(root, "src/app/admin/page.tsx"), "utf8");

test("Batch 4 database definition is isolated, additive, and has no historical backfill", () => {
  assert.match(proposal, /DO NOT APPLY until Batch 2 and Batch 3/i);
  assert.match(proposal, /add column if not exists job_id/i);
  assert.match(proposal, /erp_job_financial_reviews/i);
  assert.doesNotMatch(proposal, /^\s*(insert|update|delete|truncate)\b/im);
  assert.doesNotMatch(proposal, /save_erp_document_v1|erp_document_number_counters/i);
  assert.doesNotMatch(proposal, /save_erp_expense_v1|erp_expense_number_counters/i);
});

test("Batch 4 reporting views preserve RLS and exclude VAT from recognized expense", () => {
  assert.equal((proposal.match(/security_invoker\s*=\s*true/gi) || []).length, 2);
  assert.match(proposal, /revoke all[\s\S]+?from public, anon, authenticated/i);
  assert.match(proposal, /e\.amount as recognized_expense_ex_vat/i);
  assert.doesNotMatch(proposal, /total_amount as recognized_expense/i);
  assert.doesNotMatch(proposal, /service_role|security definer/i);
});

test("Batch 4 implementation does not edit customer-facing public document totals", () => {
  assert.match(publicDocument, /const calcDocTotal|function calcDocTotal/);
  assert.doesNotMatch(publicDocument, /erp-profitability|JobProfitability|BusinessProfitability/);
});

test("admin exposes a read-only old-versus-canonical comparison and completeness labels", () => {
  assert.match(adminPage, /buildBusinessProfitability/);
  assert.match(adminPage, /compareLegacyAndCanonical/);
  assert.match(adminPage, /BATCH 4 READ-ONLY COMPARISON/);
  for (const label of [
    "LEGACY REVENUE UNCLASSIFIED",
    "ESTIMATED COST INCOMPLETE",
    "ACTUAL EXPENSE UNCONFIRMED",
    "PAYMENT DATA INCOMPLETE",
    "JOB LINK INCOMPLETE",
  ]) assert.match(adminPage, new RegExp(label));
  assert.match(adminPage, /Meta \/ Google spend remains attribution-only/);
});
