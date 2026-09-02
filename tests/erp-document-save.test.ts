import test from "node:test";
import assert from "node:assert/strict";
import { buildErpSaveArguments, erpSaveErrorCode, saveErpDocument } from "../src/lib/erp-document-save";

test("builds a create request without trusting a browser document number", () => {
  const args = buildErpSaveArguments({
    id: "",
    docNo: "QT9999-9999",
    clientRequestId: "0a4e95f8-51fe-42ad-9289-ddb6674ce47a",
    type: "quote",
    vat: true,
    items: [{ id: "local-item", name: "Test", qty: 1, price: 100, costSnapshot: 0 }],
  }, {
    status: "draft",
    paymentStatus: "unpaid",
    paymentAmount: 0,
    internalExpenses: [],
  });

  assert.equal(args.p_expected_revision, 0);
  assert.equal("doc_no" in args.p_document, false);
  assert.equal(args.p_items[0].cost_snapshot, 0);
});

test("preserves unknown cost as null and stable product identity", () => {
  const args = buildErpSaveArguments({
    id: "23ecb252-e4a0-4a58-80d0-c52223e96eae",
    revision: 5,
    clientRequestId: "47575c89-483f-416c-902d-fb0f3c3bf462",
    type: "quote",
    items: [{
      id: "80c65a57-63f1-4cec-b3c1-ee2e0f17433d",
      name: "Renamed snapshot",
      qty: 1,
      price: 200,
      costSnapshot: null,
      productId: "e17cfe9c-66a5-4b3c-a2f2-8a2f3bd2dc5b",
    }],
  }, {
    status: "sent",
    paymentStatus: "partial_paid",
    paymentAmount: 50,
    internalExpenses: [],
  });

  assert.equal(args.p_expected_revision, 5);
  assert.equal(args.p_items[0].cost_snapshot, null);
  assert.equal(args.p_items[0].product_id, "e17cfe9c-66a5-4b3c-a2f2-8a2f3bd2dc5b");
});

test("recognizes actionable save conflicts", () => {
  assert.equal(erpSaveErrorCode(new Error("REVISION_CONFLICT")), "REVISION_CONFLICT");
  assert.equal(erpSaveErrorCode({ message: "IDEMPOTENCY_CONFLICT" }), "IDEMPOTENCY_CONFLICT");
  assert.equal(erpSaveErrorCode(new Error("network unavailable")), null);
});

test("calls only the atomic document save RPC and returns canonical state", async () => {
  let call: { name: string; args: unknown } | null = null;
  const canonical = { document: { id: "doc-1", revision: 1 }, items: [{ id: "item-1" }] };
  const client = {
    rpc: async (name: string, args: unknown) => {
      call = { name, args };
      return { data: canonical, error: null };
    },
  };
  const args = {
    p_document: { type: "quote" },
    p_items: [{ name: "Test" }],
    p_expected_revision: 0,
    p_client_request_id: "f53f0213-4953-4873-8a41-3459d571daf2",
  } as ReturnType<typeof buildErpSaveArguments>;

  const result = await saveErpDocument(client as never, args);
  assert.deepEqual(result, canonical);
  assert.deepEqual(call, { name: "save_erp_document_v1", args });
});
