import type { SupabaseClient } from "@supabase/supabase-js";

export type ExpenseClass = "direct" | "operating";
export type ExpensePaymentStatus = "unpaid" | "paid";

export type ExpenseDraft = {
  id?: string | null;
  clientRequestId: string;
  expenseDate: string;
  categoryId: string;
  expenseClass: ExpenseClass;
  description: string;
  amount: string | number;
  vatAmount: string | number;
  withholdingAmount: string | number;
  paymentStatus: ExpensePaymentStatus;
  paidAt?: string | null;
  supplierId?: string | null;
  customerId?: string | null;
  sourceDocumentId?: string | null;
  reference?: string | null;
  notes?: string | null;
  revision?: number;
  archived?: boolean;
  voidReason?: string | null;
};

export type ExpenseSaveArguments = {
  p_expense: Record<string, unknown>;
  p_expected_revision: number;
  p_client_request_id: string;
};

export type ExpenseSaveResult = {
  expense_id: string;
  expense_no: string;
  revision: number;
  updated_at: string;
  expense: Record<string, unknown>;
  idempotent_replay: boolean;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MONEY_PATTERN = /^(?:0|[1-9]\d*)(?:\.(\d{1,2}))?$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class ExpenseValidationError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "ExpenseValidationError";
  }
}

function requiredUuid(value: unknown, code: string) {
  const normalized = String(value || "").trim();
  if (!UUID_PATTERN.test(normalized)) {
    throw new ExpenseValidationError(code, "Invalid UUID");
  }
  return normalized;
}

function optionalUuid(value: unknown, code: string) {
  const normalized = String(value || "").trim();
  return normalized ? requiredUuid(normalized, code) : null;
}

export function normalizeExpenseMoney(value: unknown, field = "amount") {
  const raw = String(value ?? "").trim();
  const match = raw.match(MONEY_PATTERN);
  if (!match) {
    throw new ExpenseValidationError(`INVALID_${field.toUpperCase()}`, `${field} must be a nonnegative decimal with at most two places`);
  }
  const whole = BigInt(raw.split(".")[0]);
  const fraction = (match[1] || "").padEnd(2, "0");
  return `${whole}.${fraction}`;
}

function moneyToSatang(value: string) {
  const [whole, fraction] = value.split(".");
  return BigInt(whole) * BigInt(100) + BigInt(fraction);
}

function satangToMoney(value: bigint) {
  const whole = value / BigInt(100);
  const fraction = (value % BigInt(100)).toString().padStart(2, "0");
  return `${whole}.${fraction}`;
}

export function addExpenseMoney(left: unknown, right: unknown) {
  const leftMoney = normalizeExpenseMoney(left, "amount");
  const rightMoney = normalizeExpenseMoney(right, "vat_amount");
  return satangToMoney(moneyToSatang(leftMoney) + moneyToSatang(rightMoney));
}

export function buildErpExpenseSaveArguments(draft: ExpenseDraft): ExpenseSaveArguments {
  const id = optionalUuid(draft.id, "INVALID_EXPENSE_ID");
  const clientRequestId = requiredUuid(draft.clientRequestId, "CLIENT_REQUEST_ID_REQUIRED");
  const categoryId = requiredUuid(draft.categoryId, "CATEGORY_REQUIRED");
  const expenseDate = String(draft.expenseDate || "").trim();
  if (!DATE_PATTERN.test(expenseDate) || Number.isNaN(Date.parse(`${expenseDate}T00:00:00Z`))) {
    throw new ExpenseValidationError("INVALID_EXPENSE_DATE", "Expense date is invalid");
  }
  if (!(["direct", "operating"] as string[]).includes(draft.expenseClass)) {
    throw new ExpenseValidationError("INVALID_EXPENSE_CLASS", "Expense class is invalid");
  }
  const description = String(draft.description || "").trim();
  if (!description) throw new ExpenseValidationError("DESCRIPTION_REQUIRED", "Description is required");
  if (!(["unpaid", "paid"] as string[]).includes(draft.paymentStatus)) {
    throw new ExpenseValidationError("INVALID_PAYMENT_STATUS", "Payment status is invalid");
  }

  const amount = normalizeExpenseMoney(draft.amount, "amount");
  const vatAmount = normalizeExpenseMoney(draft.vatAmount, "vat_amount");
  const withholdingAmount = normalizeExpenseMoney(draft.withholdingAmount, "withholding_amount");
  const totalAmount = addExpenseMoney(amount, vatAmount);
  if (moneyToSatang(withholdingAmount) > moneyToSatang(totalAmount)) {
    throw new ExpenseValidationError("WITHHOLDING_EXCEEDS_TOTAL", "Withholding cannot exceed total expense");
  }

  const paidAt = draft.paymentStatus === "paid" ? String(draft.paidAt || "").trim() : "";
  if (draft.paymentStatus === "paid" && !DATE_PATTERN.test(paidAt)) {
    throw new ExpenseValidationError("PAID_AT_REQUIRED", "Payment date is required when paid");
  }

  return {
    p_expense: {
      id,
      expense_date: expenseDate,
      category_id: categoryId,
      expense_class: draft.expenseClass,
      description,
      amount,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      withholding_amount: withholdingAmount,
      payment_status: draft.paymentStatus,
      paid_at: paidAt || null,
      supplier_id: optionalUuid(draft.supplierId, "INVALID_SUPPLIER_ID"),
      customer_id: optionalUuid(draft.customerId, "INVALID_CUSTOMER_ID"),
      source_document_id: optionalUuid(draft.sourceDocumentId, "INVALID_DOCUMENT_ID"),
      reference: String(draft.reference || "").trim() || null,
      notes: String(draft.notes || "").trim() || null,
      archived: Boolean(draft.archived),
      void_reason: String(draft.voidReason || "").trim() || null,
    },
    p_expected_revision: id ? Math.max(1, Number(draft.revision || 0)) : 0,
    p_client_request_id: clientRequestId,
  };
}

const EXPENSE_ERROR_CODES = [
  "ADMIN_REQUIRED",
  "CATEGORY_ARCHIVED",
  "CATEGORY_REQUIRED",
  "EXPENSE_ALREADY_VOIDED",
  "IDEMPOTENCY_CONFLICT",
  "INVALID_EXPENSE_PAYLOAD",
  "INVALID_PAYMENT_STATUS",
  "REVISION_CONFLICT",
  "VOID_REASON_REQUIRED",
] as const;

export type ExpenseSaveErrorCode = typeof EXPENSE_ERROR_CODES[number];

export function expenseSaveErrorCode(error: unknown): ExpenseSaveErrorCode | null {
  const message = String((error as { message?: unknown })?.message || error || "");
  return EXPENSE_ERROR_CODES.find((code) => message.includes(code)) || null;
}

export async function saveErpExpense(
  client: Pick<SupabaseClient, "rpc">,
  args: ExpenseSaveArguments,
): Promise<ExpenseSaveResult> {
  const { data, error } = await client.rpc("save_erp_expense_v1", args);
  if (error) throw error;
  if (!data || typeof data !== "object") throw new Error("INVALID_EXPENSE_SAVE_RESPONSE");
  return data as unknown as ExpenseSaveResult;
}
