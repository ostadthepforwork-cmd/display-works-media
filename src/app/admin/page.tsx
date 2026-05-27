'use client';
// @ts-nocheck
// ─── IMPORTS ─────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── CMS HELPERS ─────────────────────────────────────────────────────────────
function loadLocal(key: string, def: unknown) {
  try { const v = localStorage.getItem("cms_" + key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function saveLocal(key: string, val: unknown) {
  try { localStorage.setItem("cms_" + key, JSON.stringify(val)); } catch {}
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

// ── Shared calculation utility — ใช้ร่วมกันทุกจุด ──────────
const calcDocTotal = (doc: any) => {
  const subtotal    = (doc.items || []).reduce((s, i) => s + (i.qty || 0) * (i.price || 0), 0);
  const discountAmt = subtotal * ((doc.discount || 0) / 100);
  const afterDisc   = subtotal - discountAmt;
  const vatAmt      = doc.vat  ? afterDisc * 0.07                        : 0;
  const total       = afterDisc + vatAmt;
  const whtAmt      = doc.wht  ? afterDisc * ((doc.whtRate || 0) / 100)  : 0;
  const netPay      = total - whtAmt;
  return { subtotal, discountAmt, afterDisc, vatAmt, total, whtAmt, netPay };
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

function loadStore(key: string, def: unknown) {
  try {
    const v = localStorage.getItem("dw_" + key);
    return v ? JSON.parse(v) : def;
  } catch { return def; }
}
function saveStore(key: string, val: unknown) {
  try { localStorage.setItem("dw_" + key, JSON.stringify(val)); } catch {}
}

// ============================================================
// PRINT / PDF helper — Premium A4 Design (Display Works Media)
// ============================================================
function printDocument(doc: any, customers: any[], company: any) {
  const cust = customers.find((c) => c.id === doc.customerId) || {};
  const dt = DOC_TYPES[doc.type];

  // ── Calculations (shared utility) ─────────────────────────
  const { subtotal, discountAmt, afterDisc, vatAmt, total, whtAmt, netPay } = calcDocTotal(doc);

  // ── Label mapping per document type ───────────────────────
  const DOC_LABELS = {
    quote:   { en: "QUOTATION",    sub: "ใบเสนอราคา",     valid: "ยืนยันราคาถึง" },
    bill:    { en: "BILLING NOTE", sub: "ใบวางบิล",        valid: "วันครบกำหนด" },
    invoice: { en: "INVOICE",      sub: "ใบแจ้งหนี้",      valid: "วันครบกำหนด" },
    receipt: { en: "RECEIPT",      sub: "ใบเสร็จรับเงิน",  valid: "วันที่ชำระ" },
  };
  const lbl = DOC_LABELS[doc.type] || DOC_LABELS.quote;

  // ── Table rows ────────────────────────────────────────────
  const rows = doc.items.map((item, i) => `
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:8px;text-align:center;color:#6b7280;font-size:10px;">${i + 1}</td>
      <td style="padding:8px 10px;">
        <div style="font-weight:600;font-size:11px;color:#1e293b;">${item.name}</div>
      </td>
      <td style="padding:8px;text-align:center;font-size:10px;color:#6b7280;">${item.unit}</td>
      <td style="padding:8px;text-align:right;font-size:11px;">${fmtMoney(item.qty)}</td>
      <td style="padding:8px;text-align:right;font-size:11px;">${fmtMoney(item.price)}</td>
      <td style="padding:8px;text-align:right;font-size:11px;font-weight:600;color:#1e293b;">${fmtMoney(item.qty * item.price)}</td>
    </tr>`).join("");

  // ── Summary rows ──────────────────────────────────────────
  const summaryRows = `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:6px 12px;color:#64748b;font-size:10px;font-weight:600;">SUBTOTAL</td>
      <td style="padding:6px 12px;text-align:right;font-size:11px;color:#1e293b;">${fmtMoney(subtotal)}</td>
    </tr>
    ${doc.discount > 0 ? `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:6px 12px;color:#ef4444;font-size:10px;font-weight:600;">DISCOUNT ${doc.discount}%</td>
      <td style="padding:6px 12px;text-align:right;font-size:11px;color:#ef4444;">- ${fmtMoney(discountAmt)}</td>
    </tr>` : ""}
    ${doc.discount > 0 ? `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:6px 12px;color:#64748b;font-size:10px;font-weight:600;">TOTAL BEFORE VAT</td>
      <td style="padding:6px 12px;text-align:right;font-size:11px;color:#1e293b;">${fmtMoney(afterDisc)}</td>
    </tr>` : ""}
    ${doc.vat ? `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:6px 12px;color:#64748b;font-size:10px;font-weight:600;">VAT 7%</td>
      <td style="padding:6px 12px;text-align:right;font-size:11px;color:#1e293b;">${fmtMoney(vatAmt)}</td>
    </tr>` : ""}
    ${doc.wht ? `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:6px 12px;color:#64748b;font-size:10px;font-weight:600;">หัก ณ ที่จ่าย ${doc.whtRate}%</td>
      <td style="padding:6px 12px;text-align:right;font-size:11px;color:#64748b;">- ${fmtMoney(whtAmt)}</td>
    </tr>` : ""}
    <tr style="background:#FF5500;">
      <td style="padding:8px 12px;font-weight:800;font-size:11px;color:#fff;">
        GRAND TOTAL<br/><span style="font-size:8px;font-weight:400;opacity:0.85;">${lbl.sub}</span>
      </td>
      <td style="padding:8px 12px;text-align:right;font-weight:800;font-size:14px;color:#fff;">
        ${fmtMoney(netPay)} <span style="font-size:9px;font-weight:400;">THB</span>
      </td>
    </tr>`;

  // ── Notes list ────────────────────────────────────────────
  const noteItems = doc.notes
    ? doc.notes.split("\n").filter(Boolean).map(n =>
        `<li style="margin-bottom:3px;">${n}</li>`).join("")
    : "<li>ขอบคุณที่ไว้วางใจ Display Works Media</li>";

  // ── Full HTML ─────────────────────────────────────────────
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
  .page{background:#fff;width:210mm;min-height:297mm;padding:16mm 14mm 14mm;margin:0 auto;
        box-shadow:0 10px 40px rgba(0,0,0,.12);display:flex;flex-direction:column;justify-content:space-between;}
  @media print{
    body{background:#fff!important;}
    .page{width:100%!important;box-shadow:none!important;padding:10mm 8mm!important;margin:0!important;}
    tr,section{page-break-inside:avoid;break-inside:avoid;}
  }
</style>
</head>
<body>
<div class="page">

  <!-- ═══ HEADER ═══════════════════════════════════════════ -->
  <div>
    <div style="display:grid;grid-template-columns:1fr auto;gap:16px;align-items:flex-start;
                padding-bottom:14px;border-bottom:2px solid #f1f5f9;margin-bottom:16px;">
      <!-- Brand left -->
      <div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="background:#FF5500;color:#fff;font-weight:800;font-size:14px;
                      padding:4px 8px;border-radius:5px;letter-spacing:1px;">DW</div>
          <div>
            <div style="font-size:13px;font-weight:800;color:#0f172a;letter-spacing:.5px;line-height:1;">
              DISPLAY WORKS MEDIA
            </div>
            <div style="font-size:8px;color:#94a3b8;letter-spacing:1px;margin-top:1px;">
              ${company.address || ""}
            </div>
          </div>
        </div>
        <div style="font-size:8.5px;color:#94a3b8;line-height:1.7;">
          ${company.phone ? "โทร: " + company.phone + " &nbsp;|&nbsp; " : ""}
          ${company.email ? company.email + " &nbsp;|&nbsp; " : ""}
          ${company.taxId ? "เลขผู้เสียภาษี: " + company.taxId : ""}
        </div>
      </div>
      <!-- Doc type right -->
      <div style="text-align:right;position:relative;padding-right:12px;">
        <div style="font-size:30px;font-weight:800;color:#0f172a;letter-spacing:2px;line-height:1;">
          ${lbl.en}
        </div>
        <div style="font-size:10px;font-weight:500;color:#FF5500;letter-spacing:3px;margin-top:2px;">
          ${lbl.sub}
        </div>
        <!-- Orange accent bar -->
        <div style="position:absolute;right:-2px;top:0;width:4px;height:52px;
                    background:#FF5500;border-radius:2px;transform:skewX(-8deg);"></div>
      </div>
    </div>

    <!-- ═══ CLIENT + META ══════════════════════════════════ -->
    <div style="display:grid;grid-template-columns:1fr auto;gap:0;
                border-bottom:1px solid #f1f5f9;padding-bottom:14px;margin-bottom:16px;">
      <!-- To / client -->
      <div style="padding-right:20px;border-right:1px solid #e2e8f0;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
          <span style="color:#FF5500;font-weight:800;font-size:11px;">TO</span>
          <span style="color:#cbd5e1;font-size:10px;">/</span>
          <span style="color:#94a3b8;font-size:9px;font-weight:500;">ลูกค้า</span>
        </div>
        <div style="font-weight:700;font-size:12px;color:#0f172a;margin-bottom:3px;">${cust.name || "-"}</div>
        ${cust.contact ? `<div style="font-size:10px;color:#64748b;margin-bottom:2px;">ผู้ติดต่อ: ${cust.contact}</div>` : ""}
        ${cust.address ? `<div style="font-size:10px;color:#64748b;line-height:1.6;margin-bottom:3px;white-space:pre-line;">${cust.address}</div>` : ""}
        <div style="font-size:10px;color:#64748b;display:flex;flex-wrap:wrap;gap:8px;">
          ${cust.phone ? `<span><b style="color:#475569;">โทร.</b> ${cust.phone}</span>` : ""}
          ${cust.taxId ? `<span><b style="color:#475569;">เลขผู้เสียภาษี:</b> ${cust.taxId}</span>` : ""}
        </div>
        ${doc.projectName ? `<div style="margin-top:5px;font-size:10px;color:#64748b;"><b style="color:#475569;">โครงการ:</b> ${doc.projectName}</div>` : ""}
      </div>
      <!-- Meta right -->
      <div style="padding-left:20px;min-width:190px;">
        ${[
          ["DOCUMENT NO.", doc.docNo, "#FF5500"],
          ["DATE", fmtDate(doc.date), "#475569"],
          [lbl.valid.toUpperCase(), fmtDate(doc.dueDate), "#FF5500"],
          ["STATUS", STATUS_LABELS[doc.status] || doc.status, "#475569"],
        ].map(([k, v, c]) => `
          <div style="display:grid;grid-template-columns:1fr 1fr;border-top:1px dashed #f1f5f9;
                      padding:4px 0;font-size:10px;">
            <span style="font-weight:700;color:${c};">${k}</span>
            <span style="font-weight:500;color:#0f172a;">${v || "-"}</span>
          </div>`).join("")}
      </div>
    </div>

    <!-- ═══ ITEMS TABLE ═════════════════════════════════════ -->
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;margin-bottom:16px;">
      <thead>
        <tr style="background:#2c2d30;color:#fff;">
          <th style="padding:8px;font-size:9px;font-weight:700;text-align:center;border-right:1px solid #444;width:5%;">
            ITEM<br/><span style="font-size:7px;font-weight:400;opacity:.7;">ลำดับ</span>
          </th>
          <th style="padding:8px 10px;font-size:9px;font-weight:700;border-right:1px solid #444;width:42%;">
            DESCRIPTION<br/><span style="font-size:7px;font-weight:400;opacity:.7;">รายการ</span>
          </th>
          <th style="padding:8px;font-size:9px;font-weight:700;text-align:center;border-right:1px solid #444;width:8%;">
            UNIT<br/><span style="font-size:7px;font-weight:400;opacity:.7;">หน่วย</span>
          </th>
          <th style="padding:8px;font-size:9px;font-weight:700;text-align:right;border-right:1px solid #444;width:10%;">
            QTY.<br/><span style="font-size:7px;font-weight:400;opacity:.7;">จำนวน</span>
          </th>
          <th style="padding:8px;font-size:9px;font-weight:700;text-align:right;border-right:1px solid #444;width:16%;">
            UNIT PRICE<br/><span style="font-size:7px;font-weight:400;opacity:.7;">ราคา/หน่วย</span>
          </th>
          <th style="padding:8px;font-size:9px;font-weight:700;text-align:right;width:16%;">
            AMOUNT<br/><span style="font-size:7px;font-weight:400;opacity:.7;">จำนวนเงิน</span>
          </th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <!-- ═══ LOWER: NOTES + PAYMENT + SUMMARY + SIGNATURES ══ -->
    <div style="display:grid;grid-template-columns:1fr 220px;gap:16px;">

      <!-- Left: Remarks + Company payment info -->
      <div style="display:flex;flex-direction:column;gap:10px;">

        <!-- Remarks -->
        ${doc.notes ? `
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;background:#f8fafc;">
          <div style="color:#FF5500;font-weight:700;font-size:8.5px;letter-spacing:1.5px;
                      text-transform:uppercase;margin-bottom:6px;">REMARKS / หมายเหตุ</div>
          <ul style="list-style:disc;padding-left:14px;color:#64748b;font-size:9.5px;line-height:1.8;">
            ${noteItems}
          </ul>
        </div>` : ""}

        <!-- Signatures -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:auto;">
          ${["PREPARED BY / ผู้เสนอราคา", "AUTHORIZED BY / ผู้อนุมัติ"].map(label => `
          <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;
                      text-align:center;min-height:90px;display:flex;flex-direction:column;
                      justify-content:space-between;background:#fff;">
            <div style="font-size:7.5px;font-weight:700;color:#94a3b8;letter-spacing:1px;">
              ${label}
            </div>
            <div style="border-bottom:1px solid #cbd5e1;width:80%;margin:0 auto;"></div>
            <div style="font-size:8px;color:#94a3b8;">( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )<br/>
              <span style="font-size:7px;">วันที่ ...............................
</span></div>
          </div>`).join("")}
        </div>
      </div>

      <!-- Right: Financial summary -->
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
          <table style="width:100%;border-collapse:collapse;">
            <tbody>${summaryRows}</tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══ FOOTER ═══════════════════════════════════════════ -->
  <div style="margin-top:20px;padding-top:10px;border-top:2px solid #FF5500;
              display:flex;justify-content:space-between;align-items:flex-end;">
    <div style="font-size:9px;color:#94a3b8;font-style:italic;">
      Thank you for your business.
    </div>
    <div style="text-align:right;position:relative;padding-right:10px;">
      <div style="font-size:9px;font-weight:800;font-style:italic;color:#0f172a;letter-spacing:1px;">MAKE YOUR</div>
      <div style="font-size:12px;font-weight:800;color:#FF5500;letter-spacing:1px;line-height:1.1;">BRAND SEEN</div>
      <div style="position:absolute;right:0;bottom:0;width:3px;height:28px;background:#FF5500;
                  border-radius:1px;transform:skewX(-8deg);"></div>
    </div>
  </div>

</div><!-- /page -->
</body>
</html>`;

  const w = window.open("", "_blank", "width=960,height=780");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 800);
}

// ============================================================
// MAIN APP
// ============================================================

export default function AdminPage() {
  const [mainTab, setMainTab] = useState("erp");
  const [tab, setTab] = useState("blog");
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

// ─── ERP STATE ───────────────────────────────────────────────────────────────
  const [erpPage, setErpPage] = useState("dashboard");
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

  useEffect(() => { saveStore("customers", customers); }, [customers]);
  useEffect(() => { saveStore("products", products); }, [products]);
  useEffect(() => { saveStore("documents", documents); }, [documents]);
  useEffect(() => { saveStore("company", company); }, [company]);

  const docCounts = Object.keys(DOC_TYPES).reduce((acc, t) => {
    acc[t] = documents.filter((d) => d.type === t).length;
    return acc;
  }, {});

  const totalRevenue = documents
    .filter((d) => d.status === "paid")
    .reduce((s, d) => s + calcDocTotal(d).total, 0);
  const totalCost = documents.filter((d) => d.status === "paid").reduce((s, d) => {
    return s + d.items.reduce((ss, i) => {
      // ใช้ costSnapshot (บันทึกตอน save) ถ้ามี — ไม่งั้นหาจาก products list (backward compat)
      const cost = i.costSnapshot != null
        ? i.costSnapshot
        : (products.find((p) => p.name === i.name)?.cost || 0);
      return ss + i.qty * cost;
    }, 0);
  }, 0);
  const totalProfit = totalRevenue - totalCost;

  const cmsTabs = [
    { id: "blog", icon: "📝", label: "บทความ" },
    { id: "hero", icon: "🖼️", label: "Hero Section" },
    { id: "services", icon: "🛠️", label: "บริการ" },
    { id: "reviews", icon: "⭐", label: "รีวิว" },
    { id: "portfolio", icon: "🖼", label: "ผลงาน" },
    { id: "contact", icon: "📞", label: "ข้อมูลติดต่อ" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", color: "#fff", fontFamily: "'Prompt','Sarabun',sans-serif", display: "flex", flexDirection: "column" }}>
      {/* ─── TOP TAB BAR ─── */}
      <div style={{ background: "#141A24", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", height: 52, padding: "0 24px", gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginRight: 24 }}>Display Works Media</span>
        {["erp","cms"].map(t => (
          <button key={t} onClick={() => setMainTab(t)} style={{
            padding: "6px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
            background: mainTab === t ? "#FF6B00" : "transparent",
            color: mainTab === t ? "#fff" : "#A8B0C0",
            transition: "all 0.2s",
          }}>
            {t === "erp" ? "⚙️ ระบบ ERP" : "✏️ จัดการเนื้อหา"}
          </button>
        ))}
        {/* Spacer */}
        <div style={{ flex: 1 }} />
        {/* Logout */}
        <LogoutButton />
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* ─── ERP ─── */}
        {mainTab === "erp" && (
          <div style={{ flex: 1, display: "flex" }}>
            <ErpSidebar page={erpPage} setPage={setErpPage} docCounts={docCounts} />
            <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
              {erpPage === "dashboard" && (
                <Dashboard documents={documents} customers={customers}
                  totalRevenue={totalRevenue} totalCost={totalCost} totalProfit={totalProfit}
                  docCounts={docCounts} setPage={setErpPage} />
              )}
              {erpPage === "customers" && <CustomerPage customers={customers} setCustomers={setCustomers} showToast={showToast} />}
              {erpPage === "products" && <ProductPage products={products} setProducts={setProducts} showToast={showToast} />}
              {erpPage === "company" && <CompanyPage company={company} setCompany={setCompany} showToast={showToast} />}
              {["quote","bill","invoice","receipt"].includes(erpPage) && (
                <DocumentPage type={erpPage}
                  documents={documents.filter(d => d.type === erpPage)}
                  allDocuments={documents} setDocuments={setDocuments}
                  customers={customers} products={products} company={company} showToast={showToast} />
              )}
            </div>
          </div>
        )}

        {/* ─── CMS ─── */}
        {mainTab === "cms" && (
          <div style={{ flex: 1, display: "flex" }}>
            <div style={{ width: 200, background: "#141A24", borderRight: "1px solid rgba(255,255,255,0.07)", padding: "16px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
              {cmsTabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8,
                  fontSize: 13, border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  background: tab === t.id ? "rgba(255,107,0,0.15)" : "transparent",
                  color: tab === t.id ? "#FF6B00" : "#A8B0C0",
                  borderLeft: tab === t.id ? "2px solid #FF6B00" : "2px solid transparent",
                }}>
                  <span>{t.icon}</span><span>{t.label}</span>
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
              {tab === "blog" && <BlogManager showToast={showToast} />}
              {tab === "hero" && <HeroManager showToast={showToast} />}
              {tab === "services" && <ServicesManager showToast={showToast} />}
              {tab === "reviews" && <ReviewsManager showToast={showToast} />}
              {tab === "portfolio" && <PortfolioManager showToast={showToast} />}
              {tab === "contact" && <ContactManager showToast={showToast} />}
            </div>
          </div>
        )}
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
        input, select, textarea {
          background: #1A2233 !important; border: 1px solid rgba(255,255,255,0.12) !important;
          color: #fff !important; border-radius: 8px !important; padding: 8px 12px !important;
          font-family: 'Prompt', sans-serif !important; font-size: 13px !important;
          outline: none !important; width: 100%; transition: border-color 0.2s;
        }
        input:focus, select:focus, textarea:focus { border-color: #FF6B00 !important; }
        input::placeholder, textarea::placeholder { color: #555 !important; }
        select option { background: #141A24; }
        label { font-size: 12px; color: #A8B0C0; display: block; margin-bottom: 4px; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #0B0F19; }
        ::-webkit-scrollbar-thumb { background: #FF6B00; border-radius: 3px; }
      `}</style>
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
function Dashboard({ documents, customers, totalRevenue, totalCost, totalProfit, docCounts, setPage }: any) {
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

      {/* Stats row 1 */}
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

      {/* Stats row 2 */}
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

      {/* Profit bar */}
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

      {/* Doc type cards */}
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

      {/* Recent docs */}
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
                const { total } = calcDocTotal(doc);
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
// CUSTOMER PAGE
// ============================================================
function CustomerPage({ customers, setCustomers, showToast }: any) {
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const blank = { id: "", name: "", contact: "", phone: "", email: "", address: "", taxId: "" };
  const filtered = customers.filter(c => c.name.includes(search) || c.contact?.includes(search) || c.phone?.includes(search));
  const save = (form) => {
    if (!form.name.trim()) return showToast("กรุณาใส่ชื่อลูกค้า", "error");
    if (form.taxId && !/^\d{13}$/.test(form.taxId.replace(/-/g, "")))
      return showToast("เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก", "error");
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
function CustomerForm({ data, onSave, onCancel }: any) {
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
// PRODUCT PAGE — แก้ไข/ลบได้
// ============================================================
function ProductPage({ products, setProducts, showToast }: any) {
  const [editing, setEditing] = useState<any>(null);
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
function ProductForm({ data, onSave, onCancel }: any) {
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
// COMPANY PAGE
// ============================================================
function CompanyPage({ company, setCompany, showToast }: any) {
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
// DOCUMENT PAGE
// ============================================================
function DocumentPage({ type, documents, allDocuments, setDocuments, customers, products, company, showToast }: any) {
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const dt = DOC_TYPES[type];
  const filtered = documents.filter(d =>
    (filterStatus === "all" || d.status === filterStatus) &&
    (d.docNo?.includes(search) || d.customerName?.includes(search))
  );
  const nextDocNo = () => {
    const year = new Date().getFullYear() + 543;
    const prefix = `${dt.prefix}${year}-`;
    // หา running number สูงสุดที่มีอยู่แล้วในปีนี้ แทนการนับ .length
    const maxSeq = allDocuments
      .filter(d => d.type === type && d.docNo?.startsWith(prefix))
      .reduce((max, d) => {
        const seq = parseInt(d.docNo.replace(prefix, ""), 10);
        return isNaN(seq) ? max : Math.max(max, seq);
      }, 0);
    return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
  };
  const newDoc = () => {
    setEditing({ id: "", type, docNo: nextDocNo(), date: today(), dueDate: addDays(today(), 30), customerId: "", customerName: "", projectName: "", reference: "", items: [], discount: 0, vat: true, wht: false, whtRate: 3, status: "draft", notes: "" });
  };
  const save = (doc) => {
    if (!doc.customerId) return showToast("กรุณาเลือกลูกค้า", "error");
    if (doc.items.length === 0) return showToast("กรุณาเพิ่มรายการสินค้า", "error");
    if (doc.items.some(i => i.qty < 0 || i.price < 0))
      return showToast("จำนวนและราคาต้องไม่ติดลบ", "error");
    if (!doc.docNo?.trim()) return showToast("กรุณาระบุเลขที่เอกสาร", "error");
    // Snapshot ต้นทุน ณ เวลาบันทึก — กันกำไรเปลี่ยนย้อนหลังเมื่อแก้ราคาสินค้า
    const itemsWithCost = doc.items.map(item => {
      if (item.costSnapshot != null) return item; // เอกสารเก่า ไม่ทับ
      const prod = products.find(p => p.name === item.name);
      return { ...item, costSnapshot: prod ? prod.cost : 0 };
    });
    const now = Date.now();
    const saved = { ...doc, items: itemsWithCost };
    if (doc.id) { setDocuments(prev => prev.map(d => d.id === doc.id ? { ...saved, updatedAt: now } : d)); showToast("บันทึกเอกสารแล้ว"); }
    else { setDocuments(prev => [...prev, { ...saved, id: genId(), createdAt: now, updatedAt: now }]); showToast("สร้างเอกสารใหม่แล้ว"); }
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
                const { total } = calcDocTotal(doc);
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
                      <div style={{ display: "flex", gap: 6 }}>
                        <IconBtn onClick={() => setEditing({ ...doc })} title="แก้ไข">✏️</IconBtn>
                        <IconBtn onClick={() => printDocument(doc, customers, company)} title="พิมพ์">🖨️</IconBtn>
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

// ============================================================
// DOC FORM
// ============================================================
function DocForm({ doc, type, customers, products, onSave, onCancel }: any) {
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
  const { subtotal, discAmt, afterDisc, vatAmt, total, whtAmt, netPay } = (() => {
    const r = calcDocTotal(f);
    return { ...r, discAmt: r.discountAmt, afterDisc: r.afterDisc };
  })();
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
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 110px 110px 32px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
              <div style={{ padding: "6px 8px", display: "flex", gap: 4 }}>
                <select onChange={e => pickProduct(item.id, e.target.value)} style={{ width: 90, fontSize: 11, padding: "4px 4px" }} defaultValue="">
                  <option value="">เลือก</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input value={item.name} onChange={e => setItem(item.id, "name", e.target.value)} placeholder="รายละเอียด" style={{ flex: 1 }} />
              </div>
              <div style={{ padding: "6px 6px" }}><input value={item.unit} onChange={e => setItem(item.id, "unit", e.target.value)} /></div>
              <div style={{ padding: "6px 6px" }}><input type="number" value={item.qty} onChange={e => setItem(item.id, "qty", e.target.value)} min="0" step="0.01" /></div>
              <div style={{ padding: "6px 6px" }}><input type="number" value={item.price} onChange={e => setItem(item.id, "price", e.target.value)} min="0" step="0.01" /></div>
              <div style={{ padding: "6px 10px", fontSize: 13, fontWeight: 600, color: dt.color, textAlign: "right" }}>฿{fmtMoney(item.qty * item.price)}</div>
              <div style={{ padding: "6px 4px" }}><IconBtn onClick={() => removeItem(item.id)} danger small>✕</IconBtn></div>
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
      padding: small ? "6px 12px" : "9px 18px",
      borderRadius: 8, fontSize: small ? 12 : 13, fontWeight: 600,
      cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", ...style,
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
      padding: small ? "2px 6px" : "5px 9px", borderRadius: 6,
      cursor: "pointer", fontSize: small ? 11 : 14, lineHeight: 1, fontFamily: "inherit",
    }}>
      {children}
    </button>
  );
}

function Modal({ title, onClose, children, width = 500 }: any) {
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
      onClick={handleLogout}
      style={{
        background: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.2)",
        color: "#ef4444",
        padding: "6px 14px",
        borderRadius: 8,
        fontSize: 12,
        cursor: "pointer",
        fontFamily: "inherit",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 6,
        transition: "all 0.15s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.25)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; }}
    >
      <span>🚪</span> ออกจากระบบ
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
        .from("cms-media").upload(path, file, { upsert: true, contentType: file.type });
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
    if (p.id) {
      // อัปเดต
      const { error } = await supabase.from("posts").update({
        title: p.title, excerpt: p.excerpt, category: p.category,
        date: p.date, slug: p.slug, cover: p.cover,
        published: p.published, body: p.body,
      }).eq("id", p.id);
      if (error) { showToast("เกิดข้อผิดพลาด: " + error.message, "error"); return; }
      showToast("บันทึกบทความแล้ว");
    } else {
      // เพิ่มใหม่
      const { error } = await supabase.from("posts").insert({
        title: p.title, excerpt: p.excerpt, category: p.category,
        date: p.date, slug: p.slug, cover: p.cover,
        published: p.published, body: p.body,
      });
      if (error) { showToast("เกิดข้อผิดพลาด: " + error.message, "error"); return; }
      showToast("เพิ่มบทความใหม่แล้ว");
    }
    setEditing(null);
    fetchPosts();
  };

  const del = async (id) => {
    if (!confirm("ลบบทความนี้?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) { showToast("ลบไม่สำเร็จ", "error"); return; }
    showToast("ลบบทความแล้ว");
    fetchPosts();
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
          <CBtn onClick={() => setEditing({ id: "", title: "", excerpt: "", category: "", date: new Date().toISOString().slice(0,10), slug: "", cover: "", published: true, body: "" })} color="#FF6B00">+ เพิ่มบทความ</CBtn>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(p => (
          <div key={p.id} style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
            {/* Cover */}
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
  const [f, setF] = useState({ ...data });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));

  const uploadCover = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `blog/${Date.now()}.${ext}`;

      // อัปโหลดไฟล์
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("cms-media")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        showToast("อัปโหลดไม่ได้: " + uploadError.message, "error");
        setUploading(false);
        return;
      }

      // ดึง public URL
      const { data: urlData } = supabase.storage.from("cms-media").getPublicUrl(path);
      if (!urlData?.publicUrl) {
        showToast("ได้รูปแล้วแต่ URL ไม่ถูกต้อง", "error");
        setUploading(false);
        return;
      }

      setF(p => ({ ...p, cover: urlData.publicUrl }));
      showToast("อัปโหลดรูปสำเร็จ ✓");
    } catch (err: any) {
      console.error("Upload catch:", err);
      showToast("เกิดข้อผิดพลาด: " + (err?.message || err), "error");
    }
    setUploading(false);
  };

  const genSlug = () => {
    const slug = f.title.toLowerCase().replace(/[^a-z0-9ก-๙\s]/g, "").replace(/\s+/g, "-").slice(0, 60);
    setF(p => ({ ...p, slug }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Cover Upload */}
      <div>
        <label>รูป Cover บทความ</label>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 160, height: 100, borderRadius: 10, overflow: "hidden", background: "#1A2233", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {f.cover ? <img src={f.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 32, opacity: 0.4 }}>🖼️</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => uploadCover(e.target.files?.[0])} />
            <CBtn onClick={() => fileRef.current?.click()} color="#3B82F6" small disabled={uploading}>
              {uploading ? "⏳ กำลังอัปโหลด..." : "📁 เลือกรูปภาพ"}
            </CBtn>
            <input value={f.cover} onChange={set("cover")} placeholder="หรือวาง URL รูปภาพ" style={{ fontSize: 12 }} />
          </div>
        </div>
      </div>

      <CField label="หัวข้อบทความ *"><input value={f.title} onChange={set("title")} onBlur={genSlug} placeholder="หัวข้อบทความ" /></CField>
      <CField label="Slug (URL)">
        <div style={{ display: "flex", gap: 8 }}>
          <input value={f.slug} onChange={set("slug")} placeholder="url-slug" style={{ flex: 1 }} />
          <CBtn onClick={genSlug} small color="#6B7280">สร้างอัตโนมัติ</CBtn>
        </div>
      </CField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <CField label="หมวดหมู่">
          <input value={f.category} onChange={set("category")} list="cat-list" placeholder="เช่น ป้ายไวนิล" />
          <datalist id="cat-list">{["ป้ายไวนิล","สติ๊กเกอร์","Roll Up","Backdrop","PP Board","ฉลากสินค้า","ทั่วไป"].map(c => <option key={c} value={c} />)}</datalist>
        </CField>
        <CField label="วันที่เผยแพร่"><input type="date" value={f.date} onChange={set("date")} /></CField>
      </div>
      <CField label="บทสรุป (แสดงในหน้าแรก)"><textarea value={f.excerpt} onChange={set("excerpt")} rows={2} placeholder="อธิบายสั้นๆ ว่าบทความนี้เกี่ยวกับอะไร..." /></CField>
      {/* ─── RICH TEXT EDITOR ─── */}
      <div>
        <label style={{ fontSize: 12, color: "#A8B0C0", display: "block", marginBottom: 6 }}>เนื้อหาบทความ</label>
        <RichEditor value={f.body} onChange={val => setF(p => ({ ...p, body: val }))} showToast={showToast} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#ccc", marginBottom: 0 }}>
          <input type="checkbox" checked={f.published} onChange={e => setF(p => ({ ...p, published: e.target.checked }))} style={{ width: "auto" }} />
          เผยแพร่บทความนี้
        </label>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <CBtn onClick={() => onSave(f)} color="#FF6B00" style={{ flex: 1 }}>💾 บันทึก</CBtn>
        <CBtn onClick={onCancel} outline style={{ flex: 1 }}>ยกเลิก</CBtn>
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

  const uploadBg = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `hero/bg.${ext}`;
      const { error } = await supabase.storage.from("cms-media").upload(path, file, { upsert: true });
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

  const save = () => { saveLocal("hero", hero); showToast("บันทึก Hero Section แล้ว"); };

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
    { id: "1", name: "ป้ายไวนิล", icon: "🪟", desc: "พิมพ์งานคุณภาพสูง ทนต่อแสงและฝน เหมาะสำหรับป้ายหน้าร้าน ป้ายโฆษณา ขนาดใหญ่", price: "ตร.ม.ละ 200฿", url: "/services/vinyl" },
    { id: "2", name: "สติ๊กเกอร์", icon: "🏷️", desc: "สติ๊กเกอร์กันน้ำ indoor/outdoor พิมพ์สี 4 สี คมชัด ติดทนนาน", price: "ตร.ม.ละ 350฿", url: "/services/sticker" },
    { id: "3", name: "PP Board", icon: "📋", desc: "ป้ายพีพีบอร์ดน้ำหนักเบา พกพาง่าย เหมาะสำหรับงาน Event และป้ายชั่วคราว", price: "แผ่นละ 400฿", url: "/services/ppboard" },
    { id: "4", name: "Roll Up", icon: "🎪", desc: "ป้าย Roll Up สำหรับงานนิทรรศการ ประชุม และงานกิจกรรมต่างๆ", price: "ชิ้นละ 2,200฿", url: "/services/rollup" },
    { id: "5", name: "Backdrop", icon: "🖼", desc: "ป้าย Backdrop ขนาดใหญ่สำหรับงานอีเวนต์ ถ่ายรูป และงานแถลงข่าว", price: "ชุดละ 3,500฿", url: "/services/backdrop" },
    { id: "6", name: "ฉลากสินค้า", icon: "🏷", desc: "พิมพ์ฉลากสินค้าคุณภาพสูง ทั้งแบบม้วนและแผ่น รองรับทุกขนาด", price: "100 ชิ้นละ 400฿", url: "/services/label" },
  ]));
  const [editing, setEditing] = useState<any>(null);

  const save = (s) => {
    const newSvc = s.id ? services.map(x => x.id === s.id ? s : x) : [...services, { ...s, id: Date.now().toString() }];
    setServices(newSvc);
    saveLocal("services", newSvc);
    showToast("บันทึกบริการแล้ว");
    setEditing(null);
  };
  const del = (id) => { if (!confirm("ลบบริการนี้?")) return; const ns = services.filter(s => s.id !== id); setServices(ns); saveLocal("services", ns); showToast("ลบบริการแล้ว"); };

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
        <CModal title={editing.id ? "แก้ไขบริการ" : "เพิ่มบริการ"} onClose={() => setEditing(null)} width={480}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 12 }}>
              <CField label="ไอคอน"><input value={editing.icon} onChange={e => setEditing(p => ({ ...p, icon: e.target.value }))} style={{ textAlign: "center", fontSize: 24 }} /></CField>
              <CField label="ชื่อบริการ *"><input value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} /></CField>
            </div>
            <CField label="คำอธิบาย"><textarea value={editing.desc} onChange={e => setEditing(p => ({ ...p, desc: e.target.value }))} rows={3} /></CField>
            <CField label="ราคาเริ่มต้น"><input value={editing.price} onChange={e => setEditing(p => ({ ...p, price: e.target.value }))} placeholder="เช่น ตร.ม.ละ 200฿" /></CField>
            <CField label="URL หน้าบริการ"><input value={editing.url} onChange={e => setEditing(p => ({ ...p, url: e.target.value }))} placeholder="/services/vinyl" /></CField>
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

  const save = (r) => {
    const nr = r.id ? reviews.map(x => x.id === r.id ? r : x) : [...reviews, { ...r, id: Date.now().toString() }];
    setReviews(nr); saveLocal("reviews", nr);
    showToast(r.id ? "บันทึกรีวิวแล้ว" : "เพิ่มรีวิวแล้ว");
    setEditing(null);
  };
  const del = (id) => { if (!confirm("ลบรีวิวนี้?")) return; const nr = reviews.filter(r => r.id !== id); setReviews(nr); saveLocal("reviews", nr); showToast("ลบรีวิวแล้ว"); };

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
function PortfolioManager({ showToast }: any) {
  const [items, setItems] = useState(() => loadLocal("portfolio", []));
  const [editing, setEditing] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadImg = async (file: File | undefined, callback: (url: string) => void) => {
    if (!file) return;
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `portfolio/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("cms-media").upload(path, file, { upsert: true });
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

  const save = (item) => {
    const ni = item.id ? items.map(x => x.id === item.id ? item : x) : [...items, { ...item, id: Date.now().toString() }];
    setItems(ni); saveLocal("portfolio", ni);
    showToast("บันทึกผลงานแล้ว");
    setEditing(null);
  };
  const del = (id) => { if (!confirm("ลบผลงานนี้?")) return; const ni = items.filter(i => i.id !== id); setItems(ni); saveLocal("portfolio", ni); showToast("ลบผลงานแล้ว"); };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>จัดการผลงาน</h2>
        <CBtn onClick={() => setEditing({ id: "", title: "", category: "", img: "" })} color="#FF6B00">+ เพิ่มผลงาน</CBtn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
        {items.map(item => (
          <div key={item.id} style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ height: 140, background: "#1A2233", position: "relative" }}>
              {item.img ? <img src={item.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 36 }}>🖼</div>}
            </div>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{item.title || "ไม่มีชื่อ"}</div>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 10 }}>{item.category}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <CIconBtn onClick={() => setEditing({ ...item })} small>✏️</CIconBtn>
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
                  {editing.img ? <img src={editing.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24, opacity: 0.4 }}>🖼</span>}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => uploadImg(e.target.files?.[0], url => setEditing(p => ({ ...p, img: url })))} />
                  <CBtn onClick={() => fileRef.current?.click()} color="#3B82F6" small disabled={uploading}>{uploading ? "⏳..." : "📁 เลือกรูป"}</CBtn>
                  <input value={editing.img} onChange={e => setEditing(p => ({ ...p, img: e.target.value }))} placeholder="หรือวาง URL" />
                </div>
              </div>
            </CField>
            <CField label="ชื่อผลงาน"><input value={editing.title} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} /></CField>
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
// CONTACT MANAGER
// ============================================================
function ContactManager({ showToast }: any) {
  const [c, setC] = useState(() => loadLocal("contact", {
    phone: "065-916-1539", line: "https://lin.ee/O0nPl03", email: "info@displayworksmedia.com",
    address: "123 ถ.ตัวอย่าง กรุงเทพฯ 10110", facebook: "", instagram: "", hours: "จ-ศ 9:00-18:00 น.",
  }));
  const set = k => e => setC(p => ({ ...p, [k]: e.target.value }));
  const save = () => { saveLocal("contact", c); showToast("บันทึกข้อมูลติดต่อแล้ว"); };

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
  return <div style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24 }}>{children}</div>;
}
function SectionTitle({ children }: any) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: "#FF6B00", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 4 }}>{children}</div>;
}
function CField({ label, children }: any) {
  return <div><label>{label}</label>{children}</div>;
}
function CBtn({ onClick, children, color, outline, small, style, disabled }: any) {
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
function CIconBtn({ onClick, children, danger, small }: any) {
  return (
    <button onClick={onClick} style={{
      background: danger ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)",
      border: `1px solid ${danger ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
      color: danger ? "#ef4444" : "#A8B0C0",
      padding: small ? "2px 6px" : "5px 9px", borderRadius: 6,
      cursor: "pointer", fontSize: small ? 11 : 14, fontFamily: "inherit",
    }}>{children}</button>
  );
}
function CModal({ title, onClose, children, width = 500 }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#141A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", padding: "20px 22px", flex: 1 }}>{children}</div>
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
