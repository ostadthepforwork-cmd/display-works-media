// @ts-nocheck
'use client';
// ─── IMPORTS ─────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { blogCategories } from '@/lib/seo-content';
import MarketingKpiDashboard from './MarketingKpiDashboard';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function requireErpSession() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Session หมดอายุหรือยังไม่ได้เข้าสู่ระบบ กรุณา login ใหม่");
  }
  return data.user;
}

// ─── CMS HELPERS ─────────────────────────────────────────────────────────────
function loadLocal(key: string, def: unknown) {
  try { const v = localStorage.getItem("cms_" + key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function saveLocal(key: string, val: unknown) {
  try { localStorage.setItem("cms_" + key, JSON.stringify(val)); } catch {}
}

async function loadCmsSetting(key: string, fallback: unknown) {
  try {
    const { data, error } = await supabase
      .from("cms_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    return data?.value ?? fallback;
  } catch (error) {
    console.warn("CMS setting load fallback:", key, error);
    return fallback;
  }
}

async function saveCmsSetting(key: string, value: unknown) {
  await requireErpSession();
  const { error } = await supabase
    .from("cms_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;

  const { data: saved, error: verifyError } = await supabase
    .from("cms_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (verifyError) throw verifyError;
  if (!saved) {
    throw new Error("CMS save verification failed. Please check cms_settings RLS/policies.");
  }

  saveLocal(key, value);
}



// ─── ERP HELPERS + DATA ───────────────────────────────────────────────────────

// ============================================================
// HELPERS
// ============================================================
const genId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d: string, n: number) => {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};
const fmtDate = (d: string) => {
  if (!d) return "-";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
};
const fmtMoney = (n: number) =>
  Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const DEFAULT_DOCUMENT_COMPANY_NAME = "DISPLAY WORKS MEDIA";
const PUBLIC_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://displayworksmedia.com").replace(/\/$/, "");
const PRICE_BASIS_OPTIONS = [
  { value: "piece", label: "ต่อชิ้น" },
  { value: "sqm", label: "ต่อตารางเมตร" },
];
const priceBasisLabel = (value?: string) =>
  PRICE_BASIS_OPTIONS.find((option) => option.value === value)?.label || "ต่อชิ้น";
const isSqmBasis = (value?: string) => value === "sqm";
const itemBillingBasis = (item: any) =>
  isSqmBasis(item?.priceUnit) || isSqmBasis(item?.costUnit) || String(item?.unit || "").includes("ตร.ม")
    ? "sqm"
    : "piece";
const lineQty = (item: any) => Number(item.qty || 0);
const hasAreaDimensions = (item: any) =>
  Number(item?.widthM || 0) > 0 || Number(item?.heightM || 0) > 0 || Number(item?.pieces || 0) > 0;
const lineQtyForBasis = (item: any, basis?: string) => {
  if (isSqmBasis(basis)) return lineQty(item);
  const pieces = Number(item?.pieces || 0);
  return itemBillingBasis(item) === "sqm" && hasAreaDimensions(item) ? (pieces > 0 ? pieces : 1) : lineQty(item);
};
const lineAmount = (item: any) => lineQtyForBasis(item, item?.priceUnit || "piece") * Number(item.price || 0);
const lineCost = (item: any, unitCost = Number(item.costSnapshot || 0)) =>
  lineQtyForBasis(item, item?.costUnit || "piece") * Number(unitCost || 0);
const isShippingItem = (item: any) =>
  /ems|shipping|delivery|ขนส่ง|จัดส่ง|ค่าส่ง|ส่งของ|พัสดุ/i.test(String(item?.name || ""));
const fallbackItemCost = (products: any[], item: any) => {
  const snapshot = Number(item.costSnapshot || 0);
  if (snapshot > 0) return snapshot;
  if (isShippingItem(item)) return Number(item.price || 0);
  return findProductForItem(products, item)?.cost || 0;
};
const docVatRate = (doc: any) => Number(doc?.vatRate ?? doc?.vat_rate ?? 7);
const isReportDoc = (doc: any) => doc?.type === "receipt" && !doc?.deleted && doc?.status !== "cancelled";
const reportRootId = (doc: any, byId: Map<string, any>) => {
  let current = doc;
  const seen = new Set<string>();
  while (current?.orderId && byId.has(current.orderId) && !seen.has(current.id)) {
    seen.add(current.id);
    current = byId.get(current.orderId);
  }
  return current?.id || doc?.orderId || doc?.reference || doc?.id;
};
const reportingDocuments = (documents: any[]) => (documents || []).filter(isReportDoc);
const normalizeName = (value: unknown) => String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
const findProductForItem = (products: any[], item: any) => {
  const itemName = normalizeName(item?.name);
  if (!itemName) return null;
  return products.find((product: any) => {
    const productName = normalizeName(product?.name);
    const itemTokens = itemName.split(" ").filter((token) => token.length >= 3);
    return productName === itemName
      || productName.includes(itemName)
      || itemName.includes(productName)
      || itemTokens.some((token) => productName.includes(token));
  }) || null;
};
const supplierCatalogProducts = (suppliers: any[]) =>
  (suppliers || []).flatMap((supplier: any) =>
    (supplier.items || []).map((item: any) => {
      const basis = item.pricingBasis === "sqm" ? "sqm" : "piece";
      return {
        id: `supplier:${supplier.id}:${item.id}`,
        name: item.name,
        supplierName: supplier.name,
        supplierId: supplier.id,
        supplierItemId: item.id,
        unit: item.unit || (basis === "sqm" ? "ตร.ม." : "ชิ้น"),
        cost: Number(item.supplierPrice || 0),
        price: Number(item.salePrice || 0),
        costUnit: basis,
        priceUnit: basis,
        fromSupplierCatalog: true,
      };
    }).filter((product: any) => product.name)
  );
const customerFacingLineItem = (item: any) => {
  const detailText = String(item?.detail || "");
  const parsedPieces = Number(
    detailText.match(/(?:จำนวน|qty|pieces?)\D{0,12}(\d+(?:\.\d+)?)/i)?.[1]
    || detailText.match(/[x×]\s*(\d+(?:\.\d+)?)\s*(?:ชิ้น|pcs?)/i)?.[1]
    || 0
  );
  const pieces = Number(item?.pieces || 0) || parsedPieces;
  if (itemBillingBasis(item) !== "sqm") return item;

  const amount = lineAmount(item);
  const cost = lineCost(item);
  const displayQty = pieces > 0 ? pieces : 1;
  return {
    ...item,
    qty: displayQty,
    unit: "ชิ้น",
    price: amount / displayQty,
    costSnapshot: cost / displayQty,
    priceUnit: "piece",
    costUnit: "piece",
  };
};
const customerFacingDetail = (detail?: string) =>
  String(detail || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/(ตร\.?ม|ตารางเมตร|sqm|square\s*meter|พื้นที่รวม|คำนวณพื้นที่)/i.test(line));

const documentCompanyName = (name?: string) => {
  const cleanName = String(name || DEFAULT_DOCUMENT_COMPANY_NAME)
    .replace(/\s*(CO\.?,?\s*LTD\.?|COMPANY\s+LIMITED|LIMITED)\s*\.?$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleanName || DEFAULT_DOCUMENT_COMPANY_NAME;
};

const publicDocumentUrl = (id: string, version?: string | number) =>
  `${PUBLIC_SITE_URL}/doc/${id}${version ? `?v=${encodeURIComponent(String(version))}` : ""}`;

const escapeHtml = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const sanitizeForPrint = (value: any): any => {
  if (Array.isArray(value)) return value.map(sanitizeForPrint);
  if (!value || typeof value !== "object") return escapeHtml(value);
  return Object.fromEntries(
    Object.entries(value).map(([key, val]) => [key, sanitizeForPrint(val)])
  );
};

// ── Shared calculation utility — ใช้ร่วมกันทุกจุด ──────────
const docDepositInfo = (doc: any) => {
  const paymentAmount = Math.max(0, Number(doc?.paymentAmount ?? doc?.payment_amount ?? 0) || 0);
  const depositAmount = Math.max(0, Number(doc?.depositPaid ?? doc?.deposit_paid ?? 0) || 0);
  return {
    depositPaid: paymentAmount > 0 ? paymentAmount : depositAmount,
    depositDate: doc?.paymentDate || doc?.payment_date || doc?.depositDate || doc?.deposit_date || "",
    depositNote: doc?.paymentNote || doc?.payment_note || doc?.depositNote || doc?.deposit_note || "",
    paymentType: doc?.paymentType || doc?.payment_type || "",
  };
};

const parseDepositFromText = (doc: any, netPay: number) => {
  const text = [doc?.depositNote, doc?.deposit_note, doc?.notes]
    .filter(Boolean)
    .join("\n");
  if (!/(มัดจำ|deposit)/i.test(text)) return { depositPaid: 0, depositDate: "", depositNote: "" };

  const percent =
    text.match(/(?:มัดจำ|deposit)[^\d]{0,24}(\d+(?:\.\d+)?)\s*%/i)?.[1]
    || text.match(/(\d+(?:\.\d+)?)\s*%[^\n]{0,24}(?:มัดจำ|deposit)/i)?.[1];
  if (percent) {
    const paid = netPay * (Math.min(100, Math.max(0, Number(percent))) / 100);
    return { depositPaid: paid, depositDate: "", depositNote: `ชำระมัดจำ ${fmtMoney(Number(percent))}%` };
  }

  const amount =
    text.match(/(?:มัดจำ|deposit)[^\d]{0,24}(\d[\d,]*(?:\.\d+)?)/i)?.[1]
    || text.match(/(\d[\d,]*(?:\.\d+)?)[^\n]{0,16}(?:บาท|THB)[^\n]{0,24}(?:มัดจำ|deposit)/i)?.[1];
  if (amount) {
    const paid = Math.min(netPay, Math.max(0, Number(String(amount).replace(/,/g, "")) || 0));
    return { depositPaid: paid, depositDate: "", depositNote: "ชำระมัดจำตามหมายเหตุ" };
  }

  return { depositPaid: 0, depositDate: "", depositNote: "", paymentType: "" };
};

const resolveDepositInfo = (doc: any, documents: any[] = []) => {
  const docsById = new Map((documents || []).filter(Boolean).map((d: any) => [String(d.id), d]));
  const seen = new Set<string>();
  let current = doc;

  while (current) {
    const deposit = docDepositInfo(current);
    if (deposit.depositPaid > 0) return deposit;

    const nextId = current.orderId || current.order_id;
    if (!nextId || seen.has(String(nextId))) break;
    seen.add(String(nextId));
    current = docsById.get(String(nextId));
  }

  return { depositPaid: 0, depositDate: "", depositNote: "", paymentType: "" };
};

const calcDocTotal = (doc: any, documents: any[] = []) => {
  const subtotal    = (doc.items || []).reduce((s, i) => s + lineAmount(i), 0);
  const discountValue = Math.max(0, Number(doc.discount || 0) || 0);
  const discountType = doc.discountType || doc.discount_type || "percent";
  const discountAmt = discountType === "amount"
    ? Math.min(subtotal, discountValue)
    : subtotal * (Math.min(discountValue, 100) / 100);
  const afterDisc   = Math.max(0, subtotal - discountAmt);
  const vatAmt      = doc.vat  ? afterDisc * (docVatRate(doc) / 100)     : 0;
  const total       = afterDisc + vatAmt;
  const whtAmt      = doc.wht  ? afterDisc * ((doc.whtRate || 0) / 100)  : 0;
  const netPay      = total - whtAmt;
  let { depositPaid, depositDate, depositNote, paymentType } = resolveDepositInfo(doc, documents);
  if (depositPaid <= 0) {
    ({ depositPaid, depositDate, depositNote } = parseDepositFromText(doc, netPay));
  }
  const cappedDepositPaid = Math.min(netPay, Math.max(0, depositPaid));
  const balanceDue  = Math.max(0, netPay - cappedDepositPaid);
  const paymentStatus = cappedDepositPaid <= 0 ? "unpaid" : balanceDue > 0 ? "partial_paid" : "paid";
  return { subtotal, discountAmt, afterDisc, vatAmt, total, whtAmt, netPay, depositPaid: cappedDepositPaid, depositDate, depositNote, paymentType, balanceDue, paymentStatus };
};

const DOC_TYPES = {
  quote: { label: "ใบเสนอราคา", short: "QT", color: "#3B82F6", prefix: "QT" },
  bill: { label: "ใบวางบิล", short: "BL", color: "#8B5CF6", prefix: "BL" },
  invoice: { label: "ใบแจ้งหนี้", short: "IV", color: "#F59E0B", prefix: "IV" },
  receipt: { label: "ใบเสร็จรับเงิน", short: "RC", color: "#10B981", prefix: "RC" },
};

const STATUS_COLORS = {
  draft: "#6B7280", sent: "#3B82F6", approved: "#10B981", cancelled: "#EF4444", paid: "#10B981",
};
const STATUS_LABELS = {
  draft: "ฉบับร่าง", sent: "ส่งแล้ว", approved: "อนุมัติ", cancelled: "ยกเลิก", paid: "ชำระแล้ว",
};
STATUS_COLORS.partial_paid = "#F59E0B";
STATUS_LABELS.partial_paid = "ชำระบางส่วน";

// ============================================================
// INITIAL DATA
// ============================================================
const INIT_CUSTOMERS = [
  { id: genId(), name: "บริษัท เอบีซี จำกัด", contact: "คุณสมชาย", phone: "081-234-5678", email: "abc@example.com", address: "123 ถ.สุขุมวิท กรุงเทพฯ 10110", taxId: "0105550123456" },
  { id: genId(), name: "ร้าน XYZ มาร์เก็ตติ้ง", contact: "คุณสมหญิง", phone: "089-876-5432", email: "xyz@example.com", address: "456 ถ.รัชดา กรุงเทพฯ 10400", taxId: "" },
];
const INIT_PRODUCTS = [
  { id: genId(), name: "ป้ายไวนิล (ต่อตร.ม.)", unit: "ตร.ม.", cost: 80, price: 200, costUnit: "sqm", priceUnit: "sqm" },
  { id: genId(), name: "สติ๊กเกอร์ Indoor", unit: "ตร.ม.", cost: 120, price: 350, costUnit: "sqm", priceUnit: "sqm" },
  { id: genId(), name: "สติ๊กเกอร์ Outdoor", unit: "ตร.ม.", cost: 180, price: 450, costUnit: "sqm", priceUnit: "sqm" },
  { id: genId(), name: "PP Board", unit: "แผ่น", cost: 150, price: 400, costUnit: "piece", priceUnit: "piece" },
  { id: genId(), name: "Roll Up Stand", unit: "ชิ้น", cost: 800, price: 2200, costUnit: "piece", priceUnit: "piece" },
  { id: genId(), name: "Backdrop 3x2m", unit: "ชุด", cost: 1200, price: 3500, costUnit: "piece", priceUnit: "piece" },
  { id: genId(), name: "ฉลากสินค้า A5", unit: "100 ชิ้น", cost: 150, price: 400, costUnit: "piece", priceUnit: "piece" },
];

function loadStore(key: string, def: unknown) {
  try {
    const v = localStorage.getItem("dw_" + key);
    return v ? JSON.parse(v) : def;
  } catch { return def; }
}
function saveStore(key: string, val: unknown) {
  try { localStorage.setItem("dw_" + key, JSON.stringify(val)); } catch {}
}

const ERP_DOCUMENT_SHADOW_KEY = "erp_document_field_shadow";

function loadErpDocumentShadow() {
  return loadStore(ERP_DOCUMENT_SHADOW_KEY, {}) as Record<string, any>;
}

function saveErpDocumentShadow(docId: string, doc: any) {
  if (!docId) return;
  const current = loadErpDocumentShadow();
  current[docId] = {
    updatedAt: Date.now(),
    leadSource: doc.leadSource || "",
    marketingCampaign: doc.marketingCampaign || "",
    marketingAdSet: doc.marketingAdSet || "",
    marketingAd: doc.marketingAd || "",
    paymentType: doc.paymentType || "",
    paymentAmount: doc.paymentAmount ?? 0,
    paymentDate: doc.paymentDate || "",
    paymentNote: doc.paymentNote || "",
    depositPaid: doc.depositPaid ?? 0,
    depositDate: doc.depositDate || "",
    depositNote: doc.depositNote || "",
    vatRate: docVatRate(doc),
    items: (doc.items || []).map((item: any, index: number) => ({
      index,
      costUnit: item.costUnit || "piece",
      priceUnit: item.priceUnit || "piece",
      supplierName: item.supplierName || "",
      widthM: item.widthM ?? undefined,
      heightM: item.heightM ?? undefined,
      pieces: item.pieces ?? undefined,
    })),
  };
  saveStore(ERP_DOCUMENT_SHADOW_KEY, current);
}

function applyErpDocumentShadow(doc: any) {
  const shadow = loadErpDocumentShadow()[doc.id];
  if (!shadow) return doc;
  const shadowItems = Array.isArray(shadow.items) ? shadow.items : [];

  return {
    ...doc,
    leadSource: doc.leadSource || shadow.leadSource || "",
    marketingCampaign: doc.marketingCampaign || shadow.marketingCampaign || "",
    marketingAdSet: doc.marketingAdSet || shadow.marketingAdSet || "",
    marketingAd: doc.marketingAd || shadow.marketingAd || "",
    paymentType: doc.paymentType || shadow.paymentType || "",
    paymentAmount: Number(doc.paymentAmount || 0) > 0 ? doc.paymentAmount : (shadow.paymentAmount ?? doc.paymentAmount ?? 0),
    paymentDate: doc.paymentDate || shadow.paymentDate || "",
    paymentNote: doc.paymentNote || shadow.paymentNote || "",
    depositPaid: Number(doc.depositPaid || 0) > 0 ? doc.depositPaid : (shadow.depositPaid ?? doc.depositPaid ?? 0),
    depositDate: doc.depositDate || shadow.depositDate || "",
    depositNote: doc.depositNote || shadow.depositNote || "",
    vatRate: doc.vatRate ?? shadow.vatRate ?? 7,
    items: (doc.items || []).map((item: any, index: number) => {
      const meta = shadowItems.find((candidate: any) => candidate.index === index);
      if (!meta) return item;
      return {
        ...item,
        costUnit: item.costUnit || meta.costUnit || "piece",
        priceUnit: item.priceUnit || meta.priceUnit || "piece",
        supplierName: item.supplierName || meta.supplierName || "",
        widthM: item.widthM ?? meta.widthM,
        heightM: item.heightM ?? meta.heightM,
        pieces: item.pieces ?? meta.pieces,
      };
    }),
  };
}

// ============================================================
// PRINT / PDF helper — Premium A4 Design (Display Works Media)
// ============================================================
function printDocument(doc: any, customers: any[], company: any, options: any = {}) {
  const autoPrint = options.autoPrint !== false;
  doc = sanitizeForPrint(doc);
  customers = sanitizeForPrint(customers);
  company = sanitizeForPrint(company);
  const linkedDocuments = sanitizeForPrint(options.allDocuments || []);
  const printCompanyName = documentCompanyName(company.name);

  const cust = customers.find((c) => c.id === doc.customerId) || {};
  const custAddress = doc.overrideAddress || cust.address || "";
  const dt = DOC_TYPES[doc.type];

  // ── Calculations (shared utility) ─────────────────────────
  const { subtotal, discountAmt, afterDisc, vatAmt, total, whtAmt, netPay, depositPaid, depositDate, depositNote, paymentType, balanceDue } = calcDocTotal(doc, linkedDocuments);
  const paymentLabel = paymentType === "full" || paymentType === "final" ? "PAYMENT RECEIVED" : paymentType === "partial" ? "PARTIAL PAYMENT" : "DEPOSIT PAID";
  const finalTotalLabel = depositPaid > 0 ? (balanceDue > 0 ? "BALANCE DUE" : "PAID IN FULL") : "GRAND TOTAL";

  // ── Label mapping per document type ───────────────────────
  const DOC_LABELS = {
    quote:   { en: "QUOTATION",    sub: "ใบเสนอราคา",     valid: "ยืนยันราคาถึง" },
    bill:    { en: "BILLING NOTE", sub: "ใบวางบิล",        valid: "วันครบกำหนด" },
    invoice: { en: "INVOICE",      sub: "ใบแจ้งหนี้",      valid: "วันครบกำหนด" },
    receipt: { en: "RECEIPT",      sub: "ใบเสร็จรับเงิน",  valid: "วันที่ชำระ" },
  };
  const lbl = DOC_LABELS[doc.type] || DOC_LABELS.quote;

  // ── Table rows — with bullet detail list ─────────────────
  const rows = doc.items.map((rawItem, i) => {
    const item = customerFacingLineItem(rawItem);
    return `
    <tr style="border-bottom:1px solid #e5e7eb;vertical-align:top;">
      <td style="padding:9px 6px;text-align:center;font-weight:700;font-size:13px;color:#FF5500;border-right:1px solid #e5e7eb;">${String(i + 1).padStart(2, "0")}</td>
      <td style="padding:9px 10px;border-right:1px solid #e5e7eb;">
        <div style="font-weight:700;font-size:11px;color:#1e293b;">${item.name}</div>
        ${item.subTitle ? `<div style="font-size:9.5px;color:#94a3b8;margin-top:2px;">${item.subTitle}</div>` : ""}
      </td>
      <td style="padding:9px 10px;border-right:1px solid #e5e7eb;">
        ${customerFacingDetail(item.detail).length ? `<ul style="list-style:disc;padding-left:14px;color:#64748b;font-size:9.5px;line-height:1.7;margin:0;">${customerFacingDetail(item.detail).map(d => `<li>${d}</li>`).join("")}</ul>` : ""}
      </td>
      <td style="padding:9px 6px;text-align:center;font-size:11px;color:#1e293b;font-weight:500;border-right:1px solid #e5e7eb;">${fmtMoney(item.qty)}</td>
      <td style="padding:9px 6px;text-align:center;font-size:10px;color:#94a3b8;border-right:1px solid #e5e7eb;">${item.unit}</td>
      <td style="padding:9px 8px;text-align:right;font-size:11px;color:#475569;font-weight:500;border-right:1px solid #e5e7eb;">${fmtMoney(item.price)}</td>
      <td style="padding:9px 8px;text-align:right;font-size:11px;font-weight:700;color:#FF5500;">${fmtMoney(lineAmount(item))}</td>
    </tr>`;
  }).join("");

  // ── Summary rows ──────────────────────────────────────────
  const summaryRows = `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:7px 12px;color:#64748b;font-size:10px;font-weight:600;">SUBTOTAL</td>
      <td style="padding:7px 12px;text-align:right;font-size:11px;color:#1e293b;">${fmtMoney(subtotal)}</td>
    </tr>
    ${doc.discount > 0 ? `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:7px 12px;color:#ef4444;font-size:10px;font-weight:600;">DISCOUNT ${(doc.discountType || doc.discount_type) === "amount" ? "" : `${doc.discount}%`}</td>
      <td style="padding:7px 12px;text-align:right;font-size:11px;color:#ef4444;">- ${fmtMoney(discountAmt)}</td>
    </tr>
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:7px 12px;color:#64748b;font-size:10px;font-weight:600;">TOTAL BEFORE VAT</td>
      <td style="padding:7px 12px;text-align:right;font-size:11px;color:#1e293b;">${fmtMoney(afterDisc)}</td>
    </tr>` : ""}
    ${doc.vat ? `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:7px 12px;color:#64748b;font-size:10px;font-weight:600;">VAT ${fmtMoney(docVatRate(doc))}%</td>
      <td style="padding:7px 12px;text-align:right;font-size:11px;color:#1e293b;">${fmtMoney(vatAmt)}</td>
    </tr>` : ""}
    ${doc.wht ? `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:7px 12px;color:#64748b;font-size:10px;font-weight:600;">หัก ณ ที่จ่าย ${doc.whtRate}%</td>
      <td style="padding:7px 12px;text-align:right;font-size:11px;color:#64748b;">- ${fmtMoney(whtAmt)}</td>
    </tr>` : ""}
    ${depositPaid > 0 ? `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:7px 12px;color:#10b981;font-size:10px;font-weight:700;">${paymentLabel}${depositDate ? ` (${fmtDate(depositDate)})` : ""}</td>
      <td style="padding:7px 12px;text-align:right;font-size:11px;color:#10b981;font-weight:700;">- ${fmtMoney(depositPaid)}</td>
    </tr>
    ${depositNote ? `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td colspan="2" style="padding:7px 12px;color:#64748b;font-size:9px;line-height:1.5;">${depositNote}</td>
    </tr>` : ""}` : ""}
    <tr style="background:#FF5500;">
      <td style="padding:9px 12px;font-weight:800;font-size:12px;color:#fff;text-align:left;">
        ${finalTotalLabel}<br/><span style="font-size:8px;font-weight:400;opacity:.85;">${lbl.sub}</span>
      </td>
      <td style="padding:9px 12px;text-align:right;font-weight:800;font-size:15px;color:#fff;">
        ${fmtMoney(depositPaid > 0 ? balanceDue : netPay)} <span style="font-size:9px;font-weight:400;">THB</span>
      </td>
    </tr>`;

  // ── Notes list ────────────────────────────────────────────
  const noteItems = doc.notes
    ? doc.notes.split("\n").filter(Boolean).map(n =>
        `<li style="margin-bottom:3px;">${n}</li>`).join("")
    : "<li>ขอบคุณที่ไว้วางใจ Display Works Media</li>";

  const logoUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/images/logo.png?v=doc-logo`
      : "/images/logo.png?v=doc-logo";

  // ── Full HTML — Premium quotation layout ─────────────────
  const html = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8"/>
<title>${lbl.sub} ${doc.docNo}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;800&family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Prompt','Sarabun',sans-serif;font-size:12px;color:#1e293b;background:#f1f5f9;}
  .page{background:#fff;width:210mm;min-height:297mm;padding:18mm 12mm 15mm;margin:0 auto;
        box-shadow:0 10px 40px rgba(0,0,0,.12);display:flex;flex-direction:column;justify-content:space-between;}
  @media print{
    body{background:#fff!important;}
    .page{width:100%!important;box-shadow:none!important;padding:10mm 5mm!important;margin:0!important;}
    tr,section{page-break-inside:avoid;break-inside:avoid;}
  }
</style>
</head>
<body>
<div class="page">

  <!-- ═══ HEADER ════════════════════════════════════════════ -->
  <div>
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;align-items:flex-start;
                padding-bottom:14px;border-bottom:2px solid #f1f5f9;margin-bottom:16px;">
      <!-- Brand + address left -->
      <div>
        <!-- Logo Image -->
        <div style="width:178px;height:62px;display:flex;align-items:center;justify-content:flex-start;background:#fff;margin-bottom:8px;">
          <img src="${logoUrl}" alt="Display Works Media"
               style="max-width:178px;max-height:62px;width:auto;height:auto;object-fit:contain;object-position:left center;display:block;"
               onerror="this.style.display='none';document.getElementById('logoFallback').style.display='flex';">
          <!-- Fallback if image not found -->
          <div id="logoFallback" style="display:none;align-items:center;gap:8px;">
            <div style="background:#FF5500;color:#fff;font-weight:800;font-size:16px;
                        padding:5px 10px;border-radius:6px;letter-spacing:1px;line-height:1;">DW</div>
            <div>
              <div style="font-size:14px;font-weight:800;color:#0f172a;letter-spacing:.5px;line-height:1;">DISPLAY WORKS MEDIA</div>
              <div style="font-size:8px;color:#94a3b8;letter-spacing:2px;margin-top:2px;">MAKE YOUR BRAND SEEN</div>
            </div>
          </div>
        </div>
        <div style="font-weight:700;font-size:11px;color:#334155;margin-bottom:3px;">${printCompanyName}</div>
        <div style="font-size:9.5px;color:#94a3b8;line-height:1.7;max-width:380px;">${company.address || ""}</div>
        <div style="font-size:8.5px;color:#94a3b8;line-height:1.7;margin-top:2px;">
          ${company.phone ? "โทร. " + company.phone : ""}
          ${company.phone && company.email ? " &nbsp;|&nbsp; " : ""}
          ${company.email ? company.email : ""}
          ${company.taxId ? " &nbsp;|&nbsp; เลขผู้เสียภาษี: " + company.taxId : ""}
        </div>
      </div>
      <!-- Doc type right -->
      <div style="text-align:right;position:relative;padding-right:14px;">
        <div style="font-size:34px;font-weight:800;color:#0f172a;letter-spacing:2px;line-height:1;">${lbl.en}</div>
        <div style="font-size:11px;font-weight:500;color:#FF5500;letter-spacing:3px;margin-top:4px;">${lbl.sub}</div>
        <!-- Orange accent bar -->
        <div style="position:absolute;right:-2px;top:0;width:5px;height:58px;
                    background:#FF5500;border-radius:2px;transform:skewX(-8deg);opacity:.85;"></div>
      </div>
    </div>

    <!-- ═══ CLIENT + META ══════════════════════════════════ -->
    <div style="display:grid;grid-template-columns:7fr 5fr;gap:0;
                border-bottom:1px solid #e2e8f0;padding-bottom:16px;margin-bottom:16px;">
      <!-- To / client -->
      <div style="padding-right:20px;border-right:1px solid #e2e8f0;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:7px;">
          <span style="color:#FF5500;font-weight:800;font-size:12px;">TO</span>
          <span style="color:#cbd5e1;font-size:10px;">/</span>
          <span style="color:#94a3b8;font-size:10px;font-weight:500;">ลูกค้า</span>
        </div>
        <div style="font-weight:700;font-size:13px;color:#0f172a;margin-bottom:4px;">${cust.name || "-"}</div>
        ${custAddress ? `<div style="font-size:10.5px;color:#64748b;line-height:1.7;margin-bottom:5px;white-space:pre-line;">${custAddress}</div>` : ""}
        <div style="font-size:10.5px;color:#64748b;display:flex;flex-direction:column;gap:2px;">
          ${cust.taxId ? `<div><span style="font-weight:600;color:#475569;">เลขประจำตัวผู้เสียภาษี</span> ${cust.taxId}</div>` : ""}
          ${cust.phone ? `<div><span style="font-weight:600;color:#475569;">โทร.</span> ${cust.phone}</div>` : ""}
          ${cust.email ? `<div><span style="font-weight:600;color:#475569;">อีเมล:</span> ${cust.email}</div>` : ""}
        </div>
        ${doc.projectName ? `<div style="margin-top:6px;font-size:10px;color:#64748b;"><span style="font-weight:600;color:#475569;">โครงการ:</span> ${doc.projectName}</div>` : ""}
      </div>
      <!-- Meta right -->
      <div style="padding-left:20px;display:flex;flex-direction:column;justify-content:center;gap:0;">
        ${[
          ["QUOTATION NO.", doc.docNo, "#FF5500"],
          ["DATE", fmtDate(doc.date), "#64748b"],
          [lbl.valid.toUpperCase(), fmtDate(doc.dueDate), "#FF5500"],
          ["SALE PERSON", doc.salesPerson || company.salesPerson || "-", "#64748b"],
        ].map(([k, v, c]) => `
          <div style="display:grid;grid-template-columns:1fr 1fr;border-top:1px dashed #f1f5f9;
                      padding:5px 0;font-size:10.5px;">
            <span style="font-weight:700;color:${c};">${k}</span>
            <span style="font-weight:500;color:#0f172a;">${v || "-"}</span>
          </div>`).join("")}
      </div>
    </div>

    <!-- ═══ ITEMS TABLE ═════════════════════════════════════ -->
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;margin-bottom:16px;">
      <thead>
        <tr style="background:#2c2d30;color:#fff;text-align:center;">
          <th style="padding:9px 6px;font-size:9px;font-weight:700;border-right:1px solid #444;width:6%;">
            ITEM<br/><span style="font-size:7px;font-weight:400;opacity:.7;">ลำดับ</span>
          </th>
          <th style="padding:9px 10px;font-size:9px;font-weight:700;border-right:1px solid #444;text-align:left;width:20%;">
            DESCRIPTION<br/><span style="font-size:7px;font-weight:400;opacity:.7;">รายการ</span>
          </th>
          <th style="padding:9px 10px;font-size:9px;font-weight:700;border-right:1px solid #444;text-align:left;width:30%;">
            DETAIL<br/><span style="font-size:7px;font-weight:400;opacity:.7;">รายละเอียด</span>
          </th>
          <th style="padding:9px 6px;font-size:9px;font-weight:700;border-right:1px solid #444;width:8%;">
            QTY.<br/><span style="font-size:7px;font-weight:400;opacity:.7;">จำนวน</span>
          </th>
          <th style="padding:9px 6px;font-size:9px;font-weight:700;border-right:1px solid #444;width:8%;">
            UNIT<br/><span style="font-size:7px;font-weight:400;opacity:.7;">หน่วย</span>
          </th>
          <th style="padding:9px 6px;font-size:9px;font-weight:700;border-right:1px solid #444;width:14%;">
            UNIT PRICE<br/><span style="font-size:7px;font-weight:400;opacity:.7;">ราคาต่อหน่วย</span>
          </th>
          <th style="padding:9px 6px;font-size:9px;font-weight:700;width:14%;">
            AMOUNT<br/><span style="font-size:7px;font-weight:400;opacity:.7;">จำนวนเงิน</span>
          </th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <!-- ═══ LOWER: REMARKS + PAYMENT + SUMMARY + SIGNATURES ══ -->
    <div style="display:grid;grid-template-columns:7fr 5fr;gap:16px;">

      <!-- Left: Remarks + Payment info + Signatures -->
      <div style="display:flex;flex-direction:column;gap:12px;">

        <!-- Remarks -->
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;background:#f8fafc;">
          <div style="color:#FF5500;font-weight:700;font-size:8.5px;letter-spacing:1.5px;
                      text-transform:uppercase;margin-bottom:6px;">REMARKS / หมายเหตุ</div>
          <ul style="list-style:disc;padding-left:14px;color:#64748b;font-size:9.5px;line-height:1.8;">
            ${noteItems}
          </ul>
        </div>

        <!-- Payment Info -->
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;background:#fff;
                    display:flex;justify-content:space-between;align-items:center;min-height:100px;">
          <div style="flex:1;min-width:0;padding-right:10px;">
            <div style="color:#FF5500;font-weight:700;font-size:8.5px;letter-spacing:1.5px;
                        text-transform:uppercase;margin-bottom:6px;">PAYMENT INFORMATION</div>
            <div style="font-size:10.5px;margin-bottom:2px;">
              <span style="color:#94a3b8;">ชื่อบัญชี:</span>
              <span style="font-weight:700;color:#1e293b;"> ${doc.bankName || company.bankName || printCompanyName || "-"}</span>
            </div>
            <div style="font-size:10px;color:#64748b;margin-bottom:2px;">
              <span style="color:#94a3b8;">ธนาคาร:</span> ${doc.bankBranch || company.bankBranch || "-"}
            </div>
            <div style="font-size:10px;color:#64748b;margin-bottom:2px;">
              <span style="color:#94a3b8;">เลขบัญชี:</span>
              <span style="font-weight:700;color:#1e293b;"> ${doc.bankAccount || company.bankAccount || "-"}</span>
            </div>
            <div style="font-size:9px;color:#94a3b8;font-style:italic;">
              <span style="color:#94a3b8;">ประเภท:</span> ${doc.bankType || company.bankType || "ออมทรัพย์"}
            </div>
          </div>
          <!-- QR Code -->
          <div style="width:76px;height:76px;border:1px solid #e2e8f0;border-radius:6px;
                      background:#f8fafc;display:flex;flex-direction:column;align-items:center;
                      justify-content:center;flex-shrink:0;padding:6px;">
            ${doc.qrImage
              ? `<img src="${doc.qrImage}" alt="QR" style="width:58px;height:58px;object-fit:contain;">`
              : `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:52px;height:52px;">
              <rect width="100" height="100" rx="4" fill="white"/>
              <rect x="10" y="10" width="25" height="25" stroke="black" stroke-width="4" fill="none"/>
              <rect x="16" y="16" width="13" height="13" fill="black"/>
              <rect x="65" y="10" width="25" height="25" stroke="black" stroke-width="4" fill="none"/>
              <rect x="71" y="16" width="13" height="13" fill="black"/>
              <rect x="10" y="65" width="25" height="25" stroke="black" stroke-width="4" fill="none"/>
              <rect x="16" y="71" width="13" height="13" fill="black"/>
              <rect x="42" y="10" width="8" height="15" fill="black"/>
              <rect x="42" y="32" width="15" height="8" fill="black"/>
              <rect x="42" y="45" width="8" height="8" fill="black"/>
              <rect x="75" y="45" width="15" height="12" fill="black"/>
              <rect x="65" y="65" width="8" height="18" fill="black"/>
              <rect x="78" y="75" width="12" height="15" fill="black"/>
              <rect x="45" y="65" width="12" height="8" fill="black"/>
              <rect x="48" y="80" width="12" height="10" fill="black"/>
              <rect x="15" y="45" width="15" height="8" fill="black"/>
            </svg>`
            }
            <div style="font-size:7px;color:#94a3b8;margin-top:3px;">สแกนเพื่อชำระเงิน</div>
          </div>
        </div>

        <!-- Signatures -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:auto;">
          <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;
                      text-align:center;min-height:90px;display:flex;flex-direction:column;
                      justify-content:space-between;background:#fff;">
            <div style="font-size:7.5px;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">
              PREPARED BY
            </div>
            <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:4px 0;">
              ${company.signatureImage
                ? `<img src="${company.signatureImage}" alt="ลายเซ็น" style="max-height:48px;max-width:120px;object-fit:contain;">`
                : `<div style="border-bottom:1px solid #cbd5e1;width:80%;margin:8px auto;"></div>`}
            </div>
            <div style="font-size:8px;color:#94a3b8;">
              ( ${doc.salesPerson || company.salesPerson || "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"} )<br/>
              <span style="font-size:7.5px;font-weight:600;color:#64748b;">ผู้เสนอราคา</span>
            </div>
          </div>
          <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;
                      text-align:center;min-height:90px;display:flex;flex-direction:column;
                      justify-content:space-between;background:#fff;">
            <div style="font-size:7.5px;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">
              AUTHORIZED BY
            </div>
            <div style="border-bottom:1px solid #cbd5e1;width:80%;margin:12px auto 8px;"></div>
            <div style="font-size:8px;color:#94a3b8;">
              ( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )<br/>
              <span style="font-size:7.5px;font-weight:600;color:#64748b;">ผู้อนุมัติสั่งซื้อ</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Financial summary -->
      <div>
        <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
          <table style="width:100%;border-collapse:collapse;">
            <tbody>${summaryRows}</tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══ FOOTER ════════════════════════════════════════════ -->
  <div style="margin-top:24px;padding-top:12px;border-top:2px solid #FF5500;
              display:flex;justify-content:space-between;align-items:flex-end;">
    <div style="font-size:9px;color:#94a3b8;font-style:italic;">
      Thank you for your business.
    </div>
    <div style="text-align:right;position:relative;padding-right:12px;">
      <div style="font-size:9px;font-weight:800;font-style:italic;color:#0f172a;letter-spacing:1px;">MAKE YOUR</div>
      <div style="font-size:13px;font-weight:800;color:#FF5500;letter-spacing:1px;line-height:1.1;">BRAND SEEN</div>
      <div style="position:absolute;right:0;bottom:0;width:3px;height:30px;background:#FF5500;
                  border-radius:1px;transform:skewX(-8deg);"></div>
    </div>
  </div>

</div><!-- /page -->
</body>
</html>`;

  const printReadyScript = `<script>
    async function waitForDocumentAssets(){
      try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch(e) {}
      var images = Array.prototype.slice.call(document.images || []);
      await Promise.all(images.map(function(img){
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        if (img.decode) return img.decode().catch(function(){});
        return new Promise(function(resolve){
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        });
      }));
    }
    window.addEventListener("load", function(){
      waitForDocumentAssets().then(function(){ setTimeout(function(){ window.print(); }, 250); });
    });
  </script>`;
  const htmlToOpen = autoPrint
    ? html.replace("</body>", `${printReadyScript}</body>`)
    : html;
  const blob = new Blob([htmlToOpen], { type: "text/html;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);
  const w = window.open(blobUrl, "_blank", "width=960,height=780");
  if (!w) {
    URL.revokeObjectURL(blobUrl);
    alert("ไม่สามารถเปิดหน้าต่างเอกสารได้ กรุณาอนุญาต Pop-up สำหรับเว็บนี้");
    return;
  }
  w.focus();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
}

// ============================================================
// MAIN APP
// ============================================================

export default function AdminPage() {
  const initialSection = () => {
    if (typeof window === "undefined") return "erp";
    const requestedSection = new URLSearchParams(window.location.search).get("section");
    return ["erp", "cms", "marketing"].includes(requestedSection || "") ? requestedSection! : "erp";
  };
  const initialCmsTab = () => {
    if (typeof window === "undefined") return "blog";
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    return ["blog", "hero", "services", "reviews", "portfolio", "contact"].includes(requestedTab || "") ? requestedTab! : "blog";
  };
  const [mainTab, setMainTab] = useState(initialSection);
  const [tab, setTab] = useState(initialCmsTab);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [marketingMobileSection, setMarketingMobileSection] = useState("overview");
  const scrollToMarketingSection = (anchorId: string, navKey: string) => {
    setMarketingMobileSection(navKey);
    if (typeof window !== "undefined") {
      const sectionMap: Record<string, string> = {
        overview: "dashboard",
        campaigns: "facebook",
        funnel: "funnel",
        tracking: "leads",
        channels: "channels",
        insight: "insight",
        sources: "sources",
      };
      window.dispatchEvent(new CustomEvent("dwm-marketing-section", {
        detail: { section: sectionMap[navKey] || navKey },
      }));
    }
    // ให้ DOM render/ปิด drawer เสร็จก่อนค่อย scroll กันปัญหาตำแหน่งเพี้ยนตอนปิด drawer
    setTimeout(() => {
      document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

// ─── ERP STATE ───────────────────────────────────────────────────────────────
  const [erpPage, setErpPage] = useState("dashboard");
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [company, setCompany] = useState<any>({
    id: "", name: "", address: "", phone: "", email: "", taxId: "",
    salesPerson: "", bankName: "", bankBranch: "", bankAccount: "", bankType: "ออมทรัพย์", qrImage: "", signatureImage: "",
  });
  const [erpLoading, setErpLoading] = useState(true);

  // ── โหลดข้อมูลจาก Supabase ครั้งแรก ──────────────────────
  useEffect(() => {
    async function loadAll() {
      setErpLoading(true);
      try {
        await requireErpSession();
        const [custRes, prodRes, docRes, itemRes, compRes] = await Promise.all([
          supabase.from("erp_customers").select("*").order("created_at"),
          supabase.from("erp_products").select("*").order("created_at"),
          supabase.from("erp_documents").select("*").eq("deleted", false).order("created_at", { ascending: false }),
          supabase.from("erp_document_items").select("*").order("sort_order"),
          supabase.from("erp_company").select("*").limit(1).maybeSingle(),
        ]);
        const loadError = [custRes, prodRes, docRes, itemRes, compRes].find((res) => res.error)?.error;
        if (loadError) throw loadError;

        // map snake_case → camelCase สำหรับ customers
        if (custRes.data) setCustomers(custRes.data.map(c => ({
          id: c.id, name: c.name, contact: c.contact, phone: c.phone,
          email: c.email, address: c.address, taxId: c.tax_id,
          customerSegment: c.customer_segment || "",
          businessType: c.business_type || "",
        })));

        // map products
        if (prodRes.data) setProducts(prodRes.data.map(p => ({
          id: p.id, name: p.name, unit: p.unit, cost: p.cost, price: p.price,
          supplierName: p.supplier_name || p.supplierName || "",
          costUnit: p.cost_unit || p.costUnit || "piece",
          priceUnit: p.price_unit || p.priceUnit || "piece",
        })));

        try {
          const { data, error } = await supabase.from("erp_suppliers").select("*").order("created_at");
          if (error) throw error;
          let supplierRows = data || [];
          const localSuppliers = loadLocal("erp_suppliers", []) as any[];
          if (supplierRows.length === 0 && Array.isArray(localSuppliers) && localSuppliers.length > 0) {
            const rows = localSuppliers
              .filter((supplier: any) => String(supplier?.name || "").trim())
              .map((supplier: any) => ({
                name: String(supplier.name || "").trim(),
                contact: supplier.contact || "",
                phone: supplier.phone || "",
                email: supplier.email || "",
                address: supplier.address || "",
                tax_id: supplier.taxId || supplier.tax_id || "",
                notes: supplier.notes || supplier.note || "",
                items: Array.isArray(supplier.items) ? supplier.items : [],
              }));
            if (rows.length > 0) {
              const { data: migrated, error: migrateError } = await supabase.from("erp_suppliers").insert(rows).select("*");
              if (migrateError) throw migrateError;
              supplierRows = migrated || [];
              saveLocal("erp_suppliers", []);
              showToast("กู้ข้อมูล Supplier จากเครื่องและบันทึกลง database แล้ว");
            }
          }
          if (supplierRows) setSuppliers(supplierRows.map(s => ({
            id: s.id,
            name: s.name || "",
            contact: s.contact || "",
            phone: s.phone || "",
            email: s.email || "",
            address: s.address || "",
            taxId: s.tax_id || s.taxId || "",
            note: s.notes || s.note || "",
            items: Array.isArray(s.items) ? s.items : [],
          })));
        } catch (error) {
          console.warn("Supplier load fallback:", error);
          setSuppliers([]);
        }

        // map documents + inject items
        if (docRes.data) {
          const items = itemRes.data || [];
          setDocuments(docRes.data.map(d => applyErpDocumentShadow({
            id: d.id, type: d.type, docNo: d.doc_no, status: d.status,
            customerId: d.customer_id, customerName: d.customer_name,
            projectName: d.project_name, orderId: d.order_id,
            reference: d.reference, salesPerson: d.sales_person,
            leadSource: d.lead_source || "",
            marketingCampaign: d.marketing_campaign || "",
            marketingAdSet: d.marketing_adset || "",
            marketingAd: d.marketing_ad || "",
            paymentType: d.payment_type || "",
            paymentAmount: d.payment_amount ?? 0,
            paymentDate: d.payment_date || "",
            paymentNote: d.payment_note || "",
            paymentStatus: d.payment_status || "",
            date: d.date, dueDate: d.due_date,
            discount: d.discount, discountType: d.discount_type || "percent", vat: d.vat, vatRate: d.vat_rate ?? 7, wht: d.wht, whtRate: d.wht_rate,
            depositPaid: d.deposit_paid ?? 0,
            depositDate: d.deposit_date || "",
            depositNote: d.deposit_note || "",
            notes: d.notes, overrideAddress: d.override_address,
            bankName: d.bank_name, bankBranch: d.bank_branch,
            bankAccount: d.bank_account, bankType: d.bank_type, qrImage: d.qr_image,
            deleted: d.deleted,
            createdAt: new Date(d.created_at).getTime(),
            updatedAt: new Date(d.updated_at).getTime(),
            items: items.filter(i => i.document_id === d.id).map(i => ({
              id: i.id, name: i.name, subTitle: i.sub_title, detail: i.detail,
              unit: i.unit, qty: i.qty, price: i.price, costSnapshot: i.cost_snapshot,
              costUnit: i.cost_unit || "piece",
              priceUnit: i.price_unit || "piece",
              supplierName: i.supplier_name || "",
              widthM: i.width_m ?? undefined,
              heightM: i.height_m ?? undefined,
              pieces: i.pieces ?? undefined,
            })),
          })));
        }

        // map company
        if (compRes.data) setCompany({
          id: compRes.data.id,
          name: compRes.data.name || "", address: compRes.data.address || "",
          phone: compRes.data.phone || "", email: compRes.data.email || "",
          taxId: compRes.data.tax_id || "", salesPerson: compRes.data.sales_person || "",
          bankName: compRes.data.bank_name || "", bankBranch: compRes.data.bank_branch || "",
          bankAccount: compRes.data.bank_account || "", bankType: compRes.data.bank_type || "ออมทรัพย์",
          qrImage: compRes.data.qr_image || "",
          signatureImage: compRes.data.signature_image || "",
        });
      } catch (err) {
        console.error("ERP load error:", err);
        showToast("โหลดข้อมูล ERP จาก database ไม่สำเร็จ: " + ((err as any)?.message || err), "error");
      } finally {
        setErpLoading(false);
      }
    }
    loadAll();
  }, []);

  const docCounts = Object.keys(DOC_TYPES).reduce((acc, t) => {
    acc[t] = documents.filter((d) => d.type === t && !d.deleted && d.status !== "cancelled").length;
    return acc;
  }, {});

  const reportDocs = reportingDocuments(documents);
  const catalogProducts = [...products, ...supplierCatalogProducts(suppliers)];
  const totalRevenue = reportDocs
    .reduce((s, d) => s + calcDocTotal(d).total, 0);
  const resolveItemCost = (item: any) => fallbackItemCost(catalogProducts, item);
  const totalCost = reportDocs.reduce((s, d) => {
    return s + d.items.reduce((ss, i) => {
      // ใช้ costSnapshot (บันทึกตอน save) ถ้ามี — ไม่งั้นหาจาก products list (backward compat)
      return ss + lineCost(i, resolveItemCost(i));
    }, 0);
  }, 0);
  const totalProfit = totalRevenue - totalCost;

  const cmsTabs = [
    { id: "blog", icon: "📝", label: "บทความ" },
    { id: "hero", icon: "🖼️", label: "Hero Section" },
    { id: "services", icon: "🛠️", label: "บริการ" },
    { id: "reviews", icon: "⭐", label: "รีวิว" },
    { id: "portfolio", icon: "🖼", label: "ผลงาน" },
    { id: "page_content", icon: "📄", label: "ข้อความรายหน้า" },
    { id: "contact", icon: "📞", label: "ข้อมูลติดต่อ" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", color: "#fff", fontFamily: "'Prompt','Sarabun',sans-serif", display: "flex", flexDirection: "column" }}>

      {/* ─── TOP BAR ─── */}
      <div className="top-bar" style={{
        background: "#141A24", borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center",
        minHeight: 52,
        padding: "0 16px",
        paddingTop: "max(env(safe-area-inset-top, 0px), 0px)",
        gap: 8, flexShrink: 0, zIndex: 100,
      }}>
        <img
          src="/images/logo.png"
          alt="Display Works Media"
          style={{ width: 32, height: 28, objectFit: "contain", marginRight: 4, flexShrink: 0 }}
        />
        <span className="hide-mobile" style={{ fontWeight: 600, fontSize: 13, color: "#fff", marginRight: 16 }}>Display Works</span>
        <div className="hide-mobile" style={{ display: "flex", gap: 4 }}>
          {["erp","cms"].map(t => (
            <button key={t} onClick={() => setMainTab(t)} style={{
              padding: "6px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
              background: mainTab === t ? "#FF6B00" : "transparent",
              color: mainTab === t ? "#fff" : "#A8B0C0", transition: "all 0.2s",
            }}>
              {t === "erp" ? "⚙️ ERP" : "✏️ CMS"}
            </button>
          ))}
          <button onClick={() => setMainTab("marketing")} style={{
            padding: "6px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
            background: mainTab === "marketing" ? "#FF6B00" : "transparent",
            color: mainTab === "marketing" ? "#fff" : "#A8B0C0", transition: "all 0.2s",
          }}>
            Marketing
          </button>
        </div>
        {/* Mobile: compact title + drawer trigger */}
        <div className="show-mobile admin-mobile-top" style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
          <span className="admin-mobile-title" style={{ fontSize: 14, fontWeight: 700, color: "#fff", flex: 1 }}>
            {mainTab === "erp"
              ? (erpPage === "dashboard" ? "ภาพรวม" : erpPage === "customers" ? "ลูกค้า" : erpPage === "products" ? "สินค้า" : erpPage === "suppliers" ? "Supplier" : erpPage === "company" ? "บริษัท" : (DOC_TYPES as any)[erpPage]?.label || erpPage)
              : mainTab === "cms" ? (cmsTabs.find(t => t.id === tab)?.label || "CMS") : "Marketing"}
          </span>
          <button
            type="button"
            className="admin-module-trigger"
            onClick={() => setShowMobileDrawer(v => !v)}
            aria-label="Open admin menu"
          >
            <span>{mainTab === "marketing" ? "MKT" : mainTab.toUpperCase()}</span>
            <b>{showMobileDrawer ? "Close" : "Menu"}</b>
          </button>
        </div>
        <div style={{ flex: 1 }} className="hide-mobile" />
        <LogoutButton />
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* ─── ERP ─── */}
        {mainTab === "erp" && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div className="hide-mobile" style={{ display: "flex" }}>
              <ErpSidebar page={erpPage} setPage={setErpPage} docCounts={docCounts} />
            </div>
            <div className="main-content-area" style={{ flex: 1, overflowY: "auto", padding: "clamp(14px,3vw,28px)", paddingBottom: "clamp(80px,10vw,28px)" }}>
              {erpLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#888", fontSize: 14, gap: 10 }}>
                  <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span> กำลังโหลดข้อมูล...
                </div>
              ) : (<>
              {erpPage === "dashboard" && (
                <Dashboard documents={documents} customers={customers} products={catalogProducts}
                  totalRevenue={totalRevenue} totalCost={totalCost} totalProfit={totalProfit}
                  docCounts={docCounts} setPage={setErpPage} />
              )}
              {erpPage === "customers" && <CustomerPage customers={customers} setCustomers={setCustomers} documents={documents} products={catalogProducts} showToast={showToast} />}
              {erpPage === "products" && <ProductPage products={products} setProducts={setProducts} suppliers={suppliers} showToast={showToast} />}
              {erpPage === "suppliers" && <SupplierPage suppliers={suppliers} setSuppliers={setSuppliers} showToast={showToast} />}
              {erpPage === "company" && <CompanyPage company={company} setCompany={setCompany} showToast={showToast} />}
              {["quote","bill","invoice","receipt"].includes(erpPage) && (
                <DocumentPage type={erpPage}
                  documents={documents.filter(d => d.type === erpPage)}
                  allDocuments={documents} setDocuments={setDocuments}
                  customers={customers} products={catalogProducts} company={company} showToast={showToast} />
              )}
              </>)}
            </div>
          </div>
        )}

        {/* ─── CMS ─── */}
        {mainTab === "cms" && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div className="hide-mobile" style={{ width: 200, background: "#141A24", borderRight: "1px solid rgba(255,255,255,0.07)", padding: "16px 8px", display: "flex", flexDirection: "column" as const, gap: 4, flexShrink: 0 }}>
              {cmsTabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8,
                  fontSize: 13, border: "none", cursor: "pointer", textAlign: "left" as const, fontFamily: "inherit",
                  background: tab === t.id ? "rgba(255,107,0,0.15)" : "transparent",
                  color: tab === t.id ? "#FF6B00" : "#A8B0C0",
                  borderLeft: tab === t.id ? "2px solid #FF6B00" : "2px solid transparent",
                }}>
                  <span>{t.icon}</span><span>{t.label}</span>
                </button>
              ))}
            </div>
            <div className="main-content-area" style={{ flex: 1, overflowY: "auto", padding: "clamp(14px,3vw,28px)", paddingBottom: "clamp(80px,10vw,28px)" }}>
              {tab === "blog" && <BlogManager showToast={showToast} />}
              {tab === "hero" && <HeroManager showToast={showToast} />}
              {tab === "services" && <ServicesManager showToast={showToast} />}
              {tab === "reviews" && <ReviewsManager showToast={showToast} />}
              {tab === "portfolio" && <PortfolioManager showToast={showToast} />}
              {tab === "page_content" && <PageContentManager showToast={showToast} />}
              {tab === "contact" && <ContactManager showToast={showToast} />}
            </div>
          </div>
        )}

        {mainTab === "marketing" && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div className="main-content-area" style={{ flex: 1, overflowY: "auto", padding: "clamp(14px,3vw,28px)", paddingBottom: "clamp(80px,10vw,28px)" }}>
              <MarketingKpiDashboard
                documents={documents}
                customers={customers}
                products={catalogProducts}
                totalRevenue={totalRevenue}
                totalCost={totalCost}
                totalProfit={totalProfit}
                showToast={showToast}
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── MOBILE BOTTOM NAV ─── */}
      <div className="show-mobile" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
        background: "rgba(20,26,36,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex", paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
      }}>
        {mainTab === "erp" && ([
          { id: "dashboard", icon: "⊞", label: "ภาพรวม" },
          { id: "quote",     icon: "📋", label: "ใบเสนอ" },
          { id: "invoice",   icon: "🧾", label: "ใบแจ้งหนี้" },
          { id: "receipt",   icon: "✅", label: "ใบเสร็จ" },
          { id: "__more__",  icon: "☰",  label: "เพิ่มเติม" },
        ] as any[]).map(item => (
          <button key={item.id} onClick={() => {
            if (item.id === "__more__") { setShowMobileDrawer(v => !v); }
            else { setErpPage(item.id); setShowMobileDrawer(false); }
          }} style={{
            flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
            padding: "10px 2px 8px", border: "none", cursor: "pointer", fontFamily: "inherit",
            background: (erpPage === item.id && !showMobileDrawer) || (item.id === "__more__" && showMobileDrawer) ? "rgba(255,107,0,0.12)" : "transparent",
            color: (erpPage === item.id && !showMobileDrawer) || (item.id === "__more__" && showMobileDrawer) ? "#FF6B00" : "#6B7280",
          }} className="nav-btn">
            <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontSize: 10, marginTop: 4, fontWeight: 600 }}>{item.label}</span>
          </button>
        ))}
        {mainTab === "cms" && ([
          ...cmsTabs.slice(0,4),
          { id: "__more__", icon: "☰", label: "เพิ่มเติม" },
        ] as any[]).map(item => (
          <button key={item.id} onClick={() => {
            if (item.id === "__more__") { setShowMobileDrawer(v => !v); }
            else { setTab(item.id); setShowMobileDrawer(false); }
          }} style={{
            flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
            padding: "10px 2px 8px", border: "none", cursor: "pointer", fontFamily: "inherit",
            background: tab === item.id && !showMobileDrawer ? "rgba(255,107,0,0.12)" : "transparent",
            color: tab === item.id && !showMobileDrawer ? "#FF6B00" : "#6B7280",
          }} className="nav-btn">
            <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontSize: 10, marginTop: 4, fontWeight: 600 }}>{item.label}</span>
          </button>
        ))}
        {mainTab === "marketing" && ([
          { id: "overview", icon: "📊", label: "ภาพรวม", anchor: "marketing-dashboard" },
          { id: "campaigns", icon: "📣", label: "แคมเปญ", anchor: "marketing-campaigns" },
          { id: "sources", icon: "🔗", label: "Source", anchor: "marketing-data-sources" },
          { id: "tracking", icon: "🎯", label: "Tracking", anchor: "marketing-crm" },
          { id: "__more__", icon: "☰", label: "เพิ่มเติม" },
        ] as any[]).map(item => (
          <button key={item.id} onClick={() => {
            if (item.id === "__more__") setShowMobileDrawer(v => !v);
            else { scrollToMarketingSection(item.anchor, item.id); setShowMobileDrawer(false); }
          }} style={{
            flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
            padding: "10px 2px 8px", border: "none", cursor: "pointer", fontFamily: "inherit",
            background: item.id === marketingMobileSection && !showMobileDrawer ? "rgba(255,107,0,0.12)" : "transparent",
            color: item.id === marketingMobileSection && !showMobileDrawer ? "#FF6B00" : "#6B7280",
          }} className="nav-btn">
            <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontSize: 10, marginTop: 4, fontWeight: 600 }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* ─── MOBILE DRAWER ─── */}
      {showMobileDrawer && (
        <>
          <div className="show-mobile" onClick={() => setShowMobileDrawer(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300 }} />
          <div className="show-mobile mobile-drawer" style={{
            position: "fixed", bottom: "calc(62px + env(safe-area-inset-bottom, 0px))", left: 0, right: 0, zIndex: 400,
            background: "rgba(20,26,36,0.98)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
            borderTop: "2px solid #FF6B00",
            borderRadius: "20px 20px 0 0", padding: "16px 0 12px",
            animation: "slideUp 0.25s cubic-bezier(0.32,0.72,0,1)",
            boxShadow: "0 -16px 48px rgba(0,0,0,0.6)",
            flexDirection: "column" as const,
            maxHeight: "min(72dvh, 560px)",
            overflowY: "auto",
            overscrollBehavior: "contain" as const,
          }}>
            <div className="mobile-module-switch" aria-label="Admin module switcher">
              {(["erp", "cms", "marketing"] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  className={mainTab === t ? "active" : ""}
                  onClick={() => {
                    setMainTab(t);
                    if (t === "marketing") setMarketingMobileSection("dashboard");
                  }}
                >
                  {t === "marketing" ? "Marketing" : t.toUpperCase()}
                </button>
              ))}
            </div>
            <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 99, margin: "0 auto 12px" }} />

            {/* ─ ชื่อหัวข้อ drawer ─ */}
            <div style={{ fontSize: 11, fontWeight: 700, color: "#FF6B00", letterSpacing: 2, textTransform: "uppercase", padding: "0 24px 8px" }}>
              {mainTab === "erp" ? "เมนูทั้งหมด" : mainTab === "marketing" ? "Marketing" : "จัดการเนื้อหา"}
            </div>

            {/* ─ ERP: แสดงทุกเมนู ─ */}
            {mainTab === "erp" && ([
              { id: "dashboard", icon: "⊞", label: "ภาพรวม",         color: "#A8B0C0" },
              { id: "quote",     icon: "📋", label: "ใบเสนอราคา",     color: (DOC_TYPES as any).quote.color },
              { id: "bill",      icon: "📄", label: "ใบวางบิล",       color: (DOC_TYPES as any).bill.color },
              { id: "invoice",   icon: "🧾", label: "ใบแจ้งหนี้",     color: (DOC_TYPES as any).invoice.color },
              { id: "receipt",   icon: "✅", label: "ใบเสร็จรับเงิน", color: (DOC_TYPES as any).receipt.color },
              { id: "customers", icon: "👥", label: "ลูกค้า",          color: "#60A5FA" },
              { id: "products",  icon: "📦", label: "สินค้า/บริการ",  color: "#A78BFA" },
              { id: "suppliers", icon: "🏭", label: "Supplier",       color: "#F97316" },
              { id: "company",   icon: "🏢", label: "ตั้งค่าบริษัท",  color: "#34D399" },
              { id: "__cms__",   icon: "✏️", label: "ไปหน้า CMS",     color: "#F59E0B" },
            ] as any[]).map(item => {
              const isActive = item.id !== "__cms__" && erpPage === item.id;
              return (
                <button key={item.id} onClick={() => {
                  if (item.id === "__cms__") setMainTab("cms");
                  else setErpPage(item.id);
                  setShowMobileDrawer(false);
                }} style={{
                  display: "flex", alignItems: "center", gap: 14, width: "100%",
                  padding: "13px 24px", border: "none", cursor: "pointer", fontFamily: "inherit",
                  background: isActive ? "rgba(255,107,0,0.1)" : "transparent",
                  color: isActive ? "#FF6B00" : "#e2e8f0", fontSize: 15,
                  borderLeft: isActive ? "3px solid #FF6B00" : "3px solid transparent",
                  minHeight: 52,
                }}>
                  <span style={{ fontSize: 20, width: 28, textAlign: "center" as const }}>{item.icon}</span>
                  <span style={{ flex: 1, fontWeight: isActive ? 700 : 400 }}>{item.label}</span>
                  {!isActive && item.id !== "__cms__" && (
                    <span style={{ fontSize: 11, color: item.color, background: item.color + "22", padding: "2px 10px", borderRadius: 99 }}>เปิด</span>
                  )}
                  {isActive && <span style={{ fontSize: 11, color: "#FF6B00" }}>● กำลังใช้</span>}
                  {item.id === "__cms__" && <span style={{ fontSize: 11, color: item.color, background: item.color + "22", padding: "2px 10px", borderRadius: 99 }}>สลับ</span>}
                </button>
              );
            })}

            {/* ─ CMS: แสดงทุกแท็บ ─ */}
            {mainTab === "cms" && ([
              ...cmsTabs,
              { id: "__erp__", icon: "⚙️", label: "ไปหน้า ERP", color: "#FF6B00" },
            ] as any[]).map(item => {
              const isActive = item.id !== "__erp__" && tab === item.id;
              return (
                <button key={item.id} onClick={() => {
                  if (item.id === "__erp__") setMainTab("erp");
                  else setTab(item.id);
                  setShowMobileDrawer(false);
                }} style={{
                  display: "flex", alignItems: "center", gap: 14, width: "100%",
                  padding: "13px 24px", border: "none", cursor: "pointer", fontFamily: "inherit",
                  background: isActive ? "rgba(255,107,0,0.1)" : "transparent",
                  color: isActive ? "#FF6B00" : "#e2e8f0", fontSize: 15,
                  borderLeft: isActive ? "3px solid #FF6B00" : "3px solid transparent",
                  minHeight: 52,
                }}>
                  <span style={{ fontSize: 20, width: 28, textAlign: "center" as const }}>{item.icon}</span>
                  <span style={{ flex: 1, fontWeight: isActive ? 700 : 400 }}>{item.label}</span>
                  {!isActive && item.id !== "__erp__" && (
                    <span style={{ fontSize: 11, color: "#A8B0C0", background: "rgba(255,255,255,0.06)", padding: "2px 10px", borderRadius: 99 }}>เปิด</span>
                  )}
                  {isActive && <span style={{ fontSize: 11, color: "#FF6B00" }}>● กำลังใช้</span>}
                  {item.id === "__erp__" && <span style={{ fontSize: 11, color: item.color, background: item.color + "22", padding: "2px 10px", borderRadius: 99 }}>สลับ</span>}
                </button>
              );
            })}

            {/* ─ Marketing: แสดงทุก section ─ */}
            {mainTab === "marketing" && ([
              { id: "overview", icon: "📊", label: "Dashboard", anchor: "marketing-dashboard" },
              { id: "campaigns", icon: "📣", label: "Campaigns", anchor: "marketing-campaigns" },
              { id: "funnel", icon: "🌐", label: "Lead Funnel", anchor: "marketing-lead-funnel" },
              { id: "tracking", icon: "🎯", label: "Leads / CRM", anchor: "marketing-crm" },
              { id: "channels", icon: "📡", label: "Channels", anchor: "marketing-channels" },
              { id: "insight", icon: "🤖", label: "AI Insight", anchor: "marketing-ai-insight" },
              { id: "sources", icon: "🔗", label: "Data Sources", anchor: "marketing-data-sources" },
            ] as any[]).map(item => {
              const isActive = marketingMobileSection === item.id;
              return (
                <button key={item.id} onClick={() => {
                  scrollToMarketingSection(item.anchor, item.id);
                  setShowMobileDrawer(false);
                }} style={{
                  display: "flex", alignItems: "center", gap: 14, width: "100%",
                  padding: "13px 24px", border: "none", cursor: "pointer", fontFamily: "inherit",
                  background: isActive ? "rgba(255,107,0,0.1)" : "transparent",
                  color: isActive ? "#FF6B00" : "#e2e8f0", fontSize: 15,
                  borderLeft: isActive ? "3px solid #FF6B00" : "3px solid transparent",
                  minHeight: 52,
                }}>
                  <span style={{ fontSize: 20, width: 28, textAlign: "center" as const }}>{item.icon}</span>
                  <span style={{ flex: 1, fontWeight: isActive ? 700 : 400 }}>{item.label}</span>
                  {isActive && <span style={{ fontSize: 11, color: "#FF6B00" }}>● กำลังใช้</span>}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "calc(80px + env(safe-area-inset-bottom, 0px))", right: 16, left: 16, zIndex: 9999,
          background: toast.type === "error" ? "#7f1d1d" : "#064e3b",
          border: `1px solid ${toast.type === "error" ? "#ef4444" : "#10b981"}`,
          color: "#fff", padding: "14px 20px", borderRadius: 14, fontSize: 14,
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 10,
          maxWidth: "calc(100vw - 32px)", animation: "scaleIn 0.2s ease",
        }}>
          <span>{toast.type === "error" ? "✗" : "✓"}</span>{toast.msg}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');

        /* ── iPhone 15 Pro base resets ── */
        *, *::before, *::after { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        html { -webkit-text-size-adjust: 100%; }

        input, select, textarea {
          background: #1A2233 !important; border: 1px solid rgba(255,255,255,0.12) !important;
          color: #fff !important; border-radius: 10px !important; padding: 12px 14px !important;
          font-family: 'Prompt', sans-serif !important; font-size: 16px !important;
          outline: none !important; width: 100%; transition: border-color 0.2s;
          -webkit-appearance: none; appearance: none;
          min-height: 48px;
        }
        input:focus, select:focus, textarea:focus { border-color: #FF6B00 !important; box-shadow: 0 0 0 3px rgba(255,107,0,0.15) !important; }
        input::placeholder, textarea::placeholder { color: #555 !important; }
        select option { background: #141A24; }
        label { font-size: 13px; color: #A8B0C0; display: block; margin-bottom: 6px; font-weight: 500; }
        button { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
        table { min-width: 720px; }
        .main-content-area > div {
          max-width: 1440px;
          margin-left: auto;
          margin-right: auto;
        }
        .main-content-area h2 {
          letter-spacing: 0;
          line-height: 1.25;
        }
        .main-content-area table th,
        .main-content-area table td {
          vertical-align: middle;
        }

        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: #0B0F19; }
        ::-webkit-scrollbar-thumb { background: #FF6B00; border-radius: 3px; }

        .admin-logout-btn {
          white-space: nowrap;
        }

        @keyframes slideUp { from { transform: translateY(100%); opacity:0; } to { transform: translateY(0); opacity:1; } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity:0; } to { transform: scale(1); opacity:1; } }

        /* ── Responsive ── */
        .hide-mobile { display: flex; }
        .show-mobile { display: none !important; }
        .erp-mobile-card-list { display: none; }

        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
          body {
            overflow-x: hidden !important;
          }
          .top-bar {
            gap: 6px !important;
            padding-left: 10px !important;
            padding-right: 10px !important;
            position: sticky !important;
            top: 0 !important;
            z-index: 250 !important;
          }
          .top-bar img {
            width: 30px !important;
            height: 26px !important;
          }
          .top-bar .show-mobile > span:first-child {
            min-width: 0 !important;
            max-width: 34vw !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
          }
          .top-bar .show-mobile > div {
            max-width: 42vw !important;
            overflow-x: auto !important;
            scrollbar-width: none;
          }
          .top-bar .show-mobile > div::-webkit-scrollbar {
            display: none;
          }
          .admin-mobile-top {
            min-width: 0 !important;
            overflow: hidden !important;
          }
          .admin-mobile-title {
            max-width: none !important;
            min-width: 0 !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
            flex: 1 1 auto !important;
          }
          .admin-module-trigger {
            display: inline-flex !important;
            align-items: center !important;
            gap: 8px !important;
            flex: 0 0 auto !important;
            min-height: 38px !important;
            border: 1px solid rgba(255,107,0,.38) !important;
            border-radius: 12px !important;
            background: linear-gradient(135deg, rgba(255,107,0,.2), rgba(255,255,255,.04)) !important;
            color: #fff !important;
            padding: 8px 11px !important;
            font-family: inherit !important;
            font-weight: 900 !important;
            box-shadow: 0 8px 24px rgba(255,107,0,.14) !important;
          }
          .admin-module-trigger span {
            color: #ff6b00 !important;
            letter-spacing: .04em !important;
            font-size: 12px !important;
          }
          .admin-module-trigger b {
            font-size: 12px !important;
            line-height: 1 !important;
          }
          .admin-mobile-switch {
            max-width: 46vw !important;
            overflow-x: auto !important;
            scrollbar-width: none;
          }
          .admin-mobile-switch::-webkit-scrollbar {
            display: none;
          }
          .admin-logout-btn {
            width: 42px !important;
            height: 42px !important;
            min-height: 42px !important;
            padding: 0 !important;
            justify-content: center !important;
            border-radius: 12px !important;
            font-size: 0 !important;
          }
          .admin-logout-btn > span:first-child {
            font-size: 18px !important;
          }
          .admin-logout-text {
            display: none !important;
          }
          .top-bar > button,
          .top-bar a {
            flex-shrink: 0 !important;
          }
          .mobile-drawer {
            flex-direction: column !important;
            padding-top: 12px !important;
          }
          .mobile-module-switch {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 8px !important;
            padding: 0 16px 12px !important;
          }
          .mobile-module-switch button {
            min-height: 44px !important;
            border: 1px solid rgba(255,255,255,.12) !important;
            border-radius: 13px !important;
            background: rgba(255,255,255,.05) !important;
            color: #cbd5e1 !important;
            font-family: inherit !important;
            font-size: 12px !important;
            font-weight: 900 !important;
          }
          .mobile-module-switch button.active {
            border-color: #ff6b00 !important;
            background: linear-gradient(135deg, #ff6b00, #f97316) !important;
            color: #fff !important;
            box-shadow: 0 10px 28px rgba(255,107,0,.22) !important;
          }
          .mobile-drawer > button {
            flex-shrink: 0 !important;
          }
          .mobile-drawer > button > span:nth-child(2) {
            min-width: 0 !important;
            line-height: 1.35 !important;
            overflow-wrap: anywhere;
          }
          .mobile-drawer > button > span:last-child {
            flex-shrink: 0 !important;
            white-space: nowrap !important;
          }
          table:not(.doc-table) {
            display: block !important;
            width: 100% !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            border-radius: 12px;
          }
          table:not(.doc-table) {
            min-width: 680px;
          }
          table:not(.doc-table) thead,
          table:not(.doc-table) tbody,
          table:not(.doc-table) tr {
            width: 100%;
          }
          .main-content-area > div {
            max-width: none;
            width: 100%;
            min-width: 0;
          }
          .main-content-area h2 {
            font-size: 18px !important;
          }
          .main-content-area {
            width: 100vw !important;
            max-width: 100vw !important;
            min-width: 0 !important;
            padding: 14px 12px calc(92px + env(safe-area-inset-bottom, 16px)) !important;
            overflow-x: hidden !important;
            scroll-padding-bottom: calc(92px + env(safe-area-inset-bottom, 16px)) !important;
          }
          .main-content-area > div[style*="grid"],
          .main-content-area form,
          .main-content-area section,
          .main-content-area article {
            max-width: 100%;
            min-width: 0;
          }
          .main-content-area form[style*="grid-template-columns"],
          .form-grid-2,
          .form-grid-3,
          .erp-card-grid,
          .dash-grid,
          .kpi-grid,
          .chart-panel,
          .insights-row,
          .service-portfolio-editor-grid,
          .service-portfolio-fields {
            grid-template-columns: 1fr !important;
          }
          .main-content-area input,
          .main-content-area select,
          .main-content-area textarea {
            min-width: 0 !important;
            max-width: 100% !important;
          }
          .main-content-area button {
            max-width: 100%;
          }
          .erp-dashboard-header,
          .erp-page-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            margin-bottom: 16px !important;
          }
          .erp-date-controls {
            width: 100% !important;
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 8px !important;
            justify-content: stretch !important;
          }
          .erp-date-controls button,
          .erp-date-controls input {
            width: 100% !important;
            min-width: 0 !important;
            min-height: 44px !important;
            text-align: center !important;
            padding-left: 8px !important;
            padding-right: 8px !important;
          }
          .erp-page-actions {
            width: 100% !important;
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .erp-page-actions input,
          .erp-page-actions select,
          .erp-page-actions button {
            width: 100% !important;
          }
          .erp-card-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .erp-data-card {
            padding: 14px !important;
            border-radius: 14px !important;
          }
          .erp-card-actions button {
            width: 44px !important;
            height: 44px !important;
          }
          .erp-desktop-table {
            display: none !important;
          }
          .erp-mobile-card-list {
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
          }
          .erp-mobile-card {
            background: #141A24 !important;
            border: 1px solid rgba(255,255,255,0.08) !important;
            border-radius: 14px !important;
            padding: 14px !important;
          }
          .erp-mobile-card-head {
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
            gap: 12px !important;
            margin-bottom: 12px !important;
          }
          .erp-mobile-card-title {
            color: #fff !important;
            font-size: 15px !important;
            font-weight: 700 !important;
            line-height: 1.45 !important;
          }
          .erp-mobile-card-meta {
            color: #94A3B8 !important;
            font-size: 12px !important;
            line-height: 1.55 !important;
          }
          .erp-mobile-stats {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            margin: 10px 0 12px !important;
          }
          .erp-mobile-stat {
            background: rgba(255,255,255,0.035) !important;
            border: 1px solid rgba(255,255,255,0.06) !important;
            border-radius: 10px !important;
            padding: 10px !important;
          }
          .erp-mobile-stat span {
            display: block !important;
            color: #64748B !important;
            font-size: 11px !important;
            margin-bottom: 4px !important;
          }
          .erp-mobile-stat strong {
            color: #fff !important;
            font-size: 14px !important;
            line-height: 1.3 !important;
          }
          .erp-mobile-actions {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .erp-mobile-actions button {
            width: 100% !important;
            min-height: 44px !important;
          }
          .main-content-area [style*="display: flex"] {
            min-width: 0 !important;
          }
          .main-content-area [style*="font-size: 32px"],
          .main-content-area [style*="fontSize: 32"] {
            font-size: 24px !important;
            line-height: 1.2 !important;
          }
          .main-content-area [style*="font-size: 28px"],
          .main-content-area [style*="fontSize: 28"] {
            font-size: 22px !important;
            line-height: 1.25 !important;
          }

          /* Document table → card list on mobile */
          .doc-list-panel {
            overflow-x: visible !important;
            -webkit-overflow-scrolling: touch;
          }
          .doc-table {
            display: none !important;
          }
          .doc-cards { display: flex !important; }

          /* Dashboard grid 1 col */
          .dash-grid { grid-template-columns: 1fr !important; }

          /* Form full width */
          .form-grid-2 { grid-template-columns: 1fr !important; }
          .form-grid-3 { grid-template-columns: 1fr !important; }

          /* Touch targets — only for non-nav buttons */
          button:not(.nav-btn) { min-height: 44px; }

          /* Modal bottom sheet on mobile */
          .modal-panel {
            position: fixed !important;
            bottom: 0 !important; left: 0 !important; right: 0 !important;
            top: auto !important;
            border-radius: 20px 20px 0 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            max-height: 92dvh !important;
            padding-right: 12px !important;
            padding-left: 12px !important;
            animation: slideUp 0.3s cubic-bezier(0.32,0.72,0,1) !important;
          }
          .modal-panel > div {
            min-width: 0 !important;
          }
          .modal-panel > div:first-child {
            padding: 16px 18px !important;
          }
          .modal-panel > div:nth-child(2) {
            padding: 14px 18px calc(18px + env(safe-area-inset-bottom, 0px)) !important;
          }
          .modal-panel .form-grid-2,
          .modal-panel .form-grid-3 {
            gap: 12px !important;
          }
          .modal-panel input,
          .modal-panel select,
          .modal-panel textarea {
            font-size: 16px !important;
            min-height: 44px !important;
          }
          .modal-backdrop {
            align-items: flex-end !important;
            padding: 0 !important;
          }

          /* Content padding accounts for nav + safe area */
          /* KPI cards 2-col grid */
          .kpi-grid { grid-template-columns: 1fr 1fr !important; }
          .kpi-grid > div { padding: 14px 12px !important; }

          /* Chart panel full width */
          .chart-panel { grid-template-columns: 1fr !important; }

          /* Top bar — use minHeight not height (safe area makes it taller) */
          .top-bar { height: auto !important; min-height: 52px !important; }

          /* Doc header stack vertical */
          .doc-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .doc-header-row .doc-header-actions { width: 100% !important; display: flex !important; gap: 8px !important; flex-wrap: wrap !important; }
          .doc-header-row .doc-header-actions input { flex: 1 !important; min-width: 120px !important; }
          .doc-header-row .doc-header-actions select { flex: 1 !important; min-width: 120px !important; }
          .doc-header-row .doc-header-actions button { white-space: nowrap !important; flex-shrink: 0 !important; }
          .doc-cards { gap: 12px !important; }
          .doc-cards > div { border-radius: 14px !important; }
          .doc-mobile-card {
            background: rgba(20,26,36,0.95) !important;
            border: 1px solid rgba(255,255,255,0.08) !important;
            border-bottom: 1px solid rgba(255,255,255,0.08) !important;
            box-shadow: 0 10px 26px rgba(0,0,0,0.18) !important;
          }
          .doc-mobile-card-head {
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .doc-mobile-card-head > div:first-child {
            min-width: 0 !important;
          }
          .doc-mobile-card-head > div:last-child {
            flex: 0 0 auto !important;
          }
          .doc-mobile-card-head [style*="font-family: monospace"] {
            overflow-wrap: anywhere !important;
          }
          .doc-mobile-footer {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .doc-mobile-status button {
            width: 100% !important;
            justify-content: center !important;
            min-height: 42px !important;
          }
          .doc-mobile-actions {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 8px !important;
          }
          .doc-mobile-actions > button,
          .doc-mobile-actions > div > button {
            width: 100% !important;
            min-height: 42px !important;
            justify-content: center !important;
          }

          /* Insights row single col */
          .insights-row { grid-template-columns: 1fr !important; }

          /* Card padding smaller */
          .card-pad { padding: 16px !important; }
          .service-portfolio-editor-grid,
          .service-portfolio-fields {
            grid-template-columns: 1fr !important;
          }
          .service-portfolio-editor-card {
            padding: 10px !important;
          }
          .service-portfolio-editor-card input[type="file"] {
            padding: 10px !important;
            line-height: 1.3 !important;
          }

          /* Marketing KPI Dashboard mobile layout */
          .marketing-dashboard-shell {
            border-radius: 16px !important;
            min-height: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: hidden !important;
          }
          .marketing-shell-grid {
            grid-template-columns: 1fr !important;
            min-width: 0 !important;
          }
          .marketing-sidebar {
            padding: 12px !important;
            border-right: 0 !important;
            border-bottom: 1px solid rgba(255,107,0,0.16) !important;
            gap: 10px !important;
          }
          .marketing-sidebar > div:first-child { gap: 8px !important; }
          .marketing-sidebar > div:first-child > div:first-child {
            width: 34px !important;
            height: 34px !important;
            border-radius: 10px !important;
            font-size: 12px !important;
          }
          .marketing-sidebar > div:first-child > div:last-child > div:first-child { font-size: 13px !important; }
          .marketing-sidebar > div:first-child > div:last-child > div:last-child { font-size: 9px !important; }
          .marketing-sidebar > div:last-child { display: none !important; }
          .marketing-sidebar-nav {
            display: flex !important;
            gap: 8px !important;
            overflow-x: auto !important;
            padding: 2px 0 6px !important;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }
          .marketing-sidebar-nav::-webkit-scrollbar { display: none; }
          .marketing-sidebar-nav a {
            flex: 0 0 auto !important;
            padding: 9px 12px !important;
            border-radius: 999px !important;
            font-size: 12px !important;
            white-space: nowrap !important;
          }
          .marketing-sidebar-nav a span { font-size: 12px !important; }
          .marketing-main {
            padding: 14px !important;
            min-width: 0 !important;
            overflow-x: hidden !important;
          }
          .marketing-main,
          .marketing-main * {
            min-width: 0;
          }
          .marketing-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .marketing-header h1 {
            font-size: 20px !important;
            line-height: 1.25 !important;
          }
          .marketing-header p {
            font-size: 12px !important;
            line-height: 1.55 !important;
          }
          .marketing-header > div:last-child {
            width: 100% !important;
            overflow-x: auto !important;
            padding-bottom: 2px !important;
          }
          .marketing-header select,
          .marketing-header button {
            flex: 1 0 auto !important;
            min-width: 130px !important;
          }
          .marketing-header input[type="date"] {
            width: 100% !important;
            min-height: 46px !important;
          }
          .marketing-kpi-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .marketing-kpi-grid > div { padding: 12px !important; }
          .marketing-kpi-grid > div > div:last-child,
          .marketing-kpi-grid > div > div:nth-last-child(2) {
            overflow-wrap: anywhere !important;
          }
          .marketing-main section {
            max-width: 100% !important;
            min-width: 0 !important;
          }
          .marketing-main #marketing-lead-funnel,
          .marketing-main #marketing-crm > div:nth-child(2),
          .marketing-main #marketing-channels > div,
          .marketing-main #marketing-ai-insight > div:last-child,
          .marketing-main #marketing-data-sources > div {
            grid-template-columns: 1fr !important;
          }
          .marketing-main #marketing-crm table {
            min-width: 760px !important;
          }
          .marketing-main table {
            min-width: 680px !important;
          }
          .marketing-main th,
          .marketing-main td {
            padding: 12px 10px !important;
            white-space: normal !important;
            vertical-align: top !important;
          }
          .marketing-main #marketing-crm > div:last-child {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }
          .marketing-main svg {
            max-width: 100% !important;
          }
        }

        /* ── iPhone 15 Pro specific (393px wide) ── */
        @media (max-width: 430px) {
          input, select, textarea { font-size: 16px !important; } /* prevent iOS auto-zoom */
          .admin-mobile-title { max-width: none !important; }
          .admin-mobile-switch { display: none !important; }
          .erp-date-controls {
            grid-template-columns: 1fr 1fr !important;
          }
          .erp-date-controls input[type="number"] {
            grid-column: span 2 !important;
          }
          .kpi-grid {
            grid-template-columns: 1fr !important;
          }
          .erp-mobile-stats {
            grid-template-columns: 1fr !important;
          }
          .marketing-kpi-grid { grid-template-columns: 1fr !important; }
          .marketing-header > div:last-child {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            overflow: visible !important;
          }
          .marketing-header > div:last-child > div:last-child {
            display: none !important;
          }
          .marketing-main {
            padding: 12px !important;
          }
          .marketing-sidebar {
            margin: -2px -2px 0 !important;
          }
          .marketing-sidebar-nav a {
            min-height: 42px !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── MARKETING COMPONENTS ─────────────────────────────────────────────────────
function MarketingPage({ documents, showToast }: any) {
  const defaultCampaigns = [
    { id: genId(), name: "Vinyl Banner Lead Gen", channel: "Facebook Ads", objective: "LINE Inquiry", budget: 1500, status: "planning", startDate: today(), endDate: addDays(today(), 14), landingPage: "/services/vinyl-banner", note: "โปรโมตงานป้ายไวนิลสำหรับร้านอาหารและหน้าร้าน" },
    { id: genId(), name: "Sticker Product Label", channel: "Organic / Blog", objective: "Service Page Visit", budget: 0, status: "active", startDate: today(), endDate: addDays(today(), 30), landingPage: "/services/sticker", note: "ดันบทความและหน้าบริการสติ๊กเกอร์ฉลากสินค้า" },
  ];
  const [campaigns, setCampaigns] = useState(() => loadLocal("marketing_campaigns", defaultCampaigns));
  const [form, setForm] = useState({
    id: "",
    name: "",
    channel: "Facebook Ads",
    objective: "LINE Inquiry",
    budget: "",
    status: "planning",
    startDate: today(),
    endDate: addDays(today(), 14),
    landingPage: "/",
    note: "",
  });
  const [utm, setUtm] = useState({
    url: "https://displayworksmedia.com/",
    source: "facebook",
    medium: "paid_social",
    campaign: "vinyl_banner",
    content: "",
  });
  const [ga4, setGa4] = useState({
    loading: true,
    connected: false,
    error: "",
    totals: { activeUsers: 0, sessions: 0, pageViews: 0, events: 0 },
    traffic: [] as any[],
    topPages: [] as any[],
  });
  const [metaAds, setMetaAds] = useState({
    loading: true,
    connected: false,
    error: "",
    totals: { spend: 0, impressions: 0, reach: 0, clicks: 0, cpc: 0, cpm: 0, ctr: 0, leads: 0, cpl: 0 },
    campaigns: [] as any[],
  });
  const leadStatuses = ["New Lead", "Contacted", "Waiting for Detail", "Detail Completed", "Quotation Sent", "Follow-up", "Waiting Payment", "Closed Won", "Closed Lost", "No Response", "Not Qualified"];
  const behaviorTagOptions = [
    "Asked price first", "Has size", "Does not know size", "Artwork ready", "Needs design help",
    "Has deadline", "Urgent job", "Compare sizes", "Lowest-price seeker", "Silent after quote",
    "Repeat customer", "Referral"
  ];
  const defaultLeads = [
    { id: genId(), date: today(), customerName: "LINE lead - Vinyl banner", contact: "@line", source: "Facebook Ads", campaign: "Vinyl Banner Lead Gen", productInterest: "Vinyl Banner", customerType: "Restaurant", buyingSituation: "Promotion sign", tags: ["Asked price first", "Has size", "Has deadline"], status: "Quotation Sent", estimatedValue: 2500, nextFollowUpDate: addDays(today(), 1), owner: "Admin", note: "Sample CRM lead. Edit or delete after real data is added." },
    { id: genId(), date: today(), customerName: "Facebook lead - Product label", contact: "Messenger", source: "Organic / Blog", campaign: "Sticker Product Label", productInterest: "Sticker Label", customerType: "SME Brand", buyingSituation: "New product launch", tags: ["Artwork ready", "Has size"], status: "Contacted", estimatedValue: 1800, nextFollowUpDate: addDays(today(), 2), owner: "Admin", note: "Sample lead for Phase 1 CRM." },
  ];
  const [leads, setLeads] = useState(() => loadLocal("marketing_leads_crm", defaultLeads));
  const emptyLeadForm = {
    id: "",
    date: today(),
    customerName: "",
    contact: "",
    source: "Facebook Ads",
    campaign: "",
    productInterest: "Vinyl Banner",
    customerType: "SME",
    buyingSituation: "",
    tags: [] as string[],
    status: "New Lead",
    estimatedValue: "",
    nextFollowUpDate: addDays(today(), 1),
    owner: "Admin",
    note: "",
  };
  const [leadForm, setLeadForm] = useState(emptyLeadForm);

  useEffect(() => {
    let cancelled = false;
    async function loadGa4() {
      try {
        const response = await fetch("/api/marketing/ga4", { cache: "no-store" });
        const data = await response.json();
        if (cancelled) return;
        setGa4({
          loading: false,
          connected: !!data.connected,
          error: data.error || "",
          totals: data.totals || { activeUsers: 0, sessions: 0, pageViews: 0, events: 0 },
          traffic: data.traffic || [],
          topPages: data.topPages || [],
        });
      } catch (error) {
        if (cancelled) return;
        setGa4((prev) => ({
          ...prev,
          loading: false,
          connected: false,
          error: error instanceof Error ? error.message : "GA4 load failed",
        }));
      }
    }
    loadGa4();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadMetaAds() {
      try {
        const response = await fetch("/api/marketing/meta", { cache: "no-store" });
        const data = await response.json();
        if (cancelled) return;
        setMetaAds({
          loading: false,
          connected: !!data.connected,
          error: data.error || "",
          totals: data.totals || { spend: 0, impressions: 0, reach: 0, clicks: 0, cpc: 0, cpm: 0, ctr: 0, leads: 0, cpl: 0 },
          campaigns: data.campaigns || [],
        });
      } catch (error) {
        if (cancelled) return;
        setMetaAds((prev) => ({
          ...prev,
          loading: false,
          connected: false,
          error: error instanceof Error ? error.message : "Meta Ads load failed",
        }));
      }
    }
    loadMetaAds();
    return () => { cancelled = true; };
  }, []);

  const reportDocs = reportingDocuments(documents || []);
  const quoteDocs = (documents || []).filter((doc: any) => doc?.type === "quote" && !doc?.deleted && doc?.status !== "cancelled");
  const quoteCount = quoteDocs.length;
  const revenue = reportDocs.reduce((sum: number, doc: any) => sum + calcDocTotal(doc).total, 0);
  const grossCost = reportDocs.reduce((sum: number, doc: any) => sum + (doc.items || []).reduce((itemSum: number, item: any) => itemSum + lineCost(item), 0), 0);
  const grossProfit = revenue - grossCost;
  const activeCampaigns = campaigns.filter((campaign: any) => campaign.status === "active").length;
  const plannedBudget = campaigns.reduce((sum: number, campaign: any) => sum + Number(campaign.budget || 0), 0);
  const saveCampaigns = (next: any[]) => {
    setCampaigns(next);
    saveLocal("marketing_campaigns", next);
  };
  const resetForm = () => setForm({
    id: "",
    name: "",
    channel: "Facebook Ads",
    objective: "LINE Inquiry",
    budget: "",
    status: "planning",
    startDate: today(),
    endDate: addDays(today(), 14),
    landingPage: "/",
    note: "",
  });
  const saveCampaign = () => {
    if (!String(form.name || "").trim()) return showToast("กรุณาใส่ชื่อแคมเปญ", "error");
    const row = { ...form, id: form.id || genId(), budget: Number(form.budget || 0) };
    const next = form.id ? campaigns.map((campaign: any) => campaign.id === form.id ? row : campaign) : [row, ...campaigns];
    saveCampaigns(next);
    resetForm();
    showToast("บันทึกแคมเปญ Marketing แล้ว");
  };
  const editCampaign = (campaign: any) => setForm({ ...campaign, budget: String(campaign.budget || "") });
  const removeCampaign = (id: string) => {
    saveCampaigns(campaigns.filter((campaign: any) => campaign.id !== id));
    showToast("ลบแคมเปญแล้ว");
  };
  const leadScore = (lead: any) => {
    const tags = lead?.tags || [];
    let score = 0;
    if (tags.includes("Has deadline")) score += 30;
    if (tags.includes("Has size")) score += 20;
    if (tags.includes("Artwork ready")) score += 20;
    if (Number(lead?.estimatedValue || 0) > 0) score += 15;
    if (tags.includes("Needs design help")) score += 10;
    if (tags.includes("Repeat customer")) score += 40;
    if (tags.includes("Asked price first")) score -= 10;
    if (tags.includes("Lowest-price seeker")) score -= 15;
    if (tags.includes("Silent after quote")) score -= 20;
    if (!lead?.customerName || !lead?.contact) score -= 20;
    return Math.max(0, Math.min(100, score));
  };
  const leadTemperature = (score: number) => score >= 70 ? "Hot" : score >= 40 ? "Warm" : "Cold";
  const saveLeads = (next: any[]) => {
    setLeads(next);
    saveLocal("marketing_leads_crm", next);
  };
  const resetLeadForm = () => setLeadForm(emptyLeadForm);
  const toggleLeadTag = (tag: string) => {
    setLeadForm((prev: any) => ({
      ...prev,
      tags: (prev.tags || []).includes(tag) ? prev.tags.filter((t: string) => t !== tag) : [...(prev.tags || []), tag],
    }));
  };
  const saveLead = () => {
    if (!String(leadForm.customerName || "").trim()) return showToast("Please add lead/customer name", "error");
    const row = { ...leadForm, id: leadForm.id || genId(), estimatedValue: Number(leadForm.estimatedValue || 0) };
    const next = leadForm.id ? leads.map((lead: any) => lead.id === leadForm.id ? row : lead) : [row, ...leads];
    saveLeads(next);
    resetLeadForm();
    showToast("Lead / CRM saved");
  };
  const editLead = (lead: any) => setLeadForm({ ...lead, estimatedValue: String(lead.estimatedValue || "") });
  const removeLead = (id: string) => {
    saveLeads(leads.filter((lead: any) => lead.id !== id));
    showToast("Lead deleted");
  };

  const buildUtmUrl = () => {
    try {
      const url = new URL(utm.url.startsWith("http") ? utm.url : `https://displayworksmedia.com${utm.url.startsWith("/") ? utm.url : `/${utm.url}`}`);
      url.searchParams.set("utm_source", utm.source || "direct");
      url.searchParams.set("utm_medium", utm.medium || "marketing");
      url.searchParams.set("utm_campaign", utm.campaign || "campaign");
      if (utm.content) url.searchParams.set("utm_content", utm.content);
      return url.toString();
    } catch {
      return "";
    }
  };
  const utmUrl = buildUtmUrl();
  const trackingItems = [
    { label: "GA4 / Google Analytics", status: "manual", detail: "ใช้เช็ค traffic, page view และ conversion path" },
    { label: "Facebook Pixel", status: "manual", detail: "ใช้เก็บ event จาก Ads เช่น PageView, Lead, Contact" },
    { label: "LINE CTA Click", status: "recommended", detail: "ควร track ปุ่ม LINE ทุกจุดเพื่อดู lead source" },
    { label: "UTM Campaign", status: campaigns.length > 0 ? "ready" : "recommended", detail: "ใช้แยกผลแคมเปญ Facebook, Blog, LINE และโพสต์ต่าง ๆ" },
  ];
  const sourceRows = [
    { source: "LINE Official", intent: "สอบถามราคา / ส่งไฟล์", action: "ใช้เป็น CTA หลัก" },
    { source: "Facebook Ads", intent: "ดึงลูกค้าใหม่", action: "ใส่ UTM ทุกแคมเปญ" },
    { source: "Service Pages", intent: "ลูกค้าค้นหาบริการ", action: "เชื่อมปุ่ม LINE และฟอร์ม" },
    { source: "Blog / Organic", intent: "ให้ความรู้ก่อนตัดสินใจ", action: "ลิงก์ไปหน้าบริการที่เกี่ยวข้อง" },
  ];
  const connectedSources = [
    { name: "ERP Receipts", state: "พร้อมใช้", detail: "ใช้ยอดรายได้จากใบเสร็จจริง" },
    { name: "Campaign Planner", state: "พร้อมใช้", detail: "บันทึกงบและช่วงเวลาแคมเปญ" },
    { name: "GA4", state: ga4.loading ? "Loading" : ga4.connected ? "Connected" : "Error", detail: ga4.connected ? `${ga4.totals.sessions.toLocaleString()} sessions / 30 days` : (ga4.error || "สำหรับ Visitor, Session, Conversion") },
    { name: "Facebook Pixel / Ads", state: metaAds.loading ? "Loading" : metaAds.connected ? "Connected" : "Error", detail: metaAds.connected ? `฿${fmtMoney(metaAds.totals.spend)} spend / ${metaAds.totals.clicks.toLocaleString()} clicks` : (metaAds.error || "สำหรับ Spend, CPL, ROAS") },
    { name: "LINE OA", state: "รอเชื่อมต่อ", detail: "สำหรับจำนวนแชทและ source ของ lead" },
  ];
  const channelRows = [
    { name: "Facebook Ads", leads: metaAds.connected ? metaAds.totals.leads.toLocaleString() : "รอ API", spend: metaAds.connected ? `฿${fmtMoney(metaAds.totals.spend)}` : "รอ API", priority: metaAds.connected ? `CPC ฿${fmtMoney(metaAds.totals.cpc)} / CTR ${metaAds.totals.ctr.toFixed(2)}%` : "ใช้ UTM ทุกแคมเปญ" },
    { name: "LINE OA", leads: "รอเชื่อมต่อ", spend: "-", priority: "CTA หลักของเว็บ" },
    { name: "Organic / SEO", leads: "รอฟอร์ม lead", spend: "0", priority: "ดันหน้าบริการและบทความ" },
    { name: "Direct / Referral", leads: ga4.connected ? `${ga4.totals.sessions.toLocaleString()} sessions` : "รอ GA4", spend: "-", priority: "ตรวจ source จาก UTM" },
  ];
  const marketingFunnelRows = [
    { step: "Reach", value: metaAds.connected ? metaAds.totals.reach.toLocaleString() : "Wait Meta API", rate: "Ad visibility" },
    { step: "Click", value: metaAds.connected ? metaAds.totals.clicks.toLocaleString() : "Wait Meta API", rate: metaAds.connected ? `CTR ${metaAds.totals.ctr.toFixed(2)}%` : "No data" },
    { step: "Landing Page / Profile Visit", value: ga4.connected ? ga4.totals.pageViews.toLocaleString() : "Wait GA4", rate: "Website/Page view" },
    { step: "Message / Lead", value: totalLeads.toLocaleString(), rate: "CRM + Ads" },
    { step: "Qualified Lead", value: qualifiedLeadCount.toLocaleString(), rate: totalLeads ? `${((qualifiedLeadCount / totalLeads) * 100).toFixed(1)}%` : "0%" },
  ];
  const salesFunnelRows = [
    { step: "Lead", value: totalLeads.toLocaleString(), rate: "CRM" },
    { step: "Contacted", value: contactedCount.toLocaleString(), rate: totalLeads ? `${((contactedCount / totalLeads) * 100).toFixed(1)}%` : "0%" },
    { step: "Detail Completed", value: detailCompletedCount.toLocaleString(), rate: totalLeads ? `${((detailCompletedCount / totalLeads) * 100).toFixed(1)}%` : "0%" },
    { step: "Quotation Sent", value: quoteCount.toLocaleString(), rate: "ERP quote" },
    { step: "Follow-up", value: followUpCount.toLocaleString(), rate: "CRM" },
    { step: "Paid / Closed Job", value: closedJobs.toLocaleString(), rate: totalLeads ? `${conversionRate.toFixed(1)}%` : "0%" },
    { step: "Delivered", value: deliveredJobs.toLocaleString(), rate: "Receipt" },
    { step: "Repeat Customer", value: repeatCustomers.toLocaleString(), rate: "Unique customers" },
  ];
  const reportCards = [
    { title: "Monthly Marketing Summary", detail: "สรุปแคมเปญ งบ และรายได้จากใบเสร็จ", status: "พร้อมใช้บางส่วน" },
    { title: "Channel Performance", detail: "เปรียบเทียบ LINE, Ads, Organic, Blog", status: "รอ source tracking" },
    { title: "Content Conversion", detail: "ดูบทความ/หน้าบริการที่พาไปสู่ lead", status: "รอ GA4 event" },
  ];
  const insightCards = [
    "ควรใช้ LINE เป็น CTA หลัก เพราะเป็นช่องทางที่ลูกค้าส่งไฟล์และถามราคาได้เร็ว",
    "ทุกแคมเปญ Ads ควรใช้ UTM เพื่อแยกผลระหว่าง Facebook, LINE และ Blog",
    "หลังต่อ GA4/Pixel แล้วควรวัด Lead ไม่ใช่แค่วัด Traffic",
    "หน้าบริการควรมี CTA เดียวที่ชัด: ปรึกษาทาง LINE หรือขอใบเสนอราคา",
  ];
  const card = (extra = {}) => ({ background: "rgba(20,26,36,0.82)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, ...extra });
  const lightCard = (extra = {}) => ({ background: "linear-gradient(180deg, rgba(20,26,36,0.96), rgba(12,17,26,0.96))", border: "1px solid rgba(255,107,0,0.16)", borderRadius: 18, boxShadow: "0 18px 50px rgba(0,0,0,0.22)", color: "#F8FAFC", ...extra });
  const manualLeadCount = leads.length;
  const apiLeadCount = Number(metaAds.totals.leads || 0);
  const totalLeads = Math.max(manualLeadCount, apiLeadCount, 0);
  const qualifiedLeadCount = leads.filter((lead: any) => leadScore(lead) >= 40 && !["Not Qualified", "Closed Lost", "No Response"].includes(lead.status)).length;
  const contactedCount = leads.filter((lead: any) => ["Contacted", "Waiting for Detail", "Detail Completed", "Quotation Sent", "Follow-up", "Waiting Payment", "Closed Won"].includes(lead.status)).length;
  const detailCompletedCount = leads.filter((lead: any) => ["Detail Completed", "Quotation Sent", "Follow-up", "Waiting Payment", "Closed Won"].includes(lead.status)).length;
  const followUpCount = leads.filter((lead: any) => lead.status === "Follow-up").length;
  const closedJobs = reportDocs.length;
  const deliveredJobs = reportDocs.filter((doc: any) => ["paid", "approved", "completed"].includes(doc.status || "")).length || closedJobs;
  const repeatCustomers = new Set(reportDocs.map((doc: any) => doc.customerName).filter(Boolean)).size;
  const marketingSpend = Number(metaAds.totals.spend || 0);
  const conversionRate = totalLeads > 0 ? (closedJobs / totalLeads) * 100 : 0;
  const roas = marketingSpend > 0 ? revenue / marketingSpend : 0;
  const cpl = totalLeads > 0 ? marketingSpend / totalLeads : 0;
  const cpql = qualifiedLeadCount > 0 ? marketingSpend / qualifiedLeadCount : 0;
  const cac = closedJobs > 0 ? marketingSpend / closedJobs : 0;
  const roi = marketingSpend > 0 ? ((grossProfit - marketingSpend) / marketingSpend) * 100 : 0;
  const channelMix = [
    { name: "Facebook Ads", value: marketingSpend || 1, color: "#1877F2" },
    { name: "LINE OA", value: totalLeads || 1, color: "#06C755" },
    { name: "Organic", value: ga4.totals.sessions || 1, color: "#F59E0B" },
    { name: "Direct", value: Math.max(1, Math.round((ga4.totals.sessions || 0) * 0.25)), color: "#8B5CF6" },
  ];
  const mixTotal = channelMix.reduce((sum, row) => sum + Number(row.value || 0), 0) || 1;
  const campaignTable = [
    ...metaAds.campaigns.map((campaign: any) => ({
      name: campaign.name || "Meta Campaign",
      channel: "Facebook Ads",
      status: "Active",
      spend: campaign.spend || 0,
      leads: campaign.leads || 0,
      cpl: campaign.cpl || 0,
      revenue: 0,
      roas: 0,
    })),
    ...campaigns.map((campaign: any) => ({
      name: campaign.name,
      channel: campaign.channel,
      status: campaign.status,
      spend: Number(campaign.budget || 0),
      leads: campaign.objective === "LINE Inquiry" ? totalLeads : quoteCount,
      cpl: 0,
      revenue: campaigns.length ? revenue / campaigns.length : 0,
      roas: Number(campaign.budget || 0) > 0 ? (campaigns.length ? revenue / campaigns.length : 0) / Number(campaign.budget || 1) : 0,
    })),
  ].slice(0, 7);
  const pill = (bg: string, color: string) => ({ display: "inline-flex", alignItems: "center", borderRadius: 999, background: bg, color, padding: "5px 10px", fontSize: 11, fontWeight: 800 });

  return (
    <div className="marketing-dashboard-shell" style={{ background: "radial-gradient(circle at top right, rgba(255,107,0,0.16), transparent 34%), linear-gradient(180deg,#0B0F19 0%,#070A0D 100%)", color: "#F8FAFC", borderRadius: 24, overflow: "hidden", minHeight: "calc(100vh - 120px)", boxShadow: "0 18px 60px rgba(0,0,0,0.28)", border: "1px solid rgba(255,107,0,0.12)" }}>
      <div className="marketing-shell-grid" style={{ display: "grid", gridTemplateColumns: "250px minmax(0,1fr)" }}>
        <aside className="marketing-sidebar" style={{ background: "rgba(7,10,13,0.92)", borderRight: "1px solid rgba(255,107,0,0.16)", padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 38, borderRadius: 12, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,107,0,0.35)", overflow: "hidden", flexShrink: 0 }}>
              <img src="/images/logo.png" alt="Display Works Media" style={{ width: 42, height: 30, objectFit: "contain", display: "block" }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 950, color: "#F8FAFC", lineHeight: 1.15 }}>Display Works Media</div>
              <div style={{ fontSize: 10, color: "#FF6B00", letterSpacing: 1.3, textTransform: "uppercase" }}>Marketing KPI Dashboard</div>
            </div>
          </div>
          <nav className="marketing-sidebar-nav" style={{ display: "grid", gap: 8 }}>
            {[
              ["Dashboard", "D"], ["Campaigns", "C"], ["Facebook Ads", "F"], ["Leads / CRM", "L"],
              ["Customers", "U"], ["Quotations", "Q"], ["Orders / Jobs", "O"], ["Products", "P"],
              ["Budget", "B"], ["Lead Funnel", "V"], ["Channels", "N"], ["AI Insight", "A"],
              ["Reports", "R"], ["Data Sources", "S"], ["Settings", "G"],
            ].map(([label, icon], index) => (
              <a key={label} href={`#marketing-${String(label).toLowerCase().replace(/\s+/g, "-")}`} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14,
                color: index === 0 ? "#fff" : "#A8B0C0", textDecoration: "none", fontWeight: 800, fontSize: 13,
                background: index === 0 ? "linear-gradient(135deg,#FF6B00,#C2410C)" : "transparent",
                border: index === 0 ? "1px solid rgba(255,107,0,0.48)" : "1px solid transparent",
              }}>
                <span style={{ fontSize: 16 }}>{icon}</span>{label}
              </a>
            ))}
          </nav>
          <div style={{ marginTop: "auto", borderRadius: 18, padding: 18, background: "linear-gradient(180deg,rgba(255,107,0,0.14),rgba(255,107,0,0.04))", border: "1px solid rgba(255,107,0,0.28)" }}>
            <div style={{ fontSize: 26, marginBottom: 8, color: "#FF6B00", fontWeight: 950 }}>KPI</div>
            <div style={{ fontWeight: 900, color: "#F8FAFC" }}>DWM Growth Control</div>
            <p style={{ margin: "8px 0 14px", color: "#A8B0C0", fontSize: 12, lineHeight: 1.6 }}>ติดตามผลแคมเปญ แหล่งที่มาของ lead และยอดจากเอกสารจริงในจุดเดียว</p>
            <button onClick={() => showToast("Marketing dashboard พร้อมใช้งาน")} style={{ width: "100%", border: 0, borderRadius: 12, padding: "10px 12px", color: "#fff", fontWeight: 900, background: "linear-gradient(135deg,#FF6B00,#EA580C)" }}>Check Setup</button>
          </div>
        </aside>

        <main className="marketing-main" style={{ padding: 26 }}>
          <header className="marketing-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 11, color: "#FF6B00", fontWeight: 900, letterSpacing: 2.4, textTransform: "uppercase", marginBottom: 6 }}>MARKETING COMMAND CENTER</div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 950, color: "#F8FAFC" }}>Display Works Media Marketing KPI Dashboard</h1>
              <p style={{ margin: "5px 0 0", color: "#A8B0C0", fontSize: 13 }}>ภาพรวมประสิทธิภาพการตลาดของ Display Works Media</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <select style={{ height: 42, borderRadius: 12, border: "1px solid rgba(255,107,0,0.2)", background: "#101722", color: "#CBD5E1", padding: "0 14px", fontWeight: 700 }}>
                <option>Last 30 days</option><option>This month</option><option>Last 7 days</option>
              </select>
              <button onClick={() => showToast("Export report ยังเป็นขั้นถัดไป")} style={{ height: 42, borderRadius: 12, border: "1px solid rgba(255,107,0,0.2)", background: "#101722", color: "#CBD5E1", padding: "0 14px", fontWeight: 800 }}>Export</button>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#EEF4FF", display: "grid", placeItems: "center", color: "#FF6B00", fontWeight: 900 }}>A</div>
            </div>
          </header>

          <section id="marketing-dashboard" className="marketing-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14, marginBottom: 18 }}>
            {[
              { label: "Campaign Revenue", value: `฿${fmtMoney(revenue)}`, sub: "From receipts only", formula: "Revenue = receipt totals", icon: "฿", color: "#10B981" },
              { label: "Total Leads", value: totalLeads.toLocaleString(), sub: "Manual CRM / Ads", formula: "Total Leads = max(CRM leads, API leads)", icon: "L", color: "#FF6B00" },
              { label: "Lead to Customer Conversion Rate", value: `${conversionRate.toFixed(2)}%`, sub: "Closed Jobs / Total Leads", formula: "Close Rate = Closed Jobs / Total Leads x 100", icon: "%", color: "#8B5CF6" },
              { label: "Closed Jobs", value: closedJobs.toLocaleString(), sub: "Receipts in ERP", formula: "Closed Jobs = valid receipts", icon: "J", color: "#22C55E" },
              { label: "Marketing Spend", value: `฿${fmtMoney(marketingSpend)}`, sub: metaAds.connected ? "Meta Ads" : "Waiting Meta API", formula: "Spend from connected ad source", icon: "S", color: "#EC4899" },
              { label: "Cost per Lead", value: cpl ? `฿${fmtMoney(cpl)}` : "-", sub: "CPL", formula: "CPL = Spend / Leads", icon: "C", color: "#EAB308" },
              { label: "Gross Profit", value: `฿${fmtMoney(grossProfit)}`, sub: "Revenue - Cost", formula: "Gross Profit = Revenue - item cost", icon: "P", color: "#14B8A6" },
              { label: "ROAS", value: roas ? roas.toFixed(2) : "-", sub: "Revenue / Spend", formula: "ROAS = Revenue / Spend", icon: "R", color: "#F97316" },
            ].map((item) => (
              <div key={item.label} title={item.formula || item.sub} style={{ ...lightCard(), padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 16, display: "grid", placeItems: "center", color: "#fff", fontWeight: 900, background: item.color }}>{item.icon}</div>
                  <svg width="54" height="28" viewBox="0 0 54 28" aria-hidden="true"><polyline points="2,22 12,17 22,19 32,10 42,14 52,5" fill="none" stroke={item.color} strokeWidth="2.5" strokeLinecap="round" /></svg>
                </div>
                <div style={{ marginTop: 12, color: "#A8B0C0", fontSize: 12, fontWeight: 800 }}>{item.label}</div>
                <div style={{ marginTop: 5, color: "#F8FAFC", fontSize: 24, fontWeight: 950 }}>{item.value}</div>
                <div style={{ marginTop: 6, color: "#7A8599", fontSize: 11 }}>{item.sub}</div>
              </div>
            ))}
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 16, marginBottom: 18 }}>
            <div style={{ ...lightCard(), padding: 20 }}>
              <h2 style={{ margin: 0, color: "#F8FAFC", fontSize: 17 }}>Revenue & Spend Trend</h2>
              <p style={{ margin: "4px 0 0", color: "#7A8599", fontSize: 12 }}>Daily overview</p>
              <svg viewBox="0 0 640 250" style={{ width: "100%", height: 250 }}>
                {[40,90,140,190,240].map((y) => <line key={y} x1="0" y1={y} x2="640" y2={y} stroke="rgba(255,255,255,0.08)" />)}
                <polyline points="0,210 70,180 140,105 210,150 280,80 350,175 420,120 490,155 560,70 640,112" fill="none" stroke="#FF6B00" strokeWidth="4" strokeLinecap="round" />
                <polyline points="0,225 70,210 140,195 210,170 280,180 350,145 420,160 490,125 560,135 640,100" fill="none" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ ...lightCard(), padding: 20 }}>
              <h2 style={{ margin: 0, color: "#F8FAFC", fontSize: 17 }}>Performance Overview</h2>
              <p style={{ margin: "4px 0 16px", color: "#7A8599", fontSize: 12 }}>Channel mix</p>
              <div style={{ display: "grid", gridTemplateColumns: "190px 1fr", gap: 22, alignItems: "center" }}>
                <div style={{ width: 184, height: 184, borderRadius: "50%", background: "conic-gradient(#1877F2 0 42%, #06C755 42% 58%, #F59E0B 58% 82%, #8B5CF6 82% 100%)", display: "grid", placeItems: "center" }}>
                  <div style={{ width: 108, height: 108, borderRadius: "50%", background: "#101722", display: "grid", placeItems: "center", textAlign: "center" }}>
                    <strong style={{ color: "#F8FAFC", fontSize: 19 }}>฿{fmtMoney(revenue)}</strong><span style={{ color: "#7A8599", fontSize: 11 }}>Revenue</span>
                  </div>
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {channelMix.map((row) => (
                    <div key={row.name} style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#CBD5E1", fontSize: 13 }}>
                      <span><i style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: row.color, marginRight: 8 }} />{row.name}</span>
                      <strong>{Math.round((Number(row.value || 0) / mixTotal) * 100)}%</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="marketing-campaigns" style={{ ...lightCard(), padding: 20, marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={{ margin: 0, color: "#F8FAFC", fontSize: 17 }}>Campaign Performance</h2>
              <span style={pill("#ECFDF3", "#039855")}>{campaignTable.length} campaigns</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr style={{ color: "#A8B0C0", textAlign: "left" }}>{["Campaign","Channel","Status","Spend","Leads","CPL","Revenue","ROAS"].map((h) => <th key={h} style={{ padding: "12px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{h}</th>)}</tr></thead>
                <tbody>{campaignTable.map((row: any, index: number) => (
                  <tr key={`${row.name}-${index}`} style={{ color: "#CBD5E1" }}>
                    <td style={{ padding: "13px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)", fontWeight: 800, color: "#F8FAFC" }}>{row.name}</td>
                    <td style={{ padding: "13px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{row.channel}</td>
                    <td style={{ padding: "13px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}><span style={pill(row.status === "Active" || row.status === "active" ? "#ECFDF3" : "#FFF7ED", row.status === "Active" || row.status === "active" ? "#039855" : "#F97316")}>{row.status}</span></td>
                    <td style={{ padding: "13px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>฿{fmtMoney(row.spend)}</td>
                    <td style={{ padding: "13px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{Number(row.leads || 0).toLocaleString()}</td>
                    <td style={{ padding: "13px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{row.cpl ? `฿${fmtMoney(row.cpl)}` : "-"}</td>
                    <td style={{ padding: "13px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>฿{fmtMoney(row.revenue)}</td>
                    <td style={{ padding: "13px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)", color: row.roas >= 1 ? "#039855" : "#D92D20", fontWeight: 900 }}>{row.roas ? row.roas.toFixed(2) : "-"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>

          <section id="marketing-lead-funnel" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
            <div style={{ ...lightCard(), padding: 20 }}>
              <h2 style={{ margin: "0 0 6px", color: "#F8FAFC", fontSize: 17 }}>Marketing Funnel</h2>
              <p style={{ margin: "0 0 14px", color: "#7A8599", fontSize: 12 }}>Reach &rarr; Click &rarr; Visit &rarr; Lead &rarr; Qualified Lead</p>
              <div style={{ display: "grid", gap: 8 }}>
                {marketingFunnelRows.map((row, index) => (
                  <div key={row.step} style={{ display: "grid", gridTemplateColumns: "1fr 110px 90px", gap: 10, alignItems: "center", padding: "10px 12px", borderRadius: 10, background: `rgba(255,107,0,${0.14 - index * 0.015})`, border: "1px solid rgba(255,107,0,0.12)" }}>
                    <strong>{row.step}</strong>
                    <span style={{ color: "#F8FAFC", textAlign: "right", fontWeight: 900 }}>{row.value}</span>
                    <span style={{ color: "#FF6B00", textAlign: "right", fontSize: 12, fontWeight: 800 }}>{row.rate}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...lightCard(), padding: 20 }}>
              <h2 style={{ margin: "0 0 6px", color: "#F8FAFC", fontSize: 17 }}>Sales Funnel</h2>
              <p style={{ margin: "0 0 14px", color: "#7A8599", fontSize: 12 }}>Lead &rarr; Quote &rarr; Paid / Closed Job &rarr; Delivered</p>
              <div style={{ display: "grid", gap: 8 }}>
                {salesFunnelRows.map((row, index) => (
                  <div key={row.step} style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px", gap: 10, alignItems: "center", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <strong>{row.step}</strong>
                    <span style={{ color: "#F8FAFC", textAlign: "right", fontWeight: 900 }}>{row.value}</span>
                    <span style={{ color: index >= 5 ? "#22C55E" : "#FF6B00", textAlign: "right", fontSize: 12, fontWeight: 800 }}>{row.rate}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="marketing-crm" style={{ ...lightCard(), padding: 20, marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
              <div>
                <h2 style={{ margin: 0, color: "#F8FAFC", fontSize: 17 }}>Leads / CRM</h2>
                <p style={{ margin: "4px 0 0", color: "#7A8599", fontSize: 12 }}>Manual lead capture for chat, LINE, Facebook, and organic inquiries.</p>
              </div>
              <span style={pill("rgba(255,107,0,0.14)", "#FF6B00")}>{leads.length} leads</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 16 }}>
              <div style={{ display: "grid", gap: 10 }}>
                <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Field label="Date"><input type="date" value={leadForm.date} onChange={(e) => setLeadForm({ ...leadForm, date: e.target.value })} /></Field>
                  <Field label="Lead / Customer"><input value={leadForm.customerName} onChange={(e) => setLeadForm({ ...leadForm, customerName: e.target.value })} placeholder="Customer name" /></Field>
                  <Field label="Contact"><input value={leadForm.contact} onChange={(e) => setLeadForm({ ...leadForm, contact: e.target.value })} placeholder="Phone / LINE / Facebook" /></Field>
                  <Field label="Source"><select value={leadForm.source} onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}><option>Facebook Ads</option><option>LINE OA</option><option>Organic / Blog</option><option>Referral</option><option>Direct</option></select></Field>
                  <Field label="Product"><input value={leadForm.productInterest} onChange={(e) => setLeadForm({ ...leadForm, productInterest: e.target.value })} placeholder="Vinyl / Sticker / Backdrop" /></Field>
                  <Field label="Customer Type"><input value={leadForm.customerType} onChange={(e) => setLeadForm({ ...leadForm, customerType: e.target.value })} placeholder="Restaurant / SME / Event" /></Field>
                  <Field label="Buying Situation"><input value={leadForm.buyingSituation} onChange={(e) => setLeadForm({ ...leadForm, buyingSituation: e.target.value })} placeholder="Urgent, has design, new store..." /></Field>
                  <Field label="Lead Status"><select value={leadForm.status} onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value })}>{leadStatuses.map((status) => <option key={status}>{status}</option>)}</select></Field>
                  <Field label="Estimated Value"><input type="number" value={leadForm.estimatedValue} onChange={(e) => setLeadForm({ ...leadForm, estimatedValue: e.target.value })} placeholder="0" /></Field>
                  <Field label="Follow-up"><input type="date" value={leadForm.nextFollowUpDate} onChange={(e) => setLeadForm({ ...leadForm, nextFollowUpDate: e.target.value })} /></Field>
                </div>
                <Field label="Behavior Tags">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {behaviorTagOptions.map((tag) => {
                      const active = (leadForm.tags || []).includes(tag);
                      return <button key={tag} type="button" onClick={() => toggleLeadTag(tag)} style={{ border: `1px solid ${active ? "#FF6B00" : "rgba(255,255,255,0.1)"}`, background: active ? "rgba(255,107,0,0.16)" : "rgba(255,255,255,0.035)", color: active ? "#FF6B00" : "#A8B0C0", borderRadius: 999, padding: "7px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>{tag}</button>;
                    })}
                  </div>
                </Field>
                <Field label="Note"><textarea rows={2} value={leadForm.note} onChange={(e) => setLeadForm({ ...leadForm, note: e.target.value })} placeholder="Job details, risk, next action" /></Field>
                <div style={{ display: "flex", gap: 10 }}>
                  <Btn onClick={saveLead} color="#FF6B00" style={{ flex: 1 }}>{leadForm.id ? "Update Lead" : "Add Lead"}</Btn>
                  <Btn onClick={resetLeadForm} outline style={{ flex: 1 }}>Clear</Btn>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ color: "#A8B0C0", textAlign: "left" }}>{["Lead","Source","Product","Status","Score","Temp","Follow-up","Action"].map((h) => <th key={h} style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{h}</th>)}</tr></thead>
                  <tbody>{leads.map((lead: any) => {
                    const score = leadScore(lead);
                    const temp = leadTemperature(score);
                    return (
                      <tr key={lead.id} style={{ color: "#CBD5E1" }}>
                        <td style={{ padding: "11px 8px", borderBottom: "1px solid rgba(255,255,255,0.07)", fontWeight: 900, color: "#F8FAFC" }}>{lead.customerName}<div style={{ color: "#7A8599", fontSize: 11, fontWeight: 500 }}>{lead.contact}</div></td>
                        <td style={{ padding: "11px 8px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{lead.source}</td>
                        <td style={{ padding: "11px 8px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{lead.productInterest}</td>
                        <td style={{ padding: "11px 8px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{lead.status}</td>
                        <td style={{ padding: "11px 8px", borderBottom: "1px solid rgba(255,255,255,0.07)", color: score >= 70 ? "#22C55E" : score >= 40 ? "#F59E0B" : "#EF4444", fontWeight: 950 }}>{score}</td>
                        <td style={{ padding: "11px 8px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}><span style={pill(temp === "Hot" ? "rgba(34,197,94,0.14)" : temp === "Warm" ? "rgba(245,158,11,0.14)" : "rgba(239,68,68,0.14)", temp === "Hot" ? "#22C55E" : temp === "Warm" ? "#F59E0B" : "#EF4444")}>{temp}</span></td>
                        <td style={{ padding: "11px 8px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{fmtDate(lead.nextFollowUpDate)}</td>
                        <td style={{ padding: "11px 8px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}><button onClick={() => editLead(lead)} style={{ marginRight: 6, color: "#FF6B00", background: "transparent", border: 0, cursor: "pointer", fontWeight: 900 }}>Edit</button><button onClick={() => removeLead(lead.id)} style={{ color: "#EF4444", background: "transparent", border: 0, cursor: "pointer", fontWeight: 900 }}>Delete</button></td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            </div>
          </section>

          <section id="marketing-channels" style={{ ...lightCard(), padding: 20, marginBottom: 18 }}>
            <h2 style={{ margin: "0 0 16px", color: "#F8FAFC", fontSize: 17 }}>Channel Performance Comparison</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12 }}>
              {channelRows.map((row: any) => (
                <div key={row.name} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 15 }}>
                  <div style={{ fontWeight: 950, color: "#F8FAFC", marginBottom: 10 }}>{row.name}</div>
                  <div style={{ color: "#A8B0C0", fontSize: 12, lineHeight: 1.8 }}>Leads <strong style={{ color: "#F8FAFC" }}>{row.leads}</strong><br />Spend <strong style={{ color: "#F8FAFC" }}>{row.spend}</strong><br /><span style={{ color: "#FF6B00" }}>{row.priority}</span></div>
                  <svg width="100%" height="32" viewBox="0 0 110 32" aria-hidden="true"><polyline points="0,26 16,18 32,22 48,10 64,14 80,8 110,16" fill="none" stroke="#FF6B00" strokeWidth="2.5" strokeLinecap="round" /></svg>
                </div>
              ))}
            </div>
          </section>

          <section id="marketing-ai-insight" style={{ ...lightCard({ background: "linear-gradient(90deg,rgba(255,107,0,0.12),rgba(20,26,36,0.96))" }), padding: 20, marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12 }}>
              <div style={{ width: 64, height: 64, borderRadius: 24, display: "grid", placeItems: "center", background: "rgba(255,107,0,0.12)", color: "#FF6B00", fontSize: 32 }}>AI</div>
              <div><h2 style={{ margin: 0, color: "#F8FAFC", fontSize: 19 }}>Insight</h2><p style={{ margin: "4px 0 0", color: "#A8B0C0" }}>สรุปการวิเคราะห์และข้อแนะนำจากข้อมูลที่เชื่อมต่อ</p></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12 }}>
              {[
                "LINE ยังควรเป็น CTA หลัก เพราะเหมาะกับการส่งไฟล์และถามราคา",
                metaAds.connected ? "Meta Ads พร้อมอ่าน Spend/CPC/CTR แล้ว" : "Meta Ads ยังรอ Token ใน Vercel",
                ga4.connected ? "GA4 พร้อมอ่าน Visitor และ Top Pages แล้ว" : "GA4 ยังรอ Env หรือ Redeploy",
                "ควรเก็บ UTM ทุกแคมเปญเพื่อแยกแหล่งที่มาของ Lead",
              ].map((text) => <div key={text} style={{ borderRadius: 16, padding: 14, background: "#101722", border: "1px solid rgba(255,255,255,0.08)", color: "#CBD5E1", fontSize: 12, lineHeight: 1.65 }}>{text}</div>)}
            </div>
          </section>

          <section id="marketing-data-sources" style={{ ...lightCard(), padding: 20 }}>
            <h2 style={{ margin: "0 0 16px", color: "#F8FAFC", fontSize: 17 }}>Data Sources</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
              {connectedSources.map((source: any) => (
                <div key={source.name} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 15 }}>
                  <strong style={{ color: "#F8FAFC" }}>{source.name}</strong>
                  <div style={{ marginTop: 8, color: "#A8B0C0", fontSize: 12, lineHeight: 1.6 }}>{source.detail}</div>
                  <div style={{ marginTop: 12 }}><span style={pill(source.state === "Connected" || source.state === "พร้อมใช้" ? "#ECFDF3" : source.state === "Error" ? "#FEF3F2" : "#FFF7ED", source.state === "Connected" || source.state === "พร้อมใช้" ? "#039855" : source.state === "Error" ? "#D92D20" : "#F97316")}>{source.state}</span></div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

// ─── ERP COMPONENTS ───────────────────────────────────────────────────────────
// SIDEBAR
// ============================================================
function ErpSidebar({ page, setPage, docCounts }: any) {
  const navItems = [
    { id: "dashboard", icon: "⊞", label: "ภาพรวม" },
    { id: "customers", icon: "👥", label: "ลูกค้า" },
    { id: "products", icon: "📦", label: "สินค้า/บริการ" },
    { id: "suppliers", icon: "🏭", label: "Supplier" },
    null,
    { id: "quote", icon: "📋", label: "ใบเสนอราคา", count: docCounts.quote, color: DOC_TYPES.quote.color },
    { id: "bill", icon: "📄", label: "ใบวางบิล", count: docCounts.bill, color: DOC_TYPES.bill.color },
    { id: "invoice", icon: "🧾", label: "ใบแจ้งหนี้", count: docCounts.invoice, color: DOC_TYPES.invoice.color },
    { id: "receipt", icon: "✅", label: "ใบเสร็จรับเงิน", count: docCounts.receipt, color: DOC_TYPES.receipt.color },
    null,
    { id: "company", icon: "🏢", label: "ข้อมูลบริษัท" },
  ];
  return (
    <div style={{ width: 220, background: "#0d1120", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#FF6B00" }}>Display Works</div>
        <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>ระบบจัดการเอกสารขาย</div>
      </div>
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map((item, i) =>
          item === null ? (
            <div key={i} style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 6px" }} />
          ) : (
            <button key={item.id} onClick={() => setPage(item.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
              borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
              background: page === item.id ? "rgba(255,107,0,0.15)" : "transparent",
              color: page === item.id ? "#FF6B00" : "#A8B0C0", fontFamily: "inherit",
              borderLeft: page === item.id ? "2px solid #FF6B00" : "2px solid transparent",
              width: "100%", textAlign: "left",
            }}>
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.count > 0 && (
                <span style={{ background: item.color + "33", color: item.color, fontSize: 10, padding: "1px 7px", borderRadius: 99, fontWeight: 600 }}>
                  {item.count}
                </span>
              )}
            </button>
          )
        )}
      </nav>
    </div>
  );
}

// ============================================================
// DASHBOARD — เพิ่มกำไร/ขาดทุน
// ============================================================
function Dashboard({ documents, customers, products, totalRevenue, totalCost, totalProfit, docCounts, setPage }: any) {
  const [chartRange, setChartRange] = useState<"7d"|"30d"|"12m">("30d");
  const localDateInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const [dateFilterMode, setDateFilterMode] = useState<"quick"|"day"|"month"|"year">("quick");
  const [dateFilter, setDateFilter] = useState(() => {
    const initial = new Date();
    const inputDate = localDateInput(initial);
    return {
      day: inputDate,
      month: inputDate.slice(0, 7),
      year: String(initial.getFullYear()),
    };
  });

  // ─── คำนวณข้อมูลหลัก ───────────────────────────────────────────
  const now = new Date();
  const reportDocs = reportingDocuments(documents);

  const calcRev = (docs: any[]) => docs.reduce((s: number, d: any) => s + calcDocTotal(d).total, 0);
  const itemCost = (item: any) => fallbackItemCost(products, item);
  const calcCost = (docs: any[]) => docs.reduce((s: number, d: any) =>
    s + d.items.reduce((ss: number, i: any) => ss + lineCost(i, itemCost(i)), 0), 0);
  const dayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const selectedRange = (() => {
    const end = dayStart(now) + 24 * 60 * 60 * 1000;
    if (dateFilterMode === "day") {
      const selected = dateFilter.day ? new Date(`${dateFilter.day}T00:00:00`) : now;
      const start = dayStart(selected);
      return { start, end: start + 24 * 60 * 60 * 1000, prevStart: start - 24 * 60 * 60 * 1000, prevEnd: start };
    }
    if (dateFilterMode === "month") {
      const [year, month] = (dateFilter.month || localDateInput(now).slice(0, 7)).split("-").map(Number);
      const start = new Date(year, month - 1, 1).getTime();
      const rangeEnd = new Date(year, month, 1).getTime();
      return { start, end: rangeEnd, prevStart: new Date(year, month - 2, 1).getTime(), prevEnd: start };
    }
    if (dateFilterMode === "year") {
      const year = Number(dateFilter.year || now.getFullYear());
      const start = new Date(year, 0, 1).getTime();
      const rangeEnd = new Date(year + 1, 0, 1).getTime();
      return { start, end: rangeEnd, prevStart: new Date(year - 1, 0, 1).getTime(), prevEnd: start };
    }
    if (chartRange === "7d") {
      const start = dayStart(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
      return { start, end, prevStart: start - 7 * 24 * 60 * 60 * 1000, prevEnd: start };
    }
    if (chartRange === "12m") {
      const start = new Date(now.getFullYear(), now.getMonth() - 11, 1).getTime();
      return { start, end, prevStart: new Date(now.getFullYear(), now.getMonth() - 23, 1).getTime(), prevEnd: start };
    }
    const start = dayStart(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29));
    return { start, end, prevStart: start - 30 * 24 * 60 * 60 * 1000, prevEnd: start };
  })();
  const docsInRange = (start: number, end: number) =>
    reportDocs.filter((d: any) => {
      const t = new Date(d.date).getTime();
      return Number.isFinite(t) && t >= start && t < end;
    });

  const thisMonthDocs = docsInRange(selectedRange.start, selectedRange.end);
  const lastMonthDocs = docsInRange(selectedRange.prevStart, selectedRange.prevEnd);

  const revThisMonth  = calcRev(thisMonthDocs);
  const revLastMonth  = calcRev(lastMonthDocs);
  const costThisMonth = calcCost(thisMonthDocs);
  const profitThis    = revThisMonth - costThisMonth;
  const marginThis    = revThisMonth > 0 ? (profitThis / revThisMonth) * 100 : 0;
  const revChange     = revLastMonth > 0 ? ((revThisMonth - revLastMonth) / revLastMonth) * 100 : null;
  const profitMarginAll = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0";
  const profitMarginPct = Math.max(0, Math.min(100, Number(profitMarginAll)));

  // ─── Pending & alerts ─────────────────────────────────────────
  const pendingDocs = documents.filter((d: any) => ["draft","sent"].includes(d.status));
  const overdueCount = pendingDocs.filter((d: any) => {
    const due = new Date(d.dueDate || d.date);
    due.setDate(due.getDate() + 30);
    return due < now;
  }).length;

  // ─── Top Products by profit ───────────────────────────────────
  const productProfit: Record<string, { revenue: number; cost: number }> = {};
  reportDocs.forEach((d: any) => {
    d.items.forEach((i: any) => {
      if (!productProfit[i.name]) productProfit[i.name] = { revenue: 0, cost: 0 };
      productProfit[i.name].revenue += lineAmount(i);
      productProfit[i.name].cost    += lineCost(i, itemCost(i));
    });
  });
  const topProducts = Object.entries(productProfit)
    .map(([name, { revenue, cost }]) => ({ name, profit: revenue - cost, margin: revenue > 0 ? ((revenue-cost)/revenue)*100 : 0 }))
    .sort((a, b) => b.profit - a.profit).slice(0, 5);

  // ─── Chart data ────────────────────────────────────────────────
  const chartData = (() => {
    const points: { label: string; rev: number; cost: number; profit: number }[] = [];
    if (dateFilterMode === "day") {
      const selected = dateFilter.day ? new Date(`${dateFilter.day}T00:00:00`) : now;
      const ds = localDateInput(selected);
      const dayDocs = reportDocs.filter((x: any) => x.date === ds);
      points.push({ label: selected.toLocaleDateString("th-TH",{day:"numeric",month:"short"}), rev: calcRev(dayDocs), cost: calcCost(dayDocs), profit: calcRev(dayDocs)-calcCost(dayDocs) });
    } else if (dateFilterMode === "month") {
      const [year, month] = (dateFilter.month || localDateInput(now).slice(0, 7)).split("-").map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month - 1, day);
        const ds = localDateInput(d);
        const dayDocs = reportDocs.filter((x: any) => x.date === ds);
        points.push({ label: day % 5 === 1 || day === daysInMonth ? d.toLocaleDateString("th-TH",{day:"numeric"}) : "", rev: calcRev(dayDocs), cost: calcCost(dayDocs), profit: calcRev(dayDocs)-calcCost(dayDocs) });
      }
    } else if (dateFilterMode === "year") {
      const year = Number(dateFilter.year || now.getFullYear());
      for (let month = 0; month < 12; month++) {
        const d = new Date(year, month, 1);
        const start = d.getTime();
        const end = new Date(year, month + 1, 1).getTime();
        const mDocs = reportDocs.filter((x: any) => { const t = new Date(x.date).getTime(); return t >= start && t < end; });
        points.push({ label: d.toLocaleDateString("th-TH",{month:"short"}), rev: calcRev(mDocs), cost: calcCost(mDocs), profit: calcRev(mDocs)-calcCost(mDocs) });
      }
    } else if (chartRange === "7d") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const ds = localDateInput(d);
        const dayDocs = reportDocs.filter((x: any) => x.date === ds);
        points.push({ label: d.toLocaleDateString("th-TH",{weekday:"short"}), rev: calcRev(dayDocs), cost: calcCost(dayDocs), profit: calcRev(dayDocs)-calcCost(dayDocs) });
      }
    } else if (chartRange === "30d") {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const ds = localDateInput(d);
        const dayDocs = reportDocs.filter((x: any) => x.date === ds);
        points.push({ label: i % 5 === 0 ? d.toLocaleDateString("th-TH",{day:"numeric",month:"short"}) : "", rev: calcRev(dayDocs), cost: calcCost(dayDocs), profit: calcRev(dayDocs)-calcCost(dayDocs) });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
        const start = d.getTime();
        const end   = new Date(d.getFullYear(), d.getMonth()+1, 1).getTime();
        const mDocs = reportDocs.filter((x: any) => { const t = new Date(x.date).getTime(); return t >= start && t < end; });
        points.push({ label: d.toLocaleDateString("th-TH",{month:"short"}), rev: calcRev(mDocs), cost: calcCost(mDocs), profit: calcRev(mDocs)-calcCost(mDocs) });
      }
    }
    return points;
  })();

  const maxVal = Math.max(...chartData.map(p => Math.max(p.rev, p.cost, 1)));
  const recentDocs = [...documents].sort((a: any, b: any) => b.createdAt - a.createdAt).slice(0, 5);

  // ─── Alerts ───────────────────────────────────────────────────
  const alerts: { type: "warn"|"error"|"info"; text: string }[] = [];
  if (overdueCount > 0) alerts.push({ type: "error", text: `มีเอกสารค้างชำระเกินกำหนด ${overdueCount} รายการ` });
  if (revChange !== null && revChange < -10) alerts.push({ type: "warn", text: `ยอดขายเดือนนี้ลดลง ${Math.abs(revChange).toFixed(1)}% จากเดือนก่อน` });
  if (+profitMarginAll < 20 && totalRevenue > 0) alerts.push({ type: "warn", text: `Margin รวม ${profitMarginAll}% ต่ำกว่าเกณฑ์ (20%)` });
  if (pendingDocs.length > 5) alerts.push({ type: "info", text: `มีเอกสารรอดำเนินการ ${pendingDocs.length} รายการ` });

  // ─── Styles ───────────────────────────────────────────────────
  const card = (extra = {}) => ({ background: "rgba(20,26,36,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, ...extra });
  const fmtB = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(2)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}K` : fmtMoney(n);
  const filterInputStyle = {
    width: 128,
    minHeight: 34,
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(11,15,25,0.75)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "inherit",
    outline: "none",
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease", maxWidth: 1100, margin: "0 auto" }}>

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="erp-dashboard-header" style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, color: "#FF6B00", textTransform: "uppercase", marginBottom: 6 }}>BUSINESS COMMAND CENTER</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2 }}>ภาพรวมธุรกิจ</h1>
          <p style={{ fontSize: 13, color: "#4B5563", marginTop: 4 }}>
            {now.toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="erp-date-controls" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {[{k:"7d",l:"7 วัน"},{k:"30d",l:"30 วัน"},{k:"12m",l:"12 เดือน"}].map(({k,l}) => (
            <button key={k} onClick={() => { setChartRange(k as any); setDateFilterMode("quick"); }} style={{
              padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
              background: dateFilterMode === "quick" && chartRange === k ? "#FF6B00" : "transparent",
              color: dateFilterMode === "quick" && chartRange === k ? "#fff" : "#6B7280", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
            }}>{l}</button>
          ))}
          <input
            aria-label="เลือกวัน"
            type="date"
            value={dateFilter.day}
            onFocus={() => setDateFilterMode("day")}
            onChange={(e) => { setDateFilterMode("day"); setDateFilter((prev) => ({ ...prev, day: e.target.value })); }}
            style={{ ...filterInputStyle, borderColor: dateFilterMode === "day" ? "#FF6B00" : "rgba(255,255,255,0.08)" }}
          />
          <input
            aria-label="เลือกเดือน"
            type="month"
            value={dateFilter.month}
            onFocus={() => setDateFilterMode("month")}
            onChange={(e) => { setDateFilterMode("month"); setDateFilter((prev) => ({ ...prev, month: e.target.value })); }}
            style={{ ...filterInputStyle, borderColor: dateFilterMode === "month" ? "#FF6B00" : "rgba(255,255,255,0.08)" }}
          />
          <input
            aria-label="เลือกปี"
            type="number"
            min="2000"
            max="2100"
            value={dateFilter.year}
            onFocus={() => setDateFilterMode("year")}
            onChange={(e) => { setDateFilterMode("year"); setDateFilter((prev) => ({ ...prev, year: e.target.value })); }}
            style={{ ...filterInputStyle, width: 88, borderColor: dateFilterMode === "year" ? "#FF6B00" : "rgba(255,255,255,0.08)" }}
          />
        </div>
      </div>

      {/* ── HERO KPI ─────────────────────────────────────────────── */}
      <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {/* Revenue */}
        <div style={{ ...card(), padding: "22px 24px", borderTop: "2px solid #10B981", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -10, top: -10, fontSize: 56, opacity: 0.04 }}>฿</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#10B981", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>REVENUE / เดือนนี้</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1 }}>฿{fmtB(revThisMonth)}</div>
          {revChange !== null && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10, fontSize: 12 }}>
              <span style={{ color: revChange >= 0 ? "#10B981" : "#EF4444", fontWeight: 700 }}>{revChange >= 0 ? "▲" : "▼"} {Math.abs(revChange).toFixed(1)}%</span>
              <span style={{ color: "#4B5563" }}>vs เดือนก่อน</span>
            </div>
          )}
        </div>

        {/* Net Profit */}
        <div style={{ ...card(), padding: "22px 24px", borderTop: `2px solid ${profitThis >= 0 ? "#10B981" : "#EF4444"}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -10, top: -10, fontSize: 56, opacity: 0.04 }}>P</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: profitThis >= 0 ? "#10B981" : "#EF4444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>NET PROFIT</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: profitThis >= 0 ? "#10B981" : "#EF4444", lineHeight: 1 }}>฿{fmtB(profitThis)}</div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#4B5563" }}>Margin เดือนนี้ <span style={{ color: "#fff", fontWeight: 700 }}>{marginThis.toFixed(1)}%</span></div>
        </div>

        {/* Expense */}
        <div style={{ ...card(), padding: "22px 24px", borderTop: "2px solid #EF4444", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -10, top: -10, fontSize: 56, opacity: 0.04 }}>E</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#EF4444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>EXPENSE / ต้นทุน</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1 }}>฿{fmtB(costThisMonth)}</div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#4B5563" }}>รวมทั้งหมด <span style={{ color: "#EF4444", fontWeight: 700 }}>฿{fmtB(totalCost)}</span></div>
        </div>

        {/* Margin All-time */}
        <div style={{ ...card(), padding: "22px 24px", borderTop: "2px solid #F59E0B", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -10, top: -10, fontSize: 56, opacity: 0.04 }}>%</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#F59E0B", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>PROFIT MARGIN</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#F59E0B", lineHeight: 1 }}>{profitMarginAll}%</div>
          <div style={{ marginTop: 10 }}>
            <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(+profitMarginAll, 100)}%`, background: "linear-gradient(90deg,#F59E0B,#FBBF24)", borderRadius: 99, transition: "width 0.6s ease" }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── CHART + ALERTS ────────────────────────────────────────── */}
      <div className="chart-panel" style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14, marginBottom: 20 }}>

        {/* Revenue Chart */}
        <div style={{ ...card(), padding: "22px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Revenue vs Expense vs Profit</div>
              <div style={{ fontSize: 11, color: "#4B5563", marginTop: 2 }}>ยอดขาย · ต้นทุน · กำไร</div>
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
              {[{c:"#10B981",l:"Revenue"},{c:"#EF4444",l:"Expense"},{c:"#3B82F6",l:"Profit"}].map(({c,l}) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 99, background: c }} />
                  <span style={{ color: "#6B7280" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar Chart */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: chartRange === "30d" ? 2 : 6, height: 160, paddingBottom: 24, position: "relative" }}>
            {/* Y-axis lines */}
            {[0,25,50,75,100].map(p => (
              <div key={p} style={{ position: "absolute", left: 0, right: 0, bottom: 24 + (p/100)*(160-24), borderTop: "1px dashed rgba(255,255,255,0.04)", fontSize: 9, color: "#4B5563" }}>
                {p > 0 && <span style={{ position: "absolute", right: "100%", paddingRight: 4 }}>฿{fmtB(maxVal * p/100)}</span>}
              </div>
            ))}
            {chartData.map((pt, i) => (
              <div key={i} style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 1, position: "relative" }}>
                <div title={`Revenue: ฿${fmtMoney(pt.rev)}`} style={{ flex: 1, height: `${maxVal > 0 ? (pt.rev/maxVal)*100 : 0}%`, background: "rgba(16,185,129,0.7)", borderRadius: "3px 3px 0 0", minHeight: pt.rev > 0 ? 2 : 0, transition: "height 0.4s ease", cursor: "pointer" }}
                  onMouseEnter={e => { (e.currentTarget as any).style.background = "#10B981"; }}
                  onMouseLeave={e => { (e.currentTarget as any).style.background = "rgba(16,185,129,0.7)"; }} />
                <div title={`Expense: ฿${fmtMoney(pt.cost)}`} style={{ flex: 1, height: `${maxVal > 0 ? (pt.cost/maxVal)*100 : 0}%`, background: "rgba(239,68,68,0.6)", borderRadius: "3px 3px 0 0", minHeight: pt.cost > 0 ? 2 : 0, transition: "height 0.4s ease", cursor: "pointer" }}
                  onMouseEnter={e => { (e.currentTarget as any).style.background = "#EF4444"; }}
                  onMouseLeave={e => { (e.currentTarget as any).style.background = "rgba(239,68,68,0.6)"; }} />
                <div title={`Profit: ฿${fmtMoney(pt.profit)}`} style={{ flex: 1, height: `${maxVal > 0 ? (Math.max(pt.profit,0)/maxVal)*100 : 0}%`, background: "rgba(59,130,246,0.7)", borderRadius: "3px 3px 0 0", minHeight: pt.profit > 0 ? 2 : 0, transition: "height 0.4s ease", cursor: "pointer" }}
                  onMouseEnter={e => { (e.currentTarget as any).style.background = "#3B82F6"; }}
                  onMouseLeave={e => { (e.currentTarget as any).style.background = "rgba(59,130,246,0.7)"; }} />
                {pt.label && (
                  <div style={{ position: "absolute", bottom: -18, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: "#4B5563", whiteSpace: "nowrap" }}>{pt.label}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Alerts Panel */}
        <div style={{ ...card(), padding: "22px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>⚡ Business Alerts</div>
          {alerts.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <div style={{ fontSize: 32 }}>✅</div>
              <div style={{ fontSize: 12, color: "#4B5563", textAlign: "center" }}>ธุรกิจดำเนินไปปกติ ไม่มีสัญญาณเตือน</div>
            </div>
          ) : (
            alerts.map((a, i) => (
              <div key={i} style={{
                padding: "10px 12px", borderRadius: 10, fontSize: 12, lineHeight: 1.5,
                background: a.type === "error" ? "rgba(239,68,68,0.08)" : a.type === "warn" ? "rgba(245,158,11,0.08)" : "rgba(59,130,246,0.08)",
                border: `1px solid ${a.type === "error" ? "rgba(239,68,68,0.2)" : a.type === "warn" ? "rgba(245,158,11,0.2)" : "rgba(59,130,246,0.2)"}`,
                color: a.type === "error" ? "#FCA5A5" : a.type === "warn" ? "#FCD34D" : "#93C5FD",
              }}>
                {a.type === "error" ? "🔴" : a.type === "warn" ? "🟡" : "🔵"} {a.text}
              </div>
            ))
          )}

          {/* Quick stats */}
          <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { l: "รอดำเนินการ", v: pendingDocs.length + " รายการ", c: "#F59E0B" },
              { l: "ลูกค้าทั้งหมด", v: customers.length + " ราย", c: "#3B82F6" },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "#4B5563" }}>{l}</span>
                <span style={{ color: c, fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── INSIGHTS ROW ──────────────────────────────────────────── */}
      <div className="insights-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>

        {/* Top Products */}
        <div style={{ ...card(), padding: "22px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 16 }}>🏆 Top Products by Profit</div>
          {topProducts.length === 0 ? (
            <div style={{ textAlign: "center", color: "#4B5563", fontSize: 12, padding: "20px 0" }}>ยังไม่มีข้อมูล</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {topProducts.map((p, i) => (
                <div key={p.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: ["#F59E0B","#9CA3AF","#CD7F32","#6B7280","#6B7280"][i], minWidth: 16 }}>#{i+1}</span>
                      <span style={{ fontSize: 13, color: "#E2E8F0" }}>{p.name}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>฿{fmtB(p.profit)}</div>
                      <div style={{ fontSize: 10, color: "#4B5563" }}>{p.margin.toFixed(1)}% margin</div>
                    </div>
                  </div>
                  <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(p.profit / (topProducts[0]?.profit || 1)) * 100}%`, background: i === 0 ? "linear-gradient(90deg,#F59E0B,#FBBF24)" : "rgba(255,255,255,0.2)", borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document Shortcuts */}
        <div style={{ ...card(), padding: "22px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 16 }}>📁 เอกสาร</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {Object.entries(DOC_TYPES).map(([key, dt]: [string, any]) => (
              <button key={key} onClick={() => setPage(key)} style={{
                padding: "14px 16px", borderRadius: 12, textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                background: "rgba(255,255,255,0.02)", border: `1px solid ${dt.color}20`,
                transition: "all 0.2s", color: "#fff",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${dt.color}10`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${dt.color}40`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.02)"; (e.currentTarget as HTMLButtonElement).style.borderColor = `${dt.color}20`; }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, color: dt.color }}>{docCounts[key] || 0}</div>
                <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{dt.label}</div>
              </button>
            ))}
          </div>
          {/* Profit bar */}
          {totalRevenue > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#4B5563", marginBottom: 5 }}>
                <span>สัดส่วนกำไร / ต้นทุน</span>
                <span style={{ color: "#10B981", fontWeight: 700 }}>{profitMarginAll}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                <div style={{ height: "100%", display: "flex", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${100 - profitMarginPct}%`, background: "rgba(239,68,68,0.5)", transition: "width 0.5s" }} />
                  <div style={{ width: `${profitMarginPct}%`, background: "linear-gradient(90deg,#10B981,#34D399)", transition: "width 0.5s" }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#4B5563", marginTop: 4 }}>
                <span style={{ color: "#EF4444" }}>ต้นทุน ฿{fmtB(totalCost)}</span>
                <span style={{ color: "#10B981" }}>กำไร ฿{fmtB(totalProfit)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── LATEST ORDERS ─────────────────────────────────────────── */}
      <div style={{ ...card(), overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>🕐 Latest Orders</div>
          <span style={{ fontSize: 11, color: "#4B5563" }}>5 รายการล่าสุด</span>
        </div>
        {recentDocs.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#4B5563", fontSize: 13 }}>ยังไม่มีเอกสาร</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                {["เลขที่","ประเภท","ลูกค้า","วันที่","ยอดรวม","สถานะ"].map(h => (
                  <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, color: "#4B5563", fontWeight: 600, letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentDocs.map((doc: any, i: number) => {
                const { total, depositPaid, balanceDue } = calcDocTotal(doc, documents);
                return (
                  <tr key={doc.id} style={{ borderTop: "1px solid rgba(255,255,255,0.03)", transition: "background 0.15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.02)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>
                    <td style={{ padding: "12px 20px", fontSize: 12, fontFamily: "monospace", color: "#FF6B00", fontWeight: 600 }}>{doc.docNo}</td>
                    <td style={{ padding: "12px 20px" }}>
                      <span style={{ background: (DOC_TYPES as any)[doc.type]?.color + "20", color: (DOC_TYPES as any)[doc.type]?.color, fontSize: 11, padding: "3px 10px", borderRadius: 99, fontWeight: 600 }}>
                        {(DOC_TYPES as any)[doc.type]?.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 20px", fontSize: 13, color: "#CBD5E1" }}>{doc.customerName || "-"}</td>
                    <td style={{ padding: "12px 20px", fontSize: 12, color: "#6B7280" }}>{fmtDate(doc.date)}</td>
                    <td style={{ padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                      <div>฿{fmtMoney(total)}</div>
                      {depositPaid > 0 && balanceDue > 0 && <div style={{ marginTop: 3, color: "#F59E0B", fontSize: 11 }}>ค้างชำระ ฿{fmtMoney(balanceDue)}</div>}
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      <span style={{ background: (STATUS_COLORS as any)[doc.status] + "20", color: (STATUS_COLORS as any)[doc.status], fontSize: 11, padding: "3px 10px", borderRadius: 99, fontWeight: 600 }}>
                        {(STATUS_LABELS as any)[doc.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


// ============================================================
// CUSTOMER PAGE
// ============================================================
function CustomerInsightDashboard({ customers = [], documents = [], products = [] }: any) {
  const activeDocs = (documents || []).filter((doc: any) => !doc.deleted && doc.status !== "cancelled");
  const receiptDocs = reportingDocuments(activeDocs);
  const customerKey = (doc: any) => String(doc.customerId || doc.customerName || "").trim();
  const docsByCustomer = new Map<string, any[]>();
  activeDocs.forEach((doc: any) => {
    const key = customerKey(doc);
    if (!key) return;
    docsByCustomer.set(key, [...(docsByCustomer.get(key) || []), doc]);
  });
  const receiptRevenue = receiptDocs.reduce((sum: number, doc: any) => sum + calcDocTotal(doc).total, 0);
  const receiptProfit = receiptDocs.reduce((sum: number, doc: any) => {
    const cost = (doc.items || []).reduce((itemSum: number, item: any) => itemSum + lineCost(item, fallbackItemCost(products, item)), 0);
    return sum + calcDocTotal(doc).total - cost;
  }, 0);
  const repeatCustomers = customers.filter((customer: any) => {
    const docs = docsByCustomer.get(String(customer.id)) || docsByCustomer.get(String(customer.name || "").trim()) || [];
    return docs.length > 1;
  }).length;
  const summarize = (rows: any[], labelFn: (row: any) => string, valueFn: (row: any) => number = () => 1) => {
    const map = new Map<string, number>();
    rows.forEach((row: any) => {
      const label = String(labelFn(row) || "ไม่ระบุ").trim() || "ไม่ระบุ";
      map.set(label, (map.get(label) || 0) + valueFn(row));
    });
    return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  };
  const sourceRows = (() => {
    const map = new Map<string, { label: string; customers: Set<string>; docs: number; revenue: number }>();
    activeDocs.forEach((doc: any) => {
      const label = doc.leadSource || "ไม่ระบุ";
      const entry = map.get(label) || { label, customers: new Set<string>(), docs: 0, revenue: 0 };
      if (customerKey(doc)) entry.customers.add(customerKey(doc));
      entry.docs += 1;
      if (isReportDoc(doc)) entry.revenue += calcDocTotal(doc).total;
      map.set(label, entry);
    });
    return [...map.values()]
      .map((entry) => ({ label: entry.label, customers: entry.customers.size, docs: entry.docs, revenue: entry.revenue }))
      .sort((a, b) => b.customers - a.customers || b.revenue - a.revenue);
  })();
  const segmentRows = summarize(customers, (customer: any) => customer.customerSegment || "ไม่ระบุ");
  const businessRows = summarize(customers, (customer: any) => customer.businessType || "ไม่ระบุ").slice(0, 7);
  const productRows = (() => {
    const map = new Map<string, { label: string; docs: Set<string>; qty: number; revenue: number; profit: number }>();
    receiptDocs.forEach((doc: any) => {
      (doc.items || []).forEach((item: any) => {
        const label = item.name || "ไม่ระบุสินค้า/บริการ";
        const entry = map.get(label) || { label, docs: new Set<string>(), qty: 0, revenue: 0, profit: 0 };
        const revenue = lineAmount(item);
        const cost = lineCost(item, fallbackItemCost(products, item));
        entry.docs.add(String(doc.id));
        entry.qty += Number(item.qty || 0);
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
  const maxValue = (rows: any[], key = "value") => Math.max(1, ...rows.map((row: any) => Number(row[key] || 0)));
  const sumValue = (rows: any[], key = "value") => rows.reduce((sum: number, row: any) => sum + Number(row[key] || 0), 0);
  const colors = ["#FF6B00", "#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#14B8A6", "#EF4444"];
  const cardStyle = { background: "#141A24", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 18, boxShadow: "0 18px 45px rgba(0,0,0,0.18)" } as const;
  const miniCard = { background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px" } as const;
  const Bar = ({ pct, color = "#FF6B00", height = 8 }: any) => (
    <div style={{ height, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden", marginTop: 8 }}>
      <div style={{ height: "100%", width: `${Math.max(3, Math.min(100, pct || 0))}%`, background: color, borderRadius: 999 }} />
    </div>
  );
  const Donut = ({ rows, centerLabel, centerValue }: any) => {
    const total = sumValue(rows);
    let start = 0;
    const stops = rows.length
      ? rows.map((row: any, index: number) => {
          const pct = total > 0 ? Number(row.value || row.customers || 0) / total * 100 : 0;
          const segment = `${colors[index % colors.length]} ${start}% ${start + pct}%`;
          start += pct;
          return segment;
        }).join(", ")
      : "#1F2937 0% 100%";
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: 190 }}>
        <div style={{ width: 168, height: 168, borderRadius: "50%", background: `conic-gradient(${stops})`, position: "relative", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}>
          <div style={{ position: "absolute", inset: 28, borderRadius: "50%", background: "#141A24", display: "grid", placeItems: "center", textAlign: "center", padding: 10 }}>
            <div>
              <div style={{ color: "#8B95A7", fontSize: 11 }}>{centerLabel}</div>
              <div style={{ color: "#F8FAFC", fontSize: 22, fontWeight: 900 }}>{centerValue}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div style={{ display: "grid", gap: 16, marginBottom: 22 }}>
      <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap", background: "linear-gradient(135deg,#151B26 0%,#121720 56%,rgba(255,107,0,0.14) 100%)" }}>
        <div>
          <div style={{ color: "#FF6B00", fontSize: 11, fontWeight: 900, letterSpacing: 2 }}>CUSTOMER INTELLIGENCE</div>
          <h3 style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>Dashboard วิเคราะห์ลูกค้า</h3>
          <p style={{ color: "#9CA3AF", fontSize: 13, marginTop: 4 }}>ดึงจาก ERP โดยตรง: ลูกค้า, เอกสาร, ใบเสร็จ และรายการสินค้า/บริการ</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={miniCard}><div style={{ color: "#8B95A7", fontSize: 11 }}>ลูกค้า</div><div style={{ fontSize: 24, fontWeight: 900 }}>{customers.length}</div></div>
          <div style={miniCard}><div style={{ color: "#8B95A7", fontSize: 11 }}>เอกสาร ERP</div><div style={{ fontSize: 24, fontWeight: 900 }}>{activeDocs.length}</div></div>
          <div style={miniCard}><div style={{ color: "#8B95A7", fontSize: 11 }}>ใบเสร็จ</div><div style={{ fontSize: 24, fontWeight: 900, color: "#10B981" }}>{receiptDocs.length}</div></div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>
        <div style={miniCard}><div style={{ color: "#9CA3AF", fontSize: 12 }}>ยอดขายจริงจากใบเสร็จ</div><div style={{ color: "#F8FAFC", fontSize: 24, fontWeight: 900 }}>฿{fmtMoney(receiptRevenue)}</div><div style={{ color: "#64748B", fontSize: 11, marginTop: 3 }}>นับเฉพาะ Receipt ใน ERP</div></div>
        <div style={miniCard}><div style={{ color: "#9CA3AF", fontSize: 12 }}>กำไรโดยประมาณ</div><div style={{ color: "#10B981", fontSize: 24, fontWeight: 900 }}>฿{fmtMoney(receiptProfit)}</div><div style={{ color: "#64748B", fontSize: 11, marginTop: 3 }}>ยอดขาย - ต้นทุนรายการ</div></div>
        <div style={miniCard}><div style={{ color: "#9CA3AF", fontSize: 12 }}>ลูกค้าสั่งซ้ำ</div><div style={{ color: "#FFB000", fontSize: 24, fontWeight: 900 }}>{repeatCustomers}</div><div style={{ color: "#64748B", fontSize: 11, marginTop: 3 }}>มีเอกสารมากกว่า 1 ใบ</div></div>
        <div style={miniCard}><div style={{ color: "#9CA3AF", fontSize: 12 }}>ช่องทางที่มีข้อมูล</div><div style={{ color: "#F8FAFC", fontSize: 24, fontWeight: 900 }}>{sourceRows.filter((row) => row.label !== "ไม่ระบุ").length}</div><div style={{ color: "#64748B", fontSize: 11, marginTop: 3 }}>จาก Lead Source ในเอกสาร</div></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
        <div style={cardStyle}>
          <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>ลูกค้าเจอเราจากไหน</h3>
          <p style={{ color: "#8B95A7", fontSize: 12, marginBottom: 12 }}>ดูว่าช่องทางไหนพาลูกค้ามาและสร้างใบเสร็จจริง</p>
          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 16, alignItems: "center" }}>
            <Donut rows={sourceRows.map((row) => ({ label: row.label, value: row.customers || row.docs }))} centerLabel="Channels" centerValue={sourceRows.length} />
            <div>
              {sourceRows.length === 0 ? <div style={{ color: "#6B7280", fontSize: 13 }}>ยังไม่มีข้อมูล Lead Source ใน ERP</div> : sourceRows.slice(0, 6).map((row, index) => (
                <div key={row.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontWeight: 800 }}>
                    <span><span style={{ color: colors[index % colors.length] }}>●</span> {row.label}</span>
                    <span>{row.customers || row.docs} ราย</span>
                  </div>
                  <div style={{ color: "#94A3B8", fontSize: 12, marginTop: 3 }}>เอกสาร {row.docs} ใบ · ยอดขายใบเสร็จ ฿{fmtMoney(row.revenue)}</div>
                  <Bar pct={(row.customers || row.docs) / maxValue(sourceRows, "customers") * 100} color={colors[index % colors.length]} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={cardStyle}>
          <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>B2B / B2C</h3>
          <p style={{ color: "#8B95A7", fontSize: 12, marginBottom: 12 }}>ดึงจากข้อมูลลูกค้าใน ERP</p>
          <Donut rows={segmentRows} centerLabel="Customers" centerValue={customers.length} />
          {segmentRows.map((row, index) => (
            <div key={row.label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}><span><span style={{ color: colors[index % colors.length] }}>●</span> {row.label}</span><span>{row.value} ราย</span></div>
              <Bar pct={row.value / maxValue(segmentRows) * 100} color={colors[index % colors.length]} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
        <div style={cardStyle}>
          <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>ประเภทธุรกิจลูกค้า</h3>
          <p style={{ color: "#8B95A7", fontSize: 12, marginBottom: 14 }}>ช่วยเห็นว่าธุรกิจแบบไหนใช้บริการเรามากที่สุด</p>
          {businessRows.length === 0 ? <div style={{ color: "#6B7280", fontSize: 13 }}>ยังไม่มีข้อมูลประเภทธุรกิจใน ERP</div> : businessRows.map((row, index) => (
            <div key={row.label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800 }}><span>{index + 1}. {row.label}</span><span>{row.value} ราย</span></div>
              <Bar pct={row.value / maxValue(businessRows) * 100} color={colors[index % colors.length]} height={10} />
            </div>
          ))}
        </div>
        <div style={cardStyle}>
          <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>สินค้า / บริการยอดนิยม</h3>
          <p style={{ color: "#8B95A7", fontSize: 12, marginBottom: 14 }}>นับจากรายการในใบเสร็จ เพื่อดูงานที่ขายจริง</p>
          {productRows.length === 0 ? <div style={{ color: "#6B7280", fontSize: 13 }}>ยังไม่มีรายการสินค้า/บริการจากใบเสร็จใน ERP</div> : productRows.map((row, index) => (
            <div key={row.label} style={{ display: "grid", gridTemplateColumns: "30px minmax(0,1fr) auto", gap: 10, alignItems: "center", padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ color: index === 0 ? "#FFB000" : "#8B95A7", fontWeight: 900 }}>#{index + 1}</div>
              <div>
                <div style={{ fontWeight: 800 }}>{row.label}</div>
                <div style={{ color: "#94A3B8", fontSize: 12 }}>ยอดขาย ฿{fmtMoney(row.revenue)} · กำไร ฿{fmtMoney(row.profit)} · จำนวน {fmtMoney(row.qty)}</div>
                <Bar pct={row.jobs / maxValue(productRows, "jobs") * 100} color="#FFB000" height={10} />
              </div>
              <div style={{ color: "#FF6B00", fontWeight: 900 }}>{row.jobs} งาน</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...cardStyle, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
        <div>
          <div style={{ color: "#FF6B00", fontSize: 12, fontWeight: 900, marginBottom: 6 }}>อ่าน Dashboard นี้ยังไง</div>
          <p style={{ color: "#CBD5E1", fontSize: 13, lineHeight: 1.8 }}>ถ้าช่องทางไหนมีลูกค้าเยอะ แต่ยอดใบเสร็จน้อย ควรปรับการคัดกรอง Lead หรือข้อความโฆษณาให้ชัดขึ้น</p>
        </div>
        <div>
          <div style={{ color: "#FF6B00", fontSize: 12, fontWeight: 900, marginBottom: 6 }}>ข้อมูลที่ควรกรอกให้ครบ</div>
          <p style={{ color: "#CBD5E1", fontSize: 13, lineHeight: 1.8 }}>ในหน้าลูกค้าให้กรอก B2B/B2C และประเภทธุรกิจ ส่วนในเอกสารให้กรอกช่องทางที่ลูกค้ามา</p>
        </div>
      </div>
    </div>
  );
}

function CustomerPage({ customers, setCustomers, documents = [], products = [], showToast }: any) {
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const blank = { id: "", name: "", contact: "", phone: "", email: "", address: "", taxId: "", customerSegment: "B2B", businessType: "" };
  const filtered = customers.filter(c =>
    [c.name, c.contact, c.phone, c.customerSegment, c.businessType].some((value) => String(value || "").includes(search))
  );
  const save = async (form) => {
    if (!form.name.trim()) return showToast("กรุณาใส่ชื่อลูกค้า", "error");
    if (form.taxId && !/^\d{13}$/.test(form.taxId.replace(/-/g, "")))
      return showToast("เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก", "error");
    const row = {
      name: form.name,
      contact: form.contact,
      phone: form.phone,
      email: form.email,
      address: form.address,
      tax_id: form.taxId,
      customer_segment: form.customerSegment || "",
      business_type: form.businessType || "",
    };
    if (form.id) {
      const { error } = await supabase.from("erp_customers").update(row).eq("id", form.id);
      if (error) return showToast("เกิดข้อผิดพลาด: " + error.message, "error");
      setCustomers(prev => prev.map(c => c.id === form.id ? form : c));
      showToast("แก้ไขข้อมูลลูกค้าแล้ว");
    } else {
      const { data, error } = await supabase.from("erp_customers").insert(row).select().single();
      if (error) return showToast("เกิดข้อผิดพลาด: " + error.message, "error");
      setCustomers(prev => [...prev, { ...form, id: data.id }]);
      showToast("เพิ่มลูกค้าใหม่แล้ว");
    }
    setEditing(null);
  };
  const del = async (id) => {
    if (!confirm("ลบลูกค้านี้?")) return;
    const { error } = await supabase.from("erp_customers").delete().eq("id", id);
    if (error) return showToast("เกิดข้อผิดพลาด: " + error.message, "error");
    setCustomers(prev => prev.filter(c => c.id !== id));
    showToast("ลบลูกค้าแล้ว");
  };
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div className="erp-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h2 style={{ fontSize: 20, fontWeight: 700 }}>ลูกค้า</h2><p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{customers.length} ราย</p></div>
        <div className="erp-page-actions" style={{ display: "flex", gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ค้นหา..." style={{ width: 220 }} />
          <Btn onClick={() => setEditing({ ...blank })} color="#FF6B00">+ เพิ่มลูกค้า</Btn>
        </div>
      </div>
      <div className="erp-card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
        {filtered.map(c => (
          <div className="erp-data-card" key={c.id} style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div><div style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</div>{c.contact && <div style={{ fontSize: 12, color: "#A8B0C0" }}>{c.contact}</div>}</div>
              <div className="erp-card-actions" style={{ display: "flex", gap: 6 }}>
                <IconBtn onClick={() => setEditing({ ...c })} title="แก้ไข">✏️</IconBtn>
                <IconBtn onClick={() => del(c.id)} title="ลบ" danger>🗑️</IconBtn>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#888", lineHeight: 2 }}>
              {(c.customerSegment || c.businessType) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {c.customerSegment && <span style={{ color: "#FFB076", border: "1px solid rgba(255,107,0,0.35)", background: "rgba(255,107,0,0.12)", borderRadius: 999, padding: "2px 8px", fontWeight: 700 }}>{c.customerSegment}</span>}
                  {c.businessType && <span style={{ color: "#A7F3D0", border: "1px solid rgba(16,185,129,0.28)", background: "rgba(16,185,129,0.10)", borderRadius: 999, padding: "2px 8px", fontWeight: 700 }}>{c.businessType}</span>}
                </div>
              )}
              {c.phone && <div>📞 {c.phone}</div>}{c.email && <div>✉️ {c.email}</div>}
              {c.address && <div>📍 {c.address}</div>}{c.taxId && <div>🪪 {c.taxId}</div>}
            </div>
          </div>
        ))}
      </div>
      {editing && <Modal title={editing.id ? "แก้ไขลูกค้า" : "เพิ่มลูกค้า"} onClose={() => setEditing(null)} width={500}><CustomerForm data={editing} onSave={save} onCancel={() => setEditing(null)} /></Modal>}
    </div>
  );
}
function CustomerForm({ data, onSave, onCancel }: any) {
  const [f, setF] = useState(data);
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  const businessTypes = ["ร้านค้า", "ร้านอาหาร", "คาเฟ่/เครื่องดื่ม", "คลินิก/ความงาม", "อีเวนต์/ออกบูธ", "แบรนด์สินค้า", "องค์กร/บริษัท", "โรงเรียน/สถาบัน", "อื่น ๆ"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Field label="ชื่อบริษัท/ลูกค้า *"><input value={f.name} onChange={set("name")} /></Field>
      <Field label="ชื่อผู้ติดต่อ"><input value={f.contact} onChange={set("contact")} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="ประเภทลูกค้า">
          <select value={f.customerSegment || "B2B"} onChange={set("customerSegment")}>
            <option value="B2B">B2B - ธุรกิจ/องค์กร</option>
            <option value="B2C">B2C - ลูกค้าทั่วไป</option>
          </select>
        </Field>
        <Field label="ประเภทธุรกิจ">
          <input list="customer-business-types" value={f.businessType || ""} onChange={set("businessType")} placeholder="เช่น ร้านอาหาร, คาเฟ่, คลินิก" />
          <datalist id="customer-business-types">
            {businessTypes.map((type) => <option key={type} value={type} />)}
          </datalist>
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="โทรศัพท์"><input value={f.phone} onChange={set("phone")} /></Field>
        <Field label="อีเมล"><input value={f.email} onChange={set("email")} /></Field>
      </div>
      <Field label="ที่อยู่"><textarea value={f.address} onChange={set("address")} rows={2} style={{ resize: "vertical" }} /></Field>
      <Field label="เลขประจำตัวผู้เสียภาษี"><input value={f.taxId} onChange={set("taxId")} /></Field>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <Btn onClick={() => onSave(f)} color="#FF6B00" style={{ flex: 1 }}>บันทึก</Btn>
        <Btn onClick={onCancel} outline style={{ flex: 1 }}>ยกเลิก</Btn>
      </div>
    </div>
  );
}

// ============================================================
// PRODUCT PAGE — แก้ไข/ลบได้
// ============================================================
function ProductPage({ products, setProducts, suppliers = [], showToast }: any) {
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const blank = { id: "", name: "", supplierName: "", unit: "ชิ้น", cost: "", price: "", costUnit: "piece", priceUnit: "piece" };
  const catalogProducts = [...products, ...supplierCatalogProducts(suppliers)];
  const filtered = catalogProducts.filter(p =>
    [p.name, p.supplierName].some((value) => String(value || "").toLowerCase().includes(search.toLowerCase()))
  );
  const isLegacyProductColumnError = (error: any) =>
    error?.code === "42703" || /cost_unit|price_unit|column/i.test(error?.message || "");
  const save = async (f) => {
    if (!f.name.trim()) return showToast("กรุณาใส่ชื่อสินค้า", "error");
    const row = {
      name: f.name,
      supplier_name: f.supplierName || "",
      unit: f.unit,
      cost: parseFloat(f.cost) || 0,
      price: parseFloat(f.price) || 0,
      cost_unit: f.costUnit || "piece",
      price_unit: f.priceUnit || "piece",
    };
    const legacyRow = { name: row.name, unit: row.unit, cost: row.cost, price: row.price };
    if (f.id) {
      let { error } = await supabase.from("erp_products").update(row).eq("id", f.id);
      if (error && isLegacyProductColumnError(error)) {
        ({ error } = await supabase.from("erp_products").update(legacyRow).eq("id", f.id));
      }
      if (error) return showToast("เกิดข้อผิดพลาด: " + error.message, "error");
      setProducts(prev => prev.map(p => p.id === f.id ? { ...f, ...legacyRow, supplierName: row.supplier_name, costUnit: row.cost_unit, priceUnit: row.price_unit } : p));
      showToast("แก้ไขสินค้าแล้ว");
    } else {
      let { data, error } = await supabase.from("erp_products").insert(row).select().single();
      if (error && isLegacyProductColumnError(error)) {
        ({ data, error } = await supabase.from("erp_products").insert(legacyRow).select().single());
      }
      if (error) return showToast("เกิดข้อผิดพลาด: " + error.message, "error");
      setProducts(prev => [...prev, { ...f, id: data.id, ...legacyRow, supplierName: row.supplier_name, costUnit: row.cost_unit, priceUnit: row.price_unit }]);
      showToast("เพิ่มสินค้าใหม่แล้ว");
    }
    setEditing(null);
  };
  const del = async (id) => {
    if (!confirm("ลบสินค้านี้?")) return;
    const { error } = await supabase.from("erp_products").delete().eq("id", id);
    if (error) return showToast("เกิดข้อผิดพลาด: " + error.message, "error");
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast("ลบสินค้าแล้ว");
  };
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div className="erp-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h2 style={{ fontSize: 20, fontWeight: 700 }}>สินค้า/บริการ</h2><p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{catalogProducts.length} รายการ</p></div>
        <div className="erp-page-actions" style={{ display: "flex", gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ค้นหา..." style={{ width: 200 }} />
          <Btn onClick={() => setEditing({ ...blank })} color="#FF6B00">+ เพิ่มสินค้า</Btn>
        </div>
      </div>
      <div className="erp-desktop-table" style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#1A2233" }}>
              {["ชื่อสินค้า/บริการ", "Supplier", "หน่วย", "ต้นทุน", "ราคาขาย", "กำไร", "จัดการ"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, color: "#A8B0C0", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const margin = p.price - p.cost;
              const pct = p.cost > 0 ? (margin / p.cost * 100).toFixed(0) : 0;
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 500 }}>
                    {p.name}
                    {p.fromSupplierCatalog && <span style={{ marginLeft: 8, fontSize: 10, color: "#F97316", background: "rgba(249,115,22,0.12)", padding: "1px 6px", borderRadius: 99 }}>Supplier</span>}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#A8B0C0" }}>{p.supplierName || "-"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#A8B0C0" }}>{p.unit}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#ef4444" }}>฿{fmtMoney(p.cost)} <span style={{ color: "#6B7280", fontSize: 11 }}>{priceBasisLabel(p.costUnit)}</span></td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#10b981", fontWeight: 600 }}>฿{fmtMoney(p.price)} <span style={{ color: "#6B7280", fontSize: 11 }}>{priceBasisLabel(p.priceUnit)}</span></td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>
                    <span style={{ color: margin > 0 ? "#10b981" : "#ef4444" }}>฿{fmtMoney(margin)}</span>
                    <span style={{ fontSize: 11, color: "#555", marginLeft: 6 }}>({pct}%)</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {p.fromSupplierCatalog ? (
                        <span style={{ fontSize: 11, color: "#6B7280" }}>แก้ไขที่เมนู Supplier</span>
                      ) : (
                        <>
                          <IconBtn onClick={() => setEditing({ ...p })} title="แก้ไข">✏️</IconBtn>
                          <IconBtn onClick={() => del(p.id)} title="ลบ" danger>🗑️</IconBtn>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="erp-mobile-card-list">
        {filtered.map(p => {
          const margin = p.price - p.cost;
          const pct = p.cost > 0 ? (margin / p.cost * 100).toFixed(0) : 0;
          return (
            <div className="erp-mobile-card" key={`mobile-${p.id}`}>
              <div className="erp-mobile-card-head">
                <div>
                  <div className="erp-mobile-card-title">{p.name}</div>
                  <div className="erp-mobile-card-meta">
                    {p.supplierName ? `Supplier: ${p.supplierName}` : "Supplier: -"}
                    {p.fromSupplierCatalog && <span style={{ marginLeft: 6, color: "#F97316", fontWeight: 700 }}>Catalog</span>}
                  </div>
                </div>
                <div style={{ color: margin > 0 ? "#10b981" : "#ef4444", fontSize: 14, fontWeight: 800, whiteSpace: "nowrap" }}>
                  ฿{fmtMoney(margin)}
                </div>
              </div>
              <div className="erp-mobile-stats">
                <div className="erp-mobile-stat"><span>Unit</span><strong>{p.unit}</strong></div>
                <div className="erp-mobile-stat"><span>Margin</span><strong>{pct}%</strong></div>
                <div className="erp-mobile-stat"><span>Cost</span><strong style={{ color: "#ef4444" }}>฿{fmtMoney(p.cost)} {priceBasisLabel(p.costUnit)}</strong></div>
                <div className="erp-mobile-stat"><span>Sale</span><strong style={{ color: "#10b981" }}>฿{fmtMoney(p.price)} {priceBasisLabel(p.priceUnit)}</strong></div>
              </div>
              <div className="erp-mobile-actions">
                {p.fromSupplierCatalog ? (
                  <button disabled style={{ gridColumn: "1 / -1", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8", borderRadius: 10, fontSize: 12, fontFamily: "inherit" }}>
                    แก้ไขที่เมนู Supplier
                  </button>
                ) : (
                  <>
                    <button onClick={() => setEditing({ ...p })} style={{ background: "rgba(255,107,0,0.14)", border: "1px solid rgba(255,107,0,0.35)", color: "#FFB076", borderRadius: 10, fontWeight: 700, fontFamily: "inherit" }}>แก้ไข</button>
                    <button onClick={() => del(p.id)} style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.28)", color: "#FCA5A5", borderRadius: 10, fontWeight: 700, fontFamily: "inherit" }}>ลบ</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {editing && (
        <Modal title={editing.id ? "แก้ไขสินค้า" : "เพิ่มสินค้า"} onClose={() => setEditing(null)} width={420}>
          <ProductForm data={editing} suppliers={suppliers} onSave={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}
function ProductForm({ data, suppliers = [], onSave, onCancel }: any) {
  const [f, setF] = useState({
    ...data,
    supplierName: data.supplierName || data.supplier_name || "",
    cost: data.cost || "",
    price: data.price || "",
    costUnit: data.costUnit || data.cost_unit || "piece",
    priceUnit: data.priceUnit || data.price_unit || "piece",
  });
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  const margin = (parseFloat(f.price) || 0) - (parseFloat(f.cost) || 0);
  const pct = f.cost > 0 ? (margin / parseFloat(f.cost) * 100).toFixed(1) : 0;
  const selectedSupplier = suppliers.find((supplier: any) => supplier.name === f.supplierName);
  const supplierItems = selectedSupplier?.items || [];
  const pickSupplierItem = (e) => {
    const item = supplierItems.find((entry: any) => entry.id === e.target.value);
    if (!item) return;
    const basis = item.pricingBasis === "sqm" ? "sqm" : "piece";
    setF(prev => ({
      ...prev,
      name: item.name || prev.name,
      unit: item.unit || (basis === "sqm" ? "ตร.ม." : prev.unit),
      cost: Number(item.supplierPrice || 0),
      price: Number(item.salePrice || 0),
      costUnit: basis,
      priceUnit: basis,
    }));
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Field label="ชื่อสินค้า/บริการ *"><input value={f.name} onChange={set("name")} /></Field>
      <Field label="Supplier">
        <input value={f.supplierName} onChange={set("supplierName")} list="supplier-list" placeholder="เลือกหรือพิมพ์ชื่อ Supplier" />
        <datalist id="supplier-list">{suppliers.map((supplier: any) => <option key={supplier.id || supplier.name} value={supplier.name} />)}</datalist>
      </Field>
      {supplierItems.length > 0 && (
        <Field label="รายการจาก Supplier">
          <select onChange={pickSupplierItem} defaultValue="">
            <option value="">-- เลือกรายการเพื่อเติมข้อมูลสินค้า --</option>
            {supplierItems.map((item: any) => (
              <option key={item.id} value={item.id}>
                {item.name} · ทุน ฿{fmtMoney(item.supplierPrice)} · ขาย ฿{fmtMoney(item.salePrice)}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="หน่วย">
        <input value={f.unit} onChange={set("unit")} list="unit-list" />
        <datalist id="unit-list">{["ชิ้น","อัน","ตร.ม.","เมตร","แผ่น","ชุด","งาน","ครั้ง","100 ชิ้น"].map(u => <option key={u} value={u} />)}</datalist>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="ต้นทุน (บาท)"><input type="number" value={f.cost} onChange={set("cost")} min="0" /></Field>
        <Field label="ราคาขาย (บาท)"><input type="number" value={f.price} onChange={set("price")} min="0" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="คิดต้นทุนแบบ">
          <select value={f.costUnit} onChange={set("costUnit")}>
            {PRICE_BASIS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
        <Field label="คิดราคาขายแบบ">
          <select value={f.priceUnit} onChange={set("priceUnit")}>
            {PRICE_BASIS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
      </div>
      {f.price && f.cost && (
        <div style={{ background: "#1A2233", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: margin > 0 ? "#10b981" : "#ef4444" }}>
          กำไร: ฿{fmtMoney(margin)} ({pct}%)
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <Btn onClick={() => onSave({ ...f, cost: parseFloat(f.cost) || 0, price: parseFloat(f.price) || 0 })} color="#FF6B00" style={{ flex: 1 }}>บันทึก</Btn>
        <Btn onClick={onCancel} outline style={{ flex: 1 }}>ยกเลิก</Btn>
      </div>
    </div>
  );
}

// ============================================================
// SUPPLIER PAGE
// ============================================================
function SupplierPage({ suppliers, setSuppliers, showToast }: any) {
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const blank = { id: "", name: "", contact: "", phone: "", email: "", address: "", taxId: "", note: "", items: [] };
  const filtered = suppliers.filter((supplier: any) => {
    const q = search.toLowerCase();
    return [supplier.name, supplier.contact, supplier.phone, supplier.email]
      .some((value) => String(value || "").toLowerCase().includes(q));
  });
  const normalizeSupplier = (supplier: any, id?: string) => ({
    id: id || supplier.id || genId(),
    name: String(supplier.name || "").trim(),
    contact: supplier.contact || "",
    phone: supplier.phone || "",
    email: supplier.email || "",
    address: supplier.address || "",
    taxId: supplier.taxId || "",
    note: supplier.note || "",
    items: (supplier.items || []).map((item: any) => ({
      id: item.id || genId(),
      name: item.name || "",
      category: item.category || "สินค้า",
      unit: item.unit || "ชิ้น",
      pricingBasis: item.pricingBasis || item.priceBasis || "piece",
      widthM: Number(item.widthM || 0),
      heightM: Number(item.heightM || 0),
      quantity: Number(item.quantity || 1),
      totalSqm: Number(item.totalSqm || (Number(item.widthM || 0) * Number(item.heightM || 0) * Number(item.quantity || 1))),
      supplierPrice: Number(item.supplierPrice || 0),
      salePrice: Number(item.salePrice || 0),
      note: item.note || "",
    })).filter((item: any) => item.name.trim()),
  });
  const toRow = (supplier: any) => ({
    name: supplier.name,
    contact: supplier.contact,
    phone: supplier.phone,
    email: supplier.email,
    address: supplier.address,
    tax_id: supplier.taxId,
    notes: supplier.note,
    items: supplier.items,
  });
  const commitLocal = (next: any[]) => {
    setSuppliers(next);
  };
  const save = async (form: any) => {
    if (!String(form.name || "").trim()) return showToast("กรุณาใส่ชื่อ Supplier", "error");
    const clean = normalizeSupplier(form);
    const row = toRow(clean);
    try {
      await requireErpSession();
    } catch (error) {
      return showToast((error as any)?.message || String(error), "error");
    }
    if (form.id) {
      let savedRemote = true;
      try {
        const { error } = await supabase.from("erp_suppliers").update(row).eq("id", form.id);
        if (error) throw error;
      } catch (error) {
        console.warn("Supplier update fallback:", error);
        return showToast("บันทึก Supplier ลง database ไม่สำเร็จ: " + ((error as any)?.message || error), "error");
      }
      commitLocal(suppliers.map((supplier: any) => supplier.id === form.id ? clean : supplier));
      showToast(savedRemote ? "แก้ไข Supplier แล้ว" : "แก้ไข Supplier แล้ว (บันทึกสำรองในเครื่อง)");
    } else {
      let saved = clean;
      let savedRemote = true;
      try {
        const { data, error } = await supabase.from("erp_suppliers").insert(row).select().single();
        if (error) throw error;
        saved = normalizeSupplier(clean, data.id);
      } catch (error) {
        console.warn("Supplier insert fallback:", error);
        return showToast("บันทึก Supplier ลง database ไม่สำเร็จ: " + ((error as any)?.message || error), "error");
      }
      commitLocal([...suppliers, saved]);
      showToast(savedRemote ? "เพิ่ม Supplier ใหม่แล้ว" : "เพิ่ม Supplier ใหม่แล้ว (บันทึกสำรองในเครื่อง)");
    }
    setEditing(null);
  };
  const del = async (id: string) => {
    if (!confirm("ลบ Supplier นี้?")) return;
    try {
      await requireErpSession();
    } catch (error) {
      return showToast((error as any)?.message || String(error), "error");
    }
    let savedRemote = true;
    try {
      const { error } = await supabase.from("erp_suppliers").delete().eq("id", id);
      if (error) throw error;
    } catch (error) {
      console.warn("Supplier delete fallback:", error);
      return showToast("ลบ Supplier จาก database ไม่สำเร็จ: " + ((error as any)?.message || error), "error");
    }
    commitLocal(suppliers.filter((supplier: any) => supplier.id !== id));
    showToast(savedRemote ? "ลบ Supplier แล้ว" : "ลบ Supplier แล้ว (บันทึกสำรองในเครื่อง)");
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Supplier</h2>
          <p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{suppliers.length} รายการ</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหา Supplier..." style={{ width: 220 }} />
          <Btn onClick={() => setEditing({ ...blank })} color="#FF6B00">+ เพิ่ม Supplier</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        {filtered.map((supplier: any) => {
          const itemCount = supplier.items?.length || 0;
          const minSupplierPrice = itemCount ? Math.min(...supplier.items.map((item: any) => Number(item.supplierPrice || 0)).filter((price: number) => price >= 0)) : 0;
          return (
            <div key={supplier.id} style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{supplier.name}</div>
                  <div style={{ fontSize: 12, color: "#A8B0C0", marginTop: 4 }}>{supplier.contact || supplier.phone || "ยังไม่มีข้อมูลติดต่อ"}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <IconBtn onClick={() => setEditing({ ...supplier, items: supplier.items || [] })} title="แก้ไข">✏️</IconBtn>
                  <IconBtn onClick={() => del(supplier.id)} title="ลบ" danger>🗑️</IconBtn>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div style={{ background: "#0F1420", borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>สินค้า/บริการ</div>
                  <div style={{ fontSize: 18, color: "#FF6B00", fontWeight: 800 }}>{itemCount}</div>
                </div>
                <div style={{ background: "#0F1420", borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>ราคา Supplier เริ่มต้น</div>
                  <div style={{ fontSize: 18, color: "#10b981", fontWeight: 800 }}>฿{fmtMoney(minSupplierPrice)}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(supplier.items || []).slice(0, 3).map((item: any) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, color: "#CBD5E1", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 8 }}>
                    <span>{item.name}</span>
                    <span style={{ color: "#A8B0C0" }}>
                      ฿{fmtMoney(item.supplierPrice)} → ฿{fmtMoney(item.salePrice)}
                      {item.pricingBasis === "sqm" ? ` / ${fmtMoney(item.totalSqm)} ตร.ม.` : ""}
                    </span>
                  </div>
                ))}
                {itemCount === 0 && <div style={{ fontSize: 12, color: "#6B7280", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 8 }}>ยังไม่มีรายการสินค้า/บริการ</div>}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <Modal title={editing.id ? "แก้ไข Supplier" : "เพิ่ม Supplier"} onClose={() => setEditing(null)} width={860}>
          <SupplierForm data={editing} onSave={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}

function SupplierForm({ data, onSave, onCancel }: any) {
  const [f, setF] = useState({ ...data, items: data.items || [] });
  const set = (key: string) => (e: any) => setF((prev: any) => ({ ...prev, [key]: e.target.value }));
  const setItem = (id: string, key: string, value: any) => {
    setF((prev: any) => ({
      ...prev,
      items: prev.items.map((item: any) => item.id === id ? { ...item, [key]: value } : item),
    }));
  };
  const addItem = () => {
    setF((prev: any) => ({
      ...prev,
      items: [...prev.items, { id: genId(), name: "", category: "สินค้า", unit: "ชิ้น", pricingBasis: "piece", widthM: "", heightM: "", quantity: 1, supplierPrice: "", salePrice: "", note: "" }],
    }));
  };
  const removeItem = (id: string) => {
    setF((prev: any) => ({ ...prev, items: prev.items.filter((item: any) => item.id !== id) }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
        <Field label="ชื่อ Supplier *"><input value={f.name} onChange={set("name")} /></Field>
        <Field label="ผู้ติดต่อ"><input value={f.contact} onChange={set("contact")} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="โทรศัพท์"><input value={f.phone} onChange={set("phone")} /></Field>
        <Field label="อีเมล"><input value={f.email} onChange={set("email")} /></Field>
        <Field label="เลขผู้เสียภาษี"><input value={f.taxId} onChange={set("taxId")} /></Field>
      </div>
      <Field label="ที่อยู่"><textarea value={f.address} onChange={set("address")} rows={2} style={{ resize: "vertical" }} /></Field>

      <div style={{ background: "#0F1420", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>รายการสินค้า/บริการที่ Supplier จำหน่าย</div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>ใส่ราคาจาก Supplier และราคาขายของเรา</div>
          </div>
          <Btn onClick={addItem} color="#2563eb">+ เพิ่มรายการ</Btn>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {f.items.map((item: any) => {
            const pricingBasis = item.pricingBasis || "piece";
            const totalSqm = Number(item.widthM || 0) * Number(item.heightM || 0) * Number(item.quantity || 0);
            const multiplier = pricingBasis === "sqm" ? totalSqm : 1;
            const margin = (Number(item.salePrice || 0) - Number(item.supplierPrice || 0)) * multiplier;
            return (
              <div key={item.id} style={{ background: "#141A24", borderRadius: 10, padding: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr .8fr .8fr .8fr .8fr .7fr auto", gap: 8, alignItems: "end" }}>
                  <Field label="ชื่อรายการ"><input value={item.name} onChange={(e) => setItem(item.id, "name", e.target.value)} /></Field>
                  <Field label="ประเภท">
                    <select value={item.category} onChange={(e) => setItem(item.id, "category", e.target.value)}>
                      <option value="สินค้า">สินค้า</option>
                      <option value="บริการ">บริการ</option>
                    </select>
                  </Field>
                  <Field label="คิดราคา">
                    <select value={pricingBasis} onChange={(e) => {
                      setItem(item.id, "pricingBasis", e.target.value);
                      setItem(item.id, "unit", e.target.value === "sqm" ? "ตร.ม." : "ชิ้น");
                    }}>
                      <option value="piece">ต่อชิ้น</option>
                      <option value="sqm">ต่อตารางเมตร</option>
                    </select>
                  </Field>
                  <Field label="ราคา Supplier"><input type="number" min="0" value={item.supplierPrice} onChange={(e) => setItem(item.id, "supplierPrice", e.target.value)} /></Field>
                  <Field label="ราคาขาย"><input type="number" min="0" value={item.salePrice} onChange={(e) => setItem(item.id, "salePrice", e.target.value)} /></Field>
                  <div style={{ paddingBottom: 9, fontSize: 12, color: margin >= 0 ? "#10b981" : "#ef4444", fontWeight: 800 }}>
                    ฿{fmtMoney(margin)}
                  </div>
                  <IconBtn onClick={() => removeItem(item.id)} title="ลบรายการ" danger>🗑️</IconBtn>
                </div>
                {pricingBasis === "sqm" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <Field label="กว้าง (เมตร)"><input type="number" min="0" step="0.01" value={item.widthM} onChange={(e) => setItem(item.id, "widthM", e.target.value)} /></Field>
                    <Field label="สูง (เมตร)"><input type="number" min="0" step="0.01" value={item.heightM} onChange={(e) => setItem(item.id, "heightM", e.target.value)} /></Field>
                    <Field label="จำนวนชิ้น"><input type="number" min="1" step="1" value={item.quantity} onChange={(e) => setItem(item.id, "quantity", e.target.value)} /></Field>
                    <Field label="พื้นที่รวม">
                      <input value={`${fmtMoney(totalSqm)} ตร.ม.`} readOnly style={{ color: "#10b981", fontWeight: 800 }} />
                    </Field>
                  </div>
                )}
              </div>
            );
          })}
          {f.items.length === 0 && (
            <div style={{ border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 10, padding: 18, textAlign: "center", color: "#6B7280", fontSize: 13 }}>
              ยังไม่มีรายการ กดเพิ่มรายการเพื่อบันทึกสินค้า/บริการของ Supplier
            </div>
          )}
        </div>
      </div>

      <Field label="หมายเหตุ"><textarea value={f.note} onChange={set("note")} rows={2} style={{ resize: "vertical" }} /></Field>
      <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
        <Btn onClick={() => onSave(f)} color="#FF6B00" style={{ flex: 1 }}>บันทึก</Btn>
        <Btn onClick={onCancel} outline style={{ flex: 1 }}>ยกเลิก</Btn>
      </div>
    </div>
  );
}

// ============================================================
// COMPANY PAGE
// ============================================================
function CompanyPage({ company, setCompany, showToast }: any) {
  const [f, setF] = useState({ bankName: "", bankBranch: "", bankAccount: "", bankType: "ออมทรัพย์", salesPerson: "", ...company });
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  const save = async () => {
    let savedCompany = { ...f };
    const row = {
      name: f.name, address: f.address, phone: f.phone, email: f.email,
      tax_id: f.taxId, sales_person: f.salesPerson,
      bank_name: f.bankName, bank_branch: f.bankBranch,
      bank_account: f.bankAccount, bank_type: f.bankType, qr_image: f.qrImage,
      signature_image: f.signatureImage,
    };
    if (f.id) {
      const { error } = await supabase.from("erp_company").update(row).eq("id", f.id);
      if (error) return showToast("เกิดข้อผิดพลาด: " + error.message, "error");
    } else {
      const { data, error } = await supabase.from("erp_company").insert(row).select().single();
      if (error) return showToast("เกิดข้อผิดพลาด: " + error.message, "error");
      savedCompany = { ...f, id: data.id };
      setF(savedCompany);
    }
    setCompany(savedCompany);
    showToast("บันทึกข้อมูลบริษัทแล้ว");
  };
  const secStyle = { background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 24, display: "flex" as const, flexDirection: "column" as const, gap: 14 };
  const barStyle = (color: string) => ({ width: 4, height: 20, background: color, borderRadius: 2, marginRight: 8, display: "inline-block", flexShrink: 0 });
  const secTitle = (icon: string, text: string, color = "#FF6B00") => (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 4, fontSize: 14, fontWeight: 700 }}>
      <span style={barStyle(color)} />{icon} {text}
    </div>
  );
  return (
    <div style={{ maxWidth: 580, animation: "fadeIn 0.3s ease", display: "flex", flexDirection: "column", gap: 20 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>⚙️ ตั้งค่าบริษัท</h2>

      {/* Section 1: บริษัท */}
      <div style={secStyle}>
        {secTitle("🏢", "ข้อมูลบริษัทผู้เสนอราคา")}
        <Field label="ชื่อบริษัท / ร้านค้า"><input value={f.name} onChange={set("name")} /></Field>
        <Field label="ที่อยู่"><textarea value={f.address} onChange={set("address")} rows={3} style={{ resize: "vertical" }} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="โทรศัพท์"><input value={f.phone || ""} onChange={set("phone")} placeholder="02-xxx-xxxx" /></Field>
          <Field label="อีเมล"><input value={f.email || ""} onChange={set("email")} placeholder="info@company.com" /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="เลขผู้เสียภาษี"><input value={f.taxId || ""} onChange={set("taxId")} placeholder="0105550000000" /></Field>
          <Field label="พนักงานขาย (Default)"><input value={f.salesPerson || ""} onChange={set("salesPerson")} placeholder="ชื่อพนักงาน" /></Field>
        </div>
      </div>

      {/* Section 2: ธนาคาร */}
      <div style={secStyle}>
        {secTitle("🏦", "ข้อมูลบัญชีรับชำระเงิน", "#3B82F6")}
        <Field label="ชื่อบัญชีรับเงิน"><input value={f.bankName || ""} onChange={set("bankName")} placeholder="ชื่อบัญชีธนาคาร" /></Field>
        <Field label="ธนาคาร & สาขา"><input value={f.bankBranch || ""} onChange={set("bankBranch")} placeholder="เช่น ธนาคารกสิกรไทย สาขาบางบัวทอง" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="เลขที่บัญชี"><input value={f.bankAccount || ""} onChange={set("bankAccount")} placeholder="xxx-x-xxxxx-x" /></Field>
          <Field label="ประเภทบัญชี"><input value={f.bankType || ""} onChange={set("bankType")} placeholder="ออมทรัพย์ / กระแสรายวัน" /></Field>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#A8B0C0", fontWeight: 600, display: "block", marginBottom: 8 }}>QR Code ชำระเงิน (Default สำหรับเอกสารใหม่)</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 72, height: 72, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, background: "#0B0F19", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
              {f.qrImage ? <img src={f.qrImage} alt="QR" style={{ width: 64, height: 64, objectFit: "contain" }} /> : <span style={{ fontSize: 28 }}>📷</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, flex: 1 }}>
              <label style={{ cursor: "pointer", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#3B82F6", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, textAlign: "center" as const, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <span>📁</span> เลือกไฟล์รูปภาพ QR Code
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => setF(prev => ({ ...prev, qrImage: ev.target?.result as string }));
                  reader.readAsDataURL(file);
                }} />
              </label>
              {f.qrImage && (
                <button onClick={() => setF(prev => ({ ...prev, qrImage: "" }))}
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  🗑 ลบรูป QR Code
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── ลายเซ็นผู้เสนอราคา ── */}
        <div>
          <label style={{ fontSize: 12, color: "#A8B0C0", fontWeight: 600, display: "block", marginBottom: 8 }}>✍️ ลายเซ็นผู้เสนอราคา (แสดงในเอกสาร)</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 140, height: 72, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, background: "#0B0F19", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
              {f.signatureImage
                ? <img src={f.signatureImage} alt="ลายเซ็น" style={{ maxWidth: 132, maxHeight: 64, objectFit: "contain" }} />
                : <span style={{ fontSize: 12, color: "#555" }}>ยังไม่มีลายเซ็น</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, flex: 1 }}>
              <label style={{ cursor: "pointer", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, textAlign: "center" as const, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <span>✍️</span> เลือกไฟล์รูปภาพลายเซ็น
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => setF(prev => ({ ...prev, signatureImage: ev.target?.result as string }));
                  reader.readAsDataURL(file);
                }} />
              </label>
              <p style={{ fontSize: 11, color: "#555", margin: 0 }}>แนะนำ: รูปพื้นหลังโปร่งใส (PNG) หรือรูปที่เห็นลายเซ็นชัดเจน</p>
              {f.signatureImage && (
                <button onClick={() => setF(prev => ({ ...prev, signatureImage: "" }))}
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  🗑 ลบรูปลายเซ็น
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Btn onClick={save} color="#FF6B00">💾 บันทึกข้อมูลทั้งหมด</Btn>
    </div>
  );
}

// ============================================================
// DOCUMENT PAGE
// ============================================================
function DocumentPage({ type, documents, allDocuments, setDocuments, customers, products, company, showToast }: any) {
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const dt = DOC_TYPES[type];
  const filtered = documents.filter(d =>
    !d.deleted &&
    (filterStatus === "all" || d.status === filterStatus) &&
    ([d.docNo, d.customerName].some((value) => String(value || "").includes(search)))
  );
  const nextDocNoForType = (targetType: string) => {
    const year = new Date().getFullYear() + 543;
    const targetDt = DOC_TYPES[targetType] || dt;
    const prefix = `${targetDt.prefix}${year}-`;
    // หา running number สูงสุดที่มีอยู่แล้วในปีนี้ แทนการนับ .length
    const maxSeq = allDocuments
      .filter(d => d.type === targetType && d.docNo?.startsWith(prefix))
      .reduce((max, d) => {
        const seq = parseInt(d.docNo.replace(prefix, ""), 10);
        return isNaN(seq) ? max : Math.max(max, seq);
      }, 0);
    return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
  };
  const nextDocNo = () => nextDocNoForType(type);
  const newDoc = () => {
    setEditing({ id: "", type, docNo: nextDocNo(), date: today(), dueDate: addDays(today(), 30), customerId: "", customerName: "", projectName: "", orderId: "", salesPerson: company?.salesPerson || "", reference: "", leadSource: "", marketingCampaign: "", marketingAdSet: "", marketingAd: "", paymentType: type === "receipt" ? "deposit" : "", paymentAmount: 0, paymentDate: type === "receipt" ? today() : "", paymentNote: "", items: [], discount: 0, discountType: "percent", vat: true, vatRate: 7, wht: false, whtRate: 3, depositPaid: 0, depositDate: "", depositNote: "", status: "draft", notes: "", bankName: company?.bankName || "", bankBranch: company?.bankBranch || "", bankAccount: company?.bankAccount || "", bankType: company?.bankType || "ออมทรัพย์", qrImage: company?.qrImage || "" });
  };
  const save = async (doc) => {
    if (!doc.customerId) return showToast("กรุณาเลือกลูกค้า", "error");
    if (doc.items.length === 0) return showToast("กรุณาเพิ่มรายการสินค้า", "error");
    if (doc.items.some(i => i.qty < 0 || i.price < 0))
      return showToast("จำนวนและราคาต้องไม่ติดลบ", "error");
    if (!doc.docNo?.trim()) return showToast("กรุณาระบุเลขที่เอกสาร", "error");
    const itemsWithCost = doc.items.map(item => {
      const prod = findProductForItem(products, item);
      const costedItem = {
        ...item,
        costSnapshot: Number(item.costSnapshot || 0) > 0 ? item.costSnapshot : (prod ? prod.cost : 0),
        costUnit: item.costUnit || prod?.costUnit || prod?.cost_unit || "piece",
        priceUnit: item.priceUnit || prod?.priceUnit || prod?.price_unit || "piece",
        supplierName: item.supplierName || prod?.supplierName || prod?.supplier_name || "",
      };
      return costedItem;
    });
    const normalizedPaymentAmount = Math.max(0, Number(doc.paymentAmount || doc.depositPaid || 0) || 0);
    const docForTotals = { ...doc, paymentAmount: normalizedPaymentAmount };
    const paymentTotals = calcDocTotal(docForTotals, allDocuments);
    const normalizedStatus = doc.type === "receipt" && paymentTotals.depositPaid > 0
      ? (paymentTotals.balanceDue > 0 ? "partial_paid" : "paid")
      : doc.status;
    const docRow = {
      type: doc.type, doc_no: doc.docNo, status: normalizedStatus,
      customer_id: doc.customerId, customer_name: doc.customerName,
      project_name: doc.projectName, order_id: doc.orderId || null,
      reference: doc.reference, sales_person: doc.salesPerson,
      lead_source: doc.leadSource || "",
      marketing_campaign: doc.marketingCampaign || "",
      marketing_adset: doc.marketingAdSet || "",
      marketing_ad: doc.marketingAd || "",
      payment_type: doc.paymentType || "",
      payment_amount: normalizedPaymentAmount,
      payment_date: doc.paymentDate || doc.depositDate || null,
      payment_note: doc.paymentNote || "",
      payment_status: paymentTotals.paymentStatus,
      date: doc.date, due_date: doc.dueDate,
      discount: doc.discount, discount_type: doc.discountType || "percent", vat: doc.vat, vat_rate: docVatRate(doc), wht: doc.wht, wht_rate: doc.whtRate,
      deposit_paid: normalizedPaymentAmount,
      deposit_date: doc.depositDate || doc.paymentDate || null,
      deposit_note: doc.depositNote || doc.paymentNote || "",
      notes: doc.notes, override_address: doc.overrideAddress,
      bank_name: doc.bankName, bank_branch: doc.bankBranch,
      bank_account: doc.bankAccount, bank_type: doc.bankType, qr_image: doc.qrImage,
      deleted: false,
    };
    const { vat_rate, discount_type, lead_source, marketing_campaign, marketing_adset, marketing_ad, payment_type, payment_amount, payment_date, payment_note, payment_status, deposit_paid, deposit_date, deposit_note, ...legacyDocRow } = docRow;
    const isLegacyVatColumnError = (error: any) =>
      error?.code === "42703" || /vat_rate|discount_type|lead_source|marketing_campaign|marketing_adset|marketing_ad|payment_type|payment_amount|payment_date|payment_note|payment_status|deposit_paid|deposit_date|deposit_note|column/i.test(error?.message || "");
    const requiresPersistentDocColumns =
      docVatRate(doc) !== 7
      || Boolean(doc.leadSource || doc.marketingCampaign || doc.marketingAdSet || doc.marketingAd)
      || (doc.discountType || "percent") !== "percent"
      || Number(doc.depositPaid || doc.paymentAmount || 0) > 0
      || Boolean(doc.depositDate || doc.depositNote || doc.paymentType || doc.paymentDate || doc.paymentNote);
    const persistentFieldError = "ฐานข้อมูลยังไม่มีคอลัมน์สำหรับ VAT/Marketing/มัดจำ กรุณารัน supabase/erp-persistent-document-fields.sql ใน Supabase Production แล้วบันทึกเอกสารอีกครั้ง";
    try {
      let docId = doc.id;
      if (doc.id) {
        const { error } = await supabase.from("erp_documents").update(docRow).eq("id", doc.id);
        if (error) {
          if (!isLegacyVatColumnError(error)) throw error;
          if (requiresPersistentDocColumns) throw new Error(persistentFieldError);
          const { error: legacyError } = await supabase.from("erp_documents").update(legacyDocRow).eq("id", doc.id);
          if (legacyError) throw legacyError;
        }
        // ลบ items เก่า แล้วใส่ใหม่
      } else {
        const { data, error } = await supabase.from("erp_documents").insert(docRow).select().single();
        if (error) {
          if (!isLegacyVatColumnError(error)) throw error;
          if (requiresPersistentDocColumns) throw new Error(persistentFieldError);
          const { data: legacyData, error: legacyError } = await supabase.from("erp_documents").insert(legacyDocRow).select().single();
          if (legacyError) throw legacyError;
          docId = legacyData.id;
        } else {
          docId = data.id;
        }
      }
      // insert items ใหม่
      if (itemsWithCost.length > 0) {
        const itemRows = itemsWithCost.map((item, idx) => ({
          document_id: docId, sort_order: idx,
          name: item.name, sub_title: item.subTitle, detail: item.detail,
          unit: item.unit, qty: item.qty, price: item.price, cost_snapshot: item.costSnapshot,
          cost_unit: item.costUnit || "piece",
          price_unit: item.priceUnit || "piece",
          supplier_name: item.supplierName || "",
          width_m: item.widthM ?? null,
          height_m: item.heightM ?? null,
          pieces: item.pieces ?? null,
        }));
        const legacyItemRows = itemRows.map(({ cost_unit, price_unit, supplier_name, width_m, height_m, pieces, ...row }) => row);
        const isLegacyItemColumnError = (error: any) =>
          error?.code === "42703" || /cost_unit|price_unit|supplier_name|width_m|height_m|pieces|column/i.test(error?.message || "");
        const requiresPersistentItemColumns = itemsWithCost.some((item) =>
          Boolean(item.supplierName)
          || isSqmBasis(item.costUnit)
          || isSqmBasis(item.priceUnit)
          || Number(item.widthM || 0) > 0
          || Number(item.heightM || 0) > 0
          || Number(item.pieces || 0) > 0
        );
        let { data: insertedItems, error: itemErr } = await supabase
          .from("erp_document_items")
          .insert(itemRows)
          .select("id");
        if (itemErr && isLegacyItemColumnError(itemErr)) {
          if (requiresPersistentItemColumns) throw new Error(persistentFieldError);
          ({ data: insertedItems, error: itemErr } = await supabase
            .from("erp_document_items")
            .insert(legacyItemRows)
            .select("id"));
        }
        if (itemErr) throw itemErr;
        if (doc.id) {
          const insertedIds = (insertedItems || []).map((item) => item.id).filter(Boolean);
          const deleteQuery = supabase.from("erp_document_items").delete().eq("document_id", doc.id);
          const { error: deleteOldItemsError } = insertedIds.length > 0
            ? await deleteQuery.not("id", "in", `(${insertedIds.map((id) => `"${id}"`).join(",")})`)
            : await deleteQuery;
          if (deleteOldItemsError) throw deleteOldItemsError;
        }
      }
      const saved = {
        ...doc,
        id: docId,
        status: normalizedStatus,
        paymentAmount: normalizedPaymentAmount,
        paymentStatus: paymentTotals.paymentStatus,
        depositPaid: normalizedPaymentAmount,
        depositDate: doc.depositDate || doc.paymentDate || "",
        depositNote: doc.depositNote || doc.paymentNote || "",
        items: itemsWithCost,
      };
      saveErpDocumentShadow(docId, saved);
      if (doc.id) setDocuments(prev => prev.map(d => d.id === doc.id ? saved : d));
      else setDocuments(prev => [...prev, saved]);
      showToast(doc.id ? "บันทึกเอกสารแล้ว" : "สร้างเอกสารใหม่แล้ว");
      setEditing(null);
    } catch (err: any) {
      showToast("เกิดข้อผิดพลาด: " + err.message, "error");
    }
  };
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const del = (id) => {
    const doc = documents.find(d => d.id === id);
    if (doc?.status === "approved") return showToast("ไม่สามารถลบเอกสารที่อนุมัติแล้ว — ยกเลิกการอนุมัติก่อน", "error");
    setDeleteConfirm(id);
  };
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const { error } = await supabase.from("erp_documents").update({ deleted: true, status: "cancelled" }).eq("id", deleteConfirm);
    if (error) return showToast("เกิดข้อผิดพลาด: " + error.message, "error");
    setDocuments(prev => prev.map(d => d.id === deleteConfirm ? { ...d, deleted: true, status: "cancelled" } : d));
    setDeleteConfirm(null);
    showToast("ลบเอกสารแล้ว");
  };
  const changeStatus = async (id, status) => {
    const { error } = await supabase.from("erp_documents").update({ status }).eq("id", id);
    if (error) return showToast("เกิดข้อผิดพลาด: " + error.message, "error");
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    showToast(`อัปเดตสถานะเป็น "${STATUS_LABELS[status]}"`);
  };

  // ── Email Modal ────────────────────────────────────────────
  const copyDocumentSummary = async (doc) => {
    const { netPay } = calcDocTotal(doc);
    const text = [
      `${DOC_TYPES[doc.type]?.label || "เอกสาร"} ${doc.docNo}`,
      `ลูกค้า: ${doc.customerName || "-"}`,
      `วันที่: ${fmtDate(doc.date)}`,
      `ครบกำหนด: ${fmtDate(doc.dueDate)}`,
      `ยอดสุทธิ: ฿${fmtMoney(netPay)}`,
      `สถานะ: ${STATUS_LABELS[doc.status] || doc.status}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      showToast("คัดลอกข้อมูลเอกสารแล้ว");
    } catch {
      showToast("ไม่สามารถคัดลอกได้", "error");
    }
  };

  const shareDocumentLink = async (doc) => {
    if (!doc?.id) {
      showToast("กรุณาบันทึกเอกสารก่อนแชร์", "error");
      return;
    }
    const title = `${DOC_TYPES[doc.type]?.label || "เอกสาร"} ${doc.docNo}`;
    const url = publicDocumentUrl(doc.id, doc.updatedAt || Date.now());
    try {
      if (navigator.share) {
        await navigator.share({ title, text: title, url });
        showToast("แชร์ลิงก์เอกสารแล้ว");
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast("คัดลอกลิงก์เอกสารแล้ว");
    } catch {
      showToast("ไม่สามารถแชร์ลิงก์เอกสารได้", "error");
    }
  };

  const previewDocumentPdf = (doc) => {
    printDocument(doc, customers, company, { autoPrint: false, allDocuments });
  };

  const [emailModal, setEmailModal] = useState<any>(null);
  // ── Split Modal ─────────────────────────────────────────────
  const [splitModal, setSplitModal] = useState<any>(null);

  // ── สร้างเอกสารต่อ ─────────────────────────────────────────
  const DOC_NEXT: Record<string, { type: string; label: string; split?: boolean }[]> = {
    quote:   [
      { type: "bill",    label: "สร้างใบวางบิล / ใบส่งสินค้า" },
      { type: "bill",    label: "สร้างใบวางบิล / ใบส่งสินค้า (แบ่งจ่าย)", split: true },
      { type: "invoice", label: "สร้างใบแจ้งหนี้" },
      { type: "invoice", label: "สร้างใบแจ้งหนี้ (แบ่งจ่าย)", split: true },
    ],
    bill:    [{ type: "invoice", label: "สร้างใบแจ้งหนี้" }, { type: "receipt", label: "สร้างใบเสร็จรับเงิน" }],
    invoice: [{ type: "receipt", label: "สร้างใบเสร็จรับเงิน" }],
    receipt: [],
  };

  const createFrom = (srcDoc, targetType, split = false) => {
    const newDocNo = nextDocNoForType(targetType);
    const inheritedDeposit = resolveDepositInfo(srcDoc, allDocuments);
    const newDoc = {
      ...srcDoc,
      id: "",
      type: targetType,
      docNo: newDocNo,
      date: today(),
      dueDate: addDays(today(), 30),
      status: "draft",
      orderId: srcDoc.id,
      depositPaid: inheritedDeposit.depositPaid,
      depositDate: inheritedDeposit.depositDate,
      depositNote: inheritedDeposit.depositNote,
      notes: split ? (srcDoc.notes ? srcDoc.notes + "\n(แบ่งจ่าย)" : "(แบ่งจ่าย)") : srcDoc.notes,
      createdAt: undefined,
      updatedAt: undefined,
    };
    if (split) {
      setSplitModal({ srcDoc, newDoc });
    } else {
      setEditing(newDoc);
      showToast(`สร้าง${DOC_TYPES[targetType]?.label}จาก ${srcDoc.docNo}`);
    }
  };

  // ── Dropdown state ──────────────────────────────────────────
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openStatus, setOpenStatus] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const closeAll = useCallback(() => { setOpenMenu(null); setOpenStatus(null); setMenuPos(null); }, []);

  // ── Fix: ใช้ data-attribute แทน ref เพราะ menuRef/statusRef single ref
  // แต่ render ทั้ง desktop table และ mobile cards พร้อมกัน ทำให้ ref ชี้ไปที่อันสุดท้ายที่ render
  // ส่งผลให้ click ใน desktop menu ไม่ถูก detect ว่า "inMenu" -> closeAll() ยิงก่อน onClick
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const inMenu = !!target.closest("[data-dropdown-menu]");
      const inStatus = !!target.closest("[data-status-dropdown]");
      if (inMenu || inStatus) return;
      closeAll();
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [closeAll]);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div className="doc-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: dt.color + "22", color: dt.color, fontSize: 12, padding: "3px 10px", borderRadius: 99 }}>{dt.short}</span>{dt.label}
          </h2>
          <p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{documents.length} ฉบับ</p>
        </div>
        <div className="doc-header-actions" style={{ display: "flex", gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ค้นหา..." style={{ width: 180 }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 130 }}>
            <option value="all">ทุกสถานะ</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <Btn onClick={newDoc} color={dt.color}>+ สร้างเอกสาร</Btn>
        </div>
      </div>
      <div className="doc-list-panel" style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "visible" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "#555" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
            <div>ยังไม่มีเอกสาร</div>
            <Btn onClick={newDoc} color={dt.color} style={{ marginTop: 16 }}>+ สร้างเอกสารแรก</Btn>
          </div>
        ) : (<>
          {/* ── Desktop Table ── */}
          <table className="doc-table" style={{ width: "100%", borderCollapse: "collapse", borderRadius: 12, overflow: "visible" }}>
            <thead>
              <tr style={{ background: "#1A2233" }}>
                {["เลขที่เอกสาร", "ลูกค้า", "วันที่", "วันครบกำหนด", "ยอดรวม", "สถานะ", "จัดการ"].map((h, i, arr) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, color: "#A8B0C0", fontWeight: 500,
                    borderRadius: i === 0 ? "12px 0 0 0" : i === arr.length - 1 ? "0 12px 0 0" : 0 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => {
                const { total, depositPaid, balanceDue } = calcDocTotal(doc, allDocuments);
                return (
                  <tr key={doc.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontFamily: "monospace", color: dt.color }}>{doc.docNo}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>{doc.customerName || "-"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#888" }}>{fmtDate(doc.date)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#888" }}>{fmtDate(doc.dueDate)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600 }}>
                      <div>฿{fmtMoney(total)}</div>
                      {depositPaid > 0 && balanceDue > 0 && <div style={{ marginTop: 3, color: "#F59E0B", fontSize: 11 }}>ค้างชำระ ฿{fmtMoney(balanceDue)}</div>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {/* ── Status Badge + Dropdown ── */}
                      <div style={{ position: "relative", display: "inline-block" }} data-status-dropdown="">
                        <button onClick={() => { setOpenStatus(openStatus === doc.id ? null : doc.id); setOpenMenu(null); setMenuPos(null); }}
                          style={{ display: "flex", alignItems: "center", gap: 6, background: STATUS_COLORS[doc.status] + "22", color: STATUS_COLORS[doc.status], border: `1px solid ${STATUS_COLORS[doc.status]}55`, padding: "5px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                          {STATUS_LABELS[doc.status]}
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M2 3.5l3 3 3-3"/></svg>
                        </button>
                        {openStatus === doc.id && (
                          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 999, background: "#1A2233", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 0", minWidth: 140, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                            {Object.entries(STATUS_LABELS).map(([k, v]) => (
                              <button key={k} onClick={() => { changeStatus(doc.id, k); setOpenStatus(null); }}
                                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 14px", background: doc.status === k ? STATUS_COLORS[k] + "22" : "transparent", color: doc.status === k ? STATUS_COLORS[k] : "#ccc", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit", textAlign: "left" }}>
                                <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLORS[k], flexShrink: 0, display: "inline-block" }} />
                                {v}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {/* ── Action Menu ── */}
                      <div style={{ position: "relative", display: "inline-block" }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {/* ✅ อนุมัติ */}
                          {doc.status !== "approved" && doc.status !== "cancelled" && (
                            <button onClick={() => { changeStatus(doc.id, "approved"); }} title="อนุมัติ"
                              style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#10B981", borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                              ✅ อนุมัติ
                            </button>
                          )}
                          {/* แก้ไข */}
                          <button onClick={() => { if (doc.status === "approved") return showToast("ไม่สามารถแก้ไขเอกสารที่อนุมัติแล้ว", "error"); setEditing({ ...doc }); }} title="แก้ไข"
                            style={{ background: doc.status === "approved" ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: doc.status === "approved" ? "#444" : "#ccc", borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: doc.status === "approved" ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                            แก้ไข
                          </button>
                          {/* ⋮ More */}
                          <button onClick={(e) => {
                            if (openMenu === doc.id) { closeAll(); return; }
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                            setOpenMenu(doc.id); setOpenStatus(null);
                          }}
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#ccc", borderRadius: 8, padding: "5px 10px", fontSize: 14, cursor: "pointer", fontFamily: "inherit", lineHeight: 1 }}>
                            ⋮
                          </button>
                        </div>
                        {openMenu === doc.id && menuPos && (
                          <div data-dropdown-menu="" style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 9999, background: "#1A2233", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 0", minWidth: 240, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxHeight: "70vh", overflowY: "auto" }}>
                            {/* พิมพ์ */}
                            <MenuBtn icon="👁️" label="ดูตัวอย่าง PDF" onClick={() => { previewDocumentPdf(doc); closeAll(); }} />
                            <MenuBtn icon="🖨️" label="พิมพ์" onClick={() => { printDocument(doc, customers, company, { allDocuments }); closeAll(); }} />
                            {/* แชร์ลิงค์ */}
                            <MenuBtn icon="🔗" label="แชร์" onClick={() => { shareDocumentLink(doc); closeAll(); }} />
                            {/* ดาวน์โหลด */}
                            <MenuBtn icon="⬇️" label="ดาวน์โหลด" onClick={() => { printDocument(doc, customers, company, { allDocuments }); closeAll(); showToast("เปิดหน้าต่าง — กด Save as PDF"); }} />
                            {/* อีเมล */}
                            <MenuBtn icon="✉️" label="อีเมล" onClick={() => {
                              const cust = customers.find(c => c.id === doc.customerId);
                              setEmailModal({ doc, toEmail: cust?.email || "", subject: `เอกสาร ${doc.docNo} - ${cust?.name || ""}`, body: `เรียนคุณ ${cust?.contact || cust?.name || "ลูกค้า"},\n\nกรุณาตรวจสอบเอกสาร ${doc.docNo} ที่แนบมาด้วยนี้\n\nขอบคุณครับ` });
                              closeAll();
                            }} />
                            {/* สร้างซ้ำ */}
                            <MenuBtn icon="📋" label="สร้างซ้ำ" onClick={() => {
                              setEditing({ ...doc, id: "", docNo: nextDocNoForType(doc.type), date: today(), status: "draft" });
                              closeAll();
                            }} />

                            {/* สร้างเอกสารต่อ */}
                            {(DOC_NEXT[doc.type] || []).length > 0 && (
                              <>
                                <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "6px 0" }} />
                                <div style={{ padding: "4px 14px 4px", fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>สร้างเอกสารต่อ</div>
                                {(DOC_NEXT[doc.type] || []).map((next, ni) => (
                                  <MenuBtn key={ni}
                                    icon={next.split ? "✂️" : DOC_TYPES[next.type]?.short === "BL" ? "📋" : DOC_TYPES[next.type]?.short === "IV" ? "📑" : "🧾"}
                                    label={next.label}
                                    color={DOC_TYPES[next.type]?.color}
                                    onClick={() => { createFrom(doc, next.type, next.split); closeAll(); }}
                                  />
                                ))}
                              </>
                            )}

                            {/* ลบ */}
                            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "6px 0" }} />
                            <MenuBtn icon="🗑️" label="ลบ" danger onClick={() => { del(doc.id); closeAll(); }} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* ── Mobile Cards ── */}
          <div className="doc-cards" style={{ display: "none", flexDirection: "column" as const }}>
            {filtered.map(doc => {
              const { total, depositPaid, balanceDue } = calcDocTotal(doc, allDocuments);
              return (
                <div className="doc-mobile-card" key={doc.id} style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="doc-mobile-card-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: dt.color }}>{doc.docNo}</div>
                      <div style={{ fontSize: 13, color: "#e2e8f0", marginTop: 2 }}>{doc.customerName || "-"}</div>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>ครบกำหนด {fmtDate(doc.dueDate)}</div>
                    </div>
                    <div style={{ textAlign: "right" as const }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>฿{fmtMoney(total)}</div>
                      {depositPaid > 0 && balanceDue > 0 && <div style={{ marginTop: 3, color: "#F59E0B", fontSize: 11 }}>ค้างชำระ ฿{fmtMoney(balanceDue)}</div>}
                      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{fmtDate(doc.date)}</div>
                    </div>
                  </div>
                  <div className="doc-mobile-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div className="doc-mobile-status" style={{ position: "relative", display: "inline-block" }} data-status-dropdown="">
                      <button onClick={() => { setOpenStatus(openStatus === doc.id ? null : doc.id); setOpenMenu(null); setMenuPos(null); }}
                        style={{ display: "flex", alignItems: "center", gap: 5, background: STATUS_COLORS[doc.status] + "22", color: STATUS_COLORS[doc.status], border: `1px solid ${STATUS_COLORS[doc.status]}55`, padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                        {STATUS_LABELS[doc.status]}
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor"><path d="M2 3.5l3 3 3-3"/></svg>
                      </button>
                      {openStatus === doc.id && (
                        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 999, background: "#1A2233", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 0", minWidth: 140, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <button key={k} onClick={() => { changeStatus(doc.id, k); setOpenStatus(null); }}
                              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 14px", background: doc.status === k ? STATUS_COLORS[k] + "22" : "transparent", color: doc.status === k ? STATUS_COLORS[k] : "#ccc", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit", textAlign: "left" as const }}>
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLORS[k], flexShrink: 0, display: "inline-block" }} />{v}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="doc-mobile-actions" style={{ display: "flex", gap: 6 }}>
                      {doc.status !== "approved" && doc.status !== "cancelled" && (
                        <button onClick={() => changeStatus(doc.id, "approved")}
                          style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#10B981", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>✅ อนุมัติ</button>
                      )}
                      <button onClick={() => { if (doc.status === "approved") return showToast("ไม่สามารถแก้ไขเอกสารที่อนุมัติแล้ว", "error"); setEditing({ ...doc }); }}
                        style={{ background: doc.status === "approved" ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: doc.status === "approved" ? "#444" : "#ccc", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: doc.status === "approved" ? "not-allowed" : "pointer", fontFamily: "inherit" }}>แก้ไข</button>
                      <button onClick={() => printDocument(doc, customers, company, { allDocuments })}
                        style={{ background: "rgba(255,107,0,0.15)", border: "1px solid rgba(255,107,0,0.3)", color: "#FF6B00", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>🖨️</button>
                      <div style={{ position: "relative" }}>
                        <button onClick={(e) => {
                          if (openMenu === doc.id) { closeAll(); return; }
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                          setOpenMenu(doc.id); setOpenStatus(null);
                        }}
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#ccc", borderRadius: 8, padding: "6px 10px", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>⋮</button>
                        {openMenu === doc.id && menuPos && (
                          <div data-dropdown-menu="" style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 9999, background: "#1A2233", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 0", minWidth: 240, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxHeight: "60dvh", overflowY: "auto" }}>
                            <MenuBtn icon="👁️" label="ดูตัวอย่าง PDF" onClick={() => { previewDocumentPdf(doc); closeAll(); }} />
                            <MenuBtn icon="🖨️" label="พิมพ์" onClick={() => { printDocument(doc, customers, company, { allDocuments }); closeAll(); }} />
                            <MenuBtn icon="🔗" label="แชร์" onClick={() => { shareDocumentLink(doc); closeAll(); }} />
                            <MenuBtn icon="⬇️" label="ดาวน์โหลด" onClick={() => { printDocument(doc, customers, company, { allDocuments }); closeAll(); showToast("เปิดหน้าต่าง — กด Save as PDF"); }} />
                            <MenuBtn icon="✉️" label="อีเมล" onClick={() => { const cust = customers.find(c => c.id === doc.customerId); setEmailModal({ doc, toEmail: cust?.email || "", subject: `เอกสาร ${doc.docNo} - ${cust?.name || ""}`, body: `เรียนคุณ ${cust?.contact || cust?.name || "ลูกค้า"},\n\nกรุณาตรวจสอบเอกสาร ${doc.docNo} ที่แนบมาด้วยนี้\n\nขอบคุณครับ` }); closeAll(); }} />
                            <MenuBtn icon="📋" label="สร้างซ้ำ" onClick={() => { setEditing({ ...doc, id: "", docNo: nextDocNoForType(doc.type), date: today(), status: "draft" }); closeAll(); }} />
                            {(DOC_NEXT[doc.type] || []).length > 0 && <>
                              <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "6px 0" }} />
                              <div style={{ padding: "4px 14px", fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase" as const }}>สร้างเอกสารต่อ</div>
                              {(DOC_NEXT[doc.type] || []).map((next, ni) => (
                                <MenuBtn key={ni} icon={next.split ? "✂️" : "📑"} label={next.label} color={DOC_TYPES[next.type]?.color} onClick={() => { createFrom(doc, next.type, next.split); closeAll(); }} />
                              ))}
                            </>}
                            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "6px 0" }} />
                            <MenuBtn icon="🗑️" label="ลบ" danger onClick={() => { del(doc.id); closeAll(); }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>)}
      </div>
      {editing && (
        <Modal title={`${editing.id ? "แก้ไข" : "สร้าง"}${dt.label}`} onClose={() => setEditing(null)} width={760}>
          <DocForm doc={editing} type={type} customers={customers} products={products} onSave={save} onCancel={() => setEditing(null)} allDocuments={allDocuments} />
        </Modal>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <Modal title="ยืนยันการลบเอกสาร" onClose={() => setDeleteConfirm(null)} width={420}>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 20 }}>
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "16px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>🗑️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#ef4444", marginBottom: 6 }}>คุณแน่ใจหรือไม่?</div>
                <div style={{ fontSize: 13, color: "#A8B0C0", lineHeight: 1.6 }}>
                  เอกสาร <span style={{ fontFamily: "monospace", color: "#fff", fontWeight: 700 }}>{documents.find(d => d.id === deleteConfirm)?.docNo}</span> จะถูกยกเลิก<br/>
                  ข้อมูลจะยังคงอยู่ในระบบแต่ไม่แสดงผล
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={confirmDelete} style={{ flex: 1, background: "#ef4444", border: "1px solid #ef4444", color: "#fff" }}>🗑️ ยืนยันลบ</Btn>
              <Btn onClick={() => setDeleteConfirm(null)} outline style={{ flex: 1 }}>ยกเลิก</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Email Modal ── */}
      {emailModal && (
        <Modal title="ส่งเอกสารทางอีเมล" onClose={() => setEmailModal(null)} width={500}>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
            <Field label="📧 ถึง (To)">
              <input value={emailModal.toEmail} onChange={e => setEmailModal(p => ({ ...p, toEmail: e.target.value }))} placeholder="email@example.com" />
            </Field>
            <Field label="หัวข้อ (Subject)">
              <input value={emailModal.subject} onChange={e => setEmailModal(p => ({ ...p, subject: e.target.value }))} />
            </Field>
            <Field label="ข้อความ (Body)">
              <textarea value={emailModal.body} onChange={e => setEmailModal(p => ({ ...p, body: e.target.value }))} rows={5} style={{ resize: "vertical", fontFamily: "inherit" }} />
            </Field>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#888" }}>
              📎 ไฟล์แนบ: {emailModal.doc.docNo}.pdf (สร้างจากระบบ)
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={() => {
                if (!emailModal.toEmail) return showToast("กรุณาใส่อีเมลผู้รับ", "error");
                window.open(`mailto:${emailModal.toEmail}?subject=${encodeURIComponent(emailModal.subject)}&body=${encodeURIComponent(emailModal.body)}`);
                showToast("เปิดโปรแกรมอีเมลแล้ว");
                setEmailModal(null);
              }} color="#3B82F6" style={{ flex: 1 }}>✉️ ส่งอีเมล</Btn>
              <Btn onClick={() => setEmailModal(null)} outline style={{ flex: 1 }}>ยกเลิก</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Split Modal ── */}
      {splitModal && (
        <SplitModal
          srcDoc={splitModal.srcDoc}
          newDoc={splitModal.newDoc}
          onConfirm={(finalDoc) => {
            setEditing(finalDoc);
            setSplitModal(null);
            showToast(`สร้าง${DOC_TYPES[finalDoc.type]?.label}แบบแบ่งจ่ายจาก ${splitModal.srcDoc.docNo}`);
          }}
          onClose={() => setSplitModal(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// SPLIT MODAL — เลือกรายการ/ยอดแบ่งจ่าย
// ============================================================
function SplitModal({ srcDoc, newDoc, onConfirm, onClose }: any) {
  const dt = DOC_TYPES[newDoc.type];
  // เริ่มต้น: เลือกทุกรายการ เต็มจำนวน
  const [items, setItems] = useState(
    srcDoc.items.map(i => ({ ...i, selectedQty: i.qty, selected: true }))
  );
  const [splitNote, setSplitNote] = useState("");

  const toggleItem = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  const setQty = (id, v) => setItems(prev => prev.map(i => i.id === id ? { ...i, selectedQty: Math.min(parseFloat(v) || 0, i.qty) } : i));

  const selectedItems = items.filter(i => i.selected && i.selectedQty > 0).map(i => ({ ...i, qty: i.selectedQty }));
  const subTotal = selectedItems.reduce((s, i) => s + lineAmount(i), 0);

  const confirm = () => {
    if (selectedItems.length === 0) return;
    const finalDoc = {
      ...newDoc,
      items: selectedItems,
      notes: [newDoc.notes, splitNote].filter(Boolean).join("\n"),
    };
    onConfirm(finalDoc);
  };

  return (
    <Modal title={`สร้าง${dt?.label} (แบ่งจ่าย)`} onClose={onClose} width={600}>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
        <div style={{ fontSize: 13, color: "#A8B0C0" }}>เลือกรายการที่ต้องการวางบิล/แจ้งหนี้ในรอบนี้</div>

        <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
          {items.map(item => (
            <div key={item.id} style={{ background: item.selected ? "rgba(255,107,0,0.06)" : "#0B0F19", border: `1px solid ${item.selected ? "rgba(255,107,0,0.25)" : "rgba(255,255,255,0.06)"}`, borderRadius: 10, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center", cursor: "pointer", transition: "all 0.15s" }}
              onClick={() => toggleItem(item.id)}>
              <input type="checkbox" checked={item.selected} onChange={() => toggleItem(item.id)} onClick={e => e.stopPropagation()} style={{ width: "auto", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                {item.subTitle && <div style={{ fontSize: 11, color: "#888" }}>{item.subTitle}</div>}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: "#888" }}>จาก {fmtMoney(item.qty)} {item.unit}</div>
                <input type="number" value={item.selectedQty} min={0} max={item.qty} step={0.01}
                  onClick={e => e.stopPropagation()}
                  onChange={e => { setQty(item.id, e.target.value); if (!item.selected) toggleItem(item.id); }}
                  style={{ width: 70, textAlign: "right", fontSize: 13, padding: "4px 8px" }} />
                <div style={{ fontSize: 11, color: "#888", width: 30 }}>{item.unit}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#FF6B00", width: 90, textAlign: "right" }}>฿{fmtMoney(lineAmount({ ...item, qty: item.selectedQty }))}</div>
              </div>
            </div>
          ))}
        </div>

        <Field label="หมายเหตุการแบ่งจ่าย">
          <input value={splitNote} onChange={e => setSplitNote(e.target.value)} placeholder="เช่น งวดที่ 1/2" />
        </Field>

        <div style={{ background: "#0B0F19", borderRadius: 8, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#A8B0C0" }}>ยอดรวมที่เลือก ({selectedItems.length} รายการ)</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: dt?.color }}>฿{fmtMoney(subTotal)}</span>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={confirm} color={dt?.color} style={{ flex: 1 }} disabled={selectedItems.length === 0}>✅ สร้างเอกสาร</Btn>
          <Btn onClick={onClose} outline style={{ flex: 1 }}>ยกเลิก</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// DOC FORM
// ============================================================
function DocForm({ doc, type, customers, products, onSave, onCancel, allDocuments }: any) {
  const [f, setF] = useState({ salesPerson: "", orderId: "", overrideAddress: "", ...doc });
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  const setN = (k) => (e) => setF(prev => ({ ...prev, [k]: parseFloat(e.target.value) || 0 }));
  const setBool = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.checked }));
  const dt = DOC_TYPES[type];

  // ── ลูกค้า ──────────────────────────────────────────────
  const setCust = (id) => {
    const c = customers.find(c => c.id === id);
    setF(prev => ({ ...prev, customerId: id, customerName: c?.name || "" }));
  };

  // ── รายการสินค้า ─────────────────────────────────────────
  const addItem = () => setF(prev => ({ ...prev, items: [...prev.items, { id: genId(), name: "", subTitle: "", detail: "", unit: "ชิ้น", qty: 1, price: 0, costUnit: "piece", priceUnit: "piece", widthM: 1, heightM: 1, pieces: 1 }] }));
  const removeItem = (id) => setF(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  const setItem = (id, k, v) => setF(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? { ...i, [k]: (["qty", "price", "costSnapshot"].includes(k)) ? parseFloat(v) || 0 : v } : i) }));
  const setItemDimension = (id, key, value) => setF(prev => ({
    ...prev,
    items: prev.items.map(i => {
      if (i.id !== id) return i;
      const next = { ...i, [key]: parseFloat(value) || 0 };
      const width = Number(next.widthM || 0);
      const height = Number(next.heightM || 0);
      const pieces = Number(next.pieces || 0);
      return { ...next, qty: Number((width * height * pieces).toFixed(4)) };
    }),
  }));
  const pickProduct = (itemId, prodId) => {
    const p = products.find(p => p.id === prodId);
    if (!p) return;
    const priceUnit = p.priceUnit || p.price_unit || "piece";
    const costUnit = p.costUnit || p.cost_unit || priceUnit;
    const isSqm = isSqmBasis(priceUnit) || isSqmBasis(costUnit);
    setF(prev => ({ ...prev, items: prev.items.map(i => {
      if (i.id !== itemId) return i;
      const widthM = Number(i.widthM || 1);
      const heightM = Number(i.heightM || 1);
      const pieces = Number(i.pieces || 1);
      return {
        ...i,
        name: p.name,
        unit: isSqm ? "ตร.ม." : p.unit,
        price: p.price,
        costSnapshot: p.cost || 0,
        costUnit,
        priceUnit,
        supplierName: p.supplierName || p.supplier_name || "",
        widthM,
        heightM,
        pieces,
        qty: isSqm ? Number((widthM * heightM * pieces).toFixed(4)) : (Number(i.qty || 1) || 1),
      };
    }) }));
  };

  // ── คำนวณ ────────────────────────────────────────────────
  const { subtotal, discountAmt: discAmt, afterDisc, vatAmt, total, whtAmt, netPay, depositPaid, balanceDue } = calcDocTotal(f, allDocuments);

  // ── เอกสารอ้างอิง (Order linking) ─────────────────────────
  const relatedOrders = (allDocuments || []).filter(d => d.id !== doc.id && d.customerId === f.customerId);

  // ── Styles ───────────────────────────────────────────────
  const card = { background: "#1A2233", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "18px 20px", display: "flex" as const, flexDirection: "column" as const, gap: 14 };
  const sectionBar = (color: string) => ({ width: 4, height: 20, background: color, borderRadius: 2, display: "inline-block", marginRight: 8, flexShrink: 0 });
  const secHead = (num: string, text: string, color = "#FF6B00") => (
    <div style={{ display: "flex", alignItems: "center", fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
      <span style={sectionBar(color)} />
      <span style={{ background: color + "22", color, fontSize: 11, padding: "2px 8px", borderRadius: 99, marginRight: 8 }}>{num}</span>
      {text}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── SECTION 1: ข้อมูลเอกสาร ── */}
      <div style={card}>
        {secHead("1", "ข้อมูลเอกสาร")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <Field label="เลขที่เอกสาร *"><input value={f.docNo} onChange={set("docNo")} /></Field>
          <Field label="วันที่ออกเอกสาร"><input type="date" value={f.date} onChange={set("date")} /></Field>
          <Field label={DOC_TYPES[type]?.prefix === "QT" ? "ยืนยันราคาถึงวันที่" : "วันครบกำหนด"}><input type="date" value={f.dueDate} onChange={set("dueDate")} /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="พนักงานขาย"><input value={f.salesPerson || ""} onChange={set("salesPerson")} placeholder="ชื่อพนักงาน" /></Field>
          <Field label="โครงการ / ชื่องาน"><input value={f.projectName || ""} onChange={set("projectName")} placeholder="ระบุชื่อโครงการ" /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Lead Source (internal only)">
            <select value={f.leadSource || ""} onChange={set("leadSource")}>
              <option value="">-- Select source --</option>
              <option value="Facebook Ads">Facebook Ads</option>
              <option value="LINE OA">LINE OA</option>
              <option value="Website Form">Website Form</option>
              <option value="Google / Organic">Google / Organic</option>
              <option value="Direct">Direct</option>
              <option value="Referral">Referral</option>
              <option value="Phone">Phone</option>
            </select>
          </Field>
          <Field label="Campaign (internal only)">
            <input value={f.marketingCampaign || ""} onChange={set("marketingCampaign")} placeholder="เช่น EN_MSN_Vinyl" />
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Ad Set (internal only)">
            <input value={f.marketingAdSet || ""} onChange={set("marketingAdSet")} placeholder="Ad set / audience" />
          </Field>
          <Field label="Ad / Creative (internal only)">
            <input value={f.marketingAd || ""} onChange={set("marketingAd")} placeholder="Artwork / Hook / Ad name" />
          </Field>
        </div>
        <div style={{ color: "#8B95A7", fontSize: 12, lineHeight: 1.6 }}>
          Internal marketing fields are used for KPI attribution only and will not appear in shared or printed PDF documents.
        </div>
        {/* Order Reference Linking */}
        <Field label="🔗 อ้างอิงเอกสาร (Order เดียวกัน)">
          <select value={f.orderId || ""} onChange={set("orderId")}>
            <option value="">-- ไม่อ้างอิง --</option>
            {relatedOrders.map(d => (
              <option key={d.id} value={d.id}>
                {d.docNo} · {DOC_TYPES[d.type]?.label} · {d.customerName} ({STATUS_LABELS[d.status]})
              </option>
            ))}
          </select>
        </Field>
        {f.orderId && (() => {
          const ref = (allDocuments || []).find(d => d.id === f.orderId);
          if (!ref) return null;
          const linkedDocs = (allDocuments || []).filter(d => d.orderId === f.orderId || d.id === f.orderId);
          return (
            <div style={{ background: "#0B0F19", borderRadius: 8, padding: "10px 14px", fontSize: 12, display: "flex", flexDirection: "column" as const, gap: 6 }}>
              <div style={{ color: "#FF6B00", fontWeight: 700, fontSize: 11, marginBottom: 4 }}>📋 เอกสารในชุดเดียวกัน</div>
              {linkedDocs.map(d => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", color: d.id === f.orderId ? "#fff" : "#A8B0C0" }}>
                  <span>{DOC_TYPES[d.type]?.label} — <span style={{ fontFamily: "monospace", color: DOC_TYPES[d.type]?.color }}>{d.docNo}</span></span>
                  <span style={{ background: STATUS_COLORS[d.status] + "22", color: STATUS_COLORS[d.status], padding: "1px 8px", borderRadius: 99, fontSize: 10 }}>{STATUS_LABELS[d.status]}</span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* ── SECTION 2: ลูกค้า ── */}
      <div style={card}>
        {secHead("2", "ข้อมูลลูกค้า", "#3B82F6")}
        <Field label="ลูกค้า *">
          <select value={f.customerId} onChange={e => setCust(e.target.value)}>
            <option value="">-- เลือกลูกค้า --</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        {f.customerId && (() => {
          const c = customers.find(c => c.id === f.customerId);
          if (!c) return null;
          return (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
              <div style={{ background: "#0B0F19", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#A8B0C0", display: "flex", flexDirection: "column" as const, gap: 4 }}>
                {c.phone && <div>📞 {c.phone}</div>}
                {c.taxId && <div>🪪 เลขผู้เสียภาษี: {c.taxId}</div>}
              </div>
              <Field label="📍 ที่อยู่ในเอกสาร (แก้ไขได้เฉพาะเอกสารนี้)">
                <textarea
                  value={f.overrideAddress !== undefined && f.overrideAddress !== "" ? f.overrideAddress : (c.address || "")}
                  onChange={e => setF(prev => ({ ...prev, overrideAddress: e.target.value }))}
                  rows={3}
                  placeholder={c.address || "ระบุที่อยู่..."}
                  style={{ resize: "vertical", fontFamily: "inherit", fontSize: 12 }}
                />
                {f.overrideAddress && f.overrideAddress !== c.address && (
                  <button onClick={() => setF(prev => ({ ...prev, overrideAddress: "" }))}
                    style={{ marginTop: 4, background: "transparent", border: "none", color: "#6B7280", fontSize: 11, cursor: "pointer", padding: 0, fontFamily: "inherit", textAlign: "left" as const }}>
                    ↩ คืนค่าที่อยู่เดิมของลูกค้า
                  </button>
                )}
              </Field>
            </div>
          );
        })()}
      </div>

      {/* ── SECTION 3: รายการสินค้า ── */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {secHead("3", "รายการสินค้าและบริการ", "#10B981")}
          <Btn onClick={addItem} color={dt.color} small>+ เพิ่มรายการ</Btn>
        </div>

        {f.items.length === 0 && (
          <div style={{ padding: "20px", textAlign: "center", color: "#555", fontSize: 13 }}>กด "+ เพิ่มรายการ" เพื่อเพิ่มสินค้า</div>
        )}

        {f.items.map((item, idx) => (
          <div key={item.id} style={{ background: "#0B0F19", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
            {(() => {
              const basis = itemBillingBasis(item);
              const isSqm = basis === "sqm";
              const widthM = Number(item.widthM || 0);
              const heightM = Number(item.heightM || 0);
              const pieces = Number(item.pieces || 0);
              const area = widthM * heightM * pieces;
              const costCalcQty = lineQtyForBasis(item, item.costUnit || "piece");
              const priceCalcQty = lineQtyForBasis(item, item.priceUnit || "piece");
              return (
                <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: dt.color }}>รายการ #{String(idx + 1).padStart(2, "0")}</span>
              <IconBtn onClick={() => removeItem(item.id)} danger small>🗑 ลบออก</IconBtn>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="รายการหลัก (EN)">
                <div style={{ display: "flex", gap: 6 }}>
                  <select onChange={e => pickProduct(item.id, e.target.value)} style={{ width: 100, fontSize: 11, padding: "4px 6px" }} defaultValue="">
                    <option value="">เลือก</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.supplierName ? `${p.name} — ${p.supplierName}` : p.name}</option>)}
                  </select>
                  <input value={item.name} onChange={e => setItem(item.id, "name", e.target.value)} placeholder="ชื่อรายการ" style={{ flex: 1 }} />
                </div>
              </Field>
              <Field label="รายการรอง (TH)">
                <input value={item.subTitle || ""} onChange={e => setItem(item.id, "subTitle", e.target.value)} placeholder="ชื่อภาษาไทย" />
              </Field>
            </div>
            <Field label="รายละเอียดทางเทคนิค (พิมพ์บรรทัดละหัวข้อ)">
              <textarea value={item.detail || ""} onChange={e => setItem(item.id, "detail", e.target.value)} rows={3} style={{ resize: "vertical", fontFamily: "inherit" }} placeholder={"ขนาด 120 x 300 cm.\nโครงสร้างอลูมิเนียม\nติดตั้งหน้างาน"} />
            </Field>
            {isSqm && (
              <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)", borderRadius: 10, padding: 12 }}>
                <div style={{ color: "#10B981", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>คำนวณพื้นที่งานพิมพ์</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.2fr", gap: 10 }}>
                  <Field label="กว้าง (เมตร)"><input type="number" value={item.widthM ?? 1} onChange={e => setItemDimension(item.id, "widthM", e.target.value)} min="0" step="0.01" style={{ textAlign: "center" }} /></Field>
                  <Field label="สูง (เมตร)"><input type="number" value={item.heightM ?? 1} onChange={e => setItemDimension(item.id, "heightM", e.target.value)} min="0" step="0.01" style={{ textAlign: "center" }} /></Field>
                  <Field label="จำนวนชิ้น"><input type="number" value={item.pieces ?? 1} onChange={e => setItemDimension(item.id, "pieces", e.target.value)} min="0" step="1" style={{ textAlign: "center" }} /></Field>
                  <Field label="พื้นที่รวม (ตร.ม.)"><input type="number" value={item.qty} onChange={e => setItem(item.id, "qty", e.target.value)} min="0" step="0.01" style={{ textAlign: "center", color: "#10B981", fontWeight: 700 }} /></Field>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "#A8B0C0" }}>
                  {fmtMoney(widthM)} x {fmtMoney(heightM)} x {fmtMoney(pieces)} = <strong style={{ color: "#10B981" }}>{fmtMoney(area)} ตร.ม.</strong>
                </div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <Field label={isSqm ? "จำนวนที่คิดเงิน" : "จำนวน"}><input type="number" value={item.qty} onChange={e => setItem(item.id, "qty", e.target.value)} min="0" step="0.01" style={{ textAlign: "center" }} /></Field>
              <Field label="หน่วย"><input value={item.unit} onChange={e => setItem(item.id, "unit", e.target.value)} style={{ textAlign: "center" }} /></Field>
              <Field label={`ต้นทุน (${priceBasisLabel(item.costUnit)})`}>
                <div style={{ position: "relative" }}>
                  <input type="number" value={item.costSnapshot || 0} onChange={e => setItem(item.id, "costSnapshot", e.target.value)} min="0" step="0.01" style={{ textAlign: "right", paddingRight: 36, color: "#ef4444", fontWeight: 700 }} />
                  <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#555" }}>THB</span>
                </div>
              </Field>
              <Field label={`ราคาขาย (${priceBasisLabel(item.priceUnit)})`}>
                <div style={{ position: "relative" }}>
                  <input type="number" value={item.price} onChange={e => setItem(item.id, "price", e.target.value)} min="0" step="0.01" style={{ textAlign: "right", paddingRight: 36 }} />
                  <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#555" }}>THB</span>
                </div>
              </Field>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 14, fontSize: 12, fontWeight: 600, color: "#8B95A7", flexWrap: "wrap" }}>
              <span>จำนวนคิดต้นทุน: {fmtMoney(costCalcQty)} {isSqmBasis(item.costUnit) ? "ตร.ม." : "ชิ้น"}</span>
              <span>จำนวนคิดขาย: {fmtMoney(priceCalcQty)} {isSqmBasis(item.priceUnit) ? "ตร.ม." : "ชิ้น"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 14, fontSize: 13, fontWeight: 700 }}>
              {(item.supplierName || findProductForItem(products, item)?.supplierName) && (
                <span style={{ color: "#F97316" }}>Supplier: {item.supplierName || findProductForItem(products, item)?.supplierName}</span>
              )}
              <span style={{ color: "#ef4444" }}>ต้นทุน: ฿{fmtMoney(lineCost(item))}</span>
              <span style={{ color: dt.color }}>รวม: ฿{fmtMoney(lineAmount(item))}</span>
            </div>
                </>
              );
            })()}
          </div>
        ))}

        {/* ส่วนลด */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12 }}>
          <Field label="ประเภทส่วนลด">
            <select value={f.discountType || "percent"} onChange={(e) => setF(prev => ({ ...prev, discountType: e.target.value, discount: 0 }))} style={{ borderColor: "#FF6B0044", color: "#FF6B00", fontWeight: 700 }}>
              <option value="percent">ลดเป็น %</option>
              <option value="amount">ลดเป็นจำนวนเงิน</option>
            </select>
          </Field>
          <Field label="จำนวนส่วนลด (%)">
            <input type="number" value={f.discount} onChange={setN("discount")} min="0" max={(f.discountType || "percent") === "amount" ? undefined : "100"} step="0.01" placeholder={(f.discountType || "percent") === "amount" ? "เช่น 500" : "เช่น 10"} style={{ borderColor: "#FF6B0044", color: "#FF6B00", fontWeight: 700 }} />
          </Field>
        </div>
      </div>

      {/* ── SECTION 4: ชำระเงิน & หมายเหตุ ── */}
      <div style={card}>
        {secHead("4", "ข้อมูลชำระเงิน & หมายเหตุ", "#8B5CF6")}

        {/* ข้อมูลบัญชี */}
        <Field label="ชื่อบัญชีรับเงิน">
          <input value={f.bankName ?? ""} onChange={set("bankName")} placeholder="ชื่อบัญชีธนาคาร" />
        </Field>
        <Field label="ธนาคาร & สาขา">
          <input value={f.bankBranch ?? ""} onChange={set("bankBranch")} placeholder="เช่น ธนาคารกสิกรไทย สาขาบางบัวทอง" />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="เลขที่บัญชี">
            <input value={f.bankAccount ?? ""} onChange={set("bankAccount")} placeholder="xxx-x-xxxxx-x" />
          </Field>
          <Field label="ประเภทบัญชี">
            <input value={f.bankType ?? ""} onChange={set("bankType")} placeholder="ออมทรัพย์" />
          </Field>
        </div>

        {/* QR Code อัปโหลด */}
        <div>
          <label style={{ fontSize: 12, color: "#A8B0C0", fontWeight: 600, display: "block", marginBottom: 8 }}>
            อัปโหลดรูปภาพ QR CODE ชำระเงิน
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Preview */}
            <div style={{ width: 72, height: 72, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, background: "#0B0F19", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
              {f.qrImage
                ? <img src={f.qrImage} alt="QR" style={{ width: 64, height: 64, objectFit: "contain" }} />
                : <span style={{ fontSize: 28 }}>📷</span>
              }
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, flex: 1 }}>
              <label style={{ cursor: "pointer", background: "rgba(255,107,0,0.1)", border: "1px solid rgba(255,107,0,0.3)", color: "#FF6B00", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, textAlign: "center" as const, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <span>📁</span> เลือกไฟล์รูปภาพ QR Code
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => setF(prev => ({ ...prev, qrImage: ev.target?.result as string }));
                  reader.readAsDataURL(file);
                }} />
              </label>
              {f.qrImage && (
                <button onClick={() => setF(prev => ({ ...prev, qrImage: "" }))}
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  🗑 ลบรูป QR Code
                </button>
              )}
            </div>
          </div>
        </div>

        {/* VAT / WHT */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14, display: "flex", gap: 16, flexWrap: "wrap" as const }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: "#ccc" }}>
            <input type="checkbox" checked={f.vat} onChange={setBool("vat")} style={{ width: "auto" }} />คิด VAT
          </label>
          {f.vat && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="number" value={f.vatRate ?? 7} onChange={setN("vatRate")} min="0" max="100" step="0.01" style={{ width: 80 }} />
              <span style={{ fontSize: 13, color: "#ccc" }}>%</span>
            </div>
          )}
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: "#ccc" }}>
            <input type="checkbox" checked={f.wht} onChange={setBool("wht")} style={{ width: "auto" }} />หัก ณ ที่จ่าย
          </label>
          {f.wht && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="number" value={f.whtRate} onChange={setN("whtRate")} min="0" max="10" style={{ width: 60 }} />
              <span style={{ fontSize: 13, color: "#ccc" }}>%</span>
            </div>
          )}
        </div>

        {type === "receipt" && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="ประเภทการรับชำระ">
              <select value={f.paymentType || "deposit"} onChange={set("paymentType")}>
                <option value="deposit">รับมัดจำ / เงินก้อนแรก</option>
                <option value="partial">รับชำระบางส่วน</option>
                <option value="final">รับชำระปิดยอด</option>
                <option value="full">รับชำระเต็มจำนวน</option>
              </select>
            </Field>
            <Field label="ยอดที่รับชำระในใบเสร็จนี้">
              <input type="number" value={f.paymentAmount || ""} onChange={(e) => {
                const value = Math.max(0, Number(e.target.value || 0) || 0);
                setF(prev => ({ ...prev, paymentAmount: value, depositPaid: value }));
              }} min="0" step="0.01" placeholder="0.00" />
            </Field>
            <Field label="วันที่รับชำระ">
              <input type="date" value={f.paymentDate || f.depositDate || ""} onChange={(e) => {
                setF(prev => ({ ...prev, paymentDate: e.target.value, depositDate: e.target.value }));
              }} />
            </Field>
            <Field label="หมายเหตุการรับชำระ">
              <input value={f.paymentNote || ""} onChange={(e) => {
                setF(prev => ({ ...prev, paymentNote: e.target.value, depositNote: e.target.value }));
              }} placeholder="เช่น รับมัดจำ 50% / รับชำระงวดที่ 1" />
            </Field>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={() => setF(prev => ({ ...prev, paymentType: "deposit", paymentAmount: Number((netPay * 0.5).toFixed(2)), depositPaid: Number((netPay * 0.5).toFixed(2)), paymentDate: prev.paymentDate || today(), depositDate: prev.depositDate || today(), paymentNote: prev.paymentNote || "รับมัดจำ 50%", depositNote: prev.depositNote || "รับมัดจำ 50%" }))}
                style={{ background: "rgba(16,185,129,0.12)", color: "#10B981", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, padding: "8px 12px", fontFamily: "inherit", fontWeight: 700, cursor: "pointer" }}>
                ตั้งมัดจำ 50%
              </button>
              <button type="button" onClick={() => setF(prev => ({ ...prev, paymentType: "full", paymentAmount: Number(netPay.toFixed(2)), depositPaid: Number(netPay.toFixed(2)), paymentDate: prev.paymentDate || today(), depositDate: prev.depositDate || today(), paymentNote: prev.paymentNote || "รับชำระเต็มจำนวน", depositNote: prev.depositNote || "รับชำระเต็มจำนวน" }))}
                style={{ background: "rgba(255,107,0,0.12)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.25)", borderRadius: 8, padding: "8px 12px", fontFamily: "inherit", fontWeight: 700, cursor: "pointer" }}>
                ตั้งชำระเต็มจำนวน
              </button>
              <div style={{ color: "#A8B0C0", fontSize: 12, lineHeight: 1.6, alignSelf: "center" }}>
                ใช้สำหรับ ERP และยอดค้างชำระ ไม่แสดงชื่อ source หรือข้อมูลภายในบน PDF
              </div>
            </div>
          </div>
        )}

        {/* เงินมัดจำ */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="เงินมัดจำที่ลูกค้าชำระแล้ว">
            <input type="number" value={f.depositPaid || 0} onChange={setN("depositPaid")} min="0" step="0.01" placeholder="0.00" />
          </Field>
          <Field label="วันที่รับมัดจำ">
            <input type="date" value={f.depositDate || ""} onChange={set("depositDate")} />
          </Field>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="หมายเหตุมัดจำ">
              <input value={f.depositNote || ""} onChange={set("depositNote")} placeholder="เช่น รับมัดจำ 50% ก่อนเริ่มผลิต / โอนผ่านธนาคาร" />
            </Field>
          </div>
        </div>

        {/* หมายเหตุ */}
        <Field label="หมายเหตุ / เงื่อนไข (ใส่ข้อละ 1 บรรทัด)">
          <textarea value={f.notes} onChange={set("notes")} rows={4} style={{ resize: "vertical", fontFamily: "inherit" }}
            placeholder={"ราคานี้รวมภาษีมูลค่าเพิ่ม 7% แล้ว\nระยะเวลาดำเนินงาน 7-14 วันทำการ\nมัดจำ 50% ก่อนเริ่มงาน"} />
        </Field>
      </div>

      {/* ── Summary ── */}
      <div style={{ background: "#1A2233", borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column" as const, gap: 8 }}>
        <SumRow label="มูลค่ารวม (Subtotal)" value={subtotal} />
        {f.discount > 0 && <SumRow label={(f.discountType || "percent") === "amount" ? "ส่วนลด" : `ส่วนลด ${f.discount}%`} value={-discAmt} />}
        {f.discount > 0 && <SumRow label="หลังหักส่วนลด" value={afterDisc} />}
        {f.vat && <SumRow label={`VAT ${fmtMoney(docVatRate(f))}%`} value={vatAmt} />}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 4, paddingTop: 8 }}>
          <SumRow label="ยอดรวมสุทธิ" value={total} bold color={dt.color} big />
        </div>
        {f.wht && <SumRow label={`หัก ณ ที่จ่าย ${f.whtRate}%`} value={-whtAmt} />}
        {f.wht && <SumRow label="ยอดที่ต้องชำระ" value={netPay} bold color="#10b981" />}
        {depositPaid > 0 && <SumRow label="มัดจำที่ชำระแล้ว" value={-depositPaid} bold color="#10b981" />}
        {depositPaid > 0 && <SumRow label="ยอดคงเหลือที่ต้องชำระ" value={balanceDue} bold color="#FF6B00" big />}
      </div>

      {/* ── Actions ── */}
      <div style={{ display: "flex", gap: 10 }}>
        <Btn onClick={() => onSave(f)} color={dt.color} style={{ flex: 1 }}>💾 บันทึกเอกสาร</Btn>
        <Btn onClick={onCancel} outline style={{ flex: 1 }}>ยกเลิก</Btn>
      </div>
    </div>
  );
}

function MenuBtn({ icon, label, onClick, danger = false, color = "" }: any) {
  return (
    <button onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 16px", background: "transparent", color: danger ? "#ef4444" : color || "#e2e8f0", border: "none", cursor: "pointer", fontSize: 14, fontFamily: "inherit", textAlign: "left" as const, minHeight: 46,
        transition: "background 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.background = danger ? "rgba(239,68,68,0.1)" : color ? color + "18" : "rgba(255,255,255,0.06)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
      <span style={{ fontSize: 14, width: 18, textAlign: "center" as const }}>{icon}</span>
      {label}
    </button>
  );
}

function SumRow({ label, value, bold, color, big }: any) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: big ? 14 : 13, color: "#A8B0C0" }}>{label}</span>
      <span style={{ fontSize: big ? 18 : 13, fontWeight: bold ? 700 : 400, color: color || (value < 0 ? "#ef4444" : "#fff") }}>
        {value < 0 ? "-" : ""}฿{fmtMoney(Math.abs(value))}
      </span>
    </div>
  );
}

function Field({ label, children }: any) { return <div><label>{label}</label>{children}</div>; }

function Btn({ onClick, children, color, outline, small, style }: any) {
  return (
    <button onClick={onClick} style={{
      background: outline ? "transparent" : (color || "#FF6B00"),
      border: `1px solid ${outline ? "rgba(255,255,255,0.15)" : (color || "#FF6B00")}`,
      color: outline ? "#A8B0C0" : "#fff",
      padding: small ? "8px 14px" : "11px 20px",
      borderRadius: 10, fontSize: small ? 13 : 14, fontWeight: 600,
      cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
      minHeight: small ? 40 : 46, ...style,
    }}>
      {children}
    </button>
  );
}

function IconBtn({ onClick, children, danger, small }: any) {
  return (
    <button onClick={onClick} style={{
      background: danger ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)",
      border: `1px solid ${danger ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
      color: danger ? "#ef4444" : "#A8B0C0",
      padding: small ? "6px 10px" : "8px 12px", borderRadius: 8,
      cursor: "pointer", fontSize: small ? 12 : 14, lineHeight: 1, fontFamily: "inherit",
      minHeight: 36, display: "inline-flex", alignItems: "center",
    }}>
      {children}
    </button>
  );
}

function Modal({ title, onClose, children, width = 500 }: any) {
  return (
    <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-panel" style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, width: "100%", maxWidth: width, maxHeight: "88dvh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 90px rgba(0,0,0,0.6)", animation: "scaleIn 0.2s ease", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div style={{ width: 40, height: 4, background: "rgba(255,255,255,0.18)", borderRadius: 99, margin: "12px auto 4px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#aaa", fontSize: 18, cursor: "pointer", width: 34, height: 34, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", padding: "18px 20px", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}




// ─── LOGOUT BUTTON ───────────────────────────────────────────────────────────
function LogoutButton() {
  const router = useRouter();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };
  return (
    <button
      className="admin-logout-btn"
      onClick={handleLogout}
      style={{
        background: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.2)",
        color: "#ef4444",
        padding: "8px 16px",
        borderRadius: 10,
        fontSize: 13,
        cursor: "pointer",
        fontFamily: "inherit",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 6,
        transition: "all 0.15s",
        flexShrink: 0,
        minHeight: 40,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.25)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; }}
    >
      <span>🚪</span> <span className="admin-logout-text">ออกจากระบบ</span>
    </button>
  );
}

// ─── RICH TEXT EDITOR ────────────────────────────────────────────────────────
function RichEditor({ value, onChange, showToast }: { value: string; onChange: (v: string) => void; showToast: any }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // sync ค่าเข้า editor เมื่อเปิดครั้งแรก
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, []);

  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    sync();
  };

  const sync = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const insertImage = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `blog/content-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("cms-media").upload(path, file, { contentType: file.type });
      if (uploadError) { showToast("อัปโหลดไม่ได้: " + uploadError.message, "error"); return; }
      const { data: urlData } = supabase.storage.from("cms-media").getPublicUrl(path);
      const url = urlData?.publicUrl;
      if (!url) { showToast("URL ไม่ถูกต้อง", "error"); return; }
      editorRef.current?.focus();
      document.execCommand("insertHTML", false,
        `<figure style="margin:24px 0;text-align:center"><img src="${url}" alt="" style="max-width:100%;height:auto;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.15)" /><figcaption style="font-size:13px;color:#888;margin-top:8px">คำบรรยายรูปภาพ (แก้ได้)</figcaption></figure>`
      );
      sync();
      showToast("แทรกรูปสำเร็จ ✓");
    } catch (err: any) {
      showToast("เกิดข้อผิดพลาด: " + err?.message, "error");
    }
    setUploading(false);
  };

  const btnStyle = (active = false) => ({
    padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)",
    background: active ? "rgba(255,107,0,0.2)" : "rgba(255,255,255,0.05)",
    color: active ? "#FF6B00" : "#ccc", cursor: "pointer", fontSize: 13,
    fontFamily: "inherit", lineHeight: 1.4, minWidth: 28, textAlign: "center" as const,
    transition: "all 0.15s",
  });

  const divider = { width: 1, background: "rgba(255,255,255,0.1)", margin: "0 4px", alignSelf: "stretch" };

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, overflow: "hidden", background: "#1A2233" }}>
      {/* ─── TOOLBAR ─── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "#141A24", alignItems: "center" }}>
        {/* Heading */}
        <select onChange={e => exec("formatBlock", e.target.value)} defaultValue=""
          style={{ padding: "4px 6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "#1A2233", color: "#ccc", fontSize: 12, cursor: "pointer", height: 28 }}>
          <option value="">ย่อหน้า</option>
          <option value="h1">หัวข้อ 1</option>
          <option value="h2">หัวข้อ 2</option>
          <option value="h3">หัวข้อ 3</option>
          <option value="h4">หัวข้อ 4</option>
          <option value="blockquote">อ้างอิง</option>
        </select>
        <div style={divider} />
        {/* Font size */}
        <select onChange={e => exec("fontSize", e.target.value)} defaultValue="3"
          style={{ padding: "4px 6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "#1A2233", color: "#ccc", fontSize: 12, cursor: "pointer", height: 28, width: 60 }}>
          {["1","2","3","4","5","6","7"].map(s => <option key={s} value={s}>{[10,12,14,16,18,24,32][+s-1]}px</option>)}
        </select>
        <div style={divider} />
        {/* Text style */}
        <button style={btnStyle()} onClick={() => exec("bold")} title="หนา"><b>B</b></button>
        <button style={btnStyle()} onClick={() => exec("italic")} title="เอียง"><i>I</i></button>
        <button style={btnStyle()} onClick={() => exec("underline")} title="ขีดเส้นใต้"><u>U</u></button>
        <button style={btnStyle()} onClick={() => exec("strikeThrough")} title="ขีดทับ"><s>S</s></button>
        <div style={divider} />
        {/* Color */}
        <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", color: "#ccc", fontSize: 12, marginBottom: 0 }}>
          <span>A</span>
          <input type="color" defaultValue="#ffffff" onChange={e => exec("foreColor", e.target.value)}
            style={{ width: 20, height: 20, padding: 0, border: "none", borderRadius: 3, cursor: "pointer", background: "none" }} />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", color: "#ccc", fontSize: 12, marginBottom: 0 }}>
          <span style={{ textDecoration: "underline", textDecorationStyle: "solid", textDecorationColor: "#FF6B00" }}>HL</span>
          <input type="color" defaultValue="#FF6B00" onChange={e => exec("hiliteColor", e.target.value)}
            style={{ width: 20, height: 20, padding: 0, border: "none", borderRadius: 3, cursor: "pointer", background: "none" }} />
        </label>
        <div style={divider} />
        {/* Align */}
        <button style={btnStyle()} onClick={() => exec("justifyLeft")} title="ชิดซ้าย">⬅</button>
        <button style={btnStyle()} onClick={() => exec("justifyCenter")} title="กึ่งกลาง">≡</button>
        <button style={btnStyle()} onClick={() => exec("justifyRight")} title="ชิดขวา">➡</button>
        <div style={divider} />
        {/* List */}
        <button style={btnStyle()} onClick={() => exec("insertUnorderedList")} title="รายการ">• ≡</button>
        <button style={btnStyle()} onClick={() => exec("insertOrderedList")} title="รายการตัวเลข">1. ≡</button>
        <div style={divider} />
        {/* Link */}
        <button style={btnStyle()} onClick={() => {
          const url = prompt("URL ลิงก์:", "https://");
          if (url) exec("createLink", url);
        }} title="แทรกลิงก์">🔗</button>
        <button style={btnStyle()} onClick={() => exec("unlink")} title="ลบลิงก์">🚫</button>
        <div style={divider} />
        {/* Image */}
        <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={e => e.target.files?.[0] && insertImage(e.target.files[0])} />
        <button style={{ ...btnStyle(), color: uploading ? "#888" : "#60A5FA", display: "flex", alignItems: "center", gap: 4 }}
          onClick={() => imgRef.current?.click()} disabled={uploading} title="แทรกรูปภาพ">
          {uploading ? "⏳" : "🖼️"} <span style={{ fontSize: 11 }}>แทรกรูป</span>
        </button>
        <div style={divider} />
        {/* Undo/Redo */}
        <button style={btnStyle()} onClick={() => exec("undo")} title="ย้อนกลับ">↩</button>
        <button style={btnStyle()} onClick={() => exec("redo")} title="ทำซ้ำ">↪</button>
        <button style={{ ...btnStyle(), marginLeft: "auto", color: "#ef4444" }}
          onClick={() => { if (confirm("ล้างเนื้อหาทั้งหมด?")) { if(editorRef.current) editorRef.current.innerHTML = ""; sync(); } }}
          title="ล้างทั้งหมด">🗑️</button>
      </div>

      {/* ─── EDITOR AREA ─── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        style={{
          minHeight: 320, padding: "16px 20px", color: "#e2e8f0", fontSize: 14,
          lineHeight: 1.8, outline: "none", fontFamily: "'Prompt', sans-serif",
          background: "#1A2233",
        }}
      />

      {/* ─── EDITOR STYLES ─── */}
      <style>{`
        [contenteditable] h1 { font-size: 2em; font-weight: 800; margin: 1em 0 0.5em; color: #fff; }
        [contenteditable] h2 { font-size: 1.5em; font-weight: 700; margin: 1em 0 0.5em; color: #fff; border-bottom: 2px solid rgba(255,107,0,0.3); padding-bottom: 4px; }
        [contenteditable] h3 { font-size: 1.2em; font-weight: 600; margin: 1em 0 0.5em; color: #fff; }
        [contenteditable] h4 { font-size: 1em; font-weight: 600; margin: 0.8em 0 0.4em; color: #FF6B00; }
        [contenteditable] p { margin: 0 0 1em; }
        [contenteditable] blockquote { border-left: 4px solid #FF6B00; padding: 8px 16px; margin: 16px 0; background: rgba(255,107,0,0.05); border-radius: 0 8px 8px 0; color: #A8B0C0; font-style: italic; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 24px; margin: 0 0 1em; }
        [contenteditable] li { margin-bottom: 4px; }
        [contenteditable] a { color: #60A5FA; text-decoration: underline; }
        [contenteditable] figure { margin: 24px 0; text-align: center; }
        [contenteditable] figure img { max-width: 100%; border-radius: 10px; }
        [contenteditable] figcaption { font-size: 13px; color: #888; margin-top: 8px; }
        [contenteditable]:empty:before { content: "เริ่มพิมพ์เนื้อหาบทความที่นี่... รองรับการจัดรูปแบบ หัวข้อ รูปภาพ ลิงก์"; color: #444; }
      `}</style>
    </div>
  );
}

function BlogManager({ showToast }: any) {
  const [posts, setPosts] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // โหลดบทความจาก Supabase
  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setPosts((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const save = async (p) => {
    // แปลง tags จาก string "a,b,c" → array ["a","b","c"]
    const tagsArray = Array.isArray(p.tags)
      ? p.tags
      : (p.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean);

    const postData = {
      title: p.title, excerpt: p.excerpt, category: p.category,
      date: p.date, slug: p.slug, cover: p.cover, cover_alt: p.cover_alt || "",
      published: p.published, body: p.body,
      seo_title: p.seo_title || "", meta_desc: p.meta_desc || "",
      focus_keyword: p.focus_keyword || "", author: p.author || "Display Works Media",
      last_updated: new Date().toISOString().slice(0, 10),
      tags: tagsArray, ai_summary: p.ai_summary || "",
      key_takeaways: p.key_takeaways || "",
      faqs: Array.isArray(p.faqs) ? p.faqs : [],
      related_services: Array.isArray(p.related_services) ? p.related_services : [],
    };

    if (p.id) {
      // อัปเดต
      const { error } = await supabase.from("posts").update(postData).eq("id", p.id);
      if (error) { showToast("เกิดข้อผิดพลาด: " + error.message, "error"); return; }
      showToast("บันทึกบทความแล้ว");
      await revalidateBlog(p.slug);
    } else {
      // เพิ่มใหม่
      const { error } = await supabase.from("posts").insert(postData);
      if (error) { showToast("เกิดข้อผิดพลาด: " + error.message, "error"); return; }
      showToast("เพิ่มบทความใหม่แล้ว");
      await revalidateBlog(p.slug);
    }
    setEditing(null);
    fetchPosts();
  };


  // ── revalidate เว็บทันทีหลัง save/delete ──
  const revalidateBlog = async (slug?: string) => {
    try {
      await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, secret: process.env.NEXT_PUBLIC_REVALIDATE_SECRET || "" }),
      });
    } catch {
      // revalidate ล้มเหลวไม่ให้ block UX
    }
  };
  const del = async (id) => {
    if (!confirm("ลบบทความนี้?")) return;
    const postToDelete = posts.find(p => p.id === id);
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) { showToast("ลบไม่สำเร็จ", "error"); return; }
    showToast("ลบบทความแล้ว");
    await revalidateBlog(postToDelete?.slug);
    fetchPosts();
  };

  const filtered = posts.filter(p =>
    [p.title, p.category, p.excerpt].some((value) => String(value || "").includes(search))
  );

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>จัดการบทความ</h2>
          <p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{posts.length} บทความ</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ค้นหา..." style={{ width: 200 }} />
          <CBtn onClick={() => setEditing({ id: "", title: "", excerpt: "", category: "", date: new Date().toISOString().slice(0,10), slug: "", cover: "", cover_alt: "", published: true, body: "", seo_title: "", meta_desc: "", focus_keyword: "", author: "Display Works Media", last_updated: "", tags: "", ai_summary: "", key_takeaways: "", faqs: [], related_services: [] })} color="#FF6B00">+ เพิ่มบทความ</CBtn>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(p => (
          <div key={p.id} style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
            {/* Cover */}
            <div style={{ width: 80, height: 60, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#1A2233", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {p.cover ? <img src={p.cover} alt={p.cover_alt || p.title || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24 }}>📄</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</span>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: p.published ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.2)", color: p.published ? "#10b981" : "#6b7280" }}>
                  {p.published ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#555" }}>{p.category} · {fmtDate(p.date)}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.excerpt}</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <CIconBtn onClick={() => setEditing({ ...p })}>✏️</CIconBtn>
              <CIconBtn onClick={() => del(p.id)} danger>🗑️</CIconBtn>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <EmptyState icon="📝" text="ยังไม่มีบทความ" />}
      </div>

      {editing && (
        <CModal title={editing.id ? "แก้ไขบทความ" : "เพิ่มบทความใหม่"} onClose={() => setEditing(null)} width={700}>
          <BlogForm data={editing} onSave={save} onCancel={() => setEditing(null)} showToast={showToast} />
        </CModal>
      )}
    </div>
  );
}

function BlogForm({ data, onSave, onCancel, showToast }: any) {
  const [f, setF] = useState({
    seo_title: "", meta_desc: "", focus_keyword: "", author: "Display Works Media",
    last_updated: "", tags: "", ai_summary: "", key_takeaways: "", cover_alt: "",
    ...data,
    faqs: Array.isArray(data.faqs) ? data.faqs : [],
    related_services: Array.isArray(data.related_services) ? data.related_services : [],
  });
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const fileRef = useRef<HTMLInputElement>(null);
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));

  const SERVICE_OPTIONS = [
    { value: "vinyl-banner", label: "รับทำป้ายไวนิล" },
    { value: "roll-up", label: "รับทำ Roll Up" },
    { value: "backdrop", label: "รับทำ Backdrop" },
    { value: "sticker", label: "รับทำสติ๊กเกอร์" },
    { value: "pp-board", label: "รับทำ PP Board" },
    { value: "label-sticker", label: "รับทำฉลากสินค้า" },
    { value: "x-stand", label: "รับทำ X-Stand" },
    { value: "standee", label: "รับทำ Standee" },
  ];

  const AUTHOR_OPTIONS = ["Display Works Media", "Editorial Team", "Tadthep Sukthum"];

  const uploadCover = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `blog/${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("cms-media").upload(path, file, { contentType: file.type });
      if (uploadError) { showToast("อัปโหลดไม่ได้: " + uploadError.message, "error"); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("cms-media").getPublicUrl(path);
      if (!urlData?.publicUrl) { showToast("ได้รูปแล้วแต่ URL ไม่ถูกต้อง", "error"); setUploading(false); return; }
      setF(p => ({ ...p, cover: urlData.publicUrl }));
      showToast("อัปโหลดรูปสำเร็จ ✓");
    } catch (err: any) { showToast("เกิดข้อผิดพลาด: " + (err?.message || err), "error"); }
    setUploading(false);
  };

  const genSlug = () => {
    const slug = f.title.toLowerCase().replace(/[^a-z0-9ก-๙\s]/g, "").replace(/\s+/g, "-").slice(0, 60);
    setF(p => ({ ...p, slug }));
  };

  const toggleService = (val: string) => {
    const arr: string[] = Array.isArray(f.related_services) ? f.related_services : [];
    setF(p => ({ ...p, related_services: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }));
  };

  const addFaq = () => setF(p => ({ ...p, faqs: [...(Array.isArray(p.faqs) ? p.faqs : []), { q: "", a: "" }] }));
  const setFaq = (i: number, field: "q" | "a", val: string) => {
    const faqs = [...(Array.isArray(f.faqs) ? f.faqs : [])];
    faqs[i] = { ...faqs[i], [field]: val };
    setF(p => ({ ...p, faqs }));
  };
  const removeFaq = (i: number) => setF(p => ({ ...p, faqs: (Array.isArray(p.faqs) ? p.faqs : []).filter((_, idx) => idx !== i) }));

  // SEO Score calculation
  const seoScore = (() => {
    let score = 0;
    const checks = [
      { ok: !!f.seo_title, label: "มี SEO Title" },
      { ok: !!f.meta_desc, label: "มี Meta Description" },
      { ok: !!f.focus_keyword, label: "มี Focus Keyword" },
      { ok: Array.isArray(f.faqs) && f.faqs.length > 0, label: "มี FAQ" },
      { ok: Array.isArray(f.related_services) && f.related_services.length > 0, label: "มี Internal Links" },
      { ok: !!f.ai_summary, label: "มี AI Summary" },
      { ok: !!f.cover, label: "มีรูป Cover" },
      { ok: !!f.cover_alt, label: "มี Alt Text รูป Cover" },
      { ok: !!f.excerpt, label: "มี Excerpt" },
      { ok: !!f.tags, label: "มี Tags" },
      { ok: !!f.author, label: "มี Author" },
    ];
    checks.forEach(c => { if (c.ok) score += 10; });
    return { score: Math.min(score, 100), checks };
  })();

  const tabs = [
    { id: "general", label: "📝 ทั่วไป" },
    { id: "seo", label: "🔍 SEO" },
    { id: "ai", label: "🤖 AI Search" },
    { id: "publish", label: "🚀 เผยแพร่" },
  ];

  const inputStyle = { width: "100%", background: "#1A2233", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" as const };
  const labelStyle = { fontSize: 11, color: "#A8B0C0", display: "block", marginBottom: 5, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em" };
  const fieldStyle = { display: "flex", flexDirection: "column" as const, gap: 4 };
  const charCountStyle = (len: number, max: number) => ({ fontSize: 11, color: len > max ? "#ef4444" : "#6B7280", textAlign: "right" as const, marginTop: 2 });

  return (
    <div style={{ display: "flex", gap: 0, minHeight: 500 }}>
      {/* Sidebar Tabs */}
      <div style={{ width: 130, background: "#0D1320", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: 2, padding: "12px 8px", flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ background: activeTab === t.id ? "rgba(255,107,0,0.15)" : "transparent", border: activeTab === t.id ? "1px solid rgba(255,107,0,0.3)" : "1px solid transparent", borderRadius: 8, padding: "10px 8px", color: activeTab === t.id ? "#FF6B00" : "#888", fontSize: 12, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.15s" }}>
            {t.label}
          </button>
        ))}
        {/* SEO Score in sidebar */}
        <div style={{ marginTop: "auto", paddingTop: 16 }}>
          <div style={{ fontSize: 10, color: "#555", marginBottom: 4, textAlign: "center" }}>SEO Score</div>
          <div style={{ textAlign: "center", fontSize: 22, fontWeight: 700, color: seoScore.score >= 80 ? "#10b981" : seoScore.score >= 50 ? "#f59e0b" : "#ef4444" }}>
            {seoScore.score}<span style={{ fontSize: 11, color: "#555" }}>/100</span>
          </div>
          <div style={{ height: 4, background: "#1A2233", borderRadius: 99, overflow: "hidden", marginTop: 6 }}>
            <div style={{ height: "100%", width: `${seoScore.score}%`, background: seoScore.score >= 80 ? "#10b981" : seoScore.score >= 50 ? "#f59e0b" : "#ef4444", transition: "width 0.3s" }} />
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto", maxHeight: 580 }}>

        {/* ── TAB: GENERAL ── */}
        {activeTab === "general" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Cover */}
            <div style={fieldStyle}>
              <label style={labelStyle}>รูป Cover บทความ</label>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 140, height: 88, borderRadius: 8, overflow: "hidden", background: "#1A2233", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {f.cover ? <img src={f.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 28, opacity: 0.4 }}>🖼️</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => uploadCover(e.target.files?.[0])} />
                  <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...inputStyle, width: "auto", padding: "8px 14px", cursor: "pointer", background: "#3B82F6", border: "none", fontWeight: 600 }}>
                    {uploading ? "⏳ กำลังอัปโหลด..." : "📁 เลือกรูปภาพ"}
                  </button>
                  <input value={f.cover} onChange={set("cover")} placeholder="หรือวาง URL รูปภาพ" style={{ ...inputStyle, fontSize: 12 }} />
                  <input value={f.cover_alt} onChange={set("cover_alt")} placeholder="Alt Text รูป Cover เช่น ป้ายไวนิลหน้าร้านอาหาร Display Works Media" style={{ ...inputStyle, fontSize: 12 }} />
                  <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.5 }}>
                    ใช้อธิบายรูปให้ Google และผู้ใช้ที่ใช้ Screen Reader เห็นความหมายของภาพ
                  </div>
                </div>
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>หัวข้อบทความ *</label>
              <input value={f.title} onChange={set("title")} onBlur={genSlug} placeholder="หัวข้อบทความ" style={inputStyle} />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Slug (URL)</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={f.slug} onChange={set("slug")} placeholder="url-slug" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={genSlug} style={{ ...inputStyle, width: "auto", padding: "8px 14px", cursor: "pointer", background: "#374151", border: "none", flexShrink: 0 }}>สร้างอัตโนมัติ</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>หมวดหมู่</label>
                <input value={f.category} onChange={set("category")} list="cat-list" placeholder="เช่น ป้ายไวนิล" style={inputStyle} />
                <datalist id="cat-list">{Array.from(new Set([...blogCategories.map(c => c.name), "ป้ายไวนิล","สติ๊กเกอร์","Roll Up","Backdrop","PP Board","ฉลากสินค้า","ทั่วไป"])).map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>วันที่เผยแพร่</label>
                <input type="date" value={f.date} onChange={set("date")} style={inputStyle} />
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>บทสรุป (Excerpt)</label>
              <textarea value={f.excerpt} onChange={set("excerpt")} rows={3} placeholder="อธิบายสั้นๆ ว่าบทความนี้เกี่ยวกับอะไร..." style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>เนื้อหาบทความ</label>
              <RichEditor value={f.body} onChange={val => setF(p => ({ ...p, body: val }))} showToast={showToast} />
            </div>
          </div>
        )}

        {/* ── TAB: SEO ── */}
        {activeTab === "seo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* SEO Score Checklist */}
            <div style={{ background: "#0D1320", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>SEO Checklist</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {seoScore.checks.map((c, i) => (
                  <div key={i} style={{ fontSize: 12, color: c.ok ? "#10b981" : "#6B7280", display: "flex", gap: 6, alignItems: "center" }}>
                    <span>{c.ok ? "✅" : "❌"}</span> {c.label}
                  </div>
                ))}
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>SEO Title <span style={{ color: "#6B7280", fontWeight: 400 }}>(แสดงบน Google)</span></label>
              <input value={f.seo_title} onChange={set("seo_title")} placeholder="ป้ายไวนิลคืออะไร? | Display Works Media" style={inputStyle} maxLength={70} />
              <div style={charCountStyle((f.seo_title || "").length, 60)}>{(f.seo_title || "").length}/60 ตัวอักษร</div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Meta Description</label>
              <textarea value={f.meta_desc} onChange={set("meta_desc")} rows={3} placeholder="คำอธิบายที่แสดงใน Google Search..." style={{ ...inputStyle, resize: "vertical" }} maxLength={170} />
              <div style={charCountStyle((f.meta_desc || "").length, 160)}>{(f.meta_desc || "").length}/160 ตัวอักษร</div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Focus Keyword</label>
              <input value={f.focus_keyword} onChange={set("focus_keyword")} placeholder="เช่น รับทำป้ายไวนิล" style={inputStyle} />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Author <span style={{ color: "#6B7280", fontWeight: 400 }}>(E-E-A-T)</span></label>
              <select value={f.author} onChange={set("author")} style={inputStyle}>
                {AUTHOR_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Tags <span style={{ color: "#6B7280", fontWeight: 400 }}>(คั่นด้วยจุลภาค)</span></label>
              <input value={f.tags} onChange={set("tags")} placeholder="ป้ายไวนิล, SME, ร้านอาหาร, โฆษณา" style={inputStyle} />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Related Services <span style={{ color: "#6B7280", fontWeight: 400 }}>(Internal Links)</span></label>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                {SERVICE_OPTIONS.map(s => {
                  const arr: string[] = Array.isArray(f.related_services) ? f.related_services : [];
                  const checked = arr.includes(s.value);
                  return (
                    <label key={s.value} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, padding: "6px 12px", borderRadius: 99, border: `1px solid ${checked ? "#FF6B00" : "rgba(255,255,255,0.1)"}`, background: checked ? "rgba(255,107,0,0.1)" : "transparent", color: checked ? "#FF6B00" : "#888", transition: "all 0.15s" }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleService(s.value)} style={{ display: "none" }} />
                      {checked ? "☑" : "☐"} {s.label}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: AI SEARCH ── */}
        {activeTab === "ai" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: 12, fontSize: 12, color: "#a5b4fc" }}>
              🤖 ฟิลด์เหล่านี้ช่วยให้ Google AI Overview, ChatGPT, Gemini และ Perplexity อ้างอิงบทความของคุณได้
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>AI Summary <span style={{ color: "#6B7280", fontWeight: 400 }}>(50-150 คำ)</span></label>
              <textarea value={f.ai_summary} onChange={set("ai_summary")} rows={5} placeholder="สรุปบทความสำหรับ AI เช่น: ป้ายไวนิลเป็นสื่อโฆษณาที่ได้รับความนิยมสำหรับธุรกิจ SME..." style={{ ...inputStyle, resize: "vertical" }} />
              <div style={charCountStyle(0, 0)}>{(f.ai_summary || "").split(/\s+/).filter(Boolean).length} คำ</div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Key Takeaways <span style={{ color: "#6B7280", fontWeight: 400 }}>(แต่ละบรรทัด = 1 ประเด็น)</span></label>
              <textarea value={f.key_takeaways} onChange={set("key_takeaways")} rows={4} placeholder={"ป้ายไวนิลเหมาะกับงานกลางแจ้ง\nควรเลือกความหนาตามลักษณะการใช้งาน\nไวนิล 400 แกรมทนทานกว่า 360 แกรม"} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>FAQ Builder <span style={{ color: "#6B7280", fontWeight: 400 }}>(สร้าง FAQ Schema อัตโนมัติ)</span></label>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(Array.isArray(f.faqs) ? f.faqs : []).map((faq: any, i: number) => (
                  <div key={i} style={{ background: "#0D1320", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 700 }}>FAQ #{i + 1}</span>
                      <button onClick={() => removeFaq(i)} style={{ background: "rgba(239,68,68,0.15)", border: "none", color: "#ef4444", borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontSize: 11 }}>ลบ</button>
                    </div>
                    <input value={faq.q} onChange={e => setFaq(i, "q", e.target.value)} placeholder="คำถาม เช่น สั่งขั้นต่ำเท่าไหร่?" style={{ ...inputStyle, fontSize: 12 }} />
                    <textarea value={faq.a} onChange={e => setFaq(i, "a", e.target.value)} rows={2} placeholder="คำตอบ..." style={{ ...inputStyle, fontSize: 12, resize: "vertical" }} />
                  </div>
                ))}
                <button onClick={addFaq} style={{ ...inputStyle, width: "auto", padding: "10px", cursor: "pointer", background: "rgba(99,102,241,0.1)", border: "1px dashed rgba(99,102,241,0.3)", color: "#a5b4fc", textAlign: "center" as const }}>
                  + เพิ่มคำถาม FAQ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: PUBLISH ── */}
        {activeTab === "publish" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#0D1320", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 16 }}>
              <input type="checkbox" id="published" checked={f.published} onChange={e => setF(p => ({ ...p, published: e.target.checked }))} style={{ width: 18, height: 18, cursor: "pointer" }} />
              <div>
                <label htmlFor="published" style={{ fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#fff" }}>เผยแพร่บทความนี้</label>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>บทความจะแสดงบนเว็บไซต์ทันทีหลังบันทึก</div>
              </div>
              <span style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: f.published ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.2)", color: f.published ? "#10b981" : "#6b7280" }}>
                {f.published ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
              </span>
            </div>

            <div style={{ background: "#0D1320", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📊 สรุปก่อนบันทึก</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "หัวข้อ", value: f.title || "-" },
                  { label: "Slug", value: f.slug || "-" },
                  { label: "SEO Title", value: f.seo_title || <span style={{ color: "#ef4444" }}>ยังไม่กรอก</span> },
                  { label: "Meta Desc", value: f.meta_desc ? `${(f.meta_desc).slice(0, 50)}...` : <span style={{ color: "#ef4444" }}>ยังไม่กรอก</span> },
                  { label: "Cover Alt", value: f.cover_alt || <span style={{ color: "#f59e0b" }}>ยังไม่กรอก</span> },
                  { label: "Focus KW", value: f.focus_keyword || <span style={{ color: "#f59e0b" }}>ยังไม่กรอก</span> },
                  { label: "FAQ", value: `${Array.isArray(f.faqs) ? f.faqs.length : 0} ข้อ` },
                  { label: "SEO Score", value: `${seoScore.score}/100` },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, fontSize: 12 }}>
                    <span style={{ color: "#6B7280", width: 90, flexShrink: 0 }}>{row.label}</span>
                    <span style={{ color: "#ccc" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => onSave(f)} style={{ flex: 1, padding: "12px", background: "#FF6B00", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>💾 บันทึก</button>
              <button onClick={onCancel} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#888", fontSize: 14, cursor: "pointer" }}>ยกเลิก</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// HERO MANAGER
// ============================================================
function HeroManager({ showToast }: any) {
  const [hero, setHero] = useState(() => loadLocal("hero", {
    headline1: "ผลิตสื่อโฆษณา",
    headlineHighlight: "ครบวงจร",
    headline2: "",
    subtitle: "ออกแบบ ผลิต ติดตั้ง งานป้าย ร้านค้า และสื่อโฆษณาทุกประเภท พร้อมทีมงานมืออาชีพดูแลตลอดกระบวนการ",
    trustPoints: ["ออกแบบ ผลิต ติดตั้ง ครบจบในที่เดียว", "บริการหลังการขายครบวงจร", "จัดส่งทั่วประเทศ พร้อมแจ้งเลขพัสดุ"],
    phone: "065-916-1539",
    lineUrl: "https://lin.ee/O0nPl03",
    bgImage: "/images/hero-bg.jpg",
  }));
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = k => e => setHero(p => ({ ...p, [k]: e.target.value }));
  useEffect(() => {
    let alive = true;
    loadCmsSetting("hero", hero).then((value) => {
      if (alive) setHero(value);
    });
    return () => { alive = false; };
  }, []);

  const uploadBg = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `hero/bg-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("cms-media").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("cms-media").getPublicUrl(path);
      setHero(p => ({ ...p, bgImage: urlData.publicUrl }));
      showToast("อัปโหลดรูปพื้นหลังสำเร็จ");
    } catch {
      showToast("ตรวจสอบ Supabase Storage bucket ชื่อ cms-media", "error");
    }
    setUploading(false);
  };

  const setTrust = (i, val) => {
    const arr = [...hero.trustPoints];
    arr[i] = val;
    setHero(p => ({ ...p, trustPoints: arr }));
  };
  const addTrust = () => setHero(p => ({ ...p, trustPoints: [...p.trustPoints, ""] }));
  const delTrust = (i) => setHero(p => ({ ...p, trustPoints: p.trustPoints.filter((_, idx) => idx !== i) }));

  const save = async () => {
    try {
      await saveCmsSetting("hero", hero);
      showToast("บันทึก Hero Section แล้ว");
    } catch (error: any) {
      showToast("บันทึกไม่ได้: " + error.message, "error");
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 680 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>แก้ไข Hero Section</h2>
      <Card>
        <SectionTitle>รูปพื้นหลัง</SectionTitle>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ width: 200, height: 110, borderRadius: 10, overflow: "hidden", background: "#1A2233", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0, position: "relative" }}>
            {hero.bgImage && <img src={hero.bgImage.startsWith("/") ? hero.bgImage : hero.bgImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => (e.target as HTMLImageElement).style.display="none"} />}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 28, opacity: 0.3 }}>🖼️</span>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => uploadBg(e.target.files?.[0])} />
            <CBtn onClick={() => fileRef.current?.click()} color="#3B82F6" small disabled={uploading}>
              {uploading ? "⏳ กำลังอัปโหลด..." : "📁 เปลี่ยนรูปพื้นหลัง"}
            </CBtn>
            <input value={hero.bgImage} onChange={set("bgImage")} placeholder="หรือวาง URL รูปภาพ" />
          </div>
        </div>

        <SectionTitle>ข้อความหลัก</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          <CField label="บรรทัดที่ 1"><input value={hero.headline1} onChange={set("headline1")} /></CField>
          <CField label="ข้อความสีส้ม (highlight)"><input value={hero.headlineHighlight} onChange={set("headlineHighlight")} /></CField>
          <CField label="บรรทัดที่ 3 (ไม่บังคับ)"><input value={hero.headline2} onChange={set("headline2")} /></CField>
          <CField label="คำอธิบาย (subtitle)"><textarea value={hero.subtitle} onChange={set("subtitle")} rows={3} /></CField>
        </div>

        <SectionTitle>จุดเด่น (Trust Points)</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {hero.trustPoints.map((tp, i) => (
            <div key={i} style={{ display: "flex", gap: 8 }}>
              <input value={tp} onChange={e => setTrust(i, e.target.value)} style={{ flex: 1 }} />
              <CIconBtn onClick={() => delTrust(i)} danger small>✕</CIconBtn>
            </div>
          ))}
          <CBtn onClick={addTrust} small outline>+ เพิ่มจุดเด่น</CBtn>
        </div>

        <SectionTitle>ข้อมูลติดต่อ (Hero)</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <CField label="เบอร์โทร"><input value={hero.phone} onChange={set("phone")} /></CField>
          <CField label="LINE URL"><input value={hero.lineUrl} onChange={set("lineUrl")} /></CField>
        </div>

        <CBtn onClick={save} color="#FF6B00">💾 บันทึก Hero Section</CBtn>
      </Card>
    </div>
  );
}

// ============================================================
// SERVICES MANAGER
// ============================================================
function ServicesManager({ showToast }: any) {
  const [services, setServices] = useState(() => loadLocal("services", [
    { id: "1", name: "ป้ายไวนิล", icon: "🪟", desc: "พิมพ์งานคุณภาพสูง ทนต่อแสงและฝน เหมาะสำหรับป้ายหน้าร้าน ป้ายโฆษณา ขนาดใหญ่", price: "ตร.ม.ละ 200฿", url: "/services/vinyl-banner" },
    { id: "2", name: "สติ๊กเกอร์", icon: "🏷️", desc: "สติ๊กเกอร์กันน้ำ indoor/outdoor พิมพ์สี 4 สี คมชัด ติดทนนาน", price: "ตร.ม.ละ 350฿", url: "/services/label-sticker" },
    { id: "3", name: "PP Board", icon: "📋", desc: "ป้ายพีพีบอร์ดน้ำหนักเบา พกพาง่าย เหมาะสำหรับงาน Event และป้ายชั่วคราว", price: "แผ่นละ 400฿", url: "/services/pp-board" },
    { id: "4", name: "Roll Up", icon: "🎪", desc: "ป้าย Roll Up สำหรับงานนิทรรศการ ประชุม และงานกิจกรรมต่างๆ", price: "ชิ้นละ 2,200฿", url: "/services/roll-up" },
    { id: "5", name: "Backdrop", icon: "🖼", desc: "ป้าย Backdrop ขนาดใหญ่สำหรับงานอีเวนต์ ถ่ายรูป และงานแถลงข่าว", price: "ชุดละ 3,500฿", url: "/services/backdrop" },
    { id: "6", name: "ฉลากสินค้า", icon: "🏷", desc: "พิมพ์ฉลากสินค้าคุณภาพสูง ทั้งแบบม้วนและแผ่น รองรับทุกขนาด", price: "100 ชิ้นละ 400฿", url: "/services/label-sticker" },
  ]));
  const [editing, setEditing] = useState<any>(null);
  const [pageContent, setPageContent] = useState<any>(defaultPageContent);
  const [servicePortfolioUploading, setServicePortfolioUploading] = useState("");
  useEffect(() => {
    let alive = true;
    loadCmsSetting("services", services).then((value) => {
      if (alive) setServices(value);
    });
    loadCmsSetting("page_content", defaultPageContent).then((value) => {
      if (alive) setPageContent(value || defaultPageContent);
    });
    return () => { alive = false; };
  }, []);

  const serviceKeyFromService = (service: any) => {
    const id = String(service?.id || "");
    const url = String(service?.url || "").toLowerCase();
    const name = String(service?.name || "").toLowerCase();
    if (id === "1" || url.includes("vinyl")) return "vinyl";
    if (id === "3" || url.includes("pp-board") || url.includes("ppboard") || name.includes("pp")) return "ppboard";
    if (id === "4" || url.includes("roll") || url.includes("x-stand")) return "rollup";
    if (id === "5" || url.includes("backdrop")) return "backdrop";
    if (id === "6" || name.includes("ฉลาก") || url.includes("label")) return "label";
    if (id === "2" || url.includes("sticker") || name.includes("sticker") || name.includes("สติ๊ก")) return "sticker";
    return "";
  };

  const servicePortfolioItems = (serviceKey: string) => {
    if (!serviceKey) return [];
    const items = pageContent?.servicesDetail?.[serviceKey]?.portfolioItems;
    return Array.isArray(items) && items.length > 0 ? items : (defaultServicePortfolioItems[serviceKey] || []);
  };

  const updateServicePortfolioItem = (serviceKey: string, index: number, key: string, value: string) => {
    const currentItems = servicePortfolioItems(serviceKey);
    const nextItems = currentItems.map((item: any, itemIndex: number) =>
      itemIndex === index ? { ...item, [key]: value } : item
    );
    setPageContent((current: any) => ({
      ...current,
      servicesDetail: {
        ...current.servicesDetail,
        [serviceKey]: {
          ...(current.servicesDetail?.[serviceKey] || {}),
          portfolioItems: nextItems,
        },
      },
    }));
  };

  const addServicePortfolioItem = (serviceKey: string, service: any) => {
    const category = service?.name || "ผลงานบริการ";
    const currentItems = servicePortfolioItems(serviceKey);
    setPageContent((current: any) => ({
      ...current,
      servicesDetail: {
        ...current.servicesDetail,
        [serviceKey]: {
          ...(current.servicesDetail?.[serviceKey] || {}),
          portfolioItems: [
            ...currentItems,
            { title: "ผลงานใหม่", category, image: "", alt: "", meta: "", href: service?.url || "" },
          ],
        },
      },
    }));
  };

  const deleteServicePortfolioItem = (serviceKey: string, index: number) => {
    const currentItems = servicePortfolioItems(serviceKey);
    setPageContent((current: any) => ({
      ...current,
      servicesDetail: {
        ...current.servicesDetail,
        [serviceKey]: {
          ...(current.servicesDetail?.[serviceKey] || {}),
          portfolioItems: currentItems.filter((_: any, itemIndex: number) => itemIndex !== index),
        },
      },
    }));
  };

  const uploadServicePortfolioImage = async (serviceKey: string, index: number, file?: File) => {
    if (!file || !serviceKey) return;
    const uploadKey = `${serviceKey}-${index}`;
    setServicePortfolioUploading(uploadKey);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `service-portfolio/${serviceKey}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("cms-media").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("cms-media").getPublicUrl(path);
      updateServicePortfolioItem(serviceKey, index, "image", urlData.publicUrl);
      showToast("อัปโหลดรูปผลงานสำเร็จ");
    } catch (error: any) {
      showToast("อัปโหลดรูปไม่ได้: " + (error?.message || "ตรวจสอบ Supabase Storage"), "error");
    } finally {
      setServicePortfolioUploading("");
    }
  };

  const save = async (s) => {
    const newSvc = s.id ? services.map(x => x.id === s.id ? s : x) : [...services, { ...s, id: Date.now().toString() }];
    setServices(newSvc);
    try {
      await saveCmsSetting("services", newSvc);
      await saveCmsSetting("page_content", pageContent);
      showToast("บันทึกบริการแล้ว");
    } catch (error: any) {
      showToast("บันทึกไม่ได้: " + error.message, "error");
    }
    setEditing(null);
  };
  const del = async (id) => {
    if (!confirm("ลบบริการนี้?")) return;
    const ns = services.filter(s => s.id !== id);
    setServices(ns);
    try {
      await saveCmsSetting("services", ns);
      showToast("ลบบริการแล้ว");
    } catch (error: any) {
      showToast("ลบแล้วแต่บันทึกฐานข้อมูลไม่ได้: " + error.message, "error");
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>จัดการบริการ</h2>
        <CBtn onClick={() => setEditing({ id: "", name: "", icon: "🛠️", desc: "", price: "", url: "" })} color="#FF6B00">+ เพิ่มบริการ</CBtn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {services.map(s => (
          <div key={s.id} style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <CIconBtn onClick={() => setEditing({ ...s })}>✏️</CIconBtn>
                <CIconBtn onClick={() => del(s.id)} danger>🗑️</CIconBtn>
              </div>
            </div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{s.name}</div>
            <div style={{ fontSize: 12, color: "#888", lineHeight: 1.7, marginBottom: 8 }}>{s.desc}</div>
            <div style={{ fontSize: 12, color: "#FF6B00", fontWeight: 600 }}>เริ่มต้น {s.price}</div>
          </div>
        ))}
      </div>
      {editing && (
        <CModal title={editing.id ? "แก้ไขบริการ" : "เพิ่มบริการ"} onClose={() => setEditing(null)} width={760}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 12 }}>
              <CField label="ไอคอน"><input value={editing.icon} onChange={e => setEditing(p => ({ ...p, icon: e.target.value }))} style={{ textAlign: "center", fontSize: 24 }} /></CField>
              <CField label="ชื่อบริการ *"><input value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} /></CField>
            </div>
            <CField label="คำอธิบาย"><textarea value={editing.desc} onChange={e => setEditing(p => ({ ...p, desc: e.target.value }))} rows={3} /></CField>
            <CField label="ราคาเริ่มต้น"><input value={editing.price} onChange={e => setEditing(p => ({ ...p, price: e.target.value }))} placeholder="เช่น ตร.ม.ละ 200฿" /></CField>
            <CField label="URL หน้าบริการ"><input value={editing.url} onChange={e => setEditing(p => ({ ...p, url: e.target.value }))} placeholder="/services/vinyl-banner" /></CField>
            {(() => {
              const serviceKey = serviceKeyFromService(editing);
              const items = servicePortfolioItems(serviceKey);
              return (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14, marginTop: 2 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>รูปผลงานของบริการนี้</div>
                      <div style={{ fontSize: 11, color: "#8A94A6", marginTop: 3 }}>
                        รูปชุดนี้จะใช้ในหน้าบริการ หน้าแรก และหน้าผลงาน
                      </div>
                    </div>
                    {serviceKey && <CBtn onClick={() => addServicePortfolioItem(serviceKey, editing)} small color="#3B82F6">+ เพิ่มรูป</CBtn>}
                  </div>
                  {!serviceKey ? (
                    <div style={{ padding: 12, border: "1px dashed rgba(255,107,0,0.35)", borderRadius: 10, color: "#F59E0B", fontSize: 12, lineHeight: 1.7 }}>
                      ยังไม่พบหน้าบริการที่เชื่อมกับรายการนี้ กรุณาใส่ URL ให้ตรงกับหน้าบริการ เช่น /services/vinyl-banner, /services/sticker, /services/pp-board, /services/roll-up, /services/backdrop หรือ /services/label-sticker
                    </div>
                  ) : (
                    <div className="service-portfolio-editor-grid" style={{ display: "grid", gap: 12 }}>
                      {items.map((item: any, index: number) => (
                        <div key={`${serviceKey}-service-modal-portfolio-${index}`} className="service-portfolio-editor-card" style={{ background: "#0B0F19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 12 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ position: "relative", aspectRatio: "4 / 3", borderRadius: 10, overflow: "hidden", background: "#050812", border: "1px solid rgba(255,255,255,0.08)" }}>
                                {item.image ? (
                                  <img src={item.image} alt={item.alt || item.title || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                  <div style={{ height: "100%", display: "grid", placeItems: "center", color: "#4B5563", fontSize: 11 }}>ยังไม่มีรูป</div>
                                )}
                              </div>
                              <CBtn onClick={() => deleteServicePortfolioItem(serviceKey, index)} small outline style={{ width: "100%", marginTop: 8, color: "#EF4444", borderColor: "rgba(239,68,68,0.35)" }}>ลบรูป</CBtn>
                            </div>
                            <div className="service-portfolio-fields" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                              <CField label="ชื่อผลงาน"><input value={item.title || ""} onChange={(e) => updateServicePortfolioItem(serviceKey, index, "title", e.target.value)} /></CField>
                              <CField label="หมวดหมู่"><input value={item.category || editing.name || ""} onChange={(e) => updateServicePortfolioItem(serviceKey, index, "category", e.target.value)} /></CField>
                              <CField label="URL รูป"><input value={item.image || ""} onChange={(e) => updateServicePortfolioItem(serviceKey, index, "image", e.target.value)} placeholder="/images/portfolio/example.jpg" /></CField>
                              <CField label="อัปโหลดรูป">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => uploadServicePortfolioImage(serviceKey, index, e.target.files?.[0])}
                                />
                                {servicePortfolioUploading === `${serviceKey}-${index}` && (
                                  <div style={{ fontSize: 11, color: "#60A5FA", marginTop: 5 }}>กำลังอัปโหลด...</div>
                                )}
                              </CField>
                              <CField label="Alt Text"><input value={item.alt || ""} onChange={(e) => updateServicePortfolioItem(serviceKey, index, "alt", e.target.value)} /></CField>
                              <CField label="ลิงก์เมื่อกด"><input value={item.href || editing.url || ""} onChange={(e) => updateServicePortfolioItem(serviceKey, index, "href", e.target.value)} /></CField>
                              <CField label="คำอธิบายสั้น" style={{ gridColumn: "1 / -1" }}>
                                <textarea value={item.meta || ""} onChange={(e) => updateServicePortfolioItem(serviceKey, index, "meta", e.target.value)} rows={2} />
                              </CField>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
            <div style={{ display: "flex", gap: 10 }}>
              <CBtn onClick={() => save(editing)} color="#FF6B00" style={{ flex: 1 }}>บันทึก</CBtn>
              <CBtn onClick={() => setEditing(null)} outline style={{ flex: 1 }}>ยกเลิก</CBtn>
            </div>
          </div>
        </CModal>
      )}
    </div>
  );
}

// ============================================================
// REVIEWS MANAGER
// ============================================================
function ReviewsManager({ showToast }: any) {
  const [reviews, setReviews] = useState(() => loadLocal("reviews", [
    { id: "1", name: "คุณสมชาย", company: "ร้านอาหารครัวบ้าน", stars: 5, text: "บริการดีมาก งานออกมาสวยงาม ส่งตรงเวลา ราคาเป็นธรรม" },
    { id: "2", name: "คุณนงนุช", company: "ร้านเสื้อผ้า Fashion Plus", stars: 5, text: "ทำป้ายหน้าร้านสวยมากค่ะ ลูกค้าเห็นแล้วชอบกันเยอะเลย" },
    { id: "3", name: "คุณวิชัย", company: "บริษัทออแกนิก", stars: 4, text: "งานคุณภาพดี ทีมงานให้คำปรึกษาเรื่องขนาดและวัสดุได้ดีมาก" },
  ]));
  const [editing, setEditing] = useState<any>(null);
  useEffect(() => {
    let alive = true;
    loadCmsSetting("reviews", reviews).then((value) => {
      if (alive) setReviews(value);
    });
    return () => { alive = false; };
  }, []);

  const save = async (r) => {
    const nr = r.id ? reviews.map(x => x.id === r.id ? r : x) : [...reviews, { ...r, id: Date.now().toString() }];
    setReviews(nr);
    try {
      await saveCmsSetting("reviews", nr);
      showToast(r.id ? "บันทึกรีวิวแล้ว" : "เพิ่มรีวิวแล้ว");
    } catch (error: any) {
      showToast("บันทึกไม่ได้: " + error.message, "error");
    }
    setEditing(null);
  };
  const del = async (id) => {
    if (!confirm("ลบรีวิวนี้?")) return;
    const nr = reviews.filter(r => r.id !== id);
    setReviews(nr);
    try {
      await saveCmsSetting("reviews", nr);
      showToast("ลบรีวิวแล้ว");
    } catch (error: any) {
      showToast("ลบแล้วแต่บันทึกฐานข้อมูลไม่ได้: " + error.message, "error");
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>จัดการรีวิว</h2>
        <CBtn onClick={() => setEditing({ id: "", name: "", company: "", stars: 5, text: "" })} color="#FF6B00">+ เพิ่มรีวิว</CBtn>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {reviews.map(r => (
          <div key={r.id} style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{r.name}</span>
                <span style={{ fontSize: 12, color: "#555" }}>{r.company}</span>
                <span style={{ color: "#F59E0B" }}>{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</span>
              </div>
              <div style={{ fontSize: 13, color: "#888" }}>{r.text}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <CIconBtn onClick={() => setEditing({ ...r })}>✏️</CIconBtn>
              <CIconBtn onClick={() => del(r.id)} danger>🗑️</CIconBtn>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <CModal title={editing.id ? "แก้ไขรีวิว" : "เพิ่มรีวิว"} onClose={() => setEditing(null)} width={480}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <CField label="ชื่อผู้รีวิว"><input value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} /></CField>
              <CField label="บริษัท/ร้านค้า"><input value={editing.company} onChange={e => setEditing(p => ({ ...p, company: e.target.value }))} /></CField>
            </div>
            <CField label="ดาว (1-5)">
              <div style={{ display: "flex", gap: 6 }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setEditing(p => ({ ...p, stars: s }))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: s <= editing.stars ? "#F59E0B" : "#333" }}>★</button>
                ))}
              </div>
            </CField>
            <CField label="ข้อความรีวิว"><textarea value={editing.text} onChange={e => setEditing(p => ({ ...p, text: e.target.value }))} rows={4} /></CField>
            <div style={{ display: "flex", gap: 10 }}>
              <CBtn onClick={() => save(editing)} color="#FF6B00" style={{ flex: 1 }}>บันทึก</CBtn>
              <CBtn onClick={() => setEditing(null)} outline style={{ flex: 1 }}>ยกเลิก</CBtn>
            </div>
          </div>
        </CModal>
      )}
    </div>
  );
}

// ============================================================
// PORTFOLIO MANAGER
// ============================================================
const defaultPortfolioItems = [
  {
    id: "default-work-01",
    title: "ป้ายไวนิลหน้าร้านอาหาร",
    category: "ป้ายไวนิล",
    meta: "ช่วยให้เมนูและโปรโมชันอ่านง่ายจากหน้าร้าน",
    alt: "ป้ายไวนิลหน้าร้านอาหาร Display Works Media",
    href: "/portfolio",
    image: "/images/portfolio/work-01.webp",
    img: "/images/portfolio/work-01.webp",
  },
  {
    id: "default-work-02",
    title: "บูธและสื่อแสดงสินค้า",
    category: "Backdrop",
    meta: "รวมสื่อหลายชิ้นให้แบรนด์ดูพร้อมในงานอีเวนต์",
    alt: "บูธและสื่อแสดงสินค้า Display Works Media",
    href: "/portfolio",
    image: "/images/portfolio/work-02.webp",
    img: "/images/portfolio/work-02.webp",
  },
  {
    id: "default-work-03",
    title: "ฉลากสินค้า",
    category: "ฉลากสินค้า",
    meta: "เพิ่มความน่าเชื่อถือให้แพ็กเกจสินค้า",
    alt: "ฉลากสินค้า Display Works Media",
    href: "/portfolio",
    image: "/images/portfolio/work-06.webp",
    img: "/images/portfolio/work-06.webp",
  },
  {
    id: "default-work-04",
    title: "Backdrop งานอีเวนต์",
    category: "Backdrop",
    meta: "สร้างจุดถ่ายภาพและพื้นที่แบรนด์ที่ชัดเจน",
    alt: "Backdrop งานอีเวนต์ Display Works Media",
    href: "/portfolio",
    image: "/images/portfolio/work-03.webp",
    img: "/images/portfolio/work-03.webp",
  },
  {
    id: "default-work-05",
    title: "งานพิมพ์แคมเปญ",
    category: "สื่อโฆษณา",
    meta: "สื่อโปรโมชันที่ช่วยให้ข้อเสนอเห็นชัดขึ้น",
    alt: "งานพิมพ์แคมเปญ Display Works Media",
    href: "/portfolio",
    image: "/images/portfolio/work-05.webp",
    img: "/images/portfolio/work-05.webp",
  },
];

function PortfolioManager({ showToast }: any) {
  const [items, setItems] = useState(() => loadLocal("portfolio", defaultPortfolioItems));
  const [editing, setEditing] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let alive = true;
    loadCmsSetting("portfolio", items).then((value) => {
      const nextItems = Array.isArray(value) && value.length > 0 ? value : defaultPortfolioItems;
      if (alive) setItems(nextItems);
    });
    return () => { alive = false; };
  }, []);

  const uploadImg = async (file: File | undefined, callback: (url: string) => void) => {
    if (!file) return;
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `portfolio/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("cms-media").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("cms-media").getPublicUrl(path);
      callback(urlData.publicUrl);
      showToast("อัปโหลดรูปสำเร็จ");
    } catch {
      callback(URL.createObjectURL(file));
      showToast("ใช้ preview (ตรวจสอบ Supabase Storage)", "error");
    }
    setUploading(false);
  };

  const normalizeItem = (item: any) => ({
    ...item,
    image: item.image || item.img || "",
    img: item.img || item.image || "",
    meta: item.meta || item.desc || item.category || "",
    alt: item.alt || item.altText || item.title || "",
    href: item.href || item.url || "",
  });

  const save = async (item) => {
    const normalized = normalizeItem(item);
    const ni = normalized.id ? items.map(x => x.id === normalized.id ? normalized : x) : [...items, { ...normalized, id: Date.now().toString() }];
    setItems(ni);
    try {
      await saveCmsSetting("portfolio", ni);
      showToast("บันทึกผลงานแล้ว");
    } catch (error: any) {
      showToast("บันทึกไม่ได้: " + error.message, "error");
    }
    setEditing(null);
  };
  const del = async (id) => {
    if (!confirm("ลบผลงานนี้?")) return;
    const ni = items.filter(i => i.id !== id);
    setItems(ni);
    try {
      await saveCmsSetting("portfolio", ni);
      showToast("ลบผลงานแล้ว");
    } catch (error: any) {
      showToast("ลบแล้วแต่บันทึกฐานข้อมูลไม่ได้: " + error.message, "error");
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>จัดการผลงาน</h2>
        <CBtn onClick={() => setEditing({ id: "", title: "", category: "", meta: "", alt: "", href: "", image: "", img: "" })} color="#FF6B00">+ เพิ่มผลงาน</CBtn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
        {items.map(item => (
          <div key={item.id} style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ height: 140, background: "#1A2233", position: "relative" }}>
              {(item.image || item.img) ? <img src={item.image || item.img} alt={item.alt || item.title || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 36 }}>🖼</div>}
            </div>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{item.title || "ไม่มีชื่อ"}</div>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>{item.category}</div>
              <div style={{ fontSize: 11, color: "#7B8496", marginBottom: 10, lineHeight: 1.5 }}>{item.meta}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <CIconBtn onClick={() => setEditing(normalizeItem(item))} small>✏️</CIconBtn>
                <CIconBtn onClick={() => del(item.id)} danger small>🗑️</CIconBtn>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <EmptyState icon="🖼" text="ยังไม่มีผลงาน" />}
      </div>

      {editing && (
        <CModal title={editing.id ? "แก้ไขผลงาน" : "เพิ่มผลงาน"} onClose={() => setEditing(null)} width={460}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <CField label="รูปภาพผลงาน">
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 120, height: 80, borderRadius: 8, overflow: "hidden", background: "#1A2233", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {(editing.image || editing.img) ? <img src={editing.image || editing.img} alt={editing.alt || editing.title || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24, opacity: 0.4 }}>🖼</span>}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => uploadImg(e.target.files?.[0], url => setEditing(p => ({ ...p, image: url, img: url })))} />
                  <CBtn onClick={() => fileRef.current?.click()} color="#3B82F6" small disabled={uploading}>{uploading ? "⏳..." : "📁 เลือกรูป"}</CBtn>
                  <input value={editing.image || editing.img} onChange={e => setEditing(p => ({ ...p, image: e.target.value, img: e.target.value }))} placeholder="หรือวาง URL" />
                </div>
              </div>
            </CField>
            <CField label="ชื่อผลงาน"><input value={editing.title} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} /></CField>
            <CField label="คำอธิบายผลงาน">
              <textarea value={editing.meta || ""} onChange={e => setEditing(p => ({ ...p, meta: e.target.value }))} rows={3} placeholder="เช่น ป้ายไวนิลหน้าร้านอาหาร ขนาด 4 x 2 เมตร ช่วยให้โปรโมชันอ่านชัดจากระยะหน้าร้าน" />
            </CField>
            <CField label="Alt Text รูปภาพ">
              <input value={editing.alt || ""} onChange={e => setEditing(p => ({ ...p, alt: e.target.value }))} placeholder="คำอธิบายรูปสำหรับ SEO และการเข้าถึง" />
            </CField>
            <CField label="ลิงก์เมื่อคลิก (ไม่บังคับ)">
              <input value={editing.href || ""} onChange={e => setEditing(p => ({ ...p, href: e.target.value }))} placeholder="/portfolio หรือ /services/vinyl-banner" />
            </CField>
            <CField label="หมวดหมู่">
              <input value={editing.category} onChange={e => setEditing(p => ({ ...p, category: e.target.value }))} list="cat-port" placeholder="เช่น ป้ายไวนิล" />
              <datalist id="cat-port">{["ป้ายไวนิล","สติ๊กเกอร์","Roll Up","Backdrop","PP Board","ฉลากสินค้า"].map(c => <option key={c} value={c} />)}</datalist>
            </CField>
            <div style={{ display: "flex", gap: 10 }}>
              <CBtn onClick={() => save(editing)} color="#FF6B00" style={{ flex: 1 }}>บันทึก</CBtn>
              <CBtn onClick={() => setEditing(null)} outline style={{ flex: 1 }}>ยกเลิก</CBtn>
            </div>
          </div>
        </CModal>
      )}
    </div>
  );
}

// ============================================================
// PAGE CONTENT MANAGER
// ============================================================
const defaultServicePortfolioItems = {
  vinyl: [
    { title: "ป้ายไวนิลหน้าร้าน", image: "/images/portfolio/1.png", meta: "ช่วยให้ร้านและโปรโมชันอ่านชัดจากระยะหน้าร้าน", category: "ป้ายไวนิล", alt: "ป้ายไวนิลหน้าร้าน Display Works Media" },
    { title: "ป้ายโปรโมชั่น", image: "/images/portfolio/2.png", meta: "ใช้สื่อสารราคา เมนู หรือแคมเปญให้คนเห็นทันที", category: "ป้ายไวนิล", alt: "ป้ายโปรโมชั่น Display Works Media" },
    { title: "ป้ายประชาสัมพันธ์", image: "/images/portfolio/3.png", meta: "ประสานขนาดและวัสดุให้เหมาะกับพื้นที่ติดตั้ง", category: "ป้ายไวนิล", alt: "ป้ายประชาสัมพันธ์ Display Works Media" },
  ],
  sticker: [
    { title: "สติ๊กเกอร์ติดกระจก", image: "/images/portfolio/sticker-1.jpg", meta: "เหมาะกับหน้าร้าน กระจกออฟฟิศ และพื้นที่ Indoor / Outdoor", category: "สติ๊กเกอร์", alt: "สติ๊กเกอร์ติดกระจก Display Works Media" },
    { title: "สติ๊กเกอร์ประชาสัมพันธ์", image: "/images/portfolio/sticker-2.jpg", meta: "ช่วยทำให้ข้อความแคมเปญดูชัดและติดตั้งเป็นระเบียบ", category: "สติ๊กเกอร์", alt: "สติ๊กเกอร์ประชาสัมพันธ์ Display Works Media" },
    { title: "สติ๊กเกอร์ไดคัท", image: "/images/portfolio/sticker-4.jpg", meta: "ตัดตามรูปทรงโลโก้ ฉลาก หรือชิ้นงานเฉพาะแบรนด์", category: "สติ๊กเกอร์", alt: "สติ๊กเกอร์ไดคัท Display Works Media" },
  ],
  ppboard: [
    { title: "PP Board โปรโมชั่น", image: "/images/portfolio/ppboard-1.png", meta: "น้ำหนักเบา เหมาะกับโปรโมชันหน้าร้านที่ต้องย้ายตำแหน่งได้", category: "PP Board", alt: "PP Board โปรโมชั่น Display Works Media" },
    { title: "Standee หน้าร้าน", image: "/images/portfolio/ppboard-2.png", meta: "ช่วยให้สินค้า เมนู หรือบริการเด่นขึ้นในพื้นที่ขาย", category: "PP Board", alt: "Standee หน้าร้าน Display Works Media" },
    { title: "ป้ายตั้งพื้น", image: "/images/portfolio/ppboard-3.png", meta: "ประเมินขนาดตามตำแหน่งวางและระยะมองเห็น", category: "PP Board", alt: "ป้ายตั้งพื้น PP Board Display Works Media" },
  ],
  rollup: [
    { title: "Roll Up สำหรับหน้าร้าน", image: "/images/portfolio/rollup-1.png", meta: "ติดตั้งง่าย เหมาะกับพื้นที่จำกัดและใช้งานซ้ำได้", category: "Roll Up", alt: "Roll Up สำหรับหน้าร้าน Display Works Media" },
    { title: "Roll Up สำหรับโปรโมชั่น", image: "/images/portfolio/rollup-2.png", meta: "ช่วยให้บูธ งานแสดงสินค้า และกิจกรรมดูพร้อมขึ้น", category: "Roll Up", alt: "Roll Up สำหรับโปรโมชั่น Display Works Media" },
  ],
  label: [
    { title: "ฉลากสินค้าสำหรับบรรจุภัณฑ์", image: "/images/portfolio/sticker-1.png", meta: "ช่วยให้แพ็กเกจดูน่าเชื่อถือและสื่อสารแบรนด์ชัดขึ้น", category: "ฉลากสินค้า", alt: "ฉลากสินค้าสำหรับบรรจุภัณฑ์ Display Works Media" },
    { title: "ฉลากสินค้ากันน้ำ", image: "/images/portfolio/sticker-2.png", meta: "เหมาะกับอาหาร เครื่องดื่ม และสินค้าที่ต้องเจอความชื้น", category: "ฉลากสินค้า", alt: "ฉลากสินค้ากันน้ำ Display Works Media" },
    { title: "ฉลากไดคัท", image: "/images/portfolio/sticker-4.png", meta: "ตัดตามโลโก้หรือรูปทรงเฉพาะเพื่อเพิ่มมูลค่าสินค้า", category: "ฉลากสินค้า", alt: "ฉลากไดคัท Display Works Media" },
  ],
  backdrop: [
    { title: "Backdrop งานอีเวนต์", image: "/images/portfolio/backdrop-1.png", meta: "สร้างฉากหลังที่ช่วยให้พื้นที่จัดงานดูเป็นแบรนด์เดียวกัน", category: "Backdrop", alt: "Backdrop งานอีเวนต์ Display Works Media" },
    { title: "Backdrop เปิดตัวสินค้า", image: "/images/portfolio/backdrop-2.png", meta: "ช่วยให้จุดถ่ายภาพและเวทีสื่อสารสินค้าเด่นขึ้น", category: "Backdrop", alt: "Backdrop เปิดตัวสินค้า Display Works Media" },
    { title: "Backdrop ถ่ายภาพ", image: "/images/portfolio/backdrop-3.png", meta: "แนะนำขนาดตามมุมกล้อง พื้นที่ และรูปแบบงาน", category: "Backdrop", alt: "Backdrop ถ่ายภาพ Display Works Media" },
  ],
};

const defaultPageContent = {
  home: {
    servicesEyebrow: "OUR SERVICES",
    servicesTitle: "บริการของเรา",
    servicesSubtitle: "ครบวงจรทุกงาน ตั้งแต่ขั้นตอนการออกแบบ ผลิต จนถึงการจัดส่ง",
  },
  shared: {
    workflowEyebrow: "OUR PROCESS",
    workflowTitle: "จากไอเดีย สู่การมองเห็น",
    workflowSubtitle: "กระบวนการทำงานที่ใส่ใจในทุกรายละเอียด เพื่อผลงานที่มีคุณภาพและตรงตามเป้าหมาย",
    portfolioEyebrow: "OUR WORK",
    portfolioTitle: "ผลงานของเรา",
    portfolioSubtitle: "ตัวอย่างผลงานจริงที่ผลิตและส่งมอบให้ลูกค้า ด้วยมาตรฐานเดียวกันในทุกประเภทงาน",
    quoteEyebrow: "FREE CONSULTATION",
    quoteTitle: "มีงานอยู่?\nเราช่วยดูแลให้",
    quoteSubtitle: "กรอกรายละเอียดงาน ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง",
  },
  about: {
    eyebrow: "เกี่ยวกับเรา",
    title: "ผู้เชี่ยวชาญด้านงานพิมพ์และสื่อโฆษณาครบวงจร",
    subtitle: "ให้คำปรึกษา ออกแบบ ผลิต และจัดส่งสื่อโฆษณาคุณภาพ เพื่อช่วยให้ธุรกิจของคุณโดดเด่นและน่าจดจำมากยิ่งขึ้น",
  },
  services: {
    eyebrow: "OUR SERVICES",
    title: "บริการงานป้ายและงานพิมพ์สำหรับธุรกิจ",
    subtitle: "เลือกประเภทงานที่ต้องการ ทีม Display Works Media ช่วยแนะนำวัสดุ ตรวจไฟล์ ประเมินราคา และดูแลการผลิตให้เหมาะกับการใช้งานจริง",
  },
  contact: {
    eyebrow: "ติดต่อเรา",
    title: "กำลังมองหางานป้ายหรือสื่อโฆษณา?",
    subtitle: "ติดต่อสอบถามและปรึกษาได้ฟรี ทีมงานพร้อมให้คำแนะนำและประเมินราคาเบื้องต้นโดยไม่มีค่าใช้จ่าย",
  },
  faq: {
    eyebrow: "FAQ",
    title: "คำถามที่พบบ่อยก่อนสั่งผลิตงานป้าย",
    subtitle: "รวมคำตอบเรื่องขั้นต่ำ ระยะเวลาผลิต ไฟล์ Artwork การชำระเงิน และการจัดส่ง เพื่อช่วยให้เตรียมงานได้ง่ายขึ้น",
  },
  footer: {
    eyebrow: "FREE CONSULTATION",
    title: "พร้อมให้คำปรึกษาและผลิตสื่อโฆษณาสำหรับธุรกิจของคุณ",
    subtitle: "สอบถามงานและประเมินราคาเบื้องต้นฟรี",
  },
  servicesDetail: {
    vinyl: {
      eyebrow: "บริการออกแบบและผลิต",
      title: "ป้ายไวนิล",
      highlight: "คุณภาพสูง",
      subtitle: "พิมพ์ไวนิลสีสด คมชัด ทนแดด ทนฝน เหมาะสำหรับป้ายร้านค้า โฆษณา โปรโมชั่น และตกแต่งอาคารทุกประเภท",
    },
    sticker: {
      eyebrow: "บริการออกแบบและผลิต",
      title: "สั่งสติ๊กเกอร์",
      highlight: "คุณภาพสูง",
      subtitle: "พิมพ์สติ๊กเกอร์สีสด คมชัด ไดคัทได้ตามรูปแบบที่ต้องการ รองรับทั้งงาน Indoor และ Outdoor เหมาะสำหรับฉลากสินค้าและตกแต่งกระจกร้าน",
    },
    backdrop: {
      eyebrow: "บริการออกแบบและผลิตแบ็คดรอป",
      title: "แบ็คดรอป",
      highlight: "ฉากหลังจัดงาน",
      subtitle: "ผลิตแบ็คดรอปสำหรับงานอีเวนต์ นิทรรศการ และงานแต่งงาน ภาพคมชัด โครงสร้างแข็งแรง ติดตั้งง่าย สะกดทุกสายตาให้งานคุณโดดเด่นยิ่งขึ้น",
    },
    rollup: {
      eyebrow: "บริการพิมพ์และจัดจำหน่ายโครง",
      title: "Roll Up",
      highlight: "/ X-Stand",
      subtitle: "ป้ายตั้งพื้นเคลื่อนที่ ติดตั้งง่ายภายใน 1 นาที มาพร้อมกระเป๋าพกพาสะดวก เหมาะสำหรับงานออกบูธ นิทรรศการ และป้ายส่งเสริมการขายหน้าร้าน พิมพ์สีคมชัดโดดเด่น",
    },
    ppboard: {
      eyebrow: "บริการออกแบบและผลิต",
      title: "PP Board",
      highlight: "/ Standee",
      subtitle: "ป้าย PP Board น้ำหนักเบา เหมาะกับป้ายตั้งพื้น ป้ายโปรโมชั่น และสื่อหน้าร้านที่ต้องการความคมชัด เคลื่อนย้ายง่าย และผลิตตามขนาดได้",
    },
    label: {
      eyebrow: "บริการพิมพ์และไดคัทสติกเกอร์",
      title: "พิมพ์ฉลากสินค้า",
      highlight: "ระบบดิจิตอล",
      subtitle: "ยกระดับแบรนด์ของคุณด้วยฉลากสินค้าสีสด คมชัด ไดคัทฟรีฟอร์ม ลอกแปะง่าย ติดแน่นทนนาน รองรับงานกันน้ำ แช่เย็นได้ 100%",
    },
  },
};

function PageContentManager({ showToast }: any) {
  const [content, setContent] = useState(() => loadLocal("page_content", defaultPageContent));
  const [section, setSection] = useState("home");
  const [servicePortfolioUploading, setServicePortfolioUploading] = useState("");

  useEffect(() => {
    let alive = true;
    loadCmsSetting("page_content", defaultPageContent).then((value) => {
      if (alive) setContent({ ...defaultPageContent, ...value });
    });
    return () => { alive = false; };
  }, []);

  const update = (key: string, value: string) => {
    setContent((current: any) => {
      if (section.startsWith("servicesDetail.")) {
        const serviceKey = section.split(".")[1];
        return {
          ...current,
          servicesDetail: {
            ...current.servicesDetail,
            [serviceKey]: { ...current.servicesDetail?.[serviceKey], [key]: value },
          },
        };
      }
      return {
        ...current,
        [section]: { ...current[section], [key]: value },
      };
    });
  };

  const updateServiceDetail = (serviceKey: string, updater: (current: any) => any) => {
    setContent((current: any) => ({
      ...current,
      servicesDetail: {
        ...current.servicesDetail,
        [serviceKey]: updater(current.servicesDetail?.[serviceKey] || {}),
      },
    }));
  };

  const updateServicePortfolioItem = (serviceKey: string, index: number, key: string, value: string) => {
    const fallbackItems = defaultServicePortfolioItems[serviceKey] || [];
    const currentItems = Array.isArray(content.servicesDetail?.[serviceKey]?.portfolioItems)
      ? content.servicesDetail[serviceKey].portfolioItems
      : fallbackItems;
    const nextItems = currentItems.map((item: any, itemIndex: number) =>
      itemIndex === index ? { ...item, [key]: value } : item
    );
    updateServiceDetail(serviceKey, (current) => ({ ...current, portfolioItems: nextItems }));
  };

  const addServicePortfolioItem = (serviceKey: string) => {
    const fallbackItems = defaultServicePortfolioItems[serviceKey] || [];
    const currentItems = Array.isArray(content.servicesDetail?.[serviceKey]?.portfolioItems)
      ? content.servicesDetail[serviceKey].portfolioItems
      : fallbackItems;
    updateServiceDetail(serviceKey, (current) => ({
      ...current,
      portfolioItems: [
        ...currentItems,
        { title: "", image: "", meta: "", category: "", alt: "", href: "" },
      ],
    }));
  };

  const deleteServicePortfolioItem = (serviceKey: string, index: number) => {
    const fallbackItems = defaultServicePortfolioItems[serviceKey] || [];
    const currentItems = Array.isArray(content.servicesDetail?.[serviceKey]?.portfolioItems)
      ? content.servicesDetail[serviceKey].portfolioItems
      : fallbackItems;
    updateServiceDetail(serviceKey, (current) => ({
      ...current,
      portfolioItems: currentItems.filter((_: any, itemIndex: number) => itemIndex !== index),
    }));
  };

  const uploadServicePortfolioImage = async (serviceKey: string, index: number, file?: File) => {
    if (!file) return;
    const uploadKey = `${serviceKey}-${index}`;
    setServicePortfolioUploading(uploadKey);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `service-portfolio/${serviceKey}/${Date.now()}-${index}.${ext}`;
      const { error } = await supabase.storage.from("cms-media").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("cms-media").getPublicUrl(path);
      updateServicePortfolioItem(serviceKey, index, "image", urlData.publicUrl);
      showToast("อัปโหลดรูปผลงานแล้ว");
    } catch (error: any) {
      showToast("อัปโหลดรูปไม่ได้: " + error.message, "error");
    } finally {
      setServicePortfolioUploading("");
    }
  };

  const save = async () => {
    try {
      await saveCmsSetting("page_content", content);
      showToast("บันทึกข้อความรายหน้าแล้ว");
    } catch (error: any) {
      showToast("บันทึกไม่ได้: " + error.message, "error");
    }
  };

  const fields: Record<string, Array<{ key: string; label: string; rows?: number }>> = {
    home: [
      { key: "servicesEyebrow", label: "ป้ายกำกับส่วนบริการ" },
      { key: "servicesTitle", label: "หัวข้อบริการ" },
      { key: "servicesSubtitle", label: "คำอธิบายบริการ", rows: 3 },
    ],
    shared: [
      { key: "workflowEyebrow", label: "ป้ายกำกับขั้นตอนการทำงาน" },
      { key: "workflowTitle", label: "หัวข้อขั้นตอนการทำงาน" },
      { key: "workflowSubtitle", label: "คำอธิบายขั้นตอนการทำงาน", rows: 3 },
      { key: "portfolioEyebrow", label: "ป้ายกำกับผลงาน" },
      { key: "portfolioTitle", label: "หัวข้อผลงาน" },
      { key: "portfolioSubtitle", label: "คำอธิบายผลงาน", rows: 3 },
      { key: "quoteEyebrow", label: "ป้ายกำกับฟอร์ม" },
      { key: "quoteTitle", label: "หัวข้อฟอร์ม (ขึ้นบรรทัดใหม่ได้)", rows: 2 },
      { key: "quoteSubtitle", label: "คำอธิบายฟอร์ม", rows: 2 },
    ],
    about: [
      { key: "eyebrow", label: "ป้ายกำกับ" },
      { key: "title", label: "หัวข้อหลัก", rows: 2 },
      { key: "subtitle", label: "คำอธิบาย", rows: 3 },
    ],
    services: [
      { key: "eyebrow", label: "ป้ายกำกับ" },
      { key: "title", label: "หัวข้อหลัก", rows: 2 },
      { key: "subtitle", label: "คำอธิบาย", rows: 3 },
    ],
    contact: [
      { key: "eyebrow", label: "ป้ายกำกับ" },
      { key: "title", label: "หัวข้อหลัก", rows: 2 },
      { key: "subtitle", label: "คำอธิบาย", rows: 3 },
    ],
    faq: [
      { key: "eyebrow", label: "ป้ายกำกับ" },
      { key: "title", label: "หัวข้อหลัก", rows: 2 },
      { key: "subtitle", label: "คำอธิบาย", rows: 3 },
    ],
    footer: [
      { key: "eyebrow", label: "ป้ายกำกับ" },
      { key: "title", label: "หัวข้อ" },
      { key: "subtitle", label: "คำอธิบาย" },
    ],
    "servicesDetail.vinyl": [
      { key: "eyebrow", label: "ป้ายกำกับ" },
      { key: "title", label: "หัวข้อบรรทัดหลัก" },
      { key: "highlight", label: "ข้อความสีส้ม" },
      { key: "subtitle", label: "คำอธิบาย", rows: 3 },
      { key: "portfolioEyebrow", label: "ป้ายกำกับส่วนผลงาน" },
      { key: "portfolioTitle", label: "หัวข้อส่วนผลงาน" },
      { key: "portfolioSubtitle", label: "คำอธิบายส่วนผลงาน", rows: 3 },
    ],
    "servicesDetail.sticker": [
      { key: "eyebrow", label: "ป้ายกำกับ" },
      { key: "title", label: "หัวข้อบรรทัดหลัก" },
      { key: "highlight", label: "ข้อความสีส้ม" },
      { key: "subtitle", label: "คำอธิบาย", rows: 3 },
      { key: "portfolioEyebrow", label: "ป้ายกำกับส่วนผลงาน" },
      { key: "portfolioTitle", label: "หัวข้อส่วนผลงาน" },
      { key: "portfolioSubtitle", label: "คำอธิบายส่วนผลงาน", rows: 3 },
    ],
    "servicesDetail.backdrop": [
      { key: "eyebrow", label: "ป้ายกำกับ" },
      { key: "title", label: "หัวข้อบรรทัดหลัก" },
      { key: "highlight", label: "ข้อความสีส้ม" },
      { key: "subtitle", label: "คำอธิบาย", rows: 3 },
      { key: "portfolioEyebrow", label: "ป้ายกำกับส่วนผลงาน" },
      { key: "portfolioTitle", label: "หัวข้อส่วนผลงาน" },
      { key: "portfolioSubtitle", label: "คำอธิบายส่วนผลงาน", rows: 3 },
    ],
    "servicesDetail.rollup": [
      { key: "eyebrow", label: "ป้ายกำกับ" },
      { key: "title", label: "หัวข้อบรรทัดหลัก" },
      { key: "highlight", label: "ข้อความสีส้ม" },
      { key: "subtitle", label: "คำอธิบาย", rows: 3 },
      { key: "portfolioEyebrow", label: "ป้ายกำกับส่วนผลงาน" },
      { key: "portfolioTitle", label: "หัวข้อส่วนผลงาน" },
      { key: "portfolioSubtitle", label: "คำอธิบายส่วนผลงาน", rows: 3 },
    ],
    "servicesDetail.ppboard": [
      { key: "eyebrow", label: "ป้ายกำกับ" },
      { key: "title", label: "หัวข้อบรรทัดหลัก" },
      { key: "highlight", label: "ข้อความสีส้ม" },
      { key: "subtitle", label: "คำอธิบาย", rows: 3 },
      { key: "portfolioEyebrow", label: "ป้ายกำกับส่วนผลงาน" },
      { key: "portfolioTitle", label: "หัวข้อส่วนผลงาน" },
      { key: "portfolioSubtitle", label: "คำอธิบายส่วนผลงาน", rows: 3 },
    ],
    "servicesDetail.label": [
      { key: "eyebrow", label: "ป้ายกำกับ" },
      { key: "title", label: "หัวข้อบรรทัดหลัก" },
      { key: "highlight", label: "ข้อความสีส้ม" },
      { key: "subtitle", label: "คำอธิบาย", rows: 3 },
      { key: "portfolioEyebrow", label: "ป้ายกำกับส่วนผลงาน" },
      { key: "portfolioTitle", label: "หัวข้อส่วนผลงาน" },
      { key: "portfolioSubtitle", label: "คำอธิบายส่วนผลงาน", rows: 3 },
    ],
  };

  const sections = [
    ["home", "หน้าแรก"],
    ["shared", "ส่วนกลางทุกหน้า"],
    ["about", "เกี่ยวกับเรา"],
    ["services", "บริการ"],
    ["contact", "ติดต่อเรา"],
    ["faq", "FAQ"],
    ["footer", "Footer"],
    ["servicesDetail.vinyl", "บริการ: ไวนิล"],
    ["servicesDetail.sticker", "บริการ: สติ๊กเกอร์"],
    ["servicesDetail.backdrop", "บริการ: Backdrop"],
    ["servicesDetail.rollup", "บริการ: Roll Up"],
    ["servicesDetail.ppboard", "บริการ: PP Board"],
    ["servicesDetail.label", "บริการ: ฉลากสินค้า"],
  ];

  const activeServiceKey = section.startsWith("servicesDetail.") ? section.split(".")[1] : "";
  const sectionValue = activeServiceKey
    ? content.servicesDetail?.[activeServiceKey]
    : content[section];
  const servicePortfolioItems = activeServiceKey
    ? (Array.isArray(sectionValue?.portfolioItems)
        ? sectionValue.portfolioItems
        : (defaultServicePortfolioItems[activeServiceKey] || []))
    : [];

  return (
    <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 760 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>ข้อความรายหน้า</h2>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>แก้หัวข้อหลักและข้อความส่วนกลางที่แสดงบนเว็บไซต์</p>
      <div style={{
        background: "rgba(59,130,246,0.1)",
        border: "1px solid rgba(59,130,246,0.25)",
        color: "#BFDBFE",
        borderRadius: 12,
        padding: "12px 14px",
        fontSize: 13,
        lineHeight: 1.7,
        marginBottom: 16,
      }}>
        หากยังไม่เคยบันทึก ระบบจะแสดงค่าตั้งต้นจากโค้ดก่อน ให้กด “บันทึกข้อความ” หนึ่งครั้งเพื่อสร้างข้อมูลชุดแรกใน database จากนั้นหน้าเว็บจะอ่านค่าจาก CMS หลัง refresh
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {sections.map(([id, label]) => (
          <button key={id} onClick={() => setSection(id)} style={{
            border: section === id ? "1px solid #FF6B00" : "1px solid rgba(255,255,255,0.12)",
            background: section === id ? "rgba(255,107,0,0.14)" : "#141A24",
            color: section === id ? "#FF6B00" : "#A8B0C0",
            borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontFamily: "inherit",
          }}>{label}</button>
        ))}
      </div>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {fields[section].map((field) => (
            <CField key={field.key} label={field.label}>
              {field.rows ? (
                <textarea value={sectionValue?.[field.key] || ""} onChange={(e) => update(field.key, e.target.value)} rows={field.rows} />
              ) : (
                <input value={sectionValue?.[field.key] || ""} onChange={(e) => update(field.key, e.target.value)} />
              )}
            </CField>
          ))}
          {activeServiceKey && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16, marginTop: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
                <div>
                  <SectionTitle>ผลงานของบริการนี้</SectionTitle>
                  <p style={{ color: "#888", fontSize: 12, lineHeight: 1.6 }}>
                    รูปเหล่านี้จะแสดงในส่วนผลงานของหน้าบริการที่เลือก หากไม่ใส่ ระบบจะใช้รูปตั้งต้นเดิม
                  </p>
                </div>
                <CBtn onClick={() => addServicePortfolioItem(activeServiceKey)} small color="#3B82F6">+ เพิ่มรูป</CBtn>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {servicePortfolioItems.map((item: any, index: number) => (
                  <div key={`${activeServiceKey}-portfolio-${index}`} className="service-portfolio-editor-card" style={{ background: "#0B0F19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 12 }}>
                    <div className="service-portfolio-editor-grid" style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, alignItems: "start" }}>
                      <div style={{ width: "100%", aspectRatio: "16 / 10", borderRadius: 8, overflow: "hidden", background: "#1A2233", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {item.image ? (
                          <img src={item.image} alt={item.alt || item.title || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ opacity: 0.45, fontSize: 24 }}>🖼</span>
                        )}
                      </div>
                      <div className="service-portfolio-fields" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <CField label="ชื่อผลงาน">
                          <input value={item.title || ""} onChange={(e) => updateServicePortfolioItem(activeServiceKey, index, "title", e.target.value)} />
                        </CField>
                        <CField label="หมวดหมู่">
                          <input value={item.category || ""} onChange={(e) => updateServicePortfolioItem(activeServiceKey, index, "category", e.target.value)} />
                        </CField>
                        <CField label="URL รูปภาพ">
                          <input value={item.image || ""} onChange={(e) => updateServicePortfolioItem(activeServiceKey, index, "image", e.target.value)} placeholder="/images/portfolio/example.jpg" />
                        </CField>
                        <CField label="อัปโหลดรูป">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => uploadServicePortfolioImage(activeServiceKey, index, e.target.files?.[0])}
                          />
                          {servicePortfolioUploading === `${activeServiceKey}-${index}` && (
                            <div style={{ color: "#60A5FA", fontSize: 11, marginTop: 6 }}>กำลังอัปโหลด...</div>
                          )}
                        </CField>
                        <CField label="Alt Text">
                          <input value={item.alt || ""} onChange={(e) => updateServicePortfolioItem(activeServiceKey, index, "alt", e.target.value)} />
                        </CField>
                        <CField label="ลิงก์เมื่อคลิก">
                          <input value={item.href || ""} onChange={(e) => updateServicePortfolioItem(activeServiceKey, index, "href", e.target.value)} placeholder="/portfolio หรือ /services/..." />
                        </CField>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <CField label="คำอธิบายใต้รูป">
                            <textarea value={item.meta || ""} onChange={(e) => updateServicePortfolioItem(activeServiceKey, index, "meta", e.target.value)} rows={2} />
                          </CField>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                      <CBtn onClick={() => deleteServicePortfolioItem(activeServiceKey, index)} small outline style={{ color: "#EF4444", borderColor: "rgba(239,68,68,0.35)" }}>
                        ลบรูปนี้
                      </CBtn>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <CBtn onClick={save} color="#FF6B00">💾 บันทึกข้อความ</CBtn>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// CONTACT MANAGER
// ============================================================
function ContactManager({ showToast }: any) {
  const [c, setC] = useState(() => loadLocal("contact", {
    phone: "065-916-1539", line: "https://lin.ee/O0nPl03", email: "info@displayworksmedia.com",
    address: "123 ถ.ตัวอย่าง กรุงเทพฯ 10110", facebook: "", instagram: "", hours: "จ-ศ 9:00-18:00 น.",
  }));
  const set = k => e => setC(p => ({ ...p, [k]: e.target.value }));
  useEffect(() => {
    let alive = true;
    loadCmsSetting("contact", c).then((value) => {
      if (alive) setC(value);
    });
    return () => { alive = false; };
  }, []);
  const save = async () => {
    try {
      await saveCmsSetting("contact", c);
      showToast("บันทึกข้อมูลติดต่อแล้ว");
    } catch (error: any) {
      showToast("บันทึกไม่ได้: " + error.message, "error");
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 560 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>ข้อมูลติดต่อ</h2>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <CField label="📞 เบอร์โทร"><input value={c.phone} onChange={set("phone")} /></CField>
            <CField label="📧 อีเมล"><input value={c.email} onChange={set("email")} /></CField>
          </div>
          <CField label="💬 LINE URL"><input value={c.line} onChange={set("line")} /></CField>
          <CField label="📍 ที่อยู่"><textarea value={c.address} onChange={set("address")} rows={2} /></CField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <CField label="Facebook URL"><input value={c.facebook} onChange={set("facebook")} placeholder="https://facebook.com/..." /></CField>
            <CField label="Instagram URL"><input value={c.instagram} onChange={set("instagram")} placeholder="https://instagram.com/..." /></CField>
          </div>
          <CField label="⏰ เวลาทำการ"><input value={c.hours} onChange={set("hours")} /></CField>
          <CBtn onClick={save} color="#FF6B00">💾 บันทึกข้อมูลติดต่อ</CBtn>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// UI COMPONENTS
// ============================================================
function Card({ children }: any) {
  return <div className="card-pad" style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24 }}>{children}</div>;
}
function SectionTitle({ children }: any) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: "#FF6B00", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 4 }}>{children}</div>;
}
function CField({ label, children, style }: any) {
  return <div style={style}><label>{label}</label>{children}</div>;
}
function CBtn({ onClick, children, color, outline, small, style, disabled }: any) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: outline ? "transparent" : (color || "#FF6B00"),
      border: `1px solid ${outline ? "rgba(255,255,255,0.15)" : (color || "#FF6B00")}`,
      color: outline ? "#A8B0C0" : "#fff",
      padding: small ? "8px 14px" : "11px 20px",
      borderRadius: 10, fontSize: small ? 13 : 14, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
      opacity: disabled ? 0.6 : 1, whiteSpace: "nowrap", ...style,
      minHeight: small ? 40 : 46,
    }}>{children}</button>
  );
}
function CIconBtn({ onClick, children, danger, small }: any) {
  return (
    <button onClick={onClick} style={{
      background: danger ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)",
      border: `1px solid ${danger ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
      color: danger ? "#ef4444" : "#A8B0C0",
      padding: small ? "6px 10px" : "8px 12px", borderRadius: 8,
      cursor: "pointer", fontSize: small ? 12 : 14, fontFamily: "inherit",
      minHeight: 36, display: "inline-flex", alignItems: "center",
    }}>{children}</button>
  );
}
function CModal({ title, onClose, children, width = 500 }: any) {
  return (
    <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-panel" style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, width: "100%", maxWidth: width, maxHeight: "88dvh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 90px rgba(0,0,0,0.6)", animation: "scaleIn 0.2s ease", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {/* drag indicator */}
        <div style={{ width: 40, height: 4, background: "rgba(255,255,255,0.18)", borderRadius: 99, margin: "12px auto 4px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#aaa", fontSize: 18, cursor: "pointer", width: 34, height: 34, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", padding: "18px 20px", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
function EmptyState({ icon, text }: any) {
  return (
    <div style={{ gridColumn: "1/-1", padding: 60, textAlign: "center", color: "#555" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div>{text}</div>
    </div>
  );
}
