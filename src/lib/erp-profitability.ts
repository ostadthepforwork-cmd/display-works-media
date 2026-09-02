import { lineAmount, lineCost, type ErpLineItemLike } from "./erp-calculations";
import { normalizeErpLifecycleStatus } from "./erp-document-status";

export const BATCH_4_POLICY_VERSION = "batch4-owner-approved-v1";

export type FinancialWarning =
  | "LEGACY_REVENUE_UNCLASSIFIED"
  | "MULTIPLE_APPROVED_INVOICES"
  | "ESTIMATED_COST_INCOMPLETE"
  | "ACTUAL_EXPENSE_UNCONFIRMED"
  | "PAYMENT_DATA_INCOMPLETE"
  | "JOB_LINK_INCOMPLETE"
  | "PRODUCT_LINK_INCOMPLETE"
  | "CANCELLED_WITH_PAYMENT"
  | "CASH_EXCEEDS_REVENUE"
  | "UNLINKED_DIRECT_EXPENSE"
  | "DUPLICATE_EXPENSE_IDENTITY"
  | "MARKETING_SPEND_ATTRIBUTION_ONLY";

export type ProfitabilityCompleteness = {
  revenueComplete: boolean;
  estimateComplete: boolean;
  actualExpenseComplete: boolean;
  paymentComplete: boolean;
  productLinkComplete: boolean;
  jobLinkComplete: boolean;
};

export type FinancialLineItem = ErpLineItemLike & {
  id?: string;
  productId?: string | null;
  product_id?: string | null;
  cost_snapshot?: number | string | null;
};

export type FinancialDocument = {
  id: string;
  jobId?: string | null;
  job_id?: string | null;
  orderId?: string | null;
  order_id?: string | null;
  customerId?: string | null;
  customer_id?: string | null;
  customerName?: string | null;
  customer_name?: string | null;
  type?: string;
  status?: string;
  databaseStatus?: string;
  deleted?: boolean;
  date?: string | null;
  paymentAmount?: number | string | null;
  payment_amount?: number | string | null;
  paymentDate?: string | null;
  payment_date?: string | null;
  paymentStatus?: string | null;
  payment_status?: string | null;
  discount?: number | string | null;
  discountType?: string | null;
  discount_type?: string | null;
  vat?: boolean | null;
  vatRate?: number | string | null;
  vat_rate?: number | string | null;
  items?: FinancialLineItem[];
  internalExpenses?: unknown[];
  internal_expenses?: unknown[];
  createdAt?: number | string | null;
  created_at?: string | null;
};

export type FinancialExpense = {
  id: string;
  jobId?: string | null;
  job_id?: string | null;
  sourceDocumentId?: string | null;
  source_document_id?: string | null;
  customerId?: string | null;
  customer_id?: string | null;
  expenseClass?: "direct" | "operating";
  expense_class?: "direct" | "operating";
  amount?: number | string | null;
  vatAmount?: number | string | null;
  vat_amount?: number | string | null;
  expenseDate?: string | null;
  expense_date?: string | null;
  paymentStatus?: string | null;
  payment_status?: string | null;
  paidAt?: string | null;
  paid_at?: string | null;
  archivedAt?: string | null;
  archived_at?: string | null;
  voidedAt?: string | null;
  voided_at?: string | null;
  categoryCode?: string | null;
  category_code?: string | null;
  sourceProvider?: string | null;
  source_provider?: string | null;
  externalId?: string | null;
  external_id?: string | null;
};

export type JobCostReview = {
  jobId: string;
  actualExpenseComplete: boolean;
  reviewedAt?: string | null;
};

export type DateBasis = {
  revenue: "document_date";
  expense: "expense_date";
  cash: "payment_or_receipt_date";
};

export type JobProfitability = ProfitabilityCompleteness & {
  jobId: string;
  customerId: string | null;
  customerName: string | null;
  policyVersion: typeof BATCH_4_POLICY_VERSION;
  dateBasis: DateBasis;
  revenueState: "recognized" | "pipeline" | "cancelled" | "legacy_unclassified" | "conflict";
  recognitionDocumentId: string | null;
  recognizedRevenue: number;
  revenueVat: number;
  estimatedItemCost: number;
  legacyEstimatedCost: number;
  estimatedCost: number;
  estimatedProfit: number;
  estimatedMarginPercent: number | null;
  actualDirectExpense: number;
  actualGrossProfit: number;
  actualGrossMarginPercent: number | null;
  operatingExpense: 0;
  operatingProfit: null;
  cashReceived: number;
  cashOutstanding: number;
  sourceDocumentIds: string[];
  sourceExpenseIds: string[];
  warnings: FinancialWarning[];
};

export type CustomerProfitability = ProfitabilityCompleteness & {
  customerId: string;
  customerName: string | null;
  policyVersion: typeof BATCH_4_POLICY_VERSION;
  dateBasis: DateBasis;
  recognizedRevenue: number;
  estimatedCost: number;
  estimatedProfit: number;
  actualDirectExpense: number;
  actualGrossProfit: number;
  operatingExpense: 0;
  operatingProfit: null;
  cashReceived: number;
  cashOutstanding: number;
  jobCount: number;
  incompleteJobCount: number;
  warnings: FinancialWarning[];
};

export type BusinessProfitability = ProfitabilityCompleteness & {
  policyVersion: typeof BATCH_4_POLICY_VERSION;
  dateBasis: DateBasis;
  recognizedRevenue: number;
  estimatedCost: number;
  estimatedProfit: number;
  actualDirectExpense: number;
  actualGrossProfit: number;
  actualGrossMarginPercent: number | null;
  operatingExpense: number;
  operatingProfit: number;
  operatingMarginPercent: number | null;
  cashReceived: number;
  cashOutstanding: number;
  jobs: JobProfitability[];
  customers: CustomerProfitability[];
  warnings: FinancialWarning[];
};

export type ProfitabilityInput = {
  documents: FinancialDocument[];
  expenses?: FinancialExpense[];
  reviews?: JobCostReview[];
  expenseDataAvailable?: boolean;
  marketingApiSpend?: number;
  period?: { from: string; to: string };
};

export type JobResolution = {
  documentId: string;
  jobId: string;
  complete: boolean;
  source: "explicit" | "derived_root" | "unresolved";
  reason?: "missing_parent" | "cycle";
};

export type LegacyComparison = {
  old: {
    recognizedRevenue: number;
    estimatedCost: number;
    estimatedProfit: number;
  };
  canonical: {
    recognizedRevenue: number;
    cashReceived: number;
    estimatedCost: number;
    estimatedProfit: number;
    actualDirectExpense: number;
    actualGrossProfit: number;
    operatingExpense: number;
    operatingProfit: number;
  };
  differences: Array<{
    field: string;
    oldValue: number | null;
    canonicalValue: number;
    reason: string;
  }>;
};

const DATE_BASIS: DateBasis = {
  revenue: "document_date",
  expense: "expense_date",
  cash: "payment_or_receipt_date",
};

const money = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round((numeric + Number.EPSILON) * 100) / 100 : 0;
};

const addMoney = (...values: number[]) => money(values.reduce((sum, value) => sum + value, 0));
const uniqueWarnings = (warnings: FinancialWarning[]) => [...new Set(warnings)];
const docOrderId = (doc: FinancialDocument) => doc.orderId || doc.order_id || null;
const explicitJobId = (row: FinancialDocument | FinancialExpense) => row.jobId || row.job_id || null;
const customerId = (doc: FinancialDocument) => doc.customerId || doc.customer_id || null;
const customerName = (doc: FinancialDocument) => doc.customerName || doc.customer_name || null;
const documentStatus = (doc: FinancialDocument) => normalizeErpLifecycleStatus(doc.databaseStatus || doc.status);
const isDeleted = (doc: FinancialDocument) => doc.deleted === true;
const isCancelled = (doc: FinancialDocument) => documentStatus(doc) === "cancelled";
const isApprovedInvoice = (doc: FinancialDocument) =>
  doc.type === "invoice" && !isDeleted(doc) && documentStatus(doc) === "approved";

function isInPeriod(value: unknown, period?: ProfitabilityInput["period"]) {
  if (!period) return true;
  const date = String(value || "").slice(0, 10);
  return Boolean(date && date >= period.from && date <= period.to);
}

function rawField<T>(row: Record<string, unknown>, camel: string, snake: string): T | undefined {
  if (Object.prototype.hasOwnProperty.call(row, camel)) return row[camel] as T;
  if (Object.prototype.hasOwnProperty.call(row, snake)) return row[snake] as T;
  return undefined;
}

function margin(profit: number, revenue: number, complete: boolean) {
  return complete && revenue > 0 ? money((profit / revenue) * 100) : null;
}

export function resolveDocumentJobs(documents: FinancialDocument[]): JobResolution[] {
  const byId = new Map(documents.filter((doc) => doc.id).map((doc) => [doc.id, doc]));

  return documents.map((doc) => {
    const explicit = explicitJobId(doc);
    if (explicit) {
      return { documentId: doc.id, jobId: explicit, complete: true, source: "explicit" };
    }

    let current = doc;
    const seen = new Set<string>();
    while (docOrderId(current)) {
      if (seen.has(current.id)) {
        return {
          documentId: doc.id,
          jobId: `unresolved:${doc.id}`,
          complete: false,
          source: "unresolved",
          reason: "cycle",
        };
      }
      seen.add(current.id);
      const parent = byId.get(String(docOrderId(current)));
      if (!parent) {
        return {
          documentId: doc.id,
          jobId: `unresolved:${doc.id}`,
          complete: false,
          source: "unresolved",
          reason: "missing_parent",
        };
      }
      current = parent;
    }

    return { documentId: doc.id, jobId: current.id, complete: true, source: "derived_root" };
  });
}

export function documentRevenueExVat(doc: FinancialDocument) {
  const subtotal = money((doc.items || []).reduce((sum, item) => sum + lineAmount(item), 0));
  const discount = Math.max(0, money(doc.discount));
  const discountType = doc.discountType || doc.discount_type || "percent";
  const discountAmount = discountType === "amount"
    ? Math.min(subtotal, discount)
    : money(subtotal * (Math.min(discount, 100) / 100));
  const recognizedRevenue = money(Math.max(0, subtotal - discountAmount));
  const vatRate = money(doc.vatRate ?? doc.vat_rate ?? 7);
  const revenueVat = doc.vat ? money(recognizedRevenue * (vatRate / 100)) : 0;
  return { recognizedRevenue, revenueVat };
}

function estimateForDocument(doc: FinancialDocument | undefined) {
  if (!doc) {
    return { itemCost: 0, legacyCost: 0, complete: false, productLinkComplete: false };
  }
  const items = doc.items || [];
  let complete = items.length > 0;
  let productLinkComplete = items.length > 0;
  const itemCost = money(items.reduce((sum, item) => {
    const rawCost = rawField<number | string | null>(item as Record<string, unknown>, "costSnapshot", "cost_snapshot");
    if (rawCost === null || rawCost === undefined || rawCost === "") complete = false;
    if (!(item.productId || item.product_id)) productLinkComplete = false;
    return sum + lineCost(item, rawCost === null || rawCost === undefined || rawCost === "" ? 0 : Number(rawCost));
  }, 0));
  const rawExpenses = doc.internalExpenses || doc.internal_expenses || [];
  const legacyCost = money(rawExpenses.reduce<number>((sum, raw) => {
    if (!raw || typeof raw !== "object") {
      complete = false;
      return sum;
    }
    const amount = (raw as { amount?: unknown }).amount;
    if (amount === null || amount === undefined || amount === "" || !Number.isFinite(Number(amount))) {
      complete = false;
      return sum;
    }
    return sum + Math.max(0, Number(amount));
  }, 0));
  return { itemCost, legacyCost, complete, productLinkComplete };
}

function estimateOwner(documents: FinancialDocument[], revenueOwner: FinancialDocument | undefined) {
  if (revenueOwner) return revenueOwner;
  const priority: Record<string, number> = { invoice: 4, bill: 3, quote: 2, receipt: 1 };
  return documents
    .filter((doc) => !isDeleted(doc) && !isCancelled(doc))
    .sort((left, right) => {
      const typeDiff = (priority[right.type || ""] || 0) - (priority[left.type || ""] || 0);
      if (typeDiff) return typeDiff;
      return String(right.date || right.createdAt || right.created_at || "")
        .localeCompare(String(left.date || left.createdAt || left.created_at || ""));
    })[0];
}

function cashForJob(
  documents: FinancialDocument[],
  hasRecognizedInvoice: boolean,
  period?: ProfitabilityInput["period"],
) {
  const warnings: FinancialWarning[] = [];
  let complete = true;
  let cashReceived = 0;
  const seenReceipts = new Set<string>();
  const receipts = documents.filter((doc) => doc.type === "receipt" && !isDeleted(doc));

  for (const receipt of receipts) {
    if (!receipt.id || seenReceipts.has(receipt.id)) continue;
    seenReceipts.add(receipt.id);
    const rawAmount = rawField<number | string | null>(receipt as Record<string, unknown>, "paymentAmount", "payment_amount");
    const paymentStatus = String(receipt.paymentStatus || receipt.payment_status || "");
    if (rawAmount === undefined || rawAmount === null || rawAmount === "") {
      complete = false;
      continue;
    }
    const amount = money(rawAmount);
    if (amount < 0 || (amount === 0 && ["paid", "partial_paid"].includes(paymentStatus))) complete = false;
    const cashDate = receipt.paymentDate || receipt.payment_date || receipt.date;
    if (amount > 0 && !cashDate) complete = false;
    if (isInPeriod(cashDate, period)) cashReceived = addMoney(cashReceived, Math.max(0, amount));
    if (isCancelled(receipt) && amount > 0) warnings.push("CANCELLED_WITH_PAYMENT");
  }

  if (receipts.length === 0 && hasRecognizedInvoice) {
    const invoicePaymentClaim = documents.some((doc) =>
      doc.type === "invoice"
      && (["paid", "partial_paid"].includes(String(doc.paymentStatus || doc.payment_status || ""))
        || money(doc.paymentAmount ?? doc.payment_amount) > 0));
    if (invoicePaymentClaim) complete = false;
  }
  if (!complete) warnings.push("PAYMENT_DATA_INCOMPLETE");
  return { cashReceived, complete, warnings };
}

function recognizedExpenseAmount(expense: FinancialExpense) {
  return money(Math.max(0, Number(expense.amount) || 0));
}

function expenseClass(expense: FinancialExpense) {
  return expense.expenseClass || expense.expense_class;
}

function isVoidedExpense(expense: FinancialExpense) {
  return Boolean(expense.voidedAt || expense.voided_at);
}

function deduplicateExpenses(expenses: FinancialExpense[]) {
  const unique = new Map<string, { row: FinancialExpense; fingerprint: string }>();
  let conflict = false;
  for (const row of expenses) {
    const provider = row.sourceProvider || row.source_provider;
    const externalId = row.externalId || row.external_id;
    const identity = provider && externalId ? `external:${provider}:${externalId}` : `row:${row.id}`;
    const fingerprint = JSON.stringify({
      id: row.id,
      sourceDocumentId: row.sourceDocumentId || row.source_document_id || null,
      expenseClass: expenseClass(row),
      amount: money(row.amount),
      expenseDate: row.expenseDate || row.expense_date || null,
      voided: isVoidedExpense(row),
    });
    const existing = unique.get(identity);
    if (!existing) unique.set(identity, { row, fingerprint });
    else if (existing.fingerprint !== fingerprint) conflict = true;
  }
  return { rows: [...unique.values()].map((entry) => entry.row), conflict };
}

export function buildBusinessProfitability(input: ProfitabilityInput): BusinessProfitability {
  const documents = input.documents || [];
  const deduplicatedExpenses = deduplicateExpenses(input.expenses || []);
  const expenses = deduplicatedExpenses.rows;
  const resolutions = resolveDocumentJobs(documents);
  const resolutionByDocument = new Map(resolutions.map((resolution) => [resolution.documentId, resolution]));
  const documentsByJob = new Map<string, FinancialDocument[]>();
  for (const doc of documents) {
    const resolution = resolutionByDocument.get(doc.id);
    if (!resolution) continue;
    documentsByJob.set(resolution.jobId, [...(documentsByJob.get(resolution.jobId) || []), doc]);
  }

  const expensesByJob = new Map<string, FinancialExpense[]>();
  const unlinkedDirectExpenses: FinancialExpense[] = [];
  for (const expense of expenses.filter((row) =>
    !isVoidedExpense(row) && isInPeriod(row.expenseDate || row.expense_date, input.period))) {
    const sourceDocumentId = expense.sourceDocumentId || expense.source_document_id;
    const jobId = explicitJobId(expense) || (sourceDocumentId ? resolutionByDocument.get(sourceDocumentId)?.jobId : null);
    if (jobId) expensesByJob.set(jobId, [...(expensesByJob.get(jobId) || []), expense]);
    else if (expenseClass(expense) === "direct") unlinkedDirectExpenses.push(expense);
  }

  const reviewByJob = new Map((input.reviews || []).map((review) => [review.jobId, review]));
  const jobs: JobProfitability[] = [];

  for (const [jobId, jobDocuments] of documentsByJob) {
    const warnings: FinancialWarning[] = [];
    const jobResolutions = jobDocuments.map((doc) => resolutionByDocument.get(doc.id)).filter(Boolean) as JobResolution[];
    const jobLinkComplete = jobResolutions.every((resolution) => resolution.complete);
    if (!jobLinkComplete) warnings.push("JOB_LINK_INCOMPLETE");

    const approvedInvoices = jobDocuments.filter(isApprovedInvoice);
    const cancelledInvoices = jobDocuments.filter((doc) => doc.type === "invoice" && !isDeleted(doc) && isCancelled(doc));
    let revenueState: JobProfitability["revenueState"] = "pipeline";
    let revenueComplete = true;
    let revenueOwner: FinancialDocument | undefined;
    if (approvedInvoices.length === 1) {
      revenueState = "recognized";
      revenueOwner = approvedInvoices[0];
    } else if (approvedInvoices.length > 1) {
      revenueState = "conflict";
      revenueComplete = false;
      warnings.push("MULTIPLE_APPROVED_INVOICES");
    } else if (cancelledInvoices.length > 0) {
      revenueState = "cancelled";
    } else if (jobDocuments.some((doc) => !isDeleted(doc) && ["bill", "receipt"].includes(doc.type || ""))) {
      revenueState = "legacy_unclassified";
      revenueComplete = false;
      warnings.push("LEGACY_REVENUE_UNCLASSIFIED");
    }

    const revenue = revenueOwner && isInPeriod(revenueOwner.date, input.period)
      ? documentRevenueExVat(revenueOwner)
      : { recognizedRevenue: 0, revenueVat: 0 };
    const estimate = estimateForDocument(estimateOwner(jobDocuments, revenueOwner));
    if (!estimate.complete) warnings.push("ESTIMATED_COST_INCOMPLETE");
    if (!estimate.productLinkComplete) warnings.push("PRODUCT_LINK_INCOMPLETE");

    const linkedExpenses = expensesByJob.get(jobId) || [];
    const directExpenses = linkedExpenses.filter((expense) => expenseClass(expense) === "direct");
    const actualDirectExpense = money(directExpenses.reduce((sum, expense) => sum + recognizedExpenseAmount(expense), 0));
    const actualExpenseComplete = input.expenseDataAvailable === true
      && !deduplicatedExpenses.conflict
      && reviewByJob.get(jobId)?.actualExpenseComplete === true;
    if (!actualExpenseComplete) warnings.push("ACTUAL_EXPENSE_UNCONFIRMED");

    const cash = cashForJob(jobDocuments, Boolean(revenueOwner), input.period);
    warnings.push(...cash.warnings);
    const cancelledWithCash = cancelledInvoices.length > 0 && cash.cashReceived > 0;
    if (cancelledWithCash) warnings.push("CANCELLED_WITH_PAYMENT");
    if (cash.cashReceived > revenue.recognizedRevenue && revenueComplete) warnings.push("CASH_EXCEEDS_REVENUE");

    const estimatedCost = addMoney(estimate.itemCost, estimate.legacyCost);
    const estimatedProfit = money(revenue.recognizedRevenue - estimatedCost);
    const actualGrossProfit = money(revenue.recognizedRevenue - actualDirectExpense);
    const identityDoc = revenueOwner || jobDocuments[0];
    jobs.push({
      jobId,
      customerId: customerId(identityDoc),
      customerName: customerName(identityDoc),
      policyVersion: BATCH_4_POLICY_VERSION,
      dateBasis: DATE_BASIS,
      revenueState,
      recognitionDocumentId: revenueOwner?.id || null,
      recognizedRevenue: revenue.recognizedRevenue,
      revenueVat: revenue.revenueVat,
      estimatedItemCost: estimate.itemCost,
      legacyEstimatedCost: estimate.legacyCost,
      estimatedCost,
      estimatedProfit,
      estimatedMarginPercent: margin(estimatedProfit, revenue.recognizedRevenue, revenueComplete && estimate.complete),
      actualDirectExpense,
      actualGrossProfit,
      actualGrossMarginPercent: margin(actualGrossProfit, revenue.recognizedRevenue, revenueComplete && actualExpenseComplete),
      operatingExpense: 0,
      operatingProfit: null,
      cashReceived: cash.cashReceived,
      cashOutstanding: money(Math.max(0, revenue.recognizedRevenue - cash.cashReceived)),
      revenueComplete,
      estimateComplete: estimate.complete,
      actualExpenseComplete,
      paymentComplete: cash.complete,
      productLinkComplete: estimate.productLinkComplete,
      jobLinkComplete,
      sourceDocumentIds: jobDocuments.map((doc) => doc.id),
      sourceExpenseIds: directExpenses.map((expense) => expense.id),
      warnings: uniqueWarnings(warnings),
    });
  }

  const customerGroups = new Map<string, JobProfitability[]>();
  for (const job of jobs) {
    if (!job.customerId) continue;
    customerGroups.set(job.customerId, [...(customerGroups.get(job.customerId) || []), job]);
  }
  const customers = [...customerGroups].map(([id, customerJobs]): CustomerProfitability => {
    const recognizedCustomerJobs = customerJobs.filter((job) =>
      job.revenueState === "recognized" && job.recognizedRevenue > 0);
    const completenessKeys: Array<keyof ProfitabilityCompleteness> = [
      "revenueComplete", "estimateComplete", "actualExpenseComplete", "paymentComplete", "productLinkComplete", "jobLinkComplete",
    ];
    const completeness = Object.fromEntries(completenessKeys.map((key) => [key, customerJobs.every((job) => job[key])])) as ProfitabilityCompleteness;
    return {
      customerId: id,
      customerName: customerJobs.find((job) => job.customerName)?.customerName || null,
      policyVersion: BATCH_4_POLICY_VERSION,
      dateBasis: DATE_BASIS,
      recognizedRevenue: money(customerJobs.reduce((sum, job) => sum + job.recognizedRevenue, 0)),
      estimatedCost: money(recognizedCustomerJobs.reduce((sum, job) => sum + job.estimatedCost, 0)),
      estimatedProfit: money(recognizedCustomerJobs.reduce((sum, job) => sum + job.estimatedProfit, 0)),
      actualDirectExpense: money(customerJobs.reduce((sum, job) => sum + job.actualDirectExpense, 0)),
      actualGrossProfit: money(customerJobs.reduce((sum, job) => sum + job.actualGrossProfit, 0)),
      operatingExpense: 0,
      operatingProfit: null,
      cashReceived: money(customerJobs.reduce((sum, job) => sum + job.cashReceived, 0)),
      cashOutstanding: money(customerJobs.reduce((sum, job) => sum + job.cashOutstanding, 0)),
      jobCount: customerJobs.length,
      incompleteJobCount: customerJobs.filter((job) => !(
        job.revenueComplete
        && job.estimateComplete
        && job.actualExpenseComplete
        && job.paymentComplete
        && job.productLinkComplete
        && job.jobLinkComplete
      )).length,
      ...completeness,
      warnings: uniqueWarnings(customerJobs.flatMap((job) => job.warnings)),
    };
  });

  const eligibleExpenses = expenses.filter((expense) =>
    !isVoidedExpense(expense) && isInPeriod(expense.expenseDate || expense.expense_date, input.period));
  const directExpenseTotal = money(eligibleExpenses
    .filter((expense) => expenseClass(expense) === "direct")
    .reduce((sum, expense) => sum + recognizedExpenseAmount(expense), 0));
  const operatingExpense = money(eligibleExpenses
    .filter((expense) => expenseClass(expense) === "operating")
    .reduce((sum, expense) => sum + recognizedExpenseAmount(expense), 0));
  const recognizedRevenue = money(jobs.reduce((sum, job) => sum + job.recognizedRevenue, 0));
  const recognizedJobs = jobs.filter((job) => job.revenueState === "recognized" && job.recognizedRevenue > 0);
  const estimatedCost = money(recognizedJobs.reduce((sum, job) => sum + job.estimatedCost, 0));
  const estimatedProfit = money(recognizedRevenue - estimatedCost);
  const actualGrossProfit = money(recognizedRevenue - directExpenseTotal);
  const operatingProfit = money(actualGrossProfit - operatingExpense);
  const warnings = uniqueWarnings([
    ...jobs.flatMap((job) => job.warnings),
    ...(unlinkedDirectExpenses.length ? ["UNLINKED_DIRECT_EXPENSE" as const] : []),
    ...(deduplicatedExpenses.conflict ? ["DUPLICATE_EXPENSE_IDENTITY" as const] : []),
    ...(money(input.marketingApiSpend) > 0 ? ["MARKETING_SPEND_ATTRIBUTION_ONLY" as const] : []),
  ]);
  const all = (key: keyof ProfitabilityCompleteness) => jobs.every((job) => job[key]);
  const allRecognized = (key: keyof ProfitabilityCompleteness) => recognizedJobs.every((job) => job[key]);
  const actualExpenseComplete = input.expenseDataAvailable === true
    && !deduplicatedExpenses.conflict
    && allRecognized("actualExpenseComplete")
    && unlinkedDirectExpenses.length === 0;
  const revenueComplete = all("revenueComplete");

  return {
    policyVersion: BATCH_4_POLICY_VERSION,
    dateBasis: DATE_BASIS,
    recognizedRevenue,
    estimatedCost,
    estimatedProfit,
    actualDirectExpense: directExpenseTotal,
    actualGrossProfit,
    actualGrossMarginPercent: margin(actualGrossProfit, recognizedRevenue, revenueComplete && actualExpenseComplete),
    operatingExpense,
    operatingProfit,
    operatingMarginPercent: margin(operatingProfit, recognizedRevenue, revenueComplete && actualExpenseComplete),
    cashReceived: money(jobs.reduce((sum, job) => sum + job.cashReceived, 0)),
    cashOutstanding: money(jobs.reduce((sum, job) => sum + job.cashOutstanding, 0)),
    revenueComplete,
    estimateComplete: allRecognized("estimateComplete"),
    actualExpenseComplete,
    paymentComplete: all("paymentComplete"),
    productLinkComplete: allRecognized("productLinkComplete"),
    jobLinkComplete: all("jobLinkComplete"),
    jobs,
    customers,
    warnings,
  };
}

export function compareLegacyAndCanonical(
  old: LegacyComparison["old"],
  canonical: BusinessProfitability,
): LegacyComparison {
  const canonicalValues = {
    recognizedRevenue: canonical.recognizedRevenue,
    cashReceived: canonical.cashReceived,
    estimatedCost: canonical.estimatedCost,
    estimatedProfit: canonical.estimatedProfit,
    actualDirectExpense: canonical.actualDirectExpense,
    actualGrossProfit: canonical.actualGrossProfit,
    operatingExpense: canonical.operatingExpense,
    operatingProfit: canonical.operatingProfit,
  };
  const differences: LegacyComparison["differences"] = [];
  if (money(old.recognizedRevenue) !== canonical.recognizedRevenue) differences.push({
    field: "recognizedRevenue",
    oldValue: money(old.recognizedRevenue),
    canonicalValue: canonical.recognizedRevenue,
    reason: "Legacy reports use receipt totals including VAT; Batch 4 uses one approved invoice per job excluding VAT.",
  });
  if (money(old.estimatedCost) !== canonical.estimatedCost) differences.push({
    field: "estimatedCost",
    oldValue: money(old.estimatedCost),
    canonicalValue: canonical.estimatedCost,
    reason: "Batch 4 selects one estimate owner per job and preserves NULL cost as incomplete instead of silently using zero.",
  });
  differences.push({
    field: "cashReceived",
    oldValue: null,
    canonicalValue: canonical.cashReceived,
    reason: "Cash is now reported independently from revenue using recorded receipt payment amounts.",
  });
  differences.push({
    field: "actualDirectExpense",
    oldValue: null,
    canonicalValue: canonical.actualDirectExpense,
    reason: "Actual expense is sourced only from eligible Batch 3 expense records; document estimates remain estimates.",
  });
  differences.push({
    field: "operatingProfit",
    oldValue: null,
    canonicalValue: canonical.operatingProfit,
    reason: "Operating expense is separated from job direct expense and marketing API attribution data.",
  });
  return {
    old: {
      recognizedRevenue: money(old.recognizedRevenue),
      estimatedCost: money(old.estimatedCost),
      estimatedProfit: money(old.estimatedProfit),
    },
    canonical: canonicalValues,
    differences,
  };
}
