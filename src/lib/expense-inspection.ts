export function isCompleteResult(received: number, count: number | null) {
  return count !== null && received === count;
}

export function expenseTotal(rows: ReadonlyArray<{ total_amount?: unknown }>): string | null {
  let cents = BigInt(0);
  for (const row of rows) {
    const value = String(row.total_amount ?? "");
    if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
    const [whole, fraction = ""] = value.split(".");
    cents += BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
  }
  return `${cents / BigInt(100)}.${String(cents % BigInt(100)).padStart(2, "0")}`;
}

export function formatExpenseTotal(value: string) {
  const [whole, fraction] = value.split(".");
  return `${BigInt(whole).toLocaleString("th-TH")}.${fraction}`;
}

const historyFields: Record<string, string> = {
  expense_date: "วันที่ค่าใช้จ่าย", description: "รายละเอียด", amount: "ยอดก่อน VAT",
  vat_amount: "VAT", total_amount: "ยอดรวม", withholding_amount: "หัก ณ ที่จ่าย",
  payment_status: "สถานะชำระ", paid_at: "วันที่ชำระ", expense_class: "ประเภท",
  category_id: "รหัสหมวด", supplier_id: "รหัสผู้ขาย", customer_id: "รหัสลูกค้า",
  source_document_id: "รหัสเอกสาร", reference: "อ้างอิง", notes: "หมายเหตุ",
  archived_at: "เก็บถาวรเมื่อ", voided_at: "ยกเลิกเมื่อ", void_reason: "เหตุผลยกเลิก",
  original_filename: "ชื่อไฟล์", revision: "เวอร์ชัน",
};

function snapshot(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function historyValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "ไม่ได้ระบุ";
  const translated: Record<string, string> = { paid: "ชำระแล้ว", unpaid: "ยังไม่ชำระ", operating: "ค่าใช้จ่ายดำเนินงาน", direct: "ต้นทุนตรง" };
  return translated[String(value)] || String(value);
}

export function expenseChanges(before: unknown, after: unknown) {
  const previous = snapshot(before), next = snapshot(after);
  return Object.entries(historyFields).filter(([key]) =>
    (key in previous || key in next) && JSON.stringify(previous[key] ?? null) !== JSON.stringify(next[key] ?? null)
  ).map(([key, label]) => ({ key, label, before: historyValue(previous[key]), after: historyValue(next[key]) }));
}
