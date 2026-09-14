export type DashboardPeriod = { from: string; to: string };
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validPeriod(value: DashboardPeriod) {
  return validDate(value.from) && validDate(value.to) && value.from <= value.to;
}
export function shiftDate(value: string, days: number) {
  if (!validDate(value)) throw new Error('INVALID_DATE');
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function bangkokToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function quickPeriod(mode: string, today = bangkokToday()): DashboardPeriod {
  const from = mode === 'today' ? today : mode === 'week' ? shiftDate(today, -6)
    : mode === 'month' ? `${today.slice(0, 7)}-01` : mode === 'year' ? `${today.slice(0, 4)}-01-01` : shiftDate(today, -29);
  return { from, to: today };
}
export function inPeriod(date: string, period: DashboardPeriod) {
  return validDate(date) && date >= period.from && date <= period.to;
}
export function previousPeriod(period: DashboardPeriod): DashboardPeriod {
  const days = (Date.parse(`${period.to}T00:00:00Z`) - Date.parse(`${period.from}T00:00:00Z`)) / 86400000 + 1;
  return { from: shiftDate(period.from, -days), to: shiftDate(period.from, -1) };
}

export type Comparison = 'previous' | 'month' | 'year' | 'none';
export function comparisonFromSearch(search: string): Comparison {
  const value = new URLSearchParams(search).get('erpCompare');
  return value === 'month' || value === 'year' || value === 'none' ? value : 'previous';
}
export function comparisonPeriod(period: DashboardPeriod, mode: Comparison): DashboardPeriod | null {
  if (mode === 'none') return null;
  if (mode === 'previous') return previousPeriod(period);
  if (mode === 'month') {
    const end = shiftDate(`${period.from.slice(0, 7)}-01`, -1);
    return { from: `${end.slice(0, 7)}-01`, to: end };
  }
  const lastYear = (day: string) => {
    const [year, month, date] = day.split('-').map(Number);
    return `${year - 1}-${String(month).padStart(2, '0')}-${String(Math.min(date, new Date(Date.UTC(year - 1, month, 0)).getUTCDate())).padStart(2, '0')}`;
  };
  return { from: lastYear(period.from), to: lastYear(period.to) };
}

export type Resolution = 'auto' | 'day' | 'week' | 'month' | 'year';
export function reportResolution(period: DashboardPeriod, requested: Resolution = 'auto') {
  const days = (Date.parse(period.to) - Date.parse(period.from)) / 86400000 + 1;
  const auto = days <= 31 ? 'day' : days <= 183 ? 'week' : days <= 731 ? 'month' : 'year';
  // Bound chart points even if a multi-year report is manually set to daily.
  if ((requested === 'day' && days > 366) || (requested === 'week' && days > 2562)) return auto;
  return requested === 'auto' ? auto : requested;
}
export function periodFromSearch(search: string, fallback = quickPeriod('month')) {
  const params = new URLSearchParams(search);
  const candidate = { from: params.get('erpFrom') || '', to: params.get('erpTo') || '' };
  return validPeriod(candidate) ? candidate : fallback;
}
export function periodSearch(search: string, period: DashboardPeriod) {
  if (!validPeriod(period)) throw new Error('INVALID_PERIOD');
  const params = new URLSearchParams(search);
  params.set('erpFrom', period.from); params.set('erpTo', period.to);
  return params.toString();
}

export async function completePages<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown; count: number | null }>, id: (row: T) => string): Promise<{ data: T[]; error: null }> {
  const rows: T[] = [], seen = new Set<string>();
  let expected: number | null = null;
  for (let offset = 0; ; offset += 500) {
    const result = await fetchPage(offset, offset + 499);
    if (result.error || !result.data || result.count === null || (expected !== null && expected !== result.count)) throw new Error('INCOMPLETE_REPORT_DATA');
    expected = result.count;
    for (const row of result.data) {
      const key = id(row);
      if (!key || seen.has(key)) throw new Error('UNSTABLE_REPORT_DATA');
      seen.add(key); rows.push(row);
    }
    if (rows.length === expected) return { data: rows, error: null };
    if (rows.length > expected || result.data.length < 500) throw new Error('INCOMPLETE_REPORT_DATA');
  }
}
