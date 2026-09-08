import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest, type NextFetchEvent } from "next/server";
import { proxy } from "../src/proxy";

test("crawler ingestion matches deployed schema and reports failures without leaking credentials", async () => {
  const previousFetch = globalThis.fetch;
  const previousWarn = console.warn;
  const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const oldKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const warnings: unknown[][] = [];
  const payloads: Record<string, unknown>[] = [];
  let outcome: number | "network" = 201;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://synthetic.invalid";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "synthetic-test-credential";
  console.warn = (...args: unknown[]) => { warnings.push(args); };
  globalThis.fetch = async (_input, init) => {
    payloads.push(JSON.parse(String(init?.body)));
    if (outcome === "network") throw new Error("synthetic-test-credential");
    return new Response(outcome === 400 ? "synthetic-test-credential" : null, { status: outcome });
  };
  async function visit(path: string, userAgent = "GPTBot") {
    const pending: Promise<unknown>[] = [];
    await proxy(new NextRequest(`https://example.test${path}`, { headers: { "user-agent": userAgent } }),
      { waitUntil: (promise: Promise<unknown>) => pending.push(promise) } as unknown as NextFetchEvent);
    await Promise.all(pending);
  }
  try {
    await visit("/blog/example");
    assert.deepEqual(Object.keys(payloads[0]).sort(), ["bot_name", "country", "path", "referrer", "user_agent"].sort());
    assert.equal(warnings.length, 0);
    for (const path of ["/api/example", "/doc/example", "/auth/example", "/image.png", "/_next/static/example.js"]) await visit(path);
    await visit("/blog/example", "Mozilla/5.0");
    assert.equal(payloads.length, 1);
    outcome = 400;
    await visit("/blog/example");
    assert.deepEqual(warnings[0], ["AI crawler log rejected", { status: 400 }]);
    outcome = "network";
    await visit("/blog/example");
    assert.equal(warnings.length, 2);
    assert.doesNotMatch(JSON.stringify(warnings), /synthetic-test-credential|synthetic\.invalid/);
  } finally {
    globalThis.fetch = previousFetch;
    console.warn = previousWarn;
    if (oldUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = oldKey;
  }
});
