# Expense release gates

## Scope
Candidate branch: ci/expense-environment-20260908.
Production source baseline: 8c06013. No Batch 2 transaction/numbering changes.
No package, lockfile, framework, CMS, Marketing or company identity changes.

## Approval record
The user explicitly approved publication of relevant schema/ACL metadata for
isolated GitHub Actions testing on 2026-09-09. No business records or credentials
are included. The earlier unpushed metadata commit was amended before publication.
The user subsequently requested production preflight and deployment of the scoped
expense release. This does not waive the backup/recovery gate or authorize costs.
The latest instruction explicitly declines backup and requests Git publication.
No backup will be created in this step. Recovery remains unverified, not passed.
This step publishes documentation only; production migration/deployment is not run.

## Execution boundary
No production migrations or deployment have been performed in this closure step.
Do not apply dependency-baseline.sql to production: it is a disposable test fixture.
Only candidate.sql is the proposed expense migration, and only after review.

## Cutover and recovery
1. Confirm explicit expense-only exception and the exact live deployment baseline.
2. Confirm the final tested source/migration hash and expense objects are absent.
3. Confirm an adequate database backup/recovery point; no paid service activation.
4. Apply the reviewed additive expense migration atomically as the reviewed executor.
   On failure, roll back the transaction and do not promote the application.
5. Verify expense object ownership, RPC grants, RLS and private evidence bucket.
6. Promote only the isolated expense application after database verification.
7. Verify owner navigation, category loading and independent expense editor; deny
   anonymous evidence access. Do not invent a real expense for production testing.
8. On application regression, restore the verified prior application deployment.
   Keep additive expense tables and any recorded expenses/evidence intact. Never
   drop tables or reset counters as a rollback. Prepare a tested forward repair.

## Outstanding
Schema-backed CI PASSED at 59d0d6b, run 34338084732. See EXPENSE-ACCEPTANCE-20260909.md.
Production read-only preflight resumed successfully on 2026-09-09. Expense tables,
save RPC and evidence bucket remain absent; the existing production deployment is
dpl_Cfn3c4y9C5zrFHcLT1QLEJNzdShm. Relevant authorization/default ACL checks passed.
Security advisor reports one existing warning: leaked password protection disabled.

BLOCKER: authenticated Supabase Dashboard shows "Last backup No backups" and
"Free Plan does not include project backups" on the Scheduled backups page.
No paid upgrade was enabled. An adequate independent recovery copy has not been
verified. Publicly approved schema metadata is not a business-data backup.

Backup is now declined by the user; the original recovery gate remains unexecuted.
Remaining production work: review the release risk without a backup, migration
review/application, isolated application promotion, and owner production acceptance.
No production migration, deployment or business-data modification was performed.
Do not publish production backup data to GitHub or CI artifacts.
