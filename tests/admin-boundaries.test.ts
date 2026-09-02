import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest, type NextFetchEvent } from "next/server";
import { proxy } from "../src/proxy";
import { GET as sessionGET } from "../src/app/api/admin/session/route";
import { POST as loginPOST } from "../src/app/api/admin/login/route";

const user = {
  id: "00000000-0000-4000-8000-000000000001",
  aud: "authenticated", role: "authenticated", email: "fixture@example.invalid",
  user_metadata: { role: "owner", active: true }, app_metadata: {},
  created_at: "2026-01-01T00:00:00Z",
};
const cookieName = "sb-authorization-test-auth-token";
const event = { waitUntil() {} } as unknown as NextFetchEvent;

function fixtureSession(expired = false) {
  const exp = Math.floor(Date.now() / 1000) + (expired ? -60 : 3600);
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return {
    access_token: `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, exp })}.ZmFrZQ`,
    refresh_token: "test-only-refresh", expires_in: 3600, expires_at: exp,
    token_type: "bearer", user,
  };
}

function cookie(expired = false) {
  return `${cookieName}=base64-${Buffer.from(JSON.stringify(fixtureSession(expired))).toString("base64url")}`;
}

test("real SSR client and HTTP handlers enforce the admin matrix with mocked upstream", async (t) => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://authorization-test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-only-public-key";
  t.after(() => {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousKey;
  });

  let membership: { user_id: string; role: string; active: boolean } | null = null;
  let unavailable = false;
  let requests = 0;
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    requests++;
    const url = new URL(input instanceof Request ? input.url : String(input));
    assert.equal(url.origin, "https://authorization-test.supabase.co");
    if (url.pathname === "/auth/v1/user") return Response.json(user);
    if (url.pathname === "/auth/v1/token") return Response.json(fixtureSession());
    assert.equal(url.pathname, "/rest/v1/admin_users");
    assert.equal(url.searchParams.get("user_id"), `eq.${user.id}`);
    if (unavailable) return Response.json({ message: "private database details" }, { status: 403 });
    return Response.json(membership ? [membership] : []);
  });

  await t.test("anonymous is redirected/401 and public routes skip authorization", async () => {
    const response = await proxy(new NextRequest("http://localhost/admin"), event);
    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), "http://localhost/login");
    assert.equal((await sessionGET(new Request("http://localhost/api/admin/session"))).status, 401);
    for (const path of ["/", "/blog", "/portfolio", "/api/quote"]) {
      const result = await proxy(new NextRequest(`http://localhost${path}`), event);
      assert.equal(result.headers.get("x-middleware-next"), "1");
    }
    assert.equal(requests, 0);
  });

  for (const entry of [
    { name: "authenticated non-admin", role: null, active: false, status: 403 },
    { name: "active owner", role: "owner", active: true, status: 200 },
    { name: "active admin", role: "admin", active: true, status: 200 },
    { name: "inactive admin", role: "admin", active: false, status: 403 },
  ]) {
    await t.test(entry.name, async () => {
      membership = entry.role ? { user_id: user.id, role: entry.role, active: entry.active } : null;
      const headers = { cookie: cookie() };
      const page = await proxy(new NextRequest("http://localhost/admin", { headers }), event);
      assert.equal(page.status, entry.status);
      assert.equal(page.headers.get("cache-control"), "private, no-store");
      const session = await sessionGET(new Request("http://localhost/api/admin/session", { headers }));
      assert.equal(session.status, entry.status);
      const body = await session.json();
      assert.equal(body.authenticated, true);
      assert.equal(body.authorized, entry.status === 200);
      const login = await loginPOST(new Request("http://localhost/api/admin/login", {
        method: "POST", body: JSON.stringify(fixtureSession()),
        headers: { "content-type": "application/json" },
      }));
      assert.equal(login.status, entry.status);
      assert.equal((await login.json()).success, entry.status === 200);
      assert.equal(Boolean(login.headers.get("set-cookie")), entry.status === 200);
      const loginPage = await proxy(new NextRequest("http://localhost/login", { headers }), event);
      assert.equal(loginPage.status, entry.status === 200 ? 307 : 200);
    });
  }

  await t.test("refreshed cookies survive session responses and proxy denial", async () => {
    membership = { user_id: user.id, role: "admin", active: true };
    const headers = { cookie: cookie(true) };
    const session = await sessionGET(new Request("http://localhost/api/admin/session", { headers }));
    assert.equal(session.status, 200);
    assert.match(session.headers.get("set-cookie") || "", new RegExp(cookieName));
    membership.active = false;
    const denied = await proxy(new NextRequest("http://localhost/admin", { headers }), event);
    assert.equal(denied.status, 403);
    assert.match(denied.headers.get("set-cookie") || "", new RegExp(cookieName));
  });

  await t.test("membership backend errors deny with generic 503", async () => {
    unavailable = true;
    const headers = { cookie: cookie() };
    const response = await sessionGET(new Request("http://localhost/api/admin/session", { headers }));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, "Authorization unavailable");
    assert.equal((await proxy(new NextRequest("http://localhost/admin", { headers }), event)).status, 503);
  });
});
