import test from "node:test";
import assert from "node:assert/strict";
import {
  EXPENSE_EVIDENCE_BUCKET,
  MAX_EXPENSE_EVIDENCE_BYTES,
  validateExpenseAttachment,
} from "../src/lib/expense-attachment";

test("accepts reviewed PDF, JPEG, and PNG signatures", () => {
  const fixtures = [
    { name: "receipt.pdf", type: "application/pdf", bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]) },
    { name: "receipt.jpg", type: "image/jpeg", bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xe0]) },
    { name: "receipt.png", type: "image/png", bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  ];
  fixtures.forEach((fixture) => assert.equal(validateExpenseAttachment({ ...fixture, size: fixture.bytes.length }).ok, true));
  assert.equal(EXPENSE_EVIDENCE_BUCKET, "erp-expense-evidence");
});

test("rejects SVG, MIME spoofing, invalid signatures, empty, and oversized evidence", () => {
  const svg = new TextEncoder().encode("<svg><script>alert(1)</script></svg>");
  assert.deepEqual(validateExpenseAttachment({ name: "receipt.svg", type: "image/svg+xml", size: svg.length, bytes: svg }), { ok: false, code: "FILE_TYPE_NOT_ALLOWED" });
  assert.deepEqual(validateExpenseAttachment({ name: "receipt.pdf", type: "text/html", size: 5, bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]) }), { ok: false, code: "MIME_MISMATCH" });
  assert.deepEqual(validateExpenseAttachment({ name: "receipt.pdf", type: "application/pdf", size: 5, bytes: new Uint8Array(5) }), { ok: false, code: "INVALID_FILE_SIGNATURE" });
  assert.deepEqual(validateExpenseAttachment({ name: "receipt.pdf", type: "application/pdf", size: 0, bytes: new Uint8Array() }), { ok: false, code: "EMPTY_FILE" });
  assert.deepEqual(validateExpenseAttachment({ name: "receipt.pdf", type: "application/pdf", size: MAX_EXPENSE_EVIDENCE_BYTES + 1, bytes: new Uint8Array([0x25]) }), { ok: false, code: "FILE_TOO_LARGE" });
});
