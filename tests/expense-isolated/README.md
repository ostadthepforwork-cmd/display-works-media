# Isolated expense contract checks

This is a test-only candidate directory, not a production migration location.
candidate.sql was copied from the locally prepared Batch 3 migration
20260901040100_batch_3_erp_expense_management.sql. No Batch 2 migration is applied.

The runner creates a disposable Supabase instance with real Auth and Storage schemas.
The existing Batch 1A membership SQL is applied unchanged. The three legacy ERP
FK targets are minimal UUID contracts, NOT a reconstructed production schema.
Passing these tests cannot establish production baseline compatibility or approve
skipping the previously required Batch 2 production-order gate.

Only synthetic users and data are created. Independent psql processes are gated
on a shared advisory-lock barrier; the runner asserts that all sessions overlap
before releasing them. Statement and process timeouts bound execution.

Storage tests here exercise SQL policies only, not actual object upload/download.
Complete production-equivalence, Storage HTTP and expense browser acceptance are
still required before deployment. The job always stops its disposable stack.
No production credentials, environment files, project linking, artifacts or caches
are used. Run only on the standard GitHub-hosted Linux workflow, never production.
