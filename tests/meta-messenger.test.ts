import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { extractMessengerReferrals, verifyMetaSignature } from "../src/lib/meta-messenger";

test("Messenger webhook signature is verified before parsing", () => {
  const body = JSON.stringify({ object: "page" });
  const secret = "synthetic-test-secret";
  const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  assert.equal(verifyMetaSignature(body, signature, secret), true);
  assert.equal(verifyMetaSignature(`${body}x`, signature, secret), false);
  assert.equal(verifyMetaSignature(body, `${signature}zz`, secret), false);
  assert.equal(verifyMetaSignature(body, signature.slice(0,-1), secret), false);
});

test("Messenger excludes echoes and delivery/read notifications from new leads", () => {
  const rows=extractMessengerReferrals({entry:[{messaging:[
    {sender:{id:'page-id'},message:{mid:'echo-1',is_echo:true,text:'QA outbound'}},
    {sender:{id:'test-user'},delivery:{mids:['delivered-1']}},
    {sender:{id:'test-user'},read:{watermark:123}},
    {sender:{id:'test-user'},timestamp:'invalid',message:{mid:'invalid-time'}},
    {sender:{id:'test-user'},timestamp:1789000000000,message:{mid:'incoming-1',text:'QA TEST Display Works'}},
  ]}]},'synthetic-secret');
  assert.equal(rows.length,1);
  assert.equal(rows[0].eventReference,'incoming-1');
  assert.equal(rows[0].adId,null);
  assert.equal(JSON.stringify(rows).includes('QA TEST Display Works'),false);
});

test("duplicate conversation events produce one stable hashed conversation key", () => {
  const payload = { entry: [{ messaging: [
    { sender: { id: "synthetic-psid" }, timestamp: 1_789_000_000_000, message: { mid: "m-1", referral: { ad_id: "ad-7", ref: "ref-7" }, text: "must not persist" } },
    { sender: { id: "synthetic-psid" }, timestamp: 1_789_000_001_000, message: { mid: "m-2", referral: { ad_id: "ad-7" }, text: "must not persist" } },
  ] }] };
  const rows = extractMessengerReferrals(payload, "synthetic-secret");
  assert.equal(rows.length, 2);
  assert.equal(new Set(rows.map((row) => row.conversationId)).size, 1);
  assert.equal(new Set(rows.map((row) => row.eventReference)).size, 2);
  assert.equal(JSON.stringify(rows).includes("must not persist"), false);
  assert.equal(rows[0].adId, "ad-7");
});
