import { expenseTotal } from './expense-inspection';

export type DashboardExpense = {
  total_amount: string | number;
  payment_status: string;
  expense_date: string;
  voided_at: string | null;
  category_id?: string;
  expense_class?: string;
};

export function summarizeDashboardExpenses(rows: DashboardExpense[], start: string, end: string) {
  // Archiving hides records from operational lists, not financial history.
  const active = rows.filter(row => !row.voided_at && row.expense_date >= start && row.expense_date < end);
  if (active.some(row => !['paid', 'unpaid'].includes(row.payment_status))) throw new Error('INVALID_PAYMENT_STATUS');
  const total = expenseTotal(active);
  const paid = expenseTotal(active.filter(row => row.payment_status === 'paid'));
  const unpaid = expenseTotal(active.filter(row => row.payment_status === 'unpaid'));
  if (total === null || paid === null || unpaid === null) throw new Error('INVALID_EXPENSE_AMOUNT');
  return { total, paid, unpaid, count: active.length };
}

export function actualExpenseReport(rows: DashboardExpense[], start: string, end: string,
  categories: Record<string, string>, revenue: { date: string; total: string }[]) {
  const active = rows.filter(row => !row.voided_at && row.expense_date >= start && row.expense_date < end);
  const summary = summarizeDashboardExpenses(rows, start, end);
  const cents = (value: string) => {
    if (!/^\d+\.\d{2}$/.test(value)) throw new Error('INVALID_MONEY');
    return BigInt(value.replace('.', ''));
  };
  const decimal = (value: bigint) => `${value < 0 ? '-' : ''}${(value < 0 ? -value : value) / BigInt(100)}.${String((value < 0 ? -value : value) % BigInt(100)).padStart(2, '0')}`;
  const selectedRevenue = revenue.filter(row => row.date >= start && row.date < end);
  const revenueCents = selectedRevenue.reduce((sum, row) => sum + cents(row.total), BigInt(0));
  const categoryIds = [...new Set(active.map(row => row.category_id || ''))];
  const groups = categoryIds.map(id => ({
    id, name: categories[id] || 'ไม่ทราบหมวด',
    ...summarizeDashboardExpenses(active.filter(row => (row.category_id || '') === id), start, end),
  }));
  const classes = ['direct', 'operating'].map(id => ({ id,
    ...summarizeDashboardExpenses(active.filter(row => row.expense_class === id), start, end),
  }));
  if (active.some(row => !['direct', 'operating'].includes(row.expense_class || ''))) throw new Error('INVALID_EXPENSE_CLASS');
  const dates = [...new Set([...active.map(row => row.expense_date), ...selectedRevenue.map(row => row.date)])].sort();
  const trend = dates.map(date => {
    const expense = expenseTotal(active.filter(row => row.expense_date === date));
    if (expense === null) throw new Error('INVALID_EXPENSE_AMOUNT');
    const earned = selectedRevenue.filter(row => row.date === date).reduce((sum, row) => sum + cents(row.total), BigInt(0));
    return { date, revenue: decimal(earned), expense, balance: decimal(earned - cents(expense)) };
  });
  return { ...summary, revenue: decimal(revenueCents), balance: decimal(revenueCents - cents(summary.total)), groups, classes, trend };
}
