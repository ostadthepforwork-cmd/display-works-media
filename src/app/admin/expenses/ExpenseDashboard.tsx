"use client";

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
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
  const money = (value: string) => value.startsWith('-') ? `-฿${formatExpenseTotal(value.slice(1))}` : `฿${formatExpenseTotal(value)}`;
  const scale = summary ? Math.max(1, ...summary.trend.flatMap(day => [Number(day.revenue), Number(day.expense), Math.abs(Number(day.balance))])) : 1;
  return <section aria-label="ค่าใช้จ่ายจริง" style={{ padding: '20px 0', borderTop: '1px solid #374151', borderBottom: '1px solid #374151', marginBottom: 24 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h2 style={{ fontSize: 18, margin: 0 }}>ค่าใช้จ่ายจริงตามวันที่รายการ (รวม VAT)</h2>
      <button type="button" title="รีเฟรชค่าใช้จ่าย" aria-label="รีเฟรชค่าใช้จ่าย" onClick={() => setRefresh(value => value + 1)} style={{ width: 40, height: 40 }}><RefreshCw size={18} /></button>
    </div>
    {!current ? <p role="status">กำลังโหลดค่าใช้จ่าย...</p> : !summary ? <p role="alert">โหลดหรือคำนวณค่าใช้จ่ายไม่สำเร็จ กรุณาลองใหม่</p> : <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, paddingTop: 16 }}>
        {([['ยอดเอกสาร', summary.revenue], ['ค่าใช้จ่ายจริงรวม', summary.total], ['ชำระแล้ว', summary.paid], ['ค้างชำระ', summary.unpaid], ['ผลต่างยอดเอกสารหักค่าใช้จ่ายจริง', summary.balance]]).map(([label, value]) => <div key={label}><div>{label}</div><strong style={{ fontSize: 24, overflowWrap: 'anywhere', color: value.startsWith('-') ? '#FCA5A5' : undefined }}>{money(value)}</strong></div>)}
      </div>
      <p style={{ color: '#94A3B8', fontSize: 12 }}>{summary.count} รายการ · รวมรายการเก็บถาวร ไม่รวมรายการยกเลิก · ผลต่างไม่ใช่กำไรสุทธิหรือกระแสเงินสด และไม่หักต้นทุนประมาณการซ้ำ</p>
      <h3 style={{ fontSize: 16 }}>ค่าใช้จ่ายจริงตามประเภท</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>{summary.classes.map(group => <div key={group.id}>{group.id === 'direct' ? 'ต้นทุนตรง' : 'ค่าใช้จ่ายดำเนินงาน'} <strong>{money(group.total)}</strong></div>)}</div>
      <h3 style={{ fontSize: 16 }}>ค่าใช้จ่ายจริงตามหมวด</h3>
      {summary.groups.length === 0 ? <p>ไม่มีค่าใช้จ่ายในช่วงนี้</p> : <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', textAlign: 'left' }}><thead><tr>{['หมวด', 'รายการ', 'รวม', 'ชำระแล้ว', 'ค้างชำระ'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{summary.groups.map(group => <tr key={group.id}><td>{group.name}</td><td>{group.count}</td><td>{money(group.total)}</td><td>{money(group.paid)}</td><td>{money(group.unpaid)}</td></tr>)}</tbody></table></div>}
      <h3 style={{ fontSize: 16 }}>ยอดเอกสารและค่าใช้จ่ายจริงรายวัน</h3>
      <div aria-label="กราฟค่าใช้จ่ายจริงรายวัน" style={{ maxHeight: 240, overflow: 'auto' }}>{summary.trend.map(day => <div key={day.date} style={{ padding: '6px 0' }}>
        <div style={{ fontSize: 12 }}>{day.date}</div>
        {([['ยอดเอกสาร', day.revenue, '#34D399'], ['ค่าใช้จ่ายจริง', day.expense, '#F87171'], ['ผลต่าง', day.balance, day.balance.startsWith('-') ? '#FBBF24' : '#60A5FA']]).map(([label, value, color]) => <div key={label} style={{ display: 'grid', gridTemplateColumns: '90px minmax(0,1fr)', gap: 8, alignItems: 'center', fontSize: 12 }}>
          <span>{label}</span><div><span>{money(value)}</span><div aria-hidden="true" style={{ height: 5, background: color, width: `${Math.abs(Number(value)) / scale * 100}%` }} /></div>
        </div>)}
      </div>)}</div>
      <div style={{ maxHeight: 320, overflow: 'auto' }}><table style={{ width: '100%', textAlign: 'left' }}><thead><tr><th>วันที่</th><th>ยอดเอกสาร</th><th>ค่าใช้จ่ายจริง</th><th>ผลต่าง</th></tr></thead><tbody>{summary.trend.map(day => <tr key={day.date}><td>{day.date}</td><td>{money(day.revenue)}</td><td>{money(day.expense)}</td><td style={{ color: day.balance.startsWith('-') ? '#FCA5A5' : '#6EE7B7' }}>{money(day.balance)}</td></tr>)}</tbody></table></div>
    </>}
  </section>;
}
