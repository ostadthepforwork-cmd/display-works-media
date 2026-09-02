export type ErpLifecycleStatus = "draft" | "sent" | "approved" | "cancelled";
export type ErpPaymentStatus = "unpaid" | "partial_paid" | "paid";

const PAYMENT_VALUES = new Set<ErpPaymentStatus>(["unpaid", "partial_paid", "paid"]);

export function normalizeErpPaymentStatus(value: unknown): ErpPaymentStatus | "" {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "partial" || raw === "partially_paid" || raw === "overdue") return "partial_paid";
  if (raw === "completed" || raw === "complete") return "paid";
  return PAYMENT_VALUES.has(raw as ErpPaymentStatus) ? raw as ErpPaymentStatus : "";
}

export function normalizeErpLifecycleStatus(value: unknown): ErpLifecycleStatus {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "cancelled" || raw === "canceled" || raw === "void") return "cancelled";
  if (raw === "sent") return "sent";
  if ([
    "approved", "paid", "partial_paid", "partial", "partially_paid",
    "overdue", "completed", "complete",
  ].includes(raw)) return "approved";
  return "draft";
}

export function erpDocumentDisplayStatus(
  lifecycle: unknown,
  payment: unknown,
): ErpLifecycleStatus | ErpPaymentStatus {
  const rawLifecycle = String(lifecycle || "").trim().toLowerCase();
  if (["cancelled", "canceled", "void"].includes(rawLifecycle)) return "cancelled";

  const normalizedPayment = normalizeErpPaymentStatus(payment);
  if (normalizedPayment === "paid" || normalizedPayment === "partial_paid") {
    return normalizedPayment;
  }
  if (["paid", "completed", "complete"].includes(rawLifecycle)) return "paid";
  if (["partial_paid", "partial", "partially_paid", "overdue"].includes(rawLifecycle)) {
    return "partial_paid";
  }
  return normalizeErpLifecycleStatus(rawLifecycle);
}
