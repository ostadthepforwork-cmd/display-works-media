import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardWaterfall } from '../src/lib/dashboard-waterfall';

test('waterfall floats deductions between running balances without changing financial amounts',()=>{
  const rows=dashboardWaterfall(640000,260000,380000,83000,297000);
  assert.deepEqual(rows.map(row=>row.range),[[0,640000],[380000,640000],[0,380000],[297000,380000],[0,297000]]);
  assert.deepEqual(rows.map(row=>row.amount),[640000,-260000,380000,-83000,297000]);
});
test('waterfall supports losses and unavailable operating data',()=>{
  const loss=dashboardWaterfall(100,150,-50,20,-70);
  assert.deepEqual(loss[1].range,[-50,100]);
  assert.deepEqual(loss[3].range,[-70,-50]);
  assert.deepEqual(loss[4].range,[-70,0]);
  const missing=dashboardWaterfall(100,50,50,null,null);
  assert.equal(missing[3].range,null);
  assert.equal(missing[4].amount,null);
});
