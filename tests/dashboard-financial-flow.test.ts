import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dashboardWaterfall} from '../src/lib/dashboard-waterfall';

test('financial flow preserves the exact screenshot totals and distinguishes zero from unknown',()=>{
  const rows=dashboardWaterfall(99884.07,45257.65,54626.42,0,54626.42);
  assert.deepEqual(rows.map(row=>row.amount),[99884.07,-45257.65,54626.42,-0,54626.42]);
  assert.equal(dashboardWaterfall(100,50,50,null,null)[3].amount,null);
});

test('financial flow is readable without hover, uses Thai labels and retains estimate caveat',()=>{
  const source=readFileSync('src/app/admin/dashboard/DashboardCharts.tsx','utf8');
  assert.match(source,/<ol className=\{s.financialFlow\}>/);
  assert.match(source,/หักต้นทุนประมาณการ/);
  assert.match(source,/หักค่าใช้จ่ายดำเนินงาน/);
  assert.match(source,/row.amount === null \? 'ยังไม่มีข้อมูล'/);
  assert.match(source,/row.amount === 0 \? 0 : row.amount/);
  assert.match(source,/ไม่ใช่กำไรสุทธิ/);
  assert.doesNotMatch(source,/<BarChart/);
});
