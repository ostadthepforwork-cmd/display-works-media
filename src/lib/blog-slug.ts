export function normalizeBlogSlug(slug: string | null | undefined) {
  let normalized = String(slug || "")
    .trim()
    .replace(/&amp;/g, "&")
    .replace(/^['"]+|['"]+$/g, "");

  try {
    if (/^https?:\/\//i.test(normalized)) {
      normalized = new URL(normalized).pathname;
    }
  } catch {
    // Fall back to treating the value as a plain slug.
  }

  normalized = normalized
    .split(/[?#]/)[0]
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  while (/^blog\//i.test(normalized)) {
    normalized = normalized.replace(/^blog\/+/i, "");
  }

  return normalized;
}

export function blogSlugCandidates(slug: string | null | undefined) {
  const normalized = normalizeBlogSlug(slug);
  return normalized ? [normalized, `/${normalized}`] : [];
}

export function blogPostPath(slug: string | null | undefined) {
  const normalized = normalizeBlogSlug(slug);
  return normalized ? `/blog/${normalized}` : "/blog";
}
