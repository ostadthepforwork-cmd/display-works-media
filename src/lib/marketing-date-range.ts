import { bangkokToday, shiftDate, validPeriod } from "@/lib/dashboard-period";

const BANGKOK_OFFSET = "+07:00";

export function bangkokDateFromTimestamp(value: string | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function marketingDateRangeFromUrl(requestUrl: string, now = new Date()) {
  const url = new URL(requestUrl);
  const requested = {
    from: url.searchParams.get("startDate") || "",
    to: url.searchParams.get("endDate") || "",
  };
  const today = bangkokToday(now);
  const period = validPeriod(requested)
    ? requested
    : { from: shiftDate(today, -29), to: today };

  return {
    period,
    startIso: new Date(`${period.from}T00:00:00${BANGKOK_OFFSET}`).toISOString(),
    endExclusiveIso: new Date(`${shiftDate(period.to, 1)}T00:00:00${BANGKOK_OFFSET}`).toISOString(),
  };
}
