import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Search, X } from 'lucide-react';
import { ExecutiveDocument, executiveModel, productKey } from '@/lib/executive-dashboard';
import { DashboardPeriod } from '@/lib/dashboard-period';
import { money, shortDate, rangeText, statuses } from './presentation';
import s from './ExecutiveDashboard.module.css';
export type Detail = {title:string;rows:ExecutiveDocument[];product?:ReturnType<typeof executiveModel>['products'][number];note?:string;range?:DashboardPeriod;comparisonRows?:ExecutiveDocument[]};
export function DashboardDetail({detail,period,priorPeriod,onClose,onDocument}:{detail:Detail;period:DashboardPeriod;priorPeriod:DashboardPeriod|null;onClose:()=>void;onDocument:(type:string,id:string)=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const [page,setPage]=useState(0),[query,setQuery]=useState('');
  useEffect(()=>{const node=dialog.current;node?.showModal();return()=>node?.close();},[]);
  const rows=detail.rows.filter(doc=>`${doc.docNo} ${doc.customerName}`.toLowerCase().includes(query.toLowerCase()));
  const pages=Math.max(1,Math.ceil(rows.length/10)),shown=Math.min(page,pages-1);
  const close=()=>{dialog.current?.close();onClose();};
  return <dialog ref={dialog} className={s.dialog} onCancel={onClose} aria-labelledby="dashboard-detail-title"><header className={s.sectionHead}><h2 id="dashboard-detail-title">{detail.title}</h2><button aria-label="ปิดรายละเอียด" onClick={close}><X size={20}/></button></header><p className={s.subtitle}>{rangeText(detail.range||period)}</p>{detail.note&&<p>{detail.note}</p>}
    {detail.product&&<><div className={s.detailMetrics}>{[['จำนวนงาน',detail.product.documentIds.length],['ลูกค้า',detail.product.customers.length],['ยอดขาย',money(detail.product.revenue)],['ต้นทุน',money(detail.product.cost)],['กำไรประมาณการ',money(detail.product.revenue-detail.product.cost)],['ยอดขายเฉลี่ยต่องาน',money(detail.product.revenue/Math.max(1,detail.product.documentIds.length))]].map(([label,value])=><div key={label}><small>{label}</small><b>{value}</b></div>)}</div><p className={s.footnote}>ฐานรายการสินค้า ก่อนส่วนลดเอกสาร · {detail.product.key.startsWith('id:')?'รหัสสินค้า':'ข้อมูลเดิมจัดกลุ่มตามชื่อ'}</p></>}
    {detail.comparisonRows&&priorPeriod&&<details><summary>ช่วงเปรียบเทียบ {rangeText(priorPeriod)} · {detail.comparisonRows.length} เอกสาร</summary><div className={s.comparisonRows}>{detail.comparisonRows.map(doc=><div key={doc.id}><span>{doc.docNo} · {shortDate(doc.date)}</span><b>{money(doc.revenue)}</b></div>)}</div></details>}
    <label className={s.search}><Search size={16}/><input aria-label="ค้นหาในรายละเอียด" placeholder="ค้นหาเลขเอกสารหรือลูกค้า" value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}}/></label>
    {rows.slice(shown*10,shown*10+10).map(doc=><article className={s.detailRecord} key={doc.id}><div className={s.sectionHead}><b>{doc.docNo}</b><span className={s.badge}>{statuses[doc.status]||doc.status}</span></div><p>{doc.customerName} · {shortDate(doc.date)}</p><div className={s.detailMetrics}><div><small>ยอดเอกสาร</small><b>{money(doc.revenue)}</b></div><div><small>ต้นทุนประมาณการ</small><b>{money(doc.estimatedCost)}</b></div><div><small>ยอดค้างชำระ</small><b>{money(doc.balanceDue)}</b></div></div>
      <ul className={s.itemList}>{doc.items.filter(item=>!detail.product||productKey(item)===detail.product.key).map((item,i)=><li key={i}><span>{item.name}</span><b>{money(item.revenue)}</b></li>)}</ul><button onClick={()=>{close();onDocument(doc.type,doc.id);}}>เปิดเอกสาร {doc.docNo}<ArrowRight size={15}/></button></article>)}
    {!rows.length&&<p className={s.empty}>ไม่พบรายการ</p>}<footer className={s.sectionHead}><button onClick={close}><ArrowLeft size={15}/>กลับ Dashboard</button><div className={s.pager}><button aria-label="รายละเอียดหน้าก่อน" disabled={shown===0} onClick={()=>setPage(shown-1)}><ArrowLeft size={15}/></button><span>{shown+1} / {pages}</span><button aria-label="รายละเอียดหน้าถัดไป" disabled={shown+1===pages} onClick={()=>setPage(shown+1)}><ArrowRight size={15}/></button></div></footer>
  </dialog>;
}
