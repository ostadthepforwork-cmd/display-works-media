import test from "node:test";
import assert from "node:assert/strict";
import {
  erpDocumentDisplayStatus,
  normalizeErpLifecycleStatus,
  normalizeErpPaymentStatus,
} from "../src/lib/erp-document-status";

test("cancelled lifecycle stays cancelled even when historical payment is paid", () => {
  assert.equal(erpDocumentDisplayStatus("cancelled", "paid"), "cancelled");
});

test("keeps lifecycle and payment classifications independent", () => {
  assert.equal(erpDocumentDisplayStatus("approved", "unpaid"), "approved");
  assert.equal(erpDocumentDisplayStatus("approved", "partial_paid"), "partial_paid");
  assert.equal(erpDocumentDisplayStatus("draft", "unpaid"), "draft");
  assert.equal(erpDocumentDisplayStatus("sent", "unpaid"), "sent");
});

test("normalizes only canonical lifecycle and payment values for new writes", () => {
  assert.equal(normalizeErpLifecycleStatus("paid"), "approved");
  assert.equal(normalizeErpPaymentStatus("partial"), "partial_paid");
});
