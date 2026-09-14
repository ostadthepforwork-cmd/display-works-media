import test from 'node:test';
import assert from 'node:assert/strict';
import { quickPeriod, validPeriod, shiftDate, previousPeriod, periodFromSearch, periodSearch, completePages } from '../src/lib/dashboard-period';
import { ExecutiveDocument, executiveModel } from '../src/lib/executive-dashboard';
test('Bangkok calendar, leap dates and URL preserve validated range and other parameters', () => {
  assert.equal(validPeriod({ from: '2026-02-29', to: '2026-03-01' }), false);
  assert.equal(shiftDate('2024-02-28', 1), '2024-02-29');
  assert.deepEqual(quickPeriod('month','2026-09-10'), { from:'2026-09-01',to:'2026-09-10' });
  assert.deepEqual(previousPeriod({from:'2026-09-01',to:'2026-09-10'}), {from:'2026-08-22',to:'2026-08-31'});
  const range = {from:'2026-08-01',to:'2026-08-31'};
  const query = periodSearch('?tab=erp', range);
  assert(query.includes('tab=erp')); assert.deepEqual(periodFromSearch(query),range);
});
test('all executive sections use the same range and preserve receipt eligibility', () => {
  const row: ExecutiveDocument = {id:'a',type:'receipt',date:'2026-09-01',dueDate:'',status:'draft',deleted:false,docNo:'RC1',customerName:'Synthetic',revenue:1100,estimatedCost:500,uncertainCost:true,balanceDue:0,items:[{name:'Print',revenue:1100,cost:500}]};
  const model = executiveModel([row,{...row,id:'old',date:'2026-08-31'},{...row,id:'void',status:'cancelled'}, {...row,id:'q',type:'quote'}, {...row,id:'i',type:'invoice',dueDate:'2026-09-02',balanceDue:100}],{from:'2026-09-01',to:'2026-09-10'},'2026-09-10');
  assert.equal(model.revenue,1100); assert.equal(model.cost,500); assert.equal(model.gross,600);
  assert.equal(model.pending.length,1); assert.equal(model.overdue.length,1);
  assert.equal(model.products[0].revenue,1100); assert.equal(model.selected.length,3);
  assert.equal(model.trend.reduce((sum,r)=>sum+r.revenue,0),model.revenue);
  assert.equal(model.uncertain,1); assert.equal(model.recent.length,3);
});
test('complete reads handle more than one page and reject truncation or changing counts', async () => {
  const rows = Array.from({length:1201},(_,id)=>({id:String(id)}));
  assert.equal((await completePages(async(from,to)=>({data:rows.slice(from,to+1),count:rows.length,error:null}),r=>r.id)).data.length,1201);
  await assert.rejects(completePages(async()=>({data:rows.slice(0,10),count:1201,error:null}),r=>r.id));
  await assert.rejects(completePages(async(from,to)=>({data:rows.slice(from,to+1),count:from ? 1202 : 1201,error:null}),r=>r.id));
  await assert.rejects(completePages(async()=>({data:null,count:null,error:new Error('denied')}),r=>String(r)));
});
