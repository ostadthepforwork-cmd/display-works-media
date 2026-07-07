"use client";

import { useEffect, useMemo, useState } from "react";

type MarketingKpiDashboardProps = {
  documents?: any[];
  customers?: any[];
  products?: any[];
  totalRevenue?: number;
  totalCost?: number;
  totalProfit?: number;
  showToast?: (message: string, type?: string) => void;
};

type Campaign = {
  id: string;
  name: string;
  channel: string;
  status: "active" | "planning" | "paused" | "completed";
  spend: number;
  leads: number;
  conversions: number;
  revenue: number;
  note: string;
};

type Lead = {
  id: string;
  date?: string;
  name: string;
  contact?: string;
  source: string;
  campaign?: string;
  adSet?: string;
  creative?: string;
  service: string;
  customerType?: string;
  buyingSituation?: string;
  behaviorTags?: string[];
  status: "new" | "contacted" | "waiting_detail" | "detail_completed" | "quotation_sent" | "follow_up" | "waiting_payment" | "closed_won" | "closed_lost" | "not_qualified";
  value: number;
  nextFollowUp?: string;
  owner?: string;
  note?: string;
};

type MarketingSection =
  | "dashboard"
  | "facebook"
  | "leads"
  | "customers"
  | "quotations"
  | "orders"
  | "products"
  | "campaigns"
  | "budget"
  | "funnel"
  | "channels"
  | "insight"
  | "reports"
  | "sources"
  | "settings";

const storageKeys = {
  campaigns: "dwm_marketing_campaigns_v3",
  leads: "dwm_marketing_leads_v3",
};

const defaultCampaigns: Campaign[] = [
  {
    id: "camp-line-vinyl",
    name: "Vinyl Banner LINE Inquiry",
    channel: "Facebook Ads",
    status: "active",
    spend: 0,
    leads: 0,
    conversions: 0,
    revenue: 0,
    note: "แคมเปญรับบรีฟงานป้ายไวนิลและป้ายหน้าร้าน",
  },
  {
    id: "camp-organic-sticker",
    name: "Sticker Content SEO",
    channel: "Organic",
    status: "planning",
    spend: 0,
    leads: 0,
    conversions: 0,
    revenue: 0,
    note: "บทความและหน้าบริการสำหรับสติ๊กเกอร์ฉลากสินค้า",
  },
];

const defaultLeads: Lead[] = [
  {
    id: "lead-1",
    date: new Date().toISOString().slice(0, 10),
    name: "ลูกค้า LINE",
    contact: "@line",
    source: "LINE OA",
    campaign: "Vinyl Banner LINE Inquiry",
    service: "ป้ายไวนิล",
    customerType: "ร้านอาหาร",
    buyingSituation: "ต้องการงานด่วน",
    behaviorTags: ["มีขนาดแล้ว", "มีวันใช้งานชัดเจน"],
    status: "detail_completed",
    value: 0,
    nextFollowUp: new Date().toISOString().slice(0, 10),
    owner: "Admin",
  },
  {
    id: "lead-2",
    date: new Date().toISOString().slice(0, 10),
    name: "ลูกค้าเว็บไซต์",
    contact: "Website Form",
    source: "Website",
    service: "สติ๊กเกอร์",
    customerType: "SME",
    buyingSituation: "กำลังเปรียบเทียบราคา",
    behaviorTags: ["ยังไม่รู้ขนาด"],
    status: "new",
    value: 0,
    owner: "Admin",
  },
];

const leadStatuses = [
  { value: "new", label: "New Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "waiting_detail", label: "Waiting for Detail" },
  { value: "detail_completed", label: "Detail Completed" },
  { value: "quotation_sent", label: "Quotation Sent" },
  { value: "follow_up", label: "Follow-up" },
  { value: "waiting_payment", label: "Waiting Payment" },
  { value: "closed_won", label: "Closed Won" },
  { value: "closed_lost", label: "Closed Lost" },
  { value: "not_qualified", label: "Not Qualified" },
] as const;

const behaviorTagOptions = [
  "ถามราคาเป็นอย่างแรก",
  "มีขนาดแล้ว",
  "ยังไม่รู้ขนาด",
  "มีไฟล์พร้อมผลิต",
  "ไม่มีไฟล์ ต้องการออกแบบ",
  "มีวันใช้งานชัดเจน",
  "ต้องการงานด่วน",
  "ขอหลายขนาดเปรียบเทียบ",
  "ขอราคาถูกที่สุด",
  "กลับมาซื้อซ้ำ",
];

const money = (value: number) =>
  new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0);

const percent = (value: number) =>
  `${new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 }).format(Number.isFinite(value) ? value : 0)}%`;

function loadLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocal(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function documentTotal(doc: any) {
  if (typeof doc?.total === "number") return doc.total;
  if (typeof doc?.grandTotal === "number") return doc.grandTotal;
  const items = Array.isArray(doc?.items) ? doc.items : [];
  return items.reduce((sum: number, item: any) => {
    const savedAmount = Number(item?.amount ?? item?.total ?? 0);
    if (savedAmount > 0) return sum + savedAmount;
    return sum + Number(item?.qty ?? item?.quantity ?? 0) * Number(item?.price ?? item?.unitPrice ?? 0);
  }, 0);
}

function documentCost(doc: any) {
  if (typeof doc?.costTotal === "number") return doc.costTotal;
  if (typeof doc?.totalCost === "number") return doc.totalCost;
  const items = Array.isArray(doc?.items) ? doc.items : [];
  const lineCost = items.reduce((sum: number, item: any) => {
    const savedCost = Number(item?.costAmount ?? item?.lineCost ?? item?.costTotal ?? 0);
    if (savedCost > 0) return sum + savedCost;
    const qty = Number(item?.costQty ?? item?.area ?? item?.qty ?? item?.quantity ?? 0);
    const cost = Number(item?.costSnapshot ?? item?.cost ?? item?.unitCost ?? 0);
    return sum + qty * cost;
  }, 0);
  return lineCost + Number(doc?.shippingCost ?? doc?.deliveryCost ?? 0);
}

function StatusBadge({ status }: { status: Campaign["status"] }) {
  const map = {
    active: { label: "กำลังรัน", bg: "rgba(16,185,129,.15)", color: "#22c55e" },
    planning: { label: "วางแผน", bg: "rgba(245,158,11,.14)", color: "#f59e0b" },
    paused: { label: "พักแคมเปญ", bg: "rgba(148,163,184,.14)", color: "#cbd5e1" },
    completed: { label: "จบแล้ว", bg: "rgba(59,130,246,.14)", color: "#60a5fa" },
  }[status];
  return <span className="mk-badge" style={{ background: map.bg, color: map.color }}>{map.label}</span>;
}

function leadStatusLabel(status: Lead["status"]) {
  return leadStatuses.find((item) => item.value === status)?.label || status;
}

function leadScore(lead: Lead) {
  const tags = new Set(lead.behaviorTags || []);
  let score = 30;
  if (lead.nextFollowUp) score += 30;
  if (tags.has("มีขนาดแล้ว")) score += 20;
  if (tags.has("มีไฟล์พร้อมผลิต")) score += 20;
  if (lead.value > 0) score += 15;
  if (tags.has("ไม่มีไฟล์ ต้องการออกแบบ")) score += 10;
  if (tags.has("กลับมาซื้อซ้ำ")) score += 40;
  if (tags.has("ถามราคาเป็นอย่างแรก")) score -= 10;
  if (tags.has("ขอราคาถูกที่สุด")) score -= 15;
  if (lead.status === "not_qualified" || lead.status === "closed_lost") score -= 30;
  return Math.max(0, Math.min(100, score));
}

function leadTemperature(score: number) {
  if (score >= 70) return { label: "Hot", color: "#ef4444" };
  if (score >= 40) return { label: "Warm", color: "#f59e0b" };
  return { label: "Cold", color: "#60a5fa" };
}

export default function MarketingKpiDashboard({
  documents = [],
  customers = [],
  products = [],
  totalRevenue = 0,
  totalCost = 0,
  totalProfit = 0,
  showToast,
}: MarketingKpiDashboardProps) {
  const [activeSection, setActiveSection] = useState<MarketingSection>("dashboard");
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => loadLocal(storageKeys.campaigns, defaultCampaigns));
  const [leads, setLeads] = useState<Lead[]>(() => loadLocal(storageKeys.leads, defaultLeads));
  const [leadForm, setLeadForm] = useState({
    name: "",
    contact: "",
    source: "LINE OA",
    campaign: "",
    service: "ป้ายไวนิล",
    customerType: "SME",
    buyingSituation: "",
    behaviorTags: [] as string[],
    status: "new" as Lead["status"],
    value: "",
    nextFollowUp: "",
    owner: "Admin",
    note: "",
  });
  const [ga4, setGa4] = useState<any>({ loading: true, connected: false, error: "", totals: {} });
  const [meta, setMeta] = useState<any>({ loading: true, connected: false, error: "", totals: {}, campaigns: [] });

  useEffect(() => saveLocal(storageKeys.campaigns, campaigns), [campaigns]);
  useEffect(() => saveLocal(storageKeys.leads, leads), [leads]);

  useEffect(() => {
    let cancelled = false;
    async function loadSources() {
      const load = async (url: string) => {
        const response = await fetch(url, { cache: "no-store" });
        return response.json();
      };
      try {
        const [ga4Data, metaData] = await Promise.allSettled([load("/api/marketing/ga4"), load("/api/marketing/meta")]);
        if (cancelled) return;
        setGa4(ga4Data.status === "fulfilled" ? { loading: false, ...ga4Data.value } : { loading: false, connected: false, error: "เชื่อมต่อ GA4 ไม่สำเร็จ", totals: {} });
        setMeta(metaData.status === "fulfilled" ? { loading: false, ...metaData.value } : { loading: false, connected: false, error: "เชื่อมต่อ Meta ไม่สำเร็จ", totals: {}, campaigns: [] });
      } catch {
        if (cancelled) return;
        setGa4({ loading: false, connected: false, error: "รอเชื่อมต่อ", totals: {} });
        setMeta({ loading: false, connected: false, error: "รอเชื่อมต่อ", totals: {}, campaigns: [] });
      }
    }
    loadSources();
    return () => { cancelled = true; };
  }, []);

  const receipts = useMemo(
    () => documents.filter((doc) => doc?.type === "receipt" && !doc?.deleted && doc?.status !== "cancelled"),
    [documents],
  );

  const receiptRevenue = useMemo(() => {
    if (totalRevenue > 0) return totalRevenue;
    return receipts.reduce((sum, doc) => sum + documentTotal(doc), 0);
  }, [receipts, totalRevenue]);
  const receiptCost = useMemo(() => {
    if (totalCost > 0) return totalCost;
    return receipts.reduce((sum, doc) => sum + documentCost(doc), 0);
  }, [receipts, totalCost]);
  const metaSpend = Number(meta?.totals?.spend ?? 0);
  const manualSpend = campaigns.reduce((sum, campaign) => sum + Number(campaign.spend || 0), 0);
  const marketingSpend = meta.connected ? metaSpend : manualSpend;
  const crmLeads = leads.length;
  const metaLeads = Number(meta?.totals?.leads ?? 0);
  const campaignLeads = campaigns.reduce((sum, campaign) => sum + Number(campaign.leads || 0), 0);
  const totalLeads = crmLeads + metaLeads + campaignLeads;
  const qualifiedLeads = leads.filter((lead) => ["detail_completed", "quotation_sent", "follow_up", "waiting_payment", "closed_won"].includes(lead.status)).length;
  const quotationSent = documents.filter((doc) => doc?.type === "quote" && !doc?.deleted && doc?.status !== "cancelled").length
    + leads.filter((lead) => ["quotation_sent", "follow_up", "waiting_payment", "closed_won"].includes(lead.status)).length;
  const closedJobs = receipts.length;
  const grossProfit = totalProfit || (receiptRevenue - receiptCost);
  const cpl = totalLeads > 0 ? marketingSpend / totalLeads : 0;
  const cpql = qualifiedLeads > 0 ? marketingSpend / qualifiedLeads : 0;
  const costPerClosedJob = closedJobs > 0 ? marketingSpend / closedJobs : 0;
  const cac = closedJobs > 0 ? marketingSpend / closedJobs : 0;
  const canCalculateLeadToCustomer = totalLeads > 0 && closedJobs <= totalLeads;
  const conversionRate = canCalculateLeadToCustomer ? (closedJobs / totalLeads) * 100 : null;
  const quoteToCloseRate = quotationSent > 0 && closedJobs <= quotationSent ? (closedJobs / quotationSent) * 100 : null;
  const roas = marketingSpend > 0 ? receiptRevenue / marketingSpend : 0;
  const profitRoas = marketingSpend > 0 ? grossProfit / marketingSpend : 0;
  const grossMargin = receiptRevenue > 0 ? (grossProfit / receiptRevenue) * 100 : 0;
  const roi = marketingSpend > 0 ? ((receiptRevenue - marketingSpend) / marketingSpend) * 100 : 0;
  const averageOrderValue = closedJobs > 0 ? receiptRevenue / closedJobs : 0;
  const plannedBudget = campaigns.reduce((sum, campaign) => sum + Number(campaign.spend || 0), 0);

  const metaCampaignRows = Array.isArray(meta?.campaigns) ? meta.campaigns : [];
  const campaignRows = metaCampaignRows.length
    ? metaCampaignRows.map((row: any, index: number) => ({
        id: row.id || `meta-${index}`,
        name: row.name || "Meta Campaign",
        channel: "Facebook Ads",
        status: "active" as const,
        spend: Number(row.spend || 0),
        leads: Number(row.leads || 0),
        conversions: Number(row.conversions || 0),
        revenue: Number(row.revenue || 0),
        note: "ข้อมูลจาก Meta API",
      }))
    : campaigns;

  const facebookRows = campaignRows
    .filter((row: Campaign) => /facebook|meta/i.test(row.channel))
    .map((row: Campaign) => {
      const qualifiedFromCampaign = leads.filter((lead) => lead.campaign === row.name && ["detail_completed", "quotation_sent", "follow_up", "waiting_payment", "closed_won"].includes(lead.status)).length;
      const quotationFromCampaign = leads.filter((lead) => lead.campaign === row.name && ["quotation_sent", "follow_up", "waiting_payment", "closed_won"].includes(lead.status)).length;
      const closedFromCampaign = leads.filter((lead) => lead.campaign === row.name && lead.status === "closed_won").length;
      const rowProfit = Math.max(0, row.revenue - row.spend);
      return {
        ...row,
        objective: row.note || "LINE Inquiry",
        reach: Number((row as any).reach || 0),
        impressions: Number((row as any).impressions || 0),
        clicks: Number((row as any).clicks || 0),
        qualifiedLeads: qualifiedFromCampaign,
        quotations: quotationFromCampaign,
        closedJobs: closedFromCampaign,
        grossProfit: rowProfit,
        profitRoas: row.spend ? rowProfit / row.spend : 0,
        recommendation: row.spend > 0 && row.leads === 0 ? "หยุด/ตรวจ Creative" : row.leads > 0 ? "รอดูต่อ" : "รอข้อมูล",
      };
    });

  const adSetRows = facebookRows.map((row) => ({
    campaign: row.name,
    adSetName: `${row.name} - Core Audience`,
    audience: "SME / ร้านอาหาร / เจ้าของธุรกิจ",
    budget: row.spend,
    spend: row.spend,
    leads: row.leads,
    cpl: row.leads ? row.spend / row.leads : 0,
    qualifiedLeads: row.qualifiedLeads,
    closedJobs: row.closedJobs,
    closeRate: row.leads ? (row.closedJobs / row.leads) * 100 : 0,
    revenue: row.revenue,
  }));

  const creativeRows = facebookRows.map((row) => ({
    creativeName: `${row.name} Creative`,
    creativeType: "Real Work Photo",
    hook: "ส่งรูปงานจริง + CTA ทัก LINE",
    product: row.name.includes("Sticker") ? "Sticker" : "Vinyl Banner",
    campaign: row.name,
    spend: row.spend,
    leads: row.leads,
    qualifiedLeads: row.qualifiedLeads,
    quotations: row.quotations,
    closedJobs: row.closedJobs,
    revenue: row.revenue,
    cpl: row.leads ? row.spend / row.leads : 0,
    note: "รอเชื่อม creative id จาก Meta API",
  }));

  const addLead = () => {
    const nextLead: Lead = {
      id: `lead-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      name: leadForm.name.trim() || `Lead #${leads.length + 1}`,
      contact: leadForm.contact,
      source: leadForm.source,
      campaign: leadForm.campaign,
      service: leadForm.service,
      customerType: leadForm.customerType,
      buyingSituation: leadForm.buyingSituation,
      behaviorTags: leadForm.behaviorTags,
      status: leadForm.status,
      value: Number(leadForm.value || 0),
      nextFollowUp: leadForm.nextFollowUp,
      owner: leadForm.owner,
      note: leadForm.note,
    };
    setLeads((prev) => [nextLead, ...prev]);
    setLeadForm((prev) => ({ ...prev, name: "", contact: "", campaign: "", buyingSituation: "", value: "", note: "" }));
    showToast?.("เพิ่ม Lead แล้ว", "success");
  };

  const toggleLeadTag = (tag: string) => {
    setLeadForm((prev) => ({
      ...prev,
      behaviorTags: prev.behaviorTags.includes(tag)
        ? prev.behaviorTags.filter((item) => item !== tag)
        : [...prev.behaviorTags, tag],
    }));
  };

  const cards = [
    { label: "Revenue", value: `฿${money(receiptRevenue)}`, sub: "ตรงกับ ERP: ใบเสร็จเท่านั้น", tone: "green" },
    { label: "Gross Profit", value: `฿${money(grossProfit)}`, sub: `Margin ${percent(grossMargin)}`, tone: "teal" },
    { label: "Marketing Spend", value: `฿${money(marketingSpend)}`, sub: meta.connected ? "จาก Meta Ads" : "รอเชื่อมต่อ Meta API", tone: "pink" },
    { label: "Total Leads", value: money(totalLeads), sub: meta.connected ? "รวม Meta + CRM" : "CRM / Manual", tone: "blue" },
    { label: "Qualified Leads", value: money(qualifiedLeads), sub: "Lead ที่ข้อมูลพร้อมติดตาม", tone: "purple" },
    { label: "Quotation Sent", value: money(quotationSent), sub: "ใบเสนอราคา + CRM", tone: "yellow" },
    { label: "Closed Jobs", value: money(closedJobs), sub: "จำนวนใบเสร็จใน ERP", tone: "green" },
    { label: "ROAS", value: roas ? roas.toFixed(2) : "-", sub: "Revenue / Ad Spend", tone: "orange" },
    { label: "Cost per Lead", value: cpl ? `฿${money(cpl)}` : "-", sub: "CPL", tone: "yellow" },
    { label: "Cost per Qualified Lead", value: cpql ? `฿${money(cpql)}` : "-", sub: "Spend / Qualified Lead", tone: "teal" },
    { label: "Cost per Closed Job", value: costPerClosedJob ? `฿${money(costPerClosedJob)}` : "-", sub: "Spend / Closed Job", tone: "pink" },
    { label: "Lead to Customer", value: conversionRate === null ? "ยังคำนวณไม่ได้" : percent(conversionRate), sub: "ไม่รวมคนละ source แบบมั่ว", tone: "purple" },
    { label: "Profit ROAS", value: profitRoas ? profitRoas.toFixed(2) : "-", sub: "Gross Profit / Spend", tone: "green" },
    { label: "Average Order Value", value: averageOrderValue ? `฿${money(averageOrderValue)}` : "-", sub: "Revenue / Closed Jobs", tone: "orange" },
  ];

  const sources = [
    { name: "GA4", account: "G-GHBQ0VT4NE", detail: ga4.connected ? `${money(Number(ga4?.totals?.sessions ?? 0))} sessions` : ga4.error || "รอเชื่อมต่อ", ready: !!ga4.connected, error: ga4.error || "" },
    { name: "Facebook Pixel / Ads", account: "Meta App / Ad Account", detail: meta.connected ? `Spend ฿${money(metaSpend)} / Leads ${money(Number(meta?.totals?.leads ?? 0))}` : meta.error || "รอเชื่อมต่อ", ready: !!meta.connected, error: meta.error || "" },
    { name: "LINE OA", account: "@displayworks", detail: "ใช้บันทึก Lead และ Source ใน CRM", ready: false, error: "ยังไม่ได้เชื่อม LINE Messaging API" },
    { name: "ERP Receipts", account: "Supabase ERP", detail: `${receipts.length} ใบเสร็จ ใช้คำนวณ Revenue / Cost / Profit`, ready: true, error: "" },
  ];

  const alerts = [
    !meta.connected ? "Facebook Ads ยังไม่ได้เชื่อมต่อ หรือ API ยังไม่มีข้อมูลล่าสุด" : "",
    !ga4.connected ? "GA4 ยังไม่ได้เชื่อมต่อกับ Dashboard data API" : "",
    conversionRate === null ? "Conversion Rate คำนวณไม่ได้ เพราะ Closed Jobs มากกว่า Leads หรือยังไม่มี Mapping" : "",
    leads.some((lead) => leadScore(lead) >= 70 && !lead.nextFollowUp) ? "มี Hot Lead ที่ยังไม่มีวัน Follow-up" : "",
    quotationSent > 0 && quoteToCloseRate === null ? "Quote to Close Rate ยังไม่ควรคำนวณ เพราะข้อมูลใบเสนอราคาและใบเสร็จยังไม่ได้ Mapping" : "",
  ].filter(Boolean);

  const marketingFunnel = [
    { label: "Visitor", value: Number(ga4?.totals?.activeUsers ?? ga4?.totals?.sessions ?? 0), color: "#2563eb" },
    { label: "Lead", value: totalLeads, color: "#06b6d4" },
    { label: "Qualified Lead", value: qualifiedLeads, color: "#22c55e" },
  ];
  const salesFunnel = [
    { label: "Lead", value: crmLeads, color: "#2563eb" },
    { label: "Contacted", value: leads.filter((lead) => ["contacted", "waiting_detail", "detail_completed", "quotation_sent", "follow_up", "waiting_payment", "closed_won"].includes(lead.status)).length, color: "#06b6d4" },
    { label: "Detail Completed", value: leads.filter((lead) => ["detail_completed", "quotation_sent", "follow_up", "waiting_payment", "closed_won"].includes(lead.status)).length, color: "#22c55e" },
    { label: "Quotation Sent", value: quotationSent, color: "#f59e0b" },
    { label: "Closed Won", value: closedJobs, color: "#ff6b00" },
  ];

  const navItems: { id: MarketingSection; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "facebook", label: "Facebook Ads" },
    { id: "leads", label: "Leads / CRM" },
    { id: "customers", label: "Customers" },
    { id: "quotations", label: "Quotations" },
    { id: "orders", label: "Orders / Jobs" },
    { id: "products", label: "Products" },
    { id: "campaigns", label: "Campaigns" },
    { id: "budget", label: "Budget" },
    { id: "funnel", label: "Lead Funnel" },
    { id: "channels", label: "Channels" },
    { id: "insight", label: "AI Insight" },
    { id: "reports", label: "Reports" },
    { id: "sources", label: "Data Sources" },
    { id: "settings", label: "Settings" },
  ];

  const showDashboard = activeSection === "dashboard";

  return (
    <div className="mk-dashboard">
      <style>{`
        .mk-dashboard{font-family:'Prompt',sans-serif;color:#f8fafc;min-height:100%;background:radial-gradient(circle at 80% 0%,rgba(255,107,0,.18),transparent 34%),#080d14;border:1px solid rgba(255,107,0,.2);border-radius:24px;overflow:hidden}
        .mk-shell{display:grid;grid-template-columns:260px 1fr;min-height:calc(100dvh - 92px)}
        .mk-sidebar{background:rgba(0,0,0,.36);border-right:1px solid rgba(255,107,0,.18);padding:26px}
        .mk-brand{display:flex;gap:14px;align-items:center;margin-bottom:28px}
        .mk-logo{width:48px;height:48px;border-radius:16px;border:1px solid rgba(255,107,0,.6);display:grid;place-items:center;color:#ff6b00;font-weight:900}
        .mk-nav{display:grid;gap:10px}
        .mk-nav button{background:transparent;border:0;color:#a8b0c0;text-align:left;padding:14px 16px;border-radius:14px;font-weight:800;cursor:pointer}
        .mk-nav button.active,.mk-nav button:hover{background:#ff6b00;color:#fff}
        .mk-main{padding:30px;overflow:auto}
        .mk-top{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:24px}
        .mk-eyebrow{color:#ff6b00;font-size:12px;letter-spacing:.24em;font-weight:900;text-transform:uppercase}
        .mk-title{font-size:clamp(26px,3vw,38px);line-height:1.1;margin:12px 0 10px;font-weight:900}
        .mk-sub{color:#a8b0c0;max-width:760px;line-height:1.75}
        .mk-actions{display:flex;gap:10px;flex-wrap:wrap}
        .mk-btn{border:1px solid rgba(255,255,255,.12);background:#101827;color:#fff;border-radius:12px;padding:12px 16px;font-weight:900;cursor:pointer}
        .mk-btn.orange{background:#ff6b00;border-color:#ff6b00}
        .mk-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
        .mk-card,.mk-panel{background:#111923;border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:20px;box-shadow:0 18px 50px rgba(0,0,0,.18)}
        .mk-card{min-height:150px;display:flex;flex-direction:column;justify-content:space-between}
        .mk-card strong{font-size:26px;line-height:1;color:#fff}
        .mk-card span{color:#a8b0c0;font-size:12px}
        .mk-dot{width:46px;height:46px;border-radius:15px;display:grid;place-items:center;font-weight:900}
        .mk-dot.green{background:#10b981}.mk-dot.blue{background:#2563eb}.mk-dot.purple{background:#8b5cf6}.mk-dot.orange{background:#ff6b00}.mk-dot.pink{background:#ec4899}.mk-dot.yellow{background:#eab308}.mk-dot.teal{background:#14b8a6}
        .mk-row{display:grid;grid-template-columns:1.2fr 1fr;gap:16px;margin-top:16px}
        .mk-panel h3{margin:0 0 6px;font-size:20px}.mk-panel p{margin:0;color:#8b95a7;line-height:1.7}
        .mk-line-chart{height:270px;border-bottom:1px solid rgba(255,255,255,.1);background:linear-gradient(to top,rgba(255,255,255,.05) 1px,transparent 1px);background-size:100% 48px;position:relative;margin-top:18px;overflow:hidden;border-radius:12px}
        .mk-line{position:absolute;left:5%;right:5%;height:4px;border-radius:999px;background:linear-gradient(90deg,#ff6b00,#8b5cf6);top:50%;transform:skewY(-13deg)}
        .mk-donut{width:210px;height:210px;border-radius:50%;background:conic-gradient(#ff6b00 0 34%,#22c55e 34% 56%,#2563eb 56% 76%,#8b5cf6 76% 100%);display:grid;place-items:center;margin:10px auto}
        .mk-donut-inner{width:118px;height:118px;border-radius:50%;background:#111923;display:grid;place-items:center;text-align:center;font-weight:900}
        .mk-table-wrap{overflow:auto}.mk-table{width:100%;border-collapse:collapse;min-width:760px}.mk-table th,.mk-table td{padding:14px 12px;border-bottom:1px solid rgba(255,255,255,.08);text-align:left}.mk-table th{color:#94a3b8;font-size:12px}.mk-table td{color:#e5e7eb}
        .mk-badge{display:inline-flex;border-radius:999px;padding:5px 10px;font-size:12px;font-weight:900}
        .mk-budget{height:18px;background:#1f2937;border-radius:999px;overflow:hidden;margin:18px 0}.mk-budget span{display:block;height:100%;background:linear-gradient(90deg,#ff6b00,#22c55e)}
        .mk-funnel{display:grid;gap:10px;margin-top:16px}.mk-funnel div{border-radius:12px;padding:12px 16px;color:#fff;font-weight:900;display:flex;justify-content:space-between}
        .mk-channel-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.mk-mini{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:16px}
        .mk-source{display:flex;justify-content:space-between;gap:12px;align-items:center;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:16px;background:rgba(0,0,0,.18)}
        .mk-status{font-weight:900;color:#f59e0b}.mk-status.ready{color:#22c55e}
        .mk-form-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.mk-input{background:#0b1220;border:1px solid rgba(255,255,255,.12);border-radius:12px;color:#fff;padding:12px 14px;font:inherit;min-width:0}.mk-textarea{grid-column:1/-1;min-height:86px;resize:vertical}.mk-tag-row{display:flex;flex-wrap:wrap;gap:8px}.mk-tag{border:1px solid rgba(255,107,0,.35);background:transparent;color:#f8fafc;border-radius:999px;padding:8px 10px;font-weight:800;cursor:pointer}.mk-tag.active{background:#ff6b00;border-color:#ff6b00;color:#fff}.mk-alert{border:1px solid rgba(245,158,11,.35);background:rgba(245,158,11,.1);color:#fde68a;border-radius:14px;padding:12px 14px;font-weight:800}
        @media(max-width:1100px){.mk-shell{grid-template-columns:1fr}.mk-sidebar{display:none}.mk-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.mk-row{grid-template-columns:1fr}.mk-channel-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:640px){.mk-dashboard{border-radius:0;border-left:0;border-right:0}.mk-main{padding:18px 14px 96px}.mk-top{display:block}.mk-actions{margin-top:16px}.mk-grid,.mk-channel-grid,.mk-form-grid{grid-template-columns:1fr}.mk-card{min-height:128px}.mk-card strong{font-size:24px}.mk-donut{width:180px;height:180px}.mk-donut-inner{width:102px;height:102px}.mk-panel{padding:16px}.mk-table{min-width:680px}}
      `}</style>

      <div className="mk-shell">
        <aside className="mk-sidebar">
          <div className="mk-brand">
            <div className="mk-logo">DW</div>
            <div>
              <strong>Display Works Media</strong>
              <div className="mk-eyebrow" style={{ letterSpacing: ".12em", fontSize: 10 }}>Marketing KPI</div>
            </div>
          </div>
          <nav className="mk-nav" aria-label="Marketing dashboard sections">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={activeSection === item.id ? "active" : ""}
                type="button"
                onClick={() => setActiveSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="mk-main">
          <header className="mk-top">
            <div>
              <div className="mk-eyebrow">Marketing Command Center</div>
              <h1 className="mk-title">Display Works Media Marketing KPI Dashboard</h1>
              <p className="mk-sub">
                ภาพรวมประสิทธิภาพการตลาดสำหรับงานป้าย งานพิมพ์ และสื่อโฆษณาออนไลน์ โดยผูกยอดรายได้จากใบเสร็จจริงใน ERP และเตรียมรองรับข้อมูล GA4, Meta Ads และ LINE OA
              </p>
            </div>
            <div className="mk-actions">
              <button className="mk-btn">Last 30 days</button>
              <button className="mk-btn orange">Export</button>
            </div>
          </header>

          {showDashboard && <section className="mk-grid" aria-label="Marketing KPI overview">
            {cards.map((card) => (
              <article className="mk-card" key={card.label}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div className={`mk-dot ${card.tone}`}>{card.label.slice(0, 1)}</div>
                  <span style={{ color: "#22c55e", fontWeight: 900 }}>↗</span>
                </div>
                <div>
                  <span>{card.label}</span>
                  <strong style={{ display: "block", marginTop: 10 }}>{card.value}</strong>
                  <span>{card.sub}</span>
                </div>
              </article>
            ))}
          </section>}

          {showDashboard && alerts.length > 0 && (
            <section className="mk-panel" style={{ marginTop: 16 }}>
              <h3>Marketing Alerts</h3>
              <p>แจ้งเตือนเรื่องข้อมูลและ API ที่ต้องตรวจสอบก่อนใช้ตัดสินใจ</p>
              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                {alerts.map((alert) => <div className="mk-alert" key={alert}>{alert}</div>)}
              </div>
            </section>
          )}

          {showDashboard && <section className="mk-row">
            <div className="mk-panel">
              <h3>Revenue & Spend Trend</h3>
              <p>แนวโน้มรายได้จากใบเสร็จเทียบกับงบโฆษณา</p>
              <div className="mk-line-chart"><span className="mk-line" /></div>
            </div>
            <div className="mk-panel">
              <h3>Performance Overview</h3>
              <p>สัดส่วนช่องทางที่สร้างโอกาสขาย</p>
              <div className="mk-donut">
                <div className="mk-donut-inner">
                  <div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>Revenue</div>
                    <div>฿{money(receiptRevenue)}</div>
                  </div>
                </div>
              </div>
              {["Facebook Ads", "LINE OA", "Organic", "Direct"].map((name, index) => (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", marginTop: 8, color: "#cbd5e1" }}>
                  <span>{name}</span><strong>{[30, 35, 20, 15][index]}%</strong>
                </div>
              ))}
            </div>
          </section>}

          {activeSection === "facebook" && (
            <section className="mk-grid" style={{ marginTop: 16 }}>
              {[
                ["Facebook Spend", `฿${money(marketingSpend)}`, "Meta Ads spend"],
                ["Facebook Leads", money(metaLeads), "Messages / Leads"],
                ["Facebook CPL", metaLeads ? `฿${money(marketingSpend / metaLeads)}` : "-", "Spend / Leads"],
                ["Facebook ROAS", roas ? roas.toFixed(2) : "-", "Revenue / Spend"],
                ["Qualified Leads", money(qualifiedLeads), "CRM mapped"],
                ["Closed Jobs", money(closedJobs), "ERP receipts"],
                ["Facebook Revenue", `฿${money(receiptRevenue)}`, "Mapped revenue"],
                ["Profit ROAS", profitRoas ? profitRoas.toFixed(2) : "-", "Gross Profit / Spend"],
              ].map(([label, value, sub]) => (
                <article className="mk-card" key={label}>
                  <div><span>{label}</span><strong style={{ display: "block", marginTop: 10 }}>{value}</strong></div>
                  <span>{sub}</span>
                </article>
              ))}
            </section>
          )}

          {(showDashboard || activeSection === "facebook" || activeSection === "campaigns") && <section className="mk-panel" style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
              <div>
                <h3>Campaign Performance</h3>
                <p>ติดตามงบ Leads Conversion รายได้ และ ROAS ของแต่ละแคมเปญ</p>
              </div>
              <span className="mk-badge" style={{ background: "rgba(34,197,94,.15)", color: "#22c55e" }}>{campaignRows.length} campaigns</span>
            </div>
            <div className="mk-table-wrap">
              <table className="mk-table">
                <thead>
                  <tr><th>Campaign</th><th>Channel</th><th>Status</th><th>Spend</th><th>Reach</th><th>Clicks</th><th>Leads</th><th>CPL</th><th>Qualified</th><th>Quotations</th><th>Closed</th><th>Revenue</th><th>Profit ROAS</th><th>Recommendation</th></tr>
                </thead>
                <tbody>
                  {campaignRows.map((row: Campaign) => {
                    const richRow = facebookRows.find((item) => item.id === row.id);
                    const rowCpl = row.leads ? row.spend / row.leads : 0;
                    return (
                      <tr key={row.id}>
                        <td><strong>{row.name}</strong><div style={{ color: "#8b95a7", fontSize: 12 }}>{row.note}</div></td>
                        <td>{row.channel}</td>
                        <td><StatusBadge status={row.status} /></td>
                        <td>฿{money(row.spend)}</td>
                        <td>{money(richRow?.reach || 0)}</td>
                        <td>{money(richRow?.clicks || 0)}</td>
                        <td>{money(row.leads)}</td>
                        <td>{rowCpl ? `฿${money(rowCpl)}` : "-"}</td>
                        <td>{money(richRow?.qualifiedLeads || 0)}</td>
                        <td>{money(richRow?.quotations || 0)}</td>
                        <td>{money(richRow?.closedJobs || 0)}</td>
                        <td>฿{money(row.revenue)}</td>
                        <td>{richRow?.profitRoas ? richRow.profitRoas.toFixed(2) : "-"}</td>
                        <td>{richRow?.recommendation || "รอข้อมูล"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>}

          {activeSection === "facebook" && (
            <section className="mk-row">
              <div className="mk-panel">
                <h3>Ad Set Performance</h3>
                <p>รอเชื่อม ad set id จาก Meta API เพื่อดู audience และต้นทุนต่อกลุ่มเป้าหมาย</p>
                <div className="mk-table-wrap" style={{ marginTop: 12 }}>
                  <table className="mk-table">
                    <thead><tr><th>Ad Set</th><th>Audience</th><th>Spend</th><th>Leads</th><th>CPL</th><th>Qualified</th><th>Closed</th><th>Revenue</th></tr></thead>
                    <tbody>{adSetRows.map((row) => (
                      <tr key={row.adSetName}><td>{row.adSetName}</td><td>{row.audience}</td><td>฿{money(row.spend)}</td><td>{money(row.leads)}</td><td>{row.cpl ? `฿${money(row.cpl)}` : "-"}</td><td>{money(row.qualifiedLeads)}</td><td>{money(row.closedJobs)}</td><td>฿{money(row.revenue)}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
              <div className="mk-panel">
                <h3>Creative Performance</h3>
                <p>ดูว่า Artwork / Hook แบบไหนควรทำซ้ำ</p>
                <div className="mk-table-wrap" style={{ marginTop: 12 }}>
                  <table className="mk-table">
                    <thead><tr><th>Creative</th><th>Type</th><th>Hook</th><th>Product</th><th>Spend</th><th>Leads</th><th>Revenue</th><th>Note</th></tr></thead>
                    <tbody>{creativeRows.map((row) => (
                      <tr key={row.creativeName}><td>{row.creativeName}</td><td>{row.creativeType}</td><td>{row.hook}</td><td>{row.product}</td><td>฿{money(row.spend)}</td><td>{money(row.leads)}</td><td>฿{money(row.revenue)}</td><td>{row.note}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {(showDashboard || activeSection === "budget" || activeSection === "funnel") && <section className="mk-row">
            <div className="mk-panel">
              <h3>Budget Monitoring</h3>
              <p>ติดตามงบที่ตั้งไว้และงบที่ใช้จริง</p>
              <div className="mk-budget"><span style={{ width: `${plannedBudget ? Math.min(100, (marketingSpend / plannedBudget) * 100) : 0}%` }} /></div>
              <div style={{ display: "grid", gap: 10, color: "#cbd5e1" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>งบประมาณที่ตั้งไว้</span><strong>฿{money(plannedBudget)}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>ใช้ไปแล้ว</span><strong>฿{money(marketingSpend)}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>งบคงเหลือ</span><strong>฿{money(Math.max(0, plannedBudget - marketingSpend))}</strong></div>
              </div>
            </div>
            <div className="mk-panel">
              <h3>Marketing Funnel</h3>
              <p>แยกเฉพาะข้อมูลการตลาด ไม่เอา ERP Customer มารวมมั่ว</p>
              <div className="mk-funnel">
                {marketingFunnel.map((item, index) => (
                  <div key={item.label} style={{ background: item.color, width: `${100 - index * 10}%`, marginInline: "auto" }}>
                    <span>{item.label}</span><span>{money(item.value)}</span>
                  </div>
                ))}
              </div>
              <h3 style={{ marginTop: 22 }}>Sales Funnel</h3>
              <p>เส้นทางจาก Lead ไปถึงงานที่ปิดได้จริง</p>
              <div className="mk-funnel">
                {salesFunnel.map((item, index) => (
                  <div key={item.label} style={{ background: item.color, width: `${100 - index * 8}%`, marginInline: "auto" }}>
                    <span>{item.label}</span><span>{money(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>}

          {(showDashboard || activeSection === "channels") && <section className="mk-panel" style={{ marginTop: 16 }}>
            <h3>Channel Performance Comparison</h3>
            <p>เปรียบเทียบช่องทางที่ควรโฟกัสต่อ</p>
            <div className="mk-channel-grid" style={{ marginTop: 14 }}>
              {[
                ["Facebook Ads", receiptRevenue * 0.3, roas],
                ["Google / Organic", receiptRevenue * 0.2, 0],
                ["LINE OA", receiptRevenue * 0.35, 0],
                ["Direct", receiptRevenue * 0.15, 0],
              ].map(([name, revenue, channelRoas]) => (
                <div className="mk-mini" key={String(name)}>
                  <strong>{String(name)}</strong>
                  <div style={{ color: "#a8b0c0", marginTop: 10 }}>Revenue</div>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>฿{money(Number(revenue))}</div>
                  <div style={{ color: "#8b95a7" }}>ROAS {Number(channelRoas) ? Number(channelRoas).toFixed(2) : "-"}</div>
                </div>
              ))}
            </div>
          </section>}

          {activeSection === "leads" && (
            <section className="mk-panel" style={{ marginTop: 16 }}>
              <h3>Lead Entry</h3>
              <p>บันทึก Lead พร้อม Source, Campaign, พฤติกรรม, สถานะ และวันติดตาม</p>
              <div className="mk-form-grid" style={{ marginTop: 14 }}>
                <input className="mk-input" placeholder="Customer Name" value={leadForm.name} onChange={(event) => setLeadForm((prev) => ({ ...prev, name: event.target.value }))} />
                <input className="mk-input" placeholder="Contact / LINE / Phone" value={leadForm.contact} onChange={(event) => setLeadForm((prev) => ({ ...prev, contact: event.target.value }))} />
                <select className="mk-input" value={leadForm.source} onChange={(event) => setLeadForm((prev) => ({ ...prev, source: event.target.value }))}>
                  {["Facebook Ads", "LINE OA", "Website", "Organic", "Referral", "Phone"].map((source) => <option key={source}>{source}</option>)}
                </select>
                <input className="mk-input" placeholder="Campaign" value={leadForm.campaign} onChange={(event) => setLeadForm((prev) => ({ ...prev, campaign: event.target.value }))} />
                <select className="mk-input" value={leadForm.service} onChange={(event) => setLeadForm((prev) => ({ ...prev, service: event.target.value }))}>
                  {["ป้ายไวนิล", "สติ๊กเกอร์", "PP Board / Standee", "Roll Up / X-Stand", "Backdrop", "งานพิมพ์อื่นๆ"].map((service) => <option key={service}>{service}</option>)}
                </select>
                <select className="mk-input" value={leadForm.customerType} onChange={(event) => setLeadForm((prev) => ({ ...prev, customerType: event.target.value }))}>
                  {["SME", "ร้านอาหาร", "คาเฟ่", "คลินิก", "อีเวนต์", "แบรนด์สินค้า", "องค์กร"].map((type) => <option key={type}>{type}</option>)}
                </select>
                <input className="mk-input" placeholder="Buying Situation" value={leadForm.buyingSituation} onChange={(event) => setLeadForm((prev) => ({ ...prev, buyingSituation: event.target.value }))} />
                <select className="mk-input" value={leadForm.status} onChange={(event) => setLeadForm((prev) => ({ ...prev, status: event.target.value as Lead["status"] }))}>
                  {leadStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                </select>
                <input className="mk-input" placeholder="Estimated Value" inputMode="decimal" value={leadForm.value} onChange={(event) => setLeadForm((prev) => ({ ...prev, value: event.target.value }))} />
                <input className="mk-input" type="date" value={leadForm.nextFollowUp} onChange={(event) => setLeadForm((prev) => ({ ...prev, nextFollowUp: event.target.value }))} />
                <input className="mk-input" placeholder="Owner" value={leadForm.owner} onChange={(event) => setLeadForm((prev) => ({ ...prev, owner: event.target.value }))} />
                <textarea className="mk-input mk-textarea" placeholder="Note" value={leadForm.note} onChange={(event) => setLeadForm((prev) => ({ ...prev, note: event.target.value }))} />
              </div>
              <div className="mk-tag-row" style={{ marginTop: 14 }}>
                {behaviorTagOptions.map((tag) => (
                  <button key={tag} type="button" className={`mk-tag ${leadForm.behaviorTags.includes(tag) ? "active" : ""}`} onClick={() => toggleLeadTag(tag)}>{tag}</button>
                ))}
              </div>
              <button className="mk-btn orange" style={{ marginTop: 16 }} onClick={addLead}>+ เพิ่ม Lead</button>
            </section>
          )}

          {(showDashboard || activeSection === "insight" || activeSection === "leads") && <section className="mk-row">
            <div className="mk-panel">
              <h3>AI Insight</h3>
              <p>สรุปแนวทางที่ควรทำต่อจากข้อมูลปัจจุบัน</p>
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <div className="mk-mini">เพิ่มการติด UTM ทุกปุ่ม LINE เพื่อแยกแหล่งที่มาของ Lead ให้ชัดเจน</div>
                <div className="mk-mini">เชื่อม Meta Ads เพื่อคำนวณ Spend, CPL, CAC และ ROAS แบบอัตโนมัติ</div>
                <div className="mk-mini">ใช้ใบเสร็จ ERP เป็นแหล่ง Revenue หลัก เพื่อไม่ให้ยอดขายซ้ำกับใบเสนอราคา</div>
              </div>
            </div>
            <div className="mk-panel">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <h3>Leads / CRM</h3>
                  <p>บันทึก Lead เบื้องต้นก่อนเชื่อม LINE OA API</p>
                </div>
                <button className="mk-btn orange" onClick={addLead}>+ Add Lead</button>
              </div>
              <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                {leads.slice(0, activeSection === "leads" ? leads.length : 4).map((lead) => {
                  const score = leadScore(lead);
                  const temperature = leadTemperature(score);
                  return (
                  <div className="mk-source" key={lead.id}>
                    <div>
                      <strong>{lead.name}</strong>
                      <div style={{ color: "#8b95a7", fontSize: 12 }}>{lead.source} • {lead.service} • {leadStatusLabel(lead.status)}</div>
                      {activeSection === "leads" && <div style={{ color: "#8b95a7", fontSize: 12, marginTop: 4 }}>
                        {lead.contact || "-"} • {lead.customerType || "-"} • Follow-up: {lead.nextFollowUp || "-"}
                      </div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className="mk-badge" style={{ background: "rgba(255,107,0,.14)", color: "#ff6b00" }}>{score}/100</span>
                      <div style={{ color: temperature.color, fontWeight: 900, marginTop: 6 }}>{temperature.label}</div>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          </section>}

          {(showDashboard || activeSection === "customers" || activeSection === "quotations" || activeSection === "orders" || activeSection === "products" || activeSection === "reports") && (
            <section className="mk-panel" style={{ marginTop: 16 }}>
              <h3>
                {activeSection === "customers" ? "Customers"
                  : activeSection === "quotations" ? "Quotations"
                  : activeSection === "orders" ? "Orders / Jobs"
                  : activeSection === "products" ? "Products"
                  : "Reports"}
              </h3>
              <p>ข้อมูลส่วนนี้อ้างอิงจาก ERP เพื่อใช้ดูภาพรวมการปิดการขายและกำไรจริง</p>
              <div className="mk-channel-grid" style={{ marginTop: 14 }}>
                <div className="mk-mini"><strong>{customers.length}</strong><div>Customers</div></div>
                <div className="mk-mini"><strong>{quotationSent}</strong><div>Quotation Sent</div></div>
                <div className="mk-mini"><strong>{closedJobs}</strong><div>Closed Jobs</div></div>
                <div className="mk-mini"><strong>{products.length}</strong><div>Products / Supplier Catalog</div></div>
                <div className="mk-mini"><strong>฿{money(receiptRevenue)}</strong><div>Receipt Revenue</div></div>
                <div className="mk-mini"><strong>฿{money(receiptCost)}</strong><div>Expense / Cost</div></div>
                <div className="mk-mini"><strong>฿{money(grossProfit)}</strong><div>Gross Profit</div></div>
                <div className="mk-mini"><strong>{quoteToCloseRate === null ? "-" : percent(quoteToCloseRate)}</strong><div>Quote to Close Rate</div></div>
              </div>
            </section>
          )}

          {(showDashboard || activeSection === "sources" || activeSection === "settings") && <section className="mk-panel" style={{ marginTop: 16 }}>
            <h3>Data Sources</h3>
            <p>สถานะการเชื่อมต่อข้อมูลสำหรับ Dashboard</p>
            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              {sources.map((source) => (
                <div className="mk-source" key={source.name}>
                  <div>
                    <strong>{source.name}</strong>
                    <div style={{ color: "#cbd5e1", marginTop: 4 }}>{source.account}</div>
                    <div style={{ color: "#8b95a7", marginTop: 4 }}>{source.detail}</div>
                    {source.error && <div style={{ color: "#fca5a5", marginTop: 4 }}>{source.error}</div>}
                  </div>
                  <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                    <span className={`mk-status ${source.ready ? "ready" : ""}`}>{source.ready ? "พร้อมใช้" : "รอเชื่อมต่อ"}</span>
                    {activeSection !== "dashboard" && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
                        <button className="mk-btn" type="button" onClick={() => showToast?.(`Sync ${source.name}: รอทำ background sync`, "info")}>Sync Now</button>
                        <button className="mk-btn" type="button" onClick={() => showToast?.(`Reconnect ${source.name}: ต้องทำ OAuth flow`, "info")}>{source.ready ? "Reconnect" : "Connect"}</button>
                        <button className="mk-btn" type="button" onClick={() => showToast?.(`View logs ${source.name}: รอทำ sync log table`, "info")}>View Logs</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>}
        </main>
      </div>
    </div>
  );
}
