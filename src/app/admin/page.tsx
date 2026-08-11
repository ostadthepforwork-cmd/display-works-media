/* eslint-disable @next/next/no-img-element -- Admin uses dynamic data-URL previews and CMS/PDF HTML image strings that should not pass through next/image optimization. */
/* eslint-disable react-hooks/exhaustive-deps -- Several admin editors intentionally hydrate persisted data once on mount to avoid overwriting active form input. */
// @ts-nocheck
'use client';
// â”€â”€â”€ IMPORTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { blogCategories } from '@/lib/seo-content';
import { loadLocal, saveLocal } from '@/lib/browser-storage';
import { isReportDoc, reportRootId, reportingDocuments } from '@/lib/erp-reporting';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import MarketingKpiDashboard from './MarketingKpiDashboard';

const supabase = getSupabaseBrowserClient();

function isLocalAdminBypass() {
  if (typeof window === "undefined") return false;
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_DISABLE_LOCAL_ADMIN_BYPASS !== "1" &&
    (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost")
  );
}

async function requireErpSession() {
  if (isLocalAdminBypass()) {
    return {
      id: "local-dev-admin",
      email: "local-dev@displayworksmedia.test",
    };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Session à¸«à¸¡à¸”à¸­à¸²à¸¢à¸¸à¸«à¸£à¸·à¸­à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¹„à¸”à¹‰à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆà¸£à¸°à¸šà¸š à¸à¸£à¸¸à¸“à¸² login à¹ƒà¸«à¸¡à¹ˆ");
  }
  return data.user;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(`${label} à¹ƒà¸Šà¹‰à¹€à¸§à¸¥à¸²à¸™à¸²à¸™à¹€à¸à¸´à¸™à¹„à¸›`)), timeoutMs);
    }),
  ]);
}

// â”€â”€â”€ CMS HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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



// â”€â”€â”€ ERP HELPERS + DATA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  { value: "piece", label: "à¸•à¹ˆà¸­à¸Šà¸´à¹‰à¸™" },
  { value: "sqm", label: "à¸•à¹ˆà¸­à¸•à¸²à¸£à¸²à¸‡à¹€à¸¡à¸•à¸£" },
];
const priceBasisLabel = (value?: string) =>
  PRICE_BASIS_OPTIONS.find((option) => option.value === value)?.label || "à¸•à¹ˆà¸­à¸Šà¸´à¹‰à¸™";
const isSqmBasis = (value?: string) => value === "sqm";
const itemBillingBasis = (item: any) =>
  isSqmBasis(item?.priceUnit) || isSqmBasis(item?.costUnit) || String(item?.unit || "").includes("à¸•à¸£.à¸¡")
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
  /ems|shipping|delivery|à¸‚à¸™à¸ªà¹ˆà¸‡|à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡|à¸„à¹ˆà¸²à¸ªà¹ˆà¸‡|à¸ªà¹ˆà¸‡à¸‚à¸­à¸‡|à¸žà¸±à¸ªà¸”à¸¸/i.test(String(item?.name || ""));
const fallbackItemCost = (products: any[], item: any) => {
  const snapshot = Number(item.costSnapshot || 0);
  if (snapshot > 0) return snapshot;
  if (isShippingItem(item)) return Number(item.price || 0);
  return findProductForItem(products, item)?.cost || 0;
};
const docVatRate = (doc: any) => Number(doc?.vatRate ?? doc?.vat_rate ?? 7);
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
        unit: item.unit || (basis === "sqm" ? "à¸•à¸£.à¸¡." : "à¸Šà¸´à¹‰à¸™"),
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
    detailText.match(/(?:à¸ˆà¸³à¸™à¸§à¸™|qty|pieces?)\D{0,12}(\d+(?:\.\d+)?)/i)?.[1]
    || detailText.match(/[xÃ—]\s*(\d+(?:\.\d+)?)\s*(?:à¸Šà¸´à¹‰à¸™|pcs?)/i)?.[1]
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
    unit: "à¸Šà¸´à¹‰à¸™",
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
    .filter((line) => line && !/(à¸•à¸£\.?à¸¡|à¸•à¸²à¸£à¸²à¸‡à¹€à¸¡à¸•à¸£|sqm|square\s*meter|à¸žà¸·à¹‰à¸™à¸—à¸µà¹ˆà¸£à¸§à¸¡|à¸„à¸³à¸™à¸§à¸“à¸žà¸·à¹‰à¸™à¸—à¸µà¹ˆ)/i.test(line));

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

// â”€â”€ Shared calculation utility â€” à¹ƒà¸Šà¹‰à¸£à¹ˆà¸§à¸¡à¸à¸±à¸™à¸—à¸¸à¸à¸ˆà¸¸à¸” â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  if (!/(à¸¡à¸±à¸”à¸ˆà¸³|deposit)/i.test(text)) return { depositPaid: 0, depositDate: "", depositNote: "" };

  const percent =
    text.match(/(?:à¸¡à¸±à¸”à¸ˆà¸³|deposit)[^\d]{0,24}(\d+(?:\.\d+)?)\s*%/i)?.[1]
    || text.match(/(\d+(?:\.\d+)?)\s*%[^\n]{0,24}(?:à¸¡à¸±à¸”à¸ˆà¸³|deposit)/i)?.[1];
  if (percent) {
    const paid = netPay * (Math.min(100, Math.max(0, Number(percent))) / 100);
    return { depositPaid: paid, depositDate: "", depositNote: `à¸Šà¸³à¸£à¸°à¸¡à¸±à¸”à¸ˆà¸³ ${fmtMoney(Number(percent))}%` };
  }

  const amount =
    text.match(/(?:à¸¡à¸±à¸”à¸ˆà¸³|deposit)[^\d]{0,24}(\d[\d,]*(?:\.\d+)?)/i)?.[1]
    || text.match(/(\d[\d,]*(?:\.\d+)?)[^\n]{0,16}(?:à¸šà¸²à¸—|THB)[^\n]{0,24}(?:à¸¡à¸±à¸”à¸ˆà¸³|deposit)/i)?.[1];
  if (amount) {
    const paid = Math.min(netPay, Math.max(0, Number(String(amount).replace(/,/g, "")) || 0));
    return { depositPaid: paid, depositDate: "", depositNote: "à¸Šà¸³à¸£à¸°à¸¡à¸±à¸”à¸ˆà¸³à¸•à¸²à¸¡à¸«à¸¡à¸²à¸¢à¹€à¸«à¸•à¸¸" };
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
  quote: { label: "à¹ƒà¸šà¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸²", short: "QT", color: "#3B82F6", prefix: "QT" },
  bill: { label: "à¹ƒà¸šà¸§à¸²à¸‡à¸šà¸´à¸¥", short: "BL", color: "#8B5CF6", prefix: "BL" },
  invoice: { label: "à¹ƒà¸šà¹à¸ˆà¹‰à¸‡à¸«à¸™à¸µà¹‰", short: "IV", color: "#F59E0B", prefix: "IV" },
  receipt: { label: "à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆà¸£à¸±à¸šà¹€à¸‡à¸´à¸™", short: "RC", color: "#10B981", prefix: "RC" },
};

const STATUS_COLORS = {
  draft: "#6B7280", sent: "#3B82F6", approved: "#10B981", cancelled: "#EF4444", paid: "#10B981",
};
const STATUS_LABELS = {
  draft: "à¸‰à¸šà¸±à¸šà¸£à¹ˆà¸²à¸‡", sent: "à¸ªà¹ˆà¸‡à¹à¸¥à¹‰à¸§", approved: "à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´", cancelled: "à¸¢à¸à¹€à¸¥à¸´à¸", paid: "à¸Šà¸³à¸£à¸°à¹à¸¥à¹‰à¸§",
};
STATUS_COLORS.partial_paid = "#F59E0B";
STATUS_LABELS.partial_paid = "à¸Šà¸³à¸£à¸°à¸šà¸²à¸‡à¸ªà¹ˆà¸§à¸™";

// ============================================================
// INITIAL DATA
// ============================================================
const INIT_CUSTOMERS = [
  { id: genId(), name: "à¸šà¸£à¸´à¸©à¸±à¸— à¹€à¸­à¸šà¸µà¸‹à¸µ à¸ˆà¸³à¸à¸±à¸”", contact: "à¸„à¸¸à¸“à¸ªà¸¡à¸Šà¸²à¸¢", phone: "081-234-5678", email: "abc@example.com", address: "123 à¸–.à¸ªà¸¸à¸‚à¸¸à¸¡à¸§à¸´à¸— à¸à¸£à¸¸à¸‡à¹€à¸—à¸žà¸¯ 10110", taxId: "0105550123456" },
  { id: genId(), name: "à¸£à¹‰à¸²à¸™ XYZ à¸¡à¸²à¸£à¹Œà¹€à¸à¹‡à¸•à¸•à¸´à¹‰à¸‡", contact: "à¸„à¸¸à¸“à¸ªà¸¡à¸«à¸à¸´à¸‡", phone: "089-876-5432", email: "xyz@example.com", address: "456 à¸–.à¸£à¸±à¸Šà¸”à¸² à¸à¸£à¸¸à¸‡à¹€à¸—à¸žà¸¯ 10400", taxId: "" },
];
const INIT_PRODUCTS = [
  { id: genId(), name: "à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥ (à¸•à¹ˆà¸­à¸•à¸£.à¸¡.)", unit: "à¸•à¸£.à¸¡.", cost: 80, price: 200, costUnit: "sqm", priceUnit: "sqm" },
  { id: genId(), name: "à¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œ Indoor", unit: "à¸•à¸£.à¸¡.", cost: 120, price: 350, costUnit: "sqm", priceUnit: "sqm" },
  { id: genId(), name: "à¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œ Outdoor", unit: "à¸•à¸£.à¸¡.", cost: 180, price: 450, costUnit: "sqm", priceUnit: "sqm" },
  { id: genId(), name: "PP Board", unit: "à¹à¸œà¹ˆà¸™", cost: 150, price: 400, costUnit: "piece", priceUnit: "piece" },
  { id: genId(), name: "Roll Up Stand", unit: "à¸Šà¸´à¹‰à¸™", cost: 800, price: 2200, costUnit: "piece", priceUnit: "piece" },
  { id: genId(), name: "Backdrop 3x2m", unit: "à¸Šà¸¸à¸”", cost: 1200, price: 3500, costUnit: "piece", priceUnit: "piece" },
  { id: genId(), name: "à¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸² A5", unit: "100 à¸Šà¸´à¹‰à¸™", cost: 150, price: 400, costUnit: "piece", priceUnit: "piece" },
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
// PRINT / PDF helper â€” Premium A4 Design (Display Works Media)
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

  // â”€â”€ Calculations (shared utility) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { subtotal, discountAmt, afterDisc, vatAmt, total, whtAmt, netPay, depositPaid, depositDate, depositNote, paymentType, balanceDue } = calcDocTotal(doc, linkedDocuments);
  const paymentLabel = paymentType === "full" || paymentType === "final" ? "PAYMENT RECEIVED" : paymentType === "partial" ? "PARTIAL PAYMENT" : "DEPOSIT PAID";
  const finalTotalLabel = depositPaid > 0 ? (balanceDue > 0 ? "BALANCE DUE" : "PAID IN FULL") : "GRAND TOTAL";

  // â”€â”€ Label mapping per document type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const DOC_LABELS = {
    quote:   { en: "QUOTATION",    sub: "à¹ƒà¸šà¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸²",     valid: "à¸¢à¸·à¸™à¸¢à¸±à¸™à¸£à¸²à¸„à¸²à¸–à¸¶à¸‡" },
    bill:    { en: "BILLING NOTE", sub: "à¹ƒà¸šà¸§à¸²à¸‡à¸šà¸´à¸¥",        valid: "à¸§à¸±à¸™à¸„à¸£à¸šà¸à¸³à¸«à¸™à¸”" },
    invoice: { en: "INVOICE",      sub: "à¹ƒà¸šà¹à¸ˆà¹‰à¸‡à¸«à¸™à¸µà¹‰",      valid: "à¸§à¸±à¸™à¸„à¸£à¸šà¸à¸³à¸«à¸™à¸”" },
    receipt: { en: "RECEIPT",      sub: "à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆà¸£à¸±à¸šà¹€à¸‡à¸´à¸™",  valid: "à¸§à¸±à¸™à¸—à¸µà¹ˆà¸Šà¸³à¸£à¸°" },
  };
  const lbl = DOC_LABELS[doc.type] || DOC_LABELS.quote;

  // â”€â”€ Table rows â€” with bullet detail list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Summary rows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      <td style="padding:7px 12px;color:#64748b;font-size:10px;font-weight:600;">à¸«à¸±à¸ à¸“ à¸—à¸µà¹ˆà¸ˆà¹ˆà¸²à¸¢ ${doc.whtRate}%</td>
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

  // â”€â”€ Notes list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const noteItems = doc.notes
    ? doc.notes.split("\n").filter(Boolean).map(n =>
        `<li style="margin-bottom:3px;">${n}</li>`).join("")
    : "<li>à¸‚à¸­à¸šà¸„à¸¸à¸“à¸—à¸µà¹ˆà¹„à¸§à¹‰à¸§à¸²à¸‡à¹ƒà¸ˆ Display Works Media</li>";

  const logoUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/images/logo.png?v=doc-logo`
      : "/images/logo.png?v=doc-logo";

  // â”€â”€ Full HTML â€” Premium quotation layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  <!-- â•â•â• HEADER â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
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
          ${company.phone ? "à¹‚à¸—à¸£. " + company.phone : ""}
          ${company.phone && company.email ? " &nbsp;|&nbsp; " : ""}
          ${company.email ? company.email : ""}
          ${company.taxId ? " &nbsp;|&nbsp; à¹€à¸¥à¸‚à¸œà¸¹à¹‰à¹€à¸ªà¸µà¸¢à¸ à¸²à¸©à¸µ: " + company.taxId : ""}
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

    <!-- â•â•â• CLIENT + META â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <div style="display:grid;grid-template-columns:7fr 5fr;gap:0;
                border-bottom:1px solid #e2e8f0;padding-bottom:16px;margin-bottom:16px;">
      <!-- To / client -->
      <div style="padding-right:20px;border-right:1px solid #e2e8f0;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:7px;">
          <span style="color:#FF5500;font-weight:800;font-size:12px;">TO</span>
          <span style="color:#cbd5e1;font-size:10px;">/</span>
          <span style="color:#94a3b8;font-size:10px;font-weight:500;">à¸¥à¸¹à¸à¸„à¹‰à¸²</span>
        </div>
        <div style="font-weight:700;font-size:13px;color:#0f172a;margin-bottom:4px;">${cust.name || "-"}</div>
        ${custAddress ? `<div style="font-size:10.5px;color:#64748b;line-height:1.7;margin-bottom:5px;white-space:pre-line;">${custAddress}</div>` : ""}
        <div style="font-size:10.5px;color:#64748b;display:flex;flex-direction:column;gap:2px;">
          ${cust.taxId ? `<div><span style="font-weight:600;color:#475569;">à¹€à¸¥à¸‚à¸›à¸£à¸°à¸ˆà¸³à¸•à¸±à¸§à¸œà¸¹à¹‰à¹€à¸ªà¸µà¸¢à¸ à¸²à¸©à¸µ</span> ${cust.taxId}</div>` : ""}
          ${cust.phone ? `<div><span style="font-weight:600;color:#475569;">à¹‚à¸—à¸£.</span> ${cust.phone}</div>` : ""}
          ${cust.email ? `<div><span style="font-weight:600;color:#475569;">à¸­à¸µà¹€à¸¡à¸¥:</span> ${cust.email}</div>` : ""}
        </div>
        ${doc.projectName ? `<div style="margin-top:6px;font-size:10px;color:#64748b;"><span style="font-weight:600;color:#475569;">à¹‚à¸„à¸£à¸‡à¸à¸²à¸£:</span> ${doc.projectName}</div>` : ""}
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

    <!-- â•â•â• ITEMS TABLE â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;margin-bottom:16px;">
      <thead>
        <tr style="background:#2c2d30;color:#fff;text-align:center;">
          <th style="padding:9px 6px;font-size:9px;font-weight:700;border-right:1px solid #444;width:6%;">
            ITEM<br/><span style="font-size:7px;font-weight:400;opacity:.7;">à¸¥à¸³à¸”à¸±à¸š</span>
          </th>
          <th style="padding:9px 10px;font-size:9px;font-weight:700;border-right:1px solid #444;text-align:left;width:20%;">
            DESCRIPTION<br/><span style="font-size:7px;font-weight:400;opacity:.7;">à¸£à¸²à¸¢à¸à¸²à¸£</span>
          </th>
          <th style="padding:9px 10px;font-size:9px;font-weight:700;border-right:1px solid #444;text-align:left;width:30%;">
            DETAIL<br/><span style="font-size:7px;font-weight:400;opacity:.7;">à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”</span>
          </th>
          <th style="padding:9px 6px;font-size:9px;font-weight:700;border-right:1px solid #444;width:8%;">
            QTY.<br/><span style="font-size:7px;font-weight:400;opacity:.7;">à¸ˆà¸³à¸™à¸§à¸™</span>
          </th>
          <th style="padding:9px 6px;font-size:9px;font-weight:700;border-right:1px solid #444;width:8%;">
            UNIT<br/><span style="font-size:7px;font-weight:400;opacity:.7;">à¸«à¸™à¹ˆà¸§à¸¢</span>
          </th>
          <th style="padding:9px 6px;font-size:9px;font-weight:700;border-right:1px solid #444;width:14%;">
            UNIT PRICE<br/><span style="font-size:7px;font-weight:400;opacity:.7;">à¸£à¸²à¸„à¸²à¸•à¹ˆà¸­à¸«à¸™à¹ˆà¸§à¸¢</span>
          </th>
          <th style="padding:9px 6px;font-size:9px;font-weight:700;width:14%;">
            AMOUNT<br/><span style="font-size:7px;font-weight:400;opacity:.7;">à¸ˆà¸³à¸™à¸§à¸™à¹€à¸‡à¸´à¸™</span>
          </th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <!-- â•â•â• LOWER: REMARKS + PAYMENT + SUMMARY + SIGNATURES â•â• -->
    <div style="display:grid;grid-template-columns:7fr 5fr;gap:16px;">

      <!-- Left: Remarks + Payment info + Signatures -->
      <div style="display:flex;flex-direction:column;gap:12px;">

        <!-- Remarks -->
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;background:#f8fafc;">
          <div style="color:#FF5500;font-weight:700;font-size:8.5px;letter-spacing:1.5px;
                      text-transform:uppercase;margin-bottom:6px;">REMARKS / à¸«à¸¡à¸²à¸¢à¹€à¸«à¸•à¸¸</div>
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
              <span style="color:#94a3b8;">à¸Šà¸·à¹ˆà¸­à¸šà¸±à¸à¸Šà¸µ:</span>
              <span style="font-weight:700;color:#1e293b;"> ${doc.bankName || company.bankName || printCompanyName || "-"}</span>
            </div>
            <div style="font-size:10px;color:#64748b;margin-bottom:2px;">
              <span style="color:#94a3b8;">à¸˜à¸™à¸²à¸„à¸²à¸£:</span> ${doc.bankBranch || company.bankBranch || "-"}
            </div>
            <div style="font-size:10px;color:#64748b;margin-bottom:2px;">
              <span style="color:#94a3b8;">à¹€à¸¥à¸‚à¸šà¸±à¸à¸Šà¸µ:</span>
              <span style="font-weight:700;color:#1e293b;"> ${doc.bankAccount || company.bankAccount || "-"}</span>
            </div>
            <div style="font-size:9px;color:#94a3b8;font-style:italic;">
              <span style="color:#94a3b8;">à¸›à¸£à¸°à¹€à¸ à¸—:</span> ${doc.bankType || company.bankType || "à¸­à¸­à¸¡à¸—à¸£à¸±à¸žà¸¢à¹Œ"}
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
            <div style="font-size:7px;color:#94a3b8;margin-top:3px;">à¸ªà¹à¸à¸™à¹€à¸žà¸·à¹ˆà¸­à¸Šà¸³à¸£à¸°à¹€à¸‡à¸´à¸™</div>
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
                ? `<img src="${company.signatureImage}" alt="à¸¥à¸²à¸¢à¹€à¸‹à¹‡à¸™" style="max-height:48px;max-width:120px;object-fit:contain;">`
                : `<div style="border-bottom:1px solid #cbd5e1;width:80%;margin:8px auto;"></div>`}
            </div>
            <div style="font-size:8px;color:#94a3b8;">
              ( ${doc.salesPerson || company.salesPerson || "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"} )<br/>
              <span style="font-size:7.5px;font-weight:600;color:#64748b;">à¸œà¸¹à¹‰à¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸²</span>
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
              <span style="font-size:7.5px;font-weight:600;color:#64748b;">à¸œà¸¹à¹‰à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´à¸ªà¸±à¹ˆà¸‡à¸‹à¸·à¹‰à¸­</span>
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

  <!-- â•â•â• FOOTER â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
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
    alert("à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¹€à¸›à¸´à¸”à¸«à¸™à¹‰à¸²à¸•à¹ˆà¸²à¸‡à¹€à¸­à¸à¸ªà¸²à¸£à¹„à¸”à¹‰ à¸à¸£à¸¸à¸“à¸²à¸­à¸™à¸¸à¸à¸²à¸• Pop-up à¸ªà¸³à¸«à¸£à¸±à¸šà¹€à¸§à¹‡à¸šà¸™à¸µà¹‰");
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
    if (typeof window === "undefined") return "home";
    const requestedSection = new URLSearchParams(window.location.search).get("section");
    return ["home", "erp", "cms", "marketing"].includes(requestedSection || "") ? requestedSection! : "home";
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
    // à¹ƒà¸«à¹‰ DOM render/à¸›à¸´à¸” drawer à¹€à¸ªà¸£à¹‡à¸ˆà¸à¹ˆà¸­à¸™à¸„à¹ˆà¸­à¸¢ scroll à¸à¸±à¸™à¸›à¸±à¸à¸«à¸²à¸•à¸³à¹à¸«à¸™à¹ˆà¸‡à¹€à¸žà¸µà¹‰à¸¢à¸™à¸•à¸­à¸™à¸›à¸´à¸” drawer
    setTimeout(() => {
      document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

// â”€â”€â”€ ERP STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [erpPage, setErpPage] = useState("dashboard");
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [company, setCompany] = useState<any>({
    id: "", name: "", address: "", phone: "", email: "", taxId: "",
    salesPerson: "", bankName: "", bankBranch: "", bankAccount: "", bankType: "à¸­à¸­à¸¡à¸—à¸£à¸±à¸žà¸¢à¹Œ", qrImage: "", signatureImage: "",
  });
  const [erpLoading, setErpLoading] = useState(true);
  const [erpLoadError, setErpLoadError] = useState("");

  // â”€â”€ à¹‚à¸«à¸¥à¸”à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸ˆà¸²à¸ Supabase à¸„à¸£à¸±à¹‰à¸‡à¹à¸£à¸ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    async function loadAll() {
      setErpLoading(true);
      setErpLoadError("");
      try {
        await withTimeout(requireErpSession(), 8000, "ERP auth check");
        const [custRes, prodRes, docRes, itemRes, compRes] = await withTimeout(Promise.all([
          supabase.from("erp_customers").select("*").order("created_at"),
          supabase.from("erp_products").select("*").order("created_at"),
          supabase.from("erp_documents").select("*").eq("deleted", false).order("created_at", { ascending: false }),
          supabase.from("erp_document_items").select("*").order("sort_order"),
          supabase.from("erp_company").select("*").limit(1).maybeSingle(),
        ]), 10000, "à¹‚à¸«à¸¥à¸”à¸‚à¹‰à¸­à¸¡à¸¹à¸¥ ERP");
        const loadError = [custRes, prodRes, docRes, itemRes, compRes].find((res) => res.error)?.error;
        if (loadError) throw loadError;

        // map snake_case â†’ camelCase à¸ªà¸³à¸«à¸£à¸±à¸š customers
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
          const { data, error } = await withTimeout(
            supabase.from("erp_suppliers").select("*").order("created_at"),
            6000,
            "à¹‚à¸«à¸¥à¸”à¸‚à¹‰à¸­à¸¡à¸¹à¸¥ Supplier",
          );
          if (error) throw error;
          let supplierRows = data || [];
          const localSuppliers = loadLocal("erp_suppliers", []) as any[];
          if (!isLocalAdminBypass() && supplierRows.length === 0 && Array.isArray(localSuppliers) && localSuppliers.length > 0) {
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
              showToast("à¸à¸¹à¹‰à¸‚à¹‰à¸­à¸¡à¸¹à¸¥ Supplier à¸ˆà¸²à¸à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡à¹à¸¥à¸°à¸šà¸±à¸™à¸—à¸¶à¸à¸¥à¸‡ database à¹à¸¥à¹‰à¸§");
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
          bankAccount: compRes.data.bank_account || "", bankType: compRes.data.bank_type || "à¸­à¸­à¸¡à¸—à¸£à¸±à¸žà¸¢à¹Œ",
          qrImage: compRes.data.qr_image || "",
          signatureImage: compRes.data.signature_image || "",
        });
      } catch (err) {
        console.error("ERP load error:", err);
        setErpLoadError(((err as any)?.message || String(err)));
        showToast("à¹‚à¸«à¸¥à¸”à¸‚à¹‰à¸­à¸¡à¸¹à¸¥ ERP à¸ˆà¸²à¸ database à¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ: " + ((err as any)?.message || err), "error");
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
      // à¹ƒà¸Šà¹‰ costSnapshot (à¸šà¸±à¸™à¸—à¸¶à¸à¸•à¸­à¸™ save) à¸–à¹‰à¸²à¸¡à¸µ â€” à¹„à¸¡à¹ˆà¸‡à¸±à¹‰à¸™à¸«à¸²à¸ˆà¸²à¸ products list (backward compat)
      return ss + lineCost(i, resolveItemCost(i));
    }, 0);
  }, 0);
  const totalProfit = totalRevenue - totalCost;

  const cmsTabs = [
    { id: "blog", icon: "ðŸ“", label: "à¸šà¸—à¸„à¸§à¸²à¸¡" },
    { id: "hero", icon: "ðŸ–¼ï¸", label: "Hero Section" },
    { id: "services", icon: "ðŸ› ï¸", label: "à¸šà¸£à¸´à¸à¸²à¸£" },
    { id: "reviews", icon: "â­", label: "à¸£à¸µà¸§à¸´à¸§" },
    { id: "portfolio", icon: "ðŸ–¼", label: "à¸œà¸¥à¸‡à¸²à¸™" },
    { id: "page_content", icon: "ðŸ“„", label: "à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸£à¸²à¸¢à¸«à¸™à¹‰à¸²" },
    { id: "contact", icon: "ðŸ“ž", label: "à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸•à¸´à¸”à¸•à¹ˆà¸­" },
  ];

  return (
    <div className="admin-app-shell" style={{ minHeight: "100vh", background: "#0B0F19", color: "#fff", fontFamily: "'Prompt','Sarabun',sans-serif", display: "flex", flexDirection: "column" }}>

      {/* â”€â”€â”€ TOP BAR â”€â”€â”€ */}
      <div className="top-bar" style={{
        background: "#141A24", borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center",
        minHeight: 52,
        padding: "0 16px",
        paddingTop: "max(env(safe-area-inset-top, 0px), 0px)",
        gap: 8, flexShrink: 0, zIndex: 100,
      }}>
        <Image
          src="/images/logo.png"
          alt="Display Works Media"
          width={32}
          height={28}
          style={{ width: 32, height: 28, objectFit: "contain", marginRight: 4, flexShrink: 0 }}
        />
        <span className="hide-mobile" style={{ fontWeight: 600, fontSize: 13, color: "#fff", marginRight: 16 }}>Display Works</span>
        <div className="hide-mobile" style={{ display: "flex", gap: 4 }}>
          <button type="button" onClick={() => setMainTab("home")} style={{
            padding: "6px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
            background: mainTab === "home" ? "#FF6B00" : "transparent",
            color: mainTab === "home" ? "#fff" : "#A8B0C0", transition: "all 0.2s",
          }}>
            Home
          </button>
          {["erp","cms"].map(t => (
            <button type="button" key={t} onClick={() => setMainTab(t)} style={{
              padding: "6px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
              background: mainTab === t ? "#FF6B00" : "transparent",
              color: mainTab === t ? "#fff" : "#A8B0C0", transition: "all 0.2s",
            }}>
              {t === "erp" ? "âš™ï¸ ERP" : "âœï¸ CMS"}
            </button>
          ))}
          <button type="button" onClick={() => setMainTab("marketing")} style={{
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
            {mainTab === "home" ? "Admin" : mainTab === "erp"
              ? (erpPage === "dashboard" ? "à¸ à¸²à¸žà¸£à¸§à¸¡" : erpPage === "customers" ? "à¸¥à¸¹à¸à¸„à¹‰à¸²" : erpPage === "products" ? "à¸ªà¸´à¸™à¸„à¹‰à¸²" : erpPage === "suppliers" ? "Supplier" : erpPage === "company" ? "à¸šà¸£à¸´à¸©à¸±à¸—" : (DOC_TYPES as any)[erpPage]?.label || erpPage)
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
        {mainTab === "home" && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div className="main-content-area admin-home-content" style={{ flex: 1, overflowY: "auto", padding: "clamp(14px,3vw,28px)", paddingBottom: "clamp(80px,10vw,28px)" }}>
              <AdminHome
                customers={customers}
                documents={documents}
                products={catalogProducts}
                totalRevenue={totalRevenue}
                totalCost={totalCost}
                totalProfit={totalProfit}
                docCounts={docCounts}
                setMainTab={setMainTab}
                setErpPage={setErpPage}
                setTab={setTab}
                setMarketingMobileSection={setMarketingMobileSection}
              />
            </div>
          </div>
        )}
        {/* â”€â”€â”€ ERP â”€â”€â”€ */}
        {mainTab === "erp" && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div className="hide-mobile" style={{ display: "flex" }}>
              <ErpSidebar page={erpPage} setPage={setErpPage} docCounts={docCounts} />
            </div>
            <div className="main-content-area" style={{ flex: 1, overflowY: "auto", padding: "clamp(14px,3vw,28px)", paddingBottom: "clamp(80px,10vw,28px)" }}>
              {erpLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#888", fontSize: 14, gap: 10 }}>
                  <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>â³</span> à¸à¸³à¸¥à¸±à¸‡à¹‚à¸«à¸¥à¸”à¸‚à¹‰à¸­à¸¡à¸¹à¸¥...
                </div>
              ) : erpLoadError ? (
                <div className="erp-load-error-card" style={{
                  maxWidth: 620,
                  margin: "clamp(32px, 10vh, 96px) auto",
                  padding: 24,
                  borderRadius: 18,
                  background: "rgba(20,26,36,0.92)",
                  border: "1px solid rgba(239,68,68,0.35)",
                  boxShadow: "0 20px 80px rgba(0,0,0,0.35)",
                  color: "#fff",
                }}>
                  <div style={{ color: "#EF4444", fontSize: 13, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
                    ERP LOAD ERROR
                  </div>
                  <h2 style={{ margin: 0, fontSize: 24, lineHeight: 1.25 }}>à¹‚à¸«à¸¥à¸”à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸«à¸¥à¸±à¸‡à¸šà¹‰à¸²à¸™à¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ</h2>
                  <p style={{ color: "#A8B0C0", fontSize: 14, lineHeight: 1.7, marginTop: 10 }}>
                    à¸£à¸°à¸šà¸šà¹€à¸›à¸´à¸”à¸«à¸™à¹‰à¸² admin à¹„à¸”à¹‰à¹à¸¥à¹‰à¸§ à¹à¸•à¹ˆà¸¢à¸±à¸‡à¸”à¸¶à¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸ˆà¸²à¸à¸à¸²à¸™à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹„à¸¡à¹ˆà¹„à¸”à¹‰à¸„à¸£à¸š à¸­à¸²à¸ˆà¹€à¸à¸´à¸”à¸ˆà¸²à¸ session à¸«à¸¡à¸”à¸­à¸²à¸¢à¸¸, Supabase RLS, à¸«à¸£à¸·à¸­ local environment à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¹„à¸”à¹‰ login à¸ˆà¸£à¸´à¸‡
                  </p>
                  <div style={{
                    marginTop: 14,
                    padding: 12,
                    borderRadius: 12,
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#FCA5A5",
                    fontSize: 13,
                    lineHeight: 1.6,
                    wordBreak: "break-word",
                  }}>
                    {erpLoadError}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      style={{
                        flex: "1 1 160px",
                        minHeight: 44,
                        borderRadius: 10,
                        background: "#C2410C",
                        color: "#fff",
                        border: "none",
                        fontFamily: "inherit",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      à¸¥à¸­à¸‡à¹‚à¸«à¸¥à¸”à¹ƒà¸«à¸¡à¹ˆ
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/login")}
                      style={{
                        flex: "1 1 160px",
                        minHeight: 44,
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.04)",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.12)",
                        fontFamily: "inherit",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      à¹„à¸›à¸«à¸™à¹‰à¸² Login
                    </button>
                  </div>
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

        {/* â”€â”€â”€ CMS â”€â”€â”€ */}
        {mainTab === "cms" && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div className="hide-mobile" style={{ width: 200, background: "#141A24", borderRight: "1px solid rgba(255,255,255,0.07)", padding: "16px 8px", display: "flex", flexDirection: "column" as const, gap: 4, flexShrink: 0 }}>
              {cmsTabs.map(t => (
                <button type="button" key={t.id} onClick={() => setTab(t.id)} style={{
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

      {/* â”€â”€â”€ MOBILE BOTTOM NAV â”€â”€â”€ */}
      <div className="show-mobile admin-bottom-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
        background: "rgba(20,26,36,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex", paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
      }}>
        {mainTab === "home" && ([
          { id: "home", icon: "âŒ‚", label: "à¸«à¸™à¹‰à¸²à¹à¸£à¸" },
          { id: "erp", icon: "ERP", label: "à¸‡à¸²à¸™à¸‚à¸²à¸¢" },
          { id: "cms", icon: "CMS", label: "à¹€à¸§à¹‡à¸šà¹„à¸‹à¸•à¹Œ" },
          { id: "marketing", icon: "MKT", label: "à¸à¸²à¸£à¸•à¸¥à¸²à¸”" },
          { id: "__more__", icon: "â˜°", label: "à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡" },
        ] as any[]).map(item => (
          <button type="button" key={item.id} onClick={() => {
            if (item.id === "__more__") setShowMobileDrawer(v => !v);
            else {
              setMainTab(item.id);
              if (item.id === "erp") setErpPage("dashboard");
              if (item.id === "cms") setTab("blog");
              if (item.id === "marketing") setMarketingMobileSection("overview");
              setShowMobileDrawer(false);
            }
          }} style={{
            flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
            padding: "10px 2px 8px", border: "none", cursor: "pointer", fontFamily: "inherit",
            background: (item.id === "home" && !showMobileDrawer) || (item.id === "__more__" && showMobileDrawer) ? "rgba(255,107,0,0.12)" : "transparent",
            color: (item.id === "home" && !showMobileDrawer) || (item.id === "__more__" && showMobileDrawer) ? "#FF6B00" : "#6B7280",
          }} className="nav-btn">
            <span style={{ fontSize: item.id === "home" || item.id === "__more__" ? 22 : 11, lineHeight: 1, fontWeight: 900 }}>{item.icon}</span>
            <span style={{ fontSize: 10, marginTop: 4, fontWeight: 600 }}>{item.label}</span>
          </button>
        ))}
        {mainTab === "erp" && ([
          { id: "dashboard", icon: "âŠž", label: "à¸ à¸²à¸žà¸£à¸§à¸¡" },
          { id: "quote",     icon: "ðŸ“‹", label: "à¹ƒà¸šà¹€à¸ªà¸™à¸­" },
          { id: "invoice",   icon: "ðŸ§¾", label: "à¹ƒà¸šà¹à¸ˆà¹‰à¸‡à¸«à¸™à¸µà¹‰" },
          { id: "receipt",   icon: "âœ…", label: "à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆ" },
          { id: "__more__",  icon: "â˜°",  label: "à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡" },
        ] as any[]).map(item => (
          <button type="button" key={item.id} onClick={() => {
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
          { id: "__more__", icon: "â˜°", label: "à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡" },
        ] as any[]).map(item => (
          <button type="button" key={item.id} onClick={() => {
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
          { id: "overview", icon: "ðŸ“Š", label: "à¸ à¸²à¸žà¸£à¸§à¸¡", anchor: "marketing-dashboard" },
          { id: "campaigns", icon: "ðŸ“£", label: "à¹à¸„à¸¡à¹€à¸›à¸", anchor: "marketing-campaigns" },
          { id: "sources", icon: "ðŸ”—", label: "à¹à¸«à¸¥à¹ˆà¸‡à¸—à¸µà¹ˆà¸¡à¸²", anchor: "marketing-data-sources" },
          { id: "tracking", icon: "ðŸŽ¯", label: "à¸•à¸´à¸”à¸•à¸²à¸¡", anchor: "marketing-crm" },
          { id: "__more__", icon: "â˜°", label: "à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡" },
        ] as any[]).map(item => (
          <button type="button" key={item.id} onClick={() => {
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

      {/* â”€â”€â”€ MOBILE DRAWER â”€â”€â”€ */}
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
              {(["home", "erp", "cms", "marketing"] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  className={mainTab === t ? "active" : ""}
                  onClick={() => {
                    setMainTab(t);
                    if (t === "marketing") setMarketingMobileSection("overview");
                    setShowMobileDrawer(false);
                  }}
                >
                  {t === "home" ? "Home" : t === "marketing" ? "Marketing" : t.toUpperCase()}
                </button>
              ))}
            </div>
            <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 99, margin: "0 auto 12px" }} />

            {/* â”€ à¸Šà¸·à¹ˆà¸­à¸«à¸±à¸§à¸‚à¹‰à¸­ drawer â”€ */}
            <div style={{ fontSize: 11, fontWeight: 700, color: "#FF6B00", letterSpacing: 2, textTransform: "uppercase", padding: "0 24px 8px" }}>
              {mainTab === "erp" ? "à¹€à¸¡à¸™à¸¹à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”" : mainTab === "marketing" ? "Marketing" : "à¸ˆà¸±à¸”à¸à¸²à¸£à¹€à¸™à¸·à¹‰à¸­à¸«à¸²"}
            </div>

            {/* â”€ ERP: à¹à¸ªà¸”à¸‡à¸—à¸¸à¸à¹€à¸¡à¸™à¸¹ â”€ */}
            {mainTab === "erp" && ([
              { id: "dashboard", icon: "âŠž", label: "à¸ à¸²à¸žà¸£à¸§à¸¡",         color: "#A8B0C0" },
              { id: "quote",     icon: "ðŸ“‹", label: "à¹ƒà¸šà¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸²",     color: (DOC_TYPES as any).quote.color },
              { id: "bill",      icon: "ðŸ“„", label: "à¹ƒà¸šà¸§à¸²à¸‡à¸šà¸´à¸¥",       color: (DOC_TYPES as any).bill.color },
              { id: "invoice",   icon: "ðŸ§¾", label: "à¹ƒà¸šà¹à¸ˆà¹‰à¸‡à¸«à¸™à¸µà¹‰",     color: (DOC_TYPES as any).invoice.color },
              { id: "receipt",   icon: "âœ…", label: "à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆà¸£à¸±à¸šà¹€à¸‡à¸´à¸™", color: (DOC_TYPES as any).receipt.color },
              { id: "customers", icon: "ðŸ‘¥", label: "à¸¥à¸¹à¸à¸„à¹‰à¸²",          color: "#60A5FA" },
              { id: "products",  icon: "ðŸ“¦", label: "à¸ªà¸´à¸™à¸„à¹‰à¸²/à¸šà¸£à¸´à¸à¸²à¸£",  color: "#A78BFA" },
              { id: "suppliers", icon: "ðŸ­", label: "Supplier",       color: "#F97316" },
              { id: "company",   icon: "ðŸ¢", label: "à¸•à¸±à¹‰à¸‡à¸„à¹ˆà¸²à¸šà¸£à¸´à¸©à¸±à¸—",  color: "#34D399" },
              { id: "__cms__",   icon: "âœï¸", label: "à¹„à¸›à¸«à¸™à¹‰à¸² CMS",     color: "#F59E0B" },
            ] as any[]).map(item => {
              const isActive = item.id !== "__cms__" && erpPage === item.id;
              return (
                <button type="button" key={item.id} onClick={() => {
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
                    <span style={{ fontSize: 11, color: item.color, background: item.color + "22", padding: "2px 10px", borderRadius: 99 }}>à¹€à¸›à¸´à¸”</span>
                  )}
                  {isActive && <span style={{ fontSize: 11, color: "#FF6B00" }}>â— à¸à¸³à¸¥à¸±à¸‡à¹ƒà¸Šà¹‰</span>}
                  {item.id === "__cms__" && <span style={{ fontSize: 11, color: item.color, background: item.color + "22", padding: "2px 10px", borderRadius: 99 }}>à¸ªà¸¥à¸±à¸š</span>}
                </button>
              );
            })}

            {/* â”€ CMS: à¹à¸ªà¸”à¸‡à¸—à¸¸à¸à¹à¸—à¹‡à¸š â”€ */}
            {mainTab === "cms" && ([
              ...cmsTabs,
              { id: "__erp__", icon: "âš™ï¸", label: "à¹„à¸›à¸«à¸™à¹‰à¸² ERP", color: "#FF6B00" },
            ] as any[]).map(item => {
              const isActive = item.id !== "__erp__" && tab === item.id;
              return (
                <button type="button" key={item.id} onClick={() => {
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
                    <span style={{ fontSize: 11, color: "#A8B0C0", background: "rgba(255,255,255,0.06)", padding: "2px 10px", borderRadius: 99 }}>à¹€à¸›à¸´à¸”</span>
                  )}
                  {isActive && <span style={{ fontSize: 11, color: "#FF6B00" }}>â— à¸à¸³à¸¥à¸±à¸‡à¹ƒà¸Šà¹‰</span>}
                  {item.id === "__erp__" && <span style={{ fontSize: 11, color: item.color, background: item.color + "22", padding: "2px 10px", borderRadius: 99 }}>à¸ªà¸¥à¸±à¸š</span>}
                </button>
              );
            })}

            {/* â”€ Marketing: à¹à¸ªà¸”à¸‡à¸—à¸¸à¸ section â”€ */}
            {mainTab === "marketing" && ([
              { id: "overview", icon: "ðŸ“Š", label: "Dashboard", anchor: "marketing-dashboard" },
              { id: "campaigns", icon: "ðŸ“£", label: "Campaigns", anchor: "marketing-campaigns" },
              { id: "funnel", icon: "ðŸŒ", label: "Lead Funnel", anchor: "marketing-lead-funnel" },
              { id: "tracking", icon: "ðŸŽ¯", label: "Leads / CRM", anchor: "marketing-crm" },
              { id: "channels", icon: "ðŸ“¡", label: "Channels", anchor: "marketing-channels" },
              { id: "insight", icon: "ðŸ¤–", label: "AI Insight", anchor: "marketing-ai-insight" },
              { id: "sources", icon: "ðŸ”—", label: "Data Sources", anchor: "marketing-data-sources" },
            ] as any[]).map(item => {
              const isActive = marketingMobileSection === item.id;
              return (
                <button type="button" key={item.id} onClick={() => {
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
                  {isActive && <span style={{ fontSize: 11, color: "#FF6B00" }}>â— à¸à¸³à¸¥à¸±à¸‡à¹ƒà¸Šà¹‰</span>}
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
          <span>{toast.type === "error" ? "âœ—" : "âœ“"}</span>{toast.msg}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');

        /* â”€â”€ iPhone 15 Pro base resets â”€â”€ */
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
        input::placeholder, textarea::placeholder { color: #94A3B8 !important; opacity: 0.78; }
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
        .admin-app-shell {
          --admin-surface: #111923;
          --admin-surface-2: #141A24;
          --admin-line: rgba(255,255,255,0.09);
          --admin-muted: #94A3B8;
          color-scheme: dark;
        }
        .top-bar {
          box-shadow: 0 10px 34px rgba(0,0,0,0.22);
        }
        .main-content-area {
          background:
            radial-gradient(circle at 100% 0%, rgba(255,107,0,0.07), transparent 360px),
            linear-gradient(180deg, rgba(255,255,255,0.015), transparent 260px);
        }
        .nav-btn {
          position: relative;
          min-width: 0;
          transition: background .18s ease, color .18s ease, transform .18s ease;
        }
        .nav-btn:active {
          transform: translateY(1px);
        }
        .admin-bottom-nav {
          display: grid !important;
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }
        .admin-home {
          display: grid;
          gap: 22px;
          max-width: 1040px;
          margin: 0 auto;
        }
        .admin-home-hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .admin-home-brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .admin-home-brand img {
          width: 48px;
          height: 38px;
          object-fit: contain;
        }
        .admin-home-brand strong {
          display: block;
          font-size: 28px;
          line-height: 1.1;
        }
        .admin-home-brand span,
        .admin-home-date {
          color: #94A3B8;
          font-size: 13px;
        }
        .admin-home-summary {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(240px, 360px);
          gap: 24px;
          align-items: stretch;
          overflow: hidden;
          border-radius: 26px;
          padding: clamp(24px, 5vw, 40px);
          border: 1px solid rgba(255,107,0,.2);
          background:
            linear-gradient(135deg, rgba(11,15,25,.96), rgba(24,24,22,.94) 55%, rgba(255,107,0,.18)),
            #111923;
          box-shadow: 0 26px 90px rgba(0,0,0,.26);
          position: relative;
        }
        .admin-home-summary:after {
          content: "";
          position: absolute;
          inset: 0 0 0 auto;
          width: 34%;
          background: linear-gradient(135deg, transparent, rgba(255,107,0,.22));
          clip-path: polygon(42% 0, 100% 0, 100% 100%, 0 100%);
          opacity: .8;
          pointer-events: none;
        }
        .admin-home-summary > * {
          position: relative;
          z-index: 1;
        }
        .admin-home-summary span {
          color: #A8B0C0;
          font-weight: 700;
        }
        .admin-home-summary h1 {
          margin: 10px 0 12px;
          font-size: clamp(30px, 5vw, 52px);
          line-height: 1.05;
        }
        .admin-home-summary p {
          max-width: 540px;
          color: #CBD5E1;
          margin: 0;
          line-height: 1.75;
        }
        .admin-home-money {
          display: grid;
          align-content: center;
          gap: 8px;
          border-left: 1px solid rgba(255,255,255,.14);
          padding-left: 28px;
        }
        .admin-home-money strong {
          font-size: clamp(30px, 5vw, 48px);
          line-height: 1;
        }
        .admin-home-money small {
          color: #A8B0C0;
          line-height: 1.6;
        }
        .admin-home-systems,
        .admin-home-tasks {
          display: grid;
          gap: 14px;
        }
        .admin-home-systems h2,
        .admin-home-tasks h2 {
          margin: 0;
          font-size: 24px;
        }
        .admin-system-card {
          width: 100%;
          display: grid;
          grid-template-columns: 72px minmax(0, 1fr) minmax(130px, auto);
          gap: 18px;
          align-items: center;
          text-align: left;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(20,26,36,.86);
          color: #fff;
          padding: 20px;
          font-family: inherit;
          cursor: pointer;
          box-shadow: 0 16px 48px rgba(0,0,0,.18);
        }
        .admin-system-card:hover {
          border-color: color-mix(in srgb, var(--system-color), transparent 45%);
          transform: translateY(-1px);
        }
        .admin-system-icon {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-size: 18px;
          font-weight: 900;
          color: var(--system-color);
          background: color-mix(in srgb, var(--system-color), transparent 86%);
        }
        .admin-system-body {
          display: grid;
          gap: 8px;
          min-width: 0;
        }
        .admin-system-body strong {
          font-size: 24px;
          line-height: 1.2;
        }
        .admin-system-body span {
          color: #A8B0C0;
          line-height: 1.5;
        }
        .admin-system-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 8px;
        }
        .admin-system-stats div {
          border-left: 1px solid rgba(255,255,255,.12);
          padding-left: 14px;
        }
        .admin-system-stats small {
          display: block;
          color: #94A3B8;
          font-size: 12px;
        }
        .admin-system-stats b {
          display: block;
          margin-top: 2px;
          font-size: 20px;
        }
        .admin-system-card em {
          justify-self: end;
          min-width: 128px;
          text-align: center;
          border-radius: 14px;
          padding: 13px 18px;
          color: #fff;
          font-style: normal;
          font-weight: 900;
          background: var(--system-color);
        }
        .admin-home-tasks > div {
          display: grid;
          gap: 10px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(20,26,36,.82);
          padding: 12px;
        }
        .admin-home-tasks button {
          display: grid;
          grid-template-columns: 12px minmax(0, 1fr) auto;
          gap: 14px;
          align-items: center;
          min-height: 56px;
          border: none;
          background: transparent;
          color: #fff;
          font-family: inherit;
          cursor: pointer;
          border-radius: 12px;
          padding: 0 12px;
          text-align: left;
        }
        .admin-home-tasks button:hover {
          background: rgba(255,255,255,.04);
        }
        .admin-home-tasks button span {
          width: 10px;
          height: 10px;
          border-radius: 999px;
        }
        .admin-home-tasks button b {
          color: #fff;
          font-size: 20px;
        }

        @keyframes slideUp { from { transform: translateY(100%); opacity:0; } to { transform: translateY(0); opacity:1; } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity:0; } to { transform: scale(1); opacity:1; } }

        /* â”€â”€ Responsive â”€â”€ */
        .hide-mobile { display: flex; }
        .show-mobile { display: none !important; }
        .erp-mobile-card-list { display: none; }
        .erp-latest-cards { display: none; }
        .kpi-grid,
        .dash-grid,
        .insights-row,
        .chart-panel {
          min-width: 0;
        }
        .kpi-grid > div,
        .dash-grid > div,
        .insights-row > div,
        .chart-panel > div {
          min-width: 0;
        }
        .kpi-grid > div div {
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .cms-service-card {
          color: #f8fafc;
        }
        .cms-service-card > div:nth-child(2) {
          color: #f8fafc !important;
          font-size: 16px !important;
          font-weight: 800 !important;
          line-height: 1.35 !important;
        }
        .cms-service-card > div:nth-child(3) {
          color: #a8b0c0 !important;
          font-size: 13px !important;
          line-height: 1.65 !important;
        }
        .cms-service-card > div:nth-child(4) {
          color: #ff8a2a !important;
          font-weight: 800 !important;
        }

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
            background: rgba(13, 19, 29, .94) !important;
            backdrop-filter: blur(18px) !important;
            -webkit-backdrop-filter: blur(18px) !important;
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
            left: 10px !important;
            right: 10px !important;
            bottom: calc(72px + env(safe-area-inset-bottom, 0px)) !important;
            max-height: min(68dvh, 560px) !important;
            padding: 14px 0 12px !important;
            border: 1px solid rgba(255,107,0,.32) !important;
            border-bottom: 1px solid rgba(255,107,0,.18) !important;
            border-radius: 22px !important;
            overflow-x: hidden !important;
            scrollbar-width: none;
            background:
              linear-gradient(180deg, rgba(255,107,0,.08), rgba(20,26,36,.98) 120px),
              rgba(20,26,36,.98) !important;
          }
          .mobile-drawer::-webkit-scrollbar {
            display: none;
          }
          .mobile-module-switch {
            display: grid !important;
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
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
            margin: 0 12px 8px !important;
            width: calc(100% - 24px) !important;
            border-radius: 14px !important;
            border-left-width: 0 !important;
            background: rgba(255,255,255,.035) !important;
            border: 1px solid rgba(255,255,255,.075) !important;
          }
          .mobile-drawer > button[style*="rgba(255,107,0,0.1)"] {
            background: linear-gradient(135deg, rgba(255,107,0,.2), rgba(255,255,255,.045)) !important;
            border-color: rgba(255,107,0,.42) !important;
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
            width: 100% !important;
            max-width: 100vw !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
            padding: 14px 12px calc(92px + env(safe-area-inset-bottom, 16px)) !important;
            overflow-x: hidden !important;
            scroll-padding-bottom: calc(92px + env(safe-area-inset-bottom, 16px)) !important;
          }
          .admin-home-content {
            background: #f4f6f9 !important;
            color: #121417 !important;
          }
          .admin-home {
            gap: 18px !important;
            color: #121417 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .admin-home-hero {
            padding: 8px 0 2px !important;
            align-items: flex-start !important;
          }
          .admin-home-brand strong {
            color: #121417 !important;
            font-size: 24px !important;
          }
          .admin-home-brand span,
          .admin-home-date {
            color: #68707c !important;
          }
          .admin-home-date {
            display: none !important;
          }
          .admin-home-summary {
            grid-template-columns: 1fr !important;
            border-radius: 24px !important;
            padding: 20px !important;
            min-height: 190px !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
            box-shadow: 0 18px 46px rgba(15,23,42,.14) !important;
          }
          .admin-home-summary:after {
            width: 52% !important;
          }
          .admin-home-summary h1 {
            color: #fff !important;
            font-size: clamp(30px, 9vw, 36px) !important;
            line-height: 1.1 !important;
            overflow-wrap: anywhere !important;
          }
          .admin-home-summary p,
          .admin-home-summary span,
          .admin-home-money small {
            color: rgba(255,255,255,.72) !important;
            font-size: 13px !important;
            line-height: 1.6 !important;
            overflow-wrap: anywhere !important;
          }
          .admin-home-summary p {
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            max-width: 100% !important;
          }
          .admin-home-money {
            border-left: 0 !important;
            border-top: 1px solid rgba(255,255,255,.12) !important;
            padding-left: 0 !important;
            padding-top: 18px !important;
          }
          .admin-home-money strong {
            color: #fff !important;
            font-size: 34px !important;
          }
          .admin-home-systems h2,
          .admin-home-tasks h2 {
            color: #121417 !important;
            font-size: 26px !important;
          }
          .admin-system-card {
            grid-template-columns: 60px minmax(0, 1fr) !important;
            padding: 16px !important;
            border-radius: 18px !important;
            background: #fff !important;
            color: #121417 !important;
            border-color: rgba(15,23,42,.08) !important;
            box-shadow: 0 12px 30px rgba(15,23,42,.08) !important;
          }
          .admin-system-card,
          .admin-system-body,
          .admin-system-stats,
          .admin-system-stats div {
            min-width: 0 !important;
          }
          .admin-system-icon {
            width: 52px !important;
            height: 52px !important;
            border-radius: 14px !important;
          }
          .admin-system-body strong {
            color: #121417 !important;
            font-size: 21px !important;
            overflow-wrap: anywhere !important;
          }
          .admin-system-body span,
          .admin-system-stats small {
            color: #6b7280 !important;
            overflow-wrap: anywhere !important;
          }
          .admin-system-stats {
            gap: 10px !important;
          }
          .admin-system-stats div {
            border-left-color: rgba(15,23,42,.12) !important;
          }
          .admin-system-stats b {
            color: #121417 !important;
            font-size: 18px !important;
            overflow-wrap: anywhere !important;
          }
          .admin-system-card em {
            grid-column: 1 / -1 !important;
            width: 100% !important;
            justify-self: stretch !important;
          }
          .admin-home-tasks > div {
            background: #fff !important;
            border-color: rgba(15,23,42,.08) !important;
            box-shadow: 0 12px 30px rgba(15,23,42,.06) !important;
          }
          .admin-home-tasks button {
            color: #121417 !important;
            border-bottom: 1px solid rgba(15,23,42,.08) !important;
          }
          .admin-home-tasks button:last-child {
            border-bottom: 0 !important;
          }
          .admin-home-tasks button b,
          .admin-home-tasks button strong {
            color: #121417 !important;
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
            background: linear-gradient(180deg, rgba(20,26,36,0.98), rgba(12,18,28,0.98)) !important;
            border: 1px solid rgba(255,255,255,0.09) !important;
            border-radius: 18px !important;
            padding: 16px !important;
            box-shadow: 0 14px 38px rgba(0,0,0,0.24) !important;
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
            border-radius: 13px !important;
            font-weight: 900 !important;
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

          /* Document table â†’ card list on mobile */
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

          /* Touch targets â€” only for non-nav buttons */
          button:not(.nav-btn) { min-height: 44px; }

          /* Modal bottom sheet on mobile */
          .modal-panel {
            position: fixed !important;
            bottom: 0 !important; left: 8px !important; right: 8px !important;
            top: auto !important;
            border-radius: 20px 20px 0 0 !important;
            max-width: none !important;
            width: auto !important;
            max-height: 92dvh !important;
            padding-right: 0 !important;
            padding-left: 0 !important;
            overflow-x: hidden !important;
            box-sizing: border-box !important;
            animation: slideUp 0.3s cubic-bezier(0.32,0.72,0,1) !important;
            border: 1px solid rgba(255,107,0,.18) !important;
            box-shadow: 0 -28px 80px rgba(0,0,0,.55) !important;
          }
          .modal-panel * {
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
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
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .modal-panel [style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
          .modal-panel input,
          .modal-panel select,
          .modal-panel textarea {
            font-size: 16px !important;
            min-height: 44px !important;
          }
          .cms-service-card {
            padding: 14px !important;
            border-color: rgba(255,107,0,.16) !important;
            border-radius: 16px !important;
          }
          .cms-service-card > div:first-child button {
            width: 44px !important;
            height: 44px !important;
          }
          .modal-backdrop {
            align-items: flex-end !important;
            padding: 0 !important;
          }
          .main-content-area,
          .modal-panel,
          .modal-panel > div:nth-child(2) {
            scrollbar-width: none;
          }
          .main-content-area::-webkit-scrollbar,
          .modal-panel::-webkit-scrollbar,
          .modal-panel > div:nth-child(2)::-webkit-scrollbar {
            display: none;
          }

          /* Content padding accounts for nav + safe area */
          /* KPI cards 2-col grid */
          .kpi-grid { grid-template-columns: 1fr 1fr !important; }
          .kpi-grid > div { padding: 14px 12px !important; border-radius: 16px !important; }
          .kpi-grid > div:first-child {
            grid-column: 1 / -1 !important;
          }
          .kpi-grid > div > div:nth-child(2) {
            font-size: 9px !important;
            letter-spacing: .08em !important;
            line-height: 1.35 !important;
          }
          .kpi-grid > div > div:nth-child(3) {
            font-size: 22px !important;
            line-height: 1.08 !important;
          }

          /* Chart panel full width */
          .chart-panel { grid-template-columns: 1fr !important; }

          /* Top bar â€” use minHeight not height (safe area makes it taller) */
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
            border-radius: 18px !important;
            padding: 16px !important;
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
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
          }
          .doc-mobile-actions > button,
          .doc-mobile-actions > div > button {
            width: 100% !important;
            min-height: 42px !important;
            justify-content: center !important;
          }
          .doc-mobile-actions > div {
            grid-column: 1 / -1 !important;
          }
          .doc-mobile-actions > div > button {
            border-style: dashed !important;
          }
          [data-dropdown-menu] {
            max-width: calc(100vw - 24px) !important;
          }
          .admin-bottom-nav {
            min-height: calc(74px + env(safe-area-inset-bottom, 0px)) !important;
            padding: 6px 6px env(safe-area-inset-bottom, 0px) !important;
            background: rgba(11,15,25,.97) !important;
            border-top: 1px solid rgba(255,255,255,.1) !important;
            box-shadow: 0 -18px 44px rgba(0,0,0,.48) !important;
          }
          .admin-bottom-nav .nav-btn {
            border-radius: 16px !important;
            padding: 7px 2px 8px !important;
            gap: 2px !important;
          }
          .admin-bottom-nav .nav-btn[style*="rgba(255,107,0,0.12)"] {
            background: linear-gradient(180deg, rgba(255,107,0,.22), rgba(255,107,0,.09)) !important;
            color: #ff8a2a !important;
            box-shadow: inset 0 0 0 1px rgba(255,107,0,.22) !important;
          }
          .admin-bottom-nav .nav-btn span:first-child {
            font-size: 20px !important;
          }
          .admin-bottom-nav .nav-btn span:last-child {
            font-size: 10.5px !important;
            line-height: 1.15 !important;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .erp-latest-panel {
            overflow: visible !important;
          }
          .erp-latest-table {
            display: none !important;
          }
          .erp-latest-cards {
            display: grid !important;
            gap: 12px !important;
            padding: 12px !important;
          }
          .erp-latest-card {
            width: 100% !important;
            display: grid !important;
            gap: 12px !important;
            text-align: left !important;
            padding: 14px !important;
            border: 1px solid rgba(255,255,255,.08) !important;
            border-radius: 16px !important;
            background: linear-gradient(180deg, rgba(20,26,36,.98), rgba(12,18,28,.98)) !important;
            color: #fff !important;
            font-family: inherit !important;
          }
          .erp-latest-card-top {
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .erp-latest-card-top > div {
            display: grid !important;
            gap: 4px !important;
            min-width: 0 !important;
          }
          .erp-latest-card-top strong {
            font-family: monospace !important;
            font-size: 15px !important;
            overflow-wrap: anywhere !important;
          }
          .erp-latest-card-top b {
            font-size: 18px !important;
            text-align: right !important;
          }
          .erp-latest-card-top span {
            color: #94a3b8 !important;
            font-size: 12px !important;
            line-height: 1.45 !important;
          }
          .erp-latest-card-meta {
            display: flex !important;
            gap: 8px !important;
            flex-wrap: wrap !important;
          }
          .erp-latest-card-meta span {
            border-radius: 999px !important;
            padding: 5px 10px !important;
            font-size: 11px !important;
            font-weight: 800 !important;
          }
          .erp-latest-balance {
            border-radius: 12px !important;
            padding: 10px 12px !important;
            background: rgba(245,158,11,.1) !important;
            color: #fbbf24 !important;
            font-size: 12px !important;
            font-weight: 800 !important;
          }
          .cms-page-head {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .cms-page-tools {
            display: grid !important;
            grid-template-columns: 1fr !important;
            width: 100% !important;
            gap: 10px !important;
          }
          .cms-page-tools input,
          .cms-page-tools button {
            width: 100% !important;
          }
          .cms-blog-row {
            display: grid !important;
            grid-template-columns: 92px minmax(0,1fr) !important;
            align-items: start !important;
            gap: 12px !important;
            padding: 12px !important;
            border-radius: 16px !important;
          }
          .cms-blog-cover {
            width: 92px !important;
            height: 92px !important;
            border-radius: 14px !important;
          }
          .cms-blog-copy > div:first-child {
            display: grid !important;
            gap: 6px !important;
            align-items: start !important;
          }
          .cms-blog-copy span:first-child {
            line-height: 1.35 !important;
            overflow-wrap: anywhere !important;
          }
          .cms-blog-copy > div:last-child {
            white-space: normal !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
          }
          .cms-blog-actions {
            grid-column: 1 / -1 !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .cms-blog-actions button {
            width: 100% !important;
            min-height: 42px !important;
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
          .top-bar {
            min-height: calc(58px + env(safe-area-inset-top, 0px)) !important;
            padding-top: env(safe-area-inset-top, 0px) !important;
          }
          .admin-mobile-top {
            gap: 8px !important;
          }
          .admin-module-trigger {
            min-width: 96px !important;
            justify-content: center !important;
          }
          .admin-module-trigger b {
            max-width: 64px !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
          }
          .admin-home-systems > div,
          .admin-home-tasks > div {
            gap: 12px !important;
          }
          .admin-home-systems button,
          .admin-home-tasks button {
            border-radius: 18px !important;
            box-shadow: 0 12px 30px rgba(15,23,42,.08) !important;
          }
          .erp-page-header > div:first-child,
          .erp-dashboard-header > div:first-child {
            min-width: 0 !important;
          }
          .erp-page-header h2,
          .erp-dashboard-header h2 {
            font-size: 20px !important;
            line-height: 1.2 !important;
            overflow-wrap: anywhere !important;
          }
          .erp-page-header p,
          .erp-dashboard-header p {
            font-size: 12px !important;
            line-height: 1.55 !important;
          }
          .erp-page-actions input,
          .erp-page-actions select {
            min-height: 48px !important;
            border-radius: 14px !important;
            background: rgba(255,255,255,.055) !important;
          }
          .erp-page-actions button {
            min-height: 48px !important;
            border-radius: 14px !important;
          }
          .erp-mobile-card {
            position: relative !important;
            overflow: hidden !important;
          }
          .erp-mobile-card:before {
            content: "" !important;
            position: absolute !important;
            inset: 0 auto 0 0 !important;
            width: 3px !important;
            background: linear-gradient(180deg,#ff6b00,rgba(255,107,0,0)) !important;
            opacity: .75 !important;
          }
          .erp-mobile-card-head {
            padding-left: 4px !important;
          }
          .erp-mobile-actions,
          .doc-mobile-actions {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          .doc-mobile-actions > div {
            grid-column: auto !important;
          }
          .erp-mobile-actions button,
          .doc-mobile-actions > button,
          .doc-mobile-actions > div > button {
            min-height: 48px !important;
            border-radius: 14px !important;
            font-size: 12px !important;
            padding-inline: 8px !important;
          }
          [data-dropdown-menu] {
            left: 12px !important;
            right: 12px !important;
            width: auto !important;
            min-width: 0 !important;
            border-radius: 18px !important;
            padding: 8px !important;
            box-shadow: 0 -18px 50px rgba(0,0,0,.52) !important;
          }
          [data-dropdown-menu] button {
            min-height: 46px !important;
            border-radius: 12px !important;
          }
          .cms-blog-row {
            grid-template-columns: 108px minmax(0,1fr) !important;
            background: linear-gradient(180deg, rgba(20,26,36,.98), rgba(12,18,28,.98)) !important;
          }
          .cms-blog-cover {
            width: 108px !important;
            height: 82px !important;
            aspect-ratio: 4 / 3 !important;
          }
          .cms-blog-actions {
            grid-template-columns: repeat(2, minmax(0,1fr)) !important;
          }
          .modal-panel {
            max-height: min(90dvh, 760px) !important;
          }
          .modal-panel > div:first-child {
            position: sticky !important;
            top: 0 !important;
            z-index: 2 !important;
            background: rgba(20,26,36,.98) !important;
            backdrop-filter: blur(18px) !important;
            -webkit-backdrop-filter: blur(18px) !important;
          }
          .modal-panel button {
            min-height: 46px !important;
          }
          .admin-bottom-nav {
            min-height: calc(82px + env(safe-area-inset-bottom, 0px)) !important;
          }
          .admin-bottom-nav .nav-btn {
            min-width: 0 !important;
          }
          .admin-bottom-nav .nav-btn span:first-child {
            width: 28px !important;
            height: 24px !important;
            display: grid !important;
            place-items: center !important;
            margin-bottom: 2px !important;
          }
          .mobile-drawer {
            left: 12px !important;
            right: 12px !important;
            bottom: calc(88px + env(safe-area-inset-bottom, 0px)) !important;
          }
          .mobile-drawer > button {
            min-height: 52px !important;
          }

          /* Final admin mobile polish: compact command center rhythm */
          .admin-home-content,
          .main-content-area {
            width: 100% !important;
            overflow-x: hidden !important;
          }
          .admin-home-summary {
            width: 100% !important;
            margin-inline: auto !important;
            border-radius: 22px !important;
          }
          .admin-home-summary h1,
          .admin-home-systems h2,
          .admin-home-tasks h2 {
            letter-spacing: 0 !important;
          }
          .admin-home-systems button {
            min-height: 168px !important;
            align-items: stretch !important;
          }
          .admin-system-card {
            position: relative !important;
            overflow: hidden !important;
          }
          .admin-system-card:before {
            content: "" !important;
            position: absolute !important;
            inset: 0 auto 0 0 !important;
            width: 4px !important;
            background: var(--system-color, #ff6b00) !important;
            opacity: .72 !important;
          }
          .admin-system-icon {
            align-self: start !important;
          }
          .admin-system-body {
            min-width: 0 !important;
          }
          .admin-system-stats {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            width: 100% !important;
          }
          .admin-system-stats div {
            min-width: 0 !important;
            padding-left: 10px !important;
          }
          .admin-system-card em {
            min-height: 46px !important;
            border-radius: 14px !important;
          }
          .admin-home-tasks button {
            grid-template-columns: auto minmax(0, 1fr) auto !important;
            min-height: 58px !important;
          }
          .admin-home-tasks button strong {
            line-height: 1.35 !important;
            overflow-wrap: anywhere !important;
          }
          .erp-dashboard-header,
          .erp-page-header,
          .cms-page-head {
            position: sticky !important;
            top: calc(58px + env(safe-area-inset-top, 0px)) !important;
            z-index: 5 !important;
            padding: 12px !important;
            margin: -6px -6px 14px !important;
            background: rgba(11,15,25,.94) !important;
            border: 1px solid rgba(255,255,255,.07) !important;
            border-radius: 0 0 18px 18px !important;
            backdrop-filter: blur(16px) !important;
            -webkit-backdrop-filter: blur(16px) !important;
          }
          .erp-page-actions,
          .cms-page-tools {
            background: rgba(255,255,255,.03) !important;
            border: 1px solid rgba(255,255,255,.06) !important;
            border-radius: 16px !important;
            padding: 10px !important;
          }
          .erp-data-card,
          .erp-mobile-card,
          .doc-mobile-card,
          .erp-latest-card,
          .cms-blog-row,
          .card-pad,
          .main-content-area section > div[style*="border: 1px solid rgba(255,255,255,0.07)"] {
            box-shadow: 0 14px 38px rgba(0,0,0,.22) !important;
          }
          .erp-data-card {
            display: grid !important;
            gap: 10px !important;
          }
          .erp-card-actions {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
          }
          .erp-card-actions button {
            width: 100% !important;
            min-height: 46px !important;
            border-radius: 14px !important;
          }
          .erp-mobile-card-title,
          .doc-mobile-card-head strong,
          .erp-latest-card-top strong {
            letter-spacing: 0 !important;
          }
          .erp-mobile-actions button,
          .doc-mobile-actions button {
            white-space: normal !important;
            line-height: 1.25 !important;
          }
          .doc-mobile-card {
            display: grid !important;
            gap: 14px !important;
          }
          .doc-mobile-card-head {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) auto !important;
          }
          .doc-mobile-footer {
            border-top: 1px solid rgba(255,255,255,.08) !important;
            padding-top: 12px !important;
          }
          .modal-panel {
            background: #121923 !important;
          }
          .modal-panel label {
            color: #b6c2d4 !important;
            font-size: 12px !important;
            line-height: 1.45 !important;
          }
          .modal-panel input,
          .modal-panel select,
          .modal-panel textarea {
            border-radius: 14px !important;
            border-color: rgba(148,163,184,.28) !important;
            background: #0b1220 !important;
          }
          .modal-panel input:focus,
          .modal-panel select:focus,
          .modal-panel textarea:focus {
            outline: 2px solid rgba(255,107,0,.36) !important;
            outline-offset: 1px !important;
            border-color: rgba(255,107,0,.7) !important;
          }
          .cms-blog-list {
            gap: 10px !important;
          }
          .cms-blog-row {
            border-radius: 18px !important;
          }
          .cms-blog-copy {
            min-width: 0 !important;
          }
          .cms-blog-copy span,
          .cms-blog-copy div {
            overflow-wrap: anywhere !important;
          }
          .cms-blog-actions button {
            border-radius: 14px !important;
            font-weight: 900 !important;
          }
          .service-portfolio-editor-card {
            border-radius: 18px !important;
            background: rgba(255,255,255,.035) !important;
          }
          .service-portfolio-editor-card img {
            border-radius: 14px !important;
          }
          .admin-bottom-nav {
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
          }

          /* Mobile ERP app refresh: match the white, card-based operational reference. */
          .top-bar {
            min-height: 58px !important;
            background: rgba(255,255,255,.98) !important;
            color: #111827 !important;
            border-bottom: 1px solid #e5e7eb !important;
            box-shadow: 0 8px 26px rgba(15,23,42,.06) !important;
          }
          .top-bar strong,
          .top-bar b,
          .admin-mobile-title {
            color: #111827 !important;
          }
          .top-bar span {
            color: inherit !important;
          }
          .admin-module-trigger {
            border: 1px solid #fed7aa !important;
            background: #fff7ed !important;
            color: #111827 !important;
            box-shadow: 0 8px 20px rgba(234,88,12,.12) !important;
          }
          .admin-module-trigger b {
            color: #111827 !important;
          }
          .admin-module-trigger span {
            color: #f97316 !important;
          }
          .admin-logout-btn {
            background: #fff1f2 !important;
            border-color: #fecdd3 !important;
            color: #e11d48 !important;
          }
          .main-content-area {
            background: #f4f6f9 !important;
            color: #111827 !important;
          }
          .main-content-area .erp-dashboard-header,
          .main-content-area .erp-page-header,
          .main-content-area .doc-header-row {
            position: relative !important;
            top: auto !important;
            margin: -2px -2px 14px !important;
            padding: 16px !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 22px !important;
            background: #fff !important;
            color: #111827 !important;
            box-shadow: 0 14px 34px rgba(15,23,42,.07) !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
          .main-content-area .erp-dashboard-header h2,
          .main-content-area .erp-page-header h2,
          .main-content-area .doc-header-row h2 {
            color: #111827 !important;
            font-size: 24px !important;
            line-height: 1.15 !important;
            letter-spacing: 0 !important;
          }
          .main-content-area .erp-dashboard-header p,
          .main-content-area .erp-page-header p,
          .main-content-area .doc-header-row p {
            color: #6b7280 !important;
            line-height: 1.55 !important;
          }
          .erp-date-controls,
          .erp-page-actions,
          .doc-header-actions {
            background: #f8fafc !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 18px !important;
          }
          .main-content-area input,
          .main-content-area select,
          .main-content-area textarea {
            background: #fff !important;
            border: 1px solid #d7dde8 !important;
            color: #111827 !important;
            border-radius: 14px !important;
            min-height: 46px !important;
            box-shadow: inset 0 1px 0 rgba(15,23,42,.02) !important;
          }
          .main-content-area input::placeholder,
          .main-content-area textarea::placeholder {
            color: #9ca3af !important;
          }
          .main-content-area input:focus,
          .main-content-area select:focus,
          .main-content-area textarea:focus {
            outline: 2px solid rgba(249,115,22,.25) !important;
            outline-offset: 1px !important;
            border-color: #fb923c !important;
          }
          .kpi-grid > div,
          .dash-grid > div,
          .insights-row > div,
          .chart-panel > div,
          .erp-data-card,
          .erp-mobile-card,
          .doc-mobile-card,
          .erp-latest-card,
          .doc-list-panel,
          .erp-latest-panel,
          .main-content-area section > div[style*="border: 1px solid rgba(255,255,255,0.07)"] {
            background: #fff !important;
            border: 1px solid #e5e7eb !important;
            color: #111827 !important;
            box-shadow: 0 14px 34px rgba(15,23,42,.07) !important;
          }
          .kpi-grid > div {
            min-height: 126px !important;
            border-radius: 20px !important;
          }
          .kpi-grid > div:first-child {
            grid-column: span 1 !important;
          }
          .kpi-grid > div > div,
          .dash-grid > div > div,
          .insights-row > div > div,
          .chart-panel > div > div,
          .erp-data-card div,
          .erp-mobile-card div,
          .doc-mobile-card div,
          .erp-latest-card div {
            color: inherit;
          }
          .main-content-area h1,
          .main-content-area h2,
          .main-content-area h3,
          .main-content-area strong,
          .main-content-area b,
          .erp-mobile-card-title,
          .doc-mobile-card-head strong,
          .erp-latest-card-top strong {
            color: #111827 !important;
          }
          .main-content-area p,
          .main-content-area small,
          .erp-mobile-card-meta,
          .erp-mobile-stat span,
          .doc-mobile-footer,
          .erp-latest-card-meta,
          .erp-latest-card-top span {
            color: #6b7280 !important;
          }
          .erp-mobile-card,
          .doc-mobile-card,
          .erp-latest-card {
            border-radius: 22px !important;
            padding: 16px !important;
          }
          .erp-mobile-card:before {
            background: linear-gradient(180deg, #fb923c, #f97316) !important;
          }
          .erp-mobile-stats {
            gap: 8px !important;
          }
          .erp-mobile-stat {
            background: #f8fafc !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 16px !important;
          }
          .erp-mobile-stat strong {
            color: #111827 !important;
          }
          .erp-mobile-actions,
          .doc-mobile-actions {
            gap: 10px !important;
          }
          .erp-mobile-actions button,
          .doc-mobile-actions > button,
          .doc-mobile-actions > div > button,
          .erp-card-actions button {
            min-height: 48px !important;
            border-radius: 16px !important;
            font-weight: 900 !important;
            box-shadow: none !important;
          }
          .erp-mobile-actions button[style*="#FF6B00"],
          .doc-mobile-actions button[style*="#FF6B00"],
          .erp-card-actions button[style*="#FF6B00"] {
            background: #c2410c !important;
            border-color: #c2410c !important;
            color: #fff !important;
            box-shadow: 0 10px 22px rgba(194,65,12,.18) !important;
          }
          .doc-mobile-footer {
            border-top: 1px solid #e5e7eb !important;
          }
          .doc-mobile-status button {
            background: #ecfdf5 !important;
            border-color: #a7f3d0 !important;
            color: #059669 !important;
          }
          [data-dropdown-menu] {
            background: #fff !important;
            border: 1px solid #e5e7eb !important;
            color: #111827 !important;
            box-shadow: 0 18px 48px rgba(15,23,42,.16) !important;
          }
          [data-dropdown-menu] button {
            color: #111827 !important;
            background: transparent !important;
          }
          [data-dropdown-menu] button:hover {
            background: #fff7ed !important;
          }
          .mobile-drawer {
            left: 12px !important;
            right: 12px !important;
            bottom: calc(78px + env(safe-area-inset-bottom, 0px)) !important;
            background: #fff !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 24px !important;
            color: #111827 !important;
            box-shadow: 0 -18px 48px rgba(15,23,42,.18) !important;
          }
          .mobile-drawer > div[style*="letter-spacing"] {
            color: #f97316 !important;
          }
          .mobile-drawer > button {
            min-height: 56px !important;
            background: #f8fafc !important;
            border: 1px solid #e5e7eb !important;
            color: #111827 !important;
          }
          .mobile-drawer > button[style*="rgba(255,107,0,0.1)"] {
            background: #fff7ed !important;
            border-color: #fdba74 !important;
            color: #c2410c !important;
          }
          .mobile-module-switch button {
            background: #f8fafc !important;
            border-color: #e5e7eb !important;
            color: #475569 !important;
          }
          .mobile-module-switch button.active {
            background: #c2410c !important;
            border-color: #c2410c !important;
            color: #fff !important;
          }
          .modal-panel {
            background: #fff !important;
            color: #111827 !important;
            border-color: #e5e7eb !important;
            border-radius: 24px 24px 0 0 !important;
            box-shadow: 0 -20px 52px rgba(15,23,42,.18) !important;
          }
          .modal-panel > div:first-child {
            background: #fff !important;
            border-bottom: 1px solid #e5e7eb !important;
          }
          .modal-panel h2,
          .modal-panel h3,
          .modal-panel strong,
          .modal-panel b {
            color: #111827 !important;
          }
          .modal-panel label {
            color: #475569 !important;
            font-weight: 800 !important;
          }
          .modal-panel input,
          .modal-panel select,
          .modal-panel textarea {
            background: #f8fafc !important;
            color: #111827 !important;
            border: 1px solid #d7dde8 !important;
            min-height: 48px !important;
          }
          .modal-panel button[style*="#FF6B00"],
          .modal-panel button[style*="255,107,0"] {
            background: #ff5a00 !important;
            color: #fff !important;
            border-color: #ff5a00 !important;
          }
          .admin-bottom-nav {
            background: rgba(255,255,255,.98) !important;
            border-top: 1px solid #e5e7eb !important;
            box-shadow: 0 -10px 30px rgba(15,23,42,.09) !important;
          }
          .admin-bottom-nav .nav-btn {
            color: #64748b !important;
            background: transparent !important;
          }
          .admin-bottom-nav .nav-btn[style*="rgba(255,107,0,0.12)"] {
            background: #fff7ed !important;
            color: #f97316 !important;
          }
          .admin-bottom-nav .nav-btn span:last-child {
            color: inherit !important;
            font-weight: 900 !important;
          }
          .admin-bottom-nav .nav-btn span:first-child {
            color: inherit !important;
          }
          .erp-load-error-card {
            width: 100% !important;
            max-width: calc(100vw - 24px) !important;
            margin: 28px auto !important;
            box-sizing: border-box !important;
            background: #fff !important;
            border: 1px solid #fecaca !important;
            color: #111827 !important;
            box-shadow: 0 18px 42px rgba(15,23,42,.08) !important;
          }
          .erp-load-error-card h2,
          .erp-load-error-card strong,
          .erp-load-error-card b {
            color: #111827 !important;
          }
          .erp-load-error-card p {
            color: #64748b !important;
          }
          .erp-load-error-card > div:nth-of-type(2) {
            background: #fff1f2 !important;
            border-color: #fecdd3 !important;
            color: #be123c !important;
          }
          .erp-load-error-card button:last-child {
            background: #f8fafc !important;
            color: #111827 !important;
            border-color: #d7dde8 !important;
          }
          .admin-home-summary,
          .admin-home-summary * {
            color: rgba(255,255,255,.76) !important;
          }
          .admin-home-summary h1,
          .admin-home-summary strong,
          .admin-home-money strong {
            color: #fff !important;
          }
          .admin-home-summary h1 {
            text-shadow: 0 2px 12px rgba(0,0,0,.2) !important;
          }
          .admin-home-summary p,
          .admin-home-summary small,
          .admin-home-summary span {
            color: rgba(255,255,255,.72) !important;
          }
        }

        /* â”€â”€ iPhone 15 Pro specific (393px wide) â”€â”€ */
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
          .erp-mobile-actions,
          .doc-mobile-actions {
            grid-template-columns: 1fr 1fr !important;
          }
          .doc-mobile-actions > div {
            grid-column: 1 / -1 !important;
          }
          .cms-blog-row {
            grid-template-columns: 1fr !important;
          }
          .cms-blog-cover {
            width: 100% !important;
            height: auto !important;
            aspect-ratio: 16 / 9 !important;
          }
          .cms-blog-actions {
            grid-template-columns: 1fr 1fr !important;
          }
          .mobile-module-switch {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
}

// â”€â”€â”€ MARKETING COMPONENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AdminHome({
  customers = [],
  documents = [],
  products = [],
  totalRevenue = 0,
  totalCost = 0,
  totalProfit = 0,
  docCounts = {},
  setMainTab,
  setErpPage,
  setTab,
  setMarketingMobileSection,
}: any) {
  const activeDocs = (documents || []).filter((doc: any) => !doc?.deleted && doc?.status !== "cancelled");
  const pendingQuotes = activeDocs.filter((doc: any) => doc.type === "quote" && ["draft", "sent"].includes(doc.status)).length;
  const outstandingDocs = activeDocs.filter((doc: any) => ["bill", "invoice"].includes(doc.type) && calcDocTotal(doc, documents).balanceDue > 0);
  const pendingPayments = outstandingDocs.length;
  const pendingBalance = outstandingDocs.reduce((sum: number, doc: any) => sum + Math.max(0, Number(calcDocTotal(doc, documents).balanceDue || 0)), 0);
  const receiptCount = Number(docCounts?.receipt || 0);
  const today = new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const goErp = (page = "dashboard") => {
    setMainTab("erp");
    setErpPage(page);
  };
  const goCms = (cmsTab = "blog") => {
    setMainTab("cms");
    setTab(cmsTab);
  };
  const goMarketing = () => {
    setMainTab("marketing");
    setMarketingMobileSection("overview");
  };

  const systemCards = [
    {
      key: "erp",
      label: "à¸£à¸°à¸šà¸š ERP",
      sub: "à¸‡à¸²à¸™à¸‚à¸²à¸¢ à¸¥à¸¹à¸à¸„à¹‰à¸² à¹€à¸­à¸à¸ªà¸²à¸£ à¹à¸¥à¸°à¸à¸²à¸£à¹€à¸‡à¸´à¸™",
      color: "#FF6B00",
      stats: [
        { label: "à¸£à¸­à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´", value: `${pendingQuotes} à¹€à¸­à¸à¸ªà¸²à¸£` },
        { label: "à¸„à¹‰à¸²à¸‡à¸Šà¸³à¸£à¸°", value: fmtMoney(pendingBalance) },
      ],
      action: "à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆ ERP",
      onClick: () => goErp("dashboard"),
    },
    {
      key: "cms",
      label: "à¸£à¸°à¸šà¸š CMS",
      sub: "à¸šà¸—à¸„à¸§à¸²à¸¡ à¸šà¸£à¸´à¸à¸²à¸£ à¸œà¸¥à¸‡à¸²à¸™ à¹à¸¥à¸°à¹€à¸§à¹‡à¸šà¹„à¸‹à¸•à¹Œ",
      color: "#2563EB",
      stats: [
        { label: "à¸šà¸—à¸„à¸§à¸²à¸¡", value: "à¸ˆà¸±à¸”à¸à¸²à¸£à¹€à¸§à¹‡à¸š" },
        { label: "à¸œà¸¥à¸‡à¸²à¸™", value: "à¹à¸à¹‰à¹„à¸‚à¹„à¸”à¹‰" },
      ],
      action: "à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆ CMS",
      onClick: () => goCms("blog"),
    },
    {
      key: "mkt",
      label: "Marketing",
      sub: "Leads à¹‚à¸†à¸©à¸“à¸² ROAS à¹à¸¥à¸° Customer Insight",
      color: "#16A34A",
      stats: [
        { label: "à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆ", value: `${receiptCount} à¸‰à¸šà¸±à¸š` },
        { label: "à¸à¸³à¹„à¸£", value: fmtMoney(totalProfit) },
      ],
      action: "à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆ MKT",
      onClick: goMarketing,
    },
  ];

  const taskRows = [
    { label: "à¹ƒà¸šà¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸²à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸•à¸´à¸”à¸•à¸²à¸¡", value: pendingQuotes, color: "#F97316", onClick: () => goErp("quote") },
    { label: "à¹ƒà¸šà¹à¸ˆà¹‰à¸‡à¸«à¸™à¸µà¹‰ / à¹ƒà¸šà¸§à¸²à¸‡à¸šà¸´à¸¥à¸„à¹‰à¸²à¸‡à¸Šà¸³à¸£à¸°", value: pendingPayments, color: "#EF4444", onClick: () => goErp("invoice") },
    { label: "à¸ªà¸´à¸™à¸„à¹‰à¸²à¹à¸¥à¸°à¸šà¸£à¸´à¸à¸²à¸£à¹ƒà¸™à¸£à¸°à¸šà¸š", value: products.length, color: "#2563EB", onClick: () => goErp("products") },
  ];

  return (
    <div className="admin-home">
      <div className="admin-home-hero">
        <div className="admin-home-brand">
          <Image src="/images/logo.png" alt="Display Works Media" width={52} height={42} />
          <div>
            <strong>Admin</strong>
            <span>Display Works Media</span>
          </div>
        </div>
        <div className="admin-home-date">{today}</div>
      </div>

      <section className="admin-home-summary">
        <div>
          <span>à¸ à¸²à¸žà¸£à¸§à¸¡à¸§à¸±à¸™à¸™à¸µà¹‰</span>
          <h1>à¸ªà¸§à¸±à¸ªà¸”à¸µ à¸„à¸¸à¸“à¸œà¸¹à¹‰à¸”à¸¹à¹à¸¥</h1>
          <p>à¹€à¸¥à¸·à¸­à¸à¸ˆà¸±à¸”à¸à¸²à¸£ ERP, CMS à¸«à¸£à¸·à¸­ Marketing à¸ˆà¸²à¸à¸à¸²à¸£à¹Œà¸”à¸”à¹‰à¸²à¸™à¸¥à¹ˆà¸²à¸‡</p>
        </div>
        <div className="admin-home-money">
          <span>à¸¢à¸­à¸”à¸ˆà¸²à¸à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆ</span>
          <strong>{fmtMoney(totalRevenue)}</strong>
          <small>à¸à¸³à¹„à¸£à¸‚à¸±à¹‰à¸™à¸•à¹‰à¸™ {fmtMoney(totalProfit)} / à¸•à¹‰à¸™à¸—à¸¸à¸™ {fmtMoney(totalCost)}</small>
        </div>
      </section>

      <section className="admin-home-systems">
        <h2>à¹€à¸¥à¸·à¸­à¸à¸£à¸°à¸šà¸šà¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¸ˆà¸±à¸”à¸à¸²à¸£</h2>
        {systemCards.map((card) => (
          <button key={card.key} type="button" className="admin-system-card" onClick={card.onClick} style={{ "--system-color": card.color } as any}>
            <div className="admin-system-icon">{card.key.toUpperCase()}</div>
            <div className="admin-system-body">
              <strong>{card.label}</strong>
              <span>{card.sub}</span>
              <div className="admin-system-stats">
                {card.stats.map((stat) => (
                  <div key={stat.label}>
                    <small>{stat.label}</small>
                    <b>{stat.value}</b>
                  </div>
                ))}
              </div>
            </div>
            <em>{card.action}</em>
          </button>
        ))}
      </section>

      <section className="admin-home-tasks">
        <h2>à¸ªà¸´à¹ˆà¸‡à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸ˆà¸±à¸”à¸à¸²à¸£</h2>
        <div>
          {taskRows.map((task) => (
            <button key={task.label} type="button" onClick={task.onClick}>
              <span style={{ background: task.color }} />
              <strong>{task.label}</strong>
              <b>{task.value}</b>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function MarketingPage({ documents, showToast }: any) {
  const defaultCampaigns = [
    { id: genId(), name: "Vinyl Banner Lead Gen", channel: "Facebook Ads", objective: "LINE Inquiry", budget: 1500, status: "planning", startDate: today(), endDate: addDays(today(), 14), landingPage: "/services/vinyl-banner", note: "à¹‚à¸›à¸£à¹‚à¸¡à¸•à¸‡à¸²à¸™à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥à¸ªà¸³à¸«à¸£à¸±à¸šà¸£à¹‰à¸²à¸™à¸­à¸²à¸«à¸²à¸£à¹à¸¥à¸°à¸«à¸™à¹‰à¸²à¸£à¹‰à¸²à¸™" },
    { id: genId(), name: "Sticker Product Label", channel: "Organic / Blog", objective: "Service Page Visit", budget: 0, status: "active", startDate: today(), endDate: addDays(today(), 30), landingPage: "/services/sticker", note: "à¸”à¸±à¸™à¸šà¸—à¸„à¸§à¸²à¸¡à¹à¸¥à¸°à¸«à¸™à¹‰à¸²à¸šà¸£à¸´à¸à¸²à¸£à¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œà¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸²" },
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
    if (!String(form.name || "").trim()) return showToast("à¸à¸£à¸¸à¸“à¸²à¹ƒà¸ªà¹ˆà¸Šà¸·à¹ˆà¸­à¹à¸„à¸¡à¹€à¸›à¸", "error");
    const row = { ...form, id: form.id || genId(), budget: Number(form.budget || 0) };
    const next = form.id ? campaigns.map((campaign: any) => campaign.id === form.id ? row : campaign) : [row, ...campaigns];
    saveCampaigns(next);
    resetForm();
    showToast("à¸šà¸±à¸™à¸—à¸¶à¸à¹à¸„à¸¡à¹€à¸›à¸ Marketing à¹à¸¥à¹‰à¸§");
  };
  const editCampaign = (campaign: any) => setForm({ ...campaign, budget: String(campaign.budget || "") });
  const removeCampaign = (id: string) => {
    saveCampaigns(campaigns.filter((campaign: any) => campaign.id !== id));
    showToast("à¸¥à¸šà¹à¸„à¸¡à¹€à¸›à¸à¹à¸¥à¹‰à¸§");
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
    { label: "GA4 / Google Analytics", status: "manual", detail: "à¹ƒà¸Šà¹‰à¹€à¸Šà¹‡à¸„ traffic, page view à¹à¸¥à¸° conversion path" },
    { label: "Facebook Pixel", status: "manual", detail: "à¹ƒà¸Šà¹‰à¹€à¸à¹‡à¸š event à¸ˆà¸²à¸ Ads à¹€à¸Šà¹ˆà¸™ PageView, Lead, Contact" },
    { label: "LINE CTA Click", status: "recommended", detail: "à¸„à¸§à¸£ track à¸›à¸¸à¹ˆà¸¡ LINE à¸—à¸¸à¸à¸ˆà¸¸à¸”à¹€à¸žà¸·à¹ˆà¸­à¸”à¸¹ lead source" },
    { label: "UTM Campaign", status: campaigns.length > 0 ? "ready" : "recommended", detail: "à¹ƒà¸Šà¹‰à¹à¸¢à¸à¸œà¸¥à¹à¸„à¸¡à¹€à¸›à¸ Facebook, Blog, LINE à¹à¸¥à¸°à¹‚à¸žà¸ªà¸•à¹Œà¸•à¹ˆà¸²à¸‡ à¹†" },
  ];
  const sourceRows = [
    { source: "LINE Official", intent: "à¸ªà¸­à¸šà¸–à¸²à¸¡à¸£à¸²à¸„à¸² / à¸ªà¹ˆà¸‡à¹„à¸Ÿà¸¥à¹Œ", action: "à¹ƒà¸Šà¹‰à¹€à¸›à¹‡à¸™ CTA à¸«à¸¥à¸±à¸" },
    { source: "Facebook Ads", intent: "à¸”à¸¶à¸‡à¸¥à¸¹à¸à¸„à¹‰à¸²à¹ƒà¸«à¸¡à¹ˆ", action: "à¹ƒà¸ªà¹ˆ UTM à¸—à¸¸à¸à¹à¸„à¸¡à¹€à¸›à¸" },
    { source: "Service Pages", intent: "à¸¥à¸¹à¸à¸„à¹‰à¸²à¸„à¹‰à¸™à¸«à¸²à¸šà¸£à¸´à¸à¸²à¸£", action: "à¹€à¸Šà¸·à¹ˆà¸­à¸¡à¸›à¸¸à¹ˆà¸¡ LINE à¹à¸¥à¸°à¸Ÿà¸­à¸£à¹Œà¸¡" },
    { source: "Blog / Organic", intent: "à¹ƒà¸«à¹‰à¸„à¸§à¸²à¸¡à¸£à¸¹à¹‰à¸à¹ˆà¸­à¸™à¸•à¸±à¸”à¸ªà¸´à¸™à¹ƒà¸ˆ", action: "à¸¥à¸´à¸‡à¸à¹Œà¹„à¸›à¸«à¸™à¹‰à¸²à¸šà¸£à¸´à¸à¸²à¸£à¸—à¸µà¹ˆà¹€à¸à¸µà¹ˆà¸¢à¸§à¸‚à¹‰à¸­à¸‡" },
  ];
  const connectedSources = [
    { name: "ERP Receipts", state: "à¸žà¸£à¹‰à¸­à¸¡à¹ƒà¸Šà¹‰", detail: "à¹ƒà¸Šà¹‰à¸¢à¸­à¸”à¸£à¸²à¸¢à¹„à¸”à¹‰à¸ˆà¸²à¸à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆà¸ˆà¸£à¸´à¸‡" },
    { name: "Campaign Planner", state: "à¸žà¸£à¹‰à¸­à¸¡à¹ƒà¸Šà¹‰", detail: "à¸šà¸±à¸™à¸—à¸¶à¸à¸‡à¸šà¹à¸¥à¸°à¸Šà¹ˆà¸§à¸‡à¹€à¸§à¸¥à¸²à¹à¸„à¸¡à¹€à¸›à¸" },
    { name: "GA4", state: ga4.loading ? "Loading" : ga4.connected ? "Connected" : "Error", detail: ga4.connected ? `${ga4.totals.sessions.toLocaleString()} sessions / 30 days` : (ga4.error || "à¸ªà¸³à¸«à¸£à¸±à¸š Visitor, Session, Conversion") },
    { name: "Facebook Pixel / Ads", state: metaAds.loading ? "Loading" : metaAds.connected ? "Connected" : "Error", detail: metaAds.connected ? `à¸¿${fmtMoney(metaAds.totals.spend)} spend / ${metaAds.totals.clicks.toLocaleString()} clicks` : (metaAds.error || "à¸ªà¸³à¸«à¸£à¸±à¸š Spend, CPL, ROAS") },
    { name: "LINE OA", state: "à¸£à¸­à¹€à¸Šà¸·à¹ˆà¸­à¸¡à¸•à¹ˆà¸­", detail: "à¸ªà¸³à¸«à¸£à¸±à¸šà¸ˆà¸³à¸™à¸§à¸™à¹à¸Šà¸—à¹à¸¥à¸° source à¸‚à¸­à¸‡ lead" },
  ];
  const channelRows = [
    { name: "Facebook Ads", leads: metaAds.connected ? metaAds.totals.leads.toLocaleString() : "à¸£à¸­ API", spend: metaAds.connected ? `à¸¿${fmtMoney(metaAds.totals.spend)}` : "à¸£à¸­ API", priority: metaAds.connected ? `CPC à¸¿${fmtMoney(metaAds.totals.cpc)} / CTR ${metaAds.totals.ctr.toFixed(2)}%` : "à¹ƒà¸Šà¹‰ UTM à¸—à¸¸à¸à¹à¸„à¸¡à¹€à¸›à¸" },
    { name: "LINE OA", leads: "à¸£à¸­à¹€à¸Šà¸·à¹ˆà¸­à¸¡à¸•à¹ˆà¸­", spend: "-", priority: "CTA à¸«à¸¥à¸±à¸à¸‚à¸­à¸‡à¹€à¸§à¹‡à¸š" },
    { name: "Organic / SEO", leads: "à¸£à¸­à¸Ÿà¸­à¸£à¹Œà¸¡ lead", spend: "0", priority: "à¸”à¸±à¸™à¸«à¸™à¹‰à¸²à¸šà¸£à¸´à¸à¸²à¸£à¹à¸¥à¸°à¸šà¸—à¸„à¸§à¸²à¸¡" },
    { name: "Direct / Referral", leads: ga4.connected ? `${ga4.totals.sessions.toLocaleString()} sessions` : "à¸£à¸­ GA4", spend: "-", priority: "à¸•à¸£à¸§à¸ˆ source à¸ˆà¸²à¸ UTM" },
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
    { title: "Monthly Marketing Summary", detail: "à¸ªà¸£à¸¸à¸›à¹à¸„à¸¡à¹€à¸›à¸ à¸‡à¸š à¹à¸¥à¸°à¸£à¸²à¸¢à¹„à¸”à¹‰à¸ˆà¸²à¸à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆ", status: "à¸žà¸£à¹‰à¸­à¸¡à¹ƒà¸Šà¹‰à¸šà¸²à¸‡à¸ªà¹ˆà¸§à¸™" },
    { title: "Channel Performance", detail: "à¹€à¸›à¸£à¸µà¸¢à¸šà¹€à¸—à¸µà¸¢à¸š LINE, Ads, Organic, Blog", status: "à¸£à¸­ source tracking" },
    { title: "Content Conversion", detail: "à¸”à¸¹à¸šà¸—à¸„à¸§à¸²à¸¡/à¸«à¸™à¹‰à¸²à¸šà¸£à¸´à¸à¸²à¸£à¸—à¸µà¹ˆà¸žà¸²à¹„à¸›à¸ªà¸¹à¹ˆ lead", status: "à¸£à¸­ GA4 event" },
  ];
  const insightCards = [
    "à¸„à¸§à¸£à¹ƒà¸Šà¹‰ LINE à¹€à¸›à¹‡à¸™ CTA à¸«à¸¥à¸±à¸ à¹€à¸žà¸£à¸²à¸°à¹€à¸›à¹‡à¸™à¸Šà¹ˆà¸­à¸‡à¸—à¸²à¸‡à¸—à¸µà¹ˆà¸¥à¸¹à¸à¸„à¹‰à¸²à¸ªà¹ˆà¸‡à¹„à¸Ÿà¸¥à¹Œà¹à¸¥à¸°à¸–à¸²à¸¡à¸£à¸²à¸„à¸²à¹„à¸”à¹‰à¹€à¸£à¹‡à¸§",
    "à¸—à¸¸à¸à¹à¸„à¸¡à¹€à¸›à¸ Ads à¸„à¸§à¸£à¹ƒà¸Šà¹‰ UTM à¹€à¸žà¸·à¹ˆà¸­à¹à¸¢à¸à¸œà¸¥à¸£à¸°à¸«à¸§à¹ˆà¸²à¸‡ Facebook, LINE à¹à¸¥à¸° Blog",
    "à¸«à¸¥à¸±à¸‡à¸•à¹ˆà¸­ GA4/Pixel à¹à¸¥à¹‰à¸§à¸„à¸§à¸£à¸§à¸±à¸” Lead à¹„à¸¡à¹ˆà¹ƒà¸Šà¹ˆà¹à¸„à¹ˆà¸§à¸±à¸” Traffic",
    "à¸«à¸™à¹‰à¸²à¸šà¸£à¸´à¸à¸²à¸£à¸„à¸§à¸£à¸¡à¸µ CTA à¹€à¸”à¸µà¸¢à¸§à¸—à¸µà¹ˆà¸Šà¸±à¸”: à¸›à¸£à¸¶à¸à¸©à¸²à¸—à¸²à¸‡ LINE à¸«à¸£à¸·à¸­à¸‚à¸­à¹ƒà¸šà¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸²",
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
              <Image src="/images/logo.png" alt="Display Works Media" width={42} height={30} style={{ width: 42, height: 30, objectFit: "contain", display: "block" }} />
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
            <p style={{ margin: "8px 0 14px", color: "#A8B0C0", fontSize: 12, lineHeight: 1.6 }}>à¸•à¸´à¸”à¸•à¸²à¸¡à¸œà¸¥à¹à¸„à¸¡à¹€à¸›à¸ à¹à¸«à¸¥à¹ˆà¸‡à¸—à¸µà¹ˆà¸¡à¸²à¸‚à¸­à¸‡ lead à¹à¸¥à¸°à¸¢à¸­à¸”à¸ˆà¸²à¸à¹€à¸­à¸à¸ªà¸²à¸£à¸ˆà¸£à¸´à¸‡à¹ƒà¸™à¸ˆà¸¸à¸”à¹€à¸”à¸µà¸¢à¸§</p>
            <button type="button" onClick={() => showToast("Marketing dashboard à¸žà¸£à¹‰à¸­à¸¡à¹ƒà¸Šà¹‰à¸‡à¸²à¸™")} style={{ width: "100%", border: 0, borderRadius: 12, padding: "10px 12px", color: "#fff", fontWeight: 900, background: "linear-gradient(135deg,#FF6B00,#EA580C)" }}>Check Setup</button>
          </div>
        </aside>

        <main className="marketing-main" style={{ padding: 26 }}>
          <header className="marketing-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 11, color: "#FF6B00", fontWeight: 900, letterSpacing: 2.4, textTransform: "uppercase", marginBottom: 6 }}>MARKETING COMMAND CENTER</div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 950, color: "#F8FAFC" }}>Display Works Media Marketing KPI Dashboard</h1>
              <p style={{ margin: "5px 0 0", color: "#A8B0C0", fontSize: 13 }}>à¸ à¸²à¸žà¸£à¸§à¸¡à¸›à¸£à¸°à¸ªà¸´à¸—à¸˜à¸´à¸ à¸²à¸žà¸à¸²à¸£à¸•à¸¥à¸²à¸”à¸‚à¸­à¸‡ Display Works Media</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <select style={{ height: 42, borderRadius: 12, border: "1px solid rgba(255,107,0,0.2)", background: "#101722", color: "#CBD5E1", padding: "0 14px", fontWeight: 700 }}>
                <option>Last 30 days</option><option>This month</option><option>Last 7 days</option>
              </select>
              <button type="button" onClick={() => showToast("Export report à¸¢à¸±à¸‡à¹€à¸›à¹‡à¸™à¸‚à¸±à¹‰à¸™à¸–à¸±à¸”à¹„à¸›")} style={{ height: 42, borderRadius: 12, border: "1px solid rgba(255,107,0,0.2)", background: "#101722", color: "#CBD5E1", padding: "0 14px", fontWeight: 800 }}>Export</button>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#EEF4FF", display: "grid", placeItems: "center", color: "#FF6B00", fontWeight: 900 }}>A</div>
            </div>
          </header>

          <section id="marketing-dashboard" className="marketing-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14, marginBottom: 18 }}>
            {[
              { label: "Campaign Revenue", value: `à¸¿${fmtMoney(revenue)}`, sub: "From receipts only", formula: "Revenue = receipt totals", icon: "à¸¿", color: "#10B981" },
              { label: "Total Leads", value: totalLeads.toLocaleString(), sub: "Manual CRM / Ads", formula: "Total Leads = max(CRM leads, API leads)", icon: "L", color: "#FF6B00" },
              { label: "Lead to Customer Conversion Rate", value: `${conversionRate.toFixed(2)}%`, sub: "Closed Jobs / Total Leads", formula: "Close Rate = Closed Jobs / Total Leads x 100", icon: "%", color: "#8B5CF6" },
              { label: "Closed Jobs", value: closedJobs.toLocaleString(), sub: "Receipts in ERP", formula: "Closed Jobs = valid receipts", icon: "J", color: "#22C55E" },
              { label: "Marketing Spend", value: `à¸¿${fmtMoney(marketingSpend)}`, sub: metaAds.connected ? "Meta Ads" : "Waiting Meta API", formula: "Spend from connected ad source", icon: "S", color: "#EC4899" },
              { label: "Cost per Lead", value: cpl ? `à¸¿${fmtMoney(cpl)}` : "-", sub: "CPL", formula: "CPL = Spend / Leads", icon: "C", color: "#EAB308" },
              { label: "Gross Profit", value: `à¸¿${fmtMoney(grossProfit)}`, sub: "Revenue - Cost", formula: "Gross Profit = Revenue - item cost", icon: "P", color: "#14B8A6" },
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
                    <strong style={{ color: "#F8FAFC", fontSize: 19 }}>à¸¿{fmtMoney(revenue)}</strong><span style={{ color: "#7A8599", fontSize: 11 }}>Revenue</span>
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
                    <td style={{ padding: "13px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>à¸¿{fmtMoney(row.spend)}</td>
                    <td style={{ padding: "13px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{Number(row.leads || 0).toLocaleString()}</td>
                    <td style={{ padding: "13px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{row.cpl ? `à¸¿${fmtMoney(row.cpl)}` : "-"}</td>
                    <td style={{ padding: "13px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>à¸¿{fmtMoney(row.revenue)}</td>
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
                        <td style={{ padding: "11px 8px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}><button type="button" onClick={() => editLead(lead)} style={{ marginRight: 6, color: "#FF6B00", background: "transparent", border: 0, cursor: "pointer", fontWeight: 900 }}>Edit</button><button type="button" onClick={() => removeLead(lead.id)} style={{ color: "#EF4444", background: "transparent", border: 0, cursor: "pointer", fontWeight: 900 }}>Delete</button></td>
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
              <div><h2 style={{ margin: 0, color: "#F8FAFC", fontSize: 19 }}>Insight</h2><p style={{ margin: "4px 0 0", color: "#A8B0C0" }}>à¸ªà¸£à¸¸à¸›à¸à¸²à¸£à¸§à¸´à¹€à¸„à¸£à¸²à¸°à¸«à¹Œà¹à¸¥à¸°à¸‚à¹‰à¸­à¹à¸™à¸°à¸™à¸³à¸ˆà¸²à¸à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸—à¸µà¹ˆà¹€à¸Šà¸·à¹ˆà¸­à¸¡à¸•à¹ˆà¸­</p></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12 }}>
              {[
                "LINE à¸¢à¸±à¸‡à¸„à¸§à¸£à¹€à¸›à¹‡à¸™ CTA à¸«à¸¥à¸±à¸ à¹€à¸žà¸£à¸²à¸°à¹€à¸«à¸¡à¸²à¸°à¸à¸±à¸šà¸à¸²à¸£à¸ªà¹ˆà¸‡à¹„à¸Ÿà¸¥à¹Œà¹à¸¥à¸°à¸–à¸²à¸¡à¸£à¸²à¸„à¸²",
                metaAds.connected ? "Meta Ads à¸žà¸£à¹‰à¸­à¸¡à¸­à¹ˆà¸²à¸™ Spend/CPC/CTR à¹à¸¥à¹‰à¸§" : "Meta Ads à¸¢à¸±à¸‡à¸£à¸­ Token à¹ƒà¸™ Vercel",
                ga4.connected ? "GA4 à¸žà¸£à¹‰à¸­à¸¡à¸­à¹ˆà¸²à¸™ Visitor à¹à¸¥à¸° Top Pages à¹à¸¥à¹‰à¸§" : "GA4 à¸¢à¸±à¸‡à¸£à¸­ Env à¸«à¸£à¸·à¸­ Redeploy",
                "à¸„à¸§à¸£à¹€à¸à¹‡à¸š UTM à¸—à¸¸à¸à¹à¸„à¸¡à¹€à¸›à¸à¹€à¸žà¸·à¹ˆà¸­à¹à¸¢à¸à¹à¸«à¸¥à¹ˆà¸‡à¸—à¸µà¹ˆà¸¡à¸²à¸‚à¸­à¸‡ Lead",
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
                  <div style={{ marginTop: 12 }}><span style={pill(source.state === "Connected" || source.state === "à¸žà¸£à¹‰à¸­à¸¡à¹ƒà¸Šà¹‰" ? "#ECFDF3" : source.state === "Error" ? "#FEF3F2" : "#FFF7ED", source.state === "Connected" || source.state === "à¸žà¸£à¹‰à¸­à¸¡à¹ƒà¸Šà¹‰" ? "#039855" : source.state === "Error" ? "#D92D20" : "#F97316")}>{source.state}</span></div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

// â”€â”€â”€ ERP COMPONENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SIDEBAR
// ============================================================
function ErpSidebar({ page, setPage, docCounts }: any) {
  const navItems = [
    { id: "dashboard", icon: "âŠž", label: "à¸ à¸²à¸žà¸£à¸§à¸¡" },
    { id: "customers", icon: "ðŸ‘¥", label: "à¸¥à¸¹à¸à¸„à¹‰à¸²" },
    { id: "products", icon: "ðŸ“¦", label: "à¸ªà¸´à¸™à¸„à¹‰à¸²/à¸šà¸£à¸´à¸à¸²à¸£" },
    { id: "suppliers", icon: "ðŸ­", label: "Supplier" },
    null,
    { id: "quote", icon: "ðŸ“‹", label: "à¹ƒà¸šà¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸²", count: docCounts.quote, color: DOC_TYPES.quote.color },
    { id: "bill", icon: "ðŸ“„", label: "à¹ƒà¸šà¸§à¸²à¸‡à¸šà¸´à¸¥", count: docCounts.bill, color: DOC_TYPES.bill.color },
    { id: "invoice", icon: "ðŸ§¾", label: "à¹ƒà¸šà¹à¸ˆà¹‰à¸‡à¸«à¸™à¸µà¹‰", count: docCounts.invoice, color: DOC_TYPES.invoice.color },
    { id: "receipt", icon: "âœ…", label: "à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆà¸£à¸±à¸šà¹€à¸‡à¸´à¸™", count: docCounts.receipt, color: DOC_TYPES.receipt.color },
    null,
    { id: "company", icon: "ðŸ¢", label: "à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸šà¸£à¸´à¸©à¸±à¸—" },
  ];
  return (
    <div style={{ width: 220, background: "#0d1120", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#FF6B00" }}>Display Works</div>
        <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>à¸£à¸°à¸šà¸šà¸ˆà¸±à¸”à¸à¸²à¸£à¹€à¸­à¸à¸ªà¸²à¸£à¸‚à¸²à¸¢</div>
      </div>
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map((item, i) =>
          item === null ? (
            <div key={i} style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 6px" }} />
          ) : (
            <button type="button" key={item.id} onClick={() => setPage(item.id)} style={{
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
// DASHBOARD â€” à¹€à¸žà¸´à¹ˆà¸¡à¸à¸³à¹„à¸£/à¸‚à¸²à¸”à¸—à¸¸à¸™
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

  // â”€â”€â”€ à¸„à¸³à¸™à¸§à¸“à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸«à¸¥à¸±à¸ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ Pending & alerts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const pendingDocs = documents.filter((d: any) => ["draft","sent"].includes(d.status));
  const overdueCount = pendingDocs.filter((d: any) => {
    const due = new Date(d.dueDate || d.date);
    due.setDate(due.getDate() + 30);
    return due < now;
  }).length;

  // â”€â”€â”€ Top Products by profit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ Chart data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ Alerts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const alerts: { type: "warn"|"error"|"info"; text: string }[] = [];
  if (overdueCount > 0) alerts.push({ type: "error", text: `à¸¡à¸µà¹€à¸­à¸à¸ªà¸²à¸£à¸„à¹‰à¸²à¸‡à¸Šà¸³à¸£à¸°à¹€à¸à¸´à¸™à¸à¸³à¸«à¸™à¸” ${overdueCount} à¸£à¸²à¸¢à¸à¸²à¸£` });
  if (revChange !== null && revChange < -10) alerts.push({ type: "warn", text: `à¸¢à¸­à¸”à¸‚à¸²à¸¢à¹€à¸”à¸·à¸­à¸™à¸™à¸µà¹‰à¸¥à¸”à¸¥à¸‡ ${Math.abs(revChange).toFixed(1)}% à¸ˆà¸²à¸à¹€à¸”à¸·à¸­à¸™à¸à¹ˆà¸­à¸™` });
  if (+profitMarginAll < 20 && totalRevenue > 0) alerts.push({ type: "warn", text: `Margin à¸£à¸§à¸¡ ${profitMarginAll}% à¸•à¹ˆà¸³à¸à¸§à¹ˆà¸²à¹€à¸à¸“à¸‘à¹Œ (20%)` });
  if (pendingDocs.length > 5) alerts.push({ type: "info", text: `à¸¡à¸µà¹€à¸­à¸à¸ªà¸²à¸£à¸£à¸­à¸”à¸³à¹€à¸™à¸´à¸™à¸à¸²à¸£ ${pendingDocs.length} à¸£à¸²à¸¢à¸à¸²à¸£` });

  // â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      {/* â”€â”€ HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="erp-dashboard-header" style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, color: "#FF6B00", textTransform: "uppercase", marginBottom: 6 }}>BUSINESS COMMAND CENTER</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2 }}>à¸ à¸²à¸žà¸£à¸§à¸¡à¸˜à¸¸à¸£à¸à¸´à¸ˆ</h1>
          <p style={{ fontSize: 13, color: "#4B5563", marginTop: 4 }}>
            {now.toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="erp-date-controls" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {[{k:"7d",l:"7 à¸§à¸±à¸™"},{k:"30d",l:"30 à¸§à¸±à¸™"},{k:"12m",l:"12 à¹€à¸”à¸·à¸­à¸™"}].map(({k,l}) => (
            <button type="button" key={k} onClick={() => { setChartRange(k as any); setDateFilterMode("quick"); }} style={{
              padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
              background: dateFilterMode === "quick" && chartRange === k ? "#FF6B00" : "transparent",
              color: dateFilterMode === "quick" && chartRange === k ? "#fff" : "#6B7280", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
            }}>{l}</button>
          ))}
          <input
            aria-label="à¹€à¸¥à¸·à¸­à¸à¸§à¸±à¸™"
            type="date"
            value={dateFilter.day}
            onFocus={() => setDateFilterMode("day")}
            onChange={(e) => { setDateFilterMode("day"); setDateFilter((prev) => ({ ...prev, day: e.target.value })); }}
            style={{ ...filterInputStyle, borderColor: dateFilterMode === "day" ? "#FF6B00" : "rgba(255,255,255,0.08)" }}
          />
          <input
            aria-label="à¹€à¸¥à¸·à¸­à¸à¹€à¸”à¸·à¸­à¸™"
            type="month"
            value={dateFilter.month}
            onFocus={() => setDateFilterMode("month")}
            onChange={(e) => { setDateFilterMode("month"); setDateFilter((prev) => ({ ...prev, month: e.target.value })); }}
            style={{ ...filterInputStyle, borderColor: dateFilterMode === "month" ? "#FF6B00" : "rgba(255,255,255,0.08)" }}
          />
          <input
            aria-label="à¹€à¸¥à¸·à¸­à¸à¸›à¸µ"
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

      {/* â”€â”€ HERO KPI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {/* Revenue */}
        <div style={{ ...card(), padding: "22px 24px", borderTop: "2px solid #10B981", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -10, top: -10, fontSize: 56, opacity: 0.04 }}>à¸¿</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#10B981", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>REVENUE / à¹€à¸”à¸·à¸­à¸™à¸™à¸µà¹‰</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1 }}>à¸¿{fmtB(revThisMonth)}</div>
          {revChange !== null && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10, fontSize: 12 }}>
              <span style={{ color: revChange >= 0 ? "#10B981" : "#EF4444", fontWeight: 700 }}>{revChange >= 0 ? "â–²" : "â–¼"} {Math.abs(revChange).toFixed(1)}%</span>
              <span style={{ color: "#4B5563" }}>vs à¹€à¸”à¸·à¸­à¸™à¸à¹ˆà¸­à¸™</span>
            </div>
          )}
        </div>

        {/* Net Profit */}
        <div style={{ ...card(), padding: "22px 24px", borderTop: `2px solid ${profitThis >= 0 ? "#10B981" : "#EF4444"}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -10, top: -10, fontSize: 56, opacity: 0.04 }}>P</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: profitThis >= 0 ? "#10B981" : "#EF4444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>NET PROFIT</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: profitThis >= 0 ? "#10B981" : "#EF4444", lineHeight: 1 }}>à¸¿{fmtB(profitThis)}</div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#4B5563" }}>Margin à¹€à¸”à¸·à¸­à¸™à¸™à¸µà¹‰ <span style={{ color: "#fff", fontWeight: 700 }}>{marginThis.toFixed(1)}%</span></div>
        </div>

        {/* Expense */}
        <div style={{ ...card(), padding: "22px 24px", borderTop: "2px solid #EF4444", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -10, top: -10, fontSize: 56, opacity: 0.04 }}>E</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#EF4444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>EXPENSE / à¸•à¹‰à¸™à¸—à¸¸à¸™</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1 }}>à¸¿{fmtB(costThisMonth)}</div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#4B5563" }}>à¸£à¸§à¸¡à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸” <span style={{ color: "#EF4444", fontWeight: 700 }}>à¸¿{fmtB(totalCost)}</span></div>
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

      {/* â”€â”€ CHART + ALERTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="chart-panel" style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14, marginBottom: 20 }}>

        {/* Revenue Chart */}
        <div style={{ ...card(), padding: "22px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Revenue vs Expense vs Profit</div>
              <div style={{ fontSize: 11, color: "#4B5563", marginTop: 2 }}>à¸¢à¸­à¸”à¸‚à¸²à¸¢ Â· à¸•à¹‰à¸™à¸—à¸¸à¸™ Â· à¸à¸³à¹„à¸£</div>
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
                {p > 0 && <span style={{ position: "absolute", right: "100%", paddingRight: 4 }}>à¸¿{fmtB(maxVal * p/100)}</span>}
              </div>
            ))}
            {chartData.map((pt, i) => (
              <div key={i} style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 1, position: "relative" }}>
                <div title={`Revenue: à¸¿${fmtMoney(pt.rev)}`} style={{ flex: 1, height: `${maxVal > 0 ? (pt.rev/maxVal)*100 : 0}%`, background: "rgba(16,185,129,0.7)", borderRadius: "3px 3px 0 0", minHeight: pt.rev > 0 ? 2 : 0, transition: "height 0.4s ease", cursor: "pointer" }}
                  onMouseEnter={e => { (e.currentTarget as any).style.background = "#10B981"; }}
                  onMouseLeave={e => { (e.currentTarget as any).style.background = "rgba(16,185,129,0.7)"; }} />
                <div title={`Expense: à¸¿${fmtMoney(pt.cost)}`} style={{ flex: 1, height: `${maxVal > 0 ? (pt.cost/maxVal)*100 : 0}%`, background: "rgba(239,68,68,0.6)", borderRadius: "3px 3px 0 0", minHeight: pt.cost > 0 ? 2 : 0, transition: "height 0.4s ease", cursor: "pointer" }}
                  onMouseEnter={e => { (e.currentTarget as any).style.background = "#EF4444"; }}
                  onMouseLeave={e => { (e.currentTarget as any).style.background = "rgba(239,68,68,0.6)"; }} />
                <div title={`Profit: à¸¿${fmtMoney(pt.profit)}`} style={{ flex: 1, height: `${maxVal > 0 ? (Math.max(pt.profit,0)/maxVal)*100 : 0}%`, background: "rgba(59,130,246,0.7)", borderRadius: "3px 3px 0 0", minHeight: pt.profit > 0 ? 2 : 0, transition: "height 0.4s ease", cursor: "pointer" }}
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
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>âš¡ Business Alerts</div>
          {alerts.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <div style={{ fontSize: 32 }}>âœ…</div>
              <div style={{ fontSize: 12, color: "#4B5563", textAlign: "center" }}>à¸˜à¸¸à¸£à¸à¸´à¸ˆà¸”à¸³à¹€à¸™à¸´à¸™à¹„à¸›à¸›à¸à¸•à¸´ à¹„à¸¡à¹ˆà¸¡à¸µà¸ªà¸±à¸à¸à¸²à¸“à¹€à¸•à¸·à¸­à¸™</div>
            </div>
          ) : (
            alerts.map((a, i) => (
              <div key={i} style={{
                padding: "10px 12px", borderRadius: 10, fontSize: 12, lineHeight: 1.5,
                background: a.type === "error" ? "rgba(239,68,68,0.08)" : a.type === "warn" ? "rgba(245,158,11,0.08)" : "rgba(59,130,246,0.08)",
                border: `1px solid ${a.type === "error" ? "rgba(239,68,68,0.2)" : a.type === "warn" ? "rgba(245,158,11,0.2)" : "rgba(59,130,246,0.2)"}`,
                color: a.type === "error" ? "#FCA5A5" : a.type === "warn" ? "#FCD34D" : "#93C5FD",
              }}>
                {a.type === "error" ? "ðŸ”´" : a.type === "warn" ? "ðŸŸ¡" : "ðŸ”µ"} {a.text}
              </div>
            ))
          )}

          {/* Quick stats */}
          <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { l: "à¸£à¸­à¸”à¸³à¹€à¸™à¸´à¸™à¸à¸²à¸£", v: pendingDocs.length + " à¸£à¸²à¸¢à¸à¸²à¸£", c: "#F59E0B" },
              { l: "à¸¥à¸¹à¸à¸„à¹‰à¸²à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”", v: customers.length + " à¸£à¸²à¸¢", c: "#3B82F6" },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "#4B5563" }}>{l}</span>
                <span style={{ color: c, fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* â”€â”€ INSIGHTS ROW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="insights-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>

        {/* Top Products */}
        <div style={{ ...card(), padding: "22px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 16 }}>ðŸ† Top Products by Profit</div>
          {topProducts.length === 0 ? (
            <div style={{ textAlign: "center", color: "#4B5563", fontSize: 12, padding: "20px 0" }}>à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥</div>
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
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>à¸¿{fmtB(p.profit)}</div>
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
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 16 }}>ðŸ“ à¹€à¸­à¸à¸ªà¸²à¸£</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {Object.entries(DOC_TYPES).map(([key, dt]: [string, any]) => (
              <button type="button" key={key} onClick={() => setPage(key)} style={{
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
                <span>à¸ªà¸±à¸”à¸ªà¹ˆà¸§à¸™à¸à¸³à¹„à¸£ / à¸•à¹‰à¸™à¸—à¸¸à¸™</span>
                <span style={{ color: "#10B981", fontWeight: 700 }}>{profitMarginAll}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                <div style={{ height: "100%", display: "flex", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${100 - profitMarginPct}%`, background: "rgba(239,68,68,0.5)", transition: "width 0.5s" }} />
                  <div style={{ width: `${profitMarginPct}%`, background: "linear-gradient(90deg,#10B981,#34D399)", transition: "width 0.5s" }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#4B5563", marginTop: 4 }}>
                <span style={{ color: "#EF4444" }}>à¸•à¹‰à¸™à¸—à¸¸à¸™ à¸¿{fmtB(totalCost)}</span>
                <span style={{ color: "#10B981" }}>à¸à¸³à¹„à¸£ à¸¿{fmtB(totalProfit)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€ LATEST ORDERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="erp-latest-panel" style={{ ...card(), overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>ðŸ• Latest Orders</div>
          <span style={{ fontSize: 11, color: "#4B5563" }}>5 à¸£à¸²à¸¢à¸à¸²à¸£à¸¥à¹ˆà¸²à¸ªà¸¸à¸”</span>
        </div>
        {recentDocs.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#4B5563", fontSize: 13 }}>à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¹€à¸­à¸à¸ªà¸²à¸£</div>
        ) : (
          <>
          <table className="erp-latest-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                {["à¹€à¸¥à¸‚à¸—à¸µà¹ˆ","à¸›à¸£à¸°à¹€à¸ à¸—","à¸¥à¸¹à¸à¸„à¹‰à¸²","à¸§à¸±à¸™à¸—à¸µà¹ˆ","à¸¢à¸­à¸”à¸£à¸§à¸¡","à¸ªà¸–à¸²à¸™à¸°"].map(h => (
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
                      <div>à¸¿{fmtMoney(total)}</div>
                      {depositPaid > 0 && balanceDue > 0 && <div style={{ marginTop: 3, color: "#F59E0B", fontSize: 11 }}>à¸„à¹‰à¸²à¸‡à¸Šà¸³à¸£à¸° à¸¿{fmtMoney(balanceDue)}</div>}
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
          <div className="erp-latest-cards" aria-label="Latest orders mobile cards">
            {recentDocs.map((doc: any) => {
              const { total, depositPaid, balanceDue } = calcDocTotal(doc, documents);
              const docType = (DOC_TYPES as any)[doc.type] || {};
              return (
                <button key={doc.id} type="button" className="erp-latest-card" onClick={() => setPage(doc.type)} style={{ borderColor: `${docType.color || "#FF6B00"}35` }}>
                  <div className="erp-latest-card-top">
                    <div>
                      <strong style={{ color: docType.color || "#FF6B00" }}>{doc.docNo}</strong>
                      <span>{doc.customerName || "-"}</span>
                    </div>
                    <div>
                      <b>à¸¿{fmtMoney(total)}</b>
                      <span>{fmtDate(doc.date)}</span>
                    </div>
                  </div>
                  <div className="erp-latest-card-meta">
                    <span style={{ background: `${docType.color || "#FF6B00"}20`, color: docType.color || "#FF6B00" }}>{docType.label || doc.type}</span>
                    <span style={{ background: `${(STATUS_COLORS as any)[doc.status] || "#64748B"}20`, color: (STATUS_COLORS as any)[doc.status] || "#CBD5E1" }}>{(STATUS_LABELS as any)[doc.status] || doc.status}</span>
                  </div>
                  {depositPaid > 0 && balanceDue > 0 && (
                    <div className="erp-latest-balance">à¸„à¹‰à¸²à¸‡à¸Šà¸³à¸£à¸° à¸¿{fmtMoney(balanceDue)}</div>
                  )}
                </button>
              );
            })}
          </div>
          </>
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
      const label = String(labelFn(row) || "à¹„à¸¡à¹ˆà¸£à¸°à¸šà¸¸").trim() || "à¹„à¸¡à¹ˆà¸£à¸°à¸šà¸¸";
      map.set(label, (map.get(label) || 0) + valueFn(row));
    });
    return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  };
  const sourceRows = (() => {
    const map = new Map<string, { label: string; customers: Set<string>; docs: number; revenue: number }>();
    activeDocs.forEach((doc: any) => {
      const label = doc.leadSource || "à¹„à¸¡à¹ˆà¸£à¸°à¸šà¸¸";
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
  const segmentRows = summarize(customers, (customer: any) => customer.customerSegment || "à¹„à¸¡à¹ˆà¸£à¸°à¸šà¸¸");
  const businessRows = summarize(customers, (customer: any) => customer.businessType || "à¹„à¸¡à¹ˆà¸£à¸°à¸šà¸¸").slice(0, 7);
  const productRows = (() => {
    const map = new Map<string, { label: string; docs: Set<string>; qty: number; revenue: number; profit: number }>();
    receiptDocs.forEach((doc: any) => {
      (doc.items || []).forEach((item: any) => {
        const label = item.name || "à¹„à¸¡à¹ˆà¸£à¸°à¸šà¸¸à¸ªà¸´à¸™à¸„à¹‰à¸²/à¸šà¸£à¸´à¸à¸²à¸£";
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
          <h2 style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>Dashboard à¸§à¸´à¹€à¸„à¸£à¸²à¸°à¸«à¹Œà¸¥à¸¹à¸à¸„à¹‰à¸²</h2>
          <p style={{ color: "#9CA3AF", fontSize: 13, marginTop: 4 }}>à¸”à¸¶à¸‡à¸ˆà¸²à¸ ERP à¹‚à¸”à¸¢à¸•à¸£à¸‡: à¸¥à¸¹à¸à¸„à¹‰à¸², à¹€à¸­à¸à¸ªà¸²à¸£, à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆ à¹à¸¥à¸°à¸£à¸²à¸¢à¸à¸²à¸£à¸ªà¸´à¸™à¸„à¹‰à¸²/à¸šà¸£à¸´à¸à¸²à¸£</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={miniCard}><div style={{ color: "#8B95A7", fontSize: 11 }}>à¸¥à¸¹à¸à¸„à¹‰à¸²</div><div style={{ fontSize: 24, fontWeight: 900 }}>{customers.length}</div></div>
          <div style={miniCard}><div style={{ color: "#8B95A7", fontSize: 11 }}>à¹€à¸­à¸à¸ªà¸²à¸£ ERP</div><div style={{ fontSize: 24, fontWeight: 900 }}>{activeDocs.length}</div></div>
          <div style={miniCard}><div style={{ color: "#8B95A7", fontSize: 11 }}>à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆ</div><div style={{ fontSize: 24, fontWeight: 900, color: "#10B981" }}>{receiptDocs.length}</div></div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>
        <div style={miniCard}><div style={{ color: "#9CA3AF", fontSize: 12 }}>à¸¢à¸­à¸”à¸‚à¸²à¸¢à¸ˆà¸£à¸´à¸‡à¸ˆà¸²à¸à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆ</div><div style={{ color: "#F8FAFC", fontSize: 24, fontWeight: 900 }}>à¸¿{fmtMoney(receiptRevenue)}</div><div style={{ color: "#64748B", fontSize: 11, marginTop: 3 }}>à¸™à¸±à¸šà¹€à¸‰à¸žà¸²à¸° Receipt à¹ƒà¸™ ERP</div></div>
        <div style={miniCard}><div style={{ color: "#9CA3AF", fontSize: 12 }}>à¸à¸³à¹„à¸£à¹‚à¸”à¸¢à¸›à¸£à¸°à¸¡à¸²à¸“</div><div style={{ color: "#10B981", fontSize: 24, fontWeight: 900 }}>à¸¿{fmtMoney(receiptProfit)}</div><div style={{ color: "#64748B", fontSize: 11, marginTop: 3 }}>à¸¢à¸­à¸”à¸‚à¸²à¸¢ - à¸•à¹‰à¸™à¸—à¸¸à¸™à¸£à¸²à¸¢à¸à¸²à¸£</div></div>
        <div style={miniCard}><div style={{ color: "#9CA3AF", fontSize: 12 }}>à¸¥à¸¹à¸à¸„à¹‰à¸²à¸ªà¸±à¹ˆà¸‡à¸‹à¹‰à¸³</div><div style={{ color: "#FFB000", fontSize: 24, fontWeight: 900 }}>{repeatCustomers}</div><div style={{ color: "#64748B", fontSize: 11, marginTop: 3 }}>à¸¡à¸µà¹€à¸­à¸à¸ªà¸²à¸£à¸¡à¸²à¸à¸à¸§à¹ˆà¸² 1 à¹ƒà¸š</div></div>
        <div style={miniCard}><div style={{ color: "#9CA3AF", fontSize: 12 }}>à¸Šà¹ˆà¸­à¸‡à¸—à¸²à¸‡à¸—à¸µà¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥</div><div style={{ color: "#F8FAFC", fontSize: 24, fontWeight: 900 }}>{sourceRows.filter((row) => row.label !== "à¹„à¸¡à¹ˆà¸£à¸°à¸šà¸¸").length}</div><div style={{ color: "#64748B", fontSize: 11, marginTop: 3 }}>à¸ˆà¸²à¸ Lead Source à¹ƒà¸™à¹€à¸­à¸à¸ªà¸²à¸£</div></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
        <div style={cardStyle}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>à¸¥à¸¹à¸à¸„à¹‰à¸²à¹€à¸ˆà¸­à¹€à¸£à¸²à¸ˆà¸²à¸à¹„à¸«à¸™</h2>
          <p style={{ color: "#8B95A7", fontSize: 12, marginBottom: 12 }}>à¸”à¸¹à¸§à¹ˆà¸²à¸Šà¹ˆà¸­à¸‡à¸—à¸²à¸‡à¹„à¸«à¸™à¸žà¸²à¸¥à¸¹à¸à¸„à¹‰à¸²à¸¡à¸²à¹à¸¥à¸°à¸ªà¸£à¹‰à¸²à¸‡à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆà¸ˆà¸£à¸´à¸‡</p>
          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 16, alignItems: "center" }}>
            <Donut rows={sourceRows.map((row) => ({ label: row.label, value: row.customers || row.docs }))} centerLabel="Channels" centerValue={sourceRows.length} />
            <div>
              {sourceRows.length === 0 ? <div style={{ color: "#6B7280", fontSize: 13 }}>à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥ Lead Source à¹ƒà¸™ ERP</div> : sourceRows.slice(0, 6).map((row, index) => (
                <div key={row.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontWeight: 800 }}>
                    <span><span style={{ color: colors[index % colors.length] }}>â—</span> {row.label}</span>
                    <span>{row.customers || row.docs} à¸£à¸²à¸¢</span>
                  </div>
                  <div style={{ color: "#94A3B8", fontSize: 12, marginTop: 3 }}>à¹€à¸­à¸à¸ªà¸²à¸£ {row.docs} à¹ƒà¸š Â· à¸¢à¸­à¸”à¸‚à¸²à¸¢à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆ à¸¿{fmtMoney(row.revenue)}</div>
                  <Bar pct={(row.customers || row.docs) / maxValue(sourceRows, "customers") * 100} color={colors[index % colors.length]} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={cardStyle}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>B2B / B2C</h2>
          <p style={{ color: "#8B95A7", fontSize: 12, marginBottom: 12 }}>à¸”à¸¶à¸‡à¸ˆà¸²à¸à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸¥à¸¹à¸à¸„à¹‰à¸²à¹ƒà¸™ ERP</p>
          <Donut rows={segmentRows} centerLabel="Customers" centerValue={customers.length} />
          {segmentRows.map((row, index) => (
            <div key={row.label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}><span><span style={{ color: colors[index % colors.length] }}>â—</span> {row.label}</span><span>{row.value} à¸£à¸²à¸¢</span></div>
              <Bar pct={row.value / maxValue(segmentRows) * 100} color={colors[index % colors.length]} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
        <div style={cardStyle}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>à¸›à¸£à¸°à¹€à¸ à¸—à¸˜à¸¸à¸£à¸à¸´à¸ˆà¸¥à¸¹à¸à¸„à¹‰à¸²</h2>
          <p style={{ color: "#8B95A7", fontSize: 12, marginBottom: 14 }}>à¸Šà¹ˆà¸§à¸¢à¹€à¸«à¹‡à¸™à¸§à¹ˆà¸²à¸˜à¸¸à¸£à¸à¸´à¸ˆà¹à¸šà¸šà¹„à¸«à¸™à¹ƒà¸Šà¹‰à¸šà¸£à¸´à¸à¸²à¸£à¹€à¸£à¸²à¸¡à¸²à¸à¸—à¸µà¹ˆà¸ªà¸¸à¸”</p>
          {businessRows.length === 0 ? <div style={{ color: "#6B7280", fontSize: 13 }}>à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸›à¸£à¸°à¹€à¸ à¸—à¸˜à¸¸à¸£à¸à¸´à¸ˆà¹ƒà¸™ ERP</div> : businessRows.map((row, index) => (
            <div key={row.label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800 }}><span>{index + 1}. {row.label}</span><span>{row.value} à¸£à¸²à¸¢</span></div>
              <Bar pct={row.value / maxValue(businessRows) * 100} color={colors[index % colors.length]} height={10} />
            </div>
          ))}
        </div>
        <div style={cardStyle}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>à¸ªà¸´à¸™à¸„à¹‰à¸² / à¸šà¸£à¸´à¸à¸²à¸£à¸¢à¸­à¸”à¸™à¸´à¸¢à¸¡</h2>
          <p style={{ color: "#8B95A7", fontSize: 12, marginBottom: 14 }}>à¸™à¸±à¸šà¸ˆà¸²à¸à¸£à¸²à¸¢à¸à¸²à¸£à¹ƒà¸™à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆ à¹€à¸žà¸·à¹ˆà¸­à¸”à¸¹à¸‡à¸²à¸™à¸—à¸µà¹ˆà¸‚à¸²à¸¢à¸ˆà¸£à¸´à¸‡</p>
          {productRows.length === 0 ? <div style={{ color: "#6B7280", fontSize: 13 }}>à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸£à¸²à¸¢à¸à¸²à¸£à¸ªà¸´à¸™à¸„à¹‰à¸²/à¸šà¸£à¸´à¸à¸²à¸£à¸ˆà¸²à¸à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆà¹ƒà¸™ ERP</div> : productRows.map((row, index) => (
            <div key={row.label} style={{ display: "grid", gridTemplateColumns: "30px minmax(0,1fr) auto", gap: 10, alignItems: "center", padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ color: index === 0 ? "#FFB000" : "#8B95A7", fontWeight: 900 }}>#{index + 1}</div>
              <div>
                <div style={{ fontWeight: 800 }}>{row.label}</div>
                <div style={{ color: "#94A3B8", fontSize: 12 }}>à¸¢à¸­à¸”à¸‚à¸²à¸¢ à¸¿{fmtMoney(row.revenue)} Â· à¸à¸³à¹„à¸£ à¸¿{fmtMoney(row.profit)} Â· à¸ˆà¸³à¸™à¸§à¸™ {fmtMoney(row.qty)}</div>
                <Bar pct={row.jobs / maxValue(productRows, "jobs") * 100} color="#FFB000" height={10} />
              </div>
              <div style={{ color: "#FF6B00", fontWeight: 900 }}>{row.jobs} à¸‡à¸²à¸™</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...cardStyle, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
        <div>
          <div style={{ color: "#FF6B00", fontSize: 12, fontWeight: 900, marginBottom: 6 }}>à¸­à¹ˆà¸²à¸™ Dashboard à¸™à¸µà¹‰à¸¢à¸±à¸‡à¹„à¸‡</div>
          <p style={{ color: "#CBD5E1", fontSize: 13, lineHeight: 1.8 }}>à¸–à¹‰à¸²à¸Šà¹ˆà¸­à¸‡à¸—à¸²à¸‡à¹„à¸«à¸™à¸¡à¸µà¸¥à¸¹à¸à¸„à¹‰à¸²à¹€à¸¢à¸­à¸° à¹à¸•à¹ˆà¸¢à¸­à¸”à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆà¸™à¹‰à¸­à¸¢ à¸„à¸§à¸£à¸›à¸£à¸±à¸šà¸à¸²à¸£à¸„à¸±à¸”à¸à¸£à¸­à¸‡ Lead à¸«à¸£à¸·à¸­à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¹‚à¸†à¸©à¸“à¸²à¹ƒà¸«à¹‰à¸Šà¸±à¸”à¸‚à¸¶à¹‰à¸™</p>
        </div>
        <div>
          <div style={{ color: "#FF6B00", fontSize: 12, fontWeight: 900, marginBottom: 6 }}>à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸—à¸µà¹ˆà¸„à¸§à¸£à¸à¸£à¸­à¸à¹ƒà¸«à¹‰à¸„à¸£à¸š</div>
          <p style={{ color: "#CBD5E1", fontSize: 13, lineHeight: 1.8 }}>à¹ƒà¸™à¸«à¸™à¹‰à¸²à¸¥à¸¹à¸à¸„à¹‰à¸²à¹ƒà¸«à¹‰à¸à¸£à¸­à¸ B2B/B2C à¹à¸¥à¸°à¸›à¸£à¸°à¹€à¸ à¸—à¸˜à¸¸à¸£à¸à¸´à¸ˆ à¸ªà¹ˆà¸§à¸™à¹ƒà¸™à¹€à¸­à¸à¸ªà¸²à¸£à¹ƒà¸«à¹‰à¸à¸£à¸­à¸à¸Šà¹ˆà¸­à¸‡à¸—à¸²à¸‡à¸—à¸µà¹ˆà¸¥à¸¹à¸à¸„à¹‰à¸²à¸¡à¸²</p>
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
    if (!form.name.trim()) return showToast("à¸à¸£à¸¸à¸“à¸²à¹ƒà¸ªà¹ˆà¸Šà¸·à¹ˆà¸­à¸¥à¸¹à¸à¸„à¹‰à¸²", "error");
    if (form.taxId && !/^\d{13}$/.test(form.taxId.replace(/-/g, "")))
      return showToast("à¹€à¸¥à¸‚à¸œà¸¹à¹‰à¹€à¸ªà¸µà¸¢à¸ à¸²à¸©à¸µà¸•à¹‰à¸­à¸‡à¹€à¸›à¹‡à¸™à¸•à¸±à¸§à¹€à¸¥à¸‚ 13 à¸«à¸¥à¸±à¸", "error");
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
      if (error) return showToast("à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”: " + error.message, "error");
      setCustomers(prev => prev.map(c => c.id === form.id ? form : c));
      showToast("à¹à¸à¹‰à¹„à¸‚à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸¥à¸¹à¸à¸„à¹‰à¸²à¹à¸¥à¹‰à¸§");
    } else {
      const { data, error } = await supabase.from("erp_customers").insert(row).select().single();
      if (error) return showToast("à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”: " + error.message, "error");
      setCustomers(prev => [...prev, { ...form, id: data.id }]);
      showToast("à¹€à¸žà¸´à¹ˆà¸¡à¸¥à¸¹à¸à¸„à¹‰à¸²à¹ƒà¸«à¸¡à¹ˆà¹à¸¥à¹‰à¸§");
    }
    setEditing(null);
  };
  const del = async (id) => {
    if (!confirm("à¸¥à¸šà¸¥à¸¹à¸à¸„à¹‰à¸²à¸™à¸µà¹‰?")) return;
    const { error } = await supabase.from("erp_customers").delete().eq("id", id);
    if (error) return showToast("à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”: " + error.message, "error");
    setCustomers(prev => prev.filter(c => c.id !== id));
    showToast("à¸¥à¸šà¸¥à¸¹à¸à¸„à¹‰à¸²à¹à¸¥à¹‰à¸§");
  };
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div className="erp-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h2 style={{ fontSize: 20, fontWeight: 700 }}>à¸¥à¸¹à¸à¸„à¹‰à¸²</h2><p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{customers.length} à¸£à¸²à¸¢</p></div>
        <div className="erp-page-actions" style={{ display: "flex", gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ðŸ” à¸„à¹‰à¸™à¸«à¸²..." style={{ width: 220 }} />
          <Btn onClick={() => setEditing({ ...blank })} color="#FF6B00">+ à¹€à¸žà¸´à¹ˆà¸¡à¸¥à¸¹à¸à¸„à¹‰à¸²</Btn>
        </div>
      </div>
      <div className="erp-card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
        {filtered.map(c => (
          <div className="erp-data-card" key={c.id} style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div><div style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</div>{c.contact && <div style={{ fontSize: 12, color: "#A8B0C0" }}>{c.contact}</div>}</div>
              <div className="erp-card-actions" style={{ display: "flex", gap: 6 }}>
                <IconBtn onClick={() => setEditing({ ...c })} title="à¹à¸à¹‰à¹„à¸‚">âœï¸</IconBtn>
                <IconBtn onClick={() => del(c.id)} title="à¸¥à¸š" danger>ðŸ—‘ï¸</IconBtn>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#888", lineHeight: 2 }}>
              {(c.customerSegment || c.businessType) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {c.customerSegment && <span style={{ color: "#FFB076", border: "1px solid rgba(255,107,0,0.35)", background: "rgba(255,107,0,0.12)", borderRadius: 999, padding: "2px 8px", fontWeight: 700 }}>{c.customerSegment}</span>}
                  {c.businessType && <span style={{ color: "#A7F3D0", border: "1px solid rgba(16,185,129,0.28)", background: "rgba(16,185,129,0.10)", borderRadius: 999, padding: "2px 8px", fontWeight: 700 }}>{c.businessType}</span>}
                </div>
              )}
              {c.phone && <div>ðŸ“ž {c.phone}</div>}{c.email && <div>âœ‰ï¸ {c.email}</div>}
              {c.address && <div>ðŸ“ {c.address}</div>}{c.taxId && <div>ðŸªª {c.taxId}</div>}
            </div>
          </div>
        ))}
      </div>
      {editing && <Modal title={editing.id ? "à¹à¸à¹‰à¹„à¸‚à¸¥à¸¹à¸à¸„à¹‰à¸²" : "à¹€à¸žà¸´à¹ˆà¸¡à¸¥à¸¹à¸à¸„à¹‰à¸²"} onClose={() => setEditing(null)} width={500}><CustomerForm data={editing} onSave={save} onCancel={() => setEditing(null)} /></Modal>}
    </div>
  );
}
function CustomerForm({ data, onSave, onCancel }: any) {
  const [f, setF] = useState(data);
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  const businessTypes = ["à¸£à¹‰à¸²à¸™à¸„à¹‰à¸²", "à¸£à¹‰à¸²à¸™à¸­à¸²à¸«à¸²à¸£", "à¸„à¸²à¹€à¸Ÿà¹ˆ/à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡à¸”à¸·à¹ˆà¸¡", "à¸„à¸¥à¸´à¸™à¸´à¸/à¸„à¸§à¸²à¸¡à¸‡à¸²à¸¡", "à¸­à¸µà¹€à¸§à¸™à¸•à¹Œ/à¸­à¸­à¸à¸šà¸¹à¸˜", "à¹à¸šà¸£à¸™à¸”à¹Œà¸ªà¸´à¸™à¸„à¹‰à¸²", "à¸­à¸‡à¸„à¹Œà¸à¸£/à¸šà¸£à¸´à¸©à¸±à¸—", "à¹‚à¸£à¸‡à¹€à¸£à¸µà¸¢à¸™/à¸ªà¸–à¸²à¸šà¸±à¸™", "à¸­à¸·à¹ˆà¸™ à¹†"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Field label="à¸Šà¸·à¹ˆà¸­à¸šà¸£à¸´à¸©à¸±à¸—/à¸¥à¸¹à¸à¸„à¹‰à¸² *"><input value={f.name} onChange={set("name")} /></Field>
      <Field label="à¸Šà¸·à¹ˆà¸­à¸œà¸¹à¹‰à¸•à¸´à¸”à¸•à¹ˆà¸­"><input value={f.contact} onChange={set("contact")} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="à¸›à¸£à¸°à¹€à¸ à¸—à¸¥à¸¹à¸à¸„à¹‰à¸²">
          <select value={f.customerSegment || "B2B"} onChange={set("customerSegment")}>
            <option value="B2B">B2B - à¸˜à¸¸à¸£à¸à¸´à¸ˆ/à¸­à¸‡à¸„à¹Œà¸à¸£</option>
            <option value="B2C">B2C - à¸¥à¸¹à¸à¸„à¹‰à¸²à¸—à¸±à¹ˆà¸§à¹„à¸›</option>
          </select>
        </Field>
        <Field label="à¸›à¸£à¸°à¹€à¸ à¸—à¸˜à¸¸à¸£à¸à¸´à¸ˆ">
          <input list="customer-business-types" value={f.businessType || ""} onChange={set("businessType")} placeholder="à¹€à¸Šà¹ˆà¸™ à¸£à¹‰à¸²à¸™à¸­à¸²à¸«à¸²à¸£, à¸„à¸²à¹€à¸Ÿà¹ˆ, à¸„à¸¥à¸´à¸™à¸´à¸" />
          <datalist id="customer-business-types">
            {businessTypes.map((type) => <option key={type} value={type} />)}
          </datalist>
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="à¹‚à¸—à¸£à¸¨à¸±à¸žà¸—à¹Œ"><input value={f.phone} onChange={set("phone")} /></Field>
        <Field label="à¸­à¸µà¹€à¸¡à¸¥"><input value={f.email} onChange={set("email")} /></Field>
      </div>
      <Field label="à¸—à¸µà¹ˆà¸­à¸¢à¸¹à¹ˆ"><textarea value={f.address} onChange={set("address")} rows={2} style={{ resize: "vertical" }} /></Field>
      <Field label="à¹€à¸¥à¸‚à¸›à¸£à¸°à¸ˆà¸³à¸•à¸±à¸§à¸œà¸¹à¹‰à¹€à¸ªà¸µà¸¢à¸ à¸²à¸©à¸µ"><input value={f.taxId} onChange={set("taxId")} /></Field>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <Btn onClick={() => onSave(f)} color="#FF6B00" style={{ flex: 1 }}>à¸šà¸±à¸™à¸—à¸¶à¸</Btn>
        <Btn onClick={onCancel} outline style={{ flex: 1 }}>à¸¢à¸à¹€à¸¥à¸´à¸</Btn>
      </div>
    </div>
  );
}

// ============================================================
// PRODUCT PAGE â€” à¹à¸à¹‰à¹„à¸‚/à¸¥à¸šà¹„à¸”à¹‰
// ============================================================
function ProductPage({ products, setProducts, suppliers = [], showToast }: any) {
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const blank = { id: "", name: "", supplierName: "", unit: "à¸Šà¸´à¹‰à¸™", cost: "", price: "", costUnit: "piece", priceUnit: "piece" };
  const catalogProducts = [...products, ...supplierCatalogProducts(suppliers)];
  const filtered = catalogProducts.filter(p =>
    [p.name, p.supplierName].some((value) => String(value || "").toLowerCase().includes(search.toLowerCase()))
  );
  const isLegacyProductColumnError = (error: any) =>
    error?.code === "42703" || /cost_unit|price_unit|column/i.test(error?.message || "");
  const save = async (f) => {
    if (!f.name.trim()) return showToast("à¸à¸£à¸¸à¸“à¸²à¹ƒà¸ªà¹ˆà¸Šà¸·à¹ˆà¸­à¸ªà¸´à¸™à¸„à¹‰à¸²", "error");
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
      if (error) return showToast("à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”: " + error.message, "error");
      setProducts(prev => prev.map(p => p.id === f.id ? { ...f, ...legacyRow, supplierName: row.supplier_name, costUnit: row.cost_unit, priceUnit: row.price_unit } : p));
      showToast("à¹à¸à¹‰à¹„à¸‚à¸ªà¸´à¸™à¸„à¹‰à¸²à¹à¸¥à¹‰à¸§");
    } else {
      let { data, error } = await supabase.from("erp_products").insert(row).select().single();
      if (error && isLegacyProductColumnError(error)) {
        ({ data, error } = await supabase.from("erp_products").insert(legacyRow).select().single());
      }
      if (error) return showToast("à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”: " + error.message, "error");
      setProducts(prev => [...prev, { ...f, id: data.id, ...legacyRow, supplierName: row.supplier_name, costUnit: row.cost_unit, priceUnit: row.price_unit }]);
      showToast("à¹€à¸žà¸´à¹ˆà¸¡à¸ªà¸´à¸™à¸„à¹‰à¸²à¹ƒà¸«à¸¡à¹ˆà¹à¸¥à¹‰à¸§");
    }
    setEditing(null);
  };
  const del = async (id) => {
    if (!confirm("à¸¥à¸šà¸ªà¸´à¸™à¸„à¹‰à¸²à¸™à¸µà¹‰?")) return;
    const { error } = await supabase.from("erp_products").delete().eq("id", id);
    if (error) return showToast("à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”: " + error.message, "error");
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast("à¸¥à¸šà¸ªà¸´à¸™à¸„à¹‰à¸²à¹à¸¥à¹‰à¸§");
  };
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div className="erp-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h2 style={{ fontSize: 20, fontWeight: 700 }}>à¸ªà¸´à¸™à¸„à¹‰à¸²/à¸šà¸£à¸´à¸à¸²à¸£</h2><p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{catalogProducts.length} à¸£à¸²à¸¢à¸à¸²à¸£</p></div>
        <div className="erp-page-actions" style={{ display: "flex", gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ðŸ” à¸„à¹‰à¸™à¸«à¸²..." style={{ width: 200 }} />
          <Btn onClick={() => setEditing({ ...blank })} color="#FF6B00">+ à¹€à¸žà¸´à¹ˆà¸¡à¸ªà¸´à¸™à¸„à¹‰à¸²</Btn>
        </div>
      </div>
      <div className="erp-desktop-table" style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#1A2233" }}>
              {["à¸Šà¸·à¹ˆà¸­à¸ªà¸´à¸™à¸„à¹‰à¸²/à¸šà¸£à¸´à¸à¸²à¸£", "Supplier", "à¸«à¸™à¹ˆà¸§à¸¢", "à¸•à¹‰à¸™à¸—à¸¸à¸™", "à¸£à¸²à¸„à¸²à¸‚à¸²à¸¢", "à¸à¸³à¹„à¸£", "à¸ˆà¸±à¸”à¸à¸²à¸£"].map(h => (
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
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#ef4444" }}>à¸¿{fmtMoney(p.cost)} <span style={{ color: "#6B7280", fontSize: 11 }}>{priceBasisLabel(p.costUnit)}</span></td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#10b981", fontWeight: 600 }}>à¸¿{fmtMoney(p.price)} <span style={{ color: "#6B7280", fontSize: 11 }}>{priceBasisLabel(p.priceUnit)}</span></td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>
                    <span style={{ color: margin > 0 ? "#10b981" : "#ef4444" }}>à¸¿{fmtMoney(margin)}</span>
                    <span style={{ fontSize: 11, color: "#555", marginLeft: 6 }}>({pct}%)</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {p.fromSupplierCatalog ? (
                        <span style={{ fontSize: 11, color: "#6B7280" }}>à¹à¸à¹‰à¹„à¸‚à¸—à¸µà¹ˆà¹€à¸¡à¸™à¸¹ Supplier</span>
                      ) : (
                        <>
                          <IconBtn onClick={() => setEditing({ ...p })} title="à¹à¸à¹‰à¹„à¸‚">âœï¸</IconBtn>
                          <IconBtn onClick={() => del(p.id)} title="à¸¥à¸š" danger>ðŸ—‘ï¸</IconBtn>
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
                  à¸¿{fmtMoney(margin)}
                </div>
              </div>
              <div className="erp-mobile-stats">
                <div className="erp-mobile-stat"><span>Unit</span><strong>{p.unit}</strong></div>
                <div className="erp-mobile-stat"><span>Margin</span><strong>{pct}%</strong></div>
                <div className="erp-mobile-stat"><span>Cost</span><strong style={{ color: "#ef4444" }}>à¸¿{fmtMoney(p.cost)} {priceBasisLabel(p.costUnit)}</strong></div>
                <div className="erp-mobile-stat"><span>Sale</span><strong style={{ color: "#10b981" }}>à¸¿{fmtMoney(p.price)} {priceBasisLabel(p.priceUnit)}</strong></div>
              </div>
              <div className="erp-mobile-actions">
                {p.fromSupplierCatalog ? (
                  <button type="button" disabled style={{ gridColumn: "1 / -1", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8", borderRadius: 10, fontSize: 12, fontFamily: "inherit" }}>
                    à¹à¸à¹‰à¹„à¸‚à¸—à¸µà¹ˆà¹€à¸¡à¸™à¸¹ Supplier
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={() => setEditing({ ...p })} style={{ background: "rgba(255,107,0,0.14)", border: "1px solid rgba(255,107,0,0.35)", color: "#FFB076", borderRadius: 10, fontWeight: 700, fontFamily: "inherit" }}>à¹à¸à¹‰à¹„à¸‚</button>
                    <button type="button" onClick={() => del(p.id)} style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.28)", color: "#FCA5A5", borderRadius: 10, fontWeight: 700, fontFamily: "inherit" }}>à¸¥à¸š</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {editing && (
        <Modal title={editing.id ? "à¹à¸à¹‰à¹„à¸‚à¸ªà¸´à¸™à¸„à¹‰à¸²" : "à¹€à¸žà¸´à¹ˆà¸¡à¸ªà¸´à¸™à¸„à¹‰à¸²"} onClose={() => setEditing(null)} width={420}>
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
      unit: item.unit || (basis === "sqm" ? "à¸•à¸£.à¸¡." : prev.unit),
      cost: Number(item.supplierPrice || 0),
      price: Number(item.salePrice || 0),
      costUnit: basis,
      priceUnit: basis,
    }));
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Field label="à¸Šà¸·à¹ˆà¸­à¸ªà¸´à¸™à¸„à¹‰à¸²/à¸šà¸£à¸´à¸à¸²à¸£ *"><input value={f.name} onChange={set("name")} /></Field>
      <Field label="Supplier">
        <input value={f.supplierName} onChange={set("supplierName")} list="supplier-list" placeholder="à¹€à¸¥à¸·à¸­à¸à¸«à¸£à¸·à¸­à¸žà¸´à¸¡à¸žà¹Œà¸Šà¸·à¹ˆà¸­ Supplier" />
        <datalist id="supplier-list">{suppliers.map((supplier: any) => <option key={supplier.id || supplier.name} value={supplier.name} />)}</datalist>
      </Field>
      {supplierItems.length > 0 && (
        <Field label="à¸£à¸²à¸¢à¸à¸²à¸£à¸ˆà¸²à¸ Supplier">
          <select onChange={pickSupplierItem} defaultValue="">
            <option value="">-- à¹€à¸¥à¸·à¸­à¸à¸£à¸²à¸¢à¸à¸²à¸£à¹€à¸žà¸·à¹ˆà¸­à¹€à¸•à¸´à¸¡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸ªà¸´à¸™à¸„à¹‰à¸² --</option>
            {supplierItems.map((item: any) => (
              <option key={item.id} value={item.id}>
                {item.name} Â· à¸—à¸¸à¸™ à¸¿{fmtMoney(item.supplierPrice)} Â· à¸‚à¸²à¸¢ à¸¿{fmtMoney(item.salePrice)}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="à¸«à¸™à¹ˆà¸§à¸¢">
        <input value={f.unit} onChange={set("unit")} list="unit-list" />
        <datalist id="unit-list">{["à¸Šà¸´à¹‰à¸™","à¸­à¸±à¸™","à¸•à¸£.à¸¡.","à¹€à¸¡à¸•à¸£","à¹à¸œà¹ˆà¸™","à¸Šà¸¸à¸”","à¸‡à¸²à¸™","à¸„à¸£à¸±à¹‰à¸‡","100 à¸Šà¸´à¹‰à¸™"].map(u => <option key={u} value={u} />)}</datalist>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="à¸•à¹‰à¸™à¸—à¸¸à¸™ (à¸šà¸²à¸—)"><input type="number" value={f.cost} onChange={set("cost")} min="0" /></Field>
        <Field label="à¸£à¸²à¸„à¸²à¸‚à¸²à¸¢ (à¸šà¸²à¸—)"><input type="number" value={f.price} onChange={set("price")} min="0" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="à¸„à¸´à¸”à¸•à¹‰à¸™à¸—à¸¸à¸™à¹à¸šà¸š">
          <select value={f.costUnit} onChange={set("costUnit")}>
            {PRICE_BASIS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
        <Field label="à¸„à¸´à¸”à¸£à¸²à¸„à¸²à¸‚à¸²à¸¢à¹à¸šà¸š">
          <select value={f.priceUnit} onChange={set("priceUnit")}>
            {PRICE_BASIS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
      </div>
      {f.price && f.cost && (
        <div style={{ background: "#1A2233", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: margin > 0 ? "#10b981" : "#ef4444" }}>
          à¸à¸³à¹„à¸£: à¸¿{fmtMoney(margin)} ({pct}%)
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <Btn onClick={() => onSave({ ...f, cost: parseFloat(f.cost) || 0, price: parseFloat(f.price) || 0 })} color="#FF6B00" style={{ flex: 1 }}>à¸šà¸±à¸™à¸—à¸¶à¸</Btn>
        <Btn onClick={onCancel} outline style={{ flex: 1 }}>à¸¢à¸à¹€à¸¥à¸´à¸</Btn>
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
      category: item.category || "à¸ªà¸´à¸™à¸„à¹‰à¸²",
      unit: item.unit || "à¸Šà¸´à¹‰à¸™",
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
    if (!String(form.name || "").trim()) return showToast("à¸à¸£à¸¸à¸“à¸²à¹ƒà¸ªà¹ˆà¸Šà¸·à¹ˆà¸­ Supplier", "error");
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
        return showToast("à¸šà¸±à¸™à¸—à¸¶à¸ Supplier à¸¥à¸‡ database à¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ: " + ((error as any)?.message || error), "error");
      }
      commitLocal(suppliers.map((supplier: any) => supplier.id === form.id ? clean : supplier));
      showToast(savedRemote ? "à¹à¸à¹‰à¹„à¸‚ Supplier à¹à¸¥à¹‰à¸§" : "à¹à¸à¹‰à¹„à¸‚ Supplier à¹à¸¥à¹‰à¸§ (à¸šà¸±à¸™à¸—à¸¶à¸à¸ªà¸³à¸£à¸­à¸‡à¹ƒà¸™à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡)");
    } else {
      let saved = clean;
      let savedRemote = true;
      try {
        const { data, error } = await supabase.from("erp_suppliers").insert(row).select().single();
        if (error) throw error;
        saved = normalizeSupplier(clean, data.id);
      } catch (error) {
        console.warn("Supplier insert fallback:", error);
        return showToast("à¸šà¸±à¸™à¸—à¸¶à¸ Supplier à¸¥à¸‡ database à¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ: " + ((error as any)?.message || error), "error");
      }
      commitLocal([...suppliers, saved]);
      showToast(savedRemote ? "à¹€à¸žà¸´à¹ˆà¸¡ Supplier à¹ƒà¸«à¸¡à¹ˆà¹à¸¥à¹‰à¸§" : "à¹€à¸žà¸´à¹ˆà¸¡ Supplier à¹ƒà¸«à¸¡à¹ˆà¹à¸¥à¹‰à¸§ (à¸šà¸±à¸™à¸—à¸¶à¸à¸ªà¸³à¸£à¸­à¸‡à¹ƒà¸™à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡)");
    }
    setEditing(null);
  };
  const del = async (id: string) => {
    if (!confirm("à¸¥à¸š Supplier à¸™à¸µà¹‰?")) return;
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
      return showToast("à¸¥à¸š Supplier à¸ˆà¸²à¸ database à¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ: " + ((error as any)?.message || error), "error");
    }
    commitLocal(suppliers.filter((supplier: any) => supplier.id !== id));
    showToast(savedRemote ? "à¸¥à¸š Supplier à¹à¸¥à¹‰à¸§" : "à¸¥à¸š Supplier à¹à¸¥à¹‰à¸§ (à¸šà¸±à¸™à¸—à¸¶à¸à¸ªà¸³à¸£à¸­à¸‡à¹ƒà¸™à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡)");
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Supplier</h2>
          <p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{suppliers.length} à¸£à¸²à¸¢à¸à¸²à¸£</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="à¸„à¹‰à¸™à¸«à¸² Supplier..." style={{ width: 220 }} />
          <Btn onClick={() => setEditing({ ...blank })} color="#FF6B00">+ à¹€à¸žà¸´à¹ˆà¸¡ Supplier</Btn>
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
                  <div style={{ fontSize: 12, color: "#A8B0C0", marginTop: 4 }}>{supplier.contact || supplier.phone || "à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸•à¸´à¸”à¸•à¹ˆà¸­"}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <IconBtn onClick={() => setEditing({ ...supplier, items: supplier.items || [] })} title="à¹à¸à¹‰à¹„à¸‚">âœï¸</IconBtn>
                  <IconBtn onClick={() => del(supplier.id)} title="à¸¥à¸š" danger>ðŸ—‘ï¸</IconBtn>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div style={{ background: "#0F1420", borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>à¸ªà¸´à¸™à¸„à¹‰à¸²/à¸šà¸£à¸´à¸à¸²à¸£</div>
                  <div style={{ fontSize: 18, color: "#FF6B00", fontWeight: 800 }}>{itemCount}</div>
                </div>
                <div style={{ background: "#0F1420", borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>à¸£à¸²à¸„à¸² Supplier à¹€à¸£à¸´à¹ˆà¸¡à¸•à¹‰à¸™</div>
                  <div style={{ fontSize: 18, color: "#10b981", fontWeight: 800 }}>à¸¿{fmtMoney(minSupplierPrice)}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(supplier.items || []).slice(0, 3).map((item: any) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, color: "#CBD5E1", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 8 }}>
                    <span>{item.name}</span>
                    <span style={{ color: "#A8B0C0" }}>
                      à¸¿{fmtMoney(item.supplierPrice)} â†’ à¸¿{fmtMoney(item.salePrice)}
                      {item.pricingBasis === "sqm" ? ` / ${fmtMoney(item.totalSqm)} à¸•à¸£.à¸¡.` : ""}
                    </span>
                  </div>
                ))}
                {itemCount === 0 && <div style={{ fontSize: 12, color: "#6B7280", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 8 }}>à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸£à¸²à¸¢à¸à¸²à¸£à¸ªà¸´à¸™à¸„à¹‰à¸²/à¸šà¸£à¸´à¸à¸²à¸£</div>}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <Modal title={editing.id ? "à¹à¸à¹‰à¹„à¸‚ Supplier" : "à¹€à¸žà¸´à¹ˆà¸¡ Supplier"} onClose={() => setEditing(null)} width={860}>
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
      items: [...prev.items, { id: genId(), name: "", category: "à¸ªà¸´à¸™à¸„à¹‰à¸²", unit: "à¸Šà¸´à¹‰à¸™", pricingBasis: "piece", widthM: "", heightM: "", quantity: 1, supplierPrice: "", salePrice: "", note: "" }],
    }));
  };
  const removeItem = (id: string) => {
    setF((prev: any) => ({ ...prev, items: prev.items.filter((item: any) => item.id !== id) }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
        <Field label="à¸Šà¸·à¹ˆà¸­ Supplier *"><input value={f.name} onChange={set("name")} /></Field>
        <Field label="à¸œà¸¹à¹‰à¸•à¸´à¸”à¸•à¹ˆà¸­"><input value={f.contact} onChange={set("contact")} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="à¹‚à¸—à¸£à¸¨à¸±à¸žà¸—à¹Œ"><input value={f.phone} onChange={set("phone")} /></Field>
        <Field label="à¸­à¸µà¹€à¸¡à¸¥"><input value={f.email} onChange={set("email")} /></Field>
        <Field label="à¹€à¸¥à¸‚à¸œà¸¹à¹‰à¹€à¸ªà¸µà¸¢à¸ à¸²à¸©à¸µ"><input value={f.taxId} onChange={set("taxId")} /></Field>
      </div>
      <Field label="à¸—à¸µà¹ˆà¸­à¸¢à¸¹à¹ˆ"><textarea value={f.address} onChange={set("address")} rows={2} style={{ resize: "vertical" }} /></Field>

      <div style={{ background: "#0F1420", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>à¸£à¸²à¸¢à¸à¸²à¸£à¸ªà¸´à¸™à¸„à¹‰à¸²/à¸šà¸£à¸´à¸à¸²à¸£à¸—à¸µà¹ˆ Supplier à¸ˆà¸³à¸«à¸™à¹ˆà¸²à¸¢</div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>à¹ƒà¸ªà¹ˆà¸£à¸²à¸„à¸²à¸ˆà¸²à¸ Supplier à¹à¸¥à¸°à¸£à¸²à¸„à¸²à¸‚à¸²à¸¢à¸‚à¸­à¸‡à¹€à¸£à¸²</div>
          </div>
          <Btn onClick={addItem} color="#2563eb">+ à¹€à¸žà¸´à¹ˆà¸¡à¸£à¸²à¸¢à¸à¸²à¸£</Btn>
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
                  <Field label="à¸Šà¸·à¹ˆà¸­à¸£à¸²à¸¢à¸à¸²à¸£"><input value={item.name} onChange={(e) => setItem(item.id, "name", e.target.value)} /></Field>
                  <Field label="à¸›à¸£à¸°à¹€à¸ à¸—">
                    <select value={item.category} onChange={(e) => setItem(item.id, "category", e.target.value)}>
                      <option value="à¸ªà¸´à¸™à¸„à¹‰à¸²">à¸ªà¸´à¸™à¸„à¹‰à¸²</option>
                      <option value="à¸šà¸£à¸´à¸à¸²à¸£">à¸šà¸£à¸´à¸à¸²à¸£</option>
                    </select>
                  </Field>
                  <Field label="à¸„à¸´à¸”à¸£à¸²à¸„à¸²">
                    <select value={pricingBasis} onChange={(e) => {
                      setItem(item.id, "pricingBasis", e.target.value);
                      setItem(item.id, "unit", e.target.value === "sqm" ? "à¸•à¸£.à¸¡." : "à¸Šà¸´à¹‰à¸™");
                    }}>
                      <option value="piece">à¸•à¹ˆà¸­à¸Šà¸´à¹‰à¸™</option>
                      <option value="sqm">à¸•à¹ˆà¸­à¸•à¸²à¸£à¸²à¸‡à¹€à¸¡à¸•à¸£</option>
                    </select>
                  </Field>
                  <Field label="à¸£à¸²à¸„à¸² Supplier"><input type="number" min="0" value={item.supplierPrice} onChange={(e) => setItem(item.id, "supplierPrice", e.target.value)} /></Field>
                  <Field label="à¸£à¸²à¸„à¸²à¸‚à¸²à¸¢"><input type="number" min="0" value={item.salePrice} onChange={(e) => setItem(item.id, "salePrice", e.target.value)} /></Field>
                  <div style={{ paddingBottom: 9, fontSize: 12, color: margin >= 0 ? "#10b981" : "#ef4444", fontWeight: 800 }}>
                    à¸¿{fmtMoney(margin)}
                  </div>
                  <IconBtn onClick={() => removeItem(item.id)} title="à¸¥à¸šà¸£à¸²à¸¢à¸à¸²à¸£" danger>ðŸ—‘ï¸</IconBtn>
                </div>
                {pricingBasis === "sqm" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <Field label="à¸à¸§à¹‰à¸²à¸‡ (à¹€à¸¡à¸•à¸£)"><input type="number" min="0" step="0.01" value={item.widthM} onChange={(e) => setItem(item.id, "widthM", e.target.value)} /></Field>
                    <Field label="à¸ªà¸¹à¸‡ (à¹€à¸¡à¸•à¸£)"><input type="number" min="0" step="0.01" value={item.heightM} onChange={(e) => setItem(item.id, "heightM", e.target.value)} /></Field>
                    <Field label="à¸ˆà¸³à¸™à¸§à¸™à¸Šà¸´à¹‰à¸™"><input type="number" min="1" step="1" value={item.quantity} onChange={(e) => setItem(item.id, "quantity", e.target.value)} /></Field>
                    <Field label="à¸žà¸·à¹‰à¸™à¸—à¸µà¹ˆà¸£à¸§à¸¡">
                      <input value={`${fmtMoney(totalSqm)} à¸•à¸£.à¸¡.`} readOnly style={{ color: "#10b981", fontWeight: 800 }} />
                    </Field>
                  </div>
                )}
              </div>
            );
          })}
          {f.items.length === 0 && (
            <div style={{ border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 10, padding: 18, textAlign: "center", color: "#6B7280", fontSize: 13 }}>
              à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸£à¸²à¸¢à¸à¸²à¸£ à¸à¸”à¹€à¸žà¸´à¹ˆà¸¡à¸£à¸²à¸¢à¸à¸²à¸£à¹€à¸žà¸·à¹ˆà¸­à¸šà¸±à¸™à¸—à¸¶à¸à¸ªà¸´à¸™à¸„à¹‰à¸²/à¸šà¸£à¸´à¸à¸²à¸£à¸‚à¸­à¸‡ Supplier
            </div>
          )}
        </div>
      </div>

      <Field label="à¸«à¸¡à¸²à¸¢à¹€à¸«à¸•à¸¸"><textarea value={f.note} onChange={set("note")} rows={2} style={{ resize: "vertical" }} /></Field>
      <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
        <Btn onClick={() => onSave(f)} color="#FF6B00" style={{ flex: 1 }}>à¸šà¸±à¸™à¸—à¸¶à¸</Btn>
        <Btn onClick={onCancel} outline style={{ flex: 1 }}>à¸¢à¸à¹€à¸¥à¸´à¸</Btn>
      </div>
    </div>
  );
}

// ============================================================
// COMPANY PAGE
// ============================================================
function CompanyPage({ company, setCompany, showToast }: any) {
  const [f, setF] = useState({ bankName: "", bankBranch: "", bankAccount: "", bankType: "à¸­à¸­à¸¡à¸—à¸£à¸±à¸žà¸¢à¹Œ", salesPerson: "", ...company });
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
      if (error) return showToast("à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”: " + error.message, "error");
    } else {
      const { data, error } = await supabase.from("erp_company").insert(row).select().single();
      if (error) return showToast("à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”: " + error.message, "error");
      savedCompany = { ...f, id: data.id };
      setF(savedCompany);
    }
    setCompany(savedCompany);
    showToast("à¸šà¸±à¸™à¸—à¸¶à¸à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸šà¸£à¸´à¸©à¸±à¸—à¹à¸¥à¹‰à¸§");
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
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>âš™ï¸ à¸•à¸±à¹‰à¸‡à¸„à¹ˆà¸²à¸šà¸£à¸´à¸©à¸±à¸—</h2>

      {/* Section 1: à¸šà¸£à¸´à¸©à¸±à¸— */}
      <div style={secStyle}>
        {secTitle("ðŸ¢", "à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸šà¸£à¸´à¸©à¸±à¸—à¸œà¸¹à¹‰à¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸²")}
        <Field label="à¸Šà¸·à¹ˆà¸­à¸šà¸£à¸´à¸©à¸±à¸— / à¸£à¹‰à¸²à¸™à¸„à¹‰à¸²"><input value={f.name} onChange={set("name")} /></Field>
        <Field label="à¸—à¸µà¹ˆà¸­à¸¢à¸¹à¹ˆ"><textarea value={f.address} onChange={set("address")} rows={3} style={{ resize: "vertical" }} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="à¹‚à¸—à¸£à¸¨à¸±à¸žà¸—à¹Œ"><input value={f.phone || ""} onChange={set("phone")} placeholder="02-xxx-xxxx" /></Field>
          <Field label="à¸­à¸µà¹€à¸¡à¸¥"><input value={f.email || ""} onChange={set("email")} placeholder="info@company.com" /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="à¹€à¸¥à¸‚à¸œà¸¹à¹‰à¹€à¸ªà¸µà¸¢à¸ à¸²à¸©à¸µ"><input value={f.taxId || ""} onChange={set("taxId")} placeholder="0105550000000" /></Field>
          <Field label="à¸žà¸™à¸±à¸à¸‡à¸²à¸™à¸‚à¸²à¸¢ (Default)"><input value={f.salesPerson || ""} onChange={set("salesPerson")} placeholder="à¸Šà¸·à¹ˆà¸­à¸žà¸™à¸±à¸à¸‡à¸²à¸™" /></Field>
        </div>
      </div>

      {/* Section 2: à¸˜à¸™à¸²à¸„à¸²à¸£ */}
      <div style={secStyle}>
        {secTitle("ðŸ¦", "à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸šà¸±à¸à¸Šà¸µà¸£à¸±à¸šà¸Šà¸³à¸£à¸°à¹€à¸‡à¸´à¸™", "#3B82F6")}
        <Field label="à¸Šà¸·à¹ˆà¸­à¸šà¸±à¸à¸Šà¸µà¸£à¸±à¸šà¹€à¸‡à¸´à¸™"><input value={f.bankName || ""} onChange={set("bankName")} placeholder="à¸Šà¸·à¹ˆà¸­à¸šà¸±à¸à¸Šà¸µà¸˜à¸™à¸²à¸„à¸²à¸£" /></Field>
        <Field label="à¸˜à¸™à¸²à¸„à¸²à¸£ & à¸ªà¸²à¸‚à¸²"><input value={f.bankBranch || ""} onChange={set("bankBranch")} placeholder="à¹€à¸Šà¹ˆà¸™ à¸˜à¸™à¸²à¸„à¸²à¸£à¸à¸ªà¸´à¸à¸£à¹„à¸—à¸¢ à¸ªà¸²à¸‚à¸²à¸šà¸²à¸‡à¸šà¸±à¸§à¸—à¸­à¸‡" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="à¹€à¸¥à¸‚à¸—à¸µà¹ˆà¸šà¸±à¸à¸Šà¸µ"><input value={f.bankAccount || ""} onChange={set("bankAccount")} placeholder="xxx-x-xxxxx-x" /></Field>
          <Field label="à¸›à¸£à¸°à¹€à¸ à¸—à¸šà¸±à¸à¸Šà¸µ"><input value={f.bankType || ""} onChange={set("bankType")} placeholder="à¸­à¸­à¸¡à¸—à¸£à¸±à¸žà¸¢à¹Œ / à¸à¸£à¸°à¹à¸ªà¸£à¸²à¸¢à¸§à¸±à¸™" /></Field>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#A8B0C0", fontWeight: 600, display: "block", marginBottom: 8 }}>QR Code à¸Šà¸³à¸£à¸°à¹€à¸‡à¸´à¸™ (Default à¸ªà¸³à¸«à¸£à¸±à¸šà¹€à¸­à¸à¸ªà¸²à¸£à¹ƒà¸«à¸¡à¹ˆ)</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 72, height: 72, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, background: "#0B0F19", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
              {f.qrImage ? <img src={f.qrImage} alt="QR" style={{ width: 64, height: 64, objectFit: "contain" }} /> : <span style={{ fontSize: 28 }}>ðŸ“·</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, flex: 1 }}>
              <label style={{ cursor: "pointer", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#3B82F6", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, textAlign: "center" as const, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <span>ðŸ“</span> à¹€à¸¥à¸·à¸­à¸à¹„à¸Ÿà¸¥à¹Œà¸£à¸¹à¸›à¸ à¸²à¸ž QR Code
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => setF(prev => ({ ...prev, qrImage: ev.target?.result as string }));
                  reader.readAsDataURL(file);
                }} />
              </label>
              {f.qrImage && (
                <button type="button" onClick={() => setF(prev => ({ ...prev, qrImage: "" }))}
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  ðŸ—‘ à¸¥à¸šà¸£à¸¹à¸› QR Code
                </button>
              )}
            </div>
          </div>
        </div>

        {/* â”€â”€ à¸¥à¸²à¸¢à¹€à¸‹à¹‡à¸™à¸œà¸¹à¹‰à¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸² â”€â”€ */}
        <div>
          <label style={{ fontSize: 12, color: "#A8B0C0", fontWeight: 600, display: "block", marginBottom: 8 }}>âœï¸ à¸¥à¸²à¸¢à¹€à¸‹à¹‡à¸™à¸œà¸¹à¹‰à¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸² (à¹à¸ªà¸”à¸‡à¹ƒà¸™à¹€à¸­à¸à¸ªà¸²à¸£)</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 140, height: 72, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, background: "#0B0F19", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
              {f.signatureImage
                ? <img src={f.signatureImage} alt="à¸¥à¸²à¸¢à¹€à¸‹à¹‡à¸™" style={{ maxWidth: 132, maxHeight: 64, objectFit: "contain" }} />
                : <span style={{ fontSize: 12, color: "#555" }}>à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸¥à¸²à¸¢à¹€à¸‹à¹‡à¸™</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, flex: 1 }}>
              <label style={{ cursor: "pointer", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, textAlign: "center" as const, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <span>âœï¸</span> à¹€à¸¥à¸·à¸­à¸à¹„à¸Ÿà¸¥à¹Œà¸£à¸¹à¸›à¸ à¸²à¸žà¸¥à¸²à¸¢à¹€à¸‹à¹‡à¸™
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => setF(prev => ({ ...prev, signatureImage: ev.target?.result as string }));
                  reader.readAsDataURL(file);
                }} />
              </label>
              <p style={{ fontSize: 11, color: "#555", margin: 0 }}>à¹à¸™à¸°à¸™à¸³: à¸£à¸¹à¸›à¸žà¸·à¹‰à¸™à¸«à¸¥à¸±à¸‡à¹‚à¸›à¸£à¹ˆà¸‡à¹ƒà¸ª (PNG) à¸«à¸£à¸·à¸­à¸£à¸¹à¸›à¸—à¸µà¹ˆà¹€à¸«à¹‡à¸™à¸¥à¸²à¸¢à¹€à¸‹à¹‡à¸™à¸Šà¸±à¸”à¹€à¸ˆà¸™</p>
              {f.signatureImage && (
                <button type="button" onClick={() => setF(prev => ({ ...prev, signatureImage: "" }))}
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  ðŸ—‘ à¸¥à¸šà¸£à¸¹à¸›à¸¥à¸²à¸¢à¹€à¸‹à¹‡à¸™
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Btn onClick={save} color="#FF6B00">ðŸ’¾ à¸šà¸±à¸™à¸—à¸¶à¸à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”</Btn>
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
    // à¸«à¸² running number à¸ªà¸¹à¸‡à¸ªà¸¸à¸”à¸—à¸µà¹ˆà¸¡à¸µà¸­à¸¢à¸¹à¹ˆà¹à¸¥à¹‰à¸§à¹ƒà¸™à¸›à¸µà¸™à¸µà¹‰ à¹à¸—à¸™à¸à¸²à¸£à¸™à¸±à¸š .length
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
    setEditing({ id: "", type, docNo: nextDocNo(), date: today(), dueDate: addDays(today(), 30), customerId: "", customerName: "", projectName: "", orderId: "", salesPerson: company?.salesPerson || "", reference: "", leadSource: "", marketingCampaign: "", marketingAdSet: "", marketingAd: "", paymentType: type === "receipt" ? "deposit" : "", paymentAmount: 0, paymentDate: type === "receipt" ? today() : "", paymentNote: "", items: [], discount: 0, discountType: "percent", vat: true, vatRate: 7, wht: false, whtRate: 3, depositPaid: 0, depositDate: "", depositNote: "", status: "draft", notes: "", bankName: company?.bankName || "", bankBranch: company?.bankBranch || "", bankAccount: company?.bankAccount || "", bankType: company?.bankType || "à¸­à¸­à¸¡à¸—à¸£à¸±à¸žà¸¢à¹Œ", qrImage: company?.qrImage || "" });
  };
  const save = async (doc) => {
    if (!doc.customerId) return showToast("à¸à¸£à¸¸à¸“à¸²à¹€à¸¥à¸·à¸­à¸à¸¥à¸¹à¸à¸„à¹‰à¸²", "error");
    if (doc.items.length === 0) return showToast("à¸à¸£à¸¸à¸“à¸²à¹€à¸žà¸´à¹ˆà¸¡à¸£à¸²à¸¢à¸à¸²à¸£à¸ªà¸´à¸™à¸„à¹‰à¸²", "error");
    if (doc.items.some(i => i.qty < 0 || i.price < 0))
      return showToast("à¸ˆà¸³à¸™à¸§à¸™à¹à¸¥à¸°à¸£à¸²à¸„à¸²à¸•à¹‰à¸­à¸‡à¹„à¸¡à¹ˆà¸•à¸´à¸”à¸¥à¸š", "error");
    if (!doc.docNo?.trim()) return showToast("à¸à¸£à¸¸à¸“à¸²à¸£à¸°à¸šà¸¸à¹€à¸¥à¸‚à¸—à¸µà¹ˆà¹€à¸­à¸à¸ªà¸²à¸£", "error");
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
    const persistentFieldError = "à¸à¸²à¸™à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸„à¸­à¸¥à¸±à¸¡à¸™à¹Œà¸ªà¸³à¸«à¸£à¸±à¸š VAT/Marketing/à¸¡à¸±à¸”à¸ˆà¸³ à¸à¸£à¸¸à¸“à¸²à¸£à¸±à¸™ supabase/erp-persistent-document-fields.sql à¹ƒà¸™ Supabase Production à¹à¸¥à¹‰à¸§à¸šà¸±à¸™à¸—à¸¶à¸à¹€à¸­à¸à¸ªà¸²à¸£à¸­à¸µà¸à¸„à¸£à¸±à¹‰à¸‡";
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
        // à¸¥à¸š items à¹€à¸à¹ˆà¸² à¹à¸¥à¹‰à¸§à¹ƒà¸ªà¹ˆà¹ƒà¸«à¸¡à¹ˆ
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
      // insert items à¹ƒà¸«à¸¡à¹ˆ
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
      showToast(doc.id ? "à¸šà¸±à¸™à¸—à¸¶à¸à¹€à¸­à¸à¸ªà¸²à¸£à¹à¸¥à¹‰à¸§" : "à¸ªà¸£à¹‰à¸²à¸‡à¹€à¸­à¸à¸ªà¸²à¸£à¹ƒà¸«à¸¡à¹ˆà¹à¸¥à¹‰à¸§");
      setEditing(null);
    } catch (err: any) {
      showToast("à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”: " + err.message, "error");
    }
  };
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const del = (id) => {
    const doc = documents.find(d => d.id === id);
    if (doc?.status === "approved") return showToast("à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¸¥à¸šà¹€à¸­à¸à¸ªà¸²à¸£à¸—à¸µà¹ˆà¸­à¸™à¸¸à¸¡à¸±à¸•à¸´à¹à¸¥à¹‰à¸§ â€” à¸¢à¸à¹€à¸¥à¸´à¸à¸à¸²à¸£à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´à¸à¹ˆà¸­à¸™", "error");
    setDeleteConfirm(id);
  };
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const { error } = await supabase.from("erp_documents").update({ deleted: true, status: "cancelled" }).eq("id", deleteConfirm);
    if (error) return showToast("à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”: " + error.message, "error");
    setDocuments(prev => prev.map(d => d.id === deleteConfirm ? { ...d, deleted: true, status: "cancelled" } : d));
    setDeleteConfirm(null);
    showToast("à¸¥à¸šà¹€à¸­à¸à¸ªà¸²à¸£à¹à¸¥à¹‰à¸§");
  };
  const changeStatus = async (id, status) => {
    const { error } = await supabase.from("erp_documents").update({ status }).eq("id", id);
    if (error) return showToast("à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”: " + error.message, "error");
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    showToast(`à¸­à¸±à¸›à¹€à¸”à¸•à¸ªà¸–à¸²à¸™à¸°à¹€à¸›à¹‡à¸™ "${STATUS_LABELS[status]}"`);
  };

  // â”€â”€ Email Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const copyDocumentSummary = async (doc) => {
    const { netPay } = calcDocTotal(doc);
    const text = [
      `${DOC_TYPES[doc.type]?.label || "à¹€à¸­à¸à¸ªà¸²à¸£"} ${doc.docNo}`,
      `à¸¥à¸¹à¸à¸„à¹‰à¸²: ${doc.customerName || "-"}`,
      `à¸§à¸±à¸™à¸—à¸µà¹ˆ: ${fmtDate(doc.date)}`,
      `à¸„à¸£à¸šà¸à¸³à¸«à¸™à¸”: ${fmtDate(doc.dueDate)}`,
      `à¸¢à¸­à¸”à¸ªà¸¸à¸—à¸˜à¸´: à¸¿${fmtMoney(netPay)}`,
      `à¸ªà¸–à¸²à¸™à¸°: ${STATUS_LABELS[doc.status] || doc.status}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      showToast("à¸„à¸±à¸”à¸¥à¸­à¸à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹€à¸­à¸à¸ªà¸²à¸£à¹à¸¥à¹‰à¸§");
    } catch {
      showToast("à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¸„à¸±à¸”à¸¥à¸­à¸à¹„à¸”à¹‰", "error");
    }
  };

  const shareDocumentLink = async (doc) => {
    if (!doc?.id) {
      showToast("à¸à¸£à¸¸à¸“à¸²à¸šà¸±à¸™à¸—à¸¶à¸à¹€à¸­à¸à¸ªà¸²à¸£à¸à¹ˆà¸­à¸™à¹à¸Šà¸£à¹Œ", "error");
      return;
    }
    const title = `${DOC_TYPES[doc.type]?.label || "à¹€à¸­à¸à¸ªà¸²à¸£"} ${doc.docNo}`;
    const url = publicDocumentUrl(doc.id, doc.updatedAt || Date.now());
    try {
      if (navigator.share) {
        await navigator.share({ title, text: title, url });
        showToast("à¹à¸Šà¸£à¹Œà¸¥à¸´à¸‡à¸à¹Œà¹€à¸­à¸à¸ªà¸²à¸£à¹à¸¥à¹‰à¸§");
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast("à¸„à¸±à¸”à¸¥à¸­à¸à¸¥à¸´à¸‡à¸à¹Œà¹€à¸­à¸à¸ªà¸²à¸£à¹à¸¥à¹‰à¸§");
    } catch {
      showToast("à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¹à¸Šà¸£à¹Œà¸¥à¸´à¸‡à¸à¹Œà¹€à¸­à¸à¸ªà¸²à¸£à¹„à¸”à¹‰", "error");
    }
  };

  const previewDocumentPdf = (doc) => {
    printDocument(doc, customers, company, { autoPrint: false, allDocuments });
  };

  const [emailModal, setEmailModal] = useState<any>(null);
  // â”€â”€ Split Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [splitModal, setSplitModal] = useState<any>(null);

  // â”€â”€ à¸ªà¸£à¹‰à¸²à¸‡à¹€à¸­à¸à¸ªà¸²à¸£à¸•à¹ˆà¸­ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const DOC_NEXT: Record<string, { type: string; label: string; split?: boolean }[]> = {
    quote:   [
      { type: "bill",    label: "à¸ªà¸£à¹‰à¸²à¸‡à¹ƒà¸šà¸§à¸²à¸‡à¸šà¸´à¸¥ / à¹ƒà¸šà¸ªà¹ˆà¸‡à¸ªà¸´à¸™à¸„à¹‰à¸²" },
      { type: "bill",    label: "à¸ªà¸£à¹‰à¸²à¸‡à¹ƒà¸šà¸§à¸²à¸‡à¸šà¸´à¸¥ / à¹ƒà¸šà¸ªà¹ˆà¸‡à¸ªà¸´à¸™à¸„à¹‰à¸² (à¹à¸šà¹ˆà¸‡à¸ˆà¹ˆà¸²à¸¢)", split: true },
      { type: "invoice", label: "à¸ªà¸£à¹‰à¸²à¸‡à¹ƒà¸šà¹à¸ˆà¹‰à¸‡à¸«à¸™à¸µà¹‰" },
      { type: "invoice", label: "à¸ªà¸£à¹‰à¸²à¸‡à¹ƒà¸šà¹à¸ˆà¹‰à¸‡à¸«à¸™à¸µà¹‰ (à¹à¸šà¹ˆà¸‡à¸ˆà¹ˆà¸²à¸¢)", split: true },
    ],
    bill:    [{ type: "invoice", label: "à¸ªà¸£à¹‰à¸²à¸‡à¹ƒà¸šà¹à¸ˆà¹‰à¸‡à¸«à¸™à¸µà¹‰" }, { type: "receipt", label: "à¸ªà¸£à¹‰à¸²à¸‡à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆà¸£à¸±à¸šà¹€à¸‡à¸´à¸™" }],
    invoice: [{ type: "receipt", label: "à¸ªà¸£à¹‰à¸²à¸‡à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆà¸£à¸±à¸šà¹€à¸‡à¸´à¸™" }],
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
      notes: split ? (srcDoc.notes ? srcDoc.notes + "\n(à¹à¸šà¹ˆà¸‡à¸ˆà¹ˆà¸²à¸¢)" : "(à¹à¸šà¹ˆà¸‡à¸ˆà¹ˆà¸²à¸¢)") : srcDoc.notes,
      createdAt: undefined,
      updatedAt: undefined,
    };
    if (split) {
      setSplitModal({ srcDoc, newDoc });
    } else {
      setEditing(newDoc);
      showToast(`à¸ªà¸£à¹‰à¸²à¸‡${DOC_TYPES[targetType]?.label}à¸ˆà¸²à¸ ${srcDoc.docNo}`);
    }
  };

  // â”€â”€ Dropdown state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openStatus, setOpenStatus] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number; mobile?: boolean } | null>(null);
  const closeAll = useCallback(() => { setOpenMenu(null); setOpenStatus(null); setMenuPos(null); }, []);

  // â”€â”€ Fix: à¹ƒà¸Šà¹‰ data-attribute à¹à¸—à¸™ ref à¹€à¸žà¸£à¸²à¸° menuRef/statusRef single ref
  // à¹à¸•à¹ˆ render à¸—à¸±à¹‰à¸‡ desktop table à¹à¸¥à¸° mobile cards à¸žà¸£à¹‰à¸­à¸¡à¸à¸±à¸™ à¸—à¸³à¹ƒà¸«à¹‰ ref à¸Šà¸µà¹‰à¹„à¸›à¸—à¸µà¹ˆà¸­à¸±à¸™à¸ªà¸¸à¸”à¸—à¹‰à¸²à¸¢à¸—à¸µà¹ˆ render
  // à¸ªà¹ˆà¸‡à¸œà¸¥à¹ƒà¸«à¹‰ click à¹ƒà¸™ desktop menu à¹„à¸¡à¹ˆà¸–à¸¹à¸ detect à¸§à¹ˆà¸² "inMenu" -> closeAll() à¸¢à¸´à¸‡à¸à¹ˆà¸­à¸™ onClick
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
          <p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{documents.length} à¸‰à¸šà¸±à¸š</p>
        </div>
        <div className="doc-header-actions" style={{ display: "flex", gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ðŸ” à¸„à¹‰à¸™à¸«à¸²..." style={{ width: 180 }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 130 }}>
            <option value="all">à¸—à¸¸à¸à¸ªà¸–à¸²à¸™à¸°</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <Btn onClick={newDoc} color={dt.color}>+ à¸ªà¸£à¹‰à¸²à¸‡à¹€à¸­à¸à¸ªà¸²à¸£</Btn>
        </div>
      </div>
      <div className="doc-list-panel" style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "visible" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "#555" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>ðŸ“„</div>
            <div>à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¹€à¸­à¸à¸ªà¸²à¸£</div>
            <Btn onClick={newDoc} color={dt.color} style={{ marginTop: 16 }}>+ à¸ªà¸£à¹‰à¸²à¸‡à¹€à¸­à¸à¸ªà¸²à¸£à¹à¸£à¸</Btn>
          </div>
        ) : (<>
          {/* â”€â”€ Desktop Table â”€â”€ */}
          <table className="doc-table" style={{ width: "100%", borderCollapse: "collapse", borderRadius: 12, overflow: "visible" }}>
            <thead>
              <tr style={{ background: "#1A2233" }}>
                {["à¹€à¸¥à¸‚à¸—à¸µà¹ˆà¹€à¸­à¸à¸ªà¸²à¸£", "à¸¥à¸¹à¸à¸„à¹‰à¸²", "à¸§à¸±à¸™à¸—à¸µà¹ˆ", "à¸§à¸±à¸™à¸„à¸£à¸šà¸à¸³à¸«à¸™à¸”", "à¸¢à¸­à¸”à¸£à¸§à¸¡", "à¸ªà¸–à¸²à¸™à¸°", "à¸ˆà¸±à¸”à¸à¸²à¸£"].map((h, i, arr) => (
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
                      <div>à¸¿{fmtMoney(total)}</div>
                      {depositPaid > 0 && balanceDue > 0 && <div style={{ marginTop: 3, color: "#F59E0B", fontSize: 11 }}>à¸„à¹‰à¸²à¸‡à¸Šà¸³à¸£à¸° à¸¿{fmtMoney(balanceDue)}</div>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {/* â”€â”€ Status Badge + Dropdown â”€â”€ */}
                      <div style={{ position: "relative", display: "inline-block" }} data-status-dropdown="">
                        <button type="button" onClick={() => { setOpenStatus(openStatus === doc.id ? null : doc.id); setOpenMenu(null); setMenuPos(null); }}
                          style={{ display: "flex", alignItems: "center", gap: 6, background: STATUS_COLORS[doc.status] + "22", color: STATUS_COLORS[doc.status], border: `1px solid ${STATUS_COLORS[doc.status]}55`, padding: "5px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                          {STATUS_LABELS[doc.status]}
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M2 3.5l3 3 3-3"/></svg>
                        </button>
                        {openStatus === doc.id && (
                          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 999, background: "#1A2233", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 0", minWidth: 140, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                            {Object.entries(STATUS_LABELS).map(([k, v]) => (
                              <button type="button" key={k} onClick={() => { changeStatus(doc.id, k); setOpenStatus(null); }}
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
                      {/* â”€â”€ Action Menu â”€â”€ */}
                      <div style={{ position: "relative", display: "inline-block" }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {/* âœ… à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´ */}
                          {doc.status !== "approved" && doc.status !== "cancelled" && (
                            <button type="button" onClick={() => { changeStatus(doc.id, "approved"); }} title="à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´"
                              style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#10B981", borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                              âœ… à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´
                            </button>
                          )}
                          {/* à¹à¸à¹‰à¹„à¸‚ */}
                          <button type="button" onClick={() => { if (doc.status === "approved") return showToast("à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¹à¸à¹‰à¹„à¸‚à¹€à¸­à¸à¸ªà¸²à¸£à¸—à¸µà¹ˆà¸­à¸™à¸¸à¸¡à¸±à¸•à¸´à¹à¸¥à¹‰à¸§", "error"); setEditing({ ...doc }); }} title="à¹à¸à¹‰à¹„à¸‚"
                            style={{ background: doc.status === "approved" ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: doc.status === "approved" ? "#444" : "#ccc", borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: doc.status === "approved" ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                            à¹à¸à¹‰à¹„à¸‚
                          </button>
                          {/* â‹® More */}
                          <button type="button" onClick={(e) => {
                            if (openMenu === doc.id) { closeAll(); return; }
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            const menuWidth = Math.min(260, window.innerWidth - 24);
                            const right = Math.max(12, Math.min(window.innerWidth - rect.right, window.innerWidth - menuWidth - 12));
                            const top = Math.max(12, Math.min(rect.bottom + 4, window.innerHeight - 360));
                            setMenuPos({ top, right });
                            setOpenMenu(doc.id); setOpenStatus(null);
                          }}
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#ccc", borderRadius: 8, padding: "5px 10px", fontSize: 14, cursor: "pointer", fontFamily: "inherit", lineHeight: 1 }}>
                            â‹®
                          </button>
                        </div>
                        {openMenu === doc.id && menuPos && (
                          <div data-dropdown-menu="" style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 9999, background: "#1A2233", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 0", minWidth: 240, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxHeight: "70vh", overflowY: "auto" }}>
                            {/* à¸žà¸´à¸¡à¸žà¹Œ */}
                            <MenuBtn icon="ðŸ‘ï¸" label="à¸”à¸¹à¸•à¸±à¸§à¸­à¸¢à¹ˆà¸²à¸‡ PDF" onClick={() => { previewDocumentPdf(doc); closeAll(); }} />
                            <MenuBtn icon="ðŸ–¨ï¸" label="à¸žà¸´à¸¡à¸žà¹Œ" onClick={() => { printDocument(doc, customers, company, { allDocuments }); closeAll(); }} />
                            {/* à¹à¸Šà¸£à¹Œà¸¥à¸´à¸‡à¸„à¹Œ */}
                            <MenuBtn icon="ðŸ”—" label="à¹à¸Šà¸£à¹Œ" onClick={() => { shareDocumentLink(doc); closeAll(); }} />
                            {/* à¸”à¸²à¸§à¸™à¹Œà¹‚à¸«à¸¥à¸” */}
                            <MenuBtn icon="â¬‡ï¸" label="à¸”à¸²à¸§à¸™à¹Œà¹‚à¸«à¸¥à¸”" onClick={() => { printDocument(doc, customers, company, { allDocuments }); closeAll(); showToast("à¹€à¸›à¸´à¸”à¸«à¸™à¹‰à¸²à¸•à¹ˆà¸²à¸‡ â€” à¸à¸” Save as PDF"); }} />
                            {/* à¸­à¸µà¹€à¸¡à¸¥ */}
                            <MenuBtn icon="âœ‰ï¸" label="à¸­à¸µà¹€à¸¡à¸¥" onClick={() => {
                              const cust = customers.find(c => c.id === doc.customerId);
                              setEmailModal({ doc, toEmail: cust?.email || "", subject: `à¹€à¸­à¸à¸ªà¸²à¸£ ${doc.docNo} - ${cust?.name || ""}`, body: `à¹€à¸£à¸µà¸¢à¸™à¸„à¸¸à¸“ ${cust?.contact || cust?.name || "à¸¥à¸¹à¸à¸„à¹‰à¸²"},\n\nà¸à¸£à¸¸à¸“à¸²à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¹€à¸­à¸à¸ªà¸²à¸£ ${doc.docNo} à¸—à¸µà¹ˆà¹à¸™à¸šà¸¡à¸²à¸”à¹‰à¸§à¸¢à¸™à¸µà¹‰\n\nà¸‚à¸­à¸šà¸„à¸¸à¸“à¸„à¸£à¸±à¸š` });
                              closeAll();
                            }} />
                            {/* à¸ªà¸£à¹‰à¸²à¸‡à¸‹à¹‰à¸³ */}
                            <MenuBtn icon="ðŸ“‹" label="à¸ªà¸£à¹‰à¸²à¸‡à¸‹à¹‰à¸³" onClick={() => {
                              setEditing({ ...doc, id: "", docNo: nextDocNoForType(doc.type), date: today(), status: "draft" });
                              closeAll();
                            }} />

                            {/* à¸ªà¸£à¹‰à¸²à¸‡à¹€à¸­à¸à¸ªà¸²à¸£à¸•à¹ˆà¸­ */}
                            {(DOC_NEXT[doc.type] || []).length > 0 && (
                              <>
                                <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "6px 0" }} />
                                <div style={{ padding: "4px 14px 4px", fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>à¸ªà¸£à¹‰à¸²à¸‡à¹€à¸­à¸à¸ªà¸²à¸£à¸•à¹ˆà¸­</div>
                                {(DOC_NEXT[doc.type] || []).map((next, ni) => (
                                  <MenuBtn key={ni}
                                    icon={next.split ? "âœ‚ï¸" : DOC_TYPES[next.type]?.short === "BL" ? "ðŸ“‹" : DOC_TYPES[next.type]?.short === "IV" ? "ðŸ“‘" : "ðŸ§¾"}
                                    label={next.label}
                                    color={DOC_TYPES[next.type]?.color}
                                    onClick={() => { createFrom(doc, next.type, next.split); closeAll(); }}
                                  />
                                ))}
                              </>
                            )}

                            {/* à¸¥à¸š */}
                            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "6px 0" }} />
                            <MenuBtn icon="ðŸ—‘ï¸" label="à¸¥à¸š" danger onClick={() => { del(doc.id); closeAll(); }} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* â”€â”€ Mobile Cards â”€â”€ */}
          <div className="doc-cards" style={{ display: "none", flexDirection: "column" as const }}>
            {filtered.map(doc => {
              const { total, depositPaid, balanceDue } = calcDocTotal(doc, allDocuments);
              return (
                <div className="doc-mobile-card" key={doc.id} style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="doc-mobile-card-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: dt.color }}>{doc.docNo}</div>
                      <div style={{ fontSize: 13, color: "#e2e8f0", marginTop: 2 }}>{doc.customerName || "-"}</div>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>à¸„à¸£à¸šà¸à¸³à¸«à¸™à¸” {fmtDate(doc.dueDate)}</div>
                    </div>
                    <div style={{ textAlign: "right" as const }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>à¸¿{fmtMoney(total)}</div>
                      {depositPaid > 0 && balanceDue > 0 && <div style={{ marginTop: 3, color: "#F59E0B", fontSize: 11 }}>à¸„à¹‰à¸²à¸‡à¸Šà¸³à¸£à¸° à¸¿{fmtMoney(balanceDue)}</div>}
                      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{fmtDate(doc.date)}</div>
                    </div>
                  </div>
                  <div className="doc-mobile-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div className="doc-mobile-status" style={{ position: "relative", display: "inline-block" }} data-status-dropdown="">
                      <button type="button" onClick={() => { setOpenStatus(openStatus === doc.id ? null : doc.id); setOpenMenu(null); setMenuPos(null); }}
                        style={{ display: "flex", alignItems: "center", gap: 5, background: STATUS_COLORS[doc.status] + "22", color: STATUS_COLORS[doc.status], border: `1px solid ${STATUS_COLORS[doc.status]}55`, padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                        {STATUS_LABELS[doc.status]}
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor"><path d="M2 3.5l3 3 3-3"/></svg>
                      </button>
                      {openStatus === doc.id && (
                        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 999, background: "#1A2233", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 0", minWidth: 140, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <button type="button" key={k} onClick={() => { changeStatus(doc.id, k); setOpenStatus(null); }}
                              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 14px", background: doc.status === k ? STATUS_COLORS[k] + "22" : "transparent", color: doc.status === k ? STATUS_COLORS[k] : "#ccc", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit", textAlign: "left" as const }}>
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLORS[k], flexShrink: 0, display: "inline-block" }} />{v}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="doc-mobile-actions" style={{ display: "flex", gap: 6 }}>
                      {doc.status !== "approved" && doc.status !== "cancelled" && (
                        <button type="button" onClick={() => changeStatus(doc.id, "approved")}
                          style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#10B981", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>âœ… à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´</button>
                      )}
                      <button type="button" onClick={() => { if (doc.status === "approved") return showToast("à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¹à¸à¹‰à¹„à¸‚à¹€à¸­à¸à¸ªà¸²à¸£à¸—à¸µà¹ˆà¸­à¸™à¸¸à¸¡à¸±à¸•à¸´à¹à¸¥à¹‰à¸§", "error"); setEditing({ ...doc }); }}
                        style={{ background: doc.status === "approved" ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: doc.status === "approved" ? "#444" : "#ccc", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: doc.status === "approved" ? "not-allowed" : "pointer", fontFamily: "inherit" }}>à¹à¸à¹‰à¹„à¸‚</button>
                      <button type="button" onClick={() => printDocument(doc, customers, company, { allDocuments })}
                        style={{ background: "rgba(255,107,0,0.15)", border: "1px solid rgba(255,107,0,0.3)", color: "#FF6B00", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>ðŸ–¨ï¸</button>
                      <div style={{ position: "relative" }}>
                        <button type="button" onClick={(e) => {
                          if (openMenu === doc.id) { closeAll(); return; }
                          const isMobileMenu = window.matchMedia("(max-width: 768px)").matches;
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          const menuWidth = Math.min(260, window.innerWidth - 24);
                          const right = Math.max(12, Math.min(window.innerWidth - rect.right, window.innerWidth - menuWidth - 12));
                          const top = Math.max(12, Math.min(rect.bottom + 4, window.innerHeight - 360));
                          setMenuPos(isMobileMenu ? { top: 0, right: 0, mobile: true } : { top, right });
                          setOpenMenu(doc.id); setOpenStatus(null);
                        }}
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#ccc", borderRadius: 8, padding: "6px 10px", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>â‹®</button>
                        {openMenu === doc.id && menuPos && (
                          <div data-dropdown-menu="" style={{ position: "fixed", top: menuPos.mobile ? "auto" : menuPos.top, right: menuPos.mobile ? 12 : menuPos.right, bottom: menuPos.mobile ? "calc(76px + env(safe-area-inset-bottom, 0px))" : "auto", left: menuPos.mobile ? 12 : "auto", zIndex: 9999, background: "#1A2233", border: "1px solid rgba(255,255,255,0.1)", borderRadius: menuPos.mobile ? 16 : 10, padding: "6px 0", minWidth: menuPos.mobile ? 0 : 240, width: menuPos.mobile ? "auto" : undefined, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxHeight: menuPos.mobile ? "46dvh" : "60dvh", overflowY: "auto" }}>
                            <MenuBtn icon="ðŸ‘ï¸" label="à¸”à¸¹à¸•à¸±à¸§à¸­à¸¢à¹ˆà¸²à¸‡ PDF" onClick={() => { previewDocumentPdf(doc); closeAll(); }} />
                            <MenuBtn icon="ðŸ–¨ï¸" label="à¸žà¸´à¸¡à¸žà¹Œ" onClick={() => { printDocument(doc, customers, company, { allDocuments }); closeAll(); }} />
                            <MenuBtn icon="ðŸ”—" label="à¹à¸Šà¸£à¹Œ" onClick={() => { shareDocumentLink(doc); closeAll(); }} />
                            <MenuBtn icon="â¬‡ï¸" label="à¸”à¸²à¸§à¸™à¹Œà¹‚à¸«à¸¥à¸”" onClick={() => { printDocument(doc, customers, company, { allDocuments }); closeAll(); showToast("à¹€à¸›à¸´à¸”à¸«à¸™à¹‰à¸²à¸•à¹ˆà¸²à¸‡ â€” à¸à¸” Save as PDF"); }} />
                            <MenuBtn icon="âœ‰ï¸" label="à¸­à¸µà¹€à¸¡à¸¥" onClick={() => { const cust = customers.find(c => c.id === doc.customerId); setEmailModal({ doc, toEmail: cust?.email || "", subject: `à¹€à¸­à¸à¸ªà¸²à¸£ ${doc.docNo} - ${cust?.name || ""}`, body: `à¹€à¸£à¸µà¸¢à¸™à¸„à¸¸à¸“ ${cust?.contact || cust?.name || "à¸¥à¸¹à¸à¸„à¹‰à¸²"},\n\nà¸à¸£à¸¸à¸“à¸²à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¹€à¸­à¸à¸ªà¸²à¸£ ${doc.docNo} à¸—à¸µà¹ˆà¹à¸™à¸šà¸¡à¸²à¸”à¹‰à¸§à¸¢à¸™à¸µà¹‰\n\nà¸‚à¸­à¸šà¸„à¸¸à¸“à¸„à¸£à¸±à¸š` }); closeAll(); }} />
                            <MenuBtn icon="ðŸ“‹" label="à¸ªà¸£à¹‰à¸²à¸‡à¸‹à¹‰à¸³" onClick={() => { setEditing({ ...doc, id: "", docNo: nextDocNoForType(doc.type), date: today(), status: "draft" }); closeAll(); }} />
                            {(DOC_NEXT[doc.type] || []).length > 0 && <>
                              <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "6px 0" }} />
                              <div style={{ padding: "4px 14px", fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase" as const }}>à¸ªà¸£à¹‰à¸²à¸‡à¹€à¸­à¸à¸ªà¸²à¸£à¸•à¹ˆà¸­</div>
                              {(DOC_NEXT[doc.type] || []).map((next, ni) => (
                                <MenuBtn key={ni} icon={next.split ? "âœ‚ï¸" : "ðŸ“‘"} label={next.label} color={DOC_TYPES[next.type]?.color} onClick={() => { createFrom(doc, next.type, next.split); closeAll(); }} />
                              ))}
                            </>}
                            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "6px 0" }} />
                            <MenuBtn icon="ðŸ—‘ï¸" label="à¸¥à¸š" danger onClick={() => { del(doc.id); closeAll(); }} />
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
        <Modal title={`${editing.id ? "à¹à¸à¹‰à¹„à¸‚" : "à¸ªà¸£à¹‰à¸²à¸‡"}${dt.label}`} onClose={() => setEditing(null)} width={760}>
          <DocForm doc={editing} type={type} customers={customers} products={products} onSave={save} onCancel={() => setEditing(null)} allDocuments={allDocuments} />
        </Modal>
      )}

      {/* â”€â”€ Delete Confirmation Modal â”€â”€ */}
      {deleteConfirm && (
        <Modal title="à¸¢à¸·à¸™à¸¢à¸±à¸™à¸à¸²à¸£à¸¥à¸šà¹€à¸­à¸à¸ªà¸²à¸£" onClose={() => setDeleteConfirm(null)} width={420}>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 20 }}>
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "16px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>ðŸ—‘ï¸</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#ef4444", marginBottom: 6 }}>à¸„à¸¸à¸“à¹à¸™à¹ˆà¹ƒà¸ˆà¸«à¸£à¸·à¸­à¹„à¸¡à¹ˆ?</div>
                <div style={{ fontSize: 13, color: "#A8B0C0", lineHeight: 1.6 }}>
                  à¹€à¸­à¸à¸ªà¸²à¸£ <span style={{ fontFamily: "monospace", color: "#fff", fontWeight: 700 }}>{documents.find(d => d.id === deleteConfirm)?.docNo}</span> à¸ˆà¸°à¸–à¸¹à¸à¸¢à¸à¹€à¸¥à¸´à¸<br/>
                  à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸ˆà¸°à¸¢à¸±à¸‡à¸„à¸‡à¸­à¸¢à¸¹à¹ˆà¹ƒà¸™à¸£à¸°à¸šà¸šà¹à¸•à¹ˆà¹„à¸¡à¹ˆà¹à¸ªà¸”à¸‡à¸œà¸¥
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={confirmDelete} style={{ flex: 1, background: "#ef4444", border: "1px solid #ef4444", color: "#fff" }}>ðŸ—‘ï¸ à¸¢à¸·à¸™à¸¢à¸±à¸™à¸¥à¸š</Btn>
              <Btn onClick={() => setDeleteConfirm(null)} outline style={{ flex: 1 }}>à¸¢à¸à¹€à¸¥à¸´à¸</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* â”€â”€ Email Modal â”€â”€ */}
      {emailModal && (
        <Modal title="à¸ªà¹ˆà¸‡à¹€à¸­à¸à¸ªà¸²à¸£à¸—à¸²à¸‡à¸­à¸µà¹€à¸¡à¸¥" onClose={() => setEmailModal(null)} width={500}>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
            <Field label="ðŸ“§ à¸–à¸¶à¸‡ (To)">
              <input value={emailModal.toEmail} onChange={e => setEmailModal(p => ({ ...p, toEmail: e.target.value }))} placeholder="email@example.com" />
            </Field>
            <Field label="à¸«à¸±à¸§à¸‚à¹‰à¸­ (Subject)">
              <input value={emailModal.subject} onChange={e => setEmailModal(p => ({ ...p, subject: e.target.value }))} />
            </Field>
            <Field label="à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡ (Body)">
              <textarea value={emailModal.body} onChange={e => setEmailModal(p => ({ ...p, body: e.target.value }))} rows={5} style={{ resize: "vertical", fontFamily: "inherit" }} />
            </Field>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#888" }}>
              ðŸ“Ž à¹„à¸Ÿà¸¥à¹Œà¹à¸™à¸š: {emailModal.doc.docNo}.pdf (à¸ªà¸£à¹‰à¸²à¸‡à¸ˆà¸²à¸à¸£à¸°à¸šà¸š)
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={() => {
                if (!emailModal.toEmail) return showToast("à¸à¸£à¸¸à¸“à¸²à¹ƒà¸ªà¹ˆà¸­à¸µà¹€à¸¡à¸¥à¸œà¸¹à¹‰à¸£à¸±à¸š", "error");
                window.open(`mailto:${emailModal.toEmail}?subject=${encodeURIComponent(emailModal.subject)}&body=${encodeURIComponent(emailModal.body)}`);
                showToast("à¹€à¸›à¸´à¸”à¹‚à¸›à¸£à¹à¸à¸£à¸¡à¸­à¸µà¹€à¸¡à¸¥à¹à¸¥à¹‰à¸§");
                setEmailModal(null);
              }} color="#3B82F6" style={{ flex: 1 }}>âœ‰ï¸ à¸ªà¹ˆà¸‡à¸­à¸µà¹€à¸¡à¸¥</Btn>
              <Btn onClick={() => setEmailModal(null)} outline style={{ flex: 1 }}>à¸¢à¸à¹€à¸¥à¸´à¸</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* â”€â”€ Split Modal â”€â”€ */}
      {splitModal && (
        <SplitModal
          srcDoc={splitModal.srcDoc}
          newDoc={splitModal.newDoc}
          onConfirm={(finalDoc) => {
            setEditing(finalDoc);
            setSplitModal(null);
            showToast(`à¸ªà¸£à¹‰à¸²à¸‡${DOC_TYPES[finalDoc.type]?.label}à¹à¸šà¸šà¹à¸šà¹ˆà¸‡à¸ˆà¹ˆà¸²à¸¢à¸ˆà¸²à¸ ${splitModal.srcDoc.docNo}`);
          }}
          onClose={() => setSplitModal(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// SPLIT MODAL â€” à¹€à¸¥à¸·à¸­à¸à¸£à¸²à¸¢à¸à¸²à¸£/à¸¢à¸­à¸”à¹à¸šà¹ˆà¸‡à¸ˆà¹ˆà¸²à¸¢
// ============================================================
function SplitModal({ srcDoc, newDoc, onConfirm, onClose }: any) {
  const dt = DOC_TYPES[newDoc.type];
  // à¹€à¸£à¸´à¹ˆà¸¡à¸•à¹‰à¸™: à¹€à¸¥à¸·à¸­à¸à¸—à¸¸à¸à¸£à¸²à¸¢à¸à¸²à¸£ à¹€à¸•à¹‡à¸¡à¸ˆà¸³à¸™à¸§à¸™
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
    <Modal title={`à¸ªà¸£à¹‰à¸²à¸‡${dt?.label} (à¹à¸šà¹ˆà¸‡à¸ˆà¹ˆà¸²à¸¢)`} onClose={onClose} width={600}>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
        <div style={{ fontSize: 13, color: "#A8B0C0" }}>à¹€à¸¥à¸·à¸­à¸à¸£à¸²à¸¢à¸à¸²à¸£à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¸§à¸²à¸‡à¸šà¸´à¸¥/à¹à¸ˆà¹‰à¸‡à¸«à¸™à¸µà¹‰à¹ƒà¸™à¸£à¸­à¸šà¸™à¸µà¹‰</div>

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
                <div style={{ fontSize: 11, color: "#888" }}>à¸ˆà¸²à¸ {fmtMoney(item.qty)} {item.unit}</div>
                <input type="number" value={item.selectedQty} min={0} max={item.qty} step={0.01}
                  onClick={e => e.stopPropagation()}
                  onChange={e => { setQty(item.id, e.target.value); if (!item.selected) toggleItem(item.id); }}
                  style={{ width: 70, textAlign: "right", fontSize: 13, padding: "4px 8px" }} />
                <div style={{ fontSize: 11, color: "#888", width: 30 }}>{item.unit}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#FF6B00", width: 90, textAlign: "right" }}>à¸¿{fmtMoney(lineAmount({ ...item, qty: item.selectedQty }))}</div>
              </div>
            </div>
          ))}
        </div>

        <Field label="à¸«à¸¡à¸²à¸¢à¹€à¸«à¸•à¸¸à¸à¸²à¸£à¹à¸šà¹ˆà¸‡à¸ˆà¹ˆà¸²à¸¢">
          <input value={splitNote} onChange={e => setSplitNote(e.target.value)} placeholder="à¹€à¸Šà¹ˆà¸™ à¸‡à¸§à¸”à¸—à¸µà¹ˆ 1/2" />
        </Field>

        <div style={{ background: "#0B0F19", borderRadius: 8, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#A8B0C0" }}>à¸¢à¸­à¸”à¸£à¸§à¸¡à¸—à¸µà¹ˆà¹€à¸¥à¸·à¸­à¸ ({selectedItems.length} à¸£à¸²à¸¢à¸à¸²à¸£)</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: dt?.color }}>à¸¿{fmtMoney(subTotal)}</span>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={confirm} color={dt?.color} style={{ flex: 1 }} disabled={selectedItems.length === 0}>âœ… à¸ªà¸£à¹‰à¸²à¸‡à¹€à¸­à¸à¸ªà¸²à¸£</Btn>
          <Btn onClick={onClose} outline style={{ flex: 1 }}>à¸¢à¸à¹€à¸¥à¸´à¸</Btn>
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

  // â”€â”€ à¸¥à¸¹à¸à¸„à¹‰à¸² â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const setCust = (id) => {
    const c = customers.find(c => c.id === id);
    setF(prev => ({ ...prev, customerId: id, customerName: c?.name || "" }));
  };

  // â”€â”€ à¸£à¸²à¸¢à¸à¸²à¸£à¸ªà¸´à¸™à¸„à¹‰à¸² â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const addItem = () => setF(prev => ({ ...prev, items: [...prev.items, { id: genId(), name: "", subTitle: "", detail: "", unit: "à¸Šà¸´à¹‰à¸™", qty: 1, price: 0, costUnit: "piece", priceUnit: "piece", widthM: 1, heightM: 1, pieces: 1 }] }));
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
        unit: isSqm ? "à¸•à¸£.à¸¡." : p.unit,
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

  // â”€â”€ à¸„à¸³à¸™à¸§à¸“ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { subtotal, discountAmt: discAmt, afterDisc, vatAmt, total, whtAmt, netPay, depositPaid, balanceDue } = calcDocTotal(f, allDocuments);

  // â”€â”€ à¹€à¸­à¸à¸ªà¸²à¸£à¸­à¹‰à¸²à¸‡à¸­à¸´à¸‡ (Order linking) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const relatedOrders = (allDocuments || []).filter(d => d.id !== doc.id && d.customerId === f.customerId);

  // â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      {/* â”€â”€ SECTION 1: à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹€à¸­à¸à¸ªà¸²à¸£ â”€â”€ */}
      <div style={card}>
        {secHead("1", "à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹€à¸­à¸à¸ªà¸²à¸£")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <Field label="à¹€à¸¥à¸‚à¸—à¸µà¹ˆà¹€à¸­à¸à¸ªà¸²à¸£ *"><input value={f.docNo} onChange={set("docNo")} /></Field>
          <Field label="à¸§à¸±à¸™à¸—à¸µà¹ˆà¸­à¸­à¸à¹€à¸­à¸à¸ªà¸²à¸£"><input type="date" value={f.date} onChange={set("date")} /></Field>
          <Field label={DOC_TYPES[type]?.prefix === "QT" ? "à¸¢à¸·à¸™à¸¢à¸±à¸™à¸£à¸²à¸„à¸²à¸–à¸¶à¸‡à¸§à¸±à¸™à¸—à¸µà¹ˆ" : "à¸§à¸±à¸™à¸„à¸£à¸šà¸à¸³à¸«à¸™à¸”"}><input type="date" value={f.dueDate} onChange={set("dueDate")} /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="à¸žà¸™à¸±à¸à¸‡à¸²à¸™à¸‚à¸²à¸¢"><input value={f.salesPerson || ""} onChange={set("salesPerson")} placeholder="à¸Šà¸·à¹ˆà¸­à¸žà¸™à¸±à¸à¸‡à¸²à¸™" /></Field>
          <Field label="à¹‚à¸„à¸£à¸‡à¸à¸²à¸£ / à¸Šà¸·à¹ˆà¸­à¸‡à¸²à¸™"><input value={f.projectName || ""} onChange={set("projectName")} placeholder="à¸£à¸°à¸šà¸¸à¸Šà¸·à¹ˆà¸­à¹‚à¸„à¸£à¸‡à¸à¸²à¸£" /></Field>
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
            <input value={f.marketingCampaign || ""} onChange={set("marketingCampaign")} placeholder="à¹€à¸Šà¹ˆà¸™ EN_MSN_Vinyl" />
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
        <Field label="ðŸ”— à¸­à¹‰à¸²à¸‡à¸­à¸´à¸‡à¹€à¸­à¸à¸ªà¸²à¸£ (Order à¹€à¸”à¸µà¸¢à¸§à¸à¸±à¸™)">
          <select value={f.orderId || ""} onChange={set("orderId")}>
            <option value="">-- à¹„à¸¡à¹ˆà¸­à¹‰à¸²à¸‡à¸­à¸´à¸‡ --</option>
            {relatedOrders.map(d => (
              <option key={d.id} value={d.id}>
                {d.docNo} Â· {DOC_TYPES[d.type]?.label} Â· {d.customerName} ({STATUS_LABELS[d.status]})
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
              <div style={{ color: "#FF6B00", fontWeight: 700, fontSize: 11, marginBottom: 4 }}>ðŸ“‹ à¹€à¸­à¸à¸ªà¸²à¸£à¹ƒà¸™à¸Šà¸¸à¸”à¹€à¸”à¸µà¸¢à¸§à¸à¸±à¸™</div>
              {linkedDocs.map(d => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", color: d.id === f.orderId ? "#fff" : "#A8B0C0" }}>
                  <span>{DOC_TYPES[d.type]?.label} â€” <span style={{ fontFamily: "monospace", color: DOC_TYPES[d.type]?.color }}>{d.docNo}</span></span>
                  <span style={{ background: STATUS_COLORS[d.status] + "22", color: STATUS_COLORS[d.status], padding: "1px 8px", borderRadius: 99, fontSize: 10 }}>{STATUS_LABELS[d.status]}</span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* â”€â”€ SECTION 2: à¸¥à¸¹à¸à¸„à¹‰à¸² â”€â”€ */}
      <div style={card}>
        {secHead("2", "à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸¥à¸¹à¸à¸„à¹‰à¸²", "#3B82F6")}
        <Field label="à¸¥à¸¹à¸à¸„à¹‰à¸² *">
          <select value={f.customerId} onChange={e => setCust(e.target.value)}>
            <option value="">-- à¹€à¸¥à¸·à¸­à¸à¸¥à¸¹à¸à¸„à¹‰à¸² --</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        {f.customerId && (() => {
          const c = customers.find(c => c.id === f.customerId);
          if (!c) return null;
          return (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
              <div style={{ background: "#0B0F19", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#A8B0C0", display: "flex", flexDirection: "column" as const, gap: 4 }}>
                {c.phone && <div>ðŸ“ž {c.phone}</div>}
                {c.taxId && <div>ðŸªª à¹€à¸¥à¸‚à¸œà¸¹à¹‰à¹€à¸ªà¸µà¸¢à¸ à¸²à¸©à¸µ: {c.taxId}</div>}
              </div>
              <Field label="ðŸ“ à¸—à¸µà¹ˆà¸­à¸¢à¸¹à¹ˆà¹ƒà¸™à¹€à¸­à¸à¸ªà¸²à¸£ (à¹à¸à¹‰à¹„à¸‚à¹„à¸”à¹‰à¹€à¸‰à¸žà¸²à¸°à¹€à¸­à¸à¸ªà¸²à¸£à¸™à¸µà¹‰)">
                <textarea
                  value={f.overrideAddress !== undefined && f.overrideAddress !== "" ? f.overrideAddress : (c.address || "")}
                  onChange={e => setF(prev => ({ ...prev, overrideAddress: e.target.value }))}
                  rows={3}
                  placeholder={c.address || "à¸£à¸°à¸šà¸¸à¸—à¸µà¹ˆà¸­à¸¢à¸¹à¹ˆ..."}
                  style={{ resize: "vertical", fontFamily: "inherit", fontSize: 12 }}
                />
                {f.overrideAddress && f.overrideAddress !== c.address && (
                  <button type="button" onClick={() => setF(prev => ({ ...prev, overrideAddress: "" }))}
                    style={{ marginTop: 4, background: "transparent", border: "none", color: "#6B7280", fontSize: 11, cursor: "pointer", padding: 0, fontFamily: "inherit", textAlign: "left" as const }}>
                    â†© à¸„à¸·à¸™à¸„à¹ˆà¸²à¸—à¸µà¹ˆà¸­à¸¢à¸¹à¹ˆà¹€à¸”à¸´à¸¡à¸‚à¸­à¸‡à¸¥à¸¹à¸à¸„à¹‰à¸²
                  </button>
                )}
              </Field>
            </div>
          );
        })()}
      </div>

      {/* â”€â”€ SECTION 3: à¸£à¸²à¸¢à¸à¸²à¸£à¸ªà¸´à¸™à¸„à¹‰à¸² â”€â”€ */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {secHead("3", "à¸£à¸²à¸¢à¸à¸²à¸£à¸ªà¸´à¸™à¸„à¹‰à¸²à¹à¸¥à¸°à¸šà¸£à¸´à¸à¸²à¸£", "#10B981")}
          <Btn onClick={addItem} color={dt.color} small>+ à¹€à¸žà¸´à¹ˆà¸¡à¸£à¸²à¸¢à¸à¸²à¸£</Btn>
        </div>

        {f.items.length === 0 && (
          <div style={{ padding: "20px", textAlign: "center", color: "#555", fontSize: 13 }}>à¸à¸” "+ à¹€à¸žà¸´à¹ˆà¸¡à¸£à¸²à¸¢à¸à¸²à¸£" à¹€à¸žà¸·à¹ˆà¸­à¹€à¸žà¸´à¹ˆà¸¡à¸ªà¸´à¸™à¸„à¹‰à¸²</div>
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
              <span style={{ fontSize: 12, fontWeight: 700, color: dt.color }}>à¸£à¸²à¸¢à¸à¸²à¸£ #{String(idx + 1).padStart(2, "0")}</span>
              <IconBtn onClick={() => removeItem(item.id)} danger small>ðŸ—‘ à¸¥à¸šà¸­à¸­à¸</IconBtn>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="à¸£à¸²à¸¢à¸à¸²à¸£à¸«à¸¥à¸±à¸ (EN)">
                <div style={{ display: "flex", gap: 6 }}>
                  <select onChange={e => pickProduct(item.id, e.target.value)} style={{ width: 100, fontSize: 11, padding: "4px 6px" }} defaultValue="">
                    <option value="">à¹€à¸¥à¸·à¸­à¸</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.supplierName ? `${p.name} â€” ${p.supplierName}` : p.name}</option>)}
                  </select>
                  <input value={item.name} onChange={e => setItem(item.id, "name", e.target.value)} placeholder="à¸Šà¸·à¹ˆà¸­à¸£à¸²à¸¢à¸à¸²à¸£" style={{ flex: 1 }} />
                </div>
              </Field>
              <Field label="à¸£à¸²à¸¢à¸à¸²à¸£à¸£à¸­à¸‡ (TH)">
                <input value={item.subTitle || ""} onChange={e => setItem(item.id, "subTitle", e.target.value)} placeholder="à¸Šà¸·à¹ˆà¸­à¸ à¸²à¸©à¸²à¹„à¸—à¸¢" />
              </Field>
            </div>
            <Field label="à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¸—à¸²à¸‡à¹€à¸—à¸„à¸™à¸´à¸„ (à¸žà¸´à¸¡à¸žà¹Œà¸šà¸£à¸£à¸—à¸±à¸”à¸¥à¸°à¸«à¸±à¸§à¸‚à¹‰à¸­)">
              <textarea value={item.detail || ""} onChange={e => setItem(item.id, "detail", e.target.value)} rows={3} style={{ resize: "vertical", fontFamily: "inherit" }} placeholder={"à¸‚à¸™à¸²à¸” 120 x 300 cm.\nà¹‚à¸„à¸£à¸‡à¸ªà¸£à¹‰à¸²à¸‡à¸­à¸¥à¸¹à¸¡à¸´à¹€à¸™à¸µà¸¢à¸¡\nà¸•à¸´à¸”à¸•à¸±à¹‰à¸‡à¸«à¸™à¹‰à¸²à¸‡à¸²à¸™"} />
            </Field>
            {isSqm && (
              <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)", borderRadius: 10, padding: 12 }}>
                <div style={{ color: "#10B981", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>à¸„à¸³à¸™à¸§à¸“à¸žà¸·à¹‰à¸™à¸—à¸µà¹ˆà¸‡à¸²à¸™à¸žà¸´à¸¡à¸žà¹Œ</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.2fr", gap: 10 }}>
                  <Field label="à¸à¸§à¹‰à¸²à¸‡ (à¹€à¸¡à¸•à¸£)"><input type="number" value={item.widthM ?? 1} onChange={e => setItemDimension(item.id, "widthM", e.target.value)} min="0" step="0.01" style={{ textAlign: "center" }} /></Field>
                  <Field label="à¸ªà¸¹à¸‡ (à¹€à¸¡à¸•à¸£)"><input type="number" value={item.heightM ?? 1} onChange={e => setItemDimension(item.id, "heightM", e.target.value)} min="0" step="0.01" style={{ textAlign: "center" }} /></Field>
                  <Field label="à¸ˆà¸³à¸™à¸§à¸™à¸Šà¸´à¹‰à¸™"><input type="number" value={item.pieces ?? 1} onChange={e => setItemDimension(item.id, "pieces", e.target.value)} min="0" step="1" style={{ textAlign: "center" }} /></Field>
                  <Field label="à¸žà¸·à¹‰à¸™à¸—à¸µà¹ˆà¸£à¸§à¸¡ (à¸•à¸£.à¸¡.)"><input type="number" value={item.qty} onChange={e => setItem(item.id, "qty", e.target.value)} min="0" step="0.01" style={{ textAlign: "center", color: "#10B981", fontWeight: 700 }} /></Field>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "#A8B0C0" }}>
                  {fmtMoney(widthM)} x {fmtMoney(heightM)} x {fmtMoney(pieces)} = <strong style={{ color: "#10B981" }}>{fmtMoney(area)} à¸•à¸£.à¸¡.</strong>
                </div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <Field label={isSqm ? "à¸ˆà¸³à¸™à¸§à¸™à¸—à¸µà¹ˆà¸„à¸´à¸”à¹€à¸‡à¸´à¸™" : "à¸ˆà¸³à¸™à¸§à¸™"}><input type="number" value={item.qty} onChange={e => setItem(item.id, "qty", e.target.value)} min="0" step="0.01" style={{ textAlign: "center" }} /></Field>
              <Field label="à¸«à¸™à¹ˆà¸§à¸¢"><input value={item.unit} onChange={e => setItem(item.id, "unit", e.target.value)} style={{ textAlign: "center" }} /></Field>
              <Field label={`à¸•à¹‰à¸™à¸—à¸¸à¸™ (${priceBasisLabel(item.costUnit)})`}>
                <div style={{ position: "relative" }}>
                  <input type="number" value={item.costSnapshot || 0} onChange={e => setItem(item.id, "costSnapshot", e.target.value)} min="0" step="0.01" style={{ textAlign: "right", paddingRight: 36, color: "#ef4444", fontWeight: 700 }} />
                  <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#555" }}>THB</span>
                </div>
              </Field>
              <Field label={`à¸£à¸²à¸„à¸²à¸‚à¸²à¸¢ (${priceBasisLabel(item.priceUnit)})`}>
                <div style={{ position: "relative" }}>
                  <input type="number" value={item.price} onChange={e => setItem(item.id, "price", e.target.value)} min="0" step="0.01" style={{ textAlign: "right", paddingRight: 36 }} />
                  <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#555" }}>THB</span>
                </div>
              </Field>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 14, fontSize: 12, fontWeight: 600, color: "#8B95A7", flexWrap: "wrap" }}>
              <span>à¸ˆà¸³à¸™à¸§à¸™à¸„à¸´à¸”à¸•à¹‰à¸™à¸—à¸¸à¸™: {fmtMoney(costCalcQty)} {isSqmBasis(item.costUnit) ? "à¸•à¸£.à¸¡." : "à¸Šà¸´à¹‰à¸™"}</span>
              <span>à¸ˆà¸³à¸™à¸§à¸™à¸„à¸´à¸”à¸‚à¸²à¸¢: {fmtMoney(priceCalcQty)} {isSqmBasis(item.priceUnit) ? "à¸•à¸£.à¸¡." : "à¸Šà¸´à¹‰à¸™"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 14, fontSize: 13, fontWeight: 700 }}>
              {(item.supplierName || findProductForItem(products, item)?.supplierName) && (
                <span style={{ color: "#F97316" }}>Supplier: {item.supplierName || findProductForItem(products, item)?.supplierName}</span>
              )}
              <span style={{ color: "#ef4444" }}>à¸•à¹‰à¸™à¸—à¸¸à¸™: à¸¿{fmtMoney(lineCost(item))}</span>
              <span style={{ color: dt.color }}>à¸£à¸§à¸¡: à¸¿{fmtMoney(lineAmount(item))}</span>
            </div>
                </>
              );
            })()}
          </div>
        ))}

        {/* à¸ªà¹ˆà¸§à¸™à¸¥à¸” */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12 }}>
          <Field label="à¸›à¸£à¸°à¹€à¸ à¸—à¸ªà¹ˆà¸§à¸™à¸¥à¸”">
            <select value={f.discountType || "percent"} onChange={(e) => setF(prev => ({ ...prev, discountType: e.target.value, discount: 0 }))} style={{ borderColor: "#FF6B0044", color: "#FF6B00", fontWeight: 700 }}>
              <option value="percent">à¸¥à¸”à¹€à¸›à¹‡à¸™ %</option>
              <option value="amount">à¸¥à¸”à¹€à¸›à¹‡à¸™à¸ˆà¸³à¸™à¸§à¸™à¹€à¸‡à¸´à¸™</option>
            </select>
          </Field>
          <Field label="à¸ˆà¸³à¸™à¸§à¸™à¸ªà¹ˆà¸§à¸™à¸¥à¸” (%)">
            <input type="number" value={f.discount} onChange={setN("discount")} min="0" max={(f.discountType || "percent") === "amount" ? undefined : "100"} step="0.01" placeholder={(f.discountType || "percent") === "amount" ? "à¹€à¸Šà¹ˆà¸™ 500" : "à¹€à¸Šà¹ˆà¸™ 10"} style={{ borderColor: "#FF6B0044", color: "#FF6B00", fontWeight: 700 }} />
          </Field>
        </div>
      </div>

      {/* â”€â”€ SECTION 4: à¸Šà¸³à¸£à¸°à¹€à¸‡à¸´à¸™ & à¸«à¸¡à¸²à¸¢à¹€à¸«à¸•à¸¸ â”€â”€ */}
      <div style={card}>
        {secHead("4", "à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸Šà¸³à¸£à¸°à¹€à¸‡à¸´à¸™ & à¸«à¸¡à¸²à¸¢à¹€à¸«à¸•à¸¸", "#8B5CF6")}

        {/* à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸šà¸±à¸à¸Šà¸µ */}
        <Field label="à¸Šà¸·à¹ˆà¸­à¸šà¸±à¸à¸Šà¸µà¸£à¸±à¸šà¹€à¸‡à¸´à¸™">
          <input value={f.bankName ?? ""} onChange={set("bankName")} placeholder="à¸Šà¸·à¹ˆà¸­à¸šà¸±à¸à¸Šà¸µà¸˜à¸™à¸²à¸„à¸²à¸£" />
        </Field>
        <Field label="à¸˜à¸™à¸²à¸„à¸²à¸£ & à¸ªà¸²à¸‚à¸²">
          <input value={f.bankBranch ?? ""} onChange={set("bankBranch")} placeholder="à¹€à¸Šà¹ˆà¸™ à¸˜à¸™à¸²à¸„à¸²à¸£à¸à¸ªà¸´à¸à¸£à¹„à¸—à¸¢ à¸ªà¸²à¸‚à¸²à¸šà¸²à¸‡à¸šà¸±à¸§à¸—à¸­à¸‡" />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="à¹€à¸¥à¸‚à¸—à¸µà¹ˆà¸šà¸±à¸à¸Šà¸µ">
            <input value={f.bankAccount ?? ""} onChange={set("bankAccount")} placeholder="xxx-x-xxxxx-x" />
          </Field>
          <Field label="à¸›à¸£à¸°à¹€à¸ à¸—à¸šà¸±à¸à¸Šà¸µ">
            <input value={f.bankType ?? ""} onChange={set("bankType")} placeholder="à¸­à¸­à¸¡à¸—à¸£à¸±à¸žà¸¢à¹Œ" />
          </Field>
        </div>

        {/* QR Code à¸­à¸±à¸›à¹‚à¸«à¸¥à¸” */}
        <div>
          <label style={{ fontSize: 12, color: "#A8B0C0", fontWeight: 600, display: "block", marginBottom: 8 }}>
            à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¸£à¸¹à¸›à¸ à¸²à¸ž QR CODE à¸Šà¸³à¸£à¸°à¹€à¸‡à¸´à¸™
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Preview */}
            <div style={{ width: 72, height: 72, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, background: "#0B0F19", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
              {f.qrImage
                ? <img src={f.qrImage} alt="QR" style={{ width: 64, height: 64, objectFit: "contain" }} />
                : <span style={{ fontSize: 28 }}>ðŸ“·</span>
              }
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, flex: 1 }}>
              <label style={{ cursor: "pointer", background: "rgba(255,107,0,0.1)", border: "1px solid rgba(255,107,0,0.3)", color: "#FF6B00", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, textAlign: "center" as const, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <span>ðŸ“</span> à¹€à¸¥à¸·à¸­à¸à¹„à¸Ÿà¸¥à¹Œà¸£à¸¹à¸›à¸ à¸²à¸ž QR Code
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => setF(prev => ({ ...prev, qrImage: ev.target?.result as string }));
                  reader.readAsDataURL(file);
                }} />
              </label>
              {f.qrImage && (
                <button type="button" onClick={() => setF(prev => ({ ...prev, qrImage: "" }))}
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  ðŸ—‘ à¸¥à¸šà¸£à¸¹à¸› QR Code
                </button>
              )}
            </div>
          </div>
        </div>

        {/* VAT / WHT */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14, display: "flex", gap: 16, flexWrap: "wrap" as const }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: "#ccc" }}>
            <input type="checkbox" checked={f.vat} onChange={setBool("vat")} style={{ width: "auto" }} />à¸„à¸´à¸” VAT
          </label>
          {f.vat && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="number" value={f.vatRate ?? 7} onChange={setN("vatRate")} min="0" max="100" step="0.01" style={{ width: 80 }} />
              <span style={{ fontSize: 13, color: "#ccc" }}>%</span>
            </div>
          )}
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: "#ccc" }}>
            <input type="checkbox" checked={f.wht} onChange={setBool("wht")} style={{ width: "auto" }} />à¸«à¸±à¸ à¸“ à¸—à¸µà¹ˆà¸ˆà¹ˆà¸²à¸¢
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
            <Field label="à¸›à¸£à¸°à¹€à¸ à¸—à¸à¸²à¸£à¸£à¸±à¸šà¸Šà¸³à¸£à¸°">
              <select value={f.paymentType || "deposit"} onChange={set("paymentType")}>
                <option value="deposit">à¸£à¸±à¸šà¸¡à¸±à¸”à¸ˆà¸³ / à¹€à¸‡à¸´à¸™à¸à¹‰à¸­à¸™à¹à¸£à¸</option>
                <option value="partial">à¸£à¸±à¸šà¸Šà¸³à¸£à¸°à¸šà¸²à¸‡à¸ªà¹ˆà¸§à¸™</option>
                <option value="final">à¸£à¸±à¸šà¸Šà¸³à¸£à¸°à¸›à¸´à¸”à¸¢à¸­à¸”</option>
                <option value="full">à¸£à¸±à¸šà¸Šà¸³à¸£à¸°à¹€à¸•à¹‡à¸¡à¸ˆà¸³à¸™à¸§à¸™</option>
              </select>
            </Field>
            <Field label="à¸¢à¸­à¸”à¸—à¸µà¹ˆà¸£à¸±à¸šà¸Šà¸³à¸£à¸°à¹ƒà¸™à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆà¸™à¸µà¹‰">
              <input type="number" value={f.paymentAmount || ""} onChange={(e) => {
                const value = Math.max(0, Number(e.target.value || 0) || 0);
                setF(prev => ({ ...prev, paymentAmount: value, depositPaid: value }));
              }} min="0" step="0.01" placeholder="0.00" />
            </Field>
            <Field label="à¸§à¸±à¸™à¸—à¸µà¹ˆà¸£à¸±à¸šà¸Šà¸³à¸£à¸°">
              <input type="date" value={f.paymentDate || f.depositDate || ""} onChange={(e) => {
                setF(prev => ({ ...prev, paymentDate: e.target.value, depositDate: e.target.value }));
              }} />
            </Field>
            <Field label="à¸«à¸¡à¸²à¸¢à¹€à¸«à¸•à¸¸à¸à¸²à¸£à¸£à¸±à¸šà¸Šà¸³à¸£à¸°">
              <input value={f.paymentNote || ""} onChange={(e) => {
                setF(prev => ({ ...prev, paymentNote: e.target.value, depositNote: e.target.value }));
              }} placeholder="à¹€à¸Šà¹ˆà¸™ à¸£à¸±à¸šà¸¡à¸±à¸”à¸ˆà¸³ 50% / à¸£à¸±à¸šà¸Šà¸³à¸£à¸°à¸‡à¸§à¸”à¸—à¸µà¹ˆ 1" />
            </Field>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={() => setF(prev => ({ ...prev, paymentType: "deposit", paymentAmount: Number((netPay * 0.5).toFixed(2)), depositPaid: Number((netPay * 0.5).toFixed(2)), paymentDate: prev.paymentDate || today(), depositDate: prev.depositDate || today(), paymentNote: prev.paymentNote || "à¸£à¸±à¸šà¸¡à¸±à¸”à¸ˆà¸³ 50%", depositNote: prev.depositNote || "à¸£à¸±à¸šà¸¡à¸±à¸”à¸ˆà¸³ 50%" }))}
                style={{ background: "rgba(16,185,129,0.12)", color: "#10B981", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, padding: "8px 12px", fontFamily: "inherit", fontWeight: 700, cursor: "pointer" }}>
                à¸•à¸±à¹‰à¸‡à¸¡à¸±à¸”à¸ˆà¸³ 50%
              </button>
              <button type="button" onClick={() => setF(prev => ({ ...prev, paymentType: "full", paymentAmount: Number(netPay.toFixed(2)), depositPaid: Number(netPay.toFixed(2)), paymentDate: prev.paymentDate || today(), depositDate: prev.depositDate || today(), paymentNote: prev.paymentNote || "à¸£à¸±à¸šà¸Šà¸³à¸£à¸°à¹€à¸•à¹‡à¸¡à¸ˆà¸³à¸™à¸§à¸™", depositNote: prev.depositNote || "à¸£à¸±à¸šà¸Šà¸³à¸£à¸°à¹€à¸•à¹‡à¸¡à¸ˆà¸³à¸™à¸§à¸™" }))}
                style={{ background: "rgba(255,107,0,0.12)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.25)", borderRadius: 8, padding: "8px 12px", fontFamily: "inherit", fontWeight: 700, cursor: "pointer" }}>
                à¸•à¸±à¹‰à¸‡à¸Šà¸³à¸£à¸°à¹€à¸•à¹‡à¸¡à¸ˆà¸³à¸™à¸§à¸™
              </button>
              <div style={{ color: "#A8B0C0", fontSize: 12, lineHeight: 1.6, alignSelf: "center" }}>
                à¹ƒà¸Šà¹‰à¸ªà¸³à¸«à¸£à¸±à¸š ERP à¹à¸¥à¸°à¸¢à¸­à¸”à¸„à¹‰à¸²à¸‡à¸Šà¸³à¸£à¸° à¹„à¸¡à¹ˆà¹à¸ªà¸”à¸‡à¸Šà¸·à¹ˆà¸­ source à¸«à¸£à¸·à¸­à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸ à¸²à¸¢à¹ƒà¸™à¸šà¸™ PDF
              </div>
            </div>
          </div>
        )}

        {/* à¹€à¸‡à¸´à¸™à¸¡à¸±à¸”à¸ˆà¸³ */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="à¹€à¸‡à¸´à¸™à¸¡à¸±à¸”à¸ˆà¸³à¸—à¸µà¹ˆà¸¥à¸¹à¸à¸„à¹‰à¸²à¸Šà¸³à¸£à¸°à¹à¸¥à¹‰à¸§">
            <input type="number" value={f.depositPaid || 0} onChange={setN("depositPaid")} min="0" step="0.01" placeholder="0.00" />
          </Field>
          <Field label="à¸§à¸±à¸™à¸—à¸µà¹ˆà¸£à¸±à¸šà¸¡à¸±à¸”à¸ˆà¸³">
            <input type="date" value={f.depositDate || ""} onChange={set("depositDate")} />
          </Field>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="à¸«à¸¡à¸²à¸¢à¹€à¸«à¸•à¸¸à¸¡à¸±à¸”à¸ˆà¸³">
              <input value={f.depositNote || ""} onChange={set("depositNote")} placeholder="à¹€à¸Šà¹ˆà¸™ à¸£à¸±à¸šà¸¡à¸±à¸”à¸ˆà¸³ 50% à¸à¹ˆà¸­à¸™à¹€à¸£à¸´à¹ˆà¸¡à¸œà¸¥à¸´à¸• / à¹‚à¸­à¸™à¸œà¹ˆà¸²à¸™à¸˜à¸™à¸²à¸„à¸²à¸£" />
            </Field>
          </div>
        </div>

        {/* à¸«à¸¡à¸²à¸¢à¹€à¸«à¸•à¸¸ */}
        <Field label="à¸«à¸¡à¸²à¸¢à¹€à¸«à¸•à¸¸ / à¹€à¸‡à¸·à¹ˆà¸­à¸™à¹„à¸‚ (à¹ƒà¸ªà¹ˆà¸‚à¹‰à¸­à¸¥à¸° 1 à¸šà¸£à¸£à¸—à¸±à¸”)">
          <textarea value={f.notes} onChange={set("notes")} rows={4} style={{ resize: "vertical", fontFamily: "inherit" }}
            placeholder={"à¸£à¸²à¸„à¸²à¸™à¸µà¹‰à¸£à¸§à¸¡à¸ à¸²à¸©à¸µà¸¡à¸¹à¸¥à¸„à¹ˆà¸²à¹€à¸žà¸´à¹ˆà¸¡ 7% à¹à¸¥à¹‰à¸§\nà¸£à¸°à¸¢à¸°à¹€à¸§à¸¥à¸²à¸”à¸³à¹€à¸™à¸´à¸™à¸‡à¸²à¸™ 7-14 à¸§à¸±à¸™à¸—à¸³à¸à¸²à¸£\nà¸¡à¸±à¸”à¸ˆà¸³ 50% à¸à¹ˆà¸­à¸™à¹€à¸£à¸´à¹ˆà¸¡à¸‡à¸²à¸™"} />
        </Field>
      </div>

      {/* â”€â”€ Summary â”€â”€ */}
      <div style={{ background: "#1A2233", borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column" as const, gap: 8 }}>
        <SumRow label="à¸¡à¸¹à¸¥à¸„à¹ˆà¸²à¸£à¸§à¸¡ (Subtotal)" value={subtotal} />
        {f.discount > 0 && <SumRow label={(f.discountType || "percent") === "amount" ? "à¸ªà¹ˆà¸§à¸™à¸¥à¸”" : `à¸ªà¹ˆà¸§à¸™à¸¥à¸” ${f.discount}%`} value={-discAmt} />}
        {f.discount > 0 && <SumRow label="à¸«à¸¥à¸±à¸‡à¸«à¸±à¸à¸ªà¹ˆà¸§à¸™à¸¥à¸”" value={afterDisc} />}
        {f.vat && <SumRow label={`VAT ${fmtMoney(docVatRate(f))}%`} value={vatAmt} />}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 4, paddingTop: 8 }}>
          <SumRow label="à¸¢à¸­à¸”à¸£à¸§à¸¡à¸ªà¸¸à¸—à¸˜à¸´" value={total} bold color={dt.color} big />
        </div>
        {f.wht && <SumRow label={`à¸«à¸±à¸ à¸“ à¸—à¸µà¹ˆà¸ˆà¹ˆà¸²à¸¢ ${f.whtRate}%`} value={-whtAmt} />}
        {f.wht && <SumRow label="à¸¢à¸­à¸”à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸Šà¸³à¸£à¸°" value={netPay} bold color="#10b981" />}
        {depositPaid > 0 && <SumRow label="à¸¡à¸±à¸”à¸ˆà¸³à¸—à¸µà¹ˆà¸Šà¸³à¸£à¸°à¹à¸¥à¹‰à¸§" value={-depositPaid} bold color="#10b981" />}
        {depositPaid > 0 && <SumRow label="à¸¢à¸­à¸”à¸„à¸‡à¹€à¸«à¸¥à¸·à¸­à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸Šà¸³à¸£à¸°" value={balanceDue} bold color="#FF6B00" big />}
      </div>

      {/* â”€â”€ Actions â”€â”€ */}
      <div style={{ display: "flex", gap: 10 }}>
        <Btn onClick={() => onSave(f)} color={dt.color} style={{ flex: 1 }}>ðŸ’¾ à¸šà¸±à¸™à¸—à¸¶à¸à¹€à¸­à¸à¸ªà¸²à¸£</Btn>
        <Btn onClick={onCancel} outline style={{ flex: 1 }}>à¸¢à¸à¹€à¸¥à¸´à¸</Btn>
      </div>
    </div>
  );
}

function MenuBtn({ icon, label, onClick, danger = false, color = "", type = "button", ...rest }: any) {
  return (
    <button type={type} onClick={onClick} {...rest}
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
        {value < 0 ? "-" : ""}à¸¿{fmtMoney(Math.abs(value))}
      </span>
    </div>
  );
}

function Field({ label, children }: any) { return <div><label>{label}</label>{children}</div>; }

function Btn({ onClick, children, color, outline, small, style, type = "button", ...rest }: any) {
  const buttonColor = color === "#FF6B00" || color === "#FF7A00" || !color ? "#C2410C" : color;
  return (
    <button type={type} onClick={onClick} {...rest} style={{
      background: outline ? "transparent" : buttonColor,
      border: `1px solid ${outline ? "rgba(255,255,255,0.15)" : buttonColor}`,
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

function IconBtn({ onClick, children, danger, small, type = "button", ...rest }: any) {
  return (
    <button type={type} onClick={onClick} {...rest} style={{
      background: danger ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)",
      border: `1px solid ${danger ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
      color: danger ? "#ef4444" : "#A8B0C0",
      padding: small ? "6px 10px" : "8px 12px", borderRadius: 8,
      cursor: "pointer", fontSize: small ? 12 : 14, lineHeight: 1, fontFamily: "inherit",
      minHeight: 44, minWidth: 44, display: "inline-flex", alignItems: "center", justifyContent: "center",
    }}>
      {children}
    </button>
  );
}

function Modal({ title, onClose, children, width = 500 }: any) {
  return (
    <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="modal-panel" style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, width: "100%", maxWidth: width, maxHeight: "88dvh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 90px rgba(0,0,0,0.6)", animation: "scaleIn 0.2s ease", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div style={{ width: 40, height: 4, background: "rgba(255,255,255,0.18)", borderRadius: 99, margin: "12px auto 4px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
          <button type="button" aria-label="Close dialog" onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#aaa", fontSize: 18, cursor: "pointer", width: 34, height: 34, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center" }}>âœ•</button>
        </div>
        <div style={{ overflowY: "auto", padding: "18px 20px", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}




// â”€â”€â”€ LOGOUT BUTTON â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function LogoutButton() {
  const router = useRouter();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };
  return (
    <button
      type="button" className="admin-logout-btn"
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
      <span>ðŸšª</span> <span className="admin-logout-text">à¸­à¸­à¸à¸ˆà¸²à¸à¸£à¸°à¸šà¸š</span>
    </button>
  );
}

// â”€â”€â”€ RICH TEXT EDITOR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function RichEditor({ value, onChange, showToast }: { value: string; onChange: (v: string) => void; showToast: any }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // sync à¸„à¹ˆà¸²à¹€à¸‚à¹‰à¸² editor à¹€à¸¡à¸·à¹ˆà¸­à¹€à¸›à¸´à¸”à¸„à¸£à¸±à¹‰à¸‡à¹à¸£à¸
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
      if (uploadError) { showToast("à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¹„à¸¡à¹ˆà¹„à¸”à¹‰: " + uploadError.message, "error"); return; }
      const { data: urlData } = supabase.storage.from("cms-media").getPublicUrl(path);
      const url = urlData?.publicUrl;
      if (!url) { showToast("URL à¹„à¸¡à¹ˆà¸–à¸¹à¸à¸•à¹‰à¸­à¸‡", "error"); return; }
      editorRef.current?.focus();
      document.execCommand("insertHTML", false,
        `<figure style="margin:24px 0;text-align:center"><img src="${url}" alt="ภาพประกอบบทความ Display Works Media" style="max-width:100%;height:auto;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.15)" /><figcaption style="font-size:13px;color:#888;margin-top:8px">à¸„à¸³à¸šà¸£à¸£à¸¢à¸²à¸¢à¸£à¸¹à¸›à¸ à¸²à¸ž (à¹à¸à¹‰à¹„à¸”à¹‰)</figcaption></figure>`
      );
      sync();
      showToast("à¹à¸—à¸£à¸à¸£à¸¹à¸›à¸ªà¸³à¹€à¸£à¹‡à¸ˆ âœ“");
    } catch (err: any) {
      showToast("à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”: " + err?.message, "error");
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
      {/* â”€â”€â”€ TOOLBAR â”€â”€â”€ */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "#141A24", alignItems: "center" }}>
        {/* Heading */}
        <select aria-label="Article heading style" onChange={e => exec("formatBlock", e.target.value)} defaultValue=""
          style={{ padding: "4px 6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "#1A2233", color: "#ccc", fontSize: 12, cursor: "pointer", height: 28 }}>
          <option value="">à¸¢à¹ˆà¸­à¸«à¸™à¹‰à¸²</option>
          <option value="h2">à¸«à¸±à¸§à¸‚à¹‰à¸­ 2</option>
          <option value="h3">à¸«à¸±à¸§à¸‚à¹‰à¸­ 3</option>
          <option value="h4">à¸«à¸±à¸§à¸‚à¹‰à¸­ 4</option>
          <option value="blockquote">à¸­à¹‰à¸²à¸‡à¸­à¸´à¸‡</option>
        </select>
        <div style={divider} />
        {/* Font size */}
        <select aria-label="Article font size" onChange={e => exec("fontSize", e.target.value)} defaultValue="3"
          style={{ padding: "4px 6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "#1A2233", color: "#ccc", fontSize: 12, cursor: "pointer", height: 28, width: 60 }}>
          {["1","2","3","4","5","6","7"].map(s => <option key={s} value={s}>{[10,12,14,16,18,24,32][+s-1]}px</option>)}
        </select>
        <div style={divider} />
        {/* Text style */}
        <button type="button" aria-label="Bold" style={btnStyle()} onClick={() => exec("bold")} title="à¸«à¸™à¸²"><b>B</b></button>
        <button type="button" aria-label="Italic" style={btnStyle()} onClick={() => exec("italic")} title="à¹€à¸­à¸µà¸¢à¸‡"><i>I</i></button>
        <button type="button" aria-label="Underline" style={btnStyle()} onClick={() => exec("underline")} title="à¸‚à¸µà¸”à¹€à¸ªà¹‰à¸™à¹ƒà¸•à¹‰"><u>U</u></button>
        <button type="button" aria-label="Strikethrough" style={btnStyle()} onClick={() => exec("strikeThrough")} title="à¸‚à¸µà¸”à¸—à¸±à¸š"><s>S</s></button>
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
        <button type="button" aria-label="Align left" style={btnStyle()} onClick={() => exec("justifyLeft")} title="à¸Šà¸´à¸”à¸‹à¹‰à¸²à¸¢">â¬…</button>
        <button type="button" aria-label="Align center" style={btnStyle()} onClick={() => exec("justifyCenter")} title="à¸à¸¶à¹ˆà¸‡à¸à¸¥à¸²à¸‡">â‰¡</button>
        <button type="button" aria-label="Align right" style={btnStyle()} onClick={() => exec("justifyRight")} title="à¸Šà¸´à¸”à¸‚à¸§à¸²">âž¡</button>
        <div style={divider} />
        {/* List */}
        <button type="button" aria-label="Bulleted list" style={btnStyle()} onClick={() => exec("insertUnorderedList")} title="à¸£à¸²à¸¢à¸à¸²à¸£">â€¢ â‰¡</button>
        <button type="button" aria-label="Numbered list" style={btnStyle()} onClick={() => exec("insertOrderedList")} title="à¸£à¸²à¸¢à¸à¸²à¸£à¸•à¸±à¸§à¹€à¸¥à¸‚">1. â‰¡</button>
        <div style={divider} />
        {/* Link */}
        <button type="button" aria-label="Insert link" style={btnStyle()} onClick={() => {
          const url = prompt("URL à¸¥à¸´à¸‡à¸à¹Œ:", "https://");
          if (url) exec("createLink", url);
        }} title="à¹à¸—à¸£à¸à¸¥à¸´à¸‡à¸à¹Œ">ðŸ”—</button>
        <button type="button" aria-label="Remove link" style={btnStyle()} onClick={() => exec("unlink")} title="à¸¥à¸šà¸¥à¸´à¸‡à¸à¹Œ">ðŸš«</button>
        <div style={divider} />
        {/* Image */}
        <input ref={imgRef} type="file" accept="image/*" aria-label="Upload article image" style={{ display: "none" }}
          onChange={e => e.target.files?.[0] && insertImage(e.target.files[0])} />
        <button type="button" aria-label="Insert image" style={{ ...btnStyle(), color: uploading ? "#888" : "#60A5FA", display: "flex", alignItems: "center", gap: 4 }}
          onClick={() => imgRef.current?.click()} disabled={uploading} title="à¹à¸—à¸£à¸à¸£à¸¹à¸›à¸ à¸²à¸ž">
          {uploading ? "â³" : "ðŸ–¼ï¸"} <span style={{ fontSize: 11 }}>à¹à¸—à¸£à¸à¸£à¸¹à¸›</span>
        </button>
        <div style={divider} />
        {/* Undo/Redo */}
        <button type="button" aria-label="Undo" style={btnStyle()} onClick={() => exec("undo")} title="à¸¢à¹‰à¸­à¸™à¸à¸¥à¸±à¸š">â†©</button>
        <button type="button" aria-label="Redo" style={btnStyle()} onClick={() => exec("redo")} title="à¸—à¸³à¸‹à¹‰à¸³">â†ª</button>
        <button type="button" aria-label="Clear article content" style={{ ...btnStyle(), marginLeft: "auto", color: "#ef4444" }}
          onClick={() => { if (confirm("à¸¥à¹‰à¸²à¸‡à¹€à¸™à¸·à¹‰à¸­à¸«à¸²à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”?")) { if(editorRef.current) editorRef.current.innerHTML = ""; sync(); } }}
          title="à¸¥à¹‰à¸²à¸‡à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”">ðŸ—‘ï¸</button>
      </div>

      {/* â”€â”€â”€ EDITOR AREA â”€â”€â”€ */}
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

      {/* â”€â”€â”€ EDITOR STYLES â”€â”€â”€ */}
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
        [contenteditable]:empty:before { content: "à¹€à¸£à¸´à¹ˆà¸¡à¸žà¸´à¸¡à¸žà¹Œà¹€à¸™à¸·à¹‰à¸­à¸«à¸²à¸šà¸—à¸„à¸§à¸²à¸¡à¸—à¸µà¹ˆà¸™à¸µà¹ˆ... à¸£à¸­à¸‡à¸£à¸±à¸šà¸à¸²à¸£à¸ˆà¸±à¸”à¸£à¸¹à¸›à¹à¸šà¸š à¸«à¸±à¸§à¸‚à¹‰à¸­ à¸£à¸¹à¸›à¸ à¸²à¸ž à¸¥à¸´à¸‡à¸à¹Œ"; color: #444; }
      `}</style>
    </div>
  );
}

function BlogManager({ showToast }: any) {
  const [posts, setPosts] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // à¹‚à¸«à¸¥à¸”à¸šà¸—à¸„à¸§à¸²à¸¡à¸ˆà¸²à¸ Supabase
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
    // à¹à¸›à¸¥à¸‡ tags à¸ˆà¸²à¸ string "a,b,c" â†’ array ["a","b","c"]
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
      // à¸­à¸±à¸›à¹€à¸”à¸•
      const { error } = await supabase.from("posts").update(postData).eq("id", p.id);
      if (error) { showToast("à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”: " + error.message, "error"); return; }
      showToast("à¸šà¸±à¸™à¸—à¸¶à¸à¸šà¸—à¸„à¸§à¸²à¸¡à¹à¸¥à¹‰à¸§");
      await revalidateBlog(p.slug);
    } else {
      // à¹€à¸žà¸´à¹ˆà¸¡à¹ƒà¸«à¸¡à¹ˆ
      const { error } = await supabase.from("posts").insert(postData);
      if (error) { showToast("à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”: " + error.message, "error"); return; }
      showToast("à¹€à¸žà¸´à¹ˆà¸¡à¸šà¸—à¸„à¸§à¸²à¸¡à¹ƒà¸«à¸¡à¹ˆà¹à¸¥à¹‰à¸§");
      await revalidateBlog(p.slug);
    }
    setEditing(null);
    fetchPosts();
  };


  // â”€â”€ revalidate à¹€à¸§à¹‡à¸šà¸—à¸±à¸™à¸—à¸µà¸«à¸¥à¸±à¸‡ save/delete â”€â”€
  const revalidateBlog = async (slug?: string) => {
    try {
      await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, secret: process.env.NEXT_PUBLIC_REVALIDATE_SECRET || "" }),
      });
    } catch {
      // revalidate à¸¥à¹‰à¸¡à¹€à¸«à¸¥à¸§à¹„à¸¡à¹ˆà¹ƒà¸«à¹‰ block UX
    }
  };
  const del = async (id) => {
    if (!confirm("à¸¥à¸šà¸šà¸—à¸„à¸§à¸²à¸¡à¸™à¸µà¹‰?")) return;
    const postToDelete = posts.find(p => p.id === id);
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) { showToast("à¸¥à¸šà¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ", "error"); return; }
    showToast("à¸¥à¸šà¸šà¸—à¸„à¸§à¸²à¸¡à¹à¸¥à¹‰à¸§");
    await revalidateBlog(postToDelete?.slug);
    fetchPosts();
  };

  const filtered = posts.filter(p =>
    [p.title, p.category, p.excerpt].some((value) => String(value || "").includes(search))
  );

  return (
    <div className="cms-blog-manager" style={{ animation: "fadeIn 0.3s ease" }}>
      <div className="cms-page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>à¸ˆà¸±à¸”à¸à¸²à¸£à¸šà¸—à¸„à¸§à¸²à¸¡</h1>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{posts.length} à¸šà¸—à¸„à¸§à¸²à¸¡</p>
        </div>
        <div className="cms-page-tools" style={{ display: "flex", gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} aria-label="Search CMS articles" placeholder="ðŸ” à¸„à¹‰à¸™à¸«à¸²..." style={{ width: 200 }} />
          <CBtn onClick={() => setEditing({ id: "", title: "", excerpt: "", category: "", date: new Date().toISOString().slice(0,10), slug: "", cover: "", cover_alt: "", published: true, body: "", seo_title: "", meta_desc: "", focus_keyword: "", author: "Display Works Media", last_updated: "", tags: "", ai_summary: "", key_takeaways: "", faqs: [], related_services: [] })} color="#FF6B00">+ à¹€à¸žà¸´à¹ˆà¸¡à¸šà¸—à¸„à¸§à¸²à¸¡</CBtn>
        </div>
      </div>

      <div className="cms-blog-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(p => (
          <div key={p.id} className="cms-blog-row" style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
            {/* Cover */}
            <div className="cms-blog-cover" style={{ width: 80, height: 60, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#1A2233", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {p.cover ? <img src={p.cover} alt={p.cover_alt || p.title || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24 }}>ðŸ“„</span>}
            </div>
            <div className="cms-blog-copy" style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</span>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: p.published ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.2)", color: p.published ? "#10b981" : "#6b7280" }}>
                  {p.published ? "à¹€à¸œà¸¢à¹à¸žà¸£à¹ˆà¹à¸¥à¹‰à¸§" : "à¸‰à¸šà¸±à¸šà¸£à¹ˆà¸²à¸‡"}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8" }}>{p.category} Â· {fmtDate(p.date)}</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.excerpt}</div>
            </div>
            <div className="cms-blog-actions" style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <CIconBtn aria-label={`Edit article: ${p.title}`} onClick={() => setEditing({ ...p })}>âœï¸</CIconBtn>
              <CIconBtn aria-label={`Delete article: ${p.title}`} onClick={() => del(p.id)} danger>ðŸ—‘ï¸</CIconBtn>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <EmptyState icon="ðŸ“" text="à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸šà¸—à¸„à¸§à¸²à¸¡" />}
      </div>

      {editing && (
        <CModal title={editing.id ? "à¹à¸à¹‰à¹„à¸‚à¸šà¸—à¸„à¸§à¸²à¸¡" : "à¹€à¸žà¸´à¹ˆà¸¡à¸šà¸—à¸„à¸§à¸²à¸¡à¹ƒà¸«à¸¡à¹ˆ"} onClose={() => setEditing(null)} width={700}>
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
    { value: "vinyl-banner", label: "à¸£à¸±à¸šà¸—à¸³à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥" },
    { value: "roll-up", label: "à¸£à¸±à¸šà¸—à¸³ Roll Up" },
    { value: "backdrop", label: "à¸£à¸±à¸šà¸—à¸³ Backdrop" },
    { value: "sticker", label: "à¸£à¸±à¸šà¸—à¸³à¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œ" },
    { value: "pp-board", label: "à¸£à¸±à¸šà¸—à¸³ PP Board" },
    { value: "label-sticker", label: "à¸£à¸±à¸šà¸—à¸³à¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸²" },
    { value: "x-stand", label: "à¸£à¸±à¸šà¸—à¸³ X-Stand" },
    { value: "standee", label: "à¸£à¸±à¸šà¸—à¸³ Standee" },
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
      if (uploadError) { showToast("à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¹„à¸¡à¹ˆà¹„à¸”à¹‰: " + uploadError.message, "error"); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("cms-media").getPublicUrl(path);
      if (!urlData?.publicUrl) { showToast("à¹„à¸”à¹‰à¸£à¸¹à¸›à¹à¸¥à¹‰à¸§à¹à¸•à¹ˆ URL à¹„à¸¡à¹ˆà¸–à¸¹à¸à¸•à¹‰à¸­à¸‡", "error"); setUploading(false); return; }
      setF(p => ({ ...p, cover: urlData.publicUrl }));
      showToast("à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¸£à¸¹à¸›à¸ªà¸³à¹€à¸£à¹‡à¸ˆ âœ“");
    } catch (err: any) { showToast("à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”: " + (err?.message || err), "error"); }
    setUploading(false);
  };

  const genSlug = () => {
    const slug = f.title.toLowerCase().replace(/[^a-z0-9à¸-à¹™\s]/g, "").replace(/\s+/g, "-").slice(0, 60);
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
      { ok: !!f.seo_title, label: "à¸¡à¸µ SEO Title" },
      { ok: !!f.meta_desc, label: "à¸¡à¸µ Meta Description" },
      { ok: !!f.focus_keyword, label: "à¸¡à¸µ Focus Keyword" },
      { ok: Array.isArray(f.faqs) && f.faqs.length > 0, label: "à¸¡à¸µ FAQ" },
      { ok: Array.isArray(f.related_services) && f.related_services.length > 0, label: "à¸¡à¸µ Internal Links" },
      { ok: !!f.ai_summary, label: "à¸¡à¸µ AI Summary" },
      { ok: !!f.cover, label: "à¸¡à¸µà¸£à¸¹à¸› Cover" },
      { ok: !!f.cover_alt, label: "à¸¡à¸µ Alt Text à¸£à¸¹à¸› Cover" },
      { ok: !!f.excerpt, label: "à¸¡à¸µ Excerpt" },
      { ok: !!f.tags, label: "à¸¡à¸µ Tags" },
      { ok: !!f.author, label: "à¸¡à¸µ Author" },
    ];
    checks.forEach(c => { if (c.ok) score += 10; });
    return { score: Math.min(score, 100), checks };
  })();

  const tabs = [
    { id: "general", label: "ðŸ“ à¸—à¸±à¹ˆà¸§à¹„à¸›" },
    { id: "seo", label: "ðŸ” SEO" },
    { id: "ai", label: "ðŸ¤– AI Search" },
    { id: "publish", label: "ðŸš€ à¹€à¸œà¸¢à¹à¸žà¸£à¹ˆ" },
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
          <button type="button" key={t.id} onClick={() => setActiveTab(t.id)} style={{ background: activeTab === t.id ? "rgba(255,107,0,0.15)" : "transparent", border: activeTab === t.id ? "1px solid rgba(255,107,0,0.3)" : "1px solid transparent", borderRadius: 8, padding: "10px 8px", color: activeTab === t.id ? "#FF6B00" : "#888", fontSize: 12, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.15s" }}>
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

        {/* â”€â”€ TAB: GENERAL â”€â”€ */}
        {activeTab === "general" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Cover */}
            <div style={fieldStyle}>
              <label style={labelStyle}>à¸£à¸¹à¸› Cover à¸šà¸—à¸„à¸§à¸²à¸¡</label>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 140, height: 88, borderRadius: 8, overflow: "hidden", background: "#1A2233", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {f.cover ? <img src={f.cover} alt="ภาพปกบทความที่เลือก" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 28, opacity: 0.4 }}>ðŸ–¼ï¸</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => uploadCover(e.target.files?.[0])} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...inputStyle, width: "auto", padding: "8px 14px", cursor: "pointer", background: "#3B82F6", border: "none", fontWeight: 600 }}>
                    {uploading ? "â³ à¸à¸³à¸¥à¸±à¸‡à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”..." : "ðŸ“ à¹€à¸¥à¸·à¸­à¸à¸£à¸¹à¸›à¸ à¸²à¸ž"}
                  </button>
                  <input value={f.cover} onChange={set("cover")} placeholder="à¸«à¸£à¸·à¸­à¸§à¸²à¸‡ URL à¸£à¸¹à¸›à¸ à¸²à¸ž" style={{ ...inputStyle, fontSize: 12 }} />
                  <input value={f.cover_alt} onChange={set("cover_alt")} placeholder="Alt Text à¸£à¸¹à¸› Cover à¹€à¸Šà¹ˆà¸™ à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥à¸«à¸™à¹‰à¸²à¸£à¹‰à¸²à¸™à¸­à¸²à¸«à¸²à¸£ Display Works Media" style={{ ...inputStyle, fontSize: 12 }} />
                  <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.5 }}>
                    à¹ƒà¸Šà¹‰à¸­à¸˜à¸´à¸šà¸²à¸¢à¸£à¸¹à¸›à¹ƒà¸«à¹‰ Google à¹à¸¥à¸°à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¸—à¸µà¹ˆà¹ƒà¸Šà¹‰ Screen Reader à¹€à¸«à¹‡à¸™à¸„à¸§à¸²à¸¡à¸«à¸¡à¸²à¸¢à¸‚à¸­à¸‡à¸ à¸²à¸ž
                  </div>
                </div>
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>à¸«à¸±à¸§à¸‚à¹‰à¸­à¸šà¸—à¸„à¸§à¸²à¸¡ *</label>
              <input value={f.title} onChange={set("title")} onBlur={genSlug} placeholder="à¸«à¸±à¸§à¸‚à¹‰à¸­à¸šà¸—à¸„à¸§à¸²à¸¡" style={inputStyle} />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Slug (URL)</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={f.slug} onChange={set("slug")} placeholder="url-slug" style={{ ...inputStyle, flex: 1 }} />
                <button type="button" onClick={genSlug} style={{ ...inputStyle, width: "auto", padding: "8px 14px", cursor: "pointer", background: "#374151", border: "none", flexShrink: 0 }}>à¸ªà¸£à¹‰à¸²à¸‡à¸­à¸±à¸•à¹‚à¸™à¸¡à¸±à¸•à¸´</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>à¸«à¸¡à¸§à¸”à¸«à¸¡à¸¹à¹ˆ</label>
                <input value={f.category} onChange={set("category")} list="cat-list" placeholder="à¹€à¸Šà¹ˆà¸™ à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥" style={inputStyle} />
                <datalist id="cat-list">{Array.from(new Set([...blogCategories.map(c => c.name), "à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥","à¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œ","Roll Up","Backdrop","PP Board","à¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸²","à¸—à¸±à¹ˆà¸§à¹„à¸›"])).map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>à¸§à¸±à¸™à¸—à¸µà¹ˆà¹€à¸œà¸¢à¹à¸žà¸£à¹ˆ</label>
                <input type="date" value={f.date} onChange={set("date")} style={inputStyle} />
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>à¸šà¸—à¸ªà¸£à¸¸à¸› (Excerpt)</label>
              <textarea value={f.excerpt} onChange={set("excerpt")} rows={3} placeholder="à¸­à¸˜à¸´à¸šà¸²à¸¢à¸ªà¸±à¹‰à¸™à¹† à¸§à¹ˆà¸²à¸šà¸—à¸„à¸§à¸²à¸¡à¸™à¸µà¹‰à¹€à¸à¸µà¹ˆà¸¢à¸§à¸à¸±à¸šà¸­à¸°à¹„à¸£..." style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>à¹€à¸™à¸·à¹‰à¸­à¸«à¸²à¸šà¸—à¸„à¸§à¸²à¸¡</label>
              <RichEditor value={f.body} onChange={val => setF(p => ({ ...p, body: val }))} showToast={showToast} />
            </div>
          </div>
        )}

        {/* â”€â”€ TAB: SEO â”€â”€ */}
        {activeTab === "seo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* SEO Score Checklist */}
            <div style={{ background: "#0D1320", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>SEO Checklist</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {seoScore.checks.map((c, i) => (
                  <div key={i} style={{ fontSize: 12, color: c.ok ? "#10b981" : "#6B7280", display: "flex", gap: 6, alignItems: "center" }}>
                    <span>{c.ok ? "âœ…" : "âŒ"}</span> {c.label}
                  </div>
                ))}
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>SEO Title <span style={{ color: "#6B7280", fontWeight: 400 }}>(à¹à¸ªà¸”à¸‡à¸šà¸™ Google)</span></label>
              <input value={f.seo_title} onChange={set("seo_title")} placeholder="à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥à¸„à¸·à¸­à¸­à¸°à¹„à¸£? | Display Works Media" style={inputStyle} maxLength={70} />
              <div style={charCountStyle((f.seo_title || "").length, 60)}>{(f.seo_title || "").length}/60 à¸•à¸±à¸§à¸­à¸±à¸à¸©à¸£</div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Meta Description</label>
              <textarea value={f.meta_desc} onChange={set("meta_desc")} rows={3} placeholder="à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢à¸—à¸µà¹ˆà¹à¸ªà¸”à¸‡à¹ƒà¸™ Google Search..." style={{ ...inputStyle, resize: "vertical" }} maxLength={170} />
              <div style={charCountStyle((f.meta_desc || "").length, 160)}>{(f.meta_desc || "").length}/160 à¸•à¸±à¸§à¸­à¸±à¸à¸©à¸£</div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Focus Keyword</label>
              <input value={f.focus_keyword} onChange={set("focus_keyword")} placeholder="à¹€à¸Šà¹ˆà¸™ à¸£à¸±à¸šà¸—à¸³à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥" style={inputStyle} />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Author <span style={{ color: "#6B7280", fontWeight: 400 }}>(E-E-A-T)</span></label>
              <select value={f.author} onChange={set("author")} style={inputStyle}>
                {AUTHOR_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Tags <span style={{ color: "#6B7280", fontWeight: 400 }}>(à¸„à¸±à¹ˆà¸™à¸”à¹‰à¸§à¸¢à¸ˆà¸¸à¸¥à¸ à¸²à¸„)</span></label>
              <input value={f.tags} onChange={set("tags")} placeholder="à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥, SME, à¸£à¹‰à¸²à¸™à¸­à¸²à¸«à¸²à¸£, à¹‚à¸†à¸©à¸“à¸²" style={inputStyle} />
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
                      {checked ? "â˜‘" : "â˜"} {s.label}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* â”€â”€ TAB: AI SEARCH â”€â”€ */}
        {activeTab === "ai" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: 12, fontSize: 12, color: "#a5b4fc" }}>
              ðŸ¤– à¸Ÿà¸´à¸¥à¸”à¹Œà¹€à¸«à¸¥à¹ˆà¸²à¸™à¸µà¹‰à¸Šà¹ˆà¸§à¸¢à¹ƒà¸«à¹‰ Google AI Overview, ChatGPT, Gemini à¹à¸¥à¸° Perplexity à¸­à¹‰à¸²à¸‡à¸­à¸´à¸‡à¸šà¸—à¸„à¸§à¸²à¸¡à¸‚à¸­à¸‡à¸„à¸¸à¸“à¹„à¸”à¹‰
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>AI Summary <span style={{ color: "#6B7280", fontWeight: 400 }}>(50-150 à¸„à¸³)</span></label>
              <textarea value={f.ai_summary} onChange={set("ai_summary")} rows={5} placeholder="à¸ªà¸£à¸¸à¸›à¸šà¸—à¸„à¸§à¸²à¸¡à¸ªà¸³à¸«à¸£à¸±à¸š AI à¹€à¸Šà¹ˆà¸™: à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥à¹€à¸›à¹‡à¸™à¸ªà¸·à¹ˆà¸­à¹‚à¸†à¸©à¸“à¸²à¸—à¸µà¹ˆà¹„à¸”à¹‰à¸£à¸±à¸šà¸„à¸§à¸²à¸¡à¸™à¸´à¸¢à¸¡à¸ªà¸³à¸«à¸£à¸±à¸šà¸˜à¸¸à¸£à¸à¸´à¸ˆ SME..." style={{ ...inputStyle, resize: "vertical" }} />
              <div style={charCountStyle(0, 0)}>{(f.ai_summary || "").split(/\s+/).filter(Boolean).length} à¸„à¸³</div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Key Takeaways <span style={{ color: "#6B7280", fontWeight: 400 }}>(à¹à¸•à¹ˆà¸¥à¸°à¸šà¸£à¸£à¸—à¸±à¸” = 1 à¸›à¸£à¸°à¹€à¸”à¹‡à¸™)</span></label>
              <textarea value={f.key_takeaways} onChange={set("key_takeaways")} rows={4} placeholder={"à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥à¹€à¸«à¸¡à¸²à¸°à¸à¸±à¸šà¸‡à¸²à¸™à¸à¸¥à¸²à¸‡à¹à¸ˆà¹‰à¸‡\nà¸„à¸§à¸£à¹€à¸¥à¸·à¸­à¸à¸„à¸§à¸²à¸¡à¸«à¸™à¸²à¸•à¸²à¸¡à¸¥à¸±à¸à¸©à¸“à¸°à¸à¸²à¸£à¹ƒà¸Šà¹‰à¸‡à¸²à¸™\nà¹„à¸§à¸™à¸´à¸¥ 400 à¹à¸à¸£à¸¡à¸—à¸™à¸—à¸²à¸™à¸à¸§à¹ˆà¸² 360 à¹à¸à¸£à¸¡"} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>FAQ Builder <span style={{ color: "#6B7280", fontWeight: 400 }}>(à¸ªà¸£à¹‰à¸²à¸‡ FAQ Schema à¸­à¸±à¸•à¹‚à¸™à¸¡à¸±à¸•à¸´)</span></label>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(Array.isArray(f.faqs) ? f.faqs : []).map((faq: any, i: number) => (
                  <div key={i} style={{ background: "#0D1320", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 700 }}>FAQ #{i + 1}</span>
                      <button type="button" onClick={() => removeFaq(i)} style={{ background: "rgba(239,68,68,0.15)", border: "none", color: "#ef4444", borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontSize: 11 }}>à¸¥à¸š</button>
                    </div>
                    <input value={faq.q} onChange={e => setFaq(i, "q", e.target.value)} placeholder="à¸„à¸³à¸–à¸²à¸¡ à¹€à¸Šà¹ˆà¸™ à¸ªà¸±à¹ˆà¸‡à¸‚à¸±à¹‰à¸™à¸•à¹ˆà¸³à¹€à¸—à¹ˆà¸²à¹„à¸«à¸£à¹ˆ?" style={{ ...inputStyle, fontSize: 12 }} />
                    <textarea value={faq.a} onChange={e => setFaq(i, "a", e.target.value)} rows={2} placeholder="à¸„à¸³à¸•à¸­à¸š..." style={{ ...inputStyle, fontSize: 12, resize: "vertical" }} />
                  </div>
                ))}
                <button type="button" onClick={addFaq} style={{ ...inputStyle, width: "auto", padding: "10px", cursor: "pointer", background: "rgba(99,102,241,0.1)", border: "1px dashed rgba(99,102,241,0.3)", color: "#a5b4fc", textAlign: "center" as const }}>
                  + à¹€à¸žà¸´à¹ˆà¸¡à¸„à¸³à¸–à¸²à¸¡ FAQ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* â”€â”€ TAB: PUBLISH â”€â”€ */}
        {activeTab === "publish" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#0D1320", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 16 }}>
              <input type="checkbox" id="published" checked={f.published} onChange={e => setF(p => ({ ...p, published: e.target.checked }))} style={{ width: 18, height: 18, cursor: "pointer" }} />
              <div>
                <label htmlFor="published" style={{ fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#fff" }}>à¹€à¸œà¸¢à¹à¸žà¸£à¹ˆà¸šà¸—à¸„à¸§à¸²à¸¡à¸™à¸µà¹‰</label>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>à¸šà¸—à¸„à¸§à¸²à¸¡à¸ˆà¸°à¹à¸ªà¸”à¸‡à¸šà¸™à¹€à¸§à¹‡à¸šà¹„à¸‹à¸•à¹Œà¸—à¸±à¸™à¸—à¸µà¸«à¸¥à¸±à¸‡à¸šà¸±à¸™à¸—à¸¶à¸</div>
              </div>
              <span style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: f.published ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.2)", color: f.published ? "#10b981" : "#6b7280" }}>
                {f.published ? "à¹€à¸œà¸¢à¹à¸žà¸£à¹ˆà¹à¸¥à¹‰à¸§" : "à¸‰à¸šà¸±à¸šà¸£à¹ˆà¸²à¸‡"}
              </span>
            </div>

            <div style={{ background: "#0D1320", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>ðŸ“Š à¸ªà¸£à¸¸à¸›à¸à¹ˆà¸­à¸™à¸šà¸±à¸™à¸—à¸¶à¸</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "à¸«à¸±à¸§à¸‚à¹‰à¸­", value: f.title || "-" },
                  { label: "Slug", value: f.slug || "-" },
                  { label: "SEO Title", value: f.seo_title || <span style={{ color: "#ef4444" }}>à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸à¸£à¸­à¸</span> },
                  { label: "Meta Desc", value: f.meta_desc ? `${(f.meta_desc).slice(0, 50)}...` : <span style={{ color: "#ef4444" }}>à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸à¸£à¸­à¸</span> },
                  { label: "Cover Alt", value: f.cover_alt || <span style={{ color: "#f59e0b" }}>à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸à¸£à¸­à¸</span> },
                  { label: "Focus KW", value: f.focus_keyword || <span style={{ color: "#f59e0b" }}>à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸à¸£à¸­à¸</span> },
                  { label: "FAQ", value: `${Array.isArray(f.faqs) ? f.faqs.length : 0} à¸‚à¹‰à¸­` },
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
              <button type="button" onClick={() => onSave(f)} style={{ flex: 1, padding: "12px", background: "#C2410C", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>ðŸ’¾ à¸šà¸±à¸™à¸—à¸¶à¸</button>
              <button type="button" onClick={onCancel} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#888", fontSize: 14, cursor: "pointer" }}>à¸¢à¸à¹€à¸¥à¸´à¸</button>
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
    headline1: "à¸œà¸¥à¸´à¸•à¸ªà¸·à¹ˆà¸­à¹‚à¸†à¸©à¸“à¸²",
    headlineHighlight: "à¸„à¸£à¸šà¸§à¸‡à¸ˆà¸£",
    headline2: "",
    subtitle: "à¸­à¸­à¸à¹à¸šà¸š à¸œà¸¥à¸´à¸• à¸•à¸´à¸”à¸•à¸±à¹‰à¸‡ à¸‡à¸²à¸™à¸›à¹‰à¸²à¸¢ à¸£à¹‰à¸²à¸™à¸„à¹‰à¸² à¹à¸¥à¸°à¸ªà¸·à¹ˆà¸­à¹‚à¸†à¸©à¸“à¸²à¸—à¸¸à¸à¸›à¸£à¸°à¹€à¸ à¸— à¸žà¸£à¹‰à¸­à¸¡à¸—à¸µà¸¡à¸‡à¸²à¸™à¸¡à¸·à¸­à¸­à¸²à¸Šà¸µà¸žà¸”à¸¹à¹à¸¥à¸•à¸¥à¸­à¸”à¸à¸£à¸°à¸šà¸§à¸™à¸à¸²à¸£",
    trustPoints: ["à¸­à¸­à¸à¹à¸šà¸š à¸œà¸¥à¸´à¸• à¸•à¸´à¸”à¸•à¸±à¹‰à¸‡ à¸„à¸£à¸šà¸ˆà¸šà¹ƒà¸™à¸—à¸µà¹ˆà¹€à¸”à¸µà¸¢à¸§", "à¸šà¸£à¸´à¸à¸²à¸£à¸«à¸¥à¸±à¸‡à¸à¸²à¸£à¸‚à¸²à¸¢à¸„à¸£à¸šà¸§à¸‡à¸ˆà¸£", "à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡à¸—à¸±à¹ˆà¸§à¸›à¸£à¸°à¹€à¸—à¸¨ à¸žà¸£à¹‰à¸­à¸¡à¹à¸ˆà¹‰à¸‡à¹€à¸¥à¸‚à¸žà¸±à¸ªà¸”à¸¸"],
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
      showToast("à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¸£à¸¹à¸›à¸žà¸·à¹‰à¸™à¸«à¸¥à¸±à¸‡à¸ªà¸³à¹€à¸£à¹‡à¸ˆ");
    } catch {
      showToast("à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸š Supabase Storage bucket à¸Šà¸·à¹ˆà¸­ cms-media", "error");
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
      showToast("à¸šà¸±à¸™à¸—à¸¶à¸ Hero Section à¹à¸¥à¹‰à¸§");
    } catch (error: any) {
      showToast("à¸šà¸±à¸™à¸—à¸¶à¸à¹„à¸¡à¹ˆà¹„à¸”à¹‰: " + error.message, "error");
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 680 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>à¹à¸à¹‰à¹„à¸‚ Hero Section</h2>
      <Card>
        <SectionTitle>à¸£à¸¹à¸›à¸žà¸·à¹‰à¸™à¸«à¸¥à¸±à¸‡</SectionTitle>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ width: 200, height: 110, borderRadius: 10, overflow: "hidden", background: "#1A2233", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0, position: "relative" }}>
            {hero.bgImage && <img src={hero.bgImage.startsWith("/") ? hero.bgImage : hero.bgImage} alt="ภาพพื้นหลัง Hero Section" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => (e.target as HTMLImageElement).style.display="none"} />}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 28, opacity: 0.3 }}>ðŸ–¼ï¸</span>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => uploadBg(e.target.files?.[0])} />
            <CBtn onClick={() => fileRef.current?.click()} color="#3B82F6" small disabled={uploading}>
              {uploading ? "â³ à¸à¸³à¸¥à¸±à¸‡à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”..." : "ðŸ“ à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸£à¸¹à¸›à¸žà¸·à¹‰à¸™à¸«à¸¥à¸±à¸‡"}
            </CBtn>
            <input value={hero.bgImage} onChange={set("bgImage")} placeholder="à¸«à¸£à¸·à¸­à¸§à¸²à¸‡ URL à¸£à¸¹à¸›à¸ à¸²à¸ž" />
          </div>
        </div>

        <SectionTitle>à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸«à¸¥à¸±à¸</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          <CField label="à¸šà¸£à¸£à¸—à¸±à¸”à¸—à¸µà¹ˆ 1"><input value={hero.headline1} onChange={set("headline1")} /></CField>
          <CField label="à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸ªà¸µà¸ªà¹‰à¸¡ (highlight)"><input value={hero.headlineHighlight} onChange={set("headlineHighlight")} /></CField>
          <CField label="à¸šà¸£à¸£à¸—à¸±à¸”à¸—à¸µà¹ˆ 3 (à¹„à¸¡à¹ˆà¸šà¸±à¸‡à¸„à¸±à¸š)"><input value={hero.headline2} onChange={set("headline2")} /></CField>
          <CField label="à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢ (subtitle)"><textarea value={hero.subtitle} onChange={set("subtitle")} rows={3} /></CField>
        </div>

        <SectionTitle>à¸ˆà¸¸à¸”à¹€à¸”à¹ˆà¸™ (Trust Points)</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {hero.trustPoints.map((tp, i) => (
            <div key={i} style={{ display: "flex", gap: 8 }}>
              <input value={tp} onChange={e => setTrust(i, e.target.value)} style={{ flex: 1 }} />
              <CIconBtn onClick={() => delTrust(i)} danger small>âœ•</CIconBtn>
            </div>
          ))}
          <CBtn onClick={addTrust} small outline>+ à¹€à¸žà¸´à¹ˆà¸¡à¸ˆà¸¸à¸”à¹€à¸”à¹ˆà¸™</CBtn>
        </div>

        <SectionTitle>à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸•à¸´à¸”à¸•à¹ˆà¸­ (Hero)</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <CField label="à¹€à¸šà¸­à¸£à¹Œà¹‚à¸—à¸£"><input value={hero.phone} onChange={set("phone")} /></CField>
          <CField label="LINE URL"><input value={hero.lineUrl} onChange={set("lineUrl")} /></CField>
        </div>

        <CBtn onClick={save} color="#FF6B00">ðŸ’¾ à¸šà¸±à¸™à¸—à¸¶à¸ Hero Section</CBtn>
      </Card>
    </div>
  );
}

// ============================================================
// SERVICES MANAGER
// ============================================================
function ServicesManager({ showToast }: any) {
  const [services, setServices] = useState(() => loadLocal("services", [
    { id: "1", name: "à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥", icon: "ðŸªŸ", desc: "à¸žà¸´à¸¡à¸žà¹Œà¸‡à¸²à¸™à¸„à¸¸à¸“à¸ à¸²à¸žà¸ªà¸¹à¸‡ à¸—à¸™à¸•à¹ˆà¸­à¹à¸ªà¸‡à¹à¸¥à¸°à¸à¸™ à¹€à¸«à¸¡à¸²à¸°à¸ªà¸³à¸«à¸£à¸±à¸šà¸›à¹‰à¸²à¸¢à¸«à¸™à¹‰à¸²à¸£à¹‰à¸²à¸™ à¸›à¹‰à¸²à¸¢à¹‚à¸†à¸©à¸“à¸² à¸‚à¸™à¸²à¸”à¹ƒà¸«à¸à¹ˆ", price: "à¸•à¸£.à¸¡.à¸¥à¸° 200à¸¿", url: "/services/vinyl-banner" },
    { id: "2", name: "à¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œ", icon: "ðŸ·ï¸", desc: "à¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œà¸à¸±à¸™à¸™à¹‰à¸³ indoor/outdoor à¸žà¸´à¸¡à¸žà¹Œà¸ªà¸µ 4 à¸ªà¸µ à¸„à¸¡à¸Šà¸±à¸” à¸•à¸´à¸”à¸—à¸™à¸™à¸²à¸™", price: "à¸•à¸£.à¸¡.à¸¥à¸° 350à¸¿", url: "/services/label-sticker" },
    { id: "3", name: "PP Board", icon: "ðŸ“‹", desc: "à¸›à¹‰à¸²à¸¢à¸žà¸µà¸žà¸µà¸šà¸­à¸£à¹Œà¸”à¸™à¹‰à¸³à¸«à¸™à¸±à¸à¹€à¸šà¸² à¸žà¸à¸žà¸²à¸‡à¹ˆà¸²à¸¢ à¹€à¸«à¸¡à¸²à¸°à¸ªà¸³à¸«à¸£à¸±à¸šà¸‡à¸²à¸™ Event à¹à¸¥à¸°à¸›à¹‰à¸²à¸¢à¸Šà¸±à¹ˆà¸§à¸„à¸£à¸²à¸§", price: "à¹à¸œà¹ˆà¸™à¸¥à¸° 400à¸¿", url: "/services/pp-board" },
    { id: "4", name: "Roll Up", icon: "ðŸŽª", desc: "à¸›à¹‰à¸²à¸¢ Roll Up à¸ªà¸³à¸«à¸£à¸±à¸šà¸‡à¸²à¸™à¸™à¸´à¸—à¸£à¸£à¸¨à¸à¸²à¸£ à¸›à¸£à¸°à¸Šà¸¸à¸¡ à¹à¸¥à¸°à¸‡à¸²à¸™à¸à¸´à¸ˆà¸à¸£à¸£à¸¡à¸•à¹ˆà¸²à¸‡à¹†", price: "à¸Šà¸´à¹‰à¸™à¸¥à¸° 2,200à¸¿", url: "/services/roll-up" },
    { id: "5", name: "Backdrop", icon: "ðŸ–¼", desc: "à¸›à¹‰à¸²à¸¢ Backdrop à¸‚à¸™à¸²à¸”à¹ƒà¸«à¸à¹ˆà¸ªà¸³à¸«à¸£à¸±à¸šà¸‡à¸²à¸™à¸­à¸µà¹€à¸§à¸™à¸•à¹Œ à¸–à¹ˆà¸²à¸¢à¸£à¸¹à¸› à¹à¸¥à¸°à¸‡à¸²à¸™à¹à¸–à¸¥à¸‡à¸‚à¹ˆà¸²à¸§", price: "à¸Šà¸¸à¸”à¸¥à¸° 3,500à¸¿", url: "/services/backdrop" },
    { id: "6", name: "à¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸²", icon: "ðŸ·", desc: "à¸žà¸´à¸¡à¸žà¹Œà¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸²à¸„à¸¸à¸“à¸ à¸²à¸žà¸ªà¸¹à¸‡ à¸—à¸±à¹‰à¸‡à¹à¸šà¸šà¸¡à¹‰à¸§à¸™à¹à¸¥à¸°à¹à¸œà¹ˆà¸™ à¸£à¸­à¸‡à¸£à¸±à¸šà¸—à¸¸à¸à¸‚à¸™à¸²à¸”", price: "100 à¸Šà¸´à¹‰à¸™à¸¥à¸° 400à¸¿", url: "/services/label-sticker" },
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
    if (id === "6" || name.includes("à¸‰à¸¥à¸²à¸") || url.includes("label")) return "label";
    if (id === "2" || url.includes("sticker") || name.includes("sticker") || name.includes("à¸ªà¸•à¸´à¹Šà¸")) return "sticker";
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
    const category = service?.name || "à¸œà¸¥à¸‡à¸²à¸™à¸šà¸£à¸´à¸à¸²à¸£";
    const currentItems = servicePortfolioItems(serviceKey);
    setPageContent((current: any) => ({
      ...current,
      servicesDetail: {
        ...current.servicesDetail,
        [serviceKey]: {
          ...(current.servicesDetail?.[serviceKey] || {}),
          portfolioItems: [
            ...currentItems,
            { title: "à¸œà¸¥à¸‡à¸²à¸™à¹ƒà¸«à¸¡à¹ˆ", category, image: "", alt: "", meta: "", href: service?.url || "" },
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
      showToast("à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¸£à¸¹à¸›à¸œà¸¥à¸‡à¸²à¸™à¸ªà¸³à¹€à¸£à¹‡à¸ˆ");
    } catch (error: any) {
      showToast("à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¸£à¸¹à¸›à¹„à¸¡à¹ˆà¹„à¸”à¹‰: " + (error?.message || "à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸š Supabase Storage"), "error");
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
      showToast("à¸šà¸±à¸™à¸—à¸¶à¸à¸šà¸£à¸´à¸à¸²à¸£à¹à¸¥à¹‰à¸§");
    } catch (error: any) {
      showToast("à¸šà¸±à¸™à¸—à¸¶à¸à¹„à¸¡à¹ˆà¹„à¸”à¹‰: " + error.message, "error");
    }
    setEditing(null);
  };
  const del = async (id) => {
    if (!confirm("à¸¥à¸šà¸šà¸£à¸´à¸à¸²à¸£à¸™à¸µà¹‰?")) return;
    const ns = services.filter(s => s.id !== id);
    setServices(ns);
    try {
      await saveCmsSetting("services", ns);
      showToast("à¸¥à¸šà¸šà¸£à¸´à¸à¸²à¸£à¹à¸¥à¹‰à¸§");
    } catch (error: any) {
      showToast("à¸¥à¸šà¹à¸¥à¹‰à¸§à¹à¸•à¹ˆà¸šà¸±à¸™à¸—à¸¶à¸à¸à¸²à¸™à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹„à¸¡à¹ˆà¹„à¸”à¹‰: " + error.message, "error");
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>à¸ˆà¸±à¸”à¸à¸²à¸£à¸šà¸£à¸´à¸à¸²à¸£</h2>
        <CBtn onClick={() => setEditing({ id: "", name: "", icon: "ðŸ› ï¸", desc: "", price: "", url: "" })} color="#FF6B00">+ à¹€à¸žà¸´à¹ˆà¸¡à¸šà¸£à¸´à¸à¸²à¸£</CBtn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {services.map(s => (
          <div key={s.id} className="cms-service-card" style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <CIconBtn onClick={() => setEditing({ ...s })}>âœï¸</CIconBtn>
                <CIconBtn onClick={() => del(s.id)} danger>ðŸ—‘ï¸</CIconBtn>
              </div>
            </div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{s.name}</div>
            <div style={{ fontSize: 12, color: "#888", lineHeight: 1.7, marginBottom: 8 }}>{s.desc}</div>
            <div style={{ fontSize: 12, color: "#FF6B00", fontWeight: 600 }}>à¹€à¸£à¸´à¹ˆà¸¡à¸•à¹‰à¸™ {s.price}</div>
          </div>
        ))}
      </div>
      {editing && (
        <CModal title={editing.id ? "à¹à¸à¹‰à¹„à¸‚à¸šà¸£à¸´à¸à¸²à¸£" : "à¹€à¸žà¸´à¹ˆà¸¡à¸šà¸£à¸´à¸à¸²à¸£"} onClose={() => setEditing(null)} width={760}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 12 }}>
              <CField label="à¹„à¸­à¸„à¸­à¸™"><input value={editing.icon} onChange={e => setEditing(p => ({ ...p, icon: e.target.value }))} style={{ textAlign: "center", fontSize: 24 }} /></CField>
              <CField label="à¸Šà¸·à¹ˆà¸­à¸šà¸£à¸´à¸à¸²à¸£ *"><input value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} /></CField>
            </div>
            <CField label="à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢"><textarea value={editing.desc} onChange={e => setEditing(p => ({ ...p, desc: e.target.value }))} rows={3} /></CField>
            <CField label="à¸£à¸²à¸„à¸²à¹€à¸£à¸´à¹ˆà¸¡à¸•à¹‰à¸™"><input value={editing.price} onChange={e => setEditing(p => ({ ...p, price: e.target.value }))} placeholder="à¹€à¸Šà¹ˆà¸™ à¸•à¸£.à¸¡.à¸¥à¸° 200à¸¿" /></CField>
            <CField label="URL à¸«à¸™à¹‰à¸²à¸šà¸£à¸´à¸à¸²à¸£"><input value={editing.url} onChange={e => setEditing(p => ({ ...p, url: e.target.value }))} placeholder="/services/vinyl-banner" /></CField>
            {(() => {
              const serviceKey = serviceKeyFromService(editing);
              const items = servicePortfolioItems(serviceKey);
              return (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14, marginTop: 2 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>à¸£à¸¹à¸›à¸œà¸¥à¸‡à¸²à¸™à¸‚à¸­à¸‡à¸šà¸£à¸´à¸à¸²à¸£à¸™à¸µà¹‰</div>
                      <div style={{ fontSize: 11, color: "#8A94A6", marginTop: 3 }}>
                        à¸£à¸¹à¸›à¸Šà¸¸à¸”à¸™à¸µà¹‰à¸ˆà¸°à¹ƒà¸Šà¹‰à¹ƒà¸™à¸«à¸™à¹‰à¸²à¸šà¸£à¸´à¸à¸²à¸£ à¸«à¸™à¹‰à¸²à¹à¸£à¸ à¹à¸¥à¸°à¸«à¸™à¹‰à¸²à¸œà¸¥à¸‡à¸²à¸™
                      </div>
                    </div>
                    {serviceKey && <CBtn onClick={() => addServicePortfolioItem(serviceKey, editing)} small color="#3B82F6">+ à¹€à¸žà¸´à¹ˆà¸¡à¸£à¸¹à¸›</CBtn>}
                  </div>
                  {!serviceKey ? (
                    <div style={{ padding: 12, border: "1px dashed rgba(255,107,0,0.35)", borderRadius: 10, color: "#F59E0B", fontSize: 12, lineHeight: 1.7 }}>
                      à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸žà¸šà¸«à¸™à¹‰à¸²à¸šà¸£à¸´à¸à¸²à¸£à¸—à¸µà¹ˆà¹€à¸Šà¸·à¹ˆà¸­à¸¡à¸à¸±à¸šà¸£à¸²à¸¢à¸à¸²à¸£à¸™à¸µà¹‰ à¸à¸£à¸¸à¸“à¸²à¹ƒà¸ªà¹ˆ URL à¹ƒà¸«à¹‰à¸•à¸£à¸‡à¸à¸±à¸šà¸«à¸™à¹‰à¸²à¸šà¸£à¸´à¸à¸²à¸£ à¹€à¸Šà¹ˆà¸™ /services/vinyl-banner, /services/sticker, /services/pp-board, /services/roll-up, /services/backdrop à¸«à¸£à¸·à¸­ /services/label-sticker
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
                                  <div style={{ height: "100%", display: "grid", placeItems: "center", color: "#4B5563", fontSize: 11 }}>à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸£à¸¹à¸›</div>
                                )}
                              </div>
                              <CBtn onClick={() => deleteServicePortfolioItem(serviceKey, index)} small outline style={{ width: "100%", marginTop: 8, color: "#EF4444", borderColor: "rgba(239,68,68,0.35)" }}>à¸¥à¸šà¸£à¸¹à¸›</CBtn>
                            </div>
                            <div className="service-portfolio-fields" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                              <CField label="à¸Šà¸·à¹ˆà¸­à¸œà¸¥à¸‡à¸²à¸™"><input value={item.title || ""} onChange={(e) => updateServicePortfolioItem(serviceKey, index, "title", e.target.value)} /></CField>
                              <CField label="à¸«à¸¡à¸§à¸”à¸«à¸¡à¸¹à¹ˆ"><input value={item.category || editing.name || ""} onChange={(e) => updateServicePortfolioItem(serviceKey, index, "category", e.target.value)} /></CField>
                              <CField label="URL à¸£à¸¹à¸›"><input value={item.image || ""} onChange={(e) => updateServicePortfolioItem(serviceKey, index, "image", e.target.value)} placeholder="/images/portfolio/example.jpg" /></CField>
                              <CField label="à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¸£à¸¹à¸›">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => uploadServicePortfolioImage(serviceKey, index, e.target.files?.[0])}
                                />
                                {servicePortfolioUploading === `${serviceKey}-${index}` && (
                                  <div style={{ fontSize: 11, color: "#60A5FA", marginTop: 5 }}>à¸à¸³à¸¥à¸±à¸‡à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”...</div>
                                )}
                              </CField>
                              <CField label="Alt Text"><input value={item.alt || ""} onChange={(e) => updateServicePortfolioItem(serviceKey, index, "alt", e.target.value)} /></CField>
                              <CField label="à¸¥à¸´à¸‡à¸à¹Œà¹€à¸¡à¸·à¹ˆà¸­à¸à¸”"><input value={item.href || editing.url || ""} onChange={(e) => updateServicePortfolioItem(serviceKey, index, "href", e.target.value)} /></CField>
                              <CField label="à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢à¸ªà¸±à¹‰à¸™" style={{ gridColumn: "1 / -1" }}>
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
              <CBtn onClick={() => save(editing)} color="#FF6B00" style={{ flex: 1 }}>à¸šà¸±à¸™à¸—à¸¶à¸</CBtn>
              <CBtn onClick={() => setEditing(null)} outline style={{ flex: 1 }}>à¸¢à¸à¹€à¸¥à¸´à¸</CBtn>
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
    { id: "1", name: "à¸„à¸¸à¸“à¸ªà¸¡à¸Šà¸²à¸¢", company: "à¸£à¹‰à¸²à¸™à¸­à¸²à¸«à¸²à¸£à¸„à¸£à¸±à¸§à¸šà¹‰à¸²à¸™", stars: 5, text: "à¸šà¸£à¸´à¸à¸²à¸£à¸”à¸µà¸¡à¸²à¸ à¸‡à¸²à¸™à¸­à¸­à¸à¸¡à¸²à¸ªà¸§à¸¢à¸‡à¸²à¸¡ à¸ªà¹ˆà¸‡à¸•à¸£à¸‡à¹€à¸§à¸¥à¸² à¸£à¸²à¸„à¸²à¹€à¸›à¹‡à¸™à¸˜à¸£à¸£à¸¡" },
    { id: "2", name: "à¸„à¸¸à¸“à¸™à¸‡à¸™à¸¸à¸Š", company: "à¸£à¹‰à¸²à¸™à¹€à¸ªà¸·à¹‰à¸­à¸œà¹‰à¸² Fashion Plus", stars: 5, text: "à¸—à¸³à¸›à¹‰à¸²à¸¢à¸«à¸™à¹‰à¸²à¸£à¹‰à¸²à¸™à¸ªà¸§à¸¢à¸¡à¸²à¸à¸„à¹ˆà¸° à¸¥à¸¹à¸à¸„à¹‰à¸²à¹€à¸«à¹‡à¸™à¹à¸¥à¹‰à¸§à¸Šà¸­à¸šà¸à¸±à¸™à¹€à¸¢à¸­à¸°à¹€à¸¥à¸¢" },
    { id: "3", name: "à¸„à¸¸à¸“à¸§à¸´à¸Šà¸±à¸¢", company: "à¸šà¸£à¸´à¸©à¸±à¸—à¸­à¸­à¹à¸à¸™à¸´à¸", stars: 4, text: "à¸‡à¸²à¸™à¸„à¸¸à¸“à¸ à¸²à¸žà¸”à¸µ à¸—à¸µà¸¡à¸‡à¸²à¸™à¹ƒà¸«à¹‰à¸„à¸³à¸›à¸£à¸¶à¸à¸©à¸²à¹€à¸£à¸·à¹ˆà¸­à¸‡à¸‚à¸™à¸²à¸”à¹à¸¥à¸°à¸§à¸±à¸ªà¸”à¸¸à¹„à¸”à¹‰à¸”à¸µà¸¡à¸²à¸" },
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
      showToast(r.id ? "à¸šà¸±à¸™à¸—à¸¶à¸à¸£à¸µà¸§à¸´à¸§à¹à¸¥à¹‰à¸§" : "à¹€à¸žà¸´à¹ˆà¸¡à¸£à¸µà¸§à¸´à¸§à¹à¸¥à¹‰à¸§");
    } catch (error: any) {
      showToast("à¸šà¸±à¸™à¸—à¸¶à¸à¹„à¸¡à¹ˆà¹„à¸”à¹‰: " + error.message, "error");
    }
    setEditing(null);
  };
  const del = async (id) => {
    if (!confirm("à¸¥à¸šà¸£à¸µà¸§à¸´à¸§à¸™à¸µà¹‰?")) return;
    const nr = reviews.filter(r => r.id !== id);
    setReviews(nr);
    try {
      await saveCmsSetting("reviews", nr);
      showToast("à¸¥à¸šà¸£à¸µà¸§à¸´à¸§à¹à¸¥à¹‰à¸§");
    } catch (error: any) {
      showToast("à¸¥à¸šà¹à¸¥à¹‰à¸§à¹à¸•à¹ˆà¸šà¸±à¸™à¸—à¸¶à¸à¸à¸²à¸™à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹„à¸¡à¹ˆà¹„à¸”à¹‰: " + error.message, "error");
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>à¸ˆà¸±à¸”à¸à¸²à¸£à¸£à¸µà¸§à¸´à¸§</h2>
        <CBtn onClick={() => setEditing({ id: "", name: "", company: "", stars: 5, text: "" })} color="#FF6B00">+ à¹€à¸žà¸´à¹ˆà¸¡à¸£à¸µà¸§à¸´à¸§</CBtn>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {reviews.map(r => (
          <div key={r.id} style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{r.name}</span>
                <span style={{ fontSize: 12, color: "#555" }}>{r.company}</span>
                <span style={{ color: "#F59E0B" }}>{"â˜…".repeat(r.stars)}{"â˜†".repeat(5 - r.stars)}</span>
              </div>
              <div style={{ fontSize: 13, color: "#888" }}>{r.text}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <CIconBtn onClick={() => setEditing({ ...r })}>âœï¸</CIconBtn>
              <CIconBtn onClick={() => del(r.id)} danger>ðŸ—‘ï¸</CIconBtn>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <CModal title={editing.id ? "à¹à¸à¹‰à¹„à¸‚à¸£à¸µà¸§à¸´à¸§" : "à¹€à¸žà¸´à¹ˆà¸¡à¸£à¸µà¸§à¸´à¸§"} onClose={() => setEditing(null)} width={480}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <CField label="à¸Šà¸·à¹ˆà¸­à¸œà¸¹à¹‰à¸£à¸µà¸§à¸´à¸§"><input value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} /></CField>
              <CField label="à¸šà¸£à¸´à¸©à¸±à¸—/à¸£à¹‰à¸²à¸™à¸„à¹‰à¸²"><input value={editing.company} onChange={e => setEditing(p => ({ ...p, company: e.target.value }))} /></CField>
            </div>
            <CField label="à¸”à¸²à¸§ (1-5)">
              <div style={{ display: "flex", gap: 6 }}>
                {[1,2,3,4,5].map(s => (
                  <button type="button" key={s} onClick={() => setEditing(p => ({ ...p, stars: s }))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: s <= editing.stars ? "#F59E0B" : "#333" }}>â˜…</button>
                ))}
              </div>
            </CField>
            <CField label="à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸£à¸µà¸§à¸´à¸§"><textarea value={editing.text} onChange={e => setEditing(p => ({ ...p, text: e.target.value }))} rows={4} /></CField>
            <div style={{ display: "flex", gap: 10 }}>
              <CBtn onClick={() => save(editing)} color="#FF6B00" style={{ flex: 1 }}>à¸šà¸±à¸™à¸—à¸¶à¸</CBtn>
              <CBtn onClick={() => setEditing(null)} outline style={{ flex: 1 }}>à¸¢à¸à¹€à¸¥à¸´à¸</CBtn>
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
    title: "à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥à¸«à¸™à¹‰à¸²à¸£à¹‰à¸²à¸™à¸­à¸²à¸«à¸²à¸£",
    category: "à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥",
    meta: "à¸Šà¹ˆà¸§à¸¢à¹ƒà¸«à¹‰à¹€à¸¡à¸™à¸¹à¹à¸¥à¸°à¹‚à¸›à¸£à¹‚à¸¡à¸Šà¸±à¸™à¸­à¹ˆà¸²à¸™à¸‡à¹ˆà¸²à¸¢à¸ˆà¸²à¸à¸«à¸™à¹‰à¸²à¸£à¹‰à¸²à¸™",
    alt: "à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥à¸«à¸™à¹‰à¸²à¸£à¹‰à¸²à¸™à¸­à¸²à¸«à¸²à¸£ Display Works Media",
    href: "/portfolio",
    image: "/images/portfolio/work-01.webp",
    img: "/images/portfolio/work-01.webp",
  },
  {
    id: "default-work-02",
    title: "à¸šà¸¹à¸˜à¹à¸¥à¸°à¸ªà¸·à¹ˆà¸­à¹à¸ªà¸”à¸‡à¸ªà¸´à¸™à¸„à¹‰à¸²",
    category: "Backdrop",
    meta: "à¸£à¸§à¸¡à¸ªà¸·à¹ˆà¸­à¸«à¸¥à¸²à¸¢à¸Šà¸´à¹‰à¸™à¹ƒà¸«à¹‰à¹à¸šà¸£à¸™à¸”à¹Œà¸”à¸¹à¸žà¸£à¹‰à¸­à¸¡à¹ƒà¸™à¸‡à¸²à¸™à¸­à¸µà¹€à¸§à¸™à¸•à¹Œ",
    alt: "à¸šà¸¹à¸˜à¹à¸¥à¸°à¸ªà¸·à¹ˆà¸­à¹à¸ªà¸”à¸‡à¸ªà¸´à¸™à¸„à¹‰à¸² Display Works Media",
    href: "/portfolio",
    image: "/images/portfolio/work-02.webp",
    img: "/images/portfolio/work-02.webp",
  },
  {
    id: "default-work-03",
    title: "à¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸²",
    category: "à¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸²",
    meta: "à¹€à¸žà¸´à¹ˆà¸¡à¸„à¸§à¸²à¸¡à¸™à¹ˆà¸²à¹€à¸Šà¸·à¹ˆà¸­à¸–à¸·à¸­à¹ƒà¸«à¹‰à¹à¸žà¹‡à¸à¹€à¸à¸ˆà¸ªà¸´à¸™à¸„à¹‰à¸²",
    alt: "à¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸² Display Works Media",
    href: "/portfolio",
    image: "/images/portfolio/work-06.webp",
    img: "/images/portfolio/work-06.webp",
  },
  {
    id: "default-work-04",
    title: "Backdrop à¸‡à¸²à¸™à¸­à¸µà¹€à¸§à¸™à¸•à¹Œ",
    category: "Backdrop",
    meta: "à¸ªà¸£à¹‰à¸²à¸‡à¸ˆà¸¸à¸”à¸–à¹ˆà¸²à¸¢à¸ à¸²à¸žà¹à¸¥à¸°à¸žà¸·à¹‰à¸™à¸—à¸µà¹ˆà¹à¸šà¸£à¸™à¸”à¹Œà¸—à¸µà¹ˆà¸Šà¸±à¸”à¹€à¸ˆà¸™",
    alt: "Backdrop à¸‡à¸²à¸™à¸­à¸µà¹€à¸§à¸™à¸•à¹Œ Display Works Media",
    href: "/portfolio",
    image: "/images/portfolio/work-03.webp",
    img: "/images/portfolio/work-03.webp",
  },
  {
    id: "default-work-05",
    title: "à¸‡à¸²à¸™à¸žà¸´à¸¡à¸žà¹Œà¹à¸„à¸¡à¹€à¸›à¸",
    category: "à¸ªà¸·à¹ˆà¸­à¹‚à¸†à¸©à¸“à¸²",
    meta: "à¸ªà¸·à¹ˆà¸­à¹‚à¸›à¸£à¹‚à¸¡à¸Šà¸±à¸™à¸—à¸µà¹ˆà¸Šà¹ˆà¸§à¸¢à¹ƒà¸«à¹‰à¸‚à¹‰à¸­à¹€à¸ªà¸™à¸­à¹€à¸«à¹‡à¸™à¸Šà¸±à¸”à¸‚à¸¶à¹‰à¸™",
    alt: "à¸‡à¸²à¸™à¸žà¸´à¸¡à¸žà¹Œà¹à¸„à¸¡à¹€à¸›à¸ Display Works Media",
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
      showToast("à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¸£à¸¹à¸›à¸ªà¸³à¹€à¸£à¹‡à¸ˆ");
    } catch {
      callback(URL.createObjectURL(file));
      showToast("à¹ƒà¸Šà¹‰ preview (à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸š Supabase Storage)", "error");
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
      showToast("à¸šà¸±à¸™à¸—à¸¶à¸à¸œà¸¥à¸‡à¸²à¸™à¹à¸¥à¹‰à¸§");
    } catch (error: any) {
      showToast("à¸šà¸±à¸™à¸—à¸¶à¸à¹„à¸¡à¹ˆà¹„à¸”à¹‰: " + error.message, "error");
    }
    setEditing(null);
  };
  const del = async (id) => {
    if (!confirm("à¸¥à¸šà¸œà¸¥à¸‡à¸²à¸™à¸™à¸µà¹‰?")) return;
    const ni = items.filter(i => i.id !== id);
    setItems(ni);
    try {
      await saveCmsSetting("portfolio", ni);
      showToast("à¸¥à¸šà¸œà¸¥à¸‡à¸²à¸™à¹à¸¥à¹‰à¸§");
    } catch (error: any) {
      showToast("à¸¥à¸šà¹à¸¥à¹‰à¸§à¹à¸•à¹ˆà¸šà¸±à¸™à¸—à¸¶à¸à¸à¸²à¸™à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹„à¸¡à¹ˆà¹„à¸”à¹‰: " + error.message, "error");
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>à¸ˆà¸±à¸”à¸à¸²à¸£à¸œà¸¥à¸‡à¸²à¸™</h2>
        <CBtn onClick={() => setEditing({ id: "", title: "", category: "", meta: "", alt: "", href: "", image: "", img: "" })} color="#FF6B00">+ à¹€à¸žà¸´à¹ˆà¸¡à¸œà¸¥à¸‡à¸²à¸™</CBtn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
        {items.map(item => (
          <div key={item.id} style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ height: 140, background: "#1A2233", position: "relative" }}>
              {(item.image || item.img) ? <img src={item.image || item.img} alt={item.alt || item.title || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 36 }}>ðŸ–¼</div>}
            </div>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{item.title || "à¹„à¸¡à¹ˆà¸¡à¸µà¸Šà¸·à¹ˆà¸­"}</div>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>{item.category}</div>
              <div style={{ fontSize: 11, color: "#7B8496", marginBottom: 10, lineHeight: 1.5 }}>{item.meta}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <CIconBtn onClick={() => setEditing(normalizeItem(item))} small>âœï¸</CIconBtn>
                <CIconBtn onClick={() => del(item.id)} danger small>ðŸ—‘ï¸</CIconBtn>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <EmptyState icon="ðŸ–¼" text="à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸œà¸¥à¸‡à¸²à¸™" />}
      </div>

      {editing && (
        <CModal title={editing.id ? "à¹à¸à¹‰à¹„à¸‚à¸œà¸¥à¸‡à¸²à¸™" : "à¹€à¸žà¸´à¹ˆà¸¡à¸œà¸¥à¸‡à¸²à¸™"} onClose={() => setEditing(null)} width={460}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <CField label="à¸£à¸¹à¸›à¸ à¸²à¸žà¸œà¸¥à¸‡à¸²à¸™">
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 120, height: 80, borderRadius: 8, overflow: "hidden", background: "#1A2233", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {(editing.image || editing.img) ? <img src={editing.image || editing.img} alt={editing.alt || editing.title || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24, opacity: 0.4 }}>ðŸ–¼</span>}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => uploadImg(e.target.files?.[0], url => setEditing(p => ({ ...p, image: url, img: url })))} />
                  <CBtn onClick={() => fileRef.current?.click()} color="#3B82F6" small disabled={uploading}>{uploading ? "â³..." : "ðŸ“ à¹€à¸¥à¸·à¸­à¸à¸£à¸¹à¸›"}</CBtn>
                  <input value={editing.image || editing.img} onChange={e => setEditing(p => ({ ...p, image: e.target.value, img: e.target.value }))} placeholder="à¸«à¸£à¸·à¸­à¸§à¸²à¸‡ URL" />
                </div>
              </div>
            </CField>
            <CField label="à¸Šà¸·à¹ˆà¸­à¸œà¸¥à¸‡à¸²à¸™"><input value={editing.title} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} /></CField>
            <CField label="à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢à¸œà¸¥à¸‡à¸²à¸™">
              <textarea value={editing.meta || ""} onChange={e => setEditing(p => ({ ...p, meta: e.target.value }))} rows={3} placeholder="à¹€à¸Šà¹ˆà¸™ à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥à¸«à¸™à¹‰à¸²à¸£à¹‰à¸²à¸™à¸­à¸²à¸«à¸²à¸£ à¸‚à¸™à¸²à¸” 4 x 2 à¹€à¸¡à¸•à¸£ à¸Šà¹ˆà¸§à¸¢à¹ƒà¸«à¹‰à¹‚à¸›à¸£à¹‚à¸¡à¸Šà¸±à¸™à¸­à¹ˆà¸²à¸™à¸Šà¸±à¸”à¸ˆà¸²à¸à¸£à¸°à¸¢à¸°à¸«à¸™à¹‰à¸²à¸£à¹‰à¸²à¸™" />
            </CField>
            <CField label="Alt Text à¸£à¸¹à¸›à¸ à¸²à¸ž">
              <input value={editing.alt || ""} onChange={e => setEditing(p => ({ ...p, alt: e.target.value }))} placeholder="à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢à¸£à¸¹à¸›à¸ªà¸³à¸«à¸£à¸±à¸š SEO à¹à¸¥à¸°à¸à¸²à¸£à¹€à¸‚à¹‰à¸²à¸–à¸¶à¸‡" />
            </CField>
            <CField label="à¸¥à¸´à¸‡à¸à¹Œà¹€à¸¡à¸·à¹ˆà¸­à¸„à¸¥à¸´à¸ (à¹„à¸¡à¹ˆà¸šà¸±à¸‡à¸„à¸±à¸š)">
              <input value={editing.href || ""} onChange={e => setEditing(p => ({ ...p, href: e.target.value }))} placeholder="/portfolio à¸«à¸£à¸·à¸­ /services/vinyl-banner" />
            </CField>
            <CField label="à¸«à¸¡à¸§à¸”à¸«à¸¡à¸¹à¹ˆ">
              <input value={editing.category} onChange={e => setEditing(p => ({ ...p, category: e.target.value }))} list="cat-port" placeholder="à¹€à¸Šà¹ˆà¸™ à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥" />
              <datalist id="cat-port">{["à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥","à¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œ","Roll Up","Backdrop","PP Board","à¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸²"].map(c => <option key={c} value={c} />)}</datalist>
            </CField>
            <div style={{ display: "flex", gap: 10 }}>
              <CBtn onClick={() => save(editing)} color="#FF6B00" style={{ flex: 1 }}>à¸šà¸±à¸™à¸—à¸¶à¸</CBtn>
              <CBtn onClick={() => setEditing(null)} outline style={{ flex: 1 }}>à¸¢à¸à¹€à¸¥à¸´à¸</CBtn>
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
    { title: "à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥à¸«à¸™à¹‰à¸²à¸£à¹‰à¸²à¸™", image: "/images/portfolio/1.png", meta: "à¸Šà¹ˆà¸§à¸¢à¹ƒà¸«à¹‰à¸£à¹‰à¸²à¸™à¹à¸¥à¸°à¹‚à¸›à¸£à¹‚à¸¡à¸Šà¸±à¸™à¸­à¹ˆà¸²à¸™à¸Šà¸±à¸”à¸ˆà¸²à¸à¸£à¸°à¸¢à¸°à¸«à¸™à¹‰à¸²à¸£à¹‰à¸²à¸™", category: "à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥", alt: "à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥à¸«à¸™à¹‰à¸²à¸£à¹‰à¸²à¸™ Display Works Media" },
    { title: "à¸›à¹‰à¸²à¸¢à¹‚à¸›à¸£à¹‚à¸¡à¸Šà¸±à¹ˆà¸™", image: "/images/portfolio/2.png", meta: "à¹ƒà¸Šà¹‰à¸ªà¸·à¹ˆà¸­à¸ªà¸²à¸£à¸£à¸²à¸„à¸² à¹€à¸¡à¸™à¸¹ à¸«à¸£à¸·à¸­à¹à¸„à¸¡à¹€à¸›à¸à¹ƒà¸«à¹‰à¸„à¸™à¹€à¸«à¹‡à¸™à¸—à¸±à¸™à¸—à¸µ", category: "à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥", alt: "à¸›à¹‰à¸²à¸¢à¹‚à¸›à¸£à¹‚à¸¡à¸Šà¸±à¹ˆà¸™ Display Works Media" },
    { title: "à¸›à¹‰à¸²à¸¢à¸›à¸£à¸°à¸Šà¸²à¸ªà¸±à¸¡à¸žà¸±à¸™à¸˜à¹Œ", image: "/images/portfolio/3.png", meta: "à¸›à¸£à¸°à¸ªà¸²à¸™à¸‚à¸™à¸²à¸”à¹à¸¥à¸°à¸§à¸±à¸ªà¸”à¸¸à¹ƒà¸«à¹‰à¹€à¸«à¸¡à¸²à¸°à¸à¸±à¸šà¸žà¸·à¹‰à¸™à¸—à¸µà¹ˆà¸•à¸´à¸”à¸•à¸±à¹‰à¸‡", category: "à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥", alt: "à¸›à¹‰à¸²à¸¢à¸›à¸£à¸°à¸Šà¸²à¸ªà¸±à¸¡à¸žà¸±à¸™à¸˜à¹Œ Display Works Media" },
  ],
  sticker: [
    { title: "à¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œà¸•à¸´à¸”à¸à¸£à¸°à¸ˆà¸", image: "/images/portfolio/sticker-1.jpg", meta: "à¹€à¸«à¸¡à¸²à¸°à¸à¸±à¸šà¸«à¸™à¹‰à¸²à¸£à¹‰à¸²à¸™ à¸à¸£à¸°à¸ˆà¸à¸­à¸­à¸Ÿà¸Ÿà¸´à¸¨ à¹à¸¥à¸°à¸žà¸·à¹‰à¸™à¸—à¸µà¹ˆ Indoor / Outdoor", category: "à¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œ", alt: "à¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œà¸•à¸´à¸”à¸à¸£à¸°à¸ˆà¸ Display Works Media" },
    { title: "à¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œà¸›à¸£à¸°à¸Šà¸²à¸ªà¸±à¸¡à¸žà¸±à¸™à¸˜à¹Œ", image: "/images/portfolio/sticker-2.jpg", meta: "à¸Šà¹ˆà¸§à¸¢à¸—à¸³à¹ƒà¸«à¹‰à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¹à¸„à¸¡à¹€à¸›à¸à¸”à¸¹à¸Šà¸±à¸”à¹à¸¥à¸°à¸•à¸´à¸”à¸•à¸±à¹‰à¸‡à¹€à¸›à¹‡à¸™à¸£à¸°à¹€à¸šà¸µà¸¢à¸š", category: "à¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œ", alt: "à¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œà¸›à¸£à¸°à¸Šà¸²à¸ªà¸±à¸¡à¸žà¸±à¸™à¸˜à¹Œ Display Works Media" },
    { title: "à¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œà¹„à¸”à¸„à¸±à¸—", image: "/images/portfolio/sticker-4.jpg", meta: "à¸•à¸±à¸”à¸•à¸²à¸¡à¸£à¸¹à¸›à¸—à¸£à¸‡à¹‚à¸¥à¹‚à¸à¹‰ à¸‰à¸¥à¸²à¸ à¸«à¸£à¸·à¸­à¸Šà¸´à¹‰à¸™à¸‡à¸²à¸™à¹€à¸‰à¸žà¸²à¸°à¹à¸šà¸£à¸™à¸”à¹Œ", category: "à¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œ", alt: "à¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œà¹„à¸”à¸„à¸±à¸— Display Works Media" },
  ],
  ppboard: [
    { title: "PP Board à¹‚à¸›à¸£à¹‚à¸¡à¸Šà¸±à¹ˆà¸™", image: "/images/portfolio/ppboard-1.png", meta: "à¸™à¹‰à¸³à¸«à¸™à¸±à¸à¹€à¸šà¸² à¹€à¸«à¸¡à¸²à¸°à¸à¸±à¸šà¹‚à¸›à¸£à¹‚à¸¡à¸Šà¸±à¸™à¸«à¸™à¹‰à¸²à¸£à¹‰à¸²à¸™à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸¢à¹‰à¸²à¸¢à¸•à¸³à¹à¸«à¸™à¹ˆà¸‡à¹„à¸”à¹‰", category: "PP Board", alt: "PP Board à¹‚à¸›à¸£à¹‚à¸¡à¸Šà¸±à¹ˆà¸™ Display Works Media" },
    { title: "Standee à¸«à¸™à¹‰à¸²à¸£à¹‰à¸²à¸™", image: "/images/portfolio/ppboard-2.png", meta: "à¸Šà¹ˆà¸§à¸¢à¹ƒà¸«à¹‰à¸ªà¸´à¸™à¸„à¹‰à¸² à¹€à¸¡à¸™à¸¹ à¸«à¸£à¸·à¸­à¸šà¸£à¸´à¸à¸²à¸£à¹€à¸”à¹ˆà¸™à¸‚à¸¶à¹‰à¸™à¹ƒà¸™à¸žà¸·à¹‰à¸™à¸—à¸µà¹ˆà¸‚à¸²à¸¢", category: "PP Board", alt: "Standee à¸«à¸™à¹‰à¸²à¸£à¹‰à¸²à¸™ Display Works Media" },
    { title: "à¸›à¹‰à¸²à¸¢à¸•à¸±à¹‰à¸‡à¸žà¸·à¹‰à¸™", image: "/images/portfolio/ppboard-3.png", meta: "à¸›à¸£à¸°à¹€à¸¡à¸´à¸™à¸‚à¸™à¸²à¸”à¸•à¸²à¸¡à¸•à¸³à¹à¸«à¸™à¹ˆà¸‡à¸§à¸²à¸‡à¹à¸¥à¸°à¸£à¸°à¸¢à¸°à¸¡à¸­à¸‡à¹€à¸«à¹‡à¸™", category: "PP Board", alt: "à¸›à¹‰à¸²à¸¢à¸•à¸±à¹‰à¸‡à¸žà¸·à¹‰à¸™ PP Board Display Works Media" },
  ],
  rollup: [
    { title: "Roll Up à¸ªà¸³à¸«à¸£à¸±à¸šà¸«à¸™à¹‰à¸²à¸£à¹‰à¸²à¸™", image: "/images/portfolio/rollup-1.png", meta: "à¸•à¸´à¸”à¸•à¸±à¹‰à¸‡à¸‡à¹ˆà¸²à¸¢ à¹€à¸«à¸¡à¸²à¸°à¸à¸±à¸šà¸žà¸·à¹‰à¸™à¸—à¸µà¹ˆà¸ˆà¸³à¸à¸±à¸”à¹à¸¥à¸°à¹ƒà¸Šà¹‰à¸‡à¸²à¸™à¸‹à¹‰à¸³à¹„à¸”à¹‰", category: "Roll Up", alt: "Roll Up à¸ªà¸³à¸«à¸£à¸±à¸šà¸«à¸™à¹‰à¸²à¸£à¹‰à¸²à¸™ Display Works Media" },
    { title: "Roll Up à¸ªà¸³à¸«à¸£à¸±à¸šà¹‚à¸›à¸£à¹‚à¸¡à¸Šà¸±à¹ˆà¸™", image: "/images/portfolio/rollup-2.png", meta: "à¸Šà¹ˆà¸§à¸¢à¹ƒà¸«à¹‰à¸šà¸¹à¸˜ à¸‡à¸²à¸™à¹à¸ªà¸”à¸‡à¸ªà¸´à¸™à¸„à¹‰à¸² à¹à¸¥à¸°à¸à¸´à¸ˆà¸à¸£à¸£à¸¡à¸”à¸¹à¸žà¸£à¹‰à¸­à¸¡à¸‚à¸¶à¹‰à¸™", category: "Roll Up", alt: "Roll Up à¸ªà¸³à¸«à¸£à¸±à¸šà¹‚à¸›à¸£à¹‚à¸¡à¸Šà¸±à¹ˆà¸™ Display Works Media" },
  ],
  label: [
    { title: "à¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸²à¸ªà¸³à¸«à¸£à¸±à¸šà¸šà¸£à¸£à¸ˆà¸¸à¸ à¸±à¸“à¸‘à¹Œ", image: "/images/portfolio/sticker-1.png", meta: "à¸Šà¹ˆà¸§à¸¢à¹ƒà¸«à¹‰à¹à¸žà¹‡à¸à¹€à¸à¸ˆà¸”à¸¹à¸™à¹ˆà¸²à¹€à¸Šà¸·à¹ˆà¸­à¸–à¸·à¸­à¹à¸¥à¸°à¸ªà¸·à¹ˆà¸­à¸ªà¸²à¸£à¹à¸šà¸£à¸™à¸”à¹Œà¸Šà¸±à¸”à¸‚à¸¶à¹‰à¸™", category: "à¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸²", alt: "à¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸²à¸ªà¸³à¸«à¸£à¸±à¸šà¸šà¸£à¸£à¸ˆà¸¸à¸ à¸±à¸“à¸‘à¹Œ Display Works Media" },
    { title: "à¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸²à¸à¸±à¸™à¸™à¹‰à¸³", image: "/images/portfolio/sticker-2.png", meta: "à¹€à¸«à¸¡à¸²à¸°à¸à¸±à¸šà¸­à¸²à¸«à¸²à¸£ à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡à¸”à¸·à¹ˆà¸¡ à¹à¸¥à¸°à¸ªà¸´à¸™à¸„à¹‰à¸²à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¹€à¸ˆà¸­à¸„à¸§à¸²à¸¡à¸Šà¸·à¹‰à¸™", category: "à¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸²", alt: "à¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸²à¸à¸±à¸™à¸™à¹‰à¸³ Display Works Media" },
    { title: "à¸‰à¸¥à¸²à¸à¹„à¸”à¸„à¸±à¸—", image: "/images/portfolio/sticker-4.png", meta: "à¸•à¸±à¸”à¸•à¸²à¸¡à¹‚à¸¥à¹‚à¸à¹‰à¸«à¸£à¸·à¸­à¸£à¸¹à¸›à¸—à¸£à¸‡à¹€à¸‰à¸žà¸²à¸°à¹€à¸žà¸·à¹ˆà¸­à¹€à¸žà¸´à¹ˆà¸¡à¸¡à¸¹à¸¥à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²", category: "à¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸²", alt: "à¸‰à¸¥à¸²à¸à¹„à¸”à¸„à¸±à¸— Display Works Media" },
  ],
  backdrop: [
    { title: "Backdrop à¸‡à¸²à¸™à¸­à¸µà¹€à¸§à¸™à¸•à¹Œ", image: "/images/portfolio/backdrop-1.png", meta: "à¸ªà¸£à¹‰à¸²à¸‡à¸‰à¸²à¸à¸«à¸¥à¸±à¸‡à¸—à¸µà¹ˆà¸Šà¹ˆà¸§à¸¢à¹ƒà¸«à¹‰à¸žà¸·à¹‰à¸™à¸—à¸µà¹ˆà¸ˆà¸±à¸”à¸‡à¸²à¸™à¸”à¸¹à¹€à¸›à¹‡à¸™à¹à¸šà¸£à¸™à¸”à¹Œà¹€à¸”à¸µà¸¢à¸§à¸à¸±à¸™", category: "Backdrop", alt: "Backdrop à¸‡à¸²à¸™à¸­à¸µà¹€à¸§à¸™à¸•à¹Œ Display Works Media" },
    { title: "Backdrop à¹€à¸›à¸´à¸”à¸•à¸±à¸§à¸ªà¸´à¸™à¸„à¹‰à¸²", image: "/images/portfolio/backdrop-2.png", meta: "à¸Šà¹ˆà¸§à¸¢à¹ƒà¸«à¹‰à¸ˆà¸¸à¸”à¸–à¹ˆà¸²à¸¢à¸ à¸²à¸žà¹à¸¥à¸°à¹€à¸§à¸—à¸µà¸ªà¸·à¹ˆà¸­à¸ªà¸²à¸£à¸ªà¸´à¸™à¸„à¹‰à¸²à¹€à¸”à¹ˆà¸™à¸‚à¸¶à¹‰à¸™", category: "Backdrop", alt: "Backdrop à¹€à¸›à¸´à¸”à¸•à¸±à¸§à¸ªà¸´à¸™à¸„à¹‰à¸² Display Works Media" },
    { title: "Backdrop à¸–à¹ˆà¸²à¸¢à¸ à¸²à¸ž", image: "/images/portfolio/backdrop-3.png", meta: "à¹à¸™à¸°à¸™à¸³à¸‚à¸™à¸²à¸”à¸•à¸²à¸¡à¸¡à¸¸à¸¡à¸à¸¥à¹‰à¸­à¸‡ à¸žà¸·à¹‰à¸™à¸—à¸µà¹ˆ à¹à¸¥à¸°à¸£à¸¹à¸›à¹à¸šà¸šà¸‡à¸²à¸™", category: "Backdrop", alt: "Backdrop à¸–à¹ˆà¸²à¸¢à¸ à¸²à¸ž Display Works Media" },
  ],
};

const defaultPageContent = {
  home: {
    servicesEyebrow: "OUR SERVICES",
    servicesTitle: "à¸šà¸£à¸´à¸à¸²à¸£à¸‚à¸­à¸‡à¹€à¸£à¸²",
    servicesSubtitle: "à¸„à¸£à¸šà¸§à¸‡à¸ˆà¸£à¸—à¸¸à¸à¸‡à¸²à¸™ à¸•à¸±à¹‰à¸‡à¹à¸•à¹ˆà¸‚à¸±à¹‰à¸™à¸•à¸­à¸™à¸à¸²à¸£à¸­à¸­à¸à¹à¸šà¸š à¸œà¸¥à¸´à¸• à¸ˆà¸™à¸–à¸¶à¸‡à¸à¸²à¸£à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡",
  },
  shared: {
    workflowEyebrow: "OUR PROCESS",
    workflowTitle: "à¸ˆà¸²à¸à¹„à¸­à¹€à¸”à¸µà¸¢ à¸ªà¸¹à¹ˆà¸à¸²à¸£à¸¡à¸­à¸‡à¹€à¸«à¹‡à¸™",
    workflowSubtitle: "à¸à¸£à¸°à¸šà¸§à¸™à¸à¸²à¸£à¸—à¸³à¸‡à¸²à¸™à¸—à¸µà¹ˆà¹ƒà¸ªà¹ˆà¹ƒà¸ˆà¹ƒà¸™à¸—à¸¸à¸à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸” à¹€à¸žà¸·à¹ˆà¸­à¸œà¸¥à¸‡à¸²à¸™à¸—à¸µà¹ˆà¸¡à¸µà¸„à¸¸à¸“à¸ à¸²à¸žà¹à¸¥à¸°à¸•à¸£à¸‡à¸•à¸²à¸¡à¹€à¸›à¹‰à¸²à¸«à¸¡à¸²à¸¢",
    portfolioEyebrow: "OUR WORK",
    portfolioTitle: "à¸œà¸¥à¸‡à¸²à¸™à¸‚à¸­à¸‡à¹€à¸£à¸²",
    portfolioSubtitle: "à¸•à¸±à¸§à¸­à¸¢à¹ˆà¸²à¸‡à¸œà¸¥à¸‡à¸²à¸™à¸ˆà¸£à¸´à¸‡à¸—à¸µà¹ˆà¸œà¸¥à¸´à¸•à¹à¸¥à¸°à¸ªà¹ˆà¸‡à¸¡à¸­à¸šà¹ƒà¸«à¹‰à¸¥à¸¹à¸à¸„à¹‰à¸² à¸”à¹‰à¸§à¸¢à¸¡à¸²à¸•à¸£à¸à¸²à¸™à¹€à¸”à¸µà¸¢à¸§à¸à¸±à¸™à¹ƒà¸™à¸—à¸¸à¸à¸›à¸£à¸°à¹€à¸ à¸—à¸‡à¸²à¸™",
    quoteEyebrow: "FREE CONSULTATION",
    quoteTitle: "à¸¡à¸µà¸‡à¸²à¸™à¸­à¸¢à¸¹à¹ˆ?\nà¹€à¸£à¸²à¸Šà¹ˆà¸§à¸¢à¸”à¸¹à¹à¸¥à¹ƒà¸«à¹‰",
    quoteSubtitle: "à¸à¸£à¸­à¸à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¸‡à¸²à¸™ à¸—à¸µà¸¡à¸‡à¸²à¸™à¸ˆà¸°à¸•à¸´à¸”à¸•à¹ˆà¸­à¸à¸¥à¸±à¸šà¸ à¸²à¸¢à¹ƒà¸™ 24 à¸Šà¸±à¹ˆà¸§à¹‚à¸¡à¸‡",
  },
  about: {
    eyebrow: "à¹€à¸à¸µà¹ˆà¸¢à¸§à¸à¸±à¸šà¹€à¸£à¸²",
    title: "à¸œà¸¹à¹‰à¹€à¸Šà¸µà¹ˆà¸¢à¸§à¸Šà¸²à¸à¸”à¹‰à¸²à¸™à¸‡à¸²à¸™à¸žà¸´à¸¡à¸žà¹Œà¹à¸¥à¸°à¸ªà¸·à¹ˆà¸­à¹‚à¸†à¸©à¸“à¸²à¸„à¸£à¸šà¸§à¸‡à¸ˆà¸£",
    subtitle: "à¹ƒà¸«à¹‰à¸„à¸³à¸›à¸£à¸¶à¸à¸©à¸² à¸­à¸­à¸à¹à¸šà¸š à¸œà¸¥à¸´à¸• à¹à¸¥à¸°à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡à¸ªà¸·à¹ˆà¸­à¹‚à¸†à¸©à¸“à¸²à¸„à¸¸à¸“à¸ à¸²à¸ž à¹€à¸žà¸·à¹ˆà¸­à¸Šà¹ˆà¸§à¸¢à¹ƒà¸«à¹‰à¸˜à¸¸à¸£à¸à¸´à¸ˆà¸‚à¸­à¸‡à¸„à¸¸à¸“à¹‚à¸”à¸”à¹€à¸”à¹ˆà¸™à¹à¸¥à¸°à¸™à¹ˆà¸²à¸ˆà¸”à¸ˆà¸³à¸¡à¸²à¸à¸¢à¸´à¹ˆà¸‡à¸‚à¸¶à¹‰à¸™",
  },
  services: {
    eyebrow: "OUR SERVICES",
    title: "à¸šà¸£à¸´à¸à¸²à¸£à¸‡à¸²à¸™à¸›à¹‰à¸²à¸¢à¹à¸¥à¸°à¸‡à¸²à¸™à¸žà¸´à¸¡à¸žà¹Œà¸ªà¸³à¸«à¸£à¸±à¸šà¸˜à¸¸à¸£à¸à¸´à¸ˆ",
    subtitle: "à¹€à¸¥à¸·à¸­à¸à¸›à¸£à¸°à¹€à¸ à¸—à¸‡à¸²à¸™à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸à¸²à¸£ à¸—à¸µà¸¡ Display Works Media à¸Šà¹ˆà¸§à¸¢à¹à¸™à¸°à¸™à¸³à¸§à¸±à¸ªà¸”à¸¸ à¸•à¸£à¸§à¸ˆà¹„à¸Ÿà¸¥à¹Œ à¸›à¸£à¸°à¹€à¸¡à¸´à¸™à¸£à¸²à¸„à¸² à¹à¸¥à¸°à¸”à¸¹à¹à¸¥à¸à¸²à¸£à¸œà¸¥à¸´à¸•à¹ƒà¸«à¹‰à¹€à¸«à¸¡à¸²à¸°à¸à¸±à¸šà¸à¸²à¸£à¹ƒà¸Šà¹‰à¸‡à¸²à¸™à¸ˆà¸£à¸´à¸‡",
  },
  contact: {
    eyebrow: "à¸•à¸´à¸”à¸•à¹ˆà¸­à¹€à¸£à¸²",
    title: "à¸à¸³à¸¥à¸±à¸‡à¸¡à¸­à¸‡à¸«à¸²à¸‡à¸²à¸™à¸›à¹‰à¸²à¸¢à¸«à¸£à¸·à¸­à¸ªà¸·à¹ˆà¸­à¹‚à¸†à¸©à¸“à¸²?",
    subtitle: "à¸•à¸´à¸”à¸•à¹ˆà¸­à¸ªà¸­à¸šà¸–à¸²à¸¡à¹à¸¥à¸°à¸›à¸£à¸¶à¸à¸©à¸²à¹„à¸”à¹‰à¸Ÿà¸£à¸µ à¸—à¸µà¸¡à¸‡à¸²à¸™à¸žà¸£à¹‰à¸­à¸¡à¹ƒà¸«à¹‰à¸„à¸³à¹à¸™à¸°à¸™à¸³à¹à¸¥à¸°à¸›à¸£à¸°à¹€à¸¡à¸´à¸™à¸£à¸²à¸„à¸²à¹€à¸šà¸·à¹‰à¸­à¸‡à¸•à¹‰à¸™à¹‚à¸”à¸¢à¹„à¸¡à¹ˆà¸¡à¸µà¸„à¹ˆà¸²à¹ƒà¸Šà¹‰à¸ˆà¹ˆà¸²à¸¢",
  },
  faq: {
    eyebrow: "FAQ",
    title: "à¸„à¸³à¸–à¸²à¸¡à¸—à¸µà¹ˆà¸žà¸šà¸šà¹ˆà¸­à¸¢à¸à¹ˆà¸­à¸™à¸ªà¸±à¹ˆà¸‡à¸œà¸¥à¸´à¸•à¸‡à¸²à¸™à¸›à¹‰à¸²à¸¢",
    subtitle: "à¸£à¸§à¸¡à¸„à¸³à¸•à¸­à¸šà¹€à¸£à¸·à¹ˆà¸­à¸‡à¸‚à¸±à¹‰à¸™à¸•à¹ˆà¸³ à¸£à¸°à¸¢à¸°à¹€à¸§à¸¥à¸²à¸œà¸¥à¸´à¸• à¹„à¸Ÿà¸¥à¹Œ Artwork à¸à¸²à¸£à¸Šà¸³à¸£à¸°à¹€à¸‡à¸´à¸™ à¹à¸¥à¸°à¸à¸²à¸£à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡ à¹€à¸žà¸·à¹ˆà¸­à¸Šà¹ˆà¸§à¸¢à¹ƒà¸«à¹‰à¹€à¸•à¸£à¸µà¸¢à¸¡à¸‡à¸²à¸™à¹„à¸”à¹‰à¸‡à¹ˆà¸²à¸¢à¸‚à¸¶à¹‰à¸™",
  },
  footer: {
    eyebrow: "FREE CONSULTATION",
    title: "à¸žà¸£à¹‰à¸­à¸¡à¹ƒà¸«à¹‰à¸„à¸³à¸›à¸£à¸¶à¸à¸©à¸²à¹à¸¥à¸°à¸œà¸¥à¸´à¸•à¸ªà¸·à¹ˆà¸­à¹‚à¸†à¸©à¸“à¸²à¸ªà¸³à¸«à¸£à¸±à¸šà¸˜à¸¸à¸£à¸à¸´à¸ˆà¸‚à¸­à¸‡à¸„à¸¸à¸“",
    subtitle: "à¸ªà¸­à¸šà¸–à¸²à¸¡à¸‡à¸²à¸™à¹à¸¥à¸°à¸›à¸£à¸°à¹€à¸¡à¸´à¸™à¸£à¸²à¸„à¸²à¹€à¸šà¸·à¹‰à¸­à¸‡à¸•à¹‰à¸™à¸Ÿà¸£à¸µ",
  },
  servicesDetail: {
    vinyl: {
      eyebrow: "à¸šà¸£à¸´à¸à¸²à¸£à¸­à¸­à¸à¹à¸šà¸šà¹à¸¥à¸°à¸œà¸¥à¸´à¸•",
      title: "à¸›à¹‰à¸²à¸¢à¹„à¸§à¸™à¸´à¸¥",
      highlight: "à¸„à¸¸à¸“à¸ à¸²à¸žà¸ªà¸¹à¸‡",
      subtitle: "à¸žà¸´à¸¡à¸žà¹Œà¹„à¸§à¸™à¸´à¸¥à¸ªà¸µà¸ªà¸” à¸„à¸¡à¸Šà¸±à¸” à¸—à¸™à¹à¸”à¸” à¸—à¸™à¸à¸™ à¹€à¸«à¸¡à¸²à¸°à¸ªà¸³à¸«à¸£à¸±à¸šà¸›à¹‰à¸²à¸¢à¸£à¹‰à¸²à¸™à¸„à¹‰à¸² à¹‚à¸†à¸©à¸“à¸² à¹‚à¸›à¸£à¹‚à¸¡à¸Šà¸±à¹ˆà¸™ à¹à¸¥à¸°à¸•à¸à¹à¸•à¹ˆà¸‡à¸­à¸²à¸„à¸²à¸£à¸—à¸¸à¸à¸›à¸£à¸°à¹€à¸ à¸—",
    },
    sticker: {
      eyebrow: "à¸šà¸£à¸´à¸à¸²à¸£à¸­à¸­à¸à¹à¸šà¸šà¹à¸¥à¸°à¸œà¸¥à¸´à¸•",
      title: "à¸ªà¸±à¹ˆà¸‡à¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œ",
      highlight: "à¸„à¸¸à¸“à¸ à¸²à¸žà¸ªà¸¹à¸‡",
      subtitle: "à¸žà¸´à¸¡à¸žà¹Œà¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œà¸ªà¸µà¸ªà¸” à¸„à¸¡à¸Šà¸±à¸” à¹„à¸”à¸„à¸±à¸—à¹„à¸”à¹‰à¸•à¸²à¸¡à¸£à¸¹à¸›à¹à¸šà¸šà¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸à¸²à¸£ à¸£à¸­à¸‡à¸£à¸±à¸šà¸—à¸±à¹‰à¸‡à¸‡à¸²à¸™ Indoor à¹à¸¥à¸° Outdoor à¹€à¸«à¸¡à¸²à¸°à¸ªà¸³à¸«à¸£à¸±à¸šà¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸²à¹à¸¥à¸°à¸•à¸à¹à¸•à¹ˆà¸‡à¸à¸£à¸°à¸ˆà¸à¸£à¹‰à¸²à¸™",
    },
    backdrop: {
      eyebrow: "à¸šà¸£à¸´à¸à¸²à¸£à¸­à¸­à¸à¹à¸šà¸šà¹à¸¥à¸°à¸œà¸¥à¸´à¸•à¹à¸šà¹‡à¸„à¸”à¸£à¸­à¸›",
      title: "à¹à¸šà¹‡à¸„à¸”à¸£à¸­à¸›",
      highlight: "à¸‰à¸²à¸à¸«à¸¥à¸±à¸‡à¸ˆà¸±à¸”à¸‡à¸²à¸™",
      subtitle: "à¸œà¸¥à¸´à¸•à¹à¸šà¹‡à¸„à¸”à¸£à¸­à¸›à¸ªà¸³à¸«à¸£à¸±à¸šà¸‡à¸²à¸™à¸­à¸µà¹€à¸§à¸™à¸•à¹Œ à¸™à¸´à¸—à¸£à¸£à¸¨à¸à¸²à¸£ à¹à¸¥à¸°à¸‡à¸²à¸™à¹à¸•à¹ˆà¸‡à¸‡à¸²à¸™ à¸ à¸²à¸žà¸„à¸¡à¸Šà¸±à¸” à¹‚à¸„à¸£à¸‡à¸ªà¸£à¹‰à¸²à¸‡à¹à¸‚à¹‡à¸‡à¹à¸£à¸‡ à¸•à¸´à¸”à¸•à¸±à¹‰à¸‡à¸‡à¹ˆà¸²à¸¢ à¸ªà¸°à¸à¸”à¸—à¸¸à¸à¸ªà¸²à¸¢à¸•à¸²à¹ƒà¸«à¹‰à¸‡à¸²à¸™à¸„à¸¸à¸“à¹‚à¸”à¸”à¹€à¸”à¹ˆà¸™à¸¢à¸´à¹ˆà¸‡à¸‚à¸¶à¹‰à¸™",
    },
    rollup: {
      eyebrow: "à¸šà¸£à¸´à¸à¸²à¸£à¸žà¸´à¸¡à¸žà¹Œà¹à¸¥à¸°à¸ˆà¸±à¸”à¸ˆà¸³à¸«à¸™à¹ˆà¸²à¸¢à¹‚à¸„à¸£à¸‡",
      title: "Roll Up",
      highlight: "/ X-Stand",
      subtitle: "à¸›à¹‰à¸²à¸¢à¸•à¸±à¹‰à¸‡à¸žà¸·à¹‰à¸™à¹€à¸„à¸¥à¸·à¹ˆà¸­à¸™à¸—à¸µà¹ˆ à¸•à¸´à¸”à¸•à¸±à¹‰à¸‡à¸‡à¹ˆà¸²à¸¢à¸ à¸²à¸¢à¹ƒà¸™ 1 à¸™à¸²à¸—à¸µ à¸¡à¸²à¸žà¸£à¹‰à¸­à¸¡à¸à¸£à¸°à¹€à¸›à¹‹à¸²à¸žà¸à¸žà¸²à¸ªà¸°à¸”à¸§à¸ à¹€à¸«à¸¡à¸²à¸°à¸ªà¸³à¸«à¸£à¸±à¸šà¸‡à¸²à¸™à¸­à¸­à¸à¸šà¸¹à¸˜ à¸™à¸´à¸—à¸£à¸£à¸¨à¸à¸²à¸£ à¹à¸¥à¸°à¸›à¹‰à¸²à¸¢à¸ªà¹ˆà¸‡à¹€à¸ªà¸£à¸´à¸¡à¸à¸²à¸£à¸‚à¸²à¸¢à¸«à¸™à¹‰à¸²à¸£à¹‰à¸²à¸™ à¸žà¸´à¸¡à¸žà¹Œà¸ªà¸µà¸„à¸¡à¸Šà¸±à¸”à¹‚à¸”à¸”à¹€à¸”à¹ˆà¸™",
    },
    ppboard: {
      eyebrow: "à¸šà¸£à¸´à¸à¸²à¸£à¸­à¸­à¸à¹à¸šà¸šà¹à¸¥à¸°à¸œà¸¥à¸´à¸•",
      title: "PP Board",
      highlight: "/ Standee",
      subtitle: "à¸›à¹‰à¸²à¸¢ PP Board à¸™à¹‰à¸³à¸«à¸™à¸±à¸à¹€à¸šà¸² à¹€à¸«à¸¡à¸²à¸°à¸à¸±à¸šà¸›à¹‰à¸²à¸¢à¸•à¸±à¹‰à¸‡à¸žà¸·à¹‰à¸™ à¸›à¹‰à¸²à¸¢à¹‚à¸›à¸£à¹‚à¸¡à¸Šà¸±à¹ˆà¸™ à¹à¸¥à¸°à¸ªà¸·à¹ˆà¸­à¸«à¸™à¹‰à¸²à¸£à¹‰à¸²à¸™à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¸„à¸§à¸²à¸¡à¸„à¸¡à¸Šà¸±à¸” à¹€à¸„à¸¥à¸·à¹ˆà¸­à¸™à¸¢à¹‰à¸²à¸¢à¸‡à¹ˆà¸²à¸¢ à¹à¸¥à¸°à¸œà¸¥à¸´à¸•à¸•à¸²à¸¡à¸‚à¸™à¸²à¸”à¹„à¸”à¹‰",
    },
    label: {
      eyebrow: "à¸šà¸£à¸´à¸à¸²à¸£à¸žà¸´à¸¡à¸žà¹Œà¹à¸¥à¸°à¹„à¸”à¸„à¸±à¸—à¸ªà¸•à¸´à¸à¹€à¸à¸­à¸£à¹Œ",
      title: "à¸žà¸´à¸¡à¸žà¹Œà¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸²",
      highlight: "à¸£à¸°à¸šà¸šà¸”à¸´à¸ˆà¸´à¸•à¸­à¸¥",
      subtitle: "à¸¢à¸à¸£à¸°à¸”à¸±à¸šà¹à¸šà¸£à¸™à¸”à¹Œà¸‚à¸­à¸‡à¸„à¸¸à¸“à¸”à¹‰à¸§à¸¢à¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸²à¸ªà¸µà¸ªà¸” à¸„à¸¡à¸Šà¸±à¸” à¹„à¸”à¸„à¸±à¸—à¸Ÿà¸£à¸µà¸Ÿà¸­à¸£à¹Œà¸¡ à¸¥à¸­à¸à¹à¸›à¸°à¸‡à¹ˆà¸²à¸¢ à¸•à¸´à¸”à¹à¸™à¹ˆà¸™à¸—à¸™à¸™à¸²à¸™ à¸£à¸­à¸‡à¸£à¸±à¸šà¸‡à¸²à¸™à¸à¸±à¸™à¸™à¹‰à¸³ à¹à¸Šà¹ˆà¹€à¸¢à¹‡à¸™à¹„à¸”à¹‰ 100%",
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
      showToast("à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¸£à¸¹à¸›à¸œà¸¥à¸‡à¸²à¸™à¹à¸¥à¹‰à¸§");
    } catch (error: any) {
      showToast("à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¸£à¸¹à¸›à¹„à¸¡à¹ˆà¹„à¸”à¹‰: " + error.message, "error");
    } finally {
      setServicePortfolioUploading("");
    }
  };

  const save = async () => {
    try {
      await saveCmsSetting("page_content", content);
      showToast("à¸šà¸±à¸™à¸—à¸¶à¸à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸£à¸²à¸¢à¸«à¸™à¹‰à¸²à¹à¸¥à¹‰à¸§");
    } catch (error: any) {
      showToast("à¸šà¸±à¸™à¸—à¸¶à¸à¹„à¸¡à¹ˆà¹„à¸”à¹‰: " + error.message, "error");
    }
  };

  const fields: Record<string, Array<{ key: string; label: string; rows?: number }>> = {
    home: [
      { key: "servicesEyebrow", label: "à¸›à¹‰à¸²à¸¢à¸à¸³à¸à¸±à¸šà¸ªà¹ˆà¸§à¸™à¸šà¸£à¸´à¸à¸²à¸£" },
      { key: "servicesTitle", label: "à¸«à¸±à¸§à¸‚à¹‰à¸­à¸šà¸£à¸´à¸à¸²à¸£" },
      { key: "servicesSubtitle", label: "à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢à¸šà¸£à¸´à¸à¸²à¸£", rows: 3 },
    ],
    shared: [
      { key: "workflowEyebrow", label: "à¸›à¹‰à¸²à¸¢à¸à¸³à¸à¸±à¸šà¸‚à¸±à¹‰à¸™à¸•à¸­à¸™à¸à¸²à¸£à¸—à¸³à¸‡à¸²à¸™" },
      { key: "workflowTitle", label: "à¸«à¸±à¸§à¸‚à¹‰à¸­à¸‚à¸±à¹‰à¸™à¸•à¸­à¸™à¸à¸²à¸£à¸—à¸³à¸‡à¸²à¸™" },
      { key: "workflowSubtitle", label: "à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢à¸‚à¸±à¹‰à¸™à¸•à¸­à¸™à¸à¸²à¸£à¸—à¸³à¸‡à¸²à¸™", rows: 3 },
      { key: "portfolioEyebrow", label: "à¸›à¹‰à¸²à¸¢à¸à¸³à¸à¸±à¸šà¸œà¸¥à¸‡à¸²à¸™" },
      { key: "portfolioTitle", label: "à¸«à¸±à¸§à¸‚à¹‰à¸­à¸œà¸¥à¸‡à¸²à¸™" },
      { key: "portfolioSubtitle", label: "à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢à¸œà¸¥à¸‡à¸²à¸™", rows: 3 },
      { key: "quoteEyebrow", label: "à¸›à¹‰à¸²à¸¢à¸à¸³à¸à¸±à¸šà¸Ÿà¸­à¸£à¹Œà¸¡" },
      { key: "quoteTitle", label: "à¸«à¸±à¸§à¸‚à¹‰à¸­à¸Ÿà¸­à¸£à¹Œà¸¡ (à¸‚à¸¶à¹‰à¸™à¸šà¸£à¸£à¸—à¸±à¸”à¹ƒà¸«à¸¡à¹ˆà¹„à¸”à¹‰)", rows: 2 },
      { key: "quoteSubtitle", label: "à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢à¸Ÿà¸­à¸£à¹Œà¸¡", rows: 2 },
    ],
    about: [
      { key: "eyebrow", label: "à¸›à¹‰à¸²à¸¢à¸à¸³à¸à¸±à¸š" },
      { key: "title", label: "à¸«à¸±à¸§à¸‚à¹‰à¸­à¸«à¸¥à¸±à¸", rows: 2 },
      { key: "subtitle", label: "à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢", rows: 3 },
    ],
    services: [
      { key: "eyebrow", label: "à¸›à¹‰à¸²à¸¢à¸à¸³à¸à¸±à¸š" },
      { key: "title", label: "à¸«à¸±à¸§à¸‚à¹‰à¸­à¸«à¸¥à¸±à¸", rows: 2 },
      { key: "subtitle", label: "à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢", rows: 3 },
    ],
    contact: [
      { key: "eyebrow", label: "à¸›à¹‰à¸²à¸¢à¸à¸³à¸à¸±à¸š" },
      { key: "title", label: "à¸«à¸±à¸§à¸‚à¹‰à¸­à¸«à¸¥à¸±à¸", rows: 2 },
      { key: "subtitle", label: "à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢", rows: 3 },
    ],
    faq: [
      { key: "eyebrow", label: "à¸›à¹‰à¸²à¸¢à¸à¸³à¸à¸±à¸š" },
      { key: "title", label: "à¸«à¸±à¸§à¸‚à¹‰à¸­à¸«à¸¥à¸±à¸", rows: 2 },
      { key: "subtitle", label: "à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢", rows: 3 },
    ],
    footer: [
      { key: "eyebrow", label: "à¸›à¹‰à¸²à¸¢à¸à¸³à¸à¸±à¸š" },
      { key: "title", label: "à¸«à¸±à¸§à¸‚à¹‰à¸­" },
      { key: "subtitle", label: "à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢" },
    ],
    "servicesDetail.vinyl": [
      { key: "eyebrow", label: "à¸›à¹‰à¸²à¸¢à¸à¸³à¸à¸±à¸š" },
      { key: "title", label: "à¸«à¸±à¸§à¸‚à¹‰à¸­à¸šà¸£à¸£à¸—à¸±à¸”à¸«à¸¥à¸±à¸" },
      { key: "highlight", label: "à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸ªà¸µà¸ªà¹‰à¸¡" },
      { key: "subtitle", label: "à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢", rows: 3 },
      { key: "portfolioEyebrow", label: "à¸›à¹‰à¸²à¸¢à¸à¸³à¸à¸±à¸šà¸ªà¹ˆà¸§à¸™à¸œà¸¥à¸‡à¸²à¸™" },
      { key: "portfolioTitle", label: "à¸«à¸±à¸§à¸‚à¹‰à¸­à¸ªà¹ˆà¸§à¸™à¸œà¸¥à¸‡à¸²à¸™" },
      { key: "portfolioSubtitle", label: "à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢à¸ªà¹ˆà¸§à¸™à¸œà¸¥à¸‡à¸²à¸™", rows: 3 },
    ],
    "servicesDetail.sticker": [
      { key: "eyebrow", label: "à¸›à¹‰à¸²à¸¢à¸à¸³à¸à¸±à¸š" },
      { key: "title", label: "à¸«à¸±à¸§à¸‚à¹‰à¸­à¸šà¸£à¸£à¸—à¸±à¸”à¸«à¸¥à¸±à¸" },
      { key: "highlight", label: "à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸ªà¸µà¸ªà¹‰à¸¡" },
      { key: "subtitle", label: "à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢", rows: 3 },
      { key: "portfolioEyebrow", label: "à¸›à¹‰à¸²à¸¢à¸à¸³à¸à¸±à¸šà¸ªà¹ˆà¸§à¸™à¸œà¸¥à¸‡à¸²à¸™" },
      { key: "portfolioTitle", label: "à¸«à¸±à¸§à¸‚à¹‰à¸­à¸ªà¹ˆà¸§à¸™à¸œà¸¥à¸‡à¸²à¸™" },
      { key: "portfolioSubtitle", label: "à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢à¸ªà¹ˆà¸§à¸™à¸œà¸¥à¸‡à¸²à¸™", rows: 3 },
    ],
    "servicesDetail.backdrop": [
      { key: "eyebrow", label: "à¸›à¹‰à¸²à¸¢à¸à¸³à¸à¸±à¸š" },
      { key: "title", label: "à¸«à¸±à¸§à¸‚à¹‰à¸­à¸šà¸£à¸£à¸—à¸±à¸”à¸«à¸¥à¸±à¸" },
      { key: "highlight", label: "à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸ªà¸µà¸ªà¹‰à¸¡" },
      { key: "subtitle", label: "à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢", rows: 3 },
      { key: "portfolioEyebrow", label: "à¸›à¹‰à¸²à¸¢à¸à¸³à¸à¸±à¸šà¸ªà¹ˆà¸§à¸™à¸œà¸¥à¸‡à¸²à¸™" },
      { key: "portfolioTitle", label: "à¸«à¸±à¸§à¸‚à¹‰à¸­à¸ªà¹ˆà¸§à¸™à¸œà¸¥à¸‡à¸²à¸™" },
      { key: "portfolioSubtitle", label: "à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢à¸ªà¹ˆà¸§à¸™à¸œà¸¥à¸‡à¸²à¸™", rows: 3 },
    ],
    "servicesDetail.rollup": [
      { key: "eyebrow", label: "à¸›à¹‰à¸²à¸¢à¸à¸³à¸à¸±à¸š" },
      { key: "title", label: "à¸«à¸±à¸§à¸‚à¹‰à¸­à¸šà¸£à¸£à¸—à¸±à¸”à¸«à¸¥à¸±à¸" },
      { key: "highlight", label: "à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸ªà¸µà¸ªà¹‰à¸¡" },
      { key: "subtitle", label: "à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢", rows: 3 },
      { key: "portfolioEyebrow", label: "à¸›à¹‰à¸²à¸¢à¸à¸³à¸à¸±à¸šà¸ªà¹ˆà¸§à¸™à¸œà¸¥à¸‡à¸²à¸™" },
      { key: "portfolioTitle", label: "à¸«à¸±à¸§à¸‚à¹‰à¸­à¸ªà¹ˆà¸§à¸™à¸œà¸¥à¸‡à¸²à¸™" },
      { key: "portfolioSubtitle", label: "à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢à¸ªà¹ˆà¸§à¸™à¸œà¸¥à¸‡à¸²à¸™", rows: 3 },
    ],
    "servicesDetail.ppboard": [
      { key: "eyebrow", label: "à¸›à¹‰à¸²à¸¢à¸à¸³à¸à¸±à¸š" },
      { key: "title", label: "à¸«à¸±à¸§à¸‚à¹‰à¸­à¸šà¸£à¸£à¸—à¸±à¸”à¸«à¸¥à¸±à¸" },
      { key: "highlight", label: "à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸ªà¸µà¸ªà¹‰à¸¡" },
      { key: "subtitle", label: "à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢", rows: 3 },
      { key: "portfolioEyebrow", label: "à¸›à¹‰à¸²à¸¢à¸à¸³à¸à¸±à¸šà¸ªà¹ˆà¸§à¸™à¸œà¸¥à¸‡à¸²à¸™" },
      { key: "portfolioTitle", label: "à¸«à¸±à¸§à¸‚à¹‰à¸­à¸ªà¹ˆà¸§à¸™à¸œà¸¥à¸‡à¸²à¸™" },
      { key: "portfolioSubtitle", label: "à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢à¸ªà¹ˆà¸§à¸™à¸œà¸¥à¸‡à¸²à¸™", rows: 3 },
    ],
    "servicesDetail.label": [
      { key: "eyebrow", label: "à¸›à¹‰à¸²à¸¢à¸à¸³à¸à¸±à¸š" },
      { key: "title", label: "à¸«à¸±à¸§à¸‚à¹‰à¸­à¸šà¸£à¸£à¸—à¸±à¸”à¸«à¸¥à¸±à¸" },
      { key: "highlight", label: "à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸ªà¸µà¸ªà¹‰à¸¡" },
      { key: "subtitle", label: "à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢", rows: 3 },
      { key: "portfolioEyebrow", label: "à¸›à¹‰à¸²à¸¢à¸à¸³à¸à¸±à¸šà¸ªà¹ˆà¸§à¸™à¸œà¸¥à¸‡à¸²à¸™" },
      { key: "portfolioTitle", label: "à¸«à¸±à¸§à¸‚à¹‰à¸­à¸ªà¹ˆà¸§à¸™à¸œà¸¥à¸‡à¸²à¸™" },
      { key: "portfolioSubtitle", label: "à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢à¸ªà¹ˆà¸§à¸™à¸œà¸¥à¸‡à¸²à¸™", rows: 3 },
    ],
  };

  const sections = [
    ["home", "à¸«à¸™à¹‰à¸²à¹à¸£à¸"],
    ["shared", "à¸ªà¹ˆà¸§à¸™à¸à¸¥à¸²à¸‡à¸—à¸¸à¸à¸«à¸™à¹‰à¸²"],
    ["about", "à¹€à¸à¸µà¹ˆà¸¢à¸§à¸à¸±à¸šà¹€à¸£à¸²"],
    ["services", "à¸šà¸£à¸´à¸à¸²à¸£"],
    ["contact", "à¸•à¸´à¸”à¸•à¹ˆà¸­à¹€à¸£à¸²"],
    ["faq", "FAQ"],
    ["footer", "Footer"],
    ["servicesDetail.vinyl", "à¸šà¸£à¸´à¸à¸²à¸£: à¹„à¸§à¸™à¸´à¸¥"],
    ["servicesDetail.sticker", "à¸šà¸£à¸´à¸à¸²à¸£: à¸ªà¸•à¸´à¹Šà¸à¹€à¸à¸­à¸£à¹Œ"],
    ["servicesDetail.backdrop", "à¸šà¸£à¸´à¸à¸²à¸£: Backdrop"],
    ["servicesDetail.rollup", "à¸šà¸£à¸´à¸à¸²à¸£: Roll Up"],
    ["servicesDetail.ppboard", "à¸šà¸£à¸´à¸à¸²à¸£: PP Board"],
    ["servicesDetail.label", "à¸šà¸£à¸´à¸à¸²à¸£: à¸‰à¸¥à¸²à¸à¸ªà¸´à¸™à¸„à¹‰à¸²"],
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
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸£à¸²à¸¢à¸«à¸™à¹‰à¸²</h2>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>à¹à¸à¹‰à¸«à¸±à¸§à¸‚à¹‰à¸­à¸«à¸¥à¸±à¸à¹à¸¥à¸°à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸ªà¹ˆà¸§à¸™à¸à¸¥à¸²à¸‡à¸—à¸µà¹ˆà¹à¸ªà¸”à¸‡à¸šà¸™à¹€à¸§à¹‡à¸šà¹„à¸‹à¸•à¹Œ</p>
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
        à¸«à¸²à¸à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¹€à¸„à¸¢à¸šà¸±à¸™à¸—à¸¶à¸ à¸£à¸°à¸šà¸šà¸ˆà¸°à¹à¸ªà¸”à¸‡à¸„à¹ˆà¸²à¸•à¸±à¹‰à¸‡à¸•à¹‰à¸™à¸ˆà¸²à¸à¹‚à¸„à¹‰à¸”à¸à¹ˆà¸­à¸™ à¹ƒà¸«à¹‰à¸à¸” â€œà¸šà¸±à¸™à¸—à¸¶à¸à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡â€ à¸«à¸™à¸¶à¹ˆà¸‡à¸„à¸£à¸±à¹‰à¸‡à¹€à¸žà¸·à¹ˆà¸­à¸ªà¸£à¹‰à¸²à¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸Šà¸¸à¸”à¹à¸£à¸à¹ƒà¸™ database à¸ˆà¸²à¸à¸™à¸±à¹‰à¸™à¸«à¸™à¹‰à¸²à¹€à¸§à¹‡à¸šà¸ˆà¸°à¸­à¹ˆà¸²à¸™à¸„à¹ˆà¸²à¸ˆà¸²à¸ CMS à¸«à¸¥à¸±à¸‡ refresh
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {sections.map(([id, label]) => (
          <button type="button" key={id} onClick={() => setSection(id)} style={{
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
                  <SectionTitle>à¸œà¸¥à¸‡à¸²à¸™à¸‚à¸­à¸‡à¸šà¸£à¸´à¸à¸²à¸£à¸™à¸µà¹‰</SectionTitle>
                  <p style={{ color: "#888", fontSize: 12, lineHeight: 1.6 }}>
                    à¸£à¸¹à¸›à¹€à¸«à¸¥à¹ˆà¸²à¸™à¸µà¹‰à¸ˆà¸°à¹à¸ªà¸”à¸‡à¹ƒà¸™à¸ªà¹ˆà¸§à¸™à¸œà¸¥à¸‡à¸²à¸™à¸‚à¸­à¸‡à¸«à¸™à¹‰à¸²à¸šà¸£à¸´à¸à¸²à¸£à¸—à¸µà¹ˆà¹€à¸¥à¸·à¸­à¸ à¸«à¸²à¸à¹„à¸¡à¹ˆà¹ƒà¸ªà¹ˆ à¸£à¸°à¸šà¸šà¸ˆà¸°à¹ƒà¸Šà¹‰à¸£à¸¹à¸›à¸•à¸±à¹‰à¸‡à¸•à¹‰à¸™à¹€à¸”à¸´à¸¡
                  </p>
                </div>
                <CBtn onClick={() => addServicePortfolioItem(activeServiceKey)} small color="#3B82F6">+ à¹€à¸žà¸´à¹ˆà¸¡à¸£à¸¹à¸›</CBtn>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {servicePortfolioItems.map((item: any, index: number) => (
                  <div key={`${activeServiceKey}-portfolio-${index}`} className="service-portfolio-editor-card" style={{ background: "#0B0F19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 12 }}>
                    <div className="service-portfolio-editor-grid" style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, alignItems: "start" }}>
                      <div style={{ width: "100%", aspectRatio: "16 / 10", borderRadius: 8, overflow: "hidden", background: "#1A2233", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {item.image ? (
                          <img src={item.image} alt={item.alt || item.title || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ opacity: 0.45, fontSize: 24 }}>ðŸ–¼</span>
                        )}
                      </div>
                      <div className="service-portfolio-fields" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <CField label="à¸Šà¸·à¹ˆà¸­à¸œà¸¥à¸‡à¸²à¸™">
                          <input value={item.title || ""} onChange={(e) => updateServicePortfolioItem(activeServiceKey, index, "title", e.target.value)} />
                        </CField>
                        <CField label="à¸«à¸¡à¸§à¸”à¸«à¸¡à¸¹à¹ˆ">
                          <input value={item.category || ""} onChange={(e) => updateServicePortfolioItem(activeServiceKey, index, "category", e.target.value)} />
                        </CField>
                        <CField label="URL à¸£à¸¹à¸›à¸ à¸²à¸ž">
                          <input value={item.image || ""} onChange={(e) => updateServicePortfolioItem(activeServiceKey, index, "image", e.target.value)} placeholder="/images/portfolio/example.jpg" />
                        </CField>
                        <CField label="à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¸£à¸¹à¸›">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => uploadServicePortfolioImage(activeServiceKey, index, e.target.files?.[0])}
                          />
                          {servicePortfolioUploading === `${activeServiceKey}-${index}` && (
                            <div style={{ color: "#60A5FA", fontSize: 11, marginTop: 6 }}>à¸à¸³à¸¥à¸±à¸‡à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”...</div>
                          )}
                        </CField>
                        <CField label="Alt Text">
                          <input value={item.alt || ""} onChange={(e) => updateServicePortfolioItem(activeServiceKey, index, "alt", e.target.value)} />
                        </CField>
                        <CField label="à¸¥à¸´à¸‡à¸à¹Œà¹€à¸¡à¸·à¹ˆà¸­à¸„à¸¥à¸´à¸">
                          <input value={item.href || ""} onChange={(e) => updateServicePortfolioItem(activeServiceKey, index, "href", e.target.value)} placeholder="/portfolio à¸«à¸£à¸·à¸­ /services/..." />
                        </CField>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <CField label="à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢à¹ƒà¸•à¹‰à¸£à¸¹à¸›">
                            <textarea value={item.meta || ""} onChange={(e) => updateServicePortfolioItem(activeServiceKey, index, "meta", e.target.value)} rows={2} />
                          </CField>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                      <CBtn onClick={() => deleteServicePortfolioItem(activeServiceKey, index)} small outline style={{ color: "#EF4444", borderColor: "rgba(239,68,68,0.35)" }}>
                        à¸¥à¸šà¸£à¸¹à¸›à¸™à¸µà¹‰
                      </CBtn>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <CBtn onClick={save} color="#FF6B00">ðŸ’¾ à¸šà¸±à¸™à¸—à¸¶à¸à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡</CBtn>
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
    address: "123 à¸–.à¸•à¸±à¸§à¸­à¸¢à¹ˆà¸²à¸‡ à¸à¸£à¸¸à¸‡à¹€à¸—à¸žà¸¯ 10110", facebook: "", instagram: "", hours: "à¸ˆ-à¸¨ 9:00-18:00 à¸™.",
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
      showToast("à¸šà¸±à¸™à¸—à¸¶à¸à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸•à¸´à¸”à¸•à¹ˆà¸­à¹à¸¥à¹‰à¸§");
    } catch (error: any) {
      showToast("à¸šà¸±à¸™à¸—à¸¶à¸à¹„à¸¡à¹ˆà¹„à¸”à¹‰: " + error.message, "error");
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 560 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸•à¸´à¸”à¸•à¹ˆà¸­</h2>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <CField label="ðŸ“ž à¹€à¸šà¸­à¸£à¹Œà¹‚à¸—à¸£"><input value={c.phone} onChange={set("phone")} /></CField>
            <CField label="ðŸ“§ à¸­à¸µà¹€à¸¡à¸¥"><input value={c.email} onChange={set("email")} /></CField>
          </div>
          <CField label="ðŸ’¬ LINE URL"><input value={c.line} onChange={set("line")} /></CField>
          <CField label="ðŸ“ à¸—à¸µà¹ˆà¸­à¸¢à¸¹à¹ˆ"><textarea value={c.address} onChange={set("address")} rows={2} /></CField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <CField label="Facebook URL"><input value={c.facebook} onChange={set("facebook")} placeholder="https://facebook.com/..." /></CField>
            <CField label="Instagram URL"><input value={c.instagram} onChange={set("instagram")} placeholder="https://instagram.com/..." /></CField>
          </div>
          <CField label="â° à¹€à¸§à¸¥à¸²à¸—à¸³à¸à¸²à¸£"><input value={c.hours} onChange={set("hours")} /></CField>
          <CBtn onClick={save} color="#FF6B00">ðŸ’¾ à¸šà¸±à¸™à¸—à¸¶à¸à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸•à¸´à¸”à¸•à¹ˆà¸­</CBtn>
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
function CBtn({ onClick, children, color, outline, small, style, disabled, type = "button", ...rest }: any) {
  const buttonColor = color === "#FF6B00" || color === "#FF7A00" || !color ? "#C2410C" : color;
  return (
    <button type={type} onClick={onClick} disabled={disabled} {...rest} style={{
      background: outline ? "transparent" : buttonColor,
      border: `1px solid ${outline ? "rgba(255,255,255,0.15)" : buttonColor}`,
      color: outline ? "#A8B0C0" : "#fff",
      padding: small ? "8px 14px" : "11px 20px",
      borderRadius: 10, fontSize: small ? 13 : 14, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
      opacity: disabled ? 0.6 : 1, whiteSpace: "nowrap", ...style,
      minHeight: small ? 40 : 46,
    }}>{children}</button>
  );
}
function CIconBtn({ onClick, children, danger, small, type = "button", ...rest }: any) {
  return (
    <button type={type} onClick={onClick} {...rest} style={{
      background: danger ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)",
      border: `1px solid ${danger ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
      color: danger ? "#ef4444" : "#A8B0C0",
      padding: small ? "6px 10px" : "8px 12px", borderRadius: 8,
      cursor: "pointer", fontSize: small ? 12 : 14, fontFamily: "inherit",
      minHeight: 44, minWidth: 44, display: "inline-flex", alignItems: "center", justifyContent: "center",
    }}>{children}</button>
  );
}
function CModal({ title, onClose, children, width = 500 }: any) {
  return (
    <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="modal-panel" style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, width: "100%", maxWidth: width, maxHeight: "88dvh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 90px rgba(0,0,0,0.6)", animation: "scaleIn 0.2s ease", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {/* drag indicator */}
        <div style={{ width: 40, height: 4, background: "rgba(255,255,255,0.18)", borderRadius: 99, margin: "12px auto 4px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
          <button type="button" aria-label="Close dialog" onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#aaa", fontSize: 18, cursor: "pointer", width: 34, height: 34, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center" }}>âœ•</button>
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
