"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
  | "settings"
  | "ai";

type DateRangeMode = "7d" | "30d" | "month" | "all" | "custom";

type ApiExpiryConfig = {
  expiresAt: string;
  note: string;
};

type TrendPoint = {
  date: string;
  value: number;
};

const storageKeys = {
  campaigns: "dwm_marketing_campaigns_v3",
  leads: "dwm_marketing_leads_v3",
  apiExpiries: "dwm_marketing_api_expiries_v1",
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

const defaultLeads: Lead[] = [];

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

const dateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const todayInput = () => dateInputValue(new Date());

const addDaysInput = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dateInputValue(date);
};

const monthStartInput = () => {
  const date = new Date();
  return dateInputValue(new Date(date.getFullYear(), date.getMonth(), 1));
};

const safeDateValue = (value: unknown) => {
  if (!value) return "";
  const text = String(value);
  return text.includes("T") ? text.slice(0, 10) : text.slice(0, 10);
};

const isInRange = (value: unknown, startDate: string, endDate: string, mode: DateRangeMode) => {
  if (mode === "all") return true;
  const date = safeDateValue(value);
  if (!date) return false;
  return (!startDate || date >= startDate) && (!endDate || date <= endDate);
};

const thaiProvinces = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท",
  "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา",
  "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์",
  "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี",
  "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง",
  "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ",
  "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์",
  "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี",
];

const unknownLabel = "ไม่ระบุ";

const inferProvince = (record: any) => {
  const explicit = String(record?.province || record?.customerProvince || record?.customer_province || "").trim();
  if (explicit) return explicit === "กรุงเทพฯ" ? "กรุงเทพมหานคร" : explicit;
  const address = String(record?.address || record?.overrideAddress || record?.override_address || "").replace(/กรุงเทพฯ/g, "กรุงเทพมหานคร");
  if (!address) return unknownLabel;
  if (/กรุงเทพ/.test(address)) return "กรุงเทพมหานคร";
  return thaiProvinces.find((province) => address.includes(province)) || unknownLabel;
};

const inferDistrict = (record: any) => {
  const explicit = String(record?.district || record?.amphoe || record?.area || record?.customerDistrict || record?.customer_district || "").trim();
  if (explicit) return explicit;
  const address = String(record?.address || record?.overrideAddress || record?.override_address || "").trim();
  if (!address) return unknownLabel;
  const patterns = [
    /(เขต)\s*([ก-๙A-Za-z0-9.\-]+)/,
    /(อำเภอ|อ\.)\s*([ก-๙A-Za-z0-9.\-]+)/,
    /(แขวง)\s*([ก-๙A-Za-z0-9.\-]+)/,
    /(ตำบล|ต\.)\s*([ก-๙A-Za-z0-9.\-]+)/,
  ];
  for (const pattern of patterns) {
    const found = address.match(pattern);
    if (found?.[1] && found?.[2]) return `${found[1]}${found[2]}`;
  }
  return unknownLabel;
};

const defaultApiExpiries = (): Record<string, ApiExpiryConfig> => ({
  ga4: {
    expiresAt: addDaysInput(90),
    note: "Service Account Key ควร rotate ทุก 90 วัน แม้คีย์จะไม่หมดอายุอัตโนมัติ",
  },
  meta: {
    expiresAt: addDaysInput(55),
    note: "Meta long-lived access token มักมีอายุประมาณ 60 วัน ควรต่ออายุก่อนหมด",
  },
  line: {
    expiresAt: addDaysInput(30),
    note: "ตั้งวันตรวจสอบ LINE token หรือ Channel access token ตามรอบที่ใช้งานจริง",
  },
});

function daysUntil(dateValue: string) {
  if (!dateValue) return null;
  const today = new Date(todayInput());
  const target = new Date(dateValue);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function apiExpiryStatus(dateValue: string) {
  const days = daysUntil(dateValue);
  if (days === null) return { tone: "unknown", label: "ยังไม่ได้ตั้งวันหมดอายุ", days };
  if (days < 0) return { tone: "danger", label: `หมดอายุแล้ว ${Math.abs(days)} วัน`, days };
  if (days <= 7) return { tone: "danger", label: `จะหมดอายุใน ${days} วัน`, days };
  if (days <= 30) return { tone: "warning", label: `จะหมดอายุใน ${days} วัน`, days };
  return { tone: "ready", label: `เหลือ ${days} วัน`, days };
}

const docVatRateForMarketing = (doc: any) => Number(doc?.vatRate ?? doc?.vat_rate ?? 7);
const isSqmBasisForMarketing = (value?: string) => value === "sqm";
const marketingItemBillingBasis = (item: any) =>
  isSqmBasisForMarketing(item?.priceUnit)
  || isSqmBasisForMarketing(item?.costUnit)
  || String(item?.unit || "").includes("ตร.ม")
    ? "sqm"
    : "piece";
const marketingLineQty = (item: any) => Number(item?.qty || item?.quantity || 0);
const marketingHasAreaDimensions = (item: any) =>
  Number(item?.widthM || 0) > 0 || Number(item?.heightM || 0) > 0 || Number(item?.pieces || 0) > 0;
const marketingLineQtyForBasis = (item: any, basis?: string) => {
  if (isSqmBasisForMarketing(basis)) return marketingLineQty(item);
  const pieces = Number(item?.pieces || 0);
  return marketingItemBillingBasis(item) === "sqm" && marketingHasAreaDimensions(item)
    ? (pieces > 0 ? pieces : 1)
    : marketingLineQty(item);
};
const marketingLineAmount = (item: any) =>
  marketingLineQtyForBasis(item, item?.priceUnit || "piece") * Number(item?.price || item?.unitPrice || 0);
const marketingLineCost = (item: any) =>
  marketingLineQtyForBasis(item, item?.costUnit || "piece") * Number(item?.costSnapshot ?? item?.cost ?? item?.unitCost ?? 0);

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
  const subtotal = items.reduce((sum: number, item: any) => sum + marketingLineAmount(item), 0);
  const discountAmt = subtotal * (Number(doc?.discount || 0) / 100);
  const afterDisc = subtotal - discountAmt;
  const vatAmt = doc?.vat ? afterDisc * (docVatRateForMarketing(doc) / 100) : 0;
  return afterDisc + vatAmt;
}

function documentCost(doc: any) {
  if (typeof doc?.costTotal === "number") return doc.costTotal;
  if (typeof doc?.totalCost === "number") return doc.totalCost;
  const items = Array.isArray(doc?.items) ? doc.items : [];
  const lineCost = items.reduce((sum: number, item: any) => {
    const savedCost = Number(item?.costAmount ?? item?.lineCost ?? item?.costTotal ?? 0);
    if (savedCost > 0) return sum + savedCost;
    return sum + marketingLineCost(item);
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

function normalizeMatch(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function isRevenueLead(lead: Lead) {
  return lead.status === "closed_won" && Number(lead.value || 0) > 0;
}

function mappedLeadRevenue(leads: Lead[], field: "campaign" | "adSet" | "creative", value?: string) {
  const target = normalizeMatch(value);
  if (!target) return 0;
  return leads
    .filter((lead) => isRevenueLead(lead) && normalizeMatch(lead[field]) === target)
    .reduce((sum, lead) => sum + Number(lead.value || 0), 0);
}

function mappedLeadCount(leads: Lead[], field: "campaign" | "adSet" | "creative", value?: string, statuses?: Lead["status"][]) {
  const target = normalizeMatch(value);
  if (!target) return 0;
  return leads.filter((lead) => {
    if (normalizeMatch(lead[field]) !== target) return false;
    return statuses ? statuses.includes(lead.status) : true;
  }).length;
}

function creativeRepeatAdvice(row: { spend: number; leads: number; cpl: number; revenue: number; clicks?: number; ctr?: number }) {
  if (row.revenue > 0) return "ควรทำซ้ำ: มีรายได้ที่ map แล้ว";
  if (row.leads >= 20 && row.cpl > 0) return "ควรทำซ้ำ/แตก Hook เพิ่ม: Lead ดี";
  if (row.leads > 0 && row.spend > 0) return "รอดูต่อ: มี Lead แล้ว";
  if (row.spend > 0 && row.leads === 0) return "ควรเปลี่ยน Hook หรือ Artwork";
  return "รอข้อมูลจาก Meta";
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
  const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>("30d");
  const [startDate, setStartDate] = useState(addDaysInput(-29));
  const [endDate, setEndDate] = useState(todayInput());
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => loadLocal(storageKeys.campaigns, defaultCampaigns));
  const [leads, setLeads] = useState<Lead[]>(() => loadLocal(storageKeys.leads, defaultLeads));
  const [apiExpiries, setApiExpiries] = useState<Record<string, ApiExpiryConfig>>(() =>
    loadLocal(storageKeys.apiExpiries, defaultApiExpiries()),
  );
  const [sourceLogs, setSourceLogs] = useState<string[]>([]);
  const [activeSourceLog, setActiveSourceLog] = useState<string>("ทั้งหมด");
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
  const [aiCrawlers, setAiCrawlers] = useState<any>({ loading: true, connected: false, error: "", totals: {}, byBot: [], byPath: [], recent: [] });

  useEffect(() => saveLocal(storageKeys.campaigns, campaigns), [campaigns]);
  useEffect(() => saveLocal(storageKeys.leads, leads), [leads]);
  useEffect(() => saveLocal(storageKeys.apiExpiries, apiExpiries), [apiExpiries]);

  const setPresetRange = (mode: DateRangeMode) => {
    setDateRangeMode(mode);
    if (mode === "7d") {
      setStartDate(addDaysInput(-6));
      setEndDate(todayInput());
    }
    if (mode === "30d") {
      setStartDate(addDaysInput(-29));
      setEndDate(todayInput());
    }
    if (mode === "month") {
      setStartDate(monthStartInput());
      setEndDate(todayInput());
    }
    if (mode === "all") {
      setStartDate("");
      setEndDate("");
    }
  };

  const sourceUrl = useCallback((baseUrl: string) => {
    if (dateRangeMode === "all" || !startDate || !endDate) return baseUrl;
    const params = new URLSearchParams({ startDate, endDate });
    return `${baseUrl}?${params.toString()}`;
  }, [dateRangeMode, endDate, startDate]);

  const addSourceLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleString("th-TH", { hour12: false });
    setSourceLogs((prev) => [`${timestamp} - ${message}`, ...prev].slice(0, 30));
  }, []);

  const loadMarketingSources = useCallback(async (trigger = "auto") => {
    const load = async (name: string, url: string) => {
      const response = await fetch(url, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || `${name} API failed with ${response.status}`);
      }
      return data;
    };

    setGa4((prev: any) => ({ ...prev, loading: true }));
    setMeta((prev: any) => ({ ...prev, loading: true }));
    setAiCrawlers((prev: any) => ({ ...prev, loading: true }));

    const [ga4Data, metaData, aiCrawlerData] = await Promise.allSettled([
      load("GA4", sourceUrl("/api/marketing/ga4")),
      load("Meta", sourceUrl("/api/marketing/meta")),
      load("AI Crawlers", sourceUrl("/api/marketing/ai-crawlers")),
    ]);

    if (ga4Data.status === "fulfilled") {
      setGa4({ loading: false, ...ga4Data.value });
      addSourceLog(ga4Data.value?.connected
        ? `GA4 sync สำเร็จ (${trigger})`
        : `GA4 เรียก API ได้ แต่ยังไม่พร้อมใช้งาน: ${ga4Data.value?.error || "ยังไม่มีข้อมูล"}`);
    } else {
      setGa4({ loading: false, connected: false, error: ga4Data.reason?.message || "เชื่อมต่อ GA4 ไม่สำเร็จ", totals: {} });
      addSourceLog(`GA4 sync ไม่สำเร็จ: ${ga4Data.reason?.message || "Unknown error"}`);
    }

    if (metaData.status === "fulfilled") {
      setMeta({ loading: false, ...metaData.value });
      addSourceLog(metaData.value?.connected
        ? `Meta Ads sync สำเร็จ (${trigger})`
        : `Meta Ads เรียก API ได้ แต่ยังไม่พร้อมใช้งาน: ${metaData.value?.error || "ยังไม่มีข้อมูล"}`);
    } else {
      setMeta({ loading: false, connected: false, error: metaData.reason?.message || "เชื่อมต่อ Meta ไม่สำเร็จ", totals: {}, campaigns: [], adSets: [], ads: [] });
      addSourceLog(`Meta Ads sync ไม่สำเร็จ: ${metaData.reason?.message || "Unknown error"}`);
    }

    if (aiCrawlerData.status === "fulfilled") {
      setAiCrawlers({ loading: false, ...aiCrawlerData.value });
      addSourceLog(aiCrawlerData.value?.connected
        ? `AI crawler sync สำเร็จ (${trigger})`
        : `AI crawler API เรียกได้ แต่ยังไม่พร้อมใช้งาน: ${aiCrawlerData.value?.error || "ยังไม่มีข้อมูล"}`);
    } else {
      setAiCrawlers({ loading: false, connected: false, error: aiCrawlerData.reason?.message || "เชื่อมต่อ AI crawler log ไม่สำเร็จ", totals: {}, byBot: [], byPath: [], recent: [] });
      addSourceLog(`AI crawler sync ไม่สำเร็จ: ${aiCrawlerData.reason?.message || "Unknown error"}`);
    }
  }, [addSourceLog, sourceUrl]);

  useEffect(() => {
    loadMarketingSources("date range");
  }, [loadMarketingSources]);

  const filteredDocuments = useMemo(
    () => documents.filter((doc) => isInRange(doc?.date || doc?.createdAt || doc?.created_at, startDate, endDate, dateRangeMode)),
    [documents, startDate, endDate, dateRangeMode],
  );

  const receipts = useMemo(
    () => filteredDocuments.filter((doc) => doc?.type === "receipt" && !doc?.deleted && doc?.status !== "cancelled"),
    [filteredDocuments],
  );

  const filteredLeads = useMemo(
    () => leads.filter((lead) => isInRange(lead.date, startDate, endDate, dateRangeMode)),
    [leads, startDate, endDate, dateRangeMode],
  );

  const receiptRevenue = useMemo(() => {
    return receipts.reduce((sum, doc) => sum + documentTotal(doc), 0);
  }, [receipts]);
  const receiptCost = useMemo(() => {
    return receipts.reduce((sum, doc) => sum + documentCost(doc), 0);
  }, [receipts]);
  const metaSpend = Number(meta?.totals?.spend ?? 0);
  const metaReportedRevenue = Number(meta?.totals?.metaReportedRevenue ?? 0);
  const metaReportedRoas = Number(meta?.totals?.metaReportedRoas ?? 0) || (metaSpend > 0 && metaReportedRevenue > 0 ? metaReportedRevenue / metaSpend : 0);
  const metaMessageLeads = Number(meta?.totals?.messageLeads ?? 0);
  const metaFormLeads = Number(meta?.totals?.formLeads ?? 0);
  const metaLeadBreakdown = Array.isArray(meta?.totals?.leadBreakdown) ? meta.totals.leadBreakdown : [];
  const manualSpend = campaigns.reduce((sum, campaign) => sum + Number(campaign.spend || 0), 0);
  const marketingSpend = meta.connected ? metaSpend : manualSpend;
  const crmLeads = filteredLeads.length;
  const metaLeads = Number(meta?.totals?.leads ?? 0);
  const campaignLeads = campaigns.reduce((sum, campaign) => sum + Number(campaign.leads || 0), 0);
  const totalLeads = crmLeads + metaLeads + campaignLeads;
  const contactedLeads = filteredLeads.filter((lead) => ["contacted", "waiting_detail", "detail_completed", "quotation_sent", "follow_up", "waiting_payment", "closed_won"].includes(lead.status)).length;
  const qualifiedLeads = filteredLeads.filter((lead) => ["detail_completed", "quotation_sent", "follow_up", "waiting_payment", "closed_won"].includes(lead.status)).length;
  const quotationSent = filteredDocuments.filter((doc) => doc?.type === "quote" && !doc?.deleted && doc?.status !== "cancelled").length
    + filteredLeads.filter((lead) => ["quotation_sent", "follow_up", "waiting_payment", "closed_won"].includes(lead.status)).length;
  const closedJobs = receipts.length;
  const closedLeadCount = filteredLeads.filter((lead) => lead.status === "closed_won").length;
  const closedLeadRevenue = filteredLeads.filter(isRevenueLead).reduce((sum, lead) => sum + Number(lead.value || 0), 0);
  const grossProfit = receiptRevenue - receiptCost;
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
        revenue: mappedLeadRevenue(filteredLeads, "campaign", row.name) || Number(row.revenue || 0),
        metaReportedRevenue: Number(row.metaReportedRevenue || 0),
        metaReportedRoas: Number(row.metaReportedRoas || 0),
        actionValues: Array.isArray(row.actionValues) ? row.actionValues : [],
        note: "ข้อมูลจาก Meta API",
      }))
    : campaigns;

  const facebookRows = campaignRows
    .filter((row: Campaign) => /facebook|meta/i.test(row.channel))
    .map((row: Campaign) => {
      const qualifiedFromCampaign = filteredLeads.filter((lead) => lead.campaign === row.name && ["detail_completed", "quotation_sent", "follow_up", "waiting_payment", "closed_won"].includes(lead.status)).length;
      const quotationFromCampaign = filteredLeads.filter((lead) => lead.campaign === row.name && ["quotation_sent", "follow_up", "waiting_payment", "closed_won"].includes(lead.status)).length;
      const closedFromCampaign = filteredLeads.filter((lead) => lead.campaign === row.name && lead.status === "closed_won").length;
      const mappedRevenue = mappedLeadRevenue(filteredLeads, "campaign", row.name) || Number(row.revenue || 0);
      const rowProfit = Math.max(0, mappedRevenue - row.spend);
      return {
        ...row,
        revenue: mappedRevenue,
        objective: row.note || "LINE Inquiry",
        reach: Number((row as any).reach || 0),
        impressions: Number((row as any).impressions || 0),
        clicks: Number((row as any).clicks || 0),
        metaReportedRevenue: Number((row as any).metaReportedRevenue || 0),
        metaReportedRoas: Number((row as any).metaReportedRoas || 0),
        actionValues: Array.isArray((row as any).actionValues) ? (row as any).actionValues : [],
        qualifiedLeads: qualifiedFromCampaign,
        quotations: quotationFromCampaign,
        closedJobs: closedFromCampaign,
        grossProfit: rowProfit,
        profitRoas: row.spend ? rowProfit / row.spend : 0,
        recommendation: row.spend > 0 && row.leads === 0 ? "หยุด/ตรวจ Creative" : row.leads > 0 ? "รอดูต่อ" : "รอข้อมูล",
      };
    });
  const facebookMappedRevenue = facebookRows.reduce((sum, row) => sum + Number(row.revenue || 0), 0);
  const facebookErpRevenue = receipts
    .filter((doc) => /facebook|meta/i.test(`${doc?.leadSource || doc?.lead_source || ""} ${doc?.marketingCampaign || doc?.marketing_campaign || ""}`))
    .reduce((sum, doc) => sum + documentTotal(doc), 0);
  const facebookAttributedRevenue = facebookErpRevenue || facebookMappedRevenue;
  const facebookMappedRoas = metaSpend > 0 && facebookMappedRevenue > 0 ? facebookMappedRevenue / metaSpend : 0;
  const facebookErpRoas = metaSpend > 0 && facebookAttributedRevenue > 0 ? facebookAttributedRevenue / metaSpend : 0;

  const metaAdSetRows = Array.isArray(meta?.adSets) ? meta.adSets : [];
  const adSetRows = metaAdSetRows.length
    ? metaAdSetRows.map((row: any) => ({
        campaign: row.campaignName || "-",
        adSetName: row.name || "Meta Ad Set",
        audience: row.name || "Meta audience",
        budget: row.spend,
        spend: Number(row.spend || 0),
        leads: Number(row.leads || 0),
        cpl: Number(row.cpl || 0),
        qualifiedLeads: mappedLeadCount(filteredLeads, "adSet", row.name, ["detail_completed", "quotation_sent", "follow_up", "waiting_payment", "closed_won"]),
        closedJobs: mappedLeadCount(filteredLeads, "adSet", row.name, ["closed_won"]),
        closeRate: row.leads ? (Number(row.leads || 0) / Math.max(Number(row.clicks || 0), 1)) * 100 : 0,
        revenue: mappedLeadRevenue(filteredLeads, "adSet", row.name),
        metaReportedRevenue: Number(row.metaReportedRevenue || 0),
        metaReportedRoas: Number(row.metaReportedRoas || 0),
      }))
    : facebookRows.map((row) => ({
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
        metaReportedRevenue: Number((row as any).metaReportedRevenue || 0),
        metaReportedRoas: Number((row as any).metaReportedRoas || 0),
      }));

  const metaAdRows = Array.isArray(meta?.ads) ? meta.ads : [];
  const creativeRows = metaAdRows.length
    ? metaAdRows.map((row: any) => ({
        creativeName: row.name || "Meta Creative",
        creativeType: "Meta Ad",
        hook: row.name || "รอดูชื่อ Creative จาก Meta",
        product: row.campaignName || "-",
        campaign: row.campaignName || "-",
        spend: Number(row.spend || 0),
        leads: Number(row.leads || 0),
        advice: creativeRepeatAdvice({
          spend: Number(row.spend || 0),
          leads: Number(row.leads || 0),
          cpl: Number(row.cpl || 0),
          revenue: mappedLeadRevenue(filteredLeads, "creative", row.name),
          clicks: Number(row.clicks || 0),
          ctr: Number(row.ctr || 0),
        }),
        qualifiedLeads: mappedLeadCount(filteredLeads, "creative", row.name, ["detail_completed", "quotation_sent", "follow_up", "waiting_payment", "closed_won"]),
        quotations: mappedLeadCount(filteredLeads, "creative", row.name, ["quotation_sent", "follow_up", "waiting_payment", "closed_won"]),
        closedJobs: mappedLeadCount(filteredLeads, "creative", row.name, ["closed_won"]),
        revenue: mappedLeadRevenue(filteredLeads, "creative", row.name),
        cpl: Number(row.cpl || 0),
        metaReportedRevenue: Number(row.metaReportedRevenue || 0),
        metaReportedRoas: Number(row.metaReportedRoas || 0),
        note: `CTR ${money(Number(row.ctr || 0))}% / CPC ฿${money(Number(row.cpc || 0))}`,
      }))
    : facebookRows.map((row) => ({
        creativeName: `${row.name} Creative`,
        creativeType: "Real Work Photo",
        hook: "ส่งรูปงานจริง + CTA ทัก LINE",
        product: row.name.includes("Sticker") ? "Sticker" : "Vinyl Banner",
        campaign: row.name,
        spend: row.spend,
        leads: row.leads,
        advice: creativeRepeatAdvice({
          spend: row.spend,
          leads: row.leads,
          cpl: row.leads ? row.spend / row.leads : 0,
          revenue: row.revenue,
        }),
        qualifiedLeads: row.qualifiedLeads,
        quotations: row.quotations,
        closedJobs: row.closedJobs,
        revenue: row.revenue,
        cpl: row.leads ? row.spend / row.leads : 0,
        metaReportedRevenue: Number((row as any).metaReportedRevenue || 0),
        metaReportedRoas: Number((row as any).metaReportedRoas || 0),
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

  const deleteLead = (leadId: string) => {
    const target = leads.find((lead) => lead.id === leadId);
    const confirmed = typeof window === "undefined"
      ? true
      : window.confirm(`ลบ Lead "${target?.name || leadId}" ใช่ไหม?`);
    if (!confirmed) return;
    setLeads((prev) => prev.filter((lead) => lead.id !== leadId));
    showToast?.("ลบ Lead แล้ว", "success");
  };

  const toggleLeadTag = (tag: string) => {
    setLeadForm((prev) => ({
      ...prev,
      behaviorTags: prev.behaviorTags.includes(tag)
        ? prev.behaviorTags.filter((item) => item !== tag)
        : [...prev.behaviorTags, tag],
    }));
  };

  const updateApiExpiry = (id: string, updates: Partial<ApiExpiryConfig>) => {
    setApiExpiries((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { expiresAt: "", note: "" }),
        ...updates,
      },
    }));
  };

  const exportMarketingCsv = () => {
    const rows = [
      ["Metric", "Value", "Note"],
      ...cards.map((card) => [card.label, card.value, card.sub]),
      [],
      ["Campaign", "Channel", "Spend", "Leads", "Revenue", "Recommendation"],
      ...campaignRows.map((row: Campaign) => [row.name, row.channel, row.spend, row.leads, row.revenue, row.note]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dwm-marketing-dashboard-${todayInput()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast?.("Export CSV สำเร็จ", "success");
  };

  const cards = [
    { label: "AI Search Visits", value: money(Number(aiCrawlers?.totals?.visits ?? 0)), sub: aiCrawlers.connected ? `${money(Number(aiCrawlers?.totals?.bots ?? 0))} bots / ${money(Number(aiCrawlers?.totals?.pages ?? 0))} pages` : "รอข้อมูล AI crawler", tone: "teal" },
    { label: "Meta Reported Revenue", value: metaReportedRevenue ? `THB ${money(metaReportedRevenue)}` : "-", sub: "action_values / purchase", tone: "orange" },
    { label: "Meta Reported ROAS", value: metaReportedRoas ? metaReportedRoas.toFixed(2) : "-", sub: "purchase_roas from Meta", tone: "purple" },
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

  const overviewCards = cards.filter((card) => [
    "Revenue",
    "Marketing Spend",
    "Total Leads",
    "Cost per Lead",
    "Closed Jobs",
    "ROAS",
    "Gross Profit",
    "Average Order Value",
  ].includes(card.label));

  const maxKpiValue = Math.max(receiptRevenue, marketingSpend, Math.max(0, grossProfit), 1);
  const kpiBars = [
    { label: "ERP Revenue", value: receiptRevenue, color: "#ff6b00" },
    { label: "Marketing Spend", value: marketingSpend, color: "#8b5cf6" },
    { label: "Gross Profit", value: Math.max(0, grossProfit), color: "#22c55e" },
  ];
  const leadPipelineBars = [
    { label: "Total Leads", value: totalLeads, color: "#2563eb" },
    { label: "Qualified", value: qualifiedLeads, color: "#14b8a6" },
    { label: "Quotations", value: quotationSent, color: "#f59e0b" },
    { label: "Closed Jobs", value: closedJobs, color: "#ff6b00" },
  ];
  const maxLeadPipeline = Math.max(...leadPipelineBars.map((item) => Number(item.value || 0)), 1);
  const topCampaignRows = campaignRows.slice(0, 6);
  const topAdSetRows = adSetRows.slice(0, 8);
  const topCreativeRows = creativeRows.slice(0, 8);
  const topAiBots = (aiCrawlers.byBot || []).slice(0, 8);
  const topAiPages = (aiCrawlers.byPath || []).slice(0, 8);
  const topAiIntents = (aiCrawlers.byIntent || []).slice(0, 8);
  const topAiReferrers = (aiCrawlers.byReferrer || []).slice(0, 6);
  const recentAiRows = (aiCrawlers.recent || []).slice(0, 12);
  const maxAiBotCount = Math.max(...topAiBots.map((item: any) => Number(item.count || 0)), 1);
  const maxAiPageCount = Math.max(...topAiPages.map((item: any) => Number(item.count || 0)), 1);
  const maxAiIntentCount = Math.max(...topAiIntents.map((item: any) => Number(item.count || 0)), 1);
  const maxAiReferrerCount = Math.max(...topAiReferrers.map((item: any) => Number(item.count || 0)), 1);

  const sources = [
    {
      id: "ga4",
      name: "GA4",
      account: "G-GHBQ0VT4NE",
      detail: ga4.connected ? `${money(Number(ga4?.totals?.sessions ?? 0))} sessions` : ga4.error || "รอเชื่อมต่อ",
      ready: !!ga4.connected,
      error: ga4.error || "",
      tokenType: "Service account key",
      expiry: apiExpiries.ga4 || defaultApiExpiries().ga4,
      envKeys: "GA4_PROPERTY_ID, GA4_CLIENT_EMAIL, GA4_PRIVATE_KEY",
    },
    {
      id: "meta",
      name: "Facebook Pixel / Ads",
      account: "Meta App / Ad Account",
      detail: meta.connected ? `Spend ฿${money(metaSpend)} / Leads ${money(Number(meta?.totals?.leads ?? 0))}` : meta.error || "รอเชื่อมต่อ",
      ready: !!meta.connected,
      error: meta.error || "",
      tokenType: "Meta access token",
      expiry: apiExpiries.meta || defaultApiExpiries().meta,
      envKeys: "META_AD_ACCOUNT_ID, META_ACCESS_TOKEN",
    },
    {
      id: "line",
      name: "LINE OA",
      account: "@displayworks",
      detail: "ใช้บันทึก Lead และ Source ใน CRM",
      ready: false,
      error: "ยังไม่ได้เชื่อม LINE Messaging API",
      tokenType: "LINE channel token",
      expiry: apiExpiries.line || defaultApiExpiries().line,
      envKeys: "LINE_CHANNEL_ACCESS_TOKEN (ยังไม่ได้ทำ endpoint)",
    },
    {
      id: "ai-crawlers",
      name: "AI Search Crawlers",
      account: "OpenAI / Claude / Perplexity / Google / Meta / Apple / Common Crawl",
      detail: aiCrawlers.connected
        ? `${money(Number(aiCrawlers?.totals?.visits ?? 0))} visits จาก ${money(Number(aiCrawlers?.totals?.bots ?? 0))} bots`
        : aiCrawlers.error || "รอสร้างตาราง ai_crawler_visits ใน Supabase",
      ready: !!aiCrawlers.connected,
      error: aiCrawlers.error || "",
      tokenType: "Public crawler log",
      expiry: null,
      envKeys: "supabase/ai-crawler-visits.sql",
    },
    {
      id: "erp",
      name: "ERP Receipts",
      account: "Supabase ERP",
      detail: `${receipts.length} ใบเสร็จ ใช้คำนวณ Revenue / Cost / Profit`,
      ready: true,
      error: "",
      tokenType: "Internal database",
      expiry: null,
      envKeys: "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY",
    },
  ];

  const apiExpiryAlerts = sources
    .filter((source) => source.expiry)
    .map((source) => {
      const status = apiExpiryStatus(source.expiry?.expiresAt || "");
      return { source, status };
    })
    .filter(({ status }) => status.tone === "warning" || status.tone === "danger" || status.tone === "unknown")
    .map(({ source, status }) => `${source.name}: ${status.label}`);

  const alerts = [
    !meta.connected ? "Facebook Ads ยังไม่ได้เชื่อมต่อ หรือ API ยังไม่มีข้อมูลล่าสุด" : "",
    !ga4.connected ? "GA4 ยังไม่ได้เชื่อมต่อกับ Dashboard data API" : "",
    conversionRate === null ? "Conversion Rate คำนวณไม่ได้ เพราะ Closed Jobs มากกว่า Leads หรือยังไม่มี Mapping" : "",
    filteredLeads.some((lead) => leadScore(lead) >= 70 && !lead.nextFollowUp) ? "มี Hot Lead ที่ยังไม่มีวัน Follow-up" : "",
    quotationSent > 0 && quoteToCloseRate === null ? "Quote to Close Rate ยังไม่ควรคำนวณ เพราะข้อมูลใบเสนอราคาและใบเสร็จยังไม่ได้ Mapping" : "",
    ...apiExpiryAlerts,
  ].filter(Boolean);

  const rangeLabel = dateRangeMode === "all"
    ? "ข้อมูลทั้งหมด"
    : `${startDate || "-"} ถึง ${endDate || "-"}`;

  const visibleSourceLogs = activeSourceLog === "ทั้งหมด"
    ? sourceLogs
    : sourceLogs.filter((log) => log.includes(activeSourceLog));

  const trafficRows = Array.isArray(ga4?.traffic) ? ga4.traffic : [];
  const sessionsByChannel = (keyword: string) =>
    trafficRows
      .filter((row: any) => `${row.channel || ""} ${row.sourceMedium || ""}`.toLowerCase().includes(keyword.toLowerCase()))
      .reduce((sum: number, row: any) => sum + Number(row.sessions || 0), 0);
  const lineLeads = filteredLeads.filter((lead) => /line/i.test(`${lead.source} ${lead.contact || ""}`)).length;
  const directSessions = sessionsByChannel("direct");
  const organicSessions = sessionsByChannel("organic");
  const channelRows = [
    {
      name: "Facebook Ads",
      primary: `${money(metaLeads)} leads`,
      secondary: `Spend ฿${money(metaSpend)} / Clicks ${money(Number(meta?.totals?.clicks || 0))}`,
      roas: roas ? roas.toFixed(2) : "รอ Mapping รายได้",
      mixValue: metaLeads || Number(meta?.totals?.clicks || 0) || metaSpend,
      color: "#ff6b00",
    },
    {
      name: "LINE OA",
      primary: `${money(lineLeads)} CRM leads`,
      secondary: "รอเชื่อม LINE API เพื่ออ่าน message/conversation จริง",
      roas: "รอ Mapping รายได้",
      mixValue: lineLeads,
      color: "#22c55e",
    },
    {
      name: "Google / Organic",
      primary: `${money(organicSessions)} sessions`,
      secondary: ga4.connected ? "จาก GA4 channel/source" : "รอ GA4 API",
      roas: "ไม่ใช่ paid channel",
      mixValue: organicSessions,
      color: "#2563eb",
    },
    {
      name: "Direct",
      primary: `${money(directSessions)} sessions`,
      secondary: ga4.connected ? "จาก GA4 direct traffic" : "รอ GA4 API",
      roas: "ไม่ใช่ paid channel",
      mixValue: directSessions,
      color: "#8b5cf6",
    },
  ];
  const totalChannelMix = channelRows.reduce((sum, row) => sum + Number(row.mixValue || 0), 0);
  const customerChartColors = ["#ff6b00", "#22c55e", "#2563eb", "#f59e0b", "#8b5cf6", "#14b8a6", "#ef4444"];
  const sumRows = (rows: any[], key = "value") => rows.reduce((sum, row) => sum + Number(row[key] || 0), 0);
  const maxRows = (rows: any[], key = "value") => Math.max(1, ...rows.map((row) => Number(row[key] || 0)));
  const summarizeRows = (rows: any[], labelFn: (row: any) => string, valueFn: (row: any) => number = () => 1) => {
    const map = new Map<string, number>();
    rows.forEach((row) => {
      const label = String(labelFn(row) || "ไม่ระบุ").trim() || "ไม่ระบุ";
      map.set(label, (map.get(label) || 0) + valueFn(row));
    });
    return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  };
  const customerDocKey = (doc: any) => String(doc?.customerId || doc?.customer_id || doc?.customerName || doc?.customer_name || "").trim();
  const docsByCustomer = new Map<string, any[]>();
  filteredDocuments
    .filter((doc) => !doc?.deleted && doc?.status !== "cancelled")
    .forEach((doc) => {
      const key = customerDocKey(doc);
      if (!key) return;
      docsByCustomer.set(key, [...(docsByCustomer.get(key) || []), doc]);
    });
  const repeatCustomers = customers.filter((customer) => {
    const docs = docsByCustomer.get(String(customer.id)) || docsByCustomer.get(String(customer.name || "").trim()) || [];
    return docs.length > 1;
  }).length;
  const customerSourceRows = (() => {
    const map = new Map<string, { label: string; customers: Set<string>; docs: number; revenue: number }>();
    filteredDocuments
      .filter((doc) => !doc?.deleted && doc?.status !== "cancelled")
      .forEach((doc) => {
        const label = doc?.leadSource || doc?.lead_source || "ไม่ระบุ";
        const entry = map.get(label) || { label, customers: new Set<string>(), docs: 0, revenue: 0 };
        const key = customerDocKey(doc);
        if (key) entry.customers.add(key);
        entry.docs += 1;
        if (doc?.type === "receipt") entry.revenue += documentTotal(doc);
        map.set(label, entry);
      });
    return [...map.values()]
      .map((entry) => ({ label: entry.label, customers: entry.customers.size, docs: entry.docs, revenue: entry.revenue }))
      .sort((a, b) => b.customers - a.customers || b.revenue - a.revenue);
  })();
  const customerSegmentRows = summarizeRows(customers, (customer) => customer.customerSegment || customer.customer_segment || "ไม่ระบุ");
  const customerBusinessRows = summarizeRows(customers, (customer) => customer.businessType || customer.business_type || "ไม่ระบุ").slice(0, 8);
  const customerProvinceRows = summarizeRows(customers, inferProvince).slice(0, 8);
  const customerDistrictRows = summarizeRows(customers, inferDistrict).slice(0, 8);
  const customerProductRows = (() => {
    const map = new Map<string, { label: string; docs: Set<string>; qty: number; revenue: number; profit: number }>();
    receipts.forEach((doc) => {
      (Array.isArray(doc?.items) ? doc.items : []).forEach((item: any) => {
        const label = item?.name || "ไม่ระบุสินค้า/บริการ";
        const entry = map.get(label) || { label, docs: new Set<string>(), qty: 0, revenue: 0, profit: 0 };
        const revenue = marketingLineAmount(item);
        const cost = marketingLineCost(item);
        entry.docs.add(String(doc?.id || doc?.docNo || doc?.doc_no || label));
        entry.qty += Number(item?.qty || item?.quantity || 0);
        entry.revenue += revenue;
        entry.profit += revenue - cost;
        map.set(label, entry);
      });
    });
    return [...map.values()]
      .map((entry) => ({ ...entry, jobs: entry.docs.size }))
      .sort((a, b) => b.jobs - a.jobs || b.revenue - a.revenue)
      .slice(0, 8);
  })();
  const donutStops = (rows: any[], key = "value") => {
    const total = sumRows(rows, key);
    let start = 0;
    if (!rows.length || total <= 0) return "#1f2937 0% 100%";
    return rows.map((row, index) => {
      const pct = Number(row[key] || 0) / total * 100;
      const segment = `${customerChartColors[index % customerChartColors.length]} ${start}% ${start + pct}%`;
      start += pct;
      return segment;
    }).join(", ");
  };
  const hasSalesMapping = crmLeads > 0;
  const budgetTarget = plannedBudget || marketingSpend;

  const marketingFunnel = [
    { label: "Visitor", value: Number(ga4?.totals?.activeUsers ?? ga4?.totals?.sessions ?? 0), color: "#2563eb" },
    { label: "Lead", value: totalLeads, color: "#06b6d4" },
    { label: "Qualified Lead", value: qualifiedLeads, color: "#22c55e" },
  ];
  const salesFunnel = hasSalesMapping ? [
    { label: "Lead", value: crmLeads, color: "#2563eb" },
    { label: "Contacted", value: contactedLeads, color: "#06b6d4" },
    { label: "Detail Completed", value: filteredLeads.filter((lead) => ["detail_completed", "quotation_sent", "follow_up", "waiting_payment", "closed_won"].includes(lead.status)).length, color: "#22c55e" },
    { label: "Quotation Sent", value: quotationSent, color: "#f59e0b" },
    { label: "Closed Won", value: closedLeadCount, color: "#ff6b00" },
  ] : [];

  const trendLength = dateRangeMode === "7d" ? 7 : 30;
  const trendEnd = endDate || todayInput();
  const trendDates = Array.from({ length: trendLength }, (_, index) => {
    const date = new Date(`${trendEnd}T00:00:00`);
    date.setDate(date.getDate() - (trendLength - 1 - index));
    return dateInputValue(date);
  });
  const trendMap = (rows: any[], dateFn: (row: any) => unknown, valueFn: (row: any) => number): TrendPoint[] => {
    const values = new Map(trendDates.map((date) => [date, 0]));
    rows.forEach((row) => {
      const date = safeDateValue(dateFn(row));
      if (!values.has(date)) return;
      values.set(date, (values.get(date) || 0) + Number(valueFn(row) || 0));
    });
    return trendDates.map((date) => ({ date, value: values.get(date) || 0 }));
  };
  const trendTotal = (points: TrendPoint[]) => points.reduce((sum, point) => sum + Number(point.value || 0), 0);
  const trendDelta = (points: TrendPoint[]) => {
    const splitAt = Math.floor(points.length / 2);
    const previous = trendTotal(points.slice(0, splitAt));
    const current = trendTotal(points.slice(splitAt));
    if (previous <= 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  const revenueTrend = trendMap(receipts, (doc) => doc?.date || doc?.createdAt || doc?.created_at, (doc) => documentTotal(doc));
  const profitTrend = trendMap(receipts, (doc) => doc?.date || doc?.createdAt || doc?.created_at, (doc) => documentTotal(doc) - documentCost(doc));
  const closedJobTrend = trendMap(receipts, (doc) => doc?.date || doc?.createdAt || doc?.created_at, () => 1);
  const leadTrend = trendMap(filteredLeads, (lead) => lead.date, () => 1);
  const quoteTrend = trendMap(
    filteredDocuments.filter((doc) => doc?.type === "quote" && !doc?.deleted && doc?.status !== "cancelled"),
    (doc) => doc?.date || doc?.createdAt || doc?.created_at,
    () => 1,
  );
  const aiVisitSourceRows = Array.isArray(aiCrawlers.daily) && aiCrawlers.daily.length
    ? aiCrawlers.daily
    : Array.isArray(aiCrawlers.recent)
      ? aiCrawlers.recent
      : [];
  const aiVisitTrend = trendMap(
    aiVisitSourceRows,
    (row) => row.date || row.created_at || row.createdAt || row.time,
    (row) => Number(row.count || 1),
  );
  const growthPanels = [
    { title: "Revenue Growth", value: `THB ${money(trendTotal(revenueTrend))}`, detail: "ERP receipt revenue by day", color: "#ff6b00", points: revenueTrend },
    { title: "Profit Growth", value: `THB ${money(trendTotal(profitTrend))}`, detail: "Revenue minus real cost", color: "#22c55e", points: profitTrend },
    { title: "Lead Growth", value: money(trendTotal(leadTrend)), detail: "CRM leads by day", color: "#2563eb", points: leadTrend },
    { title: "Closed Jobs Growth", value: money(trendTotal(closedJobTrend)), detail: "Receipt count by day", color: "#f59e0b", points: closedJobTrend },
  ];
  const sectionGrowthPanels =
    activeSection === "orders"
      ? [growthPanels[0], growthPanels[1], growthPanels[3]]
      : activeSection === "leads"
        ? [growthPanels[2], { title: "Quotation Growth", value: money(trendTotal(quoteTrend)), detail: "ERP quotation count by day", color: "#8b5cf6", points: quoteTrend }, growthPanels[3]]
        : activeSection === "ai"
          ? [{ title: "AI Crawl Growth", value: money(trendTotal(aiVisitTrend)), detail: "Recent AI/Search bot visits", color: "#14b8a6", points: aiVisitTrend }]
          : [];

  const navItems: { id: MarketingSection; label: string; desc: string }[] = [
    { id: "dashboard", label: "Overview", desc: "Main KPI summary" },
    { id: "facebook", label: "Ads Performance", desc: "Meta spend, campaigns, creatives" },
    { id: "leads", label: "Leads & CRM", desc: "Lead list and follow-up" },
    { id: "customers", label: "Customer Intel", desc: "Source, segment, service demand" },
    { id: "orders", label: "Sales Pipeline", desc: "Quotes, jobs, revenue from ERP" },
    { id: "reports", label: "Reports", desc: "Export and decision view" },
    { id: "sources", label: "Data & API", desc: "GA4, Meta, LINE, token expiry" },
    { id: "ai", label: "AI Search", desc: "Crawler visits and AI visibility" },
  ];

  const showDashboard = activeSection === "dashboard";

  return (
    <div className="mk-dashboard">
      <style>{`
        .mk-dashboard{font-family:'Prompt',sans-serif;color:#f8fafc;min-height:100%;background:radial-gradient(circle at 80% 0%,rgba(255,107,0,.18),transparent 34%),#080d14;border:1px solid rgba(255,107,0,.2);border-radius:24px;overflow:hidden}
        .mk-shell{display:grid;grid-template-columns:260px 1fr;min-height:calc(100dvh - 92px)}
        .mk-sidebar{background:rgba(0,0,0,.36);border-right:1px solid rgba(255,107,0,.18);padding:26px}
        .mk-brand{display:flex;gap:14px;align-items:center;margin-bottom:28px}
        .mk-logo{width:52px;height:42px;border-radius:12px;border:1px solid rgba(255,107,0,.35);display:grid;place-items:center;background:rgba(255,255,255,.04);overflow:hidden}
        .mk-logo img{width:46px;height:34px;object-fit:contain;display:block}
        .mk-nav{display:grid;gap:10px}
        .mk-nav button{background:transparent;border:1px solid transparent;color:#a8b0c0;text-align:left;padding:14px 16px;border-radius:14px;font-weight:800;cursor:pointer}
        .mk-nav button.active,.mk-nav button:hover{background:#ff6b00;color:#fff}
        .mk-nav-label{display:block;font-size:15px}
        .mk-nav-desc{display:block;margin-top:4px;font-size:11px;line-height:1.35;color:#718096;font-weight:700}
        .mk-nav button.active .mk-nav-desc,.mk-nav button:hover .mk-nav-desc{color:rgba(255,255,255,.78)}
        .mk-main{padding:30px;overflow:auto}
        .mk-top{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:24px}
        .mk-eyebrow{color:#ff6b00;font-size:12px;letter-spacing:.24em;font-weight:900;text-transform:uppercase}
        .mk-title{font-size:clamp(26px,3vw,38px);line-height:1.1;margin:12px 0 10px;font-weight:900}
        .mk-sub{color:#a8b0c0;max-width:760px;line-height:1.75}
        .mk-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}
        .mk-btn{border:1px solid rgba(255,255,255,.12);background:#101827;color:#fff;border-radius:12px;padding:12px 16px;font-weight:900;cursor:pointer}
        .mk-btn.active{background:#ff6b00;border-color:#ff6b00;color:#fff}
        .mk-btn.orange{background:#ff6b00;border-color:#ff6b00}
        .mk-mobile-tabs{display:none;gap:8px;overflow:auto;padding:0 0 12px;margin:-4px 0 16px}
        .mk-mobile-tabs button{white-space:nowrap;border:1px solid rgba(255,255,255,.12);background:#101827;color:#cbd5e1;border-radius:999px;padding:10px 13px;font-weight:900}
        .mk-mobile-tabs button.active{background:#ff6b00;border-color:#ff6b00;color:#fff}
        .mk-date-controls{display:grid;gap:10px;justify-items:end}.mk-date-presets{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.mk-date-fields{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.mk-date-fields input{background:#101827;border:1px solid rgba(255,255,255,.12);border-radius:12px;color:#fff;padding:11px 12px;font:inherit}
        .mk-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;align-items:start}
        .mk-growth-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:16px}
        .mk-growth-card{background:linear-gradient(180deg,rgba(17,25,35,.98),rgba(10,16,24,.98));border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:18px;min-width:0}
        .mk-growth-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}
        .mk-growth-head span{color:#94a3b8;font-size:12px;line-height:1.55}
        .mk-growth-value{display:block;margin-top:8px;font-size:24px;line-height:1;font-weight:900;color:#fff}
        .mk-growth-delta{border-radius:999px;padding:6px 9px;font-size:12px;font-weight:900;white-space:nowrap;background:rgba(34,197,94,.1);color:#86efac}
        .mk-growth-delta.down{background:rgba(239,68,68,.1);color:#fca5a5}
        .mk-spark-bars{height:88px;display:flex;align-items:flex-end;gap:5px;margin-top:16px;padding:8px 0 0;border-bottom:1px solid rgba(255,255,255,.1);overflow:hidden}
        .mk-spark-bars span{flex:1;min-width:4px;border-radius:999px 999px 0 0;background:linear-gradient(180deg,var(--bar-color),rgba(255,255,255,.14));box-shadow:0 -8px 20px color-mix(in srgb,var(--bar-color) 25%,transparent)}
        .mk-spark-caption{display:flex;justify-content:space-between;gap:10px;margin-top:8px;color:#64748b;font-size:11px}
        .mk-card,.mk-panel{background:#111923;border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:20px;box-shadow:0 18px 50px rgba(0,0,0,.18)}
        .mk-card{min-height:150px;display:flex;flex-direction:column;justify-content:space-between}
        .mk-card strong{font-size:26px;line-height:1;color:#fff}
        .mk-card span{color:#a8b0c0;font-size:12px}
        .mk-dot{width:46px;height:46px;border-radius:15px;display:grid;place-items:center;font-weight:900}
        .mk-dot.green{background:#10b981}.mk-dot.blue{background:#2563eb}.mk-dot.purple{background:#8b5cf6}.mk-dot.orange{background:#ff6b00}.mk-dot.pink{background:#ec4899}.mk-dot.yellow{background:#eab308}.mk-dot.teal{background:#14b8a6}
        .mk-row{display:grid;grid-template-columns:1.2fr 1fr;gap:16px;margin-top:16px;align-items:start}
        .mk-panel h3{margin:0 0 6px;font-size:20px}.mk-panel p{margin:0;color:#8b95a7;line-height:1.7}
        .mk-section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px}.mk-section-head h3{margin:0 0 6px}.mk-section-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.mk-empty{border:1px dashed rgba(255,255,255,.16);background:rgba(255,255,255,.035);border-radius:16px;padding:18px;color:#94a3b8;line-height:1.7}
        .mk-line-chart{height:270px;border-bottom:1px solid rgba(255,255,255,.1);background:linear-gradient(to top,rgba(255,255,255,.05) 1px,transparent 1px);background-size:100% 48px;position:relative;margin-top:18px;overflow:hidden;border-radius:12px}
        .mk-line{position:absolute;left:5%;right:5%;height:4px;border-radius:999px;background:linear-gradient(90deg,#ff6b00,#8b5cf6);top:50%;transform:skewY(-13deg)}
        .mk-bar-list{display:grid;gap:14px;margin-top:18px}
        .mk-bar-head{display:flex;justify-content:space-between;gap:12px;color:#e5e7eb;font-weight:900}
        .mk-bar-track{height:13px;background:#1f2937;border-radius:999px;overflow:hidden;margin-top:8px}
        .mk-bar-fill{display:block;height:100%;border-radius:999px}
        .mk-donut{width:210px;height:210px;border-radius:50%;background:conic-gradient(#ff6b00 0 34%,#22c55e 34% 56%,#2563eb 56% 76%,#8b5cf6 76% 100%);display:grid;place-items:center;margin:10px auto}
        .mk-donut-inner{width:118px;height:118px;border-radius:50%;background:#111923;display:grid;place-items:center;text-align:center;font-weight:900}
        .mk-split-chart{display:grid;grid-template-columns:minmax(140px,170px) minmax(0,1fr);gap:18px;align-items:center;margin-top:14px}.mk-split-chart .mk-donut{width:168px;height:168px;margin:0 auto}.mk-split-chart .mk-donut-inner{width:96px;height:96px}.mk-split-list{display:grid;gap:12px;min-width:0}.mk-split-list span,.mk-split-list strong{min-width:0}
        .mk-table-wrap{overflow:auto}.mk-table-wrap.compact{max-height:560px;border-radius:14px;border:1px solid rgba(255,255,255,.06)}.mk-table-wrap.compact .mk-table th{position:sticky;top:0;background:#111923;z-index:1}.mk-table{width:100%;border-collapse:collapse;min-width:760px}.mk-table th,.mk-table td{padding:14px 12px;border-bottom:1px solid rgba(255,255,255,.08);text-align:left;vertical-align:top}.mk-table th{color:#94a3b8;font-size:12px}.mk-table td{color:#e5e7eb}
        .mk-badge{display:inline-flex;border-radius:999px;padding:5px 10px;font-size:12px;font-weight:900}
        .mk-budget{height:18px;background:#1f2937;border-radius:999px;overflow:hidden;margin:18px 0}.mk-budget span{display:block;height:100%;background:linear-gradient(90deg,#ff6b00,#22c55e)}
        .mk-funnel{display:grid;gap:10px;margin-top:16px}.mk-funnel div{border-radius:12px;padding:12px 16px;color:#fff;font-weight:900;display:flex;justify-content:space-between}
        .mk-channel-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.mk-mini{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:16px}
        .mk-decision-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:16px}.mk-decision{border:1px solid rgba(255,107,0,.18);background:linear-gradient(135deg,rgba(255,107,0,.12),rgba(255,255,255,.035));border-radius:16px;padding:16px}.mk-decision strong{display:block;margin-bottom:6px}.mk-decision span{color:#a8b0c0;font-size:13px;line-height:1.55}
        .mk-scroll-list{display:grid;gap:10px;max-height:520px;overflow:auto;padding-right:4px}.mk-source.compact{padding:13px 14px}.mk-source.compact strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mk-meter-grid{display:grid;gap:12px}.mk-meter-row{display:grid;grid-template-columns:minmax(120px,1fr) minmax(160px,2fr) auto;gap:12px;align-items:center;color:#cbd5e1}.mk-meter-track{height:12px;background:#1f2937;border-radius:999px;overflow:hidden}.mk-meter-track span{display:block;height:100%;border-radius:999px}
        .mk-chart-list{display:grid;gap:12px;max-height:520px;overflow:auto;padding-right:4px}.mk-chart-item{border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.18);border-radius:16px;padding:14px}.mk-chart-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;font-weight:900}.mk-chart-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mk-chart-sub{color:#8b95a7;font-size:12px;line-height:1.5;margin-top:4px}.mk-chart-bar{height:12px;background:#1f2937;border-radius:999px;overflow:hidden;margin-top:10px}.mk-chart-bar span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#ff6b00,#f59e0b)}
        .mk-chart-row{position:relative;overflow:hidden;padding-bottom:22px}.mk-chart-row:before{content:"";position:absolute;left:14px;right:14px;bottom:10px;height:8px;border-radius:999px;background:#1f2937}.mk-chart-row:after{content:"";position:absolute;left:14px;bottom:10px;width:var(--chart-width,0%);height:8px;border-radius:999px;background:var(--chart-color,linear-gradient(90deg,#ff6b00,#f59e0b))}
        .mk-source{display:flex;justify-content:space-between;gap:16px;align-items:center;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:16px;background:rgba(0,0,0,.18)}
        .mk-status{font-weight:900;color:#f59e0b}.mk-status.ready{color:#22c55e}
        .mk-expiry{display:inline-flex;align-items:center;width:max-content;border-radius:999px;padding:6px 10px;margin-top:8px;font-size:12px;font-weight:900;border:1px solid rgba(255,255,255,.12);color:#cbd5e1}.mk-expiry.ready{border-color:rgba(34,197,94,.35);color:#86efac;background:rgba(34,197,94,.08)}.mk-expiry.warning{border-color:rgba(245,158,11,.45);color:#fcd34d;background:rgba(245,158,11,.1)}.mk-expiry.danger{border-color:rgba(239,68,68,.45);color:#fca5a5;background:rgba(239,68,68,.1)}.mk-expiry.unknown{border-color:rgba(148,163,184,.35);color:#cbd5e1;background:rgba(148,163,184,.08)}.mk-source-tools{display:grid;gap:8px;justify-items:end}.mk-expiry-editor{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}.mk-expiry-editor input{background:#0b1220;border:1px solid rgba(255,255,255,.12);border-radius:10px;color:#fff;padding:10px 12px;font:inherit;min-width:190px}
        .mk-log-list{display:grid;gap:8px;max-height:260px;overflow:auto}.mk-log-item{border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px 12px;background:rgba(0,0,0,.18);color:#cbd5e1;font-size:13px;line-height:1.55}
        .mk-form-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.mk-input{background:#0b1220;border:1px solid rgba(255,255,255,.12);border-radius:12px;color:#fff;padding:12px 14px;font:inherit;min-width:0}.mk-textarea{grid-column:1/-1;min-height:86px;resize:vertical}.mk-tag-row{display:flex;flex-wrap:wrap;gap:8px}.mk-tag{border:1px solid rgba(255,107,0,.35);background:transparent;color:#f8fafc;border-radius:999px;padding:8px 10px;font-weight:800;cursor:pointer}.mk-tag.active{background:#ff6b00;border-color:#ff6b00;color:#fff}.mk-alert{border:1px solid rgba(245,158,11,.35);background:rgba(245,158,11,.1);color:#fde68a;border-radius:14px;padding:12px 14px;font-weight:800}
        @media(max-width:1100px){.mk-shell{grid-template-columns:1fr}.mk-sidebar{display:none}.mk-mobile-tabs{display:flex}.mk-grid,.mk-growth-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.mk-row{grid-template-columns:1fr}.mk-channel-grid,.mk-decision-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:640px){.mk-dashboard{border-radius:0;border-left:0;border-right:0}.mk-main{padding:18px 14px 96px}.mk-top{display:block}.mk-actions,.mk-date-controls,.mk-date-presets,.mk-date-fields{justify-content:flex-start;justify-items:start}.mk-actions{margin-top:16px}.mk-grid,.mk-growth-grid,.mk-channel-grid,.mk-form-grid,.mk-decision-grid,.mk-split-chart{grid-template-columns:1fr}.mk-card{min-height:128px}.mk-card strong{font-size:24px}.mk-growth-value{font-size:22px}.mk-spark-bars{height:74px}.mk-donut{width:180px;height:180px}.mk-donut-inner{width:102px;height:102px}.mk-split-chart .mk-donut{width:160px;height:160px}.mk-split-chart .mk-donut-inner{width:92px;height:92px}.mk-panel{padding:16px}.mk-source{display:grid;align-items:start}.mk-meter-row{grid-template-columns:1fr}.mk-source-tools,.mk-expiry-editor{justify-items:start;justify-content:flex-start}.mk-table{min-width:680px}}
      `}</style>

      <div className="mk-shell">
        <aside className="mk-sidebar">
          <div className="mk-brand">
            <div className="mk-logo"><img src="/images/logo.png" alt="Display Works Media" /></div>
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
                <span className="mk-nav-label">{item.label}</span>
                <span className="mk-nav-desc">{item.desc}</span>
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
            <div className="mk-date-controls">
              <div className="mk-date-presets">
                {[
                  ["7d", "7 วัน"],
                  ["30d", "30 วัน"],
                  ["month", "เดือนนี้"],
                  ["all", "ทั้งหมด"],
                ].map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    className={`mk-btn ${dateRangeMode === mode ? "active" : ""}`}
                    onClick={() => setPresetRange(mode as DateRangeMode)}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  className={`mk-btn ${dateRangeMode === "custom" ? "active" : ""}`}
                  onClick={() => setDateRangeMode("custom")}
                >
                  กำหนดเอง
                </button>
              </div>
              <div className="mk-date-fields">
                <input
                  type="date"
                  value={startDate}
                  disabled={dateRangeMode === "all"}
                  onChange={(event) => {
                    setDateRangeMode("custom");
                    setStartDate(event.target.value);
                  }}
                />
                <input
                  type="date"
                  value={endDate}
                  disabled={dateRangeMode === "all"}
                  onChange={(event) => {
                    setDateRangeMode("custom");
                    setEndDate(event.target.value);
                  }}
                />
              </div>
              <div style={{ color: "#94a3b8", fontSize: 12 }}>ช่วงข้อมูล: {rangeLabel}</div>
              <button className="mk-btn orange" type="button" onClick={exportMarketingCsv}>Export CSV</button>
            </div>
          </header>

          <nav className="mk-mobile-tabs" aria-label="Marketing dashboard mobile sections">
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

          {showDashboard && <section className="mk-grid" aria-label="Marketing KPI overview">
            {overviewCards.map((card) => (
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

          {showDashboard && (
            <section className="mk-growth-grid" aria-label="Growth trends">
              {growthPanels.map((panel) => {
                const maxValue = Math.max(1, ...panel.points.map((point) => Math.max(0, Number(point.value || 0))));
                const delta = trendDelta(panel.points);
                return (
                  <article className="mk-growth-card" key={panel.title}>
                    <div className="mk-growth-head">
                      <div>
                        <strong>{panel.title}</strong>
                        <span style={{ display: "block", marginTop: 4 }}>{panel.detail}</span>
                        <span className="mk-growth-value">{panel.value}</span>
                      </div>
                      <span className={`mk-growth-delta ${delta < 0 ? "down" : ""}`}>{delta >= 0 ? "+" : ""}{percent(delta)}</span>
                    </div>
                    <div className="mk-spark-bars">
                      {panel.points.map((point) => (
                        <span
                          key={`${panel.title}-${point.date}`}
                          title={`${point.date}: ${money(point.value)}`}
                          style={{
                            height: `${Math.max(4, (Math.max(0, point.value) / maxValue) * 100)}%`,
                            ["--bar-color" as any]: panel.color,
                          }}
                        />
                      ))}
                    </div>
                    <div className="mk-spark-caption"><span>{panel.points[0]?.date || "-"}</span><span>{panel.points.at(-1)?.date || "-"}</span></div>
                  </article>
                );
              })}
            </section>
          )}

          {showDashboard && (
            <section className="mk-panel" style={{ marginTop: 16 }}>
              <div className="mk-section-head">
                <div>
                  <h3>Lead Source Summary</h3>
                  <p>Lead รวมมาจาก Meta action และ CRM ที่กรอกเอง แยกไว้เพื่อไม่ให้สับสนกับยอดปิดการขายใน ERP</p>
                </div>
              </div>
              <div className="mk-channel-grid" style={{ marginTop: 14 }}>
                <div className="mk-mini"><strong>{money(metaLeads)}</strong><div>Meta total lead actions</div></div>
                <div className="mk-mini"><strong>{money(metaMessageLeads)}</strong><div>ลูกค้าทัก / message actions</div></div>
                <div className="mk-mini"><strong>{money(metaFormLeads)}</strong><div>Lead form actions</div></div>
                <div className="mk-mini"><strong>{money(crmLeads)}</strong><div>CRM leads ที่บันทึกเอง</div></div>
                <div className="mk-mini"><strong>{money(contactedLeads)}</strong><div>ติดต่อแล้วใน CRM</div></div>
                <div className="mk-mini"><strong>{money(closedLeadCount)}</strong><div>ปิดการขายใน CRM</div></div>
                <div className="mk-mini"><strong>{money(closedJobs)}</strong><div>ใบเสร็จ ERP</div></div>
                <div className="mk-mini"><strong>฿{money(closedLeadRevenue)}</strong><div>รายได้ที่ map กับ Lead แล้ว</div></div>
              </div>
              {metaLeadBreakdown.length > 0 && (
                <div className="mk-empty" style={{ marginTop: 14 }}>
                  ที่มาของ Meta lead: {metaLeadBreakdown.map((item: any) => `${item.type} ${money(Number(item.value || 0))}`).join(" / ")}
                </div>
              )}
            </section>
          )}

          {showDashboard && alerts.length > 0 && (
            <section className="mk-panel" style={{ marginTop: 16 }}>
              <h3>Marketing Alerts</h3>
              <p>แจ้งเตือนเรื่องข้อมูลและ API ที่ต้องตรวจสอบก่อนใช้ตัดสินใจ</p>
              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                {alerts.map((alert) => <div className="mk-alert" key={alert}>{alert}</div>)}
              </div>
            </section>
          )}

          {!showDashboard && sectionGrowthPanels.length > 0 && (
            <section className="mk-growth-grid" aria-label="Section growth trends">
              {sectionGrowthPanels.map((panel) => {
                const maxValue = Math.max(1, ...panel.points.map((point) => Math.max(0, Number(point.value || 0))));
                const delta = trendDelta(panel.points);
                return (
                  <article className="mk-growth-card" key={panel.title}>
                    <div className="mk-growth-head">
                      <div>
                        <strong>{panel.title}</strong>
                        <span style={{ display: "block", marginTop: 4 }}>{panel.detail}</span>
                        <span className="mk-growth-value">{panel.value}</span>
                      </div>
                      <span className={`mk-growth-delta ${delta < 0 ? "down" : ""}`}>{delta >= 0 ? "+" : ""}{percent(delta)}</span>
                    </div>
                    <div className="mk-spark-bars">
                      {panel.points.map((point) => (
                        <span
                          key={`${panel.title}-${point.date}`}
                          title={`${point.date}: ${money(point.value)}`}
                          style={{
                            height: `${Math.max(4, (Math.max(0, point.value) / maxValue) * 100)}%`,
                            ["--bar-color" as any]: panel.color,
                          }}
                        />
                      ))}
                    </div>
                    <div className="mk-spark-caption"><span>{panel.points[0]?.date || "-"}</span><span>{panel.points.at(-1)?.date || "-"}</span></div>
                  </article>
                );
              })}
            </section>
          )}

          {(showDashboard || activeSection === "orders") && <section className="mk-row">
            <div className="mk-panel">
              <h3>Revenue vs Spend</h3>
              <p>Real business outcome from ERP receipts compared with marketing cost.</p>
              <div className="mk-bar-list">
                {kpiBars.map((item) => (
                  <div key={item.label}>
                    <div className="mk-bar-head">
                      <span>{item.label}</span>
                      <span>THB {money(item.value)}</span>
                    </div>
                    <div className="mk-bar-track">
                      <span className="mk-bar-fill" style={{ width: `${Math.max(2, (item.value / maxKpiValue) * 100)}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <p>สรุปตัวเลขจริงตามช่วงวันที่ ไม่ใช้กราฟจำลอง</p>
              <div className="mk-channel-grid" style={{ marginTop: 18 }}>
                <div className="mk-mini"><strong>฿{money(receiptRevenue)}</strong><div>ERP Receipt Revenue</div></div>
                <div className="mk-mini"><strong>฿{money(marketingSpend)}</strong><div>Meta / Manual Spend</div></div>
                <div className="mk-mini"><strong>{money(totalLeads)}</strong><div>Total Leads</div></div>
                <div className="mk-mini"><strong>{money(closedJobs)}</strong><div>ERP Receipts</div></div>
              </div>
              <div className="mk-empty" style={{ marginTop: 14 }}>
                รายได้ต่อช่องทางยังไม่ถูกเดาให้อัตโนมัติ ต้อง map Lead / Campaign / Order ก่อน จึงจะคำนวณ ROAS รายช่องทางได้แม่นยำ
              </div>
            </div>
            <div className="mk-panel">
              <h3>Lead Pipeline</h3>
              <p>How many inquiries move from lead to real closed jobs.</p>
              <div className="mk-bar-list">
                {leadPipelineBars.map((item) => (
                  <div key={item.label}>
                    <div className="mk-bar-head">
                      <span>{item.label}</span>
                      <span>{money(item.value)}</span>
                    </div>
                    <div className="mk-bar-track">
                      <span className="mk-bar-fill" style={{ width: `${Math.max(2, (item.value / maxLeadPipeline) * 100)}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <h3 style={{ marginTop: 22 }}>Channel Mix</h3>
              <p>สัดส่วนจากข้อมูลที่มีจริง: Meta leads/clicks, CRM leads และ GA4 sessions</p>
              <div className="mk-donut" style={{ background: totalChannelMix ? undefined : "#1f2937" }}>
                <div className="mk-donut-inner">
                  <div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>Signals</div>
                    <div>{money(totalChannelMix)}</div>
                  </div>
                </div>
              </div>
              {channelRows.map((row) => (
                <div key={row.name} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 8, color: "#cbd5e1" }}>
                  <span>{row.name}</span><strong>{totalChannelMix ? percent((Number(row.mixValue || 0) / totalChannelMix) * 100) : "-"}</strong>
                </div>
              ))}
            </div>
          </section>}

          {activeSection === "facebook" && (
            <section className="mk-grid" style={{ marginTop: 16 }}>
              {[
                ["Facebook Spend", `฿${money(marketingSpend)}`, "Meta Ads spend"],
                ["Meta Reported Revenue", metaReportedRevenue ? `THB ${money(metaReportedRevenue)}` : "-", "From Meta action_values"],
                ["Meta Reported ROAS", metaReportedRoas ? metaReportedRoas.toFixed(2) : "-", "From Meta purchase_roas"],
                ["Facebook Leads", money(metaLeads), "Messages / Leads"],
                ["Facebook CPL", metaLeads ? `฿${money(marketingSpend / metaLeads)}` : "-", "Spend / Leads"],
                ["Facebook ROAS", roas ? roas.toFixed(2) : "รอ Mapping", "ต้อง map รายได้กับ campaign ก่อน"],
                ["Qualified Leads", money(qualifiedLeads), "CRM mapped"],
                ["Closed Jobs", money(closedJobs), "ERP receipts"],
                ["Mapped ERP Revenue", facebookAttributedRevenue ? `THB ${money(facebookAttributedRevenue)}` : "-", "ERP receipt source or closed-won CRM leads"],
                ["Profit ROAS", profitRoas ? profitRoas.toFixed(2) : "-", "Gross Profit / Spend"],
              ].map(([label, value, sub]) => (
                <article className="mk-card" key={label}>
                  <div><span>{label}</span><strong style={{ display: "block", marginTop: 10 }}>{value}</strong></div>
                  <span>{sub}</span>
                </article>
              ))}
            </section>
          )}

          {activeSection === "facebook" && (
            <section className="mk-panel" style={{ marginTop: 16 }}>
              <h3>Facebook Revenue Mapping</h3>
              <div className="mk-channel-grid" style={{ marginTop: 14, marginBottom: 14 }}>
                <div className="mk-mini"><strong>THB {money(metaReportedRevenue)}</strong><div>Meta Reported Revenue</div></div>
                <div className="mk-mini"><strong>{metaReportedRoas ? metaReportedRoas.toFixed(2) : "-"}</strong><div>Meta Reported ROAS</div></div>
              </div>
              <p>รายได้จากโฆษณาจะโชว์เมื่อ Lead ใน CRM ใส่ Campaign/Creative ให้ตรงกับ Meta และตั้งสถานะเป็น Closed Won พร้อม Estimated Value</p>
              <div className="mk-channel-grid" style={{ marginTop: 14 }}>
                <div className="mk-mini"><strong>฿{money(facebookMappedRevenue)}</strong><div>รายได้ที่ map กับ Facebook Campaign</div></div>
                <div className="mk-mini"><strong>{facebookMappedRoas ? facebookMappedRoas.toFixed(2) : "-"}</strong><div>Facebook ROAS จากยอดที่ map แล้ว</div></div>
                <div className="mk-mini"><strong>{money(metaMessageLeads)}</strong><div>ลูกค้าทักจาก Meta message actions</div></div>
                <div className="mk-mini"><strong>{money(closedLeadCount)}</strong><div>ปิดการขายใน CRM</div></div>
              </div>
            </section>
          )}

          {(activeSection === "facebook" || activeSection === "campaigns") && <section className="mk-panel" style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
              <div>
                <h3>Campaign Performance</h3>
                <p>ติดตามงบ Leads Conversion รายได้ และ ROAS ของแต่ละแคมเปญ</p>
              </div>
              <span className="mk-badge" style={{ background: "rgba(34,197,94,.15)", color: "#22c55e" }}>Top {topCampaignRows.length} / {campaignRows.length} campaigns</span>
            </div>
            <div className="mk-meter-grid" style={{ marginBottom: 16 }}>
              {topCampaignRows.slice(0, 5).map((row: Campaign) => (
                <div className="mk-meter-row" key={`meter-${row.id}`}>
                  <strong>{row.name}</strong>
                  <div className="mk-meter-track">
                    <span style={{ width: `${Math.max(3, (row.spend / Math.max(marketingSpend, 1)) * 100)}%`, background: row.revenue > 0 ? "#22c55e" : "#ff6b00" }} />
                  </div>
                  <span>Spend THB {money(row.spend)} / Leads {money(row.leads)}</span>
                </div>
              ))}
            </div>
            <div className="mk-table-wrap compact">
              <table className="mk-table">
                <thead>
                  <tr><th>Campaign</th><th>Status</th><th>Spend</th><th>Reach</th><th>Clicks</th><th>Leads</th><th>Meta Revenue</th><th>CPL</th><th>ERP Mapped Revenue</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {topCampaignRows.map((row: Campaign) => {
                    const richRow = facebookRows.find((item) => item.id === row.id);
                    const rowCpl = row.leads ? row.spend / row.leads : 0;
                    return (
                      <tr key={row.id}>
                        <td><strong>{row.name}</strong><div style={{ color: "#8b95a7", fontSize: 12 }}>{row.note}</div></td>
                        <td><StatusBadge status={row.status} /></td>
                        <td>฿{money(row.spend)}</td>
                        <td>{money(richRow?.reach || 0)}</td>
                        <td>{money(richRow?.clicks || 0)}</td>
                        <td>{money(row.leads)}</td>
                        <td>{Number((row as any).metaReportedRevenue || 0) > 0 ? `THB ${money(Number((row as any).metaReportedRevenue || 0))}` : "-"}</td>
                        <td>{rowCpl ? `฿${money(rowCpl)}` : "-"}</td>
                        <td>{row.revenue > 0 ? `฿${money(row.revenue)}` : "รอ Mapping"}</td>
                        <td>{richRow?.recommendation || (row.revenue > 0 ? "รอดูต่อ" : "ต้อง map Order/Receipt")}</td>
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
                <div className="mk-table-wrap compact" style={{ marginTop: 12 }}>
                  <table className="mk-table">
                    <thead><tr><th>Ad Set</th><th>Campaign / Audience</th><th>Spend</th><th>Leads</th><th>CPL</th><th>Qualified</th><th>Closed</th><th>Revenue</th></tr></thead>
                    <tbody>{topAdSetRows.map((row) => (
                      <tr key={row.adSetName}><td>{row.adSetName}</td><td>{row.campaign}<div style={{ color: "#8b95a7", fontSize: 12 }}>{row.audience}</div></td><td>฿{money(row.spend)}</td><td>{money(row.leads)}</td><td>{row.cpl ? `฿${money(row.cpl)}` : "-"}</td><td>{money(row.qualifiedLeads)}</td><td>{money(row.closedJobs)}</td><td>{row.revenue > 0 ? `฿${money(row.revenue)}` : "รอ Mapping"}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
              <div className="mk-panel">
                <h3>Creative Performance</h3>
                <p>ดูว่า Artwork / Hook แบบไหนควรทำซ้ำ</p>
                <div className="mk-table-wrap compact" style={{ marginTop: 12 }}>
                  <table className="mk-table">
                    <thead><tr><th>Creative</th><th>Type</th><th>Hook</th><th>Product</th><th>Spend</th><th>Leads</th><th>Revenue</th><th>ควรทำอะไรต่อ</th></tr></thead>
                    <tbody>{topCreativeRows.map((row) => (
                      <tr key={row.creativeName}><td>{row.creativeName}</td><td>{row.creativeType}</td><td>{row.hook}</td><td>{row.product}</td><td>฿{money(row.spend)}</td><td>{money(row.leads)}</td><td>{row.revenue > 0 ? `฿${money(row.revenue)}` : "รอ Mapping"}</td><td>{row.advice || row.note}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {(activeSection === "budget" || activeSection === "funnel" || activeSection === "reports") && <section className="mk-row">
            <div className="mk-panel">
              <h3>Budget Monitoring</h3>
              <p>ติดตามงบที่ตั้งไว้และงบที่ใช้จริง</p>
              <div className="mk-budget"><span style={{ width: `${budgetTarget ? Math.min(100, (marketingSpend / budgetTarget) * 100) : 0}%` }} /></div>
              <div style={{ display: "grid", gap: 10, color: "#cbd5e1" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>งบประมาณที่ตั้งไว้</span><strong>{plannedBudget ? `฿${money(plannedBudget)}` : "ยังไม่ได้ตั้ง"}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>ใช้ไปแล้ว</span><strong>฿{money(marketingSpend)}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>งบคงเหลือ</span><strong>{plannedBudget ? `฿${money(Math.max(0, plannedBudget - marketingSpend))}` : "รอตั้งงบ"}</strong></div>
              </div>
              {!plannedBudget && <div className="mk-empty" style={{ marginTop: 14 }}>ตอนนี้มี spend จาก API แต่ยังไม่ได้ตั้งงบ campaign ในระบบ จึงไม่ควรสรุปว่างบเกิน/งบเหลือ</div>}
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
              <p>เส้นทางจาก Lead ไปถึงงานที่ปิดได้จริง ต้องมีการ map Lead กับ Order/Receipt</p>
              {hasSalesMapping ? (
                <div className="mk-funnel">
                  {salesFunnel.map((item, index) => (
                    <div key={item.label} style={{ background: item.color, width: `${100 - index * 8}%`, marginInline: "auto" }}>
                      <span>{item.label}</span><span>{money(item.value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mk-empty">
                  มีใบเสร็จใน ERP {money(closedJobs)} รายการ แต่ CRM lead ในช่วงนี้มี {money(crmLeads)} รายการ จึงยังไม่ควรทำ Funnel รวมกันจนกว่าจะผูก Lead/Quote/Receipt ด้วยรหัสเดียวกัน
                </div>
              )}
            </div>
          </section>}

          {(activeSection === "channels" || activeSection === "reports") && <section className="mk-panel" style={{ marginTop: 16 }}>
            <h3>Channel Performance Comparison</h3>
            <p>เปรียบเทียบจากสัญญาณจริงของแต่ละช่องทาง ไม่แบ่งรายได้ ERP แบบเดาเอง</p>
            <div className="mk-channel-grid" style={{ marginTop: 14 }}>
              {channelRows.map((row) => (
                <div className="mk-mini" key={row.name}>
                  <strong>{row.name}</strong>
                  <div style={{ color: "#a8b0c0", marginTop: 10 }}>{row.primary}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, marginTop: 6 }}>{row.secondary}</div>
                  <div style={{ color: "#8b95a7", marginTop: 8 }}>ROAS: {row.roas}</div>
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

          {(activeSection === "insight" || activeSection === "leads" || activeSection === "reports") && <section className="mk-row">
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
                {filteredLeads.slice(0, activeSection === "leads" ? filteredLeads.length : 4).map((lead) => {
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

          {activeSection === "customers" && (
            <section className="mk-panel" style={{ marginTop: 16 }}>
              <div className="mk-section-head">
                <div>
                  <div className="mk-eyebrow">Customer Intelligence</div>
                  <h3>Dashboard วิเคราะห์ลูกค้า</h3>
                  <p>ดึงจาก ERP โดยตรง: ลูกค้า, เอกสาร, ใบเสร็จ และรายการสินค้า/บริการ เพื่อดูว่าลูกค้ามาจากไหนและควรต่อยอดอะไร</p>
                </div>
                <div className="mk-section-actions">
                  <div className="mk-mini"><strong>{customers.length}</strong><div>Customers</div></div>
                  <div className="mk-mini"><strong>{filteredDocuments.length}</strong><div>ERP Docs</div></div>
                  <div className="mk-mini"><strong>{receipts.length}</strong><div>Receipts</div></div>
                </div>
              </div>

              <div className="mk-channel-grid" style={{ marginTop: 14 }}>
                <div className="mk-mini"><strong>฿{money(receiptRevenue)}</strong><div>ยอดขายจากใบเสร็จ</div></div>
                <div className="mk-mini"><strong>฿{money(grossProfit)}</strong><div>กำไรโดยประมาณ</div></div>
                <div className="mk-mini"><strong>{repeatCustomers}</strong><div>ลูกค้าสั่งซ้ำ</div></div>
                <div className="mk-mini"><strong>{customerSourceRows.filter((row) => row.label !== "ไม่ระบุ").length}</strong><div>ช่องทางที่มีข้อมูล</div></div>
              </div>

              <div className="mk-row" style={{ marginTop: 16 }}>
                <div className="mk-panel" style={{ boxShadow: "none" }}>
                  <h3>ลูกค้าเจอเราจากไหน</h3>
                  <p>อ้างอิงจาก Lead Source ในเอกสาร ERP และยอดขายจริงจากใบเสร็จ</p>
                  <div className="mk-split-chart">
                    <div className="mk-donut" style={{ background: `conic-gradient(${donutStops(customerSourceRows.map((row) => ({ ...row, value: row.customers || row.docs })))})` }}>
                      <div className="mk-donut-inner"><div><div style={{ color: "#94a3b8", fontSize: 12 }}>Channels</div><strong>{customerSourceRows.length}</strong></div></div>
                    </div>
                    <div className="mk-split-list">
                      {customerSourceRows.length ? customerSourceRows.slice(0, 6).map((row, index) => (
                        <div key={row.label}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontWeight: 900 }}>
                            <span><span style={{ color: customerChartColors[index % customerChartColors.length] }}>●</span> {row.label}</span>
                            <span>{row.customers || row.docs} ราย</span>
                          </div>
                          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>เอกสาร {row.docs} ใบ · ยอดขายใบเสร็จ ฿{money(row.revenue)}</div>
                          <div className="mk-budget" style={{ height: 8, margin: "8px 0 0" }}><span style={{ width: `${Math.min(100, Math.max(3, (row.customers || row.docs) / maxRows(customerSourceRows.map((item) => ({ value: item.customers || item.docs }))) * 100))}%`, background: customerChartColors[index % customerChartColors.length] }} /></div>
                        </div>
                      )) : <div className="mk-empty">ยังไม่มี Lead Source ในเอกสาร ERP</div>}
                    </div>
                  </div>
                </div>

                <div className="mk-panel" style={{ boxShadow: "none" }}>
                  <h3>B2B / B2C</h3>
                  <p>อ้างอิงจากประเภทลูกค้าใน ERP</p>
                  <div className="mk-donut" style={{ background: `conic-gradient(${donutStops(customerSegmentRows)})` }}>
                    <div className="mk-donut-inner"><div><div style={{ color: "#94a3b8", fontSize: 12 }}>Customers</div><strong>{customers.length}</strong></div></div>
                  </div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {customerSegmentRows.map((row, index) => (
                      <div key={row.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900 }}>
                          <span><span style={{ color: customerChartColors[index % customerChartColors.length] }}>●</span> {row.label}</span>
                          <span>{row.value} ราย</span>
                        </div>
                        <div className="mk-budget" style={{ height: 8, margin: "8px 0 0" }}><span style={{ width: `${Math.max(3, row.value / maxRows(customerSegmentRows) * 100)}%`, background: customerChartColors[index % customerChartColors.length] }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mk-row" style={{ marginTop: 16 }}>
                <div className="mk-panel" style={{ boxShadow: "none" }}>
                  <h3>ประเภทธุรกิจลูกค้า</h3>
                  <p>ดูว่าธุรกิจแบบไหนใช้บริการ Display Works Media มากที่สุด</p>
                  <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                    {customerBusinessRows.length ? customerBusinessRows.map((row, index) => (
                      <div key={row.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900 }}>
                          <span>{index + 1}. {row.label}</span>
                          <span>{row.value} ราย</span>
                        </div>
                        <div className="mk-budget" style={{ height: 10, margin: "8px 0 0" }}><span style={{ width: `${Math.max(3, row.value / maxRows(customerBusinessRows) * 100)}%`, background: customerChartColors[index % customerChartColors.length] }} /></div>
                      </div>
                    )) : <div className="mk-empty">ยังไม่มีข้อมูลประเภทธุรกิจใน ERP</div>}
                  </div>
                </div>

                <div className="mk-panel" style={{ boxShadow: "none" }}>
                  <h3>สินค้า / บริการที่ให้บริการมากที่สุด</h3>
                  <p>นับจากรายการในใบเสร็จ เพื่อดูงานที่ขายจริงและควรทำคอนเทนต์/โฆษณาต่อ</p>
                  <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                    {customerProductRows.length ? customerProductRows.map((row, index) => (
                      <div key={row.label} className="mk-source">
                        <div style={{ minWidth: 0 }}>
                          <strong>#{index + 1} {row.label}</strong>
                          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>ยอดขาย ฿{money(row.revenue)} · กำไร ฿{money(row.profit)} · จำนวน {money(row.qty)}</div>
                          <div className="mk-budget" style={{ height: 8, margin: "8px 0 0" }}><span style={{ width: `${Math.max(3, row.jobs / maxRows(customerProductRows, "jobs") * 100)}%`, background: "#f59e0b" }} /></div>
                        </div>
                        <span className="mk-badge">{row.jobs} งาน</span>
                      </div>
                    )) : <div className="mk-empty">ยังไม่มีรายการสินค้า/บริการจากใบเสร็จใน ERP</div>}
                  </div>
                </div>
              </div>

              <div className="mk-row" style={{ marginTop: 16 }}>
                <div className="mk-panel" style={{ boxShadow: "none" }}>
                  <h3>จังหวัดลูกค้า</h3>
                  <p>อ่านจากข้อมูลจังหวัด หรือ fallback จากที่อยู่ลูกค้าใน ERP</p>
                  <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                    {customerProvinceRows.length ? customerProvinceRows.map((row, index) => (
                      <div key={row.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontWeight: 900 }}>
                          <span>{index + 1}. {row.label}</span>
                          <span>{row.value} ราย</span>
                        </div>
                        <div className="mk-budget" style={{ height: 10, margin: "8px 0 0" }}>
                          <span style={{ width: `${Math.max(3, row.value / maxRows(customerProvinceRows) * 100)}%`, background: customerChartColors[index % customerChartColors.length] }} />
                        </div>
                      </div>
                    )) : <div className="mk-empty">ยังไม่มีข้อมูลจังหวัดลูกค้า</div>}
                  </div>
                </div>

                <div className="mk-panel" style={{ boxShadow: "none" }}>
                  <h3>เขต / อำเภอลูกค้า</h3>
                  <p>ช่วยดูพื้นที่ที่มีลูกค้าสนใจมาก เพื่อวางคอนเทนต์และแคมเปญให้ตรงกลุ่ม</p>
                  <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                    {customerDistrictRows.length ? customerDistrictRows.map((row, index) => (
                      <div key={row.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontWeight: 900 }}>
                          <span>{index + 1}. {row.label}</span>
                          <span>{row.value} ราย</span>
                        </div>
                        <div className="mk-budget" style={{ height: 10, margin: "8px 0 0" }}>
                          <span style={{ width: `${Math.max(3, row.value / maxRows(customerDistrictRows) * 100)}%`, background: customerChartColors[index % customerChartColors.length] }} />
                        </div>
                      </div>
                    )) : <div className="mk-empty">ยังไม่มีข้อมูลเขต/อำเภอลูกค้า</div>}
                  </div>
                </div>
              </div>

              <div className="mk-channel-grid" style={{ marginTop: 16 }}>
                <div className="mk-mini"><strong>ใช้ข้อมูลให้ครบ</strong><div>ในหน้าลูกค้าให้กรอก B2B/B2C และประเภทธุรกิจ</div></div>
                <div className="mk-mini"><strong>วัดช่องทาง</strong><div>ตอนออกเอกสารให้กรอกว่าลูกค้ามาจากไหน เช่น LINE, Facebook, Organic</div></div>
                <div className="mk-mini"><strong>ต่อยอดโฆษณา</strong><div>สินค้าขายจริงสูง ควรนำไปทำ Hook / Artwork / Landing Page</div></div>
                <div className="mk-mini"><strong>ดูคุณภาพ Lead</strong><div>ช่องทางที่ลูกค้าเยอะแต่ใบเสร็จน้อย อาจต้องปรับการคัดกรอง</div></div>
              </div>
            </section>
          )}

          {(activeSection === "quotations" || activeSection === "orders" || activeSection === "products" || activeSection === "reports") && (
            <section className="mk-panel" style={{ marginTop: 16 }}>
              <h3>
                {activeSection === "quotations" ? "Quotations"
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

          {activeSection === "ai" && (
            <section className="mk-panel" style={{ marginTop: 16 }}>
              <div className="mk-section-head">
                <div>
                  <h3>AI Search Crawler Monitor</h3>
                  <p>นับการเข้าเว็บจาก AI/Search bot บนหน้า public เท่านั้น ไม่รวม admin, API, doc link และไฟล์ภายในระบบ</p>
                </div>
                <span className={`mk-status ${aiCrawlers.connected ? "ready" : ""}`}>
                  {aiCrawlers.connected ? "พร้อมใช้งาน" : "รอข้อมูล"}
                </span>
              </div>
              <div className="mk-channel-grid" style={{ marginTop: 14 }}>
                <div className="mk-mini"><strong>{money(Number(aiCrawlers?.totals?.visits ?? 0))}</strong><div>AI/Search visits</div></div>
                <div className="mk-mini"><strong>{money(Number(aiCrawlers?.totals?.bots ?? 0))}</strong><div>Bot types</div></div>
                <div className="mk-mini"><strong>{money(Number(aiCrawlers?.totals?.pages ?? 0))}</strong><div>Public pages crawled</div></div>
                <div className="mk-mini"><strong>{aiCrawlers.loading ? "Syncing" : (aiCrawlers.connected ? "Live" : "-")}</strong><div>{aiCrawlers.error || "เริ่มนับหลังติดตั้ง SQL และ deploy"}</div></div>
              </div>
              <div className="mk-row" style={{ marginTop: 16 }}>
                <div className="mk-panel" style={{ boxShadow: "none" }}>
                  <h3>Top AI Bots</h3>
                  <div className="mk-chart-list" style={{ marginTop: 12 }}>
                    {topAiBots.length ? topAiBots.map((bot: any) => (
                      <div className="mk-source compact mk-chart-row" key={bot.name} style={{ ["--chart-width" as any]: `${Math.max(3, (Number(bot.count || 0) / maxAiBotCount) * 100)}%`, ["--chart-color" as any]: "linear-gradient(90deg,#ff6b00,#f59e0b)" }}>
                        <strong>{bot.name}</strong>
                        <span className="mk-badge">{money(Number(bot.count || 0))} ครั้ง</span>
                      </div>
                    )) : <div className="mk-empty">ยังไม่มี AI/Search bot เข้าในช่วงวันที่นี้</div>}
                  </div>
                </div>
                <div className="mk-panel" style={{ boxShadow: "none" }}>
                  <h3>Top Pages</h3>
                  <div className="mk-chart-list" style={{ marginTop: 12 }}>
                    {topAiPages.length ? topAiPages.map((page: any) => (
                      <div className="mk-source compact mk-chart-row" key={page.path || page.name || "Unknown"} style={{ ["--chart-width" as any]: `${Math.max(3, (Number(page.count || 0) / maxAiPageCount) * 100)}%`, ["--chart-color" as any]: "linear-gradient(90deg,#2563eb,#14b8a6)" }}>
                        <strong>{page.path || page.name || "Unknown"}</strong>
                        <span className="mk-badge">{money(Number(page.count || 0))} ครั้ง</span>
                      </div>
                    )) : <div className="mk-empty">ยังไม่มีหน้า public ที่ถูก AI/Search bot อ่าน</div>}
                  </div>
                </div>
              </div>
              <div className="mk-row" style={{ marginTop: 16 }}>
                <div className="mk-panel" style={{ boxShadow: "none" }}>
                  <h3>Likely AI Intent</h3>
                  <p>เป็นการประเมินจากหน้าที่ bot เข้าอ่าน ไม่ใช่ prompt จริงของผู้ใช้</p>
                  <div className="mk-chart-list" style={{ marginTop: 12 }}>
                    {topAiIntents.length ? topAiIntents.map((item: any) => (
                      <div className="mk-source compact mk-chart-row" key={item.intent} style={{ ["--chart-width" as any]: `${Math.max(3, (Number(item.count || 0) / maxAiIntentCount) * 100)}%`, ["--chart-color" as any]: "linear-gradient(90deg,#8b5cf6,#ff6b00)" }}>
                        <div>
                          <strong>{item.intent}</strong>
                          <div style={{ color: "#8b95a7", fontSize: 12, marginTop: 4 }}>
                            {(item.examples || []).join(" / ") || "-"}
                          </div>
                        </div>
                        <span className="mk-badge">{money(Number(item.count || 0))} ครั้ง</span>
                      </div>
                    )) : <div className="mk-empty">ยังไม่มีข้อมูลพอให้วิเคราะห์ intent</div>}
                  </div>
                </div>
                <div className="mk-panel" style={{ boxShadow: "none" }}>
                  <h3>Referrer / Source Hints</h3>
                  <p>แสดงเฉพาะเมื่อ crawler ส่ง referrer หรือ query/UTM มาด้วย</p>
                  <div className="mk-chart-list" style={{ marginTop: 12 }}>
                    {topAiReferrers.length ? topAiReferrers.map((item: any) => (
                      <div className="mk-source compact mk-chart-row" key={item.referrer} style={{ ["--chart-width" as any]: `${Math.max(3, (Number(item.count || 0) / maxAiReferrerCount) * 100)}%`, ["--chart-color" as any]: "linear-gradient(90deg,#22c55e,#f59e0b)" }}>
                        <strong>{item.referrer}</strong>
                        <span className="mk-badge">{money(Number(item.count || 0))} ครั้ง</span>
                      </div>
                    )) : <div className="mk-empty">ส่วนใหญ่ crawler จะซ่อน referrer จึงอาจเห็นเป็น Direct / hidden</div>}
                  </div>
                </div>
              </div>
              <div className="mk-table-wrap compact" style={{ marginTop: 16 }}>
                  <table className="mk-table">
                    <thead>
                      <tr>
                        <th>Bot</th>
                        <th>Page</th>
                        <th>Likely Intent</th>
                        <th>Referrer</th>
                        <th>Query / UTM</th>
                        <th>Country</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAiRows.map((visit: any) => (
                        <tr key={visit.id}>
                          <td>{visit.bot_name}</td>
                          <td>{visit.path}</td>
                          <td>{visit.inferred_intent?.intent || "-"}</td>
                          <td>{visit.referrer_label || visit.referrer || "-"}</td>
                          <td>{visit.search_hint || "-"}</td>
                          <td>{visit.country || "-"}</td>
                          <td>{visit.created_at ? new Date(visit.created_at).toLocaleString("th-TH") : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </section>
          )}

          {(activeSection === "sources" || activeSection === "settings") && <section className="mk-panel" style={{ marginTop: 16 }}>
            <div className="mk-section-head">
              <div>
                <h3>Data Sources</h3>
                <p>สถานะการเชื่อมต่อข้อมูลสำหรับ Dashboard และรอบต่ออายุ API</p>
              </div>
              <div className="mk-section-actions">
                <button className="mk-btn" type="button" onClick={() => loadMarketingSources("manual sync")}>Sync All</button>
                <button className="mk-btn" type="button" onClick={() => setSourceLogs([])}>Clear Logs</button>
              </div>
            </div>
            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              {sources.map((source) => (
                <div className="mk-source" key={source.name}>
                  <div>
                    <strong>{source.name}</strong>
                    <div style={{ color: "#cbd5e1", marginTop: 4 }}>{source.account}</div>
                    <div style={{ color: "#8b95a7", marginTop: 4 }}>{source.detail}</div>
                    {source.error && <div style={{ color: "#fca5a5", marginTop: 4 }}>{source.error}</div>}
                    {source.expiry && (() => {
                      const status = apiExpiryStatus(source.expiry.expiresAt);
                      return (
                        <>
                          <div className={`mk-expiry ${status.tone}`}>{source.tokenType}: {status.label}</div>
                          <div style={{ color: "#8b95a7", marginTop: 6 }}>{source.expiry.note}</div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="mk-source-tools">
                    <span className={`mk-status ${source.ready ? "ready" : ""}`}>{source.ready ? "พร้อมใช้" : "รอเชื่อมต่อ"}</span>
                    {source.expiry && (
                      <div className="mk-expiry-editor">
                        <input
                          type="date"
                          aria-label={`${source.name} expiry date`}
                          value={source.expiry.expiresAt}
                          onChange={(event) => updateApiExpiry(source.id, { expiresAt: event.target.value })}
                        />
                        <input
                          aria-label={`${source.name} expiry note`}
                          value={source.expiry.note}
                          onChange={(event) => updateApiExpiry(source.id, { note: event.target.value })}
                          placeholder="หมายเหตุการต่ออายุ / ผู้รับผิดชอบ"
                        />
                      </div>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
                        <button className="mk-btn" type="button" onClick={() => loadMarketingSources(`sync ${source.name}`)}>Sync Now</button>
                        <button className="mk-btn" type="button" onClick={() => {
                          addSourceLog(`${source.name} connect checklist: ${source.envKeys}`);
                          setActiveSourceLog(source.name.includes("Facebook") ? "Meta" : source.name);
                          showToast?.(`${source.name}: ตรวจ env ${source.envKeys}`, "info");
                        }}>{source.ready ? "Reconnect" : "Connect"}</button>
                        <button className="mk-btn" type="button" onClick={() => {
                          setActiveSourceLog(source.name.includes("Facebook") ? "Meta" : source.name);
                          addSourceLog(`${source.name} logs opened`);
                        }}>View Logs</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18 }}>
                <div className="mk-section-head">
                  <div>
                    <h3>Sync Logs</h3>
                    <p>ใช้ดูว่ากดปุ่มแล้วระบบเรียก API สำเร็จหรือ error ตรงไหน</p>
                  </div>
                  <div className="mk-section-actions">
                    {["ทั้งหมด", "GA4", "Meta", "LINE", "ERP"].map((name) => (
                      <button
                        className={`mk-btn ${activeSourceLog === name ? "active" : ""}`}
                        key={name}
                        type="button"
                        onClick={() => setActiveSourceLog(name)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
                {visibleSourceLogs.length ? (
                  <div className="mk-log-list">
                    {visibleSourceLogs.map((log) => <div className="mk-log-item" key={log}>{log}</div>)}
                  </div>
                ) : (
                  <div className="mk-empty">ยังไม่มี log สำหรับแหล่งข้อมูลนี้ กด Sync Now หรือ Connect เพื่อเริ่มตรวจสอบ</div>
                )}
              </div>
          </section>}
        </main>
      </div>
    </div>
  );
}
