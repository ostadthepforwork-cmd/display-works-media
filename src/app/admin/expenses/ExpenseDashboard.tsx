"use client";

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { formatExpenseTotal } from '@/lib/expense-inspection';
import { DashboardExpense, summarizeDashboardExpenses } from '@/lib/expense-dashboard';

export default function ExpenseDashboard({ start, end }: { start: string; end: string }) {
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<{ key: string; summary: ReturnType<typeof summarizeDashboardExpenses> | null; error: boolean } | null>(null);
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
            .select('id,total_amount,payment_status,expense_date,voided_at', { count: 'exact' })
            .gte('expense_date', start).lt('expense_date', end).is('voided_at', null)
            .order('id').range(offset, offset + 499);
          if (error || !data || count === null || (expected !== null && expected !== count)) throw new Error('INCOMPLETE_RESULT');
          expected = count;
          rows.push(...data);
          if (rows.length === expected) break;
          if (data.length < 500 || rows.length > expected) throw new Error('INCOMPLETE_RESULT');
        }
        const summary = summarizeDashboardExpenses(rows, start, end);
        if (!cancelled) setResult({ key, summary, error: false });
      } catch {
        if (!cancelled) setResult({ key, summary: null, error: true });
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [start, end, key]);
  const current = result?.key === key ? result : null;
  return <section aria-label="ค่าใช้จ่ายจริง" style={{ padding: '20px 0', borderTop: '1px solid #374151', borderBottom: '1px solid #374151', marginBottom: 24 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h2 style={{ fontSize: 18, margin: 0 }}>ค่าใช้จ่ายจริงตามวันที่รายการ (รวม VAT)</h2>
      <button type="button" title="รีเฟรชค่าใช้จ่าย" aria-label="รีเฟรชค่าใช้จ่าย" onClick={() => setRefresh(value => value + 1)} style={{ width: 40, height: 40 }}><RefreshCw size={18} /></button>
    </div>
    {!current ? <p role="status">กำลังโหลดค่าใช้จ่าย...</p> : current.error ? <p role="alert">โหลดค่าใช้จ่ายไม่สำเร็จ กรุณาลองใหม่</p> : current.summary && <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, paddingTop: 16 }}>
        {([['ค่าใช้จ่ายรวม', current.summary.total], ['ชำระแล้ว', current.summary.paid], ['ค้างชำระ', current.summary.unpaid]]).map(([label, value]) => <div key={label}><div>{label}</div><strong style={{ fontSize: 24, overflowWrap: 'anywhere' }}>฿{formatExpenseTotal(value)}</strong></div>)}
      </div>
      <p style={{ color: '#94A3B8', fontSize: 12 }}>{current.summary.count} รายการ · รวมรายการเก็บถาวร ไม่รวมรายการยกเลิก</p>
    </>}
  </section>;
}
