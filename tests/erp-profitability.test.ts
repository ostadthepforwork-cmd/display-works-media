import test from "node:test";
import assert from "node:assert/strict";
import {
  BATCH_4_POLICY_VERSION,
  buildBusinessProfitability,
  compareLegacyAndCanonical,
  documentRevenueExVat,
  resolveDocumentJobs,
  type FinancialDocument,
  type FinancialExpense,
} from "../src/lib/erp-profitability";

const item = (overrides: Record<string, unknown> = {}) => ({
  id: "item-1",
  productId: "product-1",
  qty: 1,
  price: 10000,
  costSnapshot: 4000,
  priceUnit: "piece",
  costUnit: "piece",
  ...overrides,
});

const document = (overrides: Partial<FinancialDocument> = {}): FinancialDocument => ({
  id: "invoice-1",
  type: "invoice",
  status: "approved",
  customerId: "customer-1",
  customerName: "Acme",
  date: "2026-08-01",
  vat: true,
  vatRate: 7,
  discount: 0,
  items: [item()],
  ...overrides,
});

const expense = (overrides: Partial<FinancialExpense> = {}): FinancialExpense => ({
  id: "expense-1",
  sourceDocumentId: "invoice-1",
  expenseClass: "direct",
  expenseDate: "2026-08-02",
  amount: 1000,
  vatAmount: 70,
  paymentStatus: "unpaid",
  ...overrides,
});

test("recognizes one approved invoice excluding VAT and keeps VAT reportable", () => {
  const invoice = document();
  assert.deepEqual(documentRevenueExVat(invoice), { recognizedRevenue: 10000, revenueVat: 700 });
  const report = buildBusinessProfitability({
    documents: [invoice],
    expenses: [],
    expenseDataAvailable: true,
    reviews: [{ jobId: "invoice-1", actualExpenseComplete: true }],
  });
  assert.equal(report.policyVersion, BATCH_4_POLICY_VERSION);
  assert.equal(report.recognizedRevenue, 10000);
  assert.equal(report.estimatedCost, 4000);
  assert.equal(report.estimatedProfit, 6000);
  assert.equal(report.actualGrossProfit, 10000);
  assert.equal(report.actualGrossMarginPercent, 100);
});

test("keeps quotation and draft invoice in pipeline without recognizing revenue", () => {
  for (const row of [
    document({ id: "quote-1", type: "quote", status: "sent" }),
    document({ id: "draft-invoice", status: "draft" }),
  ]) {
    const job = buildBusinessProfitability({ documents: [row] }).jobs[0];
    assert.equal(job.recognizedRevenue, 0);
    assert.equal(job.revenueState, "pipeline");
    assert.equal(job.revenueComplete, true);
  }
  const pipelineOnly = buildBusinessProfitability({
    documents: [document({ id: "quote-1", type: "quote", status: "sent" })],
  });
  assert.equal(pipelineOnly.estimatedCost, 0);
  assert.equal(pipelineOnly.estimatedProfit, 0);
});

test("resolves a full document chain to one job and prevents invoice plus receipt revenue duplication", () => {
  const quote = document({ id: "quote-1", type: "quote", status: "sent" });
  const invoice = document({ id: "invoice-1", orderId: "quote-1" });
  const receipt = document({
    id: "receipt-1",
    type: "receipt",
    status: "approved",
    orderId: "invoice-1",
    paymentAmount: 10000,
    paymentDate: "2026-08-03",
  });
  const report = buildBusinessProfitability({ documents: [quote, invoice, receipt] });
  assert.equal(report.jobs.length, 1);
  assert.equal(report.recognizedRevenue, 10000);
  assert.equal(report.cashReceived, 10000);
  assert.equal(report.cashOutstanding, 0);
});

test("uses actual partial receipt amounts and aggregates multiple receipts once each", () => {
  const invoice = document();
  const receiptA = document({
    id: "receipt-a", type: "receipt", orderId: "invoice-1", paymentAmount: 4000, paymentDate: "2026-08-02",
  });
  const receiptB = document({
    id: "receipt-b", type: "receipt", orderId: "invoice-1", paymentAmount: 2500, paymentDate: "2026-08-03",
  });
  const report = buildBusinessProfitability({ documents: [invoice, receiptA, receiptB] });
  assert.equal(report.recognizedRevenue, 10000);
  assert.equal(report.cashReceived, 6500);
  assert.equal(report.cashOutstanding, 3500);
});

test("deduplicates a repeated receipt identity without deduplicating by amount or name", () => {
  const invoice = document();
  const receipt = document({
    id: "receipt-1", type: "receipt", orderId: "invoice-1", paymentAmount: 3000, paymentDate: "2026-08-02",
  });
  const report = buildBusinessProfitability({ documents: [invoice, receipt, { ...receipt }] });
  assert.equal(report.cashReceived, 3000);
});

test("marks missing or inconsistent payment evidence incomplete instead of fabricating cash", () => {
  const invoice = document({ paymentStatus: "partial_paid", paymentAmount: 4000 });
  const missing = document({ id: "receipt-1", type: "receipt", orderId: "invoice-1", paymentAmount: null });
  const job = buildBusinessProfitability({ documents: [invoice, missing] }).jobs[0];
  assert.equal(job.cashReceived, 0);
  assert.equal(job.paymentComplete, false);
  assert.ok(job.warnings.includes("PAYMENT_DATA_INCOMPLETE"));
});

test("cancellation removes revenue but preserves prior payment evidence for reconciliation", () => {
  const cancelledInvoice = document({ status: "cancelled" });
  const receipt = document({
    id: "receipt-1", type: "receipt", status: "cancelled", orderId: "invoice-1", paymentAmount: 4000, paymentDate: "2026-08-02",
  });
  const job = buildBusinessProfitability({ documents: [cancelledInvoice, receipt] }).jobs[0];
  assert.equal(job.revenueState, "cancelled");
  assert.equal(job.recognizedRevenue, 0);
  assert.equal(job.cashReceived, 4000);
  assert.ok(job.warnings.includes("CANCELLED_WITH_PAYMENT"));
});

test("flags legacy receipt or billing revenue that lacks an approved invoice", () => {
  const receipt = document({ id: "receipt-1", type: "receipt", paymentAmount: 5000, paymentDate: "2026-08-02" });
  const job = buildBusinessProfitability({ documents: [receipt] }).jobs[0];
  assert.equal(job.revenueState, "legacy_unclassified");
  assert.equal(job.recognizedRevenue, 0);
  assert.equal(job.revenueComplete, false);
  assert.ok(job.warnings.includes("LEGACY_REVENUE_UNCLASSIFIED"));
});

test("fails closed when one job has multiple approved invoices", () => {
  const root = document({ id: "quote-1", type: "quote", status: "sent" });
  const first = document({ id: "invoice-1", orderId: "quote-1" });
  const second = document({ id: "invoice-2", orderId: "quote-1" });
  const job = buildBusinessProfitability({ documents: [root, first, second] }).jobs[0];
  assert.equal(job.revenueState, "conflict");
  assert.equal(job.recognizedRevenue, 0);
  assert.equal(job.revenueComplete, false);
  assert.ok(job.warnings.includes("MULTIPLE_APPROVED_INVOICES"));
});

test("preserves intentional zero estimates and exposes NULL snapshots as incomplete", () => {
  const zero = buildBusinessProfitability({
    documents: [document({ items: [item({ costSnapshot: 0 })] })],
  }).jobs[0];
  assert.equal(zero.estimatedCost, 0);
  assert.equal(zero.estimateComplete, true);

  const unknown = buildBusinessProfitability({
    documents: [document({ items: [item({ costSnapshot: null })] })],
  }).jobs[0];
  assert.equal(unknown.estimatedCost, 0);
  assert.equal(unknown.estimateComplete, false);
  assert.equal(unknown.estimatedMarginPercent, null);
});

test("keeps legacy internal expenses in estimated cost only", () => {
  const invoice = document({ internalExpenses: [{ name: "Shipping estimate", amount: 500 }] });
  const job = buildBusinessProfitability({ documents: [invoice] }).jobs[0];
  assert.equal(job.estimatedItemCost, 4000);
  assert.equal(job.legacyEstimatedCost, 500);
  assert.equal(job.estimatedCost, 4500);
  assert.equal(job.actualDirectExpense, 0);
});

test("recognizes paid, unpaid, and archived direct expense excluding VAT but excludes voided expense", () => {
  const expenses = [
    expense({ id: "direct-unpaid", amount: 1000, vatAmount: 70, paymentStatus: "unpaid" }),
    expense({ id: "direct-paid", amount: 500, paymentStatus: "paid", paidAt: "2026-08-03" }),
    expense({ id: "direct-archived", amount: 250, archivedAt: "2026-08-04" }),
    expense({ id: "direct-voided", amount: 9000, voidedAt: "2026-08-05" }),
  ];
  const report = buildBusinessProfitability({
    documents: [document()],
    expenses,
    expenseDataAvailable: true,
    reviews: [{ jobId: "invoice-1", actualExpenseComplete: true }],
  });
  assert.equal(report.actualDirectExpense, 1750);
  assert.equal(report.actualGrossProfit, 8250);
  assert.equal(report.actualExpenseComplete, true);
});

test("requires explicit review before zero or known actual expense is complete", () => {
  const unreviewed = buildBusinessProfitability({
    documents: [document()], expenses: [], expenseDataAvailable: true,
  }).jobs[0];
  assert.equal(unreviewed.actualDirectExpense, 0);
  assert.equal(unreviewed.actualExpenseComplete, false);
  assert.equal(unreviewed.actualGrossMarginPercent, null);

  const reviewed = buildBusinessProfitability({
    documents: [document()],
    expenses: [],
    expenseDataAvailable: true,
    reviews: [{ jobId: "invoice-1", actualExpenseComplete: true }],
  }).jobs[0];
  assert.equal(reviewed.actualExpenseComplete, true);
  assert.equal(reviewed.actualGrossMarginPercent, 100);
});

test("separates operating expense and treats API advertising spend as attribution only", () => {
  const report = buildBusinessProfitability({
    documents: [document()],
    expenses: [expense({ id: "operating-1", expenseClass: "operating", amount: 1000, sourceDocumentId: null })],
    expenseDataAvailable: true,
    reviews: [{ jobId: "invoice-1", actualExpenseComplete: true }],
    marketingApiSpend: 1000,
  });
  assert.equal(report.actualDirectExpense, 0);
  assert.equal(report.operatingExpense, 1000);
  assert.equal(report.operatingProfit, 9000);
  assert.ok(report.warnings.includes("MARKETING_SPEND_ATTRIBUTION_ONLY"));
});

test("deduplicates exact expense import replay and flags conflicting stable identities", () => {
  const imported = expense({
    id: "import-row-1",
    sourceProvider: "future-provider",
    externalId: "external-expense-42",
    amount: 1000,
  });
  const replay = buildBusinessProfitability({
    documents: [document()],
    expenses: [imported, { ...imported }],
    expenseDataAvailable: true,
    reviews: [{ jobId: "invoice-1", actualExpenseComplete: true }],
  });
  assert.equal(replay.actualDirectExpense, 1000);
  assert.equal(replay.warnings.includes("DUPLICATE_EXPENSE_IDENTITY"), false);

  const conflict = buildBusinessProfitability({
    documents: [document()],
    expenses: [imported, { ...imported, id: "import-row-2", amount: 2000 }],
    expenseDataAvailable: true,
    reviews: [{ jobId: "invoice-1", actualExpenseComplete: true }],
  });
  assert.equal(conflict.actualDirectExpense, 1000);
  assert.equal(conflict.actualExpenseComplete, false);
  assert.ok(conflict.warnings.includes("DUPLICATE_EXPENSE_IDENTITY"));
});

test("uses separate revenue, cash, and expense event dates for period reports", () => {
  const invoice = document({ date: "2026-01-15" });
  const receipt = document({
    id: "receipt-1",
    type: "receipt",
    orderId: "invoice-1",
    date: "2026-02-10",
    paymentDate: "2026-02-10",
    paymentAmount: 4000,
  });
  const directExpense = expense({ expenseDate: "2026-03-05", amount: 1000 });

  const january = buildBusinessProfitability({
    documents: [invoice, receipt], expenses: [directExpense], period: { from: "2026-01-01", to: "2026-01-31" },
  });
  assert.equal(january.recognizedRevenue, 10000);
  assert.equal(january.cashReceived, 0);
  assert.equal(january.actualDirectExpense, 0);

  const february = buildBusinessProfitability({
    documents: [invoice, receipt], expenses: [directExpense], period: { from: "2026-02-01", to: "2026-02-28" },
  });
  assert.equal(february.recognizedRevenue, 0);
  assert.equal(february.cashReceived, 4000);
  assert.equal(february.actualDirectExpense, 0);

  const march = buildBusinessProfitability({
    documents: [invoice, receipt], expenses: [directExpense], period: { from: "2026-03-01", to: "2026-03-31" },
  });
  assert.equal(march.recognizedRevenue, 0);
  assert.equal(march.cashReceived, 0);
  assert.equal(march.actualDirectExpense, 1000);
});

test("keeps two jobs for the same customer separate and aggregates customer profitability", () => {
  const first = document({ id: "invoice-1" });
  const second = document({ id: "invoice-2", items: [item({ id: "item-2", price: 5000, costSnapshot: 1000 })] });
  const report = buildBusinessProfitability({ documents: [first, second] });
  assert.equal(report.jobs.length, 2);
  assert.equal(report.customers.length, 1);
  assert.equal(report.customers[0].jobCount, 2);
  assert.equal(report.customers[0].recognizedRevenue, 15000);
});

test("flags missing-parent and cyclic chains instead of merging ambiguous jobs", () => {
  const missingParent = document({ id: "invoice-missing", orderId: "unknown" });
  const cycleA = document({ id: "cycle-a", orderId: "cycle-b" });
  const cycleB = document({ id: "cycle-b", type: "receipt", orderId: "cycle-a" });
  const resolutions = resolveDocumentJobs([missingParent, cycleA, cycleB]);
  assert.equal(resolutions[0].reason, "missing_parent");
  assert.equal(resolutions[1].reason, "cycle");
  assert.notEqual(resolutions[0].jobId, resolutions[1].jobId);
  const report = buildBusinessProfitability({ documents: [missingParent, cycleA, cycleB] });
  assert.equal(report.jobLinkComplete, false);
  assert.ok(report.warnings.includes("JOB_LINK_INCOMPLETE"));
});

test("flags unresolved products and unlinked direct expenses without fuzzy matching", () => {
  const report = buildBusinessProfitability({
    documents: [document({ items: [item({ productId: null })] })],
    expenses: [expense({ sourceDocumentId: null })],
    expenseDataAvailable: true,
  });
  assert.equal(report.productLinkComplete, false);
  assert.equal(report.actualDirectExpense, 1000);
  assert.ok(report.warnings.includes("UNLINKED_DIRECT_EXPENSE"));
});

test("produces an explainable old-versus-canonical comparison", () => {
  const canonical = buildBusinessProfitability({ documents: [document()] });
  const comparison = compareLegacyAndCanonical({
    recognizedRevenue: 10700,
    estimatedCost: 0,
    estimatedProfit: 10700,
  }, canonical);
  assert.equal(comparison.canonical.recognizedRevenue, 10000);
  assert.ok(comparison.differences.some((difference) => difference.field === "recognizedRevenue"));
  assert.ok(comparison.differences.every((difference) => difference.reason.length > 0));
});
