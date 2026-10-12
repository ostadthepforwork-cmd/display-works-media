import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

for (const path of ["src/app/admin/page.tsx", "src/app/doc/[id]/page.tsx"]) {
  const source = readFileSync(path, "utf8");
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const names = new Set(["docDepositInfo", "resolveDepositInfo", "calcDocTotal"]);
  const declarations = ast.statements.filter(node => {
    if (ts.isFunctionDeclaration(node)) return !!node.name && names.has(node.name.text);
    return ts.isVariableStatement(node) && node.declarationList.declarations.some(d => ts.isIdentifier(d.name) && names.has(d.name.text));
  });
  assert.equal(declarations.length, 3);
  const js = ts.transpileModule(declarations.map(node => node.getText(ast)).join("\n"), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const calculate = runInNewContext(`${js}\ncalcDocTotal`, {
    lineAmount: (item: { qty: number; price: number }) => item.qty * item.price,
    docVatRate: () => 7,
  });
  const base = { id: "quote", items: [{ qty: 1, price: 1000 }], vat: false, wht: false };

  test(`${path}: notes and payment descriptions never imply money received`, () => {
    for (const field of ["notes", "depositNote", "deposit_note", "paymentNote", "payment_note"]) {
      for (const text of ["มัดจำ 50% ก่อนเริ่มงาน", "มัดจำ 500 บาท", "deposit 50%", "ยังไม่ได้รับมัดจำ 500 บาท"]) {
        const result = calculate({ ...base, [field]: text });
        assert.equal(result.depositPaid, 0);
        assert.equal(result.balanceDue, 1000);
        assert.equal(result.paymentStatus, "unpaid");
      }
    }
    assert.equal(source.includes("parseDepositFromText"), false);
  });

  test(`${path}: explicit partial and full payments still determine balances`, () => {
    for (const field of ["paymentAmount", "payment_amount", "depositPaid", "deposit_paid"]) {
      const result = calculate({ ...base, [field]: 400, notes: "มัดจำ 90%" });
      assert.equal(result.depositPaid, 400);
      assert.equal(result.balanceDue, 600);
      assert.equal(result.paymentStatus, "partial_paid");
    }
    const full = calculate({ ...base, paymentAmount: 1000 });
    assert.equal(full.balanceDue, 0);
    assert.equal(full.paymentStatus, "paid");
  });

  test(`${path}: linked document payments remain supported without parsing notes`, () => {
    const result = calculate({ ...base, orderId: "source" }, [{ id: "source", paymentAmount: 300, paymentType: "deposit" }]);
    assert.equal(result.depositPaid, 300);
    assert.equal(result.balanceDue, 700);
    const notesOnly = calculate({ ...base, orderId: "source" }, [{ id: "source", notes: "มัดจำ 50%" }]);
    assert.equal(notesOnly.depositPaid, 0);
  });

  test(`${path}: clearing both payment fields leaves notes as conditions only`, () => {
    const result = calculate({ ...base, items: [{ qty: 1, price: 17964 }], wht: true, whtRate: 3, paymentAmount: 0, depositPaid: 0, notes: "ชำระเงินมัดจำ 50% ก่อนเริ่มดำเนินการผลิต" });
    assert.equal(result.depositPaid, 0);
    assert.equal(result.netPay, 17425.08);
    assert.equal(result.balanceDue, 17425.08);
  });
}

test("ERP shadow cannot replace a database zero with a stale payment", () => {
  const source = readFileSync("src/app/admin/page.tsx", "utf8");
  const ast = ts.createSourceFile("admin.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const fn = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "applyErpDocumentShadow")!;
  const js = ts.transpileModule(fn.getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const apply = runInNewContext(`${js}\napplyErpDocumentShadow`, {
    loadErpDocumentShadow: () => ({ quote: { paymentAmount: 8712.54, depositPaid: 8712.54 } }),
    normalizeInternalExpenses: (value: unknown) => value,
  });
  const result = apply({ id: "quote", paymentAmount: 0, depositPaid: 0 });
  assert.equal(result.paymentAmount, 0);
  assert.equal(result.depositPaid, 0);
  assert.equal(apply({ id: "quote" }).paymentAmount, 8712.54);
});

test("deposit editor displays and updates both explicit payment fields", () => {
  const source = readFileSync("src/app/admin/page.tsx", "utf8");
  const form = source.slice(source.indexOf("function DocForm("));
  assert.match(form, /paymentAmount: docDepositInfo\(baseDoc\).depositPaid/);
  assert.match(form, /depositPaid: docDepositInfo\(baseDoc\).depositPaid/);
  const field = form.slice(form.indexOf('label="เงินมัดจำที่ลูกค้าชำระแล้ว"'), form.indexOf('label="วันที่รับมัดจำ"'));
  assert.match(field, /depositPaid: value, paymentAmount: value/);
});
