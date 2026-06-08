const ALLOWED_IMAGE_HOSTS = new Set([
  "qlxxqrpsyjdsiyjnabjb.supabase.co",
  "displayworksmedia.com",
  "www.displayworksmedia.com",
]);

export function safeImageSrc(src?: string | null) {
  if (!src) return "";
  const value = String(src).trim();
  if (!value) return "";
  if (value.startsWith("/") && !value.startsWith("//")) return value;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "";
    return ALLOWED_IMAGE_HOSTS.has(url.hostname) ? value : "";
  } catch {
    return "";
  }
}
