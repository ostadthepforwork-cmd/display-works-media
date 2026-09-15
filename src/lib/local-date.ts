const padDatePart = (value: number) => String(value).padStart(2, "0");

export function formatLocalDateInput(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

export function shiftDateInput(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  const date = new Date(year, month - 1, day, 12);
  date.setDate(date.getDate() + days);
  return formatLocalDateInput(date);
}
