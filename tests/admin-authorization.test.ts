import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { checkAdminAuthorization } from "../src/lib/admin-authorization";

const user = { id: "user-1", user_metadata: { role: "owner", active: true } } as unknown as User;

function client(options: {
  signedIn?: boolean;
  membership?: { user_id: string; role: string; active: boolean } | null;
  membershipError?: boolean;
  authError?: boolean;
  throws?: boolean;
} = {}) {
  const queries: string[] = [];
  return {
    queries,
    supabase: {
      auth: { getUser: async () => {
        if (options.throws) throw new Error("private backend details");
        return { data: { user: options.signedIn === false ? null : user }, error: options.authError ? new Error("expired") : null };
      } },
      from(table: string) {
        queries.push(table);
        return { select(columns: string) {
          assert.equal(columns, "user_id, role, active");
          return { eq(column: string, value: string) {
            assert.equal(column, "user_id");
            assert.equal(value, user.id);
            return { maybeSingle: async () => ({
              data: options.membership ?? null,
              error: options.membershipError ? new Error("private SQL details") : null,
            }) };
          } };
        } };
      },
    } as unknown as SupabaseClient,
  };
}

test("anonymous and expired sessions are denied before membership lookup", async () => {
  for (const options of [{ signedIn: false }, { authError: true }]) {
    const mock = client(options);
    const result = await checkAdminAuthorization(mock.supabase);
    assert.equal(result.status, 401);
    assert.equal(result.user, null);
    assert.deepEqual(mock.queries, []);
  }
});

test("authenticated non-admin cannot promote themselves with user metadata", async () => {
  const result = await checkAdminAuthorization(client().supabase);
  assert.equal(result.status, 403);
  assert.equal(result.authenticated, true);
  assert.equal(result.user, null);
});

for (const role of ["owner", "admin"]) {
  test(`active ${role} is allowed and inactive ${role} is denied`, async () => {
    for (const active of [true, false]) {
      const result = await checkAdminAuthorization(client({ membership: { user_id: user.id, role, active } }).supabase);
      assert.equal(result.status, active ? 200 : 403);
      assert.equal(result.user, active ? user : null);
    }
  });
}

test("unknown roles and mismatched membership identities fail closed", async () => {
  for (const membership of [
    { user_id: user.id, role: "editor", active: true },
    { user_id: "another-user", role: "owner", active: true },
  ]) {
    assert.equal((await checkAdminAuthorization(client({ membership }).supabase)).status, 403);
  }
});

test("membership errors/outages fail closed without exposing backend details", async () => {
  for (const options of [{ membershipError: true }, { throws: true }]) {
    const result = await checkAdminAuthorization(client(options).supabase);
    assert.equal(result.status, 503);
    assert.equal(result.user, null);
    assert.equal(result.error, "Authorization unavailable");
  }
});

test("revocation is rechecked instead of cached from a prior request", async () => {
  const membership = { user_id: user.id, role: "admin", active: true };
  const mock = client({ membership });
  assert.equal((await checkAdminAuthorization(mock.supabase)).status, 200);
  membership.active = false;
  assert.equal((await checkAdminAuthorization(mock.supabase)).status, 403);
  assert.equal(mock.queries.length, 2);
});
