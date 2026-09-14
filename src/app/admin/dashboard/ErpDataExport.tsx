'use client';

import { useMemo, useState } from 'react';
import { Archive, CheckCircle2, DatabaseBackup, Download, FileSpreadsheet, LoaderCircle, ShieldCheck } from 'lucide-react';
import { completePages } from '@/lib/dashboard-period';
import {
  DOCUMENT_HEADERS,
  EXPENSE_HEADERS,
  ErpBackupTables,
  createBackupFile,
  csvFile,
  documentAnalysisRows,
  expenseAnalysisRows,
  tableRows,
} from '@/lib/erp-export';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import s from './ErpDataExport.module.css';

type ExportKind = 'documents' | 'expenses' | 'customers' | 'products' | 'suppliers';
type Props = { showToast: (message: string, type?: string) => void };

const TABLES: Array<[keyof ErpBackupTables, string, string]> = [
  ['company', 'erp_company', 'id'], ['customers', 'erp_customers', 'id'],
  ['products', 'erp_products', 'id'], ['suppliers', 'erp_suppliers', 'id'],
  ['documents', 'erp_documents', 'id'], ['documentItems', 'erp_document_items', 'id'],
  ['expenseCategories', 'erp_expense_categories', 'id'], ['expenses', 'erp_expenses', 'id'],
  ['expenseAttachments', 'erp_expense_attachments', 'id'], ['expenseEvents', 'erp_expense_events', 'id'],
];

const SIMPLE_EXPORTS: Record<Exclude<ExportKind, 'documents' | 'expenses'>, { table: keyof ErpBackupTables; columns: Array<[string, string]> }> = {
  customers: { table: 'customers', columns: [['ชื่อ', 'name'], ['ผู้ติดต่อ', 'contact'], ['โทรศัพท์', 'phone'], ['อีเมล', 'email'], ['ที่อยู่', 'address'], ['เลขผู้เสียภาษี', 'tax_id'], ['กลุ่มลูกค้า', 'customer_segment'], ['ประเภทธุรกิจ', 'business_type'], ['สร้างเมื่อ', 'created_at']] },
  products: { table: 'products', columns: [['ชื่อสินค้า/บริการ', 'name'], ['หน่วย', 'unit'], ['ต้นทุน', 'cost'], ['ราคาขาย', 'price'], ['ผู้ขาย', 'supplier_name'], ['ฐานต้นทุน', 'cost_unit'], ['ฐานราคา', 'price_unit'], ['สร้างเมื่อ', 'created_at']] },
  suppliers: { table: 'suppliers', columns: [['ชื่อผู้ขาย', 'name'], ['ผู้ติดต่อ', 'contact'], ['โทรศัพท์', 'phone'], ['อีเมล', 'email'], ['ที่อยู่', 'address'], ['เลขผู้เสียภาษี', 'tax_id'], ['หมายเหตุ', 'notes'], ['สร้างเมื่อ', 'created_at']] },
};

const options: Array<{ id: ExportKind; title: string; description: string }> = [
  { id: 'documents', title: 'เอกสารและรายการสินค้า', description: 'ใบเสนอราคา ใบวางบิล ใบแจ้งหนี้ ใบเสร็จ และต้นทุนรายบรรทัด' },
  { id: 'expenses', title: 'ค่าใช้จ่ายจริง', description: 'หมวด ประเภทต้นทุน VAT การชำระ และเอกสารอ้างอิง' },
  { id: 'customers', title: 'ข้อมูลลูกค้า', description: 'ข้อมูลติดต่อ กลุ่มลูกค้า และประเภทธุรกิจ' },
  { id: 'products', title: 'สินค้าและบริการ', description: 'ราคาขาย ต้นทุน หน่วย และผู้ขาย' },
  { id: 'suppliers', title: 'ข้อมูลผู้ขาย', description: 'ข้อมูลติดต่อ ภาษี และหมายเหตุผู้ขาย' },
];

function dateStamp() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
}

function download(name: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ErpDataExport({ showToast }: Props) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [selected, setSelected] = useState<ExportKind>('documents');
  const [busy, setBusy] = useState<'csv' | 'backup' | null>(null);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const readTable = async (table: string, key: string) => {
    const result = await completePages<Record<string, unknown>>(
      (from, to) => supabase.from(table).select('*', { count: 'exact' }).order(key).range(from, to),
      row => String(row[key]),
    );
    if (result.error) throw result.error;
    return result.data;
  };

  const readAll = async () => Object.fromEntries(await Promise.all(TABLES.map(async ([name, table, key]) => [name, await readTable(table, key)]))) as ErpBackupTables;

  const exportCsv = async () => {
    setBusy('csv');
    try {
      let headers: string[];
      let rows: unknown[][];
      if (selected === 'documents') {
        const [documents, documentItems] = await Promise.all([readTable('erp_documents', 'id'), readTable('erp_document_items', 'id')]);
        headers = DOCUMENT_HEADERS; rows = documentAnalysisRows({ documents, documentItems });
      } else if (selected === 'expenses') {
        const [expenses, expenseCategories, suppliers, customers, documents] = await Promise.all([
          readTable('erp_expenses', 'id'), readTable('erp_expense_categories', 'id'), readTable('erp_suppliers', 'id'),
          readTable('erp_customers', 'id'), readTable('erp_documents', 'id'),
        ]);
        headers = EXPENSE_HEADERS; rows = expenseAnalysisRows({ expenses, expenseCategories, suppliers, customers, documents });
      } else {
        const config = SIMPLE_EXPORTS[selected];
        const data = await readTable(TABLES.find(([name]) => name === config.table)![1], 'id');
        headers = config.columns.map(([label]) => label); rows = tableRows(data, config.columns);
      }
      download(`display-works-erp-${selected}-${dateStamp()}.csv`, csvFile(headers, rows), 'text/csv;charset=utf-8');
      setLastExport(new Date().toLocaleString('th-TH'));
      showToast(`ส่งออก CSV ${rows.length.toLocaleString('th-TH')} แถวแล้ว`);
    } catch (error) {
      console.error('ERP CSV export failed', error);
      showToast('ส่งออก CSV ไม่สำเร็จ กรุณาตรวจ session และสิทธิ์ฐานข้อมูล', 'error');
    } finally { setBusy(null); }
  };

  const exportBackup = async () => {
    setBusy('backup');
    try {
      const tables = await readAll();
      const body = await createBackupFile(tables);
      download(`display-works-erp-backup-${dateStamp()}.json`, body, 'application/json;charset=utf-8');
      setLastExport(new Date().toLocaleString('th-TH'));
      showToast(`สำรองข้อมูล ${Object.values(tables).reduce((sum, rows) => sum + rows.length, 0).toLocaleString('th-TH')} รายการแล้ว`);
    } catch (error) {
      console.error('ERP backup export failed', error);
      showToast('สำรองข้อมูลไม่สำเร็จ กรุณาตรวจ session และสิทธิ์ฐานข้อมูล', 'error');
    } finally { setBusy(null); }
  };

  return <main className={s.page}>
    <header className={s.header}><div><span>ERP / DATA PORTABILITY</span><h1>ส่งออกและสำรองข้อมูล</h1><p>นำข้อมูลไปวิเคราะห์ภายนอก หรือเก็บ snapshot ของฐานข้อมูลธุรกิจในเวลานี้</p></div><div className={s.security}><ShieldCheck size={20}/><span><b>ใช้สิทธิ์ของบัญชีที่ล็อกอิน</b><small>ไม่มี service key อยู่ในไฟล์ดาวน์โหลด</small></span></div></header>
    <section className={s.grid}>
      <article className={s.panel}><div className={s.panelTitle}><span className={s.icon}><FileSpreadsheet size={22}/></span><div><h2>ไฟล์ CSV สำหรับวิเคราะห์</h2><p>เปิดด้วย Excel, Google Sheets หรือเครื่องมือ BI</p></div></div>
        <div className={s.choices} role="radiogroup" aria-label="เลือกชุดข้อมูล CSV">{options.map(option=><button type="button" role="radio" aria-checked={selected===option.id} key={option.id} onClick={()=>setSelected(option.id)}><span className={s.radio}/><span><b>{option.title}</b><small>{option.description}</small></span></button>)}</div>
        <button className={s.primary} type="button" disabled={busy!==null} onClick={()=>void exportCsv()}>{busy==='csv'?<LoaderCircle className={s.spin} size={18}/>:<Download size={18}/>}ดาวน์โหลด CSV</button>
      </article>
      <article className={s.panel}><div className={s.panelTitle}><span className={`${s.icon} ${s.backupIcon}`}><DatabaseBackup size={22}/></span><div><h2>JSON Data Backup</h2><p>เก็บข้อมูลสัมพันธ์ทั้งหมดพร้อมจำนวนแถวและ SHA-256</p></div></div>
        <ul className={s.checks}><li><CheckCircle2 size={17}/>ข้อมูลบริษัท ลูกค้า สินค้า และผู้ขาย</li><li><CheckCircle2 size={17}/>เอกสารทุกรายการ รวมรายการที่ลบแบบ soft delete</li><li><CheckCircle2 size={17}/>ค่าใช้จ่าย หมวด ประวัติ และ metadata หลักฐาน</li><li><Archive size={17}/>ตัวไฟล์หลักฐานยังอยู่ใน protected storage และไม่ถูกรวม</li></ul>
        <div className={s.notice}><b>ไฟล์นี้มีข้อมูลธุรกิจส่วนตัว</b><span>ควรเก็บในไดรฟ์เข้ารหัสหรือพื้นที่ที่จำกัดสิทธิ์ และยังไม่รองรับการ Restore อัตโนมัติ</span></div>
        <button className={s.secondary} type="button" disabled={busy!==null} onClick={()=>void exportBackup()}>{busy==='backup'?<LoaderCircle className={s.spin} size={18}/>:<DatabaseBackup size={18}/>}สร้างไฟล์สำรอง</button>
      </article>
    </section>
    <footer className={s.footer}><span>{lastExport?`ส่งออกล่าสุด ${lastExport}`:'ยังไม่มีการส่งออกใน session นี้'}</span><small>ระบบอ่านข้อมูลแบบแบ่งหน้าและตรวจว่าดึงครบก่อนสร้างไฟล์</small></footer>
  </main>;
}

