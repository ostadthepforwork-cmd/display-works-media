const ALLOWED_IMAGE_HOSTS = new Set([
  "qlxxqrpsyjdsiyjnabjb.supabase.co",
  "displayworksmedia.com",
  "www.displayworksmedia.com",
]);

const LOCAL_IMAGE_PREFIXES = [
  "images/",
  "uploads/",
  "blog/",
  "portfolio/",
  "services/",
];

export function safeImageSrc(src?: string | null) {
  if (!src) return "";
  const value = String(src)
    .trim()
    .replace(/&amp;/g, "&")
    .replace(/^['"]|['"]$/g, "");
  if (!value) return "";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (LOCAL_IMAGE_PREFIXES.some((prefix) => value.toLowerCase().startsWith(prefix))) {
    return `/${value}`;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "";
    return ALLOWED_IMAGE_HOSTS.has(url.hostname) ? url.toString() : "";
  } catch {
    return "";
  }
}
