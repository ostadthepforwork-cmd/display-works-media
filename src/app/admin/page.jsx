"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ============================================================
// HELPERS — ERP
// ============================================================
const genId = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};
const fmtDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
};
const fmtDateTH = (d) =>
  d ? new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const fmtMoney = (n) =>
  Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const DOC_TYPES = {
  quote:   { label: "ใบเสนอราคา",    short: "QT", color: "#3B82F6", prefix: "QT" },
  bill:    { label: "ใบวางบิล",      short: "BL", color: "#8B5CF6", prefix: "BL" },
  invoice: { label: "ใบแจ้งหนี้",    short: "IV", color: "#F59E0B", prefix: "IV" },
  receipt: { label: "ใบเสร็จรับเงิน",short: "RC", color: "#10B981", prefix: "RC" },
};
const STATUS_COLORS = {
  draft: "#6B7280", sent: "#3B82F6", approved: "#10B981", cancelled: "#EF4444", paid: "#10B981",
};
const STATUS_LABELS = {
  draft: "ฉบับร่าง", sent: "ส่งแล้ว", approved: "อนุมัติ", cancelled: "ยกเลิก", paid: "ชำระแล้ว",
};

// ============================================================
// INITIAL DATA
// ============================================================
const INIT_CUSTOMERS = [
  { id: genId(), name: "บริษัท เอบีซี จำกัด", contact: "คุณสมชาย", phone: "081-234-5678", email: "abc@example.com", address: "123 ถ.สุขุมวิท กรุงเทพฯ 10110", taxId: "0105550123456" },
  { id: genId(), name: "ร้าน XYZ มาร์เก็ตติ้ง", contact: "คุณสมหญิง", phone: "089-876-5432", email: "xyz@example.com", address: "456 ถ.รัชดา กรุงเทพฯ 10400", taxId: "" },
];
const INIT_PRODUCTS = [
  { id: genId(), name: "ป้ายไวนิล (ต่อตร.ม.)", unit: "ตร.ม.", cost: 80, price: 200 },
  { id: genId(), name: "สติ๊กเกอร์ Indoor", unit: "ตร.ม.", cost: 120, price: 350 },
  { id: genId(), name: "สติ๊กเกอร์ Outdoor", unit: "ตร.ม.", cost: 180, price: 450 },
  { id: genId(), name: "PP Board", unit: "แผ่น", cost: 150, price: 400 },
  { id: genId(), name: "Roll Up Stand", unit: "ชิ้น", cost: 800, price: 2200 },
  { id: genId(), name: "Backdrop 3x2m", unit: "ชุด", cost: 1200, price: 3500 },
  { id: genId(), name: "ฉลากสินค้า A5", unit: "100 ชิ้น", cost: 150, price: 400 },
];

function loadStore(key, def) {
  try { const v = localStorage.getItem("dw_" + key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function saveStore(key, val) {
  try { localStorage.setItem("dw_" + key, JSON.stringify(val)); } catch {}
}
function loadLocal(key, def) {
  try { const v = localStorage.getItem("cms_" + key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function saveLocal(key, val) {
  try { localStorage.setItem("cms_" + key, JSON.stringify(val)); } catch {}
}

// ============================================================
// PRINT / PDF helper
// ============================================================
// ── ชื่อภาษาอังกฤษของแต่ละประเภทเอกสาร ──
const DOC_EN = {
  quote:   { en: "QUOTATION",    sub: "ใบเสนอราคา",     validLabel: "VALID UNTIL",      validKey: "dueDate" },
  bill:    { en: "BILLING NOTE", sub: "ใบวางบิล",        validLabel: "PAYMENT DUE",      validKey: "dueDate" },
  invoice: { en: "INVOICE",      sub: "ใบแจ้งหนี้",      validLabel: "PAYMENT DUE",      validKey: "dueDate" },
  receipt: { en: "RECEIPT",      sub: "ใบเสร็จรับเงิน",  validLabel: "PAID DATE",        validKey: "date"    },
};

// ── แปลงเอกสาร (อ้างอิง) ──
const CONVERT_MAP = {
  quote:   ["bill", "invoice"],
  bill:    ["invoice", "receipt"],
  invoice: ["receipt"],
  receipt: [],
};

function convertDoc(doc, toType, allDocuments, customers) {
  const year = new Date().getFullYear() + 543;
  const count = allDocuments.filter(d => d.type === toType).length + 1;
  const prefix = DOC_TYPES[toType].prefix;
  return {
    ...doc,
    id: "",
    type: toType,
    docNo: `${prefix}${year}-${String(count).padStart(4, "0")}`,
    reference: doc.docNo,          // อ้างอิงเลขที่เดิม
    status: "draft",
    date: today(),
    dueDate: addDays(today(), 30),
    createdAt: undefined,
    updatedAt: undefined,
  };
}

function printDocument(doc, customers, company) {
  const cust = customers.find((c) => c.id === doc.customerId) || {};
  const dt = DOC_TYPES[doc.type];
  const de = DOC_EN[doc.type] || { en: dt.label, sub: dt.label, validLabel: "DUE DATE", validKey: "dueDate" };

  const subtotal = doc.items.reduce((s, i) => s + i.qty * i.price, 0);
  const discountAmt = doc.discount > 0 ? subtotal * (doc.discount / 100) : 0;
  const afterDiscount = subtotal - discountAmt;
  const vatAmt = doc.vat ? afterDiscount * 0.07 : 0;
  const total = afterDiscount + vatAmt;
  const whtAmt = doc.wht ? afterDiscount * (doc.whtRate / 100) : 0;
  const netPay = total - whtAmt;

  // ── Logo: ใช้ absolute URL เพื่อให้โหลดได้ใน popup ──
  const LOGO_URL = `${window.location.origin}/images/logo DWM PNG long.png`;

  // ── rows ──
  const rows = doc.items.map((item, i) => `
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:8px 6px;text-align:center;font-weight:700;color:#FF5500;font-size:13px;">${String(i+1).padStart(2,"0")}</td>
      <td style="padding:8px 8px;vertical-align:top;">
        <div style="font-weight:700;font-size:11px;color:#1f2937;">${item.name}</div>
        ${item.detail ? `<div style="font-size:9.5px;color:#6b7280;margin-top:2px;">${item.detail}</div>` : ""}
      </td>
      <td style="padding:8px 6px;vertical-align:top;">
        ${item.specs ? `<ul style="list-style:disc;padding-left:14px;font-size:9.5px;color:#6b7280;line-height:1.6;">${item.specs.split("\n").filter(Boolean).map(s=>`<li>${s}</li>`).join("")}</ul>` : ""}
      </td>
      <td style="padding:8px 6px;text-align:center;font-size:11px;color:#1f2937;font-weight:500;">${fmtMoney(item.qty)}</td>
      <td style="padding:8px 6px;text-align:center;font-size:11px;color:#6b7280;">${item.unit}</td>
      <td style="padding:8px 6px;text-align:right;font-size:11px;color:#374151;font-weight:500;">${fmtMoney(item.price)}</td>
      <td style="padding:8px 6px;text-align:right;font-size:11px;font-weight:700;color:#FF5500;">${fmtMoney(item.qty * item.price)}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8"/>
<title>${de.en} ${doc.docNo}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Prompt','Sarabun',sans-serif;font-size:12px;color:#2a2a2a;background:#f3f4f6;}
  .sheet{background:#fff;width:210mm;min-height:297mm;padding:18mm 12mm 15mm 12mm;margin:0 auto;box-shadow:0 10px 25px -5px rgba(0,0,0,.1);}
  table{width:100%;border-collapse:collapse;}
  @media print{
    body{background:#fff!important;}
    .sheet{width:100%!important;box-shadow:none!important;padding:10mm 8mm!important;}
    tr,td{page-break-inside:avoid!important;}
  }
</style>
</head><body>
<div class="sheet">

  <!-- HEADER -->
  <div style="display:grid;grid-template-columns:7fr 5fr;gap:16px;align-items:start;padding-bottom:16px;border-bottom:2px solid #f3f4f6;">
    <div style="display:flex;align-items:center;gap:12px;">
      <img src="${LOGO_URL}" alt="Display Works Media" style="height:52px;object-fit:contain;" onerror="this.style.display='none';this.nextSibling.style.display='block'"/>
      <div style="display:none;">
        <div style="font-size:20px;font-weight:800;color:#1f2937;line-height:1;">DISPLAY WORKS</div>
        <div style="font-size:13px;font-weight:700;letter-spacing:3px;color:#FF5500;">MEDIA</div>
      </div>
    </div>
    <div style="text-align:right;position:relative;">
      <h1 style="font-size:34px;font-weight:900;color:#1a1a1a;line-height:1;letter-spacing:2px;">${de.en}</h1>
      <span style="font-size:12px;font-weight:500;color:#FF5500;letter-spacing:2px;display:block;margin-top:2px;">${de.sub}</span>
      <div style="position:absolute;right:-4px;top:0;width:5px;height:56px;background:#FF5500;transform:skewX(25deg);opacity:.8;"></div>
    </div>
  </div>

  <!-- CLIENT + META -->
  <div style="display:grid;grid-template-columns:7fr 5fr;gap:0;margin-top:20px;padding-bottom:20px;border-bottom:1px solid #f3f4f6;">
    <div style="padding-right:16px;border-right:1px solid #e5e7eb;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
        <span style="color:#FF5500;font-weight:800;font-size:13px;">TO</span>
        <span style="color:#9ca3af;">/</span>
        <span style="color:#6b7280;font-weight:600;font-size:10px;">ลูกค้า</span>
      </div>
      <div style="font-weight:700;font-size:12px;color:#1f2937;margin-bottom:4px;">${cust.name || "-"}</div>
      <div style="font-size:10px;color:#6b7280;line-height:1.7;margin-bottom:6px;white-space:pre-line;">${cust.address || ""}</div>
      <div style="font-size:10px;color:#374151;line-height:2;">
        ${cust.taxId ? `<div><span style="font-weight:600;">เลขประจำตัวผู้เสียภาษี</span> ${cust.taxId}</div>` : ""}
        ${cust.phone ? `<div><span style="font-weight:600;">โทร.</span> ${cust.phone}</div>` : ""}
        ${cust.email ? `<div><span style="font-weight:600;">อีเมล:</span> ${cust.email}</div>` : ""}
      </div>
    </div>
    <div style="padding-left:20px;">
      <div style="display:flex;flex-direction:column;gap:0;">
        <div style="display:grid;grid-template-columns:5fr 7fr;padding:6px 0;font-size:10px;">
          <span style="font-weight:700;color:#FF5500;">${de.en} NO.</span>
          <span style="font-weight:600;color:#1f2937;padding-left:8px;">${doc.docNo}</span>
        </div>
        <div style="display:grid;grid-template-columns:5fr 7fr;padding:6px 0;border-top:1px dashed #f3f4f6;font-size:10px;">
          <span style="font-weight:700;color:#6b7280;">DATE</span>
          <span style="font-weight:500;color:#1f2937;padding-left:8px;">${fmtDate(doc.date)}</span>
        </div>
        <div style="display:grid;grid-template-columns:5fr 7fr;padding:6px 0;border-top:1px dashed #f3f4f6;font-size:10px;">
          <span style="font-weight:700;color:#FF5500;">${de.validLabel}</span>
          <span style="font-weight:500;color:#1f2937;padding-left:8px;">${fmtDate(doc[de.validKey])}</span>
        </div>
        ${doc.salesPerson ? `<div style="display:grid;grid-template-columns:5fr 7fr;padding:6px 0;border-top:1px dashed #f3f4f6;font-size:10px;">
          <span style="font-weight:700;color:#6b7280;">SALE PERSON</span>
          <span style="font-weight:500;color:#1f2937;padding-left:8px;">${doc.salesPerson}</span>
        </div>` : ""}
        ${doc.reference ? `<div style="display:grid;grid-template-columns:5fr 7fr;padding:6px 0;border-top:1px dashed #f3f4f6;font-size:10px;">
          <span style="font-weight:700;color:#6b7280;">REF. NO.</span>
          <span style="font-weight:500;color:#1f2937;padding-left:8px;">${doc.reference}</span>
        </div>` : ""}
        ${doc.projectName ? `<div style="display:grid;grid-template-columns:5fr 7fr;padding:6px 0;border-top:1px dashed #f3f4f6;font-size:10px;">
          <span style="font-weight:700;color:#6b7280;">PROJECT</span>
          <span style="font-weight:500;color:#1f2937;padding-left:8px;">${doc.projectName}</span>
        </div>` : ""}
      </div>
    </div>
  </div>

  <!-- ITEMS TABLE -->
  <div style="margin-top:20px;">
    <table style="border:1px solid #e5e7eb;">
      <thead>
        <tr style="background:#2c2d30;color:#fff;font-size:9.5px;text-transform:uppercase;text-align:center;">
          <th style="padding:9px 6px;border-right:1px solid #444;width:6%;">ITEM<br><span style="font-size:7.5px;font-weight:400;text-transform:lowercase;">ลำดับ</span></th>
          <th style="padding:9px 8px;border-right:1px solid #444;width:22%;text-align:left;">DESCRIPTION<br><span style="font-size:7.5px;font-weight:400;text-transform:lowercase;">รายการ</span></th>
          <th style="padding:9px 8px;border-right:1px solid #444;width:28%;text-align:left;">DETAIL<br><span style="font-size:7.5px;font-weight:400;text-transform:lowercase;">รายละเอียด</span></th>
          <th style="padding:9px 6px;border-right:1px solid #444;width:8%;">QTY.<br><span style="font-size:7.5px;font-weight:400;text-transform:lowercase;">จำนวน</span></th>
          <th style="padding:9px 6px;border-right:1px solid #444;width:8%;">UNIT<br><span style="font-size:7.5px;font-weight:400;text-transform:lowercase;">หน่วย</span></th>
          <th style="padding:9px 6px;border-right:1px solid #444;width:14%;text-align:right;">UNIT PRICE<br><span style="font-size:7.5px;font-weight:400;text-transform:lowercase;">ราคาต่อหน่วย</span></th>
          <th style="padding:9px 6px;width:14%;text-align:right;">AMOUNT<br><span style="font-size:7.5px;font-weight:400;text-transform:lowercase;">จำนวนเงิน</span></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <!-- LOWER: REMARKS + PAYMENT + TOTALS -->
  <div style="display:grid;grid-template-columns:7fr 5fr;gap:16px;margin-top:20px;">

    <!-- Left: หมายเหตุ + ข้อมูลการชำระเงิน -->
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;background:#fafafa;">
        <div style="color:#FF5500;font-weight:700;font-size:9.5px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">REMARKS / หมายเหตุ</div>
        <ul style="list-style:disc;padding-left:14px;font-size:9.5px;color:#6b7280;line-height:1.9;">
          ${doc.notes
            ? doc.notes.split("\n").filter(Boolean).map(n=>`<li>${n}</li>`).join("")
            : `<li>ราคานี้${doc.vat ? "รวมภาษีมูลค่าเพิ่ม 7% แล้ว" : "ยังไม่รวม VAT"}</li>
               <li>ระยะเวลาดำเนินงาน 7-14 วันทำการ (หลังยืนยันแบบ)</li>
               <li>เงื่อนไขการชำระเงิน: มัดจำ 50% ก่อนเริ่มงาน / ชำระส่วนที่เหลือหลังส่งมอบงาน</li>
               <li>ใบเสนอราคานี้มีอายุ 15 วัน นับจากวันที่ออกเอกสาร</li>`
          }
        </ul>
      </div>
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;display:flex;align-items:flex-start;justify-content:space-between;">
        <div>
          <div style="color:#FF5500;font-weight:700;font-size:9.5px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">PAYMENT INFORMATION</div>
          <div style="font-weight:700;font-size:10.5px;color:#1f2937;margin-bottom:4px;">ชื่อบัญชี: ${company.name || "Display Works Media"}</div>
          <div style="font-size:9.5px;color:#6b7280;line-height:1.8;">
            <div>ธนาคารกสิกรไทย สาขาบางบัวทอง</div>
            <div>เลขที่บัญชี: <strong style="color:#1f2937;">123-4-56789-0</strong></div>
            <div style="font-size:8.5px;font-style:italic;color:#9ca3af;">ประเภทบัญชี: ออมทรัพย์</div>
          </div>
        </div>
        <div style="text-align:center;border:1px solid #f3f4f6;border-radius:4px;padding:6px;background:#f9fafb;flex-shrink:0;margin-left:10px;">
          <svg width="56" height="56" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          </svg>
          <div style="font-size:8px;color:#9ca3af;margin-top:3px;">สแกนเพื่อชำระเงิน</div>
        </div>
      </div>
    </div>

    <!-- Right: ยอดรวม + ลายเซ็น -->
    <div style="display:flex;flex-direction:column;justify-content:space-between;gap:14px;">
      <div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <table style="font-size:11px;text-align:right;">
          <tbody>
            <tr style="border-bottom:1px solid #f3f4f6;">
              <td style="padding:8px 12px;color:#6b7280;font-weight:600;text-align:left;width:55%;">SUBTOTAL</td>
              <td style="padding:8px 12px;color:#1f2937;font-weight:500;">${fmtMoney(subtotal)}</td>
            </tr>
            ${discountAmt > 0 ? `<tr style="border-bottom:1px solid #f3f4f6;">
              <td style="padding:8px 12px;color:#ef4444;font-weight:600;text-align:left;">DISCOUNT (${doc.discount}%)</td>
              <td style="padding:8px 12px;color:#ef4444;font-weight:500;">- ${fmtMoney(discountAmt)}</td>
            </tr>` : ""}
            <tr style="border-bottom:1px solid #f3f4f6;">
              <td style="padding:8px 12px;color:#6b7280;font-weight:600;text-align:left;">TOTAL BEFORE VAT</td>
              <td style="padding:8px 12px;color:#1f2937;font-weight:500;">${fmtMoney(afterDiscount)}</td>
            </tr>
            ${doc.vat ? `<tr style="border-bottom:1px solid #f3f4f6;">
              <td style="padding:8px 12px;color:#6b7280;font-weight:600;text-align:left;">VAT 7%</td>
              <td style="padding:8px 12px;color:#1f2937;font-weight:500;">${fmtMoney(vatAmt)}</td>
            </tr>` : ""}
            ${doc.wht ? `<tr style="border-bottom:1px solid #f3f4f6;">
              <td style="padding:8px 12px;color:#6b7280;font-weight:600;text-align:left;">WHT ${doc.whtRate}%</td>
              <td style="padding:8px 12px;color:#ef4444;font-weight:500;">- ${fmtMoney(whtAmt)}</td>
            </tr>` : ""}
            <tr style="background:#FF5500;color:#fff;">
              <td style="padding:10px 12px;font-weight:900;font-size:12px;text-align:left;">GRAND TOTAL<br><span style="font-size:8px;font-weight:300;">รวมทั้งสิ้น</span></td>
              <td style="padding:10px 12px;font-weight:900;font-size:15px;">${fmtMoney(netPay)} <span style="font-size:9px;font-weight:400;">THB</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ลายเซ็น -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;text-align:center;">
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px;min-height:90px;display:flex;flex-direction:column;justify-content:space-between;">
          <div style="font-size:8px;font-weight:800;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;">PREPARED BY</div>
          <div style="border-bottom:1px solid #d1d5db;margin:12px 10%;"></div>
          <div style="font-size:8.5px;color:#6b7280;">( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )<br><span style="font-size:8px;font-weight:600;color:#374151;">ผู้เสนอราคา</span></div>
        </div>
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px;min-height:90px;display:flex;flex-direction:column;justify-content:space-between;">
          <div style="font-size:8px;font-weight:800;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;">AUTHORIZED BY</div>
          <div style="border-bottom:1px solid #d1d5db;margin:12px 10%;"></div>
          <div style="font-size:8.5px;color:#6b7280;">( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )<br><span style="font-size:8px;font-weight:600;color:#374151;">ผู้อนุมัติสั่งซื้อ</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div style="margin-top:36px;padding-top:14px;border-top:2.5px solid #FF5500;display:grid;grid-template-columns:8fr 4fr;gap:16px;align-items:end;">
    <div style="font-size:9.5px;color:#6b7280;line-height:1.8;">
      <div style="font-weight:700;font-size:10.5px;color:#1f2937;margin-bottom:3px;">DISPLAY WORKS MEDIA CO., LTD.</div>
      <div style="margin-bottom:6px;">${company.address || "88/8 ซอยบางกรวย-ไทรน้อย 17 ตำบลบางรักพัฒนา อำเภอบางบัวทอง นนทบุรี 11110"}</div>
      <div style="display:flex;flex-wrap:wrap;gap:12px;color:#6b7280;">
        <span>📞 ${company.phone || "02-123-4567"}</span>
        <span>✉️ ${company.email || "info@displayworksmedia.com"}</span>
        <span>🌐 www.displayworksmedia.com</span>
        ${company.taxId ? `<span>เลขผู้เสียภาษี: ${company.taxId}</span>` : ""}
      </div>
    </div>
    <div style="text-align:right;position:relative;padding-right:10px;">
      <div style="font-size:10.5px;font-style:italic;font-weight:900;color:#1a1a1a;letter-spacing:2px;">MAKE YOUR</div>
      <div style="font-size:14px;font-weight:900;color:#FF5500;letter-spacing:2px;line-height:1;">BRAND SEEN</div>
      <div style="position:absolute;right:0;bottom:1px;width:4px;height:28px;background:#FF5500;transform:skewX(25deg);opacity:.8;"></div>
    </div>
  </div>

</div>
</body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (!w) {
    // fallback: download as HTML file
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.docNo}.html`;
    a.click();
  } else {
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}

// ============================================================
// MAIN APP
// ============================================================
export default function AdminApp() {
  const [page, setPage] = useState("dashboard");

  // ERP State
  const [customers, setCustomers] = useState(() => loadStore("customers", INIT_CUSTOMERS));
  const [products, setProducts] = useState(() => loadStore("products", INIT_PRODUCTS));
  const [documents, setDocuments] = useState(() => loadStore("documents", []));
  const [company, setCompany] = useState(() =>
    loadStore("company", {
      name: "Display Works Media",
      address: "123 ถ.ตัวอย่าง กรุงเทพฯ 10110",
      phone: "088-888-8888",
      email: "info@displayworksmedia.com",
      taxId: "0105550000000",
    })
  );
  const [toast, setToast] = useState(null);

  useEffect(() => { saveStore("customers", customers); }, [customers]);
  useEffect(() => { saveStore("products", products); }, [products]);
  useEffect(() => { saveStore("documents", documents); }, [documents]);
  useEffect(() => { saveStore("company", company); }, [company]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const docCounts = Object.keys(DOC_TYPES).reduce((acc, t) => {
    acc[t] = documents.filter((d) => d.type === t).length;
    return acc;
  }, {});

  const totalRevenue = documents
    .filter((d) => d.status === "paid")
    .reduce((s, d) => {
      const sub = d.items.reduce((ss, i) => ss + i.qty * i.price, 0);
      const disc = sub * (d.discount / 100);
      const vat = d.vat ? (sub - disc) * 0.07 : 0;
      return s + sub - disc + vat;
    }, 0);

  const totalCost = documents
    .filter((d) => d.status === "paid")
    .reduce((s, d) => {
      return s + d.items.reduce((ss, i) => {
        const prod = products.find((p) => p.name === i.name);
        return ss + i.qty * (prod ? prod.cost : 0);
      }, 0);
    }, 0);

  const totalProfit = totalRevenue - totalCost;

  // Page title mapping
  const pageTitles = {
    dashboard: "ภาพรวมระบบ",
    customers: "จัดการลูกค้า",
    products: "จัดการสินค้า/บริการ",
    company: "ข้อมูลบริษัท",
    quote: DOC_TYPES.quote?.label,
    bill: DOC_TYPES.bill?.label,
    invoice: DOC_TYPES.invoice?.label,
    receipt: DOC_TYPES.receipt?.label,
    cms_blog: "บทความ",
    cms_hero: "Hero Section",
    cms_services: "บริการ",
    cms_reviews: "รีวิว",
    cms_portfolio: "ผลงาน",
    cms_contact: "ข้อมูลติดต่อ",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", color: "#fff", fontFamily: "'Prompt', 'Sarabun', sans-serif", display: "flex" }}>
      <Sidebar page={page} setPage={setPage} docCounts={docCounts} />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Topbar */}
        <div style={{ background: "#141A24", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 14, color: "#A8B0C0" }}>{pageTitles[page] || page}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a href="https://displayworksmedia.com" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: "#FF6B00", textDecoration: "none" }}>
              เปิดเว็บไซต์ ↗
            </a>
            <span style={{ fontSize: 12, color: "#333", fontFamily: "monospace" }}>Display Works Media</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
          {/* ERP Pages */}
          {page === "dashboard" && (
            <Dashboard
              documents={documents} customers={customers}
              totalRevenue={totalRevenue} totalCost={totalCost} totalProfit={totalProfit}
              docCounts={docCounts} setPage={setPage}
            />
          )}
          {page === "customers" && <CustomerPage customers={customers} setCustomers={setCustomers} showToast={showToast} />}
          {page === "products" && <ProductPage products={products} setProducts={setProducts} showToast={showToast} />}
          {page === "company" && <CompanyPage company={company} setCompany={setCompany} showToast={showToast} />}
          {["quote", "bill", "invoice", "receipt"].includes(page) && (
            <DocumentPage
              type={page} documents={documents.filter((d) => d.type === page)}
              allDocuments={documents} setDocuments={setDocuments}
              customers={customers} products={products} company={company} showToast={showToast}
            />
          )}

          {/* CMS Pages */}
          {page === "cms_blog" && <BlogManager showToast={showToast} />}
          {page === "cms_hero" && <HeroManager showToast={showToast} />}
          {page === "cms_services" && <ServicesManager showToast={showToast} />}
          {page === "cms_reviews" && <ReviewsManager showToast={showToast} />}
          {page === "cms_portfolio" && <PortfolioManager showToast={showToast} />}
          {page === "cms_contact" && <ContactManager showToast={showToast} />}
        </div>
      </div>

      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          background: toast.type === "error" ? "#7f1d1d" : "#064e3b",
          border: `1px solid ${toast.type === "error" ? "#ef4444" : "#10b981"}`,
          color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 14,
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 10,
        }}>
          <span>{toast.type === "error" ? "✗" : "✓"}</span>{toast.msg}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #0B0F19; }
        ::-webkit-scrollbar-thumb { background: #FF6B00; border-radius: 3px; }
        input, select, textarea {
          background: #1A2233 !important; border: 1px solid rgba(255,255,255,0.12) !important;
          color: #fff !important; border-radius: 8px !important; padding: 8px 12px !important;
          font-family: 'Prompt', sans-serif !important; font-size: 13px !important;
          outline: none !important; width: 100%; transition: border-color 0.2s; box-sizing: border-box;
        }
        input:focus, select:focus, textarea:focus { border-color: #FF6B00 !important; }
        input::placeholder, textarea::placeholder { color: #555 !important; }
        select option { background: #141A24; }
        label { font-size: 12px; color: #A8B0C0; display: block; margin-bottom: 4px; }
      `}</style>
    </div>
  );
}

// ============================================================
// UNIFIED SIDEBAR
// ============================================================
function Sidebar({ page, setPage, docCounts }) {
  const [erpOpen, setErpOpen] = useState(true);
  const [cmsOpen, setCmsOpen] = useState(true);

  const erpPages = ["dashboard", "customers", "products", "quote", "bill", "invoice", "receipt", "company"];
  const cmsPages = ["cms_blog", "cms_hero", "cms_services", "cms_reviews", "cms_portfolio", "cms_contact"];
  const isErpActive = erpPages.includes(page);
  const isCmsActive = cmsPages.includes(page);

  const erpItems = [
    { id: "dashboard", icon: "⊞", label: "ภาพรวม" },
    { id: "customers", icon: "👥", label: "ลูกค้า" },
    { id: "products", icon: "📦", label: "สินค้า/บริการ" },
    "divider",
    { id: "quote", icon: "📋", label: "ใบเสนอราคา", count: docCounts.quote, color: DOC_TYPES.quote.color },
    { id: "bill", icon: "📄", label: "ใบวางบิล", count: docCounts.bill, color: DOC_TYPES.bill.color },
    { id: "invoice", icon: "🧾", label: "ใบแจ้งหนี้", count: docCounts.invoice, color: DOC_TYPES.invoice.color },
    { id: "receipt", icon: "✅", label: "ใบเสร็จรับเงิน", count: docCounts.receipt, color: DOC_TYPES.receipt.color },
    "divider",
    { id: "company", icon: "🏢", label: "ข้อมูลบริษัท" },
  ];

  const cmsItems = [
    { id: "cms_blog", icon: "📝", label: "บทความ" },
    { id: "cms_hero", icon: "🖼️", label: "Hero Section" },
    { id: "cms_services", icon: "🛠️", label: "บริการ" },
    { id: "cms_reviews", icon: "⭐", label: "รีวิว" },
    { id: "cms_portfolio", icon: "🖼", label: "ผลงาน" },
    { id: "cms_contact", icon: "📞", label: "ข้อมูลติดต่อ" },
  ];

  return (
    <div style={{ width: 230, background: "#0d1120", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      {/* Brand */}
      <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#FF6B00" }}>Display Works</div>
        <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>Admin Panel</div>
      </div>

      <nav style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
        {/* ERP Section */}
        <SidebarSection
          label="ERP"
          sublabel="ระบบเอกสารขาย"
          icon="💼"
          open={erpOpen}
          onToggle={() => setErpOpen(v => !v)}
          active={isErpActive}
          color="#3B82F6"
        />
        {erpOpen && erpItems.map((item, i) =>
          item === "divider"
            ? <div key={i} style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "6px 6px" }} />
            : (
              <NavItem key={item.id} item={item} active={page === item.id} onClick={() => setPage(item.id)} indent />
            )
        )}

        {/* Divider between ERP and CMS */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "12px 0" }} />

        {/* CMS Section */}
        <SidebarSection
          label="CMS"
          sublabel="จัดการเนื้อหาเว็บ"
          icon="✏️"
          open={cmsOpen}
          onToggle={() => setCmsOpen(v => !v)}
          active={isCmsActive}
          color="#8B5CF6"
        />
        {cmsOpen && cmsItems.map(item => (
          <NavItem key={item.id} item={item} active={page === item.id} onClick={() => setPage(item.id)} indent />
        ))}
      </nav>
    </div>
  );
}

function SidebarSection({ label, sublabel, icon, open, onToggle, active, color }) {
  return (
    <button onClick={onToggle} style={{
      display: "flex", alignItems: "center", gap: 8, width: "100%",
      padding: "7px 10px 7px 10px", borderRadius: 8, border: "none", cursor: "pointer",
      background: active ? color + "18" : "rgba(255,255,255,0.03)",
      fontFamily: "inherit", textAlign: "left", marginBottom: 2,
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: active ? color : "#fff", letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>{sublabel}</div>
      </div>
      <span style={{ fontSize: 10, color: "#444", transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}>▾</span>
    </button>
  );
}

function NavItem({ item, active, onClick, indent }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 9,
      padding: "8px 10px 8px " + (indent ? "22px" : "10px"),
      borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12.5,
      background: active ? "rgba(255,107,0,0.14)" : "transparent",
      color: active ? "#FF6B00" : "#A8B0C0", fontFamily: "inherit",
      borderLeft: active ? "2px solid #FF6B00" : "2px solid transparent",
      width: "100%", textAlign: "left", marginBottom: 1,
    }}>
      <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{item.icon}</span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.count > 0 && (
        <span style={{ background: item.color + "33", color: item.color, fontSize: 10, padding: "1px 7px", borderRadius: 99, fontWeight: 600 }}>
          {item.count}
        </span>
      )}
    </button>
  );
}

// ============================================================
// DASHBOARD
// ============================================================
function Dashboard({ documents, customers, totalRevenue, totalCost, totalProfit, docCounts, setPage }) {
  const pendingDocs = documents.filter((d) => ["draft", "sent"].includes(d.status));
  const recentDocs = [...documents].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>ภาพรวมระบบ</h2>
        <p style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
          วันนี้ {new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "รายได้ (ชำระแล้ว)", value: "฿" + fmtMoney(totalRevenue), color: "#10B981", icon: "💰" },
          { label: "ต้นทุนรวม", value: "฿" + fmtMoney(totalCost), color: "#EF4444", icon: "📦" },
          { label: "กำไรสุทธิ", value: "฿" + fmtMoney(totalProfit), color: totalProfit >= 0 ? "#10B981" : "#EF4444", icon: totalProfit >= 0 ? "📈" : "📉" },
          { label: "Margin", value: profitMargin + "%", color: totalProfit >= 0 ? "#F59E0B" : "#EF4444", icon: "🎯" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#A8B0C0", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "รอดำเนินการ", value: pendingDocs.length + " รายการ", color: "#F59E0B", icon: "⏳" },
          { label: "ลูกค้าทั้งหมด", value: customers.length + " ราย", color: "#3B82F6", icon: "👥" },
          { label: "เอกสารทั้งหมด", value: documents.length + " ฉบับ", color: "#8B5CF6", icon: "📁" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#A8B0C0", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {totalRevenue > 0 && (
        <div style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "#A8B0C0" }}>สัดส่วนกำไร/ต้นทุน</div>
          <div style={{ height: 12, borderRadius: 99, background: "#1A2233", overflow: "hidden", marginBottom: 10 }}>
            <div style={{ height: "100%", width: profitMargin + "%", background: "linear-gradient(90deg, #10B981, #34D399)", borderRadius: 99, transition: "width 0.5s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#555" }}>
            <span style={{ color: "#EF4444" }}>ต้นทุน ฿{fmtMoney(totalCost)}</span>
            <span style={{ color: "#10B981" }}>กำไร ฿{fmtMoney(totalProfit)} ({profitMargin}%)</span>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
        {Object.entries(DOC_TYPES).map(([key, dt]) => (
          <button key={key} onClick={() => setPage(key)} style={{
            background: "#141A24", border: `1px solid ${dt.color}33`, borderRadius: 10,
            padding: "14px 16px", textAlign: "left", cursor: "pointer", color: "#fff", fontFamily: "inherit",
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: dt.color }}>{docCounts[key] || 0}</div>
            <div style={{ fontSize: 12, color: "#A8B0C0", marginTop: 2 }}>{dt.label}</div>
          </button>
        ))}
      </div>

      <div style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>เอกสารล่าสุด</span>
        </div>
        {recentDocs.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#555" }}>ยังไม่มีเอกสาร</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#1A2233" }}>
                {["เลขที่", "ประเภท", "ลูกค้า", "วันที่", "ยอดรวม", "สถานะ"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, color: "#A8B0C0", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentDocs.map((doc) => {
                const sub = doc.items.reduce((s, i) => s + i.qty * i.price, 0);
                const disc = sub * (doc.discount / 100);
                const vat = doc.vat ? (sub - disc) * 0.07 : 0;
                const total = sub - disc + vat;
                return (
                  <tr key={doc.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "10px 16px", fontSize: 13, fontFamily: "monospace", color: "#FF6B00" }}>{doc.docNo}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ background: DOC_TYPES[doc.type]?.color + "22", color: DOC_TYPES[doc.type]?.color, fontSize: 11, padding: "2px 8px", borderRadius: 99 }}>
                        {DOC_TYPES[doc.type]?.label}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 13, color: "#ccc" }}>{doc.customerName || "-"}</td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "#888" }}>{fmtDate(doc.date)}</td>
                    <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600 }}>฿{fmtMoney(total)}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ background: STATUS_COLORS[doc.status] + "22", color: STATUS_COLORS[doc.status], fontSize: 11, padding: "2px 8px", borderRadius: 99 }}>
                        {STATUS_LABELS[doc.status]}
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
// ERP: CUSTOMER PAGE
// ============================================================
function CustomerPage({ customers, setCustomers, showToast }) {
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const blank = { id: "", name: "", contact: "", phone: "", email: "", address: "", taxId: "" };
  const filtered = customers.filter(c => c.name.includes(search) || c.contact?.includes(search) || c.phone?.includes(search));
  const save = (form) => {
    if (!form.name.trim()) return showToast("กรุณาใส่ชื่อลูกค้า", "error");
    if (form.id) { setCustomers(prev => prev.map(c => c.id === form.id ? form : c)); showToast("แก้ไขข้อมูลลูกค้าแล้ว"); }
    else { setCustomers(prev => [...prev, { ...form, id: genId() }]); showToast("เพิ่มลูกค้าใหม่แล้ว"); }
    setEditing(null);
  };
  const del = (id) => { if (!confirm("ลบลูกค้านี้?")) return; setCustomers(prev => prev.filter(c => c.id !== id)); showToast("ลบลูกค้าแล้ว"); };
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h2 style={{ fontSize: 20, fontWeight: 700 }}>ลูกค้า</h2><p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{customers.length} ราย</p></div>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ค้นหา..." style={{ width: 220 }} />
          <Btn onClick={() => setEditing({ ...blank })} color="#FF6B00">+ เพิ่มลูกค้า</Btn>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
        {filtered.map(c => (
          <div key={c.id} style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div><div style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</div>{c.contact && <div style={{ fontSize: 12, color: "#A8B0C0" }}>{c.contact}</div>}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <IconBtn onClick={() => setEditing({ ...c })} title="แก้ไข">✏️</IconBtn>
                <IconBtn onClick={() => del(c.id)} title="ลบ" danger>🗑️</IconBtn>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#888", lineHeight: 2 }}>
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
function CustomerForm({ data, onSave, onCancel }) {
  const [f, setF] = useState(data);
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Field label="ชื่อบริษัท/ลูกค้า *"><input value={f.name} onChange={set("name")} /></Field>
      <Field label="ชื่อผู้ติดต่อ"><input value={f.contact} onChange={set("contact")} /></Field>
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
// ERP: PRODUCT PAGE
// ============================================================
function ProductPage({ products, setProducts, showToast }) {
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const blank = { id: "", name: "", unit: "ชิ้น", cost: "", price: "" };
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const save = (f) => {
    if (!f.name.trim()) return showToast("กรุณาใส่ชื่อสินค้า", "error");
    if (f.id) { setProducts(prev => prev.map(p => p.id === f.id ? f : p)); showToast("แก้ไขสินค้าแล้ว"); }
    else { setProducts(prev => [...prev, { ...f, id: genId() }]); showToast("เพิ่มสินค้าใหม่แล้ว"); }
    setEditing(null);
  };
  const del = (id) => { if (!confirm("ลบสินค้านี้?")) return; setProducts(prev => prev.filter(p => p.id !== id)); showToast("ลบสินค้าแล้ว"); };
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h2 style={{ fontSize: 20, fontWeight: 700 }}>สินค้า/บริการ</h2><p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{products.length} รายการ</p></div>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ค้นหา..." style={{ width: 200 }} />
          <Btn onClick={() => setEditing({ ...blank })} color="#FF6B00">+ เพิ่มสินค้า</Btn>
        </div>
      </div>
      <div style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#1A2233" }}>
              {["ชื่อสินค้า/บริการ", "หน่วย", "ต้นทุน", "ราคาขาย", "กำไร", "จัดการ"].map(h => (
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
                  <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#A8B0C0" }}>{p.unit}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#ef4444" }}>฿{fmtMoney(p.cost)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#10b981", fontWeight: 600 }}>฿{fmtMoney(p.price)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>
                    <span style={{ color: margin > 0 ? "#10b981" : "#ef4444" }}>฿{fmtMoney(margin)}</span>
                    <span style={{ fontSize: 11, color: "#555", marginLeft: 6 }}>({pct}%)</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <IconBtn onClick={() => setEditing({ ...p })} title="แก้ไข">✏️</IconBtn>
                      <IconBtn onClick={() => del(p.id)} title="ลบ" danger>🗑️</IconBtn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {editing && (
        <Modal title={editing.id ? "แก้ไขสินค้า" : "เพิ่มสินค้า"} onClose={() => setEditing(null)} width={420}>
          <ProductForm data={editing} onSave={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}
function ProductForm({ data, onSave, onCancel }) {
  const [f, setF] = useState({ ...data, cost: data.cost || "", price: data.price || "" });
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  const margin = (parseFloat(f.price) || 0) - (parseFloat(f.cost) || 0);
  const pct = f.cost > 0 ? (margin / parseFloat(f.cost) * 100).toFixed(1) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Field label="ชื่อสินค้า/บริการ *"><input value={f.name} onChange={set("name")} /></Field>
      <Field label="หน่วย">
        <input value={f.unit} onChange={set("unit")} list="unit-list" />
        <datalist id="unit-list">{["ชิ้น","อัน","ตร.ม.","เมตร","แผ่น","ชุด","งาน","ครั้ง","100 ชิ้น"].map(u => <option key={u} value={u} />)}</datalist>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="ต้นทุน (บาท)"><input type="number" value={f.cost} onChange={set("cost")} min="0" /></Field>
        <Field label="ราคาขาย (บาท)"><input type="number" value={f.price} onChange={set("price")} min="0" /></Field>
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
// ERP: COMPANY PAGE
// ============================================================
function CompanyPage({ company, setCompany, showToast }) {
  const [f, setF] = useState(company);
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  const save = () => { setCompany(f); showToast("บันทึกข้อมูลบริษัทแล้ว"); };
  return (
    <div style={{ maxWidth: 540, animation: "fadeIn 0.3s ease" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>ข้อมูลบริษัท</h2>
      <div style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="ชื่อบริษัท"><input value={f.name} onChange={set("name")} /></Field>
        <Field label="ที่อยู่"><textarea value={f.address} onChange={set("address")} rows={2} style={{ resize: "vertical" }} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="โทรศัพท์"><input value={f.phone} onChange={set("phone")} /></Field>
          <Field label="อีเมล"><input value={f.email} onChange={set("email")} /></Field>
        </div>
        <Field label="เลขประจำตัวผู้เสียภาษี"><input value={f.taxId} onChange={set("taxId")} /></Field>
        <Btn onClick={save} color="#FF6B00">💾 บันทึกข้อมูล</Btn>
      </div>
    </div>
  );
}

// ============================================================
// ERP: DOCUMENT PAGE
// ============================================================
function DocumentPage({ type, documents, allDocuments, setDocuments, customers, products, company, showToast }) {
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const dt = DOC_TYPES[type];
  const filtered = documents.filter(d =>
    (filterStatus === "all" || d.status === filterStatus) &&
    (d.docNo?.includes(search) || d.customerName?.includes(search))
  );
  const nextDocNo = () => {
    const count = allDocuments.filter(d => d.type === type).length + 1;
    const year = new Date().getFullYear() + 543;
    return `${dt.prefix}${year}-${String(count).padStart(4, "0")}`;
  };
  const newDoc = () => {
    setEditing({ id: "", type, docNo: nextDocNo(), date: today(), dueDate: addDays(today(), 30), customerId: "", customerName: "", projectName: "", reference: "", salesPerson: "", items: [], discount: 0, vat: true, wht: false, whtRate: 3, status: "draft", notes: "" });
  };
  const convertTo = (doc, toType) => {
    const converted = convertDoc(doc, toType, allDocuments, customers);
    const saved = { ...converted, id: genId(), createdAt: Date.now(), updatedAt: Date.now() };
    setDocuments(prev => [...prev, saved]);
    showToast(`แปลงเป็น${DOC_TYPES[toType].label}แล้ว — ${saved.docNo}`);
  };
  const save = (doc) => {
    if (!doc.customerId) return showToast("กรุณาเลือกลูกค้า", "error");
    if (doc.items.length === 0) return showToast("กรุณาเพิ่มรายการสินค้า", "error");
    const now = Date.now();
    if (doc.id) { setDocuments(prev => prev.map(d => d.id === doc.id ? { ...doc, updatedAt: now } : d)); showToast("บันทึกเอกสารแล้ว"); }
    else { setDocuments(prev => [...prev, { ...doc, id: genId(), createdAt: now, updatedAt: now }]); showToast("สร้างเอกสารใหม่แล้ว"); }
    setEditing(null);
  };
  const del = (id) => { if (!confirm("ลบเอกสารนี้?")) return; setDocuments(prev => prev.filter(d => d.id !== id)); showToast("ลบเอกสารแล้ว"); };
  const changeStatus = (id, status) => { setDocuments(prev => prev.map(d => d.id === id ? { ...d, status } : d)); showToast(`อัปเดตสถานะเป็น "${STATUS_LABELS[status]}"`); };
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: dt.color + "22", color: dt.color, fontSize: 12, padding: "3px 10px", borderRadius: 99 }}>{dt.short}</span>{dt.label}
          </h2>
          <p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{documents.length} ฉบับ</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ค้นหา..." style={{ width: 180 }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 130 }}>
            <option value="all">ทุกสถานะ</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <Btn onClick={newDoc} color={dt.color}>+ สร้างเอกสาร</Btn>
        </div>
      </div>
      <div style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "#555" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
            <div>ยังไม่มีเอกสาร</div>
            <Btn onClick={newDoc} color={dt.color} style={{ marginTop: 16 }}>+ สร้างเอกสารแรก</Btn>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#1A2233" }}>
                {["เลขที่เอกสาร", "ลูกค้า", "วันที่", "วันครบกำหนด", "ยอดรวม", "สถานะ", "จัดการ"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, color: "#A8B0C0", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => {
                const sub = doc.items.reduce((s, i) => s + i.qty * i.price, 0);
                const disc = sub * (doc.discount / 100);
                const vat = doc.vat ? (sub - disc) * 0.07 : 0;
                const total = sub - disc + vat;
                return (
                  <tr key={doc.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontFamily: "monospace", color: dt.color }}>{doc.docNo}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>{doc.customerName || "-"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#888" }}>{fmtDate(doc.date)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#888" }}>{fmtDate(doc.dueDate)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600 }}>฿{fmtMoney(total)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <select value={doc.status} onChange={e => changeStatus(doc.id, e.target.value)}
                        style={{ width: "auto", background: STATUS_COLORS[doc.status] + "22", color: STATUS_COLORS[doc.status], border: `1px solid ${STATUS_COLORS[doc.status]}55`, padding: "3px 8px", fontSize: 12 }}>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <IconBtn onClick={() => setEditing({ ...doc })} title="แก้ไข">✏️</IconBtn>
                        <IconBtn onClick={() => printDocument(doc, customers, company)} title="พิมพ์/ดาวน์โหลด PDF">🖨️</IconBtn>
                        {CONVERT_MAP[doc.type]?.map(toType => (
                          <IconBtn key={toType} onClick={() => convertTo(doc, toType)} title={`แปลงเป็น${DOC_TYPES[toType].label}`}
                            style={{ background: DOC_TYPES[toType].color + "22", color: DOC_TYPES[toType].color, border: `1px solid ${DOC_TYPES[toType].color}44`, fontSize: 10, padding: "3px 8px", borderRadius: 6, cursor: "pointer" }}>
                            → {DOC_TYPES[toType].short}
                          </IconBtn>
                        ))}
                        <IconBtn onClick={() => del(doc.id)} title="ลบ" danger>🗑️</IconBtn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {editing && (
        <Modal title={`${editing.id ? "แก้ไข" : "สร้าง"}${dt.label}`} onClose={() => setEditing(null)} width={760}>
          <DocForm doc={editing} type={type} customers={customers} products={products} onSave={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}

function DocForm({ doc, type, customers, products, onSave, onCancel }) {
  const [f, setF] = useState({ ...doc });
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  const setN = (k) => (e) => setF(prev => ({ ...prev, [k]: parseFloat(e.target.value) || 0 }));
  const setBool = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.checked }));
  const dt = DOC_TYPES[type];
  const setCust = (id) => { const c = customers.find(c => c.id === id); setF(prev => ({ ...prev, customerId: id, customerName: c?.name || "" })); };
  const addItem = () => setF(prev => ({ ...prev, items: [...prev.items, { id: genId(), name: "", unit: "ชิ้น", qty: 1, price: 0 }] }));
  const removeItem = (id) => setF(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  const setItem = (id, k, v) => setF(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? { ...i, [k]: k === "qty" || k === "price" ? parseFloat(v) || 0 : v } : i) }));
  const pickProduct = (itemId, prodId) => {
    const p = products.find(p => p.id === prodId);
    if (!p) return;
    setF(prev => ({ ...prev, items: prev.items.map(i => i.id === itemId ? { ...i, name: p.name, unit: p.unit, price: p.price } : i) }));
  };
  const subtotal = f.items.reduce((s, i) => s + i.qty * i.price, 0);
  const discAmt = subtotal * (f.discount / 100);
  const afterDisc = subtotal - discAmt;
  const vatAmt = f.vat ? afterDisc * 0.07 : 0;
  const total = afterDisc + vatAmt;
  const whtAmt = f.wht ? afterDisc * (f.whtRate / 100) : 0;
  const netPay = total - whtAmt;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="เลขที่เอกสาร *"><input value={f.docNo} onChange={set("docNo")} /></Field>
        <Field label="วันที่"><input type="date" value={f.date} onChange={set("date")} /></Field>
        <Field label="วันครบกำหนด"><input type="date" value={f.dueDate} onChange={set("dueDate")} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="ลูกค้า *">
          <select value={f.customerId} onChange={e => setCust(e.target.value)}>
            <option value="">-- เลือกลูกค้า --</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="โครงการ/อ้างอิง"><input value={f.projectName} onChange={set("projectName")} placeholder="ชื่อโครงการ" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="พนักงานขาย"><input value={f.salesPerson || ""} onChange={set("salesPerson")} placeholder="ชื่อพนักงานขาย" /></Field>
        <Field label="เลขที่อ้างอิง (Ref. No.)"><input value={f.reference || ""} onChange={set("reference")} placeholder="เช่น QT2568-0001" /></Field>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <label style={{ fontSize: 13, color: "#A8B0C0", fontWeight: 600 }}>รายการสินค้า/บริการ</label>
          <Btn onClick={addItem} color={dt.color} small>+ เพิ่มรายการ</Btn>
        </div>
        <div style={{ background: "#1A2233", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 110px 110px 32px" }}>
            {["รายการ", "หน่วย", "จำนวน", "ราคา/หน่วย", "รวม", ""].map((h, i) => (
              <div key={i} style={{ padding: "8px 10px", fontSize: 11, color: "#555", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{h}</div>
            ))}
          </div>
          {f.items.map((item) => (
            <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: 6, borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "10px 8px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 110px 110px 32px", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 4 }}>
                  <select onChange={e => pickProduct(item.id, e.target.value)} style={{ width: 90, fontSize: 11, padding: "4px 4px" }} defaultValue="">
                    <option value="">เลือก</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input value={item.name} onChange={e => setItem(item.id, "name", e.target.value)} placeholder="ชื่อรายการ (EN)" style={{ flex: 1 }} />
                </div>
                <div style={{ padding: "0 6px" }}><input value={item.unit} onChange={e => setItem(item.id, "unit", e.target.value)} /></div>
                <div style={{ padding: "0 6px" }}><input type="number" value={item.qty} onChange={e => setItem(item.id, "qty", e.target.value)} min="0" step="0.01" /></div>
                <div style={{ padding: "0 6px" }}><input type="number" value={item.price} onChange={e => setItem(item.id, "price", e.target.value)} min="0" step="0.01" /></div>
                <div style={{ padding: "0 10px", fontSize: 13, fontWeight: 600, color: dt.color, textAlign: "right" }}>฿{fmtMoney(item.qty * item.price)}</div>
                <div style={{ padding: "0 4px" }}><IconBtn onClick={() => removeItem(item.id)} danger small>✕</IconBtn></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, paddingLeft: 4 }}>
                <input value={item.detail || ""} onChange={e => setItem(item.id, "detail", e.target.value)} placeholder="ชื่อรายการ (TH) / คำอธิบาย" style={{ fontSize: 11 }} />
                <textarea value={item.specs || ""} onChange={e => setItem(item.id, "specs", e.target.value)} placeholder={"รายละเอียดทางเทคนิค\n(พิมพ์บรรทัดละ 1 หัวข้อ)"} rows={2} style={{ fontSize: 11, resize: "vertical" }} />
              </div>
            </div>
          ))}
          {f.items.length === 0 && <div style={{ padding: "20px", textAlign: "center", color: "#555", fontSize: 13 }}>กด "+ เพิ่มรายการ" เพื่อเพิ่มสินค้า</div>}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Field label="ส่วนลด (%)"><input type="number" value={f.discount} onChange={setN("discount")} min="0" max="100" /></Field>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: "#ccc" }}>
              <input type="checkbox" checked={f.vat} onChange={setBool("vat")} style={{ width: "auto" }} />คิด VAT 7%
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: "#ccc" }}>
              <input type="checkbox" checked={f.wht} onChange={setBool("wht")} style={{ width: "auto" }} />หัก ณ ที่จ่าย
            </label>
            {f.wht && <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="number" value={f.whtRate} onChange={setN("whtRate")} min="0" max="10" style={{ width: 60 }} />
              <span style={{ fontSize: 13, color: "#ccc" }}>%</span>
            </div>}
          </div>
          <Field label="หมายเหตุ"><textarea value={f.notes} onChange={set("notes")} rows={2} style={{ resize: "vertical" }} placeholder="เงื่อนไขการชำระเงิน..." /></Field>
        </div>
        <div style={{ background: "#1A2233", borderRadius: 10, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
          <SumRow label="มูลค่ารวม" value={subtotal} />
          {f.discount > 0 && <SumRow label={`ส่วนลด ${f.discount}%`} value={-discAmt} />}
          {f.discount > 0 && <SumRow label="หลังหักส่วนลด" value={afterDisc} />}
          {f.vat && <SumRow label="VAT 7%" value={vatAmt} />}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 4, paddingTop: 8 }}>
            <SumRow label="ยอดรวมสุทธิ" value={total} bold color={dt.color} big />
          </div>
          {f.wht && <SumRow label={`หัก ณ ที่จ่าย ${f.whtRate}%`} value={-whtAmt} />}
          {f.wht && <SumRow label="ยอดที่ต้องชำระ" value={netPay} bold color="#10b981" />}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn onClick={() => onSave(f)} color={dt.color} style={{ flex: 1 }}>💾 บันทึกเอกสาร</Btn>
        <Btn onClick={onCancel} outline style={{ flex: 1 }}>ยกเลิก</Btn>
      </div>
    </div>
  );
}

function SumRow({ label, value, bold, color, big }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: big ? 14 : 13, color: "#A8B0C0" }}>{label}</span>
      <span style={{ fontSize: big ? 18 : 13, fontWeight: bold ? 700 : 400, color: color || (value < 0 ? "#ef4444" : "#fff") }}>
        {value < 0 ? "-" : ""}฿{fmtMoney(Math.abs(value))}
      </span>
    </div>
  );
}

// ============================================================
// CMS: BLOG MANAGER
// ============================================================
function BlogManager({ showToast }) {
  const [posts, setPosts] = useState(() => loadLocal("posts", [
    { id: "1", title: "วิธีเลือกขนาดป้ายไวนิลให้เหมาะกับหน้าร้านของคุณ", excerpt: "ป้ายใหญ่เกินไปหรือเล็กเกินไปเสียเงินฟรี มาดูสูตรคำนวณขนาดที่ถูกต้องก่อนสั่งผลิต", category: "ป้ายไวนิล", date: "2025-05-10", slug: "how-to-choose-vinyl-sign-size", cover: "", published: true, body: "" },
    { id: "2", title: "สติ๊กเกอร์กันน้ำ vs ไม่กันน้ำ เลือกแบบไหนดีสำหรับธุรกิจคุณ", excerpt: "ราคาต่างกันนิดเดียว แต่อายุการใช้งานต่างกันมาก", category: "สติ๊กเกอร์", date: "2025-05-05", slug: "waterproof-vs-normal-sticker", cover: "", published: true, body: "" },
  ]));
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const save = (p) => {
    const newPosts = p.id ? posts.map(x => x.id === p.id ? p : x) : [...posts, { ...p, id: Date.now().toString() }];
    setPosts(newPosts); saveLocal("posts", newPosts);
    showToast(p.id ? "บันทึกบทความแล้ว" : "เพิ่มบทความใหม่แล้ว");
    setEditing(null);
  };
  const del = (id) => {
    if (!confirm("ลบบทความนี้?")) return;
    const newPosts = posts.filter(p => p.id !== id);
    setPosts(newPosts); saveLocal("posts", newPosts); showToast("ลบบทความแล้ว");
  };
  const filtered = posts.filter(p => p.title.includes(search) || p.category.includes(search));
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>จัดการบทความ</h2>
          <p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{posts.length} บทความ</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ค้นหา..." style={{ width: 200 }} />
          <Btn onClick={() => setEditing({ id: "", title: "", excerpt: "", category: "", date: new Date().toISOString().slice(0,10), slug: "", cover: "", published: true, body: "" })} color="#FF6B00">+ เพิ่มบทความ</Btn>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(p => (
          <div key={p.id} style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 80, height: 60, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#1A2233", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {p.cover ? <img src={p.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24 }}>📄</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</span>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: p.published ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.2)", color: p.published ? "#10b981" : "#6b7280" }}>
                  {p.published ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#555" }}>{p.category} · {fmtDateTH(p.date)}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.excerpt}</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <IconBtn onClick={() => setEditing({ ...p })}>✏️</IconBtn>
              <IconBtn onClick={() => del(p.id)} danger>🗑️</IconBtn>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <EmptyState icon="📝" text="ยังไม่มีบทความ" />}
      </div>
      {editing && (
        <Modal title={editing.id ? "แก้ไขบทความ" : "เพิ่มบทความใหม่"} onClose={() => setEditing(null)} width={700}>
          <BlogForm data={editing} onSave={save} onCancel={() => setEditing(null)} showToast={showToast} />
        </Modal>
      )}
    </div>
  );
}

function BlogForm({ data, onSave, onCancel, showToast }) {
  const [f, setF] = useState({ ...data });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const uploadCover = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `blog/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("cms-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("cms-media").getPublicUrl(path);
      setF(p => ({ ...p, cover: urlData.publicUrl }));
      showToast("อัปโหลดรูปสำเร็จ");
    } catch {
      setF(p => ({ ...p, cover: URL.createObjectURL(file) }));
      showToast("ใช้รูป preview (ยังไม่ได้อัปโหลดจริง)", "error");
    }
    setUploading(false);
  };
  const genSlug = () => {
    const slug = f.title.toLowerCase().replace(/[^a-z0-9ก-๙\s]/g, "").replace(/\s+/g, "-").slice(0, 60);
    setF(p => ({ ...p, slug }));
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label>รูป Cover บทความ</label>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 160, height: 100, borderRadius: 10, overflow: "hidden", background: "#1A2233", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {f.cover ? <img src={f.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 32, opacity: 0.4 }}>🖼️</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => uploadCover(e.target.files[0])} />
            <Btn onClick={() => fileRef.current.click()} color="#3B82F6" small disabled={uploading}>
              {uploading ? "⏳ กำลังอัปโหลด..." : "📁 เลือกรูปภาพ"}
            </Btn>
            <input value={f.cover} onChange={set("cover")} placeholder="หรือวาง URL รูปภาพ" style={{ fontSize: 12 }} />
          </div>
        </div>
      </div>
      <Field label="หัวข้อบทความ *"><input value={f.title} onChange={set("title")} onBlur={genSlug} placeholder="หัวข้อบทความ" /></Field>
      <Field label="Slug (URL)">
        <div style={{ display: "flex", gap: 8 }}>
          <input value={f.slug} onChange={set("slug")} placeholder="url-slug" style={{ flex: 1 }} />
          <Btn onClick={genSlug} small color="#6B7280">สร้างอัตโนมัติ</Btn>
        </div>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="หมวดหมู่">
          <input value={f.category} onChange={set("category")} list="cat-list" placeholder="เช่น ป้ายไวนิล" />
          <datalist id="cat-list">{["ป้ายไวนิล","สติ๊กเกอร์","Roll Up","Backdrop","PP Board","ฉลากสินค้า","ทั่วไป"].map(c => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="วันที่เผยแพร่"><input type="date" value={f.date} onChange={set("date")} /></Field>
      </div>
      <Field label="บทสรุป"><textarea value={f.excerpt} onChange={set("excerpt")} rows={2} placeholder="อธิบายสั้นๆ..." /></Field>
      <Field label="เนื้อหาบทความ"><textarea value={f.body} onChange={set("body")} rows={8} placeholder="เขียนเนื้อหาบทความที่นี่... (รองรับ Markdown)" style={{ fontFamily: "monospace" }} /></Field>
      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#ccc", marginBottom: 0 }}>
        <input type="checkbox" checked={f.published} onChange={e => setF(p => ({ ...p, published: e.target.checked }))} style={{ width: "auto" }} />
        เผยแพร่บทความนี้
      </label>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn onClick={() => onSave(f)} color="#FF6B00" style={{ flex: 1 }}>💾 บันทึก</Btn>
        <Btn onClick={onCancel} outline style={{ flex: 1 }}>ยกเลิก</Btn>
      </div>
    </div>
  );
}

// ============================================================
// CMS: HERO MANAGER
// ============================================================
function HeroManager({ showToast }) {
  const [hero, setHero] = useState(() => loadLocal("hero", {
    headline1: "ผลิตสื่อโฆษณา", headlineHighlight: "ครบวงจร", headline2: "",
    subtitle: "ออกแบบ ผลิต ติดตั้ง งานป้าย ร้านค้า และสื่อโฆษณาทุกประเภท",
    trustPoints: ["ออกแบบ ผลิต ติดตั้ง ครบจบในที่เดียว", "บริการหลังการขายครบวงจร", "จัดส่งทั่วประเทศ พร้อมแจ้งเลขพัสดุ"],
    phone: "065-916-1539", lineUrl: "https://lin.ee/O0nPl03", bgImage: "/images/hero-bg.jpg",
  }));
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const set = k => e => setHero(p => ({ ...p, [k]: e.target.value }));
  const uploadBg = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const { error } = await supabase.storage.from("cms-media").upload(`hero/bg.${ext}`, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("cms-media").getPublicUrl(`hero/bg.${ext}`);
      setHero(p => ({ ...p, bgImage: urlData.publicUrl }));
      showToast("อัปโหลดรูปพื้นหลังสำเร็จ");
    } catch { showToast("ตรวจสอบ Supabase Storage bucket ชื่อ cms-media", "error"); }
    setUploading(false);
  };
  const setTrust = (i, val) => { const arr = [...hero.trustPoints]; arr[i] = val; setHero(p => ({ ...p, trustPoints: arr })); };
  const addTrust = () => setHero(p => ({ ...p, trustPoints: [...p.trustPoints, ""] }));
  const delTrust = (i) => setHero(p => ({ ...p, trustPoints: p.trustPoints.filter((_, idx) => idx !== i) }));
  const save = () => { saveLocal("hero", hero); showToast("บันทึก Hero Section แล้ว"); };
  return (
    <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 680 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>แก้ไข Hero Section</h2>
      <CMSCard>
        <CMSSectionTitle>รูปพื้นหลัง</CMSSectionTitle>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ width: 200, height: 110, borderRadius: 10, overflow: "hidden", background: "#1A2233", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0, position: "relative" }}>
            {hero.bgImage && <img src={hero.bgImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display="none"} />}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => uploadBg(e.target.files[0])} />
            <Btn onClick={() => fileRef.current.click()} color="#3B82F6" small disabled={uploading}>
              {uploading ? "⏳ กำลังอัปโหลด..." : "📁 เปลี่ยนรูปพื้นหลัง"}
            </Btn>
            <input value={hero.bgImage} onChange={set("bgImage")} placeholder="หรือวาง URL รูปภาพ" />
          </div>
        </div>
        <CMSSectionTitle>ข้อความหลัก</CMSSectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          <Field label="บรรทัดที่ 1"><input value={hero.headline1} onChange={set("headline1")} /></Field>
          <Field label="ข้อความสีส้ม (highlight)"><input value={hero.headlineHighlight} onChange={set("headlineHighlight")} /></Field>
          <Field label="บรรทัดที่ 3 (ไม่บังคับ)"><input value={hero.headline2} onChange={set("headline2")} /></Field>
          <Field label="คำอธิบาย (subtitle)"><textarea value={hero.subtitle} onChange={set("subtitle")} rows={3} /></Field>
        </div>
        <CMSSectionTitle>จุดเด่น (Trust Points)</CMSSectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {hero.trustPoints.map((tp, i) => (
            <div key={i} style={{ display: "flex", gap: 8 }}>
              <input value={tp} onChange={e => setTrust(i, e.target.value)} style={{ flex: 1 }} />
              <IconBtn onClick={() => delTrust(i)} danger small>✕</IconBtn>
            </div>
          ))}
          <Btn onClick={addTrust} small outline>+ เพิ่มจุดเด่น</Btn>
        </div>
        <CMSSectionTitle>ข้อมูลติดต่อ (Hero)</CMSSectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <Field label="เบอร์โทร"><input value={hero.phone} onChange={set("phone")} /></Field>
          <Field label="LINE URL"><input value={hero.lineUrl} onChange={set("lineUrl")} /></Field>
        </div>
        <Btn onClick={save} color="#FF6B00">💾 บันทึก Hero Section</Btn>
      </CMSCard>
    </div>
  );
}

// ============================================================
// CMS: SERVICES MANAGER
// ============================================================
function ServicesManager({ showToast }) {
  const [services, setServices] = useState(() => loadLocal("services", [
    { id: "1", name: "ป้ายไวนิล", icon: "🪟", desc: "พิมพ์งานคุณภาพสูง ทนต่อแสงและฝน", price: "ตร.ม.ละ 200฿", url: "/services/vinyl" },
    { id: "2", name: "สติ๊กเกอร์", icon: "🏷️", desc: "สติ๊กเกอร์กันน้ำ indoor/outdoor", price: "ตร.ม.ละ 350฿", url: "/services/sticker" },
    { id: "3", name: "PP Board", icon: "📋", desc: "ป้ายพีพีบอร์ดน้ำหนักเบา พกพาง่าย", price: "แผ่นละ 400฿", url: "/services/ppboard" },
    { id: "4", name: "Roll Up", icon: "🎪", desc: "ป้าย Roll Up สำหรับงานนิทรรศการ", price: "ชิ้นละ 2,200฿", url: "/services/rollup" },
    { id: "5", name: "Backdrop", icon: "🖼", desc: "ป้าย Backdrop ขนาดใหญ่", price: "ชุดละ 3,500฿", url: "/services/backdrop" },
    { id: "6", name: "ฉลากสินค้า", icon: "🏷", desc: "พิมพ์ฉลากสินค้าคุณภาพสูง", price: "100 ชิ้นละ 400฿", url: "/services/label" },
  ]));
  const [editing, setEditing] = useState(null);
  const save = (s) => {
    const newSvc = s.id ? services.map(x => x.id === s.id ? s : x) : [...services, { ...s, id: Date.now().toString() }];
    setServices(newSvc); saveLocal("services", newSvc); showToast("บันทึกบริการแล้ว"); setEditing(null);
  };
  const del = (id) => { if (!confirm("ลบบริการนี้?")) return; const ns = services.filter(s => s.id !== id); setServices(ns); saveLocal("services", ns); showToast("ลบบริการแล้ว"); };
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>จัดการบริการ</h2>
        <Btn onClick={() => setEditing({ id: "", name: "", icon: "🛠️", desc: "", price: "", url: "" })} color="#FF6B00">+ เพิ่มบริการ</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {services.map(s => (
          <div key={s.id} style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <IconBtn onClick={() => setEditing({ ...s })}>✏️</IconBtn>
                <IconBtn onClick={() => del(s.id)} danger>🗑️</IconBtn>
              </div>
            </div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{s.name}</div>
            <div style={{ fontSize: 12, color: "#888", lineHeight: 1.7, marginBottom: 8 }}>{s.desc}</div>
            <div style={{ fontSize: 12, color: "#FF6B00", fontWeight: 600 }}>เริ่มต้น {s.price}</div>
          </div>
        ))}
      </div>
      {editing && (
        <Modal title={editing.id ? "แก้ไขบริการ" : "เพิ่มบริการ"} onClose={() => setEditing(null)} width={480}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 12 }}>
              <Field label="ไอคอน"><input value={editing.icon} onChange={e => setEditing(p => ({ ...p, icon: e.target.value }))} style={{ textAlign: "center", fontSize: 24 }} /></Field>
              <Field label="ชื่อบริการ *"><input value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} /></Field>
            </div>
            <Field label="คำอธิบาย"><textarea value={editing.desc} onChange={e => setEditing(p => ({ ...p, desc: e.target.value }))} rows={3} /></Field>
            <Field label="ราคาเริ่มต้น"><input value={editing.price} onChange={e => setEditing(p => ({ ...p, price: e.target.value }))} placeholder="เช่น ตร.ม.ละ 200฿" /></Field>
            <Field label="URL หน้าบริการ"><input value={editing.url} onChange={e => setEditing(p => ({ ...p, url: e.target.value }))} placeholder="/services/vinyl" /></Field>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={() => save(editing)} color="#FF6B00" style={{ flex: 1 }}>บันทึก</Btn>
              <Btn onClick={() => setEditing(null)} outline style={{ flex: 1 }}>ยกเลิก</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// CMS: REVIEWS MANAGER
// ============================================================
function ReviewsManager({ showToast }) {
  const [reviews, setReviews] = useState(() => loadLocal("reviews", [
    { id: "1", name: "คุณสมชาย", company: "ร้านอาหารครัวบ้าน", stars: 5, text: "บริการดีมาก งานออกมาสวยงาม ส่งตรงเวลา" },
    { id: "2", name: "คุณนงนุช", company: "ร้านเสื้อผ้า Fashion Plus", stars: 5, text: "ทำป้ายหน้าร้านสวยมากค่ะ" },
  ]));
  const [editing, setEditing] = useState(null);
  const save = (r) => {
    const nr = r.id ? reviews.map(x => x.id === r.id ? r : x) : [...reviews, { ...r, id: Date.now().toString() }];
    setReviews(nr); saveLocal("reviews", nr); showToast(r.id ? "บันทึกรีวิวแล้ว" : "เพิ่มรีวิวแล้ว"); setEditing(null);
  };
  const del = (id) => { if (!confirm("ลบรีวิวนี้?")) return; const nr = reviews.filter(r => r.id !== id); setReviews(nr); saveLocal("reviews", nr); showToast("ลบรีวิวแล้ว"); };
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>จัดการรีวิว</h2>
        <Btn onClick={() => setEditing({ id: "", name: "", company: "", stars: 5, text: "" })} color="#FF6B00">+ เพิ่มรีวิว</Btn>
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
              <IconBtn onClick={() => setEditing({ ...r })}>✏️</IconBtn>
              <IconBtn onClick={() => del(r.id)} danger>🗑️</IconBtn>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <Modal title={editing.id ? "แก้ไขรีวิว" : "เพิ่มรีวิว"} onClose={() => setEditing(null)} width={480}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="ชื่อผู้รีวิว"><input value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} /></Field>
              <Field label="บริษัท/ร้านค้า"><input value={editing.company} onChange={e => setEditing(p => ({ ...p, company: e.target.value }))} /></Field>
            </div>
            <Field label="ดาว (1-5)">
              <div style={{ display: "flex", gap: 6 }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setEditing(p => ({ ...p, stars: s }))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: s <= editing.stars ? "#F59E0B" : "#333" }}>★</button>
                ))}
              </div>
            </Field>
            <Field label="ข้อความรีวิว"><textarea value={editing.text} onChange={e => setEditing(p => ({ ...p, text: e.target.value }))} rows={4} /></Field>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={() => save(editing)} color="#FF6B00" style={{ flex: 1 }}>บันทึก</Btn>
              <Btn onClick={() => setEditing(null)} outline style={{ flex: 1 }}>ยกเลิก</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// CMS: PORTFOLIO MANAGER
// ============================================================
function PortfolioManager({ showToast }) {
  const [items, setItems] = useState(() => loadLocal("portfolio", []));
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const uploadImg = async (file, callback) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `portfolio/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("cms-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("cms-media").getPublicUrl(path);
      callback(urlData.publicUrl); showToast("อัปโหลดรูปสำเร็จ");
    } catch { callback(URL.createObjectURL(file)); showToast("ใช้ preview (ตรวจสอบ Supabase Storage)", "error"); }
    setUploading(false);
  };
  const save = (item) => {
    const ni = item.id ? items.map(x => x.id === item.id ? item : x) : [...items, { ...item, id: Date.now().toString() }];
    setItems(ni); saveLocal("portfolio", ni); showToast("บันทึกผลงานแล้ว"); setEditing(null);
  };
  const del = (id) => { if (!confirm("ลบผลงานนี้?")) return; const ni = items.filter(i => i.id !== id); setItems(ni); saveLocal("portfolio", ni); showToast("ลบผลงานแล้ว"); };
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>จัดการผลงาน</h2>
        <Btn onClick={() => setEditing({ id: "", title: "", category: "", img: "" })} color="#FF6B00">+ เพิ่มผลงาน</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
        {items.map(item => (
          <div key={item.id} style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ height: 140, background: "#1A2233" }}>
              {item.img ? <img src={item.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 36 }}>🖼</div>}
            </div>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{item.title || "ไม่มีชื่อ"}</div>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 10 }}>{item.category}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <IconBtn onClick={() => setEditing({ ...item })} small>✏️</IconBtn>
                <IconBtn onClick={() => del(item.id)} danger small>🗑️</IconBtn>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <EmptyState icon="🖼" text="ยังไม่มีผลงาน" />}
      </div>
      {editing && (
        <Modal title={editing.id ? "แก้ไขผลงาน" : "เพิ่มผลงาน"} onClose={() => setEditing(null)} width={460}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="รูปภาพผลงาน">
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 120, height: 80, borderRadius: 8, overflow: "hidden", background: "#1A2233", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {editing.img ? <img src={editing.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24, opacity: 0.4 }}>🖼</span>}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => uploadImg(e.target.files[0], url => setEditing(p => ({ ...p, img: url })))} />
                  <Btn onClick={() => fileRef.current.click()} color="#3B82F6" small disabled={uploading}>{uploading ? "⏳..." : "📁 เลือกรูป"}</Btn>
                  <input value={editing.img} onChange={e => setEditing(p => ({ ...p, img: e.target.value }))} placeholder="หรือวาง URL" />
                </div>
              </div>
            </Field>
            <Field label="ชื่อผลงาน"><input value={editing.title} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} /></Field>
            <Field label="หมวดหมู่">
              <input value={editing.category} onChange={e => setEditing(p => ({ ...p, category: e.target.value }))} list="cat-port" placeholder="เช่น ป้ายไวนิล" />
              <datalist id="cat-port">{["ป้ายไวนิล","สติ๊กเกอร์","Roll Up","Backdrop","PP Board","ฉลากสินค้า"].map(c => <option key={c} value={c} />)}</datalist>
            </Field>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={() => save(editing)} color="#FF6B00" style={{ flex: 1 }}>บันทึก</Btn>
              <Btn onClick={() => setEditing(null)} outline style={{ flex: 1 }}>ยกเลิก</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// CMS: CONTACT MANAGER
// ============================================================
function ContactManager({ showToast }) {
  const [c, setC] = useState(() => loadLocal("contact", {
    phone: "065-916-1539", line: "https://lin.ee/O0nPl03", email: "info@displayworksmedia.com",
    address: "123 ถ.ตัวอย่าง กรุงเทพฯ 10110", facebook: "", instagram: "", hours: "จ-ศ 9:00-18:00 น.",
  }));
  const set = k => e => setC(p => ({ ...p, [k]: e.target.value }));
  const save = () => { saveLocal("contact", c); showToast("บันทึกข้อมูลติดต่อแล้ว"); };
  return (
    <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 560 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>ข้อมูลติดต่อ</h2>
      <CMSCard>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="📞 เบอร์โทร"><input value={c.phone} onChange={set("phone")} /></Field>
            <Field label="📧 อีเมล"><input value={c.email} onChange={set("email")} /></Field>
          </div>
          <Field label="💬 LINE URL"><input value={c.line} onChange={set("line")} /></Field>
          <Field label="📍 ที่อยู่"><textarea value={c.address} onChange={set("address")} rows={2} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Facebook URL"><input value={c.facebook} onChange={set("facebook")} placeholder="https://facebook.com/..." /></Field>
            <Field label="Instagram URL"><input value={c.instagram} onChange={set("instagram")} placeholder="https://instagram.com/..." /></Field>
          </div>
          <Field label="⏰ เวลาทำการ"><input value={c.hours} onChange={set("hours")} /></Field>
          <Btn onClick={save} color="#FF6B00">💾 บันทึกข้อมูลติดต่อ</Btn>
        </div>
      </CMSCard>
    </div>
  );
}

// ============================================================
// SHARED UI COMPONENTS
// ============================================================
function Field({ label, children }) { return <div><label>{label}</label>{children}</div>; }
function CMSCard({ children }) {
  return <div style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24 }}>{children}</div>;
}
function CMSSectionTitle({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: "#FF6B00", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 4 }}>{children}</div>;
}
function EmptyState({ icon, text }) {
  return (
    <div style={{ gridColumn: "1/-1", padding: 60, textAlign: "center", color: "#555" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div>{text}</div>
    </div>
  );
}
function Btn({ onClick, children, color, outline, small, style, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: outline ? "transparent" : (color || "#FF6B00"),
      border: `1px solid ${outline ? "rgba(255,255,255,0.15)" : (color || "#FF6B00")}`,
      color: outline ? "#A8B0C0" : "#fff",
      padding: small ? "6px 12px" : "9px 18px",
      borderRadius: 8, fontSize: small ? 12 : 13, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
      opacity: disabled ? 0.6 : 1, whiteSpace: "nowrap", ...style,
    }}>{children}</button>
  );
}
function IconBtn({ onClick, children, danger, small }) {
  return (
    <button onClick={onClick} style={{
      background: danger ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)",
      border: `1px solid ${danger ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
      color: danger ? "#ef4444" : "#A8B0C0",
      padding: small ? "2px 6px" : "5px 9px", borderRadius: 6,
      cursor: "pointer", fontSize: small ? 11 : 14, lineHeight: 1, fontFamily: "inherit",
    }}>{children}</button>
  );
}
function Modal({ title, onClose, children, width = 500 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, width: "100%", maxWidth: width, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", animation: "fadeIn 0.2s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", padding: "20px 22px", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
