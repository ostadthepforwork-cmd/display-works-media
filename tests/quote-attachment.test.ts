import test from "node:test";
import assert from "node:assert/strict";
import { MAX_QUOTE_ATTACHMENT_BYTES, validateQuoteAttachment } from "../src/lib/quote-attachment";

const encode = (text: string) => new TextEncoder().encode(text);
const check = (name: string, bytes: Uint8Array, size = bytes.length) => validateQuoteAttachment({ name, bytes, size });

test("quote artwork accepts supported signatures and derives storage MIME from content", () => {
  assert.deepEqual(check("art.PDF", encode("%PDF-1.7")), { ok: true, mimeType: "application/pdf" });
  assert.deepEqual(check("art.ai", encode("%PDF-1.7")), { ok: true, mimeType: "application/pdf" });
  assert.deepEqual(check("art.ai", encode("%!PS-Adobe-3.0\n%%Creator: Adobe Illustrator")), { ok: true, mimeType: "application/postscript" });
  assert.equal(check("art.png", new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])).ok, true);
  assert.equal(check("art.jpeg", new Uint8Array([255, 216, 255])).ok, true);
  assert.deepEqual(check("art.psd", new Uint8Array([56, 66, 80, 83, 0, 1, 0, 0, 0, 0, 0, 0])), {ok:true,mimeType:"application/octet-stream"});
});

test("quote artwork rejects spoofed, unsupported, empty and oversized files", () => {
  for (const name of ["art.pdf", "art.ai", "art.psd", "art.png", "art.jpg", "art.jpeg", "art.svg", "art.exe", "art.__proto__"]) {
    assert.equal(check(name, encode("<html>not artwork</html>")).ok, false, name);
  }
  assert.equal(check("art.ai", encode("%!PS-Adobe-3.0\nnot Illustrator")).ok, false);
  assert.equal(check("art.png", new Uint8Array([137, 80])).ok, false);
  assert.equal(check("art.pdf", encode("%PDF-1.7"), 0).ok, false);
  assert.equal(check("art.pdf", encode("%PDF-1.7"), MAX_QUOTE_ATTACHMENT_BYTES + 1).ok, false);
});
