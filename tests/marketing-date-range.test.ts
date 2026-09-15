import assert from "node:assert/strict";
import test from "node:test";
import { bangkokDateFromTimestamp, marketingDateRangeFromUrl } from "../src/lib/marketing-date-range";

test("marketing API range includes complete Bangkok calendar days", () => {
  const range = marketingDateRangeFromUrl("https://example.test?startDate=2026-09-01&endDate=2026-09-10");
  assert.deepEqual(range.period, { from: "2026-09-01", to: "2026-09-10" });
  assert.equal(range.startIso, "2026-08-31T17:00:00.000Z");
  assert.equal(range.endExclusiveIso, "2026-09-10T17:00:00.000Z");
});

test("Bangkok daily grouping does not use the UTC calendar date", () => {
  assert.equal(bangkokDateFromTimestamp("2026-09-14T18:30:00.000Z"), "2026-09-15");
});

test("invalid marketing date ranges fall back to 30 Bangkok days", () => {
  const range = marketingDateRangeFromUrl(
    "https://example.test?startDate=2026-09-10&endDate=2026-09-01",
    new Date("2026-09-15T03:00:00.000Z"),
  );
  assert.deepEqual(range.period, { from: "2026-08-17", to: "2026-09-15" });
});
