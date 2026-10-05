import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('dashboard chart dimensions come from a positive observed container', async () => {
  const source = await readFile(new URL('../src/app/admin/dashboard/DashboardCharts.tsx', import.meta.url), 'utf8');
  assert.match(source, /width > 0 && height > 0/);
  assert.match(source, /new ResizeObserver\(measure\)/);
  assert.match(source, /observer\.disconnect\(\)/);
  assert.match(source, /chartSize && <ComposedChart width=/);
  assert.match(source, /waterfallSize && <BarChart width=/);
  assert.doesNotMatch(source, /ResponsiveContainer/);
});
