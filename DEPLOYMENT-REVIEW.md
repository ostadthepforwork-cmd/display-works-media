# Production document menu candidate

Status: ISOLATED RECEIPT AND CRAWLER RELEASE PREPARATION - NOT PROMOTED

## Crawler patch added 2026-09-08
- Only additional application diff: src/proxy.ts removes unsupported http_status/response_size ingestion fields, adds timeout and redacted failure reporting.
- Production column metadata was inspected read-only. No migration required.
- Added mocked ingestion regression; isolated unit suite PASS 35/35 and typecheck PASS.
- Expense implementation is excluded; schema/RLS validation remains required before expense deployment.
- Prepare production-environment build with --skip-domain; live traffic must not change until candidate smoke passes.

## 2026-09-08 verification update
- Compared live deployment source manifest with candidate src/public/package/config files. Nine SHA differences were checked by fetching source contents; all nine baseline files match after newline normalization. Candidate application diff remains the receipt menu/editor change only.
- Browser static JS scan: zero matches for SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SERVICE_KEY, sb_secret_. This marker scan is not a full credential-value audit.
- Read-only production metadata inspection: ai_crawler_visits exists with RLS enabled; ai_citation_logs, ai_referral_visits, erp_expenses, erp_expense_categories were not found in public schema.
- Isolated branch pushed; Preview deployment dpl_2uEdsTPr2p5xpnf34V11yr5x9DsW, commit 57a6d3f. No production promotion performed.

## Isolation
- Baseline: production-batch-1b-baseline (8a53df1), reconstructed source.
- Candidate: 38542a3, branch fix/production-document-menu-20260907.
- Application diff: src/app/admin/page.tsx only (receipt follow-up option and target editor title/type).
- Regression tests: tests/document-followup-ui.test.ts.
- No Batch 2-5A changes or database migrations included.

## Local verification
- Typecheck: PASS.
- Unit: 34/34 PASS; two menu tests are source-based, not authenticated browser acceptance.
- Build: PASS using existing workspace environment loaded into process only. Initial build without environment failed at login prerender; rerun with environment passed.
- No production document was created or modified.

## Mandatory outstanding checks
- Production-environment build and remaining public smoke before promotion. Environment metadata shows CRON_SECRET is production-only; do not directly repoint production to the Preview artifact without resolving environment parity.
- Full credential-value/service-role JWT browser scan remains outstanding beyond the literal marker scan.
- Production verification after promotion; no promotion has occurred.

## Authenticated Preview acceptance, 2026-09-08
- Desktop and 390x844 mobile: quotation follow-up opens the receipt editor, with RC number, original quotation reference, copied items and matching total.
- Cancelled both drafts without saving. This proves editor navigation only, not persisted receipt creation or numbering/concurrency correctness.
- Blog listing and published article /blog/product-label-sticker-material-guide render successfully on the isolated Preview. Homepage smoke remains outstanding.
- Promotion tooling review was interrupted by an automatic approval-review usage-limit rejection. No alternate execution was attempted, no credits purchased, and no live alias changed.
- Resume by preparing the same isolated source using production environment without assigning live domains, validating it, then promoting and checking production. Do not deploy the mixed branch.

## Separate blockers
- Production baseline quick-expense explicitly targets receipt in desktop and mobile menus. Independent expense page depends on undeployed Batch 3 schema/RPC validation; do not copy the mixed admin file.
- AI screenshot reports citation table unavailable in schema cache. Inspect schema visibility and ACL read-only; do not execute legacy SQL blindly. No citation writer discovered in current src/scripts.
- Do not promote fix/admin-audit-20260907 as a whole.

No deployment, migration, RLS change, or paid resource was performed in this review.
