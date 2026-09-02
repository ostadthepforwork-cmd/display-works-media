import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const uploadRoute = readFileSync(resolve(root, "src/app/api/admin/expenses/[expenseId]/attachments/route.ts"), "utf8");
const downloadRoute = readFileSync(resolve(root, "src/app/api/admin/expenses/[expenseId]/attachments/[attachmentId]/route.ts"), "utf8");

test("expense evidence routes require fresh active-admin authorization", () => {
  for (const source of [uploadRoute, downloadRoute]) {
    assert.match(source, /createAuthenticatedServerClient\(\)/);
    assert.match(source, /checkAdminAuthorization\(supabase\)/);
    assert.match(source, /if \(!authorization\.user\)/);
    assert.match(source, /Cache-Control/);
  }
});

test("upload route validates content and generates the object path server-side", () => {
  assert.match(uploadRoute, /validateExpenseAttachment/);
  assert.match(uploadRoute, /crypto\.randomUUID\(\)/);
  assert.match(uploadRoute, /`expenses\/\$\{expenseId\}\/\$\{attachmentId\}/);
  assert.match(uploadRoute, /upsert: false/);
  assert.match(uploadRoute, /register_erp_expense_attachment_v1/);
  assert.match(uploadRoute, /orphan cleanup required/);
  assert.doesNotMatch(uploadRoute, /NEXT_PUBLIC_[A-Z_]*SERVICE|SUPABASE_SERVICE_ROLE_KEY/);
});

test("download route returns only a short-lived signed URL and no delete endpoint exists", () => {
  assert.match(downloadRoute, /SIGNED_URL_TTL_SECONDS = 5 \* 60/);
  assert.match(downloadRoute, /createSignedUrl/);
  assert.doesNotMatch(downloadRoute, /export async function DELETE/);
  assert.doesNotMatch(downloadRoute, /getPublicUrl|publicUrl/);
});
