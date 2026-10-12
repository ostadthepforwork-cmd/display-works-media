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
}
