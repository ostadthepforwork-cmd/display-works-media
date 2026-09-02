import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(import.meta.dirname, "../src/app/admin/expenses/ExpensePage.tsx"), "utf8");

test("expense UI contains the required editor, filters, and optional links", () => {
  for (const label of [
    "ค่าใช้จ่ายจริง", "ทุกหมวด", "Direct", "Operating", "ยังไม่ชำระ", "ชำระแล้ว",
    "Supplier", "ลูกค้า", "เอกสาร", "หัก ณ ที่จ่าย", "หลักฐาน",
  ]) assert.match(source, new RegExp(label));
  assert.match(source, /ไม่เชื่อมโยง/);
  assert.match(source, /sourceDocumentId/);
  assert.match(source, /setCategoryDefaultClass/);
});

test("expense UI handles revision conflict, archive, void, and evidence queue", () => {
  assert.match(source, /REVISION_CONFLICT/);
  assert.match(source, /saveInFlight/);
  assert.match(source, /transitionExpense/);
  assert.match(source, /voidReason/);
  assert.match(source, /evidenceQueue/);
  assert.match(source, /บันทึกค่าใช้จ่ายแล้ว แต่แนบหลักฐานไม่สำเร็จ/);
});

test("expense UI does not calculate profitability or import document estimates", () => {
  assert.doesNotMatch(source, /internal_expenses|internalExpenses/);
  assert.doesNotMatch(source, /grossProfit|operatingProfit|ROAS|Meta Ads/);
  assert.doesNotMatch(source, /service.role|SUPABASE_SERVICE_ROLE_KEY/i);
});
