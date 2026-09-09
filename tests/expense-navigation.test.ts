import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/app/admin/page.tsx', import.meta.url), 'utf8');
test('desktop and mobile expense menus have a distinct destination', () => {
  assert.equal((source.match(/id: "expenses", icon:/g) || []).length, 2);
  assert.doesNotMatch(source, /id: "quick-expense", target: "receipt"/);
  assert.match(source, /erpPage === "expenses" && <ExpensePage/);
});
