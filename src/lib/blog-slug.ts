const BLOG_SLUG_PATTERN = /^[\p{L}\p{M}\p{N}]+(?:[-_][\p{L}\p{M}\p{N}]+)*$/u;

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

export function createCanonicalBlogSlug(value: string | null | undefined, maxLength = 200) {
  const normalized = String(value || "")
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/[^\p{L}\p{M}\p{N}\s_-]+/gu, "")
    .replace(/[\s_-]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return Array.from(normalized)
    .slice(0, maxLength)
    .join("")
    .replace(/-+$/g, "");
}

export function blogSlugCandidates(slug: string | null | undefined) {
  const normalized = normalizeBlogSlug(slug);
  return normalized ? [normalized, `/${normalized}`] : [];
}

export function blogPostPath(slug: string | null | undefined) {
  const normalized = normalizeBlogSlug(slug);
  return normalized ? `/blog/${normalized}` : "/blog";
}

export function isCanonicalBlogSlug(value: string) {
  return (
    value.length > 0 &&
    value.length <= 200 &&
    value === value.normalize("NFC") &&
    BLOG_SLUG_PATTERN.test(value)
  );
}
