import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("A4 preview uses paged media and only clones sanitized customer HTML", () => {
  const source = readFileSync("src/lib/document-preview.ts", "utf8");
  assert.match(source, /await import\("pagedjs"\)/);
  assert.match(source, /size: A4 portrait/);
  assert.match(source, /await document.fonts.ready/);
  assert.match(source, /source.cloneNode\(true\)/);
  assert.doesNotMatch(source, /supabase|localStorage|service_role/);
  assert.match(source, /chunker.destroy\(\)/);
  assert.match(source, /polisher.destroy\(\)/);
  const config = readFileSync("next.config.ts", "utf8");
  assert.match(config, /pagedjs\/dist\/paged\.js/);
  assert.match(source, /footer\?\.remove\(\)/);
  assert.match(source, /sheets.forEach/);
  assert.match(source, /footer.cloneNode\(true\)/);
  assert.match(source, /sheet.appendChild\(repeatedFooter\)/);
  assert.match(source, /header\?\.remove\(\)/);
  assert.match(source, /header.cloneNode\(true\)/);
  assert.match(source, /sheet.appendChild\(repeatedHeader\)/);
});

test("print waits for pagination and ERP preview opens the same public renderer", () => {
  const actions = readFileSync("src/app/doc/[id]/DocActions.tsx", "utf8");
  assert.match(actions, /await previewReadyRef.current/);
  const admin = readFileSync("src/app/admin/page.tsx", "utf8");
  const preview = admin.slice(admin.indexOf("const previewDocumentPdf"), admin.indexOf("const [emailModal"));
  assert.match(preview, /publicDocumentUrl/);
  assert.doesNotMatch(preview, /printDocument\(/);
  const print = admin.slice(admin.indexOf("function printDocument("), admin.indexOf("doc = sanitizeForPrint(doc)"));
  assert.match(print, /publicDocumentUrl/);
  assert.match(print, /searchParams.set\("print", "1"\)/);
});
