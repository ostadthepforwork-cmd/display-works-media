import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../supabase/migrations/20260915151454_add_ai_referral_visits.sql", import.meta.url),
  "utf8",
);
const route = readFileSync(new URL("../src/app/api/marketing/ai-referral/route.ts", import.meta.url), "utf8");

test("AI referral storage is server-written and role-scoped for reads", () => {
  assert.match(migration, /alter table public\.ai_referral_visits enable row level security/i);
  assert.match(migration, /revoke all on table public\.ai_referral_visits from anon, authenticated/i);
  assert.doesNotMatch(migration, /grant insert[^;]*to anon/i);
  assert.match(migration, /private\.current_staff_role\(\)\) in \('owner', 'admin', 'sales', 'marketing'\)/i);
  assert.match(route, /createPrivilegedServerClient/);
  assert.doesNotMatch(route, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
});
