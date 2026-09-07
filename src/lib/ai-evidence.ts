// Referrer and User-Agent observations are signals, not proof of answer usage.
const AI_HOSTS: Record<string, string[]> = {
  chatgpt: ["chatgpt.com", "chat.openai.com"],
  perplexity: ["perplexity.ai"],
  claude: ["claude.ai"],
  copilot: ["copilot.microsoft.com"],
  gemini: ["gemini.google.com", "bard.google.com"],
  poe: ["poe.com"],
  you: ["you.com"],
  phind: ["phind.com"],
};

export function httpUrl(value: unknown): URL | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url : null;
  } catch { return null; }
}

export function detectAiReferrer(value: string) {
  const url = httpUrl(value);
  if (!url) return null;
  return Object.entries(AI_HOSTS).map(([platform, hosts]) => ({ platform, hosts }))
    .find(({ hosts }) => hosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) || null;
}

export function publicReferralPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 300 || !value.startsWith("/") || value.startsWith("//")) return null;
  try {
    const decoded = decodeURIComponent(value);
    if (/[\\\x00-\x20]/.test(decoded) || decoded.includes("%")) return null;
    const url = new URL(decoded, "https://displayworksmedia.com");
    if (url.origin !== "https://displayworksmedia.com" || /^\/(admin|api|auth|doc|login|qa|_next)(\/|$)/i.test(url.pathname)) return null;
    if (/\.(js|css|png|jpg|jpeg|webp|avif|gif|svg|ico|woff2?|ttf|map)$/i.test(url.pathname)) return null;
    return url.pathname; // Never persist query strings, fragments, or document tokens.
  } catch { return null; }
}

export function safeUrlList(value: unknown): string[] {
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch { return []; }
  }
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(item => httpUrl(typeof item === "string" ? item : item?.url)?.href).filter((url): url is string => !!url))];
}

export function ownCitationUrls(value: unknown): string[] {
  return safeUrlList(value).filter(value => {
    const host = new URL(value).hostname;
    return host === "displayworksmedia.com" || host === "www.displayworksmedia.com";
  });
}

export function citationEvidence(row: { is_cited: boolean; cited_urls: unknown }) {
  const hasOwnUrl = ownCitationUrls(row.cited_urls).length > 0;
  if (row.is_cited && hasOwnUrl) return "recorded";
  if (row.is_cited || hasOwnUrl) return "inconsistent";
  return "not_recorded";
}

export function citationRateLabel(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(1)}%` : "-";
}

export function bangkokDay(value: string): string {
  return new Date(new Date(value).getTime() + 7 * 3600000).toISOString().slice(0, 10);
}

export function aiDateRange(request: Request, now = new Date()) {
  const params = new URL(request.url).searchParams;
  const start = params.get("startDate");
  const end = params.get("endDate");
  const valid = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
  if ((start || end) && (!start || !end || !valid(start) || !valid(end) || start > end)) return null;
  const endDay = end || bangkokDay(now.toISOString());
  const startDay = start || new Date(Date.parse(endDay) - 29 * 86400000).toISOString().slice(0, 10);
  return { startIso: new Date(`${startDay}T00:00:00+07:00`).toISOString(), endIso: new Date(`${endDay}T23:59:59.999+07:00`).toISOString() };
}
