import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeDashboardExpenses } from '../src/lib/expense-dashboard';

test('real expenses use exact cents, inclusive start and exclusive end, excluding voids', () => {
  const row = { total_amount: '0.10', expense_date: '2026-09-01', payment_status: 'paid', voided_at: null };
  assert.deepEqual(summarizeDashboardExpenses([
    row, { ...row, total_amount: '0.20', payment_status: 'unpaid' },
    { ...row, expense_date: '2026-10-01' }, { ...row, expense_date: '2026-08-31' },
    { ...row, voided_at: '2026-09-02' },
  ], '2026-09-01', '2026-10-01'), { total: '0.30', paid: '0.10', unpaid: '0.20', count: 2 });
});
test('empty is zero; invalid money fails instead of reporting false zero', () => {
  assert.equal(summarizeDashboardExpenses([], '2026-09-01', '2026-10-01').total, '0.00');
  assert.throws(() => summarizeDashboardExpenses([{ total_amount: 'bad', payment_status: 'paid', expense_date: '2026-09-01', voided_at: null }], '2026-09-01', '2026-10-01'));
});
