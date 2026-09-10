import test from 'node:test';
import assert from 'node:assert/strict';
import { actualExpenseReport, summarizeDashboardExpenses } from '../src/lib/expense-dashboard';

test('real expenses use exact cents, inclusive start and exclusive end, excluding voids', () => {
  const row = { total_amount: '0.10', expense_date: '2026-09-01', payment_status: 'paid', voided_at: null };
  assert.deepEqual(summarizeDashboardExpenses([
    row, { ...row, total_amount: '0.20', payment_status: 'unpaid' },
    { ...row, expense_date: '2026-10-01' }, { ...row, expense_date: '2026-08-31' },
    { ...row, voided_at: '2026-09-02' },
  ], '2026-09-01', '2026-10-01'), { total: '0.30', paid: '0.10', unpaid: '0.20', count: 2 });
});
test('actual report reconciles categories, classes and negative balance without adding estimates', () => {
  const row = { total_amount: '10000.00', expense_date: '2026-09-10', payment_status: 'paid', voided_at: null, category_id: 'rent', expense_class: 'operating', archived_at: '2026-09-11' };
  const result = actualExpenseReport([row], '2026-09-01', '2026-10-01', { rent: 'ค่าเช่า' }, [{ date: '2026-09-10', total: '1100.00' }]);
  assert.equal(result.balance, '-8900.00');
  assert.equal(result.groups[0].name, 'ค่าเช่า');
  assert.equal(result.groups[0].total, '10000.00');
  assert.equal(result.classes.find(group => group.id === 'operating')?.total, '10000.00');
  assert.equal(result.trend[0].balance, result.balance);
});
test('category IDs remain separate even with the same name; voids do not enter daily totals', () => {
  const row = { total_amount: '0.01', expense_date: '2026-09-10', payment_status: 'unpaid', voided_at: null, category_id: 'a', expense_class: 'direct' };
  const result = actualExpenseReport([row, { ...row, category_id: 'b' }, { ...row, voided_at: '2026-09-11' }], '2026-09-01', '2026-10-01', { a: 'Other', b: 'Other' }, []);
  assert.equal(result.groups.length, 2);
  assert.equal(result.balance, '-0.02');
  assert.equal(result.unpaid, '0.02');
});
test('empty is zero; invalid money fails instead of reporting false zero', () => {
  assert.equal(summarizeDashboardExpenses([], '2026-09-01', '2026-10-01').total, '0.00');
  assert.throws(() => summarizeDashboardExpenses([{ total_amount: 'bad', payment_status: 'paid', expense_date: '2026-09-01', voided_at: null }], '2026-09-01', '2026-10-01'));
});
