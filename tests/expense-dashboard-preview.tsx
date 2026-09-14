import React from 'react';
import { createRoot } from 'react-dom/client';
import { ExpenseDashboardView } from '../src/app/admin/expenses/ExpenseDashboard';
import { actualExpenseReport } from '../src/lib/expense-dashboard';

const rows = Array.from({ length: 18 }, (_, index) => ({
  expense_date: `2026-09-${String(index + 1).padStart(2, '0')}`,
  total_amount: '1000.00', payment_status: 'paid', voided_at: null,
  category_id: 'ads', expense_class: 'operating',
}));
const state = new URLSearchParams(location.search).get('state');
const summary = state === 'error' ? null : actualExpenseReport(state === 'empty' ? [] : rows, '2026-09-01', '2026-10-01', { ads: 'ค่าโฆษณา Facebook' }, []);
createRoot(document.getElementById('root')!).render(<ExpenseDashboardView summary={summary} loading={state === 'loading'} start="2026-09-01" end="2026-10-01" onRefresh={() => { document.title = 'refreshed'; }} />);
