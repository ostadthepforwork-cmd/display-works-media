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

function lineQty(item: any) {
  return Number(item.qty || 0);
}

function lineAmount(item: any) {
  return lineQty(item) * Number(item.price || 0);
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
  const isSqmByMeta = /sqm|square|meter/i.test(`${item?.priceUnit || ""}\n${item?.costUnit || ""}`);
  if (!isSqmByMeta) return customerFacingLineItem(item);

  const amount = lineAmount(item);
  const pieces = Number(item?.pieces || 0) || 1;
  return {
    ...customerFacingLineItem(item),
    qty: pieces,
    unit: "\u0e0a\u0e34\u0e49\u0e19",
    price: amount / pieces,
  };
}

function calcDocTotal(doc: any) {
  const subtotal = (doc.items || []).reduce((sum: number, item: any) => sum + lineAmount(item), 0);
  const discountAmt = subtotal * (Number(doc.discount || 0) / 100);
  const afterDisc = subtotal - discountAmt;
  const vatAmt = doc.vat ? afterDisc * (docVatRate(doc) / 100) : 0;
  const total = afterDisc + vatAmt;
  const whtAmt = doc.wht ? afterDisc * (Number(doc.whtRate || 0) / 100) : 0;
  const netPay = total - whtAmt;
  return { subtotal, discountAmt, afterDisc, vatAmt, total, whtAmt, netPay };
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
    date: doc.date,
    dueDate: doc.due_date,
    discount: Number(doc.discount || 0),
    vat: Boolean(doc.vat),
    vatRate: Number(doc.vat_rate ?? 7),
    wht: Boolean(doc.wht),
    whtRate: Number(doc.wht_rate || 0),
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
      pieces: Number(item.pieces || 0),
    })),
  };
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

  const { data: sourceOrder } = rawDoc.order_id
    ? await supabase.from("erp_documents").select("doc_no").eq("id", rawDoc.order_id).maybeSingle()
    : { data: null };

  const doc = mapDocument(rawDoc, safeItems);
  const label = DOC_LABELS[doc.type] || DOC_LABELS.quote;
  const companyName = documentCompanyName(company?.name);
  const customerAddress = doc.overrideAddress || customer?.address || "";
  const totals = calcDocTotal(doc);
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
                <img src="/images/logo%20DWM%20PNG%20long.png" alt="Display Works Media" />
              </div>
              <div className="doc-company-name">{companyName}</div>
              <div className="doc-company-meta">
                <div>{company?.address || "2028/7 ถ.ประชาสงเคราะห์ แขวงรัชดาภิเษก เขตดินแดง กรุงเทพมหานคร 10400"}</div>
                <div>โทร. {company?.phone || "065-916-1539"} | {company?.email || "info.displayworksmedia@gmail.com"}{company?.tax_id ? ` | เลขผู้เสียภาษี: ${company.tax_id}` : ""}</div>
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
              {doc.discount > 0 && <div className="doc-summary-row"><strong>DISCOUNT {doc.discount}%</strong><span>- {fmtMoney(totals.discountAmt)}</span></div>}
              {doc.vat && <div className="doc-summary-row"><strong>VAT {fmtMoney(docVatRate(doc))}%</strong><span>{fmtMoney(totals.vatAmt)}</span></div>}
              {doc.wht && <div className="doc-summary-row"><strong>หัก ณ ที่จ่าย {doc.whtRate}%</strong><span>- {fmtMoney(totals.whtAmt)}</span></div>}
              <div className="doc-summary-total"><span>GRAND TOTAL</span><span>{fmtMoney(totals.netPay)} THB</span></div>
            </div>
          </section>

          <section className="doc-signatures">
            <div className="doc-signature">
              <div>PREPARED BY</div>
              <div className="doc-sign-line" />
              <div>( {doc.salesPerson || "ผู้เสนอราคา"} )</div>
            </div>
            <div className="doc-signature">
              <div>AUTHORIZED BY</div>
              <div className="doc-sign-line" />
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
