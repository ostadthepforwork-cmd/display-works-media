import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/quote/route";

test("quote rejects malformed JSON bodies before database and notification side effects", async () => {
  for (const body of ["null", "[]", "false", "{"]) {
    const response = await POST(new NextRequest("http://localhost/api/quote", {
      method: "POST", headers: { "Content-Type": "application/json" }, body,
    }));
    assert.equal(response.status, 400);
  }
});

test("quote rejects spoofed artwork before creating a database client", async () => {
  const form = new FormData();
  form.set("name", "QA");
  form.set("phone", "0800000000");
  form.set("serviceType", "Print");
  form.set("artwork", new File(["<html>spoofed</html>"], "art.pdf", { type: "application/pdf" }));
  const response = await POST(new NextRequest("http://localhost/api/quote", {
    method: "POST", headers: { "x-real-ip": "quote-spoof-test" }, body: form,
  }));
  assert.equal(response.status, 400);
});
