# Isolated expense contract checks

This is a test-only candidate directory, not a production migration location.
candidate.sql was copied from the locally prepared Batch 3 migration
20260901040100_batch_3_erp_expense_management.sql. No Batch 2 migration is applied.

The runner creates a disposable Supabase instance with real Auth and Storage schemas.
The existing Batch 1A membership SQL is applied unchanged. dependency-baseline.sql
reconstructs the six relevant ERP tables from read-only, user-approved metadata:
columns/defaults, constraints, indexes, update triggers, RLS and table privileges.
The runner restores relevant postgres default privileges and active-admin policies.
This is not a complete production clone: Auth/Storage are provided by local Supabase
and there are no production rows. fixture.sql and browser-fixture.sql are retained
as earlier test evidence and are no longer executed.
Passing tests does not authorize skipping the Batch 2 production-order gate.

Only synthetic users and data are created. Independent psql processes are gated
on a shared advisory-lock barrier; the runner asserts that all sessions overlap
before releasing them. Statement and process timeouts bound execution.

Storage tests exercise real HTTP upload, registration, signed download and denial.
browser.mjs builds the actual app, logs in normally, creates independent expenses,
tests attachment routes, edit/payment dates, archive/restore/void and audit history.
Browser traffic is limited to loopback app/Supabase origins. Migration rollback and
legacy ERP write compatibility are also tested. The job always stops the stack.
No production credentials, environment files, project linking, artifacts or caches
are used. Run only on the standard GitHub-hosted Linux workflow, never production.
