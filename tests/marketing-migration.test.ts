import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationPath = new URL(
  "../supabase/migrations/20260915020945_meta_crm_attribution.sql",
  import.meta.url,
);
const sql = readFileSync(migrationPath, "utf8");

test("CRM migration enables RLS and grants each role only its intended operations", () => {
  for (const table of [
    "crm_leads",
    "crm_lead_document_mappings",
    "crm_lead_audit_events",
    "marketing_meta_entities",
    "marketing_campaign_budgets",
    "marketing_messenger_referrals",
    "ai_citation_logs",
  ]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
  assert.match(sql, /sales manage CRM leads[\s\S]*owner', 'admin', 'sales'/i);
  assert.match(sql, /marketing insert campaign budgets[\s\S]*owner', 'admin', 'marketing'/i);
  assert.doesNotMatch(sql, /grant\s+(?:all|insert|update|delete)[^;]*ai_citation_logs[^;]*authenticated/i);
});

test("CRM schema stores operational attribution without customer or chat PII", () => {
  const leadTable = sql.match(/create table public\.crm_leads \(([\s\S]*?)\n\);/i)?.[1] || "";
  const messengerTable = sql.match(/create table public\.marketing_messenger_referrals \(([\s\S]*?)\n\);/i)?.[1] || "";
  assert.ok(leadTable);
  assert.ok(messengerTable);
  for (const forbidden of ["customer_name", "phone", "address", "chat_text", "message_body"]) {
    assert.doesNotMatch(leadTable, new RegExp(`\\b${forbidden}\\b`, "i"));
    assert.doesNotMatch(messengerTable, new RegExp(`\\b${forbidden}\\b`, "i"));
  }
  assert.match(messengerTable, /raw_metadata \? 'message'/i);
  assert.match(messengerTable, /raw_metadata \? 'text'/i);
});

test("campaign budget is not seeded until a verified Meta campaign exists", () => {
  assert.match(sql, /campaign_id must exist in the latest Meta sync/i);
  assert.doesNotMatch(
    sql,
    /insert\s+into\s+public\.marketing_campaign_budgets[\s\S]*120249760412250073/i,
  );
});

test("Closed Won is guarded by a real receipt mapping", () => {
  assert.match(sql, /receipt_id must reference an active receipt/i);
  assert.ok((sql.match(/Closed Won requires a receipt mapping/gi) || []).length >= 2);
  assert.match(sql, /crm_leads_manual_qualification_check/i);
  assert.match(sql, /comment on column public\.crm_leads\.estimated_value is 'Pipeline estimate only\. Never counted as ERP revenue\.'/i);
});
