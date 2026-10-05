import test from "node:test";
import assert from "node:assert/strict";
import { isSensitiveProbePath } from "../src/lib/sensitive-paths";

test("password recovery is reachable without allowing secret-file probes", () => {
  for (const path of ["/reset-password", "/reset-password/", "/reset-password?code=fixture"]) {
    assert.equal(isSensitiveProbePath(path), false, path);
  }
  for (const path of ["/reset-password/secret", "/reset-password.bak", "/password.txt", "/secrets", "/.env", "/.git/config", "/backup/database.sql"]) {
    assert.equal(isSensitiveProbePath(path), true, path);
  }
});
