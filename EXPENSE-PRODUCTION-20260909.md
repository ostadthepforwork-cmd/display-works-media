# Expense production release

## Status
DEPLOYED. Owner-authenticated production acceptance remains pending.

The user explicitly requested migration and production deployment after declining
backup. No backup was created; database recovery was not verified or marked passed.
No paid resource was enabled. No synthetic production expense was created.

## Immutable release
- Source: 2af3d8b; application and candidate.sql unchanged from tested 59d0d6b.
- Isolated branch: ci/expense-environment-20260908.
- Previous deployment: dpl_Cfn3c4y9C5zrFHcLT1QLEJNzdShm.
- New deployment: dpl_HHMZXnF41u7aKWkU5ssSrKmrhdVh.
- URL: https://displayworksmedia.com
- Migration: 20260909103548_expense_management_validated_release.
- Applied only tests/expense-isolated/candidate.sql; never dependency fixtures.
- No Batch 2 transaction/numbering changes or other batches included.

## Checks performed
- Vercel production-environment build passed before custom-domain promotion.
- Supabase apply_migration returned success; migration history confirmed.
- All six expense tables owned by postgres with RLS enabled and anonymous SELECT denied.
- Direct authenticated expense/history/counter writes denied; category writes use admin RLS.
- Both RPCs have empty search_path, anonymous EXECUTE denied and authenticated EXECUTE granted.
- RPC bodies require authenticated active admin; isolated denial tests previously passed.
- Evidence bucket private, 10 MiB limit; active-admin read/upload policies verified.
- Authenticated audit sequence UPDATE privilege denied.
- Domain deployment lookup resolves to the new READY deployment.
- Homepage, blog and one linked article: HTTP 200; article JSON-LD present.
- /qa: 404; anonymous session and attachment endpoints: 401.
- Anonymous admin browser navigation redirects to login.
- Eleven deployed login JavaScript bundles: no privileged-secret markers found.
  This is a scoped deployed-bundle scan, not every lazy-loaded admin bundle.

## Advisor review
Two no-policy INFO findings are intentional internal counter/idempotency tables,
with client privileges revoked. Two authenticated SECURITY DEFINER warnings are
the intended atomic RPC contract with active-admin checks and pinned search_path.
Reference: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
Existing leaked-password-protection warning remains unchanged:
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Remaining verification
The available browser is not logged into the production admin. Owner navigation,
category creation and a legitimate expense save/reload on production are not yet
observed. Equivalent synthetic browser flows passed in the isolated environment.
Do not label this full production acceptance or verification.

## Recovery
Application rollback target is the previous deployment above. Preserve the additive
expense schema and any new business records; do not drop tables or reset counters.
Database restore has no verified recovery point because backup was declined.
