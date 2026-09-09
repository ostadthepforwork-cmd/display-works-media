import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { expenseTotal, isCompleteResult } from "../src/lib/expense-inspection";

test("completeness fails closed for missing count and capped responses", () => {
  assert.equal(isCompleteResult(0, null), false);
  assert.equal(isCompleteResult(1000, 1001), false);
  assert.equal(isCompleteResult(0, 0), true);
});
test("totals use exact cents and only supplied drilldown rows", () => {
  assert.equal(expenseTotal([{ total_amount: "0.10" }, { total_amount: "0.20" }]), "0.30");
  assert.equal(expenseTotal([{ total_amount: "5000" }, { total_amount: "2000" }]), "7000.00");
  assert.equal(expenseTotal([]), "0.00");
});
test("unknown or malformed money is not silently treated as zero", () => {
  for (const value of [null, undefined, "NaN", "1.234", -1]) assert.equal(expenseTotal([{ total_amount: value }]), null);
  assert.equal(expenseTotal([{ total_amount: 0 }]), "0.00");
});

test("history is read-only, expense-scoped, and guards late responses", () => {
  const source = readFileSync(new URL("../src/app/admin/expenses/ExpenseHistory.tsx", import.meta.url), "utf8");
  assert.match(source, /eq\("expense_id", expenseId\)/);
  assert.match(source, /active = false/);
  assert.match(source, /count ===/);
  assert.doesNotMatch(source, /\.insert\(|\.update\(|\.delete\(|dangerouslySetInnerHTML/);
});
