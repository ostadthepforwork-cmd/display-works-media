-- DEFERRED MULTI-SESSION TEST DEFINITION. ISOLATED LOCAL DATABASE ONLY.
-- This file documents the exact assertions; it is intentionally not a single-session simulation.
-- Use two independent psql sessions with synthetic active-admin JWT claims.

-- Setup in session A before BEGIN in either worker:
-- 1. Insert one synthetic active category and record :category_id.
-- 2. Prepare identical valid payloads except for client_request_id.
-- 3. Record the current counter for the Bangkok Buddhist year.

-- NUMBER ALLOCATION
-- Session A: BEGIN; select save_erp_expense_v1(:payload_a, 0, :request_a); keep transaction open.
-- Session B: BEGIN; select save_erp_expense_v1(:payload_b, 0, :request_b); COMMIT.
-- Session A: COMMIT.
-- Assert both calls succeed, IDs differ, expense numbers differ, sequences are consecutive,
-- and the counter is never decremented after archive or void.

-- IDEMPOTENT CONCURRENT RETRY
-- Sessions A and B call save_erp_expense_v1 with the same user, request ID, and payload.
-- Assert one logical expense and one number exist; both responses identify the same expense.
-- Repeat with the same request ID and different payload; assert IDEMPOTENCY_CONFLICT.

-- OPTIMISTIC EDIT
-- Both sessions load revision N for the same synthetic expense.
-- Session B saves and commits revision N+1.
-- Session A attempts expected revision N; assert REVISION_CONFLICT and no field/event mutation.

-- EVENT FAILURE ROLLBACK
-- In the isolated database, install a temporary trigger that raises on erp_expense_events INSERT.
-- Call save_erp_expense_v1 and assert the expense, counter increment, save request, and event all roll back.

-- STORAGE/RLS
-- Verify anon/non-admin cannot list, upload, sign, or mutate metadata.
-- Verify an active admin can upload only approved signatures to a generated expense path.
-- Verify archive/void retains object and metadata; no authenticated DELETE policy exists.

-- Cleanup every synthetic row/object and restore any temporary trigger before finishing.
