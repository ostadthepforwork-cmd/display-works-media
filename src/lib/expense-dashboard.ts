import { expenseTotal } from './expense-inspection';

export type DashboardExpense = {
  total_amount: string | number;
  payment_status: string;
  expense_date: string;
  voided_at: string | null;
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
