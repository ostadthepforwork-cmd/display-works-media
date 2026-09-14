"use client";

import { useEffect, useState } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './ExpenseDashboard.module.css';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { formatExpenseTotal } from '@/lib/expense-inspection';
import { DashboardExpense, actualExpenseReport } from '@/lib/expense-dashboard';

export default function ExpenseDashboard({ start, end, revenue }: { start: string; end: string; revenue: { date: string; total: string }[] }) {
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<{ key: string; rows: DashboardExpense[]; categories: Record<string, string>; error: boolean } | null>(null);
  const key = `${start}/${end}/${refresh}`;
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const client = getSupabaseBrowserClient();
        const rows: DashboardExpense[] = [];
        let expected: number | null = null;
        for (let offset = 0; ; offset += 500) {
          const { data, error, count } = await client.from('erp_expenses')
            .select('id,total_amount,payment_status,expense_date,voided_at,category_id,expense_class', { count: 'exact' })
            .gte('expense_date', start).lt('expense_date', end).is('voided_at', null)
            .order('id').range(offset, offset + 499);
          if (error || !data || count === null || (expected !== null && expected !== count)) throw new Error('INCOMPLETE_RESULT');
          expected = count;
          rows.push(...data);
          if (rows.length === expected) break;
          if (data.length < 500 || rows.length > expected) throw new Error('INCOMPLETE_RESULT');
        }
        const categories: Record<string, string> = {};
        const ids = [...new Set(rows.map(row => row.category_id).filter((id): id is string => Boolean(id)))];
        for (let offset = 0; offset < ids.length; offset += 100) {
          const batch = ids.slice(offset, offset + 100);
          const { data, error } = await client.from('erp_expense_categories').select('id,name').in('id', batch);
          if (error || !data || data.length !== batch.length) throw new Error('INCOMPLETE_CATEGORIES');
          for (const category of data) categories[category.id] = category.name;
        }
        if (!cancelled) setResult({ key, rows, categories, error: false });
      } catch {
        if (!cancelled) setResult({ key, rows: [], categories: {}, error: true });
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [start, end, key]);
  const current = result?.key === key ? result : null;
  let summary: ReturnType<typeof actualExpenseReport> | null = null;
  if (current && !current.error) {
    try { summary = actualExpenseReport(current.rows, start, end, current.categories, revenue); } catch { /* Render the explicit error state below. */ }
  }
  return <ExpenseDashboardView key={`${start}/${end}`} summary={summary} loading={!current} start={start} end={end} onRefresh={() => setRefresh(value => value + 1)} />;
}

type Report = ReturnType<typeof actualExpenseReport>;
const money = (value: string) => value.startsWith('-') ? `-฿${formatExpenseTotal(value.slice(1))}` : `฿${formatExpenseTotal(value)}`;
const dateLabel = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

export function ExpenseDashboardView({ summary, loading, start, end, onRefresh }: { summary: Report | null; loading: boolean; start: string; end: string; onRefresh: () => void }) {
  const [tab, setTab] = useState<'category' | 'daily'>('category');
  const [page, setPage] = useState(0);
  const last = new Date(`${end}T00:00:00`); last.setDate(last.getDate() - 1);
  const groups = [...(summary?.groups || [])].sort((a, b) => Number(b.total) - Number(a.total));
  const days = [...(summary?.trend || [])].reverse();
  const count = tab === 'category' ? groups.length : days.length;
  const pages = Math.max(1, Math.ceil(count / 8));
  const activePage = Math.min(page, pages - 1);
  return <section className={styles.report} aria-label="ค่าใช้จ่ายจริง" aria-busy={loading}>
    <header className={styles.heading}><div><h2>สรุปค่าใช้จ่ายจริง</h2><p>{dateLabel(start)} – {last.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} · รวม VAT</p></div>
      <button type="button" className={styles.icon} disabled={loading} title="รีเฟรชค่าใช้จ่าย" aria-label="รีเฟรชค่าใช้จ่าย" onClick={onRefresh}><RefreshCw size={18} /></button>
    </header>
    {loading ? <p className={styles.state} role="status">กำลังโหลดค่าใช้จ่าย...</p> : !summary ? <p className={styles.state} role="alert">โหลดหรือคำนวณค่าใช้จ่ายไม่สำเร็จ กรุณาลองใหม่</p> : <>
      <div className={styles.metrics}>
        <div><span>ยอดเอกสาร</span><strong>{money(summary.revenue)}</strong><small>ตามวันที่เอกสารในช่วงที่เลือก</small></div>
        <div><span>ค่าใช้จ่ายจริง</span><strong>{money(summary.total)}</strong><small>{summary.count} รายการ</small></div>
        <div><span>คงเหลือหลังหักค่าใช้จ่ายจริง</span><strong className={summary.balance.startsWith('-') ? styles.negative : styles.positive}>{money(summary.balance)}</strong><small>ยอดเอกสาร − ค่าใช้จ่ายจริง</small></div>
      </div>
      <div className={styles.payment}><span>ชำระแล้ว <b>{money(summary.paid)}</b></span><span>ค้างชำระ <b>{money(summary.unpaid)}</b></span></div>
      <details className={styles.note}><summary>ขอบเขตยอดคำนวณ</summary><p>รวมรายการเก็บถาวร ไม่รวมรายการยกเลิก ผลต่างไม่ใช่กำไรสุทธิหรือกระแสเงินสด และไม่หักต้นทุนประมาณการซ้ำ</p></details>
      <div className={styles.detailHeader}><div className={styles.tabs} aria-label="มุมมองค่าใช้จ่าย">{(['category', 'daily'] as const).map(value => <button key={value} type="button" aria-pressed={tab === value} onClick={() => { setTab(value); setPage(0); }}>{value === 'category' ? 'แยกตามหมวด' : 'รายการรายวัน'}</button>)}</div><span className={styles.muted}>{count} {tab === 'category' ? 'หมวด' : 'วัน'}</span></div>
      {tab === 'category' && <div className={styles.classes}>{summary.classes.map(group => <span key={group.id}>{group.id === 'direct' ? 'ต้นทุนตรง' : 'ค่าใช้จ่ายดำเนินงาน'} <b>{money(group.total)}</b></span>)}</div>}
      {count === 0 ? <p className={styles.state}>ไม่มีรายการในช่วงวันที่นี้</p> : <div className={styles.rows}>
        <div className={styles.tableHead}><span>{tab === 'category' ? 'หมวดค่าใช้จ่าย' : 'วันที่'}</span><span>{tab === 'category' ? 'ยอดรวม' : 'ยอดเอกสาร'}</span><span>{tab === 'category' ? 'ชำระแล้ว' : 'ค่าใช้จ่ายจริง'}</span><span>{tab === 'category' ? 'ค้างชำระ' : 'ผลต่าง'}</span></div>
        {tab === 'category' ? groups.slice(activePage * 8, activePage * 8 + 8).map(group => <div className={styles.row} key={group.id}><div><b>{group.name}</b><small>{group.count} รายการ</small></div><span data-label="ยอดรวม">{money(group.total)}</span><span data-label="ชำระแล้ว">{money(group.paid)}</span><span data-label="ค้างชำระ">{money(group.unpaid)}</span></div>) : days.slice(activePage * 8, activePage * 8 + 8).map(day => <div className={styles.row} key={day.date}><b>{dateLabel(day.date)}</b><span data-label="ยอดเอกสาร">{money(day.revenue)}</span><span data-label="ค่าใช้จ่ายจริง">{money(day.expense)}</span><span data-label="ผลต่าง" className={day.balance.startsWith('-') ? styles.negative : styles.positive}>{money(day.balance)}</span></div>)}
      </div>}
      {pages > 1 && <nav className={styles.pagination} aria-label="หน้ารายงาน"><span>หน้า {activePage + 1} / {pages}</span><button className={styles.icon} type="button" title="หน้าก่อนหน้า" aria-label="หน้าก่อนหน้า" disabled={activePage === 0} onClick={() => setPage(activePage - 1)}><ChevronLeft size={18} /></button><button className={styles.icon} type="button" title="หน้าถัดไป" aria-label="หน้าถัดไป" disabled={activePage + 1 === pages} onClick={() => setPage(activePage + 1)}><ChevronRight size={18} /></button></nav>}
    </>}
  </section>;
}
