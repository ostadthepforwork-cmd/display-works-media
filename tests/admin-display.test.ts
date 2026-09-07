import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarDate, calendarDays, catalogProfit } from '../src/lib/admin-display';

test('calendar date preserves local calendar fields including Bangkok midnight', () => {
  const old = process.env.TZ;
  try {
    process.env.TZ = 'Asia/Bangkok';
    assert.equal(calendarDate(new Date('2026-09-07T00:00:00+07:00')), '2026-09-07');
  } finally { if (old === undefined) delete process.env.TZ; else process.env.TZ = old; }
});
test('inclusive chart dates preserve both boundaries and leap days', () => {
  const days = calendarDays('2026-08-09', '2026-09-07');
  assert.equal(days.length, 30);
  assert.equal(days[0], '2026-08-09');
  assert.equal(days.at(-1), '2026-09-07');
  assert.deepEqual(calendarDays('2024-02-28', '2024-03-01'), ['2024-02-28', '2024-02-29', '2024-03-01']);
  assert.deepEqual(calendarDays('2026-02-30', '2026-03-01'), []);
  assert.deepEqual(calendarDays('2026-09-08', '2026-09-07'), []);
  assert.equal(calendarDays('2026-01-01', '2026-09-07').length, 250);
});
test('profit distinguishes unknown cost, zero cost and incompatible units', () => {
  assert.equal(catalogProfit({cost:85, price:250, costUnit:'sqm', priceUnit:'piece'}), null);
  assert.equal(catalogProfit({cost:null, price:250}), null);
  assert.equal(catalogProfit({cost:NaN, price:250}), null);
  assert.deepEqual(catalogProfit({cost:0, price:250}), {profit:250, markup:null, margin:100});
  assert.deepEqual(catalogProfit({cost:100, price:250}), {profit:150, markup:150, margin:60});
  assert.deepEqual(catalogProfit({cost:100, price:0}), {profit:-100, markup:-100, margin:null});
});
