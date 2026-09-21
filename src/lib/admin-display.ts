export type CrawlerCategory = "ai" | "search" | "social" | "other";

export function maskContactName(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return "";
  return `${text.slice(0, 1)}${"*".repeat(Math.min(4, Math.max(2, text.length - 1)))}`;
}

export function maskPhone(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return "";
  const digits = text.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return `•••-•••-${digits.slice(-4)}`;
}

export function maskEmail(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return "";
  const [local, domain] = text.split("@");
  if (!domain) return `${text.slice(0, 1)}***`;
  return `${local.slice(0, 1) || "*"}***@${domain}`;
}

export function maskTaxId(value: unknown) {
  const text = String(value || "").replace(/\D/g, "");
  if (!text) return "";
  return `${"*".repeat(Math.max(4, text.length - 4))}${text.slice(-4)}`;
}

export function classifyCrawler(value: unknown): CrawlerCategory {
  const name = String(value || "").toLowerCase();
  if (/facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|slackbot/.test(name)) return "social";
  if (/gptbot|chatgpt|oai-searchbot|claudebot|anthropic|perplexity|cohere|bytespider|youbot/.test(name)) return "ai";
  if (/googlebot|googleother|bingbot|applebot|duckduckbot|yandex|baiduspider/.test(name)) return "search";
  return "other";
}

export function crawlerCategoryLabel(category: CrawlerCategory) {
  return {
    ai: "AI assistant",
    search: "Search crawler",
    social: "Social preview",
    other: "Other crawler",
  }[category];
}
