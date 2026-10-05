import test from "node:test";
import assert from "node:assert/strict";
import { authCookieOptions } from "../src/lib/auth-cookie-options";

test("session-only choice survives browser and server refresh without removing deletion cookies", () => {
  const original = { path: "/", sameSite: "lax" as const, maxAge: 3600, expires: new Date("2030-01-01") };
  const session = authCookieOptions(original, "0", "token");
  assert.equal(session.maxAge,undefined); assert.equal(session.expires,undefined);
  assert.equal(session.path,"/"); assert.equal(session.sameSite,"lax");
  assert.equal(authCookieOptions(original,"1","token"),original);
  assert.equal(authCookieOptions(original,undefined,"token"),original);
  assert.equal(authCookieOptions({...original,maxAge:0},"0","").maxAge,0);
});
