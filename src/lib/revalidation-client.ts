export type RevalidationResult =
  | { ok: true; paths: string[] }
  | { ok: false; error: string };

export async function requestBlogRevalidation(
  slug?: string,
  fetcher: typeof fetch = fetch,
): Promise<RevalidationResult> {
  try {
    const response = await fetcher("/api/revalidate", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: slug?.trim() || undefined }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.ok !== true) {
      return { ok: false, error: payload?.error || `Revalidation failed (${response.status})` };
    }
    return { ok: true, paths: Array.isArray(payload.revalidated) ? payload.revalidated : [] };
  } catch {
    return { ok: false, error: "Revalidation request failed" };
  }
}
