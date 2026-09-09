# Expense activation candidate review

Status: IN PROGRESS, NOT DEPLOYED.

## Production metadata inspection
Read-only Supabase catalog queries on 2026-09-09 confirmed:
- Expense tables are still absent. No business rows were read or modified.
- Legacy ERP customers, suppliers and documents use UUID primary keys.
- private.is_admin is the Batch 1A active owner/admin membership check, security invoker, empty search_path, EXECUTE only postgres/authenticated.
- Existing Storage object policies are scoped to cms-media; no broad policy observed in this snapshot.
- postgres defaults grant broad privileges on public sequences to anon/authenticated.
The expense candidate now explicitly revokes privileges on erp_expense_events_id_seq.
This is a relevant dependency review, NOT full production schema equivalence.

## Application isolation
- Copied only ExpensePage, ExpenseHistory, three expense helpers and two evidence routes from the locally prepared work.
- admin/page.tsx has four scoped changes: import, render branch and two menu destinations.
- No Batch 2 save RPC, numbering or document transaction changes; no Batch 4/5A changes.
- Production migration stays outside automatic migration discovery in tests/expense-isolated/candidate.sql until approved.
- Typecheck and scoped lint PASS; unit suite including copied expense tests 54/54 PASS.
- Production build PASS with loopback placeholder configuration only; not a live DB rendering acceptance.
- Browser static JS privileged marker scan PASS; no production secret used in this build.
- SQL/Storage run https://github.com/ostadthepforwork-cmd/display-works-media/actions/runs/34311648552 PASS, 13 groups, job 2m11s.
- Tested actual synthetic Auth login, Storage HTTP upload, attachment RPC registration, signed download byte equality, public/nonadmin rejection and exact object cleanup.
- Prior HTTP run failed because SQL-only Auth fixtures could not be updated through Auth API. Corrected fixture creation via local Auth API; no production auth change.
- The generic NOT EXECUTED footer in the runner has a stale Storage label; the explicit Storage HTTP PASS above is authoritative for that limited test. Application attachment-route end-to-end and browser acceptance remain unexecuted.

## Release approval
Prior user-approved dependency order still requires Batch 2 production validation before Batch 3.
A specific expense-only exception was requested on 2026-09-09; no approval recorded yet.
Do not treat the generic request to continue as implicit approval to bypass that hold.
No production promotion, schema migration or data changes performed.

## Remaining
- Complete application attachment-route and browser end-to-end acceptance against isolated Supabase; reviewed Storage HTTP and build are now passed.
- Validate relevant production defaults, constraints, policies and mixed-version compatibility comprehensively.
- Review migration executor, backups/forward repair and obtain release-order exception if applicable.
