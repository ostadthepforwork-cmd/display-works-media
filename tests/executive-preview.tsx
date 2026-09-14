import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import ExecutiveDashboard from '../src/app/admin/dashboard/ExecutiveDashboard';
import { periodFromSearch, periodSearch } from '../src/lib/dashboard-period';
import ErpNavigation from '../src/app/admin/dashboard/ErpNavigation';
import { documents } from './executive-fixtures.cjs';
const doc = {id:'synthetic',type:'receipt',date:'2026-09-10',dueDate:'',status:'approved',deleted:false,docNo:'SYNTHETIC-RC',customerName:'Synthetic',revenue:1100,estimatedCost:500,uncertainCost:false,balanceDue:0,items:[{name:'Synthetic print',revenue:1100,cost:500}]};
function App() {
  const [period, setPeriod] = useState(() => periodFromSearch(location.search, {from:'2026-09-01',to:'2026-09-10'}));
  const [list,setList] = useState('');
  const fixture = new URLSearchParams(location.search).get('fixture');
  const rows = fixture === 'empty' ? [] : fixture === 'single' ? [doc] : documents;
  return <><header className="preview-nav"><img src="/images/logo.png" alt="Display Works" width="32" height="28"/><b>Display Works</b><span>Home</span><strong>ERP</strong><span>CMS</span><span>Marketing</span><small>ข้อมูลจำลอง · ไม่เชื่อม production</small></header><div className="preview-layout"><aside><ErpNavigation page={list||'dashboard'} onPage={page=>setList(page==='dashboard'?'':page)} counts={{quote:1,invoice:1,receipt:20}}/></aside><div className="preview-main">{list?<><p>{list} {period.from} {period.to}</p><button onClick={()=>setList('')}>Back</button></>:<ExecutiveDashboard key={`${period.from}/${period.to}`} documents={rows} period={period} loadedAt="2026-09-10T00:00:00Z" onPeriod={next=>{setPeriod(next);history.replaceState(null,'',`?${periodSearch(location.search,next)}`);}} onDocuments={(type,id)=>setList(`${type}${id?`:${id}`:''}`)} onExpenses={focus=>setList(`expenses:${JSON.stringify(focus||{})}`)} />}</div></div></>;
}
createRoot(document.getElementById('root')!).render(<App />);
