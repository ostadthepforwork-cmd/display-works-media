import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const pageSource = readFileSync("src/app/doc/[id]/page.tsx", "utf8");
const actionsSource = readFileSync("src/app/doc/[id]/DocActions.tsx", "utf8");
const cssSource = readFileSync("src/app/doc/[id]/document.css", "utf8");
const adminSource = readFileSync("src/app/admin/page.tsx", "utf8");

test("public document reads use explicit customer-facing allowlists", () => {
  const pageBody = pageSource.slice(pageSource.indexOf("export default async function PublicDocumentPage"));
  const chainBody = pageSource.slice(pageSource.indexOf("async function loadDocumentChain"), pageSource.indexOf("export default async function PublicDocumentPage"));

  assert.doesNotMatch(pageBody, /\.select\("\*"\)/);
  assert.doesNotMatch(chainBody, /\.select\("\*"\)/);
  assert.match(pageBody, /select\(PUBLIC_DOCUMENT_FIELDS\)/);
  assert.match(pageBody, /select\(PUBLIC_ITEM_FIELDS\)/);
  assert.match(pageBody, /select\(PUBLIC_COMPANY_FIELDS\)/);
  assert.match(pageBody, /select\(PUBLIC_CUSTOMER_FIELDS\)/);
  assert.match(chainBody, /select\(PUBLIC_SOURCE_FIELDS\)/);
});

test("public item DTO never includes internal cost or supplier fields", () => {
  const itemFields = pageSource.slice(pageSource.indexOf("const PUBLIC_ITEM_FIELDS"), pageSource.indexOf("const PUBLIC_COMPANY_FIELDS"));
  const mapper = pageSource.slice(pageSource.indexOf("function mapDocument"), pageSource.indexOf("async function loadDocumentChain"));
  const forbidden = ["cost_unit", "cost_snapshot", "supplier_name", "internal_expenses", "profit", "margin"];

  for (const field of forbidden) {
    assert.equal(itemFields.includes(field), false, `${field} must not be selected for a public document`);
    assert.equal(mapper.includes(field), false, `${field} must not be mapped into a public document`);
  }
});

test("free-text fields remove internal cost and margin lines before rendering", () => {
  assert.match(pageSource, /INTERNAL_ONLY_TEXT_PATTERN/);
  assert.match(pageSource, /ต้นทุน\|ราคาทุน\|กำไร\|ผู้จำหน่าย\|supplier/);
  assert.match(pageSource, /paymentNote: customerFacingText\(doc\.payment_note\)/);
  assert.match(pageSource, /depositNote: customerFacingText\(doc\.deposit_note\)/);
  assert.match(pageSource, /notes: customerFacingText\(doc\.notes\)/);
  assert.match(pageSource, /name: customerFacingText\(item\.name\)/);
  assert.match(pageSource, /detail: customerFacingText\(item\.detail\)/);
  assert.match(adminSource, /INTERNAL_ONLY_DOCUMENT_TEXT_PATTERN/);
  assert.match(adminSource, /const publicDepositNote = customerFacingText\(depositNote\)/);
  assert.match(adminSource, /const publicNotes = customerFacingText\(doc\.notes\)/);
});

test("sharing strips transient query parameters and PDF action describes native print flow", () => {
  assert.match(actionsSource, /window\.location\.origin\}\$\{window\.location\.pathname/);
  assert.doesNotMatch(actionsSource, /window\.location\.href/);
  assert.match(actionsSource, /พิมพ์ \/ PDF/);
  assert.match(actionsSource, /เลือก Save as PDF หรือบันทึกลงเครื่องจากหน้าต่างพิมพ์/);
});

test("screen preview scaling cannot affect A4 print output", () => {
  assert.match(cssSource, /@media \(min-width: 821px\)[\s\S]*?--doc-desktop-scale/);
  assert.match(cssSource, /@media print[\s\S]*?transform: none !important/);
  assert.match(cssSource, /@page\s*\{[\s\S]*?size: A4 portrait/);
});
