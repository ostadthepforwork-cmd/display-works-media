import test from "node:test";
import assert from "node:assert/strict";
import { POST } from "../src/app/api/admin/login/route";

test("login rejects malformed bodies and credential types before contacting auth", async () => {
  for (const body of ["null", "[]", "false", "{", JSON.stringify({ email: {}, password: "test" }), JSON.stringify({ access_token: 123, refresh_token: "test" }), JSON.stringify({ email: "fixture@example.invalid", password: "fixture-password", remember: "yes" })]) {
    const response = await POST(new Request("http://localhost/api/admin/login", {
      method: "POST", headers: { "Content-Type": "application/json" }, body,
    }));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).success, false);
  }
});
