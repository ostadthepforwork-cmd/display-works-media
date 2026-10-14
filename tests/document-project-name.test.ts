import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync("src/app/admin/page.tsx", "utf8");

test("document lists show the saved job name on desktop and mobile", () => {
  assert.match(source, /"เลขที่เอกสาร", "ลูกค้า", "ชื่องาน", "วันที่"/);
  assert.match(source, /className="doc-project"[^\n]*\{doc.projectName \|\| "-"\}/);
  assert.match(source, /className="doc-project-name"[^\n]*ชื่องาน: \{doc.projectName \|\| "-"\}/);
  assert.match(source, /\[d.docNo, d.customerName, d.projectName\]/);
});

test("job names use the existing project field and wrap without hiding text", () => {
  assert.match(source, /projectName: d.project_name/);
  assert.match(source, /project_name: doc.projectName/);
  const project = source.match(/<td className="doc-project"[^\n]*/)?.[0] || "";
  assert.match(project, /overflowWrap: "anywhere"/);
  assert.doesNotMatch(project, /ellipsis|nowrap|overflow: "hidden"/);
});
