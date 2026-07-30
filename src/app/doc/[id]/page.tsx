import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import DocActions from "./DocActions";
import "./document.css";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ print?: string }>;
};

const DEFAULT_COMPANY_NAME = "DISPLAY WORKS MEDIA";

const DOC_LABELS: Record<string, { en: string; th: string; due: string }> = {
  quote: { en: "QUOTATION", th: "ใบเสนอราคา", due: "ยืนยันราคาถึง" },
  bill: { en: "BILLING NOTE", th: "ใบวางบิล", due: "วันครบกำหนด" },
  invoice: { en: "INVOICE", th: "ใบแจ้งหนี้", due: "วันครบกำหนด" },
  receipt: { en: "RECEIPT", th: "ใบเสร็จรับเงิน", due: "วันที่ชำระ" },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: doc } = await supabase
      .from("erp_documents")
      .select("type, doc_no")
      .eq("id", id)
      .eq("deleted", false)
      .maybeSingle();
    if (doc) {
      const label = DOC_LABELS[doc.type] || DOC_LABELS.quote;
      return {
        title: `${label.th} ${doc.doc_no} | Display Works Media`,
        robots: { index: false, follow: false },
      };
    }
  } catch {}
  return {
    title: "เอกสาร | Display Works Media",
    robots: { index: false, follow: false },
  };
}

function documentCompanyName(name?: string) {
  const cleanName = String(name || DEFAULT_COMPANY_NAME)
    .replace(/\s*(CO\.?,?\s*LTD\.?|COMPANY\s+LIMITED|LIMITED)\s*\.?$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleanName || DEFAULT_COMPANY_NAME;
}

function fmtDate(date?: string) {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtMoney(value?: number) {
  return Number(value || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtQty(value?: number) {
  const n = Number(value || 0);
  return Number.isInteger(n)
    ? n.toLocaleString("th-TH")
    : n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function bahtText(amount: number): string {
  const ones = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const tens = ["", "สิบ", "ยี่สิบ", "สามสิบ", "สี่สิบ", "ห้าสิบ", "หกสิบ", "เจ็ดสิบ", "แปดสิบ", "เก้าสิบ"];

  if (amount === 0) return "ศูนย์บาทถ้วน";
  const rounded = Math.round(amount * 100) / 100;
  const [intPart, decPart] = rounded.toFixed(2).split(".");
  const satang = parseInt(decPart, 10);

  function readGroup(n: number): string {
    if (n === 0) return "";
    if (n < 10) return ones[n];
    if (n < 100) {
      const t = Math.floor(n / 10);
      const o = n % 10;
      const tensStr = t === 1 ? "สิบ" : t === 2 ? "ยี่สิบ" : ones[t] + "สิบ";
      const onesStr = o === 1 && t > 0 ? "เอ็ด" : ones[o];
      return tensStr + onesStr;
    }
    let result = "";
    const digits = String(n).split("").map(Number);
    digits.forEach((d, i) => {
      if (d === 0) return;
      const placeIndex = digits.length - 1 - i;
      const placeNames = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];
      if (placeIndex === 1) result += d === 1 ? "สิบ" : d === 2 ? "ยี่สิบ" : ones[d] + "สิบ";
      else if (placeIndex === 0) result += (d === 1 && digits.length > 1) ? "เอ็ด" : ones[d];
      else result += ones[d] + placeNames[placeIndex];
    });
    return result;
  }

  function readNumber(numStr: string): string {
    const num = parseInt(numStr, 10);
    if (num === 0) return "";
    if (num < 1000000) return readGroup(num);
    const millions = Math.floor(num / 1000000);
    const remainder = num % 1000000;
    return readGroup(millions) + "ล้าน" + (remainder > 0 ? readGroup(remainder) : "");
  }

  const bahtStr = readNumber(intPart);
  const bahtPart = bahtStr ? bahtStr + "บาท" : "";
  const satangPart = satang > 0 ? readGroup(satang) + "สตางค์" : "ถ้วน";
  return bahtPart + satangPart;
}

function lineQty(item: any) {
  return Number(item.qty || 0);
}

function isSqmBasis(value?: string) {
  return value === "sqm" || /sqm|square|meter/i.test(String(value || ""));
}

function itemBillingBasis(item: any) {
  return isSqmBasis(item?.priceUnit)
    || isSqmBasis(item?.costUnit)
    || /(ตร\.?ม|ตารางเมตร|sqm|square\s*meter)/i.test(String(item?.unit || ""))
    ? "sqm"
    : "piece";
}

function hasAreaDimensions(item: any) {
  return Number(item?.widthM || 0) > 0
    || Number(item?.heightM || 0) > 0
    || Number(item?.pieces || 0) > 0;
}

function lineQtyForBasis(item: any, basis?: string) {
  if (isSqmBasis(basis)) return lineQty(item);
  const pieces = Number(item?.pieces || 0);
  return itemBillingBasis(item) === "sqm" && hasAreaDimensions(item)
    ? (pieces > 0 ? pieces : 1)
    : lineQty(item);
}

function lineAmount(item: any) {
  return lineQtyForBasis(item, item?.priceUnit || "piece") * Number(item.price || 0);
}

function isSqmItem(item: any) {
  return /(ตร\.?ม|ตารางเมตร|sqm|square\s*meter)/i.test(`${item?.unit || ""}\n${item?.detail || ""}`);
}

function customerFacingLineItem(item: any) {
  const detailText = String(item?.detail || "");
  const pieces = Number(
    detailText.match(/(?:จำนวน|qty|pieces?)\D{0,12}(\d+(?:\.\d+)?)/i)?.[1]
    || detailText.match(/[x×]\s*(\d+(?:\.\d+)?)\s*(?:ชิ้น|pcs?)/i)?.[1]
    || 0
  );
  if (!isSqmItem(item)) return item;

  const amount = lineAmount(item);
  const displayQty = pieces > 0 ? pieces : 1;
  return {
    ...item,
    qty: displayQty,
    unit: "ชิ้น",
    price: amount / displayQty,
  };
}

function customerFacingDetail(detail?: string) {
  return String(detail || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/(ตร\.?ม|ตารางเมตร|sqm|square\s*meter|พื้นที่รวม|คำนวณพื้นที่)/i.test(line));
}

function docVatRate(doc: any) {
  return Number(doc?.vatRate ?? doc?.vat_rate ?? 7);
}

function customerFacingLineItemWithMetadata(item: any) {
  if (itemBillingBasis(item) !== "sqm") return customerFacingLineItem(item);

  const amount = lineAmount(item);
  const detailText = String(item?.detail || "");
  const parsedPieces = Number(
    detailText.match(/(?:จำนวน|qty|pieces?)\D{0,12}(\d+(?:\.\d+)?)/i)?.[1]
    || detailText.match(/[x×]\s*(\d+(?:\.\d+)?)\s*(?:ชิ้น|pcs?)/i)?.[1]
    || 0
  );
  const pieces = Number(item?.pieces || 0) || parsedPieces || 1;
  return {
    ...customerFacingLineItem(item),
    qty: pieces,
    unit: "\u0e0a\u0e34\u0e49\u0e19",
    price: amount / pieces,
    priceUnit: "piece",
    costUnit: "piece",
  };
}

function docDepositInfo(doc: any) {
  const paymentAmount = Math.max(0, Number(doc?.paymentAmount ?? doc?.payment_amount ?? 0) || 0);
  const depositAmount = Math.max(0, Number(doc?.depositPaid ?? doc?.deposit_paid ?? 0) || 0);
  return {
    depositPaid: paymentAmount > 0 ? paymentAmount : depositAmount,
    depositDate: doc?.paymentDate || doc?.payment_date || doc?.depositDate || doc?.deposit_date || "",
    depositNote: doc?.paymentNote || doc?.payment_note || doc?.depositNote || doc?.deposit_note || "",
    paymentType: doc?.paymentType || doc?.payment_type || "",
  };
}

function parseDepositFromText(doc: any, netPay: number) {
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
}

function resolveDepositInfo(doc: any, documents: any[] = []) {
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
}

function calcDocTotal(doc: any, documents: any[] = []) {
  const subtotal = (doc.items || []).reduce((sum: number, item: any) => sum + lineAmount(item), 0);
  const discountValue = Math.max(0, Number(doc.discount || 0) || 0);
  const discountType = doc.discountType || doc.discount_type || "percent";
  const discountAmt = discountType === "amount"
    ? Math.min(subtotal, discountValue)
    : subtotal * (Math.min(discountValue, 100) / 100);
  const afterDisc = Math.max(0, subtotal - discountAmt);
  const vatAmt = doc.vat ? afterDisc * (docVatRate(doc) / 100) : 0;
  const total = afterDisc + vatAmt;
  const whtAmt = doc.wht ? afterDisc * (Number(doc.whtRate || 0) / 100) : 0;
  const netPay = total - whtAmt;
  let { depositPaid, depositDate, depositNote, paymentType } = resolveDepositInfo(doc, documents);
  if (depositPaid <= 0) {
    ({ depositPaid, depositDate, depositNote } = parseDepositFromText(doc, netPay));
  }
  const cappedDepositPaid = Math.min(netPay, Math.max(0, depositPaid));
  const balanceDue = Math.max(0, netPay - cappedDepositPaid);
  const paymentStatus = cappedDepositPaid <= 0 ? "unpaid" : balanceDue > 0 ? "partial_paid" : "paid";
  return { subtotal, discountAmt, afterDisc, vatAmt, total, whtAmt, netPay, depositPaid: cappedDepositPaid, depositDate, depositNote, paymentType, balanceDue, paymentStatus };
}

function mapDocument(doc: any, items: any[]) {
  return {
    id: doc.id,
    type: doc.type || "quote",
    docNo: doc.doc_no || "-",
    status: doc.status,
    customerId: doc.customer_id,
    customerName: doc.customer_name || "-",
    projectName: doc.project_name || "",
    orderId: doc.order_id || "",
    reference: doc.reference || "",
    salesPerson: doc.sales_person || "",
    paymentType: doc.payment_type || "",
    paymentAmount: Number(doc.payment_amount || 0),
    paymentDate: doc.payment_date || "",
    paymentNote: doc.payment_note || "",
    paymentStatus: doc.payment_status || "",
    date: doc.date,
    dueDate: doc.due_date,
    discount: Number(doc.discount || 0),
    discountType: doc.discount_type || "percent",
    vat: Boolean(doc.vat),
    vatRate: Number(doc.vat_rate ?? 7),
    wht: Boolean(doc.wht),
    whtRate: Number(doc.wht_rate || 0),
    depositPaid: Number(doc.deposit_paid || 0),
    depositDate: doc.deposit_date || "",
    depositNote: doc.deposit_note || "",
    notes: doc.notes || "",
    overrideAddress: doc.override_address || "",
    bankName: doc.bank_name || "",
    bankBranch: doc.bank_branch || "",
    bankAccount: doc.bank_account || "",
    bankType: doc.bank_type || "",
    qrImage: doc.qr_image || "",
    items: items.map((item) => customerFacingLineItemWithMetadata({
      id: item.id,
      name: item.name || "-",
      subTitle: item.sub_title || "",
      detail: item.detail || "",
      unit: item.unit || "",
      qty: Number(item.qty || 0),
      price: Number(item.price || 0),
      costUnit: item.cost_unit || "",
      priceUnit: item.price_unit || "",
      widthM: Number(item.width_m || 0),
      heightM: Number(item.height_m || 0),
      pieces: Number(item.pieces || 0),
    })),
  };
}

async function loadDocumentChain(supabase: any, orderId: string | null | undefined) {
  const chain: any[] = [];
  const seen = new Set<string>();
  let currentId = orderId;

  while (currentId && !seen.has(String(currentId)) && chain.length < 8) {
    seen.add(String(currentId));
    const { data } = await supabase
      .from("erp_documents")
      .select("*")
      .eq("id", currentId)
      .eq("deleted", false)
      .maybeSingle();

    if (!data) break;
    chain.push(data);
    currentId = data.order_id;
  }

  return chain;
}

export default async function PublicDocumentPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const supabase = await createSupabaseServerClient();

  const [
    { data: rawDoc, error: docError },
    { data: rawItems, error: itemsError },
    { data: company },
  ] = await Promise.all([
    supabase.from("erp_documents").select("*").eq("id", id).eq("deleted", false).maybeSingle(),
    supabase.from("erp_document_items").select("*").eq("document_id", id).order("sort_order"),
    supabase.from("erp_company").select("*").limit(1).maybeSingle(),
  ]);

  if (docError || !rawDoc) notFound();

  // แยกกรณี: โหลด items ไม่ได้ (error) vs ไม่มี items จริงๆ (empty)
  const hasItemLoadError = Boolean(itemsError);
  const safeItems = !hasItemLoadError ? (rawItems ?? []) : [];

  const { data: customer } = rawDoc.customer_id
    ? await supabase.from("erp_customers").select("*").eq("id", rawDoc.customer_id).maybeSingle()
    : { data: null };

  const sourceChain = await loadDocumentChain(supabase, rawDoc.order_id);
  const sourceOrder = sourceChain[0] || null;

  const doc = mapDocument(rawDoc, safeItems);
  const linkedDocuments = sourceChain.map((sourceDoc) => mapDocument(sourceDoc, []));
  const label = DOC_LABELS[doc.type] || DOC_LABELS.quote;
  const companyName = documentCompanyName(company?.name);
  const customerAddress = doc.overrideAddress || customer?.address || "";
  const totals = calcDocTotal(doc, linkedDocuments);
  const paymentLabel = totals.paymentType === "full" || totals.paymentType === "final" ? "PAYMENT RECEIVED" : totals.paymentType === "partial" ? "PARTIAL PAYMENT" : "DEPOSIT PAID";
  const finalTotalLabel = totals.depositPaid > 0 ? (totals.balanceDue > 0 ? "BALANCE DUE" : "PAID IN FULL") : "TOTAL";
  const orderReference = sourceOrder?.doc_no || doc.reference || "";
  const title = `${label.th} ${doc.docNo}`;
  const notes = doc.notes
    ? doc.notes.split("\n").map((note: string) => note.trim()).filter(Boolean)
    : ["ขอบคุณที่ไว้วางใจ Display Works Media"];

  return (
    <main className="doc-public-shell">
      <DocActions title={title} autoPrint={query.print === "1"} />

      <article className="doc-a4">
        <div className="doc-main">
          <header className="doc-head">
            <div>
              <div className="doc-brand">
                <img src="/images/logo.png?v=doc-logo" alt="Display Works Media" />
              </div>
              <div className="doc-company-name">{companyName}</div>
              <div className="doc-company-meta">
                <div>{company?.address || "2028/7 ถ.ประชาสงเคราะห์ แขวงรัชดาภิเษก เขตดินแดง กรุงเทพมหานคร 10400"}</div>
                <div>เลขผู้เสียภาษี: {company?.tax_id || "1130200152600"}</div>
                <div>โทร. {company?.phone || "065-916-1539"} | {company?.email || "info.displayworksmedia@gmail.com"}</div>
              </div>
            </div>
            <div className="doc-title">
              <h1>{label.en}</h1>
              <p>{label.th}</p>
            </div>
          </header>

          <section className="doc-info">
            <div>
              <div className="doc-section-kicker">TO / ลูกค้า</div>
              <div className="doc-customer-name">{doc.customerName}</div>
              <div className="doc-small">{customerAddress}</div>
              {customer?.phone && <div className="doc-small">โทร. {customer.phone}</div>}
              {doc.projectName && <div className="doc-small"><strong>โครงการ:</strong> {doc.projectName}</div>}
            </div>
            <div className="doc-meta">
              <div className="doc-meta-row"><span>{label.en} NO.</span><span>{doc.docNo}</span></div>
              <div className="doc-meta-row"><span>DATE</span><span>{fmtDate(doc.date)}</span></div>
              <div className="doc-meta-row"><span>{label.due}</span><span>{fmtDate(doc.dueDate)}</span></div>
              {orderReference && <div className="doc-meta-row"><span>ORDER REF.</span><span>{orderReference}</span></div>}
              <div className="doc-meta-row"><span>SALE PERSON</span><span>{doc.salesPerson || "-"}</span></div>
            </div>
          </section>

          <table className="doc-table">
            <thead>
              <tr>
                <th style={{ width: "8%" }}>ITEM<span>ลำดับ</span></th>
                <th style={{ width: "22%" }}>DESCRIPTION<span>รายการ</span></th>
                <th>DETAIL<span>รายละเอียด</span></th>
                <th style={{ width: "10%" }}>QTY.<span>จำนวน</span></th>
                <th style={{ width: "10%" }}>UNIT<span>หน่วย</span></th>
                <th style={{ width: "14%" }}>UNIT PRICE<span>ราคาต่อหน่วย</span></th>
                <th style={{ width: "14%" }}>AMOUNT<span>จำนวนเงิน</span></th>
              </tr>
            </thead>
            <tbody>
              {hasItemLoadError && (
                <tr>
                  <td colSpan={7} className="doc-empty-row">ไม่สามารถโหลดรายการสินค้าในเอกสารได้ กรุณาติดต่อ Display Works Media</td>
                </tr>
              )}
              {!hasItemLoadError && doc.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="doc-empty-row">ยังไม่มีรายการสินค้าในเอกสารนี้</td>
                </tr>
              )}
              {!hasItemLoadError && doc.items.map((item: any, index: number) => {
                const details = customerFacingDetail(item.detail);
                return (
                  <tr key={item.id || index}>
                    <td className="num">{String(index + 1).padStart(2, "0")}</td>
                    <td><div className="name">{item.name}</div>{item.subTitle && <div className="doc-small">{item.subTitle}</div>}</td>
                    <td className="detail">
                      {details.map((detail: string, detailIndex: number) => <div key={detailIndex}>• {detail}</div>)}
                    </td>
                    <td className="center">{fmtQty(item.qty)}</td>
                    <td className="center">{item.unit}</td>
                    <td className="right">{fmtMoney(item.price)}</td>
                    <td className="right"><strong style={{ color: "#ff5500" }}>{fmtMoney(lineAmount(item))}</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <section className="doc-bottom">
            <div>
              <div className="doc-note">
                <div className="doc-section-kicker">REMARKS / หมายเหตุ</div>
                <ul>{notes.map((note: string, index: number) => <li key={index}>{note}</li>)}</ul>
              </div>
              <div className="doc-payment">
                <div>
                  <div className="doc-section-kicker">PAYMENT INFORMATION</div>
                  <div className="doc-small"><strong>ชื่อบัญชี:</strong> {doc.bankName || companyName}</div>
                  {doc.bankBranch && <div className="doc-small"><strong>ธนาคาร/สาขา:</strong> {doc.bankBranch}</div>}
                  {doc.bankAccount && <div className="doc-small"><strong>เลขบัญชี:</strong> {doc.bankAccount}</div>}
                  {doc.bankType && <div className="doc-small"><strong>ประเภท:</strong> {doc.bankType}</div>}
                </div>
                {doc.qrImage && <img src={doc.qrImage} alt="Payment QR" />}
              </div>
            </div>
            <div className="doc-summary">
              <div className="doc-summary-row"><strong>SUBTOTAL</strong><span>{fmtMoney(totals.subtotal)}</span></div>
              {doc.discount > 0 && <div className="doc-summary-row"><strong>{doc.discountType === "amount" ? "DISCOUNT" : `DISCOUNT ${doc.discount}%`}</strong><span>- {fmtMoney(totals.discountAmt)}</span></div>}
              {doc.vat && <div className="doc-summary-row"><strong>VAT {fmtMoney(docVatRate(doc))}%</strong><span>{fmtMoney(totals.vatAmt)}</span></div>}
              {doc.wht && <div className="doc-summary-row"><strong>หัก ณ ที่จ่าย {doc.whtRate}%</strong><span>- {fmtMoney(totals.whtAmt)}</span></div>}
              {totals.depositPaid > 0 && (
                <div className="doc-summary-row paid">
                  <strong>{paymentLabel}{totals.depositDate ? ` (${fmtDate(totals.depositDate)})` : ""}</strong>
                  <span>- {fmtMoney(totals.depositPaid)}</span>
                </div>
              )}
              {totals.depositPaid > 0 && totals.depositNote && <div className="doc-summary-note">{totals.depositNote}</div>}
              <div className="doc-summary-total">
                <div>
                  <div>{finalTotalLabel}</div>
                  <div className="doc-summary-bahttext">{bahtText(totals.depositPaid > 0 ? totals.balanceDue : totals.netPay)}</div>
                </div>
                <span>{fmtMoney(totals.depositPaid > 0 ? totals.balanceDue : totals.netPay)} THB</span>
              </div>
            </div>
          </section>

          <section className="doc-signatures">
            <div className="doc-signature">
              <div>PREPARED BY</div>
              <div className="doc-sign-space">
                {company?.signature_image ? (
                  <img src={company.signature_image} alt="ลายเซ็นผู้เสนอราคา" />
                ) : null}
                <div className="doc-sign-line" />
              </div>
              <div>( {doc.salesPerson || "ผู้เสนอราคา"} )</div>
            </div>
            <div className="doc-signature">
              <div>AUTHORIZED BY</div>
              <div className="doc-sign-space">
                <div className="doc-sign-line" />
              </div>
              <div>( ผู้อนุมัติสั่งซื้อ )</div>
            </div>
          </section>
        </div>

        <footer className="doc-footer">
          <div className="doc-footer-line" />
          <div>Thank you for your business.</div>
        </footer>
      </article>
    </main>
  );
}
