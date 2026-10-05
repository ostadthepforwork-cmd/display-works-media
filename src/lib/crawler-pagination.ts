type PageResult<T> = { data: T[] | null; error: { message: string } | null };

export async function readCrawlerPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
) {
  const pageSize = 500;
  const maxPages = 40;
  const rows: T[] = [];
  for (let page = 0; page < maxPages; page++) {
    const result = await fetchPage(page * pageSize, (page + 1) * pageSize - 1);
    if (result.error) return { data: null, error: result.error };
    const batch = result.data || [];
    rows.push(...batch);
    if (batch.length < pageSize) return { data: rows, error: null };
  }
  return { data: null, error: { message: "Crawler range is too large; select a shorter date range" } };
}
