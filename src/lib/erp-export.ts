export type ErpExportTable = Record<string, unknown>[];

export type ErpBackupTables = {
  company: ErpExportTable;
  customers: ErpExportTable;
  products: ErpExportTable;
  suppliers: ErpExportTable;
  documents: ErpExportTable;
  documentItems: ErpExportTable;
  expenseCategories: ErpExportTable;
  expenses: ErpExportTable;
  expenseAttachments: ErpExportTable;
  expenseEvents: ErpExportTable;
};

const CSV_FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function csvCell(value: unknown) {
  if (value === null || value === undefined) return '""';
  const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
  const protectedValue = typeof value === 'string' && CSV_FORMULA_PREFIX.test(serialized) ? `'${serialized}` : serialized;
  return `"${protectedValue.replace(/"/g, '""')}"`;
}

export function csvFile(headers: string[], rows: unknown[][]) {
  return `\uFEFF${[headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

function text(value: unknown) {
  return value === null || value === undefined ? '' : String(value);
}

export function documentAnalysisRows(tables: Pick<ErpBackupTables, 'documents' | 'documentItems'>) {
  const itemsByDocument = new Map<string, ErpExportTable>();
  for (const item of tables.documentItems) {
    const id = text(item.document_id);
    itemsByDocument.set(id, [...(itemsByDocument.get(id) || []), item]);
  }
  return tables.documents.flatMap(document => {
    const items = itemsByDocument.get(text(document.id)) || [{}];
    return items.map(item => [
      document.doc_no, document.type, document.status, document.date, document.due_date,
      document.customer_name, document.project_name, document.sales_person,
      document.discount, document.discount_type, document.vat, document.vat_rate,
      document.payment_status, document.payment_amount, document.deposit_paid,
      item.name, item.sub_title, item.qty, item.unit, item.price, item.cost_snapshot,
      item.width_m, item.height_m, item.pieces, item.price_unit, item.cost_unit,
      document.deleted, document.created_at, document.updated_at,
    ]);
  });
}

export const DOCUMENT_HEADERS = [
  'เลขที่เอกสาร', 'ประเภท', 'สถานะ', 'วันที่', 'วันครบกำหนด', 'ลูกค้า', 'โครงการ', 'ผู้ขายงาน',
  'ส่วนลด', 'รูปแบบส่วนลด', 'VAT', 'อัตรา VAT', 'สถานะชำระเงิน', 'ยอดชำระ', 'เงินมัดจำ',
  'รายการ', 'รายละเอียดรอง', 'จำนวน', 'หน่วย', 'ราคาต่อหน่วย', 'ต้นทุนต่อหน่วย', 'กว้างเมตร',
  'สูงเมตร', 'จำนวนชิ้น', 'ฐานราคา', 'ฐานต้นทุน', 'ลบแล้ว', 'สร้างเมื่อ', 'แก้ไขเมื่อ',
];

export function expenseAnalysisRows(tables: Pick<ErpBackupTables, 'expenses' | 'expenseCategories' | 'suppliers' | 'customers' | 'documents'>) {
  const categories = new Map(tables.expenseCategories.map(row => [text(row.id), text(row.name)]));
  const suppliers = new Map(tables.suppliers.map(row => [text(row.id), text(row.name)]));
  const customers = new Map(tables.customers.map(row => [text(row.id), text(row.name)]));
  const documents = new Map(tables.documents.map(row => [text(row.id), text(row.doc_no)]));
  return tables.expenses.map(row => [
    row.expense_no, row.expense_date, categories.get(text(row.category_id)) || '', row.expense_class,
    row.description, row.amount, row.vat_amount, row.withholding_amount, row.total_amount,
    row.payment_status, row.paid_at, suppliers.get(text(row.supplier_id)) || '',
    customers.get(text(row.customer_id)) || '', documents.get(text(row.source_document_id)) || '',
    row.reference, row.notes, Boolean(row.archived_at), Boolean(row.voided_at), row.void_reason,
    row.created_at, row.updated_at,
  ]);
}

export const EXPENSE_HEADERS = [
  'เลขที่ค่าใช้จ่าย', 'วันที่', 'หมวด', 'ประเภทต้นทุน', 'รายละเอียด', 'ยอดก่อน VAT', 'VAT',
  'หัก ณ ที่จ่าย', 'ยอดรวม', 'สถานะชำระ', 'วันที่ชำระ', 'ผู้ขาย', 'ลูกค้า', 'เอกสารอ้างอิง',
  'เลขอ้างอิง', 'หมายเหตุ', 'เก็บถาวร', 'ยกเลิก', 'เหตุผลยกเลิก', 'สร้างเมื่อ', 'แก้ไขเมื่อ',
];

export function tableRows(rows: ErpExportTable, columns: Array<[string, string]>) {
  return rows.map(row => columns.map(([, key]) => row[key]));
}

export async function createBackupFile(tables: ErpBackupTables, exportedAt = new Date().toISOString()) {
  const payload = {
    format: 'display-works-erp-backup',
    version: 1,
    exportedAt,
    attachmentFilesIncluded: false,
    attachmentNote: 'Expense evidence metadata is included; binary files remain in protected storage.',
    counts: Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, rows.length])),
    tables,
  };
  const body = JSON.stringify(payload);
  const digest = globalThis.crypto?.subtle
    ? Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(body))))
      .map(byte => byte.toString(16).padStart(2, '0')).join('')
    : null;
  return JSON.stringify({ ...payload, sha256: digest }, null, 2);
}
