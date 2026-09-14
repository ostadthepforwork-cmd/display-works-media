import assert from 'node:assert/strict';
import test from 'node:test';
import { createBackupFile, csvFile, documentAnalysisRows, expenseAnalysisRows } from '../src/lib/erp-export';

test('CSV is Excel-compatible and neutralizes formula cells', () => {
  const csv = csvFile(['name', 'value'], [['normal', '=HYPERLINK("bad")'], ['dash', '-SUM(1,2)'], ['ไทย', -12]]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /"'=HYPERLINK\(""bad""\)"/);
  assert.match(csv, /"'-SUM\(1,2\)"/);
  assert.match(csv, /"ไทย","-12"/);
});

test('document export keeps documents with and without line items', () => {
  const rows = documentAnalysisRows({
    documents: [{ id: 'd1', doc_no: 'QT-1' }, { id: 'd2', doc_no: 'QT-2' }],
    documentItems: [{ id: 'i1', document_id: 'd1', name: 'ป้าย' }, { id: 'i2', document_id: 'd1', name: 'ติดตั้ง' }],
  });
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map(row => row[0]), ['QT-1', 'QT-1', 'QT-2']);
});

test('expense export resolves readable relation names', () => {
  const rows = expenseAnalysisRows({
    expenses: [{ expense_no: 'EXP-1', category_id: 'c1', supplier_id: 's1', customer_id: 'u1', source_document_id: 'd1' }],
    expenseCategories: [{ id: 'c1', name: 'โฆษณา' }], suppliers: [{ id: 's1', name: 'Meta' }],
    customers: [{ id: 'u1', name: 'ลูกค้า' }], documents: [{ id: 'd1', doc_no: 'QT-1' }],
  });
  assert.equal(rows[0][2], 'โฆษณา');
  assert.equal(rows[0][11], 'Meta');
  assert.equal(rows[0][13], 'QT-1');
});

test('backup includes row counts, metadata note and digest', async () => {
  const empty = { company: [], customers: [], products: [], suppliers: [], documents: [], documentItems: [], expenseCategories: [], expenses: [], expenseAttachments: [], expenseEvents: [] };
  const backup = JSON.parse(await createBackupFile(empty, '2026-09-14T00:00:00.000Z'));
  assert.equal(backup.format, 'display-works-erp-backup');
  assert.equal(backup.exportedAt, '2026-09-14T00:00:00.000Z');
  assert.equal(backup.attachmentFilesIncluded, false);
  assert.equal(backup.counts.documents, 0);
  assert.match(backup.sha256, /^[a-f0-9]{64}$/);
});
