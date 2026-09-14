import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { completePages, DashboardPeriod, shiftDate } from '@/lib/dashboard-period';
import { actualExpenseReport, DashboardExpense } from '@/lib/expense-dashboard';

export function useExpenseReport(period: DashboardPeriod | null, revision: number) {
  const from = period?.from, to = period?.to;
  const key = `${from}/${to}/${revision}`;
  const [state, setState] = useState<{ key: string; rows: DashboardExpense[]; categories: Record<string, string>; loadedAt: string; error: boolean } | null>(null);
  useEffect(() => {
    if (!from || !to) return;
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    async function load() {
      try {
        const client = getSupabaseBrowserClient();
        const { data } = await completePages<DashboardExpense & { id: string }>((start, end) => client.from('erp_expenses')
          .select('id,expense_date,total_amount,payment_status,voided_at,category_id,expense_class', { count: 'exact' })
          .gte('expense_date', from!).lte('expense_date', to!).is('voided_at', null).order('id').range(start, end).abortSignal(controller.signal), row => row.id);
        const categories: Record<string, string> = {};
        const ids = [...new Set(data.map(row => row.category_id).filter((id): id is string => !!id))];
        for (let i = 0; i < ids.length; i += 100) {
          const batch = ids.slice(i, i + 100);
          const result = await client.from('erp_expense_categories').select('id,name').in('id', batch).abortSignal(controller.signal);
          if (result.error || result.data?.length !== batch.length) throw new Error('INCOMPLETE_CATEGORIES');
          result.data.forEach(row => { categories[row.id] = row.name; });
        }
        actualExpenseReport(data, from!, shiftDate(to!, 1), categories, []);
        if (active) setState({ key, rows: data, categories, loadedAt: new Date().toISOString(), error: false });
      } catch { if (active) setState({ key, rows: [], categories: {}, loadedAt: '', error: true }); }
      finally { clearTimeout(timer); }
    }
    void load();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [key, from, to]);
  return state?.key === key ? state : null;
}
