import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { serializeJsonLd } from "../src/lib/json-ld";

test("serializes hostile JSON-LD without escaping the script context", () => {
  const input = {
    title: "</script><script>alert('xss')</script>",
    text: "A&B > C < D\u2028line\u2029paragraph",
    nested: ["ภาษาไทย", { ok: true }],
  };
  const serialized = serializeJsonLd(input);

  assert.equal(serialized.includes("</script"), false);
  assert.equal(serialized.includes("<"), false);
  assert.equal(serialized.includes(">"), false);
  assert.equal(serialized.includes("&"), false);
  assert.equal(serialized.includes("\u2028"), false);
  assert.equal(serialized.includes("\u2029"), false);
  assert.deepEqual(JSON.parse(serialized), input);
});

test("all reviewed JSON-LD script sinks use the shared serializer", async () => {
  const files = [
    "src/components/SchemaOrg.tsx",
    "src/components/Reviews.tsx",
    "src/app/blog/[slug]/BlogPostClient.tsx",
    "src/app/faq/page.tsx",
  ];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    assert.match(source, /serializeJsonLd/);
    assert.doesNotMatch(source, /dangerouslySetInnerHTML[^\n]*JSON\.stringify/);
  }
});
