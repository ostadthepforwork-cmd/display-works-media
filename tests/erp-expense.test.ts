import test from "node:test";
import assert from "node:assert/strict";
import {
  ExpenseValidationError,
  addExpenseMoney,
  buildErpExpenseSaveArguments,
  expenseSaveErrorCode,
  expenseBangkokDate,
  saveErpExpense,
} from "../src/lib/erp-expense";

const categoryId = "11111111-1111-4111-8111-111111111111";
const requestId = "22222222-2222-4222-8222-222222222222";

test("payment date round trips Bangkok midnight without drifting on edits", () => {
  assert.equal(expenseBangkokDate("2026-09-08T17:00:00+00:00"), "2026-09-09");
  assert.equal(expenseBangkokDate("2026-09-09T00:00:00+07:00"), "2026-09-09");
  assert.equal(expenseBangkokDate("2026-09-09"), "2026-09-09");
  assert.equal(expenseBangkokDate(new Date("2026-12-31T17:01:00Z")), "2027-01-01");
});

function draft(overrides: Record<string, unknown> = {}) {
  return {
    clientRequestId: requestId,
    expenseDate: "2026-09-01",
    categoryId,
    expenseClass: "operating" as const,
    description: "Adobe subscription",
    amount: "1000.00",
    vatAmount: "70.00",
    withholdingAmount: "30.00",
    paymentStatus: "unpaid" as const,
    ...overrides,
  };
}

test("builds an independent expense with exact decimal semantics", () => {
  const args = buildErpExpenseSaveArguments(draft());
  assert.equal(args.p_expected_revision, 0);
  assert.equal(args.p_expense.amount, "1000.00");
  assert.equal(args.p_expense.vat_amount, "70.00");
  assert.equal(args.p_expense.total_amount, "1070.00");
  assert.equal(args.p_expense.withholding_amount, "30.00");
  assert.equal(args.p_expense.customer_id, null);
  assert.equal(args.p_expense.supplier_id, null);
  assert.equal(args.p_expense.source_document_id, null);
  assert.equal(args.p_expense.paid_at, null);
});

test("supports direct document-linked expenses and intentional zero", () => {
  const documentId = "33333333-3333-4333-8333-333333333333";
  const args = buildErpExpenseSaveArguments(draft({
    expenseClass: "direct",
    description: "Shipping",
    amount: "0",
    vatAmount: "0",
    withholdingAmount: "0",
    sourceDocumentId: documentId,
  }));
  assert.equal(args.p_expense.amount, "0.00");
  assert.equal(args.p_expense.total_amount, "0.00");
  assert.equal(args.p_expense.source_document_id, documentId);
});

test("requires payment date for paid and clears it for unpaid", () => {
  assert.throws(
    () => buildErpExpenseSaveArguments(draft({ paymentStatus: "paid" })),
    (error: unknown) => error instanceof ExpenseValidationError && error.code === "PAID_AT_REQUIRED",
  );
  const paid = buildErpExpenseSaveArguments(draft({ paymentStatus: "paid", paidAt: "2026-09-02" }));
  assert.equal(paid.p_expense.paid_at, "2026-09-02");
  const unpaid = buildErpExpenseSaveArguments(draft({ paidAt: "2026-09-02" }));
  assert.equal(unpaid.p_expense.paid_at, null);
});

test("rejects negative, malformed, and excessive withholding values", () => {
  assert.throws(() => buildErpExpenseSaveArguments(draft({ amount: "-1" })), ExpenseValidationError);
  assert.throws(() => buildErpExpenseSaveArguments(draft({ vatAmount: "1.999" })), ExpenseValidationError);
  assert.throws(
    () => buildErpExpenseSaveArguments(draft({ amount: "10", vatAmount: "0", withholdingAmount: "10.01" })),
    (error: unknown) => error instanceof ExpenseValidationError && error.code === "WITHHOLDING_EXCEEDS_TOTAL",
  );
  assert.equal(addExpenseMoney("999999999999.99", "0.01"), "1000000000000.00");
});

test("builds edit revision and archive/void intent without trusting expense number", () => {
  const args = buildErpExpenseSaveArguments(draft({
    id: "44444444-4444-4444-8444-444444444444",
    revision: 7,
    archived: true,
    voidReason: "Duplicate supplier invoice",
  }));
  assert.equal(args.p_expected_revision, 7);
  assert.equal(args.p_expense.archived, true);
  assert.equal(args.p_expense.void_reason, "Duplicate supplier invoice");
  assert.equal("expense_no" in args.p_expense, false);
});

test("maps RPC conflicts and calls only the expense save RPC", async () => {
  assert.equal(expenseSaveErrorCode(new Error("REVISION_CONFLICT")), "REVISION_CONFLICT");
  assert.equal(expenseSaveErrorCode({ message: "IDEMPOTENCY_CONFLICT" }), "IDEMPOTENCY_CONFLICT");
  let call: unknown;
  const client = {
    rpc: async (name: string, args: unknown) => {
      call = { name, args };
      return {
        data: {
          expense_id: "expense-1",
          expense_no: "EXP2569-0001",
          revision: 1,
          updated_at: "2026-09-01T00:00:00Z",
          expense: { id: "expense-1" },
          idempotent_replay: false,
        },
        error: null,
      };
    },
  };
  const args = buildErpExpenseSaveArguments(draft());
  const result = await saveErpExpense(client as never, args);
  assert.equal(result.expense_no, "EXP2569-0001");
  assert.deepEqual(call, { name: "save_erp_expense_v1", args });
});
