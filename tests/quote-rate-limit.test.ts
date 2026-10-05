import test from "node:test";
import assert from "node:assert/strict";
import { consumeQuoteRateLimit } from "../src/lib/quote-rate-limit";

test("shared quota hashes identifiers, handles limits, and fails closed without process-local fallback", async t => {
  const oldUrl=process.env.NEXT_PUBLIC_SUPABASE_URL, oldKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL="https://quota-test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY="synthetic-server-only";
  t.after(()=>{
    if(oldUrl===undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL=oldUrl;
    if(oldKey===undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY=oldKey;
  });
  let hash="";
  const upstream: typeof fetch = async (_url, init) => {
    const body=JSON.parse(String(init?.body));
    assert.match(body.p_key_hash,/^[0-9a-f]{64}$/);
    assert.equal(String(init?.body).includes("192.0.2.1"),false);
    if(hash) assert.equal(body.p_key_hash,hash); hash=body.p_key_hash;
    return Response.json({allowed:true,retry_after:600});
  };
  assert.equal((await consumeQuoteRateLimit("192.0.2.1",upstream)).state,"allowed");
  assert.equal((await consumeQuoteRateLimit("192.0.2.1",upstream)).state,"allowed");
  assert.deepEqual(await consumeQuoteRateLimit("192.0.2.1",async()=>Response.json({allowed:false,retry_after:123})),{state:"limited",retryAfter:123});
  assert.equal((await consumeQuoteRateLimit("192.0.2.1",async()=>Response.json({}, {status:503}))).state,"unavailable");
  assert.equal((await consumeQuoteRateLimit("192.0.2.1",async()=>Response.json({allowed:true}))).state,"unavailable");
  assert.equal((await consumeQuoteRateLimit("192.0.2.1",async()=>{throw new Error("offline");})).state,"unavailable");
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert.equal((await consumeQuoteRateLimit("192.0.2.1",upstream)).state,"unavailable");
});
