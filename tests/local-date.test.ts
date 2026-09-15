import assert from "node:assert/strict";
import test from "node:test";
import { formatLocalDateInput, shiftDateInput } from "../src/lib/local-date";

test("formats calendar dates without converting them to UTC", () => {
  assert.equal(formatLocalDateInput(new Date(2026, 8, 15, 0, 0, 0)), "2026-09-15");
});

test("shifts date inputs across month and year boundaries", () => {
  assert.equal(shiftDateInput("2026-09-01", -1), "2026-08-31");
  assert.equal(shiftDateInput("2026-12-31", 1), "2027-01-01");
});
