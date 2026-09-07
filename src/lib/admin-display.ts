export function calendarDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function calendarDays(start: string, end: string): string[] {
  const parse = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
    const time = Date.parse(`${value}T00:00:00Z`);
    return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? time : NaN;
  };
  const first = parse(start);
  const last = parse(end);
  if (!Number.isFinite(first) || !Number.isFinite(last) || first > last) return [];
  return Array.from({ length: Math.floor((last - first) / 86400000) + 1 }, (_, i) =>
    new Date(first + i * 86400000).toISOString().slice(0, 10));
}

export function catalogProfit(product: { cost: unknown; price: unknown; costUnit?: string; priceUnit?: string }) {
  const number = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
  const cost = number(product.cost);
  const price = number(product.price);
  if ((product.costUnit || 'piece') !== (product.priceUnit || 'piece') || cost === null || price === null) return null;
  const profit = price - cost;
  return { profit, markup: cost > 0 ? profit / cost * 100 : null, margin: price > 0 ? profit / price * 100 : null };
}
