export function normalizeBlogSlug(slug: string | null | undefined) {
  return String(slug || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

export function blogSlugCandidates(slug: string | null | undefined) {
  const normalized = normalizeBlogSlug(slug);
  return normalized ? [normalized, `/${normalized}`] : [];
}

export function blogPostPath(slug: string | null | undefined) {
  const normalized = normalizeBlogSlug(slug);
  return normalized ? `/blog/${normalized}` : "/blog";
}
