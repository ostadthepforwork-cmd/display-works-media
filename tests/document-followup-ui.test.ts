import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/app/admin/page.tsx", "utf8");
test("quotation follow-up includes receipt for both shared menu renderers", () => {
  const options = source.slice(source.indexOf("const DOC_NEXT:"), source.indexOf("const createFrom ="));
  const quote = options.slice(options.indexOf("quote:"), options.indexOf("bill: "));
  assert.match(quote, /type: "receipt", label: "สร้างใบเสร็จรับเงิน"/);
  assert.equal((source.match(/DOC_NEXT\[normalizeDocumentTypeForUi\(doc.type\)\].*\.map/g) || []).length, 2);
});
test("follow-up editor uses target type without automatically saving", () => {
  assert.match(source, /<DocForm doc=\{editing\} type=\{editing.type \|\| type\}/);
  assert.match(source, /getDocTypeMeta\(editing.type \|\| type\)\?\.label/);
  const create = source.slice(source.indexOf("const createFrom ="), source.indexOf("// ── Dropdown state"));
  assert.match(create, /type: targetType/);
  assert.match(create, /orderId: srcDoc.id/);
  assert.match(create, /status: "draft"/);
  assert.match(create, /setEditing\(newDoc\)/);
  assert.doesNotMatch(create, /await|\.insert\(|\.rpc\(/);
});
