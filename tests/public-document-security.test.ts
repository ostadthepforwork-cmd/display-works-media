import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const pageSource = readFileSync("src/app/doc/[id]/page.tsx", "utf8");
const actionsSource = readFileSync("src/app/doc/[id]/DocActions.tsx", "utf8");
const cssSource = readFileSync("src/app/doc/[id]/document.css", "utf8");
const adminSource = readFileSync("src/app/admin/page.tsx", "utf8");

test("document accents use the requested brand orange on screen and print", () => {
  assert.doesNotMatch(cssSource, /#(?:c64f00|ff5500)/i);
  assert.match(cssSource, /\.doc-summary-total\s*\{[^}]*background: #FF6B00;/);
  assert.match(cssSource, /\.doc-summary-total\s*\{[^}]*background: #FF6B00 !important;/);
  assert.doesNotMatch(adminSource, /#FF5500/i);
});

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

test("internal-text guards reject database-style cost labels and English profit", () => {
  for (const source of [pageSource, adminSource]) {
    const literal = source.match(/const INTERNAL_ONLY_(?:DOCUMENT_)?TEXT_PATTERN = (\/.*\/i);/);
    assert.ok(literal);
    const pattern = new RegExp(literal[1].slice(1, -2), 'i');
    for (const text of ['cost_snapshot PRIVATE', 'cost_price PRIVATE', 'cost_unit PRIVATE', 'unit_cost PRIVATE', 'internal_expenses PRIVATE', 'profit PRIVATE', 'margin PRIVATE', 'ต้นทุน PRIVATE']) {
      assert.ok(pattern.test(text), `Internal line escaped the guard: ${text}`);
    }
    assert.equal(pattern.test('Customer requested delivery tomorrow'), false);
  }
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
  assert.match(cssSource, /@page\s*\{[^}]*margin: 12mm 12mm 15mm/);
  assert.match(cssSource, /@media print[\s\S]*?html\[data-doc-printing="true"\] \.doc-a4,/);
});

test("document accents cannot be overridden with the old dark orange", () => {
  assert.doesNotMatch(cssSource, /#b94700\s*!?\s*(?:important)?\s*\}/i);
  assert.doesNotMatch(pageSource, /#ff5500/i);
});

test("document spacing follows toolbar height when status text wraps", () => {
  assert.match(actionsSource, /new ResizeObserver\(updateToolbarHeight\)/);
  assert.match(actionsSource, /observer\.disconnect\(\)/);
  assert.match(cssSource, /padding: calc\(var\(--doc-toolbar-height, 98px\) \+ 12px\)/);
});
