import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("CRM mapping migration preserves invoker permissions and handles the earlier quote row", async () => {
  const sql = await readFile(new URL("../supabase/migrations/20261005083921_extend_crm_quote_mapping.sql", import.meta.url), "utf8");
  assert.match(sql, /security invoker set search_path = ''/);
  assert.match(sql, /coalesce\(\(select private\.current_staff_role\(\)\), ''\)/);
  assert.match(sql, /on conflict \(quote_id\) where quote_id is not null/);
  assert.match(sql, /receipt_id = coalesce\(excluded\.receipt_id, existing\.receipt_id\)/);
  assert.match(sql, /existing\.receipt_id = excluded\.receipt_id/);
  assert.match(sql, /revoke all on function[\s\S]+from public, anon/);
  assert.doesNotMatch(sql, /security definer/i);
});
