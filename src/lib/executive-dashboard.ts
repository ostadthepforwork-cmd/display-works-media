import { DashboardPeriod, inPeriod, bangkokToday, shiftDate, reportResolution, Resolution } from './dashboard-period';
import { DashboardExpense, actualExpenseReport } from './expense-dashboard';
export type ExecutiveDocument = {
  id: string; type: string; date: string; dueDate: string; status: string;
  deleted: boolean; docNo: string; customerName: string; revenue: number;
  estimatedCost: number; uncertainCost: boolean; balanceDue: number;
  customerId?: string;
  items: { productId?: string; name: string; revenue: number; cost: number }[];
};
export const productKey = (item: ExecutiveDocument['items'][number]) => item.productId ? `id:${item.productId}` : `name:${item.name.trim()}`;
export function executiveModel(documents: ExecutiveDocument[], period: DashboardPeriod, today = bangkokToday()) {
  const selected = documents.filter(doc => !doc.deleted && doc.status !== 'cancelled' && inPeriod(doc.date, period));
  const receipts = selected.filter(doc => doc.type === 'receipt');
  const revenue = receipts.reduce((sum, doc) => sum + doc.revenue, 0);
  const cost = receipts.reduce((sum, doc) => sum + doc.estimatedCost, 0);
  if (![revenue, cost].every(Number.isFinite)) throw new Error('INVALID_DOCUMENT_TOTAL');
  const gross = revenue - cost;
  const pending = selected.filter(doc => doc.type === 'quote' && ['draft', 'sent'].includes(doc.status));
  const overdue = selected.filter(doc => doc.type === 'invoice' && doc.dueDate && doc.dueDate < today && doc.balanceDue > 0);
  const productMap = new Map<string, { key: string; name: string; revenue: number; cost: number; documentIds: string[]; customers: string[] }>();
  const trend = new Map<string, { date: string; revenue: number; cost: number; gross: number }>();
  for (const doc of receipts) {
    const entry = trend.get(doc.date) || { date: doc.date, revenue: 0, cost: 0, gross: 0 };
    entry.revenue += doc.revenue; entry.cost += doc.estimatedCost;
    entry.gross = entry.revenue - entry.cost; trend.set(doc.date, entry);
  }
  for (const doc of receipts) for (const item of doc.items) {
    if (![item.revenue, item.cost].every(Number.isFinite)) throw new Error('INVALID_PRODUCT_TOTAL');
    const key = productKey(item);
    const entry = productMap.get(key) || { key, name: item.name.trim(), revenue: 0, cost: 0, documentIds: [], customers: [] };
    entry.revenue += item.revenue; entry.cost += item.cost;
    if (!entry.documentIds.includes(doc.id)) entry.documentIds.push(doc.id);
    const customer = doc.customerId || doc.customerName;
    if (!entry.customers.includes(customer)) entry.customers.push(customer);
    productMap.set(key, entry);
  }
  return { selected, receipts, revenue, cost, gross, margin: revenue > 0 ? gross / revenue * 100 : null,
    pending, overdue, uncertain: receipts.filter(doc => doc.uncertainCost).length, trend: [...trend.values()].sort((a,b) => a.date.localeCompare(b.date)),
    products: [...productMap.values()].sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost)),
    recent: [...selected].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)).slice(0, 5),
  };
}

export function metricDelta(current: number | null, previous: number | null, margin = false) {
  if (current === null || previous === null || !Number.isFinite(current) || !Number.isFinite(previous)) return null;
  const difference = current - previous;
  return { difference, percent: !margin && previous > 0 ? difference / previous * 100 : null, points: margin ? difference : null };
}

export function financialReport(documents: ExecutiveDocument[], expenses: DashboardExpense[], categories: Record<string, string>, period: DashboardPeriod) {
  const model = executiveModel(documents, period);
  const actual = actualExpenseReport(expenses, period.from, shiftDate(period.to, 1), categories, []);
  const operating = Number(actual.classes.find(row => row.id === 'operating')!.total);
  return { ...model, actual, operating, after: model.gross - operating };
}

export function businessTrend(documents: ExecutiveDocument[], expenses: DashboardExpense[] | null, period: DashboardPeriod, requested: Resolution) {
  const resolution = reportResolution(period, requested);
  const buckets: { from: string; to: string; label: string; revenue: number; cost: number; gross: number; operating: number | null }[] = [];
  for (let from = period.from; from <= period.to;) {
    let end: string;
    if (resolution === 'day') end = from;
    else if (resolution === 'week') end = shiftDate(from, 6);
    else if (resolution === 'month') {
      const [y, m] = from.split('-').map(Number);
      end = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
    } else end = `${from.slice(0, 4)}-12-31`;
    const to = end < period.to ? end : period.to;
    buckets.push({ from, to, label: resolution === 'year' ? from.slice(0,4) : resolution === 'month' ? from.slice(0,7) : from, revenue: 0, cost: 0, gross: 0, operating: expenses === null ? null : 0 });
    from = shiftDate(to, 1);
  }
  const receipts = executiveModel(documents, period).receipts;
  for (const bucket of buckets) {
    for (const doc of receipts.filter(doc => doc.date >= bucket.from && doc.date <= bucket.to)) {
      bucket.revenue += doc.revenue; bucket.cost += doc.estimatedCost;
    }
    bucket.gross = bucket.revenue - bucket.cost;
    if (expenses !== null) {
      const report = actualExpenseReport(expenses, bucket.from, shiftDate(bucket.to, 1), {}, []);
      bucket.operating = Number(report.classes.find(row => row.id === 'operating')!.total);
    }
  }
  return { resolution, buckets };
}
