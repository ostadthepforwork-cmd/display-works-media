import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChartColumnIncreasing, FileText } from 'lucide-react';
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import { businessTrend } from '@/lib/executive-dashboard';
import { DashboardPeriod, Resolution } from '@/lib/dashboard-period';
import { money, shortDate, rangeText } from './presentation';
import s from './ExecutiveDashboard.module.css';
import { dashboardWaterfall } from '@/lib/dashboard-waterfall';
export const resolutions: Record<Resolution,string> = {auto:'อัตโนมัติ',day:'รายวัน',week:'รายสัปดาห์',month:'รายเดือน',year:'รายปี'};

function useChartSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{width:number;height:number}|null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      const next = width > 0 && height > 0 ? {width, height} : null;
      setSize(previous => previous?.width === next?.width && previous?.height === next?.height ? previous : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return {ref, size};
}

export function Spark({ data, field, red = false }: { data: ReturnType<typeof businessTrend>['buckets']; field: string; red?: boolean }) {
  const {ref, size} = useChartSize();
  const series=data.map(row=>({...row,margin:row.revenue>0?row.gross/row.revenue*100:null,after:row.operating===null?null:row.gross-row.operating}));
  return <div ref={ref} className={s.spark} aria-hidden="true">{size && <LineChart width={size.width} height={size.height} data={series}><Line dataKey={field} stroke={red?'var(--color-negative)':'var(--color-positive)'} strokeWidth={2.25} dot={false} isAnimationActive={false}/></LineChart>}</div>;
}
export function DashboardCharts({ trend, period, resolution, onResolution, onBucket, revenue, cost, gross, operating, after }: {
  trend: ReturnType<typeof businessTrend>; period: DashboardPeriod; resolution: Resolution; onResolution: (r: Resolution)=>void; onBucket:(p:DashboardPeriod)=>void;
  revenue:number; cost:number; gross:number; operating:number|null; after:number|null;
}) {
  const {ref: chartRef, size: chartSize} = useChartSize();
  const {ref: waterfallRef, size: waterfallSize} = useChartSize();
  const [showData,setShowData]=useState(false),[selected,setSelected]=useState(0);
  const [metric,setMetric]=useState<'all'|'revenue'|'gross'|'operating'>('all');
  const bucket=trend.buckets[Math.min(selected,trend.buckets.length-1)];
  const financial=dashboardWaterfall(revenue,cost,gross,operating,after);
  return <div className={s.analytics}>
    <section className={s.section}><div className={s.sectionHead}><h2><ChartColumnIncreasing size={20} className={s.green}/>แนวโน้มธุรกิจ</h2><select aria-label="ความละเอียดกราฟ" value={resolution} onChange={e=>{onResolution(e.target.value as Resolution);setSelected(0);}}>{Object.entries(resolutions).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
      <div className={s.chartTabs} aria-label="ชุดข้อมูลกราฟ">{([['all','ทั้งหมด'],['revenue','ยอดใบเสร็จ'],['gross','กำไรขั้นต้น'],['operating','ค่าใช้จ่าย']] as const).map(([key,label])=><button key={key} aria-pressed={metric===key} onClick={()=>setMetric(key)}>{label}</button>)}</div>
      <div className={s.legend}><span><i className={s.dotGreen}/>ยอดใบเสร็จ</span><span><i className={s.dotBlue}/>กำไรขั้นต้นประมาณการ</span><span><i className={s.dotRed}/>Operating</span><small>{resolutions[trend.resolution]}</small></div>
      <div ref={chartRef} className={s.chart} aria-label="กราฟแนวโน้มธุรกิจ">{chartSize && <ComposedChart width={chartSize.width} height={chartSize.height} data={trend.buckets} margin={{top:12,right:18,left:0,bottom:0}} accessibilityLayer>
        <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 4" vertical={false}/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill:'var(--color-ink-muted)',fontSize:11}} tickFormatter={v=>String(v).length===10?shortDate(String(v)):String(v)} minTickGap={24}/><YAxis width={56} axisLine={false} tickLine={false} tick={{fill:'var(--color-ink-muted)',fontSize:11}} tickFormatter={v=>Intl.NumberFormat('en',{notation:'compact'}).format(Number(v))}/><ReferenceLine y={0} stroke="var(--color-rule-strong)"/>
        <Tooltip contentStyle={{background:'var(--color-paper-strong)',border:'1px solid var(--color-rule)',borderRadius:8,color:'var(--color-ink)',boxShadow:'0 12px 30px var(--color-panel-shadow)',fontSize:12}} formatter={v=>money(Number(v))} labelFormatter={label=>String(label)}/>
        <Area type="monotone" dataKey="revenue" fill="var(--color-accent-soft)" stroke="none" tooltipType="none" legendType="none" hide={metric!=='all'&&metric!=='revenue'} isAnimationActive={false}/>
        <Line type="monotone" name="ยอดใบเสร็จ" dataKey="revenue" stroke="var(--color-accent)" strokeWidth={3} dot={false} activeDot={{r:5,fill:'var(--color-accent)',stroke:'var(--color-paper-strong)',strokeWidth:2}} hide={metric!=='all'&&metric!=='revenue'} isAnimationActive={false}/>
        <Line type="monotone" name="กำไรขั้นต้นประมาณการ" dataKey="gross" stroke="var(--color-chart-neutral)" strokeWidth={2.25} dot={false} activeDot={{r:4}} hide={metric!=='all'&&metric!=='gross'} isAnimationActive={false}/>
        <Line type="monotone" name="ค่าใช้จ่ายดำเนินงาน" dataKey="operating" stroke="var(--color-negative)" strokeWidth={2} dot={false} activeDot={{r:4}} hide={metric!=='all'&&metric!=='operating'} isAnimationActive={false}/>
      </ComposedChart>}</div>
      <div className={s.chartActions}><button aria-expanded={showData} onClick={()=>setShowData(v=>!v)}><FileText size={15}/>ข้อมูลกราฟ</button>{showData&&<select aria-label="ช่วงข้อมูลกราฟ" value={Math.min(selected,trend.buckets.length-1)} onChange={e=>setSelected(Number(e.target.value))}>{trend.buckets.map((row,i)=><option key={row.from} value={i}>{row.from} – {row.to}</option>)}</select>}</div>
      {showData&&bucket&&<div className={s.chartDetail}><span>ยอดใบเสร็จ <b>{money(bucket.revenue)}</b></span><span>ต้นทุน <b>{money(bucket.cost)}</b></span><span>กำไรประมาณการ <b>{money(bucket.gross)}</b></span><span>Operating <b>{money(bucket.operating)}</b></span><button onClick={()=>onBucket({from:bucket.from,to:bucket.to})}>ดูเอกสาร<ArrowRight size={14}/></button></div>}
    </section>
    <section className={s.section}><div className={s.sectionHead}><h2><ChartColumnIncreasing size={20} className={s.blue}/>โครงสร้างผลประมาณการ</h2></div><p className={s.subtitle}>{rangeText(period)}</p>
      <div ref={waterfallRef} className={s.waterfall} aria-label="Waterfall โครงสร้างกำไร">{waterfallSize && <BarChart width={waterfallSize.width} height={waterfallSize.height} data={financial} margin={{top:14,right:8,left:0,bottom:0}} accessibilityLayer>
        <CartesianGrid stroke="var(--color-chart-grid)" vertical={false}/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill:'var(--color-ink-muted)',fontSize:10}} interval={0}/><YAxis width={44} axisLine={false} tickLine={false} tick={{fill:'var(--color-ink-muted)',fontSize:10}} tickFormatter={v=>Intl.NumberFormat('en',{notation:'compact'}).format(Number(v))}/>
        <ReferenceLine y={0} stroke="var(--color-rule-strong)"/><Tooltip cursor={{fill:'var(--color-paper-soft)'}} contentStyle={{background:'var(--color-paper-strong)',border:'1px solid var(--color-rule)',borderRadius:8,color:'var(--color-ink)',boxShadow:'0 12px 30px var(--color-panel-shadow)'}} formatter={(_value,_name,item)=>money(item.payload.amount)} />
        <Bar dataKey="range" name="จำนวนเงิน" maxBarSize={48} radius={[5,5,2,2]} isAnimationActive={false}>{financial.map(row=><Cell key={row.label} fill={row.kind==='deduction'?'var(--color-negative)':row.kind==='subtotal'?'var(--color-chart-neutral)':'var(--color-accent)'}/>)}</Bar>
      </BarChart>}</div>
      <dl className={s.waterfallValues}>{financial.map(row=><div key={row.label}><dt>{row.label}</dt><dd className={row.amount!==null&&row.amount<0?s.negative:''}>{money(row.amount)}</dd></div>)}</dl>
      <p className={s.footnote}>ฐานรวม VAT · ผลประมาณการ ไม่ใช่กำไรสุทธิ · ไม่หัก Direct ซ้ำ</p>
    </section>
  </div>;
}
