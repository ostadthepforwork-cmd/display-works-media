import test from "node:test";
import assert from "node:assert/strict";
import { readCrawlerPages } from "../src/lib/crawler-pagination";

test("crawler totals read beyond the first 1000 rows", async () => {
  const source = Array.from({ length: 1201 }, (_, id) => ({ id }));
  const ranges: number[][] = [];
  const result = await readCrawlerPages(async (from, to) => {
    ranges.push([from, to]);
    return { data: source.slice(from, to + 1), error: null };
  });
  assert.equal(result.error, null);
  assert.deepEqual(result.data, source);
  assert.deepEqual(ranges, [[0, 499], [500, 999], [1000, 1499]]);
});

test("failed later pages never return a partial total", async () => {
  const result = await readCrawlerPages(async (from) => from === 0
    ? { data: Array.from({ length: 500 }, (_, id) => ({ id })), error: null }
    : { data: null, error: { message: "unavailable" } });
  assert.equal(result.data, null);
  assert.equal(result.error?.message, "unavailable");
});

test("very large ranges fail explicitly instead of reporting capped totals", async () => {
  let calls = 0;
  const result = await readCrawlerPages(async () => {
    calls++;
    return { data: Array.from({ length: 500 }, (_, id) => ({ id })), error: null };
  });
  assert.equal(calls, 40);
  assert.equal(result.data, null);
  assert.match(result.error?.message || "", /shorter date range/);
});
