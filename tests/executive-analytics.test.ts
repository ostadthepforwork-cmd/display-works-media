import test from 'node:test';
import assert from 'node:assert/strict';
import { comparisonPeriod, comparisonFromSearch, reportResolution } from '../src/lib/dashboard-period';
import { businessTrend, financialReport, metricDelta, executiveModel, ExecutiveDocument } from '../src/lib/executive-dashboard';
import { readFileSync } from 'node:fs';
const period={from:'2026-09-01',to:'2026-09-10'};
const doc:ExecutiveDocument={id:'a',type:'receipt',date:period.from,dueDate:'',status:'draft',deleted:false,docNo:'RC',customerName:'Synthetic',revenue:1100,estimatedCost:500,uncertainCost:false,balanceDue:0,items:[{productId:'p',name:'Print',revenue:1100,cost:500}]};
const expense={expense_date:period.from,total_amount:'100.00',payment_status:'paid',voided_at:null,category_id:'ad',expense_class:'operating'};
test('comparisons have explicit calendar boundaries, leap clamping and validated URL modes',()=>{
  assert.deepEqual(comparisonPeriod(period,'previous'),{from:'2026-08-22',to:'2026-08-31'});
  assert.deepEqual(comparisonPeriod(period,'month'),{from:'2026-08-01',to:'2026-08-31'});
  assert.deepEqual(comparisonPeriod({from:'2024-02-29',to:'2024-03-02'},'year'),{from:'2023-02-28',to:'2023-03-02'});
  assert.equal(comparisonPeriod(period,'none'),null);
  assert.equal(comparisonFromSearch('?erpCompare=invalid'),'previous');
});
test('delta handles zero and negative bases without deceptive percentages; margin uses points',()=>{
  assert.deepEqual(metricDelta(120,100),{difference:20,percent:20,points:null});
  assert.equal(metricDelta(50,0)?.percent,null);assert.equal(metricDelta(-20,-40)?.percent,null);
  assert.equal(metricDelta(null,2),null);assert.equal(metricDelta(Infinity,2),null);
  assert.equal(metricDelta(48,45,true)?.points,3);
});
test('estimated financial identity subtracts operating only; excludes voids and preserves archived rows',()=>{
  const report=financialReport([doc],[expense,{...expense,expense_class:'direct',total_amount:'500.00'},{...expense,voided_at:'2026-09-02',total_amount:'900.00'}],{ad:'Ads'},period);
  assert.equal(report.revenue,1100);assert.equal(report.gross,600);assert.equal(report.operating,100);assert.equal(report.after,500);assert.equal(report.actual.total,'600.00');
  assert.equal(financialReport([doc],[{...expense,total_amount:'0.00'}],{},period).after,600);
  assert.throws(()=>financialReport([doc],[{...expense,total_amount:'invalid'}],{},period));
});
test('all chart resolutions conserve totals, include expense-only days and show negative gross',()=>{
  const documents=[doc,{...doc,id:'b',date:'2026-09-05',revenue:100,estimatedCost:200}];
  for(const resolution of ['auto','day','week','month','year'] as const){
    const trend=businessTrend(documents,[{...expense,expense_date:'2026-09-10'}],period,resolution);
    assert.equal(trend.buckets.reduce((s,r)=>s+r.revenue,0),1200);
    assert.equal(trend.buckets.reduce((s,r)=>s+r.gross,0),500);
    assert.equal(trend.buckets.reduce((s,r)=>s+(r.operating||0),0),100);
  }
  assert.equal(businessTrend(documents,null,period,'day').buckets[4].gross,-100);
  assert.equal(businessTrend(documents,null,period,'day').buckets[4].operating,null);
  assert.equal(reportResolution({from:'2020-01-01',to:'2026-12-31'},'day'),'year');
});
test('stable product IDs separate identical names and survive rename; legacy names are trimmed',()=>{
  const model=executiveModel([doc,{...doc,id:'b',items:[{productId:'p',name:'Renamed',revenue:20,cost:10},{productId:'q',name:'Print',revenue:30,cost:20},{name:'Legacy ',revenue:50,cost:10},{name:'Legacy',revenue:20,cost:10}]}],period);
  assert.equal(model.products.length,3);
  assert.equal(model.products.find(p=>p.key==='id:p')?.documentIds.length,2);
  assert.equal(model.products.find(p=>p.key==='name:Legacy')?.revenue,70);
});
test('drill-down adapters preserve period, category/class and exact document ID without auto-saving',()=>{
  const page=readFileSync('src/app/admin/page.tsx','utf8'),expensePage=readFileSync('src/app/admin/expenses/ExpensePage.tsx','utf8');
  assert.match(page,/d\.id === dashboardDocumentId/);assert.match(page,/initialFocus=\{dashboardEntry \? dashboardExpenseFocus/);
  assert.match(expensePage,/categoryId: initialFocus\?\.category/);assert.match(expensePage,/state: 'report'/);
  const drawer=readFileSync('src/app/admin/dashboard/DashboardDetail.tsx','utf8');assert.match(drawer,/onDocument\(doc.type,doc.id\)/);assert.doesNotMatch(drawer,/saveErpExpense|\.rpc\(|\.insert\(/);
});
