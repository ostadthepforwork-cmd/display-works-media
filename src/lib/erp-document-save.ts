import type { SupabaseClient } from "@supabase/supabase-js";

export type ErpSaveErrorCode =
  | "ADMIN_REQUIRED"
  | "DOCUMENT_NOT_FOUND"
  | "DOCUMENT_NUMBER_ALLOCATION_FAILED"
  | "IDEMPOTENCY_CONFLICT"
  | "REVISION_CONFLICT"
  | "ZERO_ITEMS_NOT_ALLOWED";

export type ErpSaveResult = {
  document: Record<string, unknown>;
  items: Array<Record<string, unknown>>;
};

const nullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const numberOrZero = (value: unknown): number => nullableNumber(value) ?? 0;

export function buildErpSaveArguments(
  doc: Record<string, any>,
  options: {
    status: string;
    paymentStatus: string;
    paymentAmount: number;
    internalExpenses: unknown[];
  },
) {
  const document = {
    id: doc.id || null,
    type: doc.type,
    status: options.status,
    customer_id: doc.customerId || null,
    customer_name: doc.customerName ?? "",
    project_name: doc.projectName ?? "",
    order_id: doc.orderId || null,
    reference: doc.reference ?? "",
    sales_person: doc.salesPerson ?? "",
    lead_source: doc.leadSource ?? "",
    marketing_campaign: doc.marketingCampaign ?? "",
    marketing_adset: doc.marketingAdSet ?? "",
    marketing_ad: doc.marketingAd ?? "",
    payment_type: doc.paymentType ?? "",
    payment_amount: options.paymentAmount,
    payment_date: doc.paymentDate || doc.depositDate || null,
    payment_note: doc.paymentNote ?? "",
    payment_status: options.paymentStatus,
    date: doc.date || null,
    due_date: doc.dueDate || null,
    discount: numberOrZero(doc.discount),
    discount_type: doc.discountType || "percent",
    vat: Boolean(doc.vat),
    vat_rate: nullableNumber(doc.vatRate ?? doc.vat_rate) ?? 7,
    wht: Boolean(doc.wht),
    wht_rate: nullableNumber(doc.whtRate) ?? 3,
    deposit_paid: options.paymentAmount,
    deposit_date: doc.depositDate || doc.paymentDate || null,
    deposit_note: doc.depositNote ?? doc.paymentNote ?? "",
    internal_expenses: options.internalExpenses,
    notes: doc.notes ?? "",
    override_address: doc.overrideAddress ?? "",
    bank_name: doc.bankName ?? "",
    bank_branch: doc.bankBranch ?? "",
    bank_account: doc.bankAccount ?? "",
    bank_type: doc.bankType ?? "",
    qr_image: doc.qrImage ?? "",
  };

  const items = (Array.isArray(doc.items) ? doc.items : []).map((item: Record<string, any>) => ({
    id: item.id || null,
    name: item.name ?? "",
    sub_title: item.subTitle ?? "",
    detail: item.detail ?? "",
    unit: item.unit ?? "",
    qty: numberOrZero(item.qty),
    price: numberOrZero(item.price),
    cost_snapshot: nullableNumber(item.costSnapshot),
    cost_unit: item.costUnit || "piece",
    price_unit: item.priceUnit || "piece",
    supplier_name: item.supplierName ?? "",
    width_m: nullableNumber(item.widthM),
    height_m: nullableNumber(item.heightM),
    pieces: nullableNumber(item.pieces),
    product_id: item.productId || null,
    supplier_id: item.supplierId || null,
  }));

  return {
    p_document: document,
    p_items: items,
    p_expected_revision: doc.id ? Number(doc.revision ?? 1) : 0,
    p_client_request_id: doc.clientRequestId,
  };
}

export async function saveErpDocument(
  supabase: SupabaseClient,
  args: ReturnType<typeof buildErpSaveArguments>,
): Promise<ErpSaveResult> {
  const { data, error } = await supabase.rpc("save_erp_document_v1", args);
  if (error) throw error;
  if (!data || typeof data !== "object" || !("document" in data) || !("items" in data)) {
    throw new Error("INVALID_SAVE_RESPONSE");
  }
  return data as ErpSaveResult;
}

export function erpSaveErrorCode(error: unknown): ErpSaveErrorCode | null {
  const message = String((error as { message?: unknown })?.message || error || "");
  const codes: ErpSaveErrorCode[] = [
    "ADMIN_REQUIRED",
    "DOCUMENT_NOT_FOUND",
    "DOCUMENT_NUMBER_ALLOCATION_FAILED",
    "IDEMPOTENCY_CONFLICT",
    "REVISION_CONFLICT",
    "ZERO_ITEMS_NOT_ALLOWED",
  ];
  return codes.find((code) => message.includes(code)) || null;
}
