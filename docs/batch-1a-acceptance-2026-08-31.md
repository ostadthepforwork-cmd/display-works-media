# Batch 1A signed acceptance

Status: COMPLETE under the user's approved Batch 1A acceptance criteria.
No production deployment and no Batch 1B work. No live RLS, migration, managed
grant, account, or business-logic changes were made during final acceptance.

## Final signed acceptance

The user completed interactive local login. The existing browser SDK verified
os.tadthepforwork@gmail.com and its active owner membership before any writes.
No passwords, tokens, cookies, browser storage credentials, privileged keys, or
business row contents were extracted or included in acceptance output.

- Admin UI: PASS; /admin rendered ERP/CMS controls without the login form.
- Signed admin session and four marketing endpoints: PASS, HTTP 200. Missing
  GA4/Meta/AI citations integration configuration is not an authorization failure.
- Signed direct REST SELECT on all six ERP tables: PASS, HTTP 200.
- One temporary customer INSERT, separate SELECT after UPDATE, UPDATE and DELETE:
  PASS. No documents, numbering, notifications, or existing masters were changed.
- One never-published draft post INSERT/UPDATE/DELETE: PASS.
- One isolated CMS settings key INSERT/UPDATE/DELETE: PASS.
- Membership INSERT, role promotion and activation against a nonexistent fixture
  UUID/email: PASS, all HTTP 403 with SQLSTATE 42501. Real owner unchanged.
- Membership management contract: no direct browser/Data API membership writes,
  including by owners. Use trusted database administration or a separately
  reviewed future server administration flow; the latter is outside this batch.

## Final Storage API acceptance

All mutations used the normal browser Storage SDK with tiny generated 2x2 PNGs.
No SQL storage mutation, ownership change, role change or grant repair occurred.

- Owner upload: PASS.
- Anonymous upload/update/upsert: PASS, API denial (StorageApiError).
- Anonymous delete: PASS, denied/no affected object. Download afterward verified
  exact original bytes, proving the fixture was not changed or deleted.
- Public PNG retrieval: PASS, exact bytes without a signed URL or credentials.
- Owner update: PASS, changed bytes verified through public retrieval.
- Owner upsert: PASS.
- Owner delete: PASS, exactly one fixture removed.
- Final cleanup: PASS through the signed SDK and an independent exact-ID/path
  read-only database count. The latter inspected metadata only, not SQL CRUD.

## Exact cleanup evidence

Fixture UUID: `4ce42c5a-e6ee-401e-9651-e6fc1aca0275`.
Post ID/slug and setting key:
`batch-1a-acceptance-4ce42c5a-e6ee-401e-9651-e6fc1aca0275`.
Storage bucket: `cms-media`; exact paths:
- `batch-1a-acceptance/4ce42c5a-e6ee-401e-9651-e6fc1aca0275.png`
- `batch-1a-acceptance/4ce42c5a-e6ee-401e-9651-e6fc1aca0275-anon.png`

Independent counts after cleanup: customer=0, post=0, setting=0, storage=0,
fixture membership=0. Approved real owner still owner/active=true.
Cleanup used exact IDs/paths; customer deletion also checked exact fixture names.

## Final project checks and cleanup

- Removed `src/app/qa/batch-1a/page.tsx` and `AcceptanceClient.tsx` after proving
  their only dependency was within the temporary route. Reusable tests retained.
- Removed route returns HTTP 404; absent from production app-paths manifest.
  The unrelated existing `/qa` route is untouched.
- Build: PASS, all 49 static pages generated; no Batch 1A QA route in output.
- Typecheck: PASS after build regenerated route types. The initial post-deletion
  check failed only because generated `.next/types/validator.ts` referenced the
  removed page. No tsconfig workaround or application change was used.
- Unit tests: PASS, 20/20.
- Scoped lint: PASS on all Batch 1A authorization source files and unit tests.
- Global lint: PRE-EXISTING FAILURE, recorded baseline 1 error / 172 warnings;
  not rerun or repaired. Existing admin/page.tsx Date.now purity error excluded.
- Browser bundle: no service-role key variable markers, sb_secret_ markers, or
  embedded JWTs with role=service_role. Public keys were not printed.
- Final public script: PASS; anonymous ERP reads/writes and membership reads
  denied (401); CMS writes denied (401); published posts/settings still public.
  Local protected APIs return 401 without login. Local/production empty quote
  validation returns 400 without notifications. The script's signed-identity
  NOT TESTED line describes that anonymous script only; signed evidence is above.
- Earlier browser homepage/blog/article regression remains valid. No public
  rendering logic or RLS changed during final acceptance.

## Accepted limitations and deployment readiness

- Signed non-admin: BLOCKED - NO APPROVED SIGNED NON-ADMIN IDENTITY.
- Signed active-admin: NOT TESTED - NO APPROVED SIGNED ACTIVE-ADMIN IDENTITY.
  No account was created. Prior SQL/RLS simulation and unit tests are supporting,
  not real-session, evidence for these identities and inactive membership.
- Storage TRUNCATE/REFERENCES/TRIGGER grants: PLATFORM-MANAGED RESIDUAL PRIVILEGE.
  Not fully remediated and not a proven normal-browser exploit. No application
  SQL-execution RPC or normal REST/Storage arbitrary-SQL route was found in prior
  inspection. Actual Storage API enforcement now passes. Platform review remains
  required; `supabase/batch-1a-storage-grants-repair.sql` stays UNAPPLIED.
- Existing lint and deferred broader audit findings remain outside this batch.
- Database membership/bootstrap/business RLS foundation: LIVE.
- Batch 1A application code ready for production deployment review: YES.
- Production application deployment: NOT PERFORMED; NOT AUTHORIZED.
- Batch 1B: NOT STARTED; requires separate approval.

These limitations explicitly do not block completion under the user's approved
criteria; COMPLETE does not mean all broader audit findings are resolved.

## Recovery

Use the forward-repair procedure in `batch-1a-authorization.md`: trusted database
administration, inspect the exact approved Auth UUID and membership, repair only
that membership in a transaction, assert one row, verify access before commit.
Policy fixes require targeted reviewed migrations. Keep the prior application
release available; app rollback does not undo restrictive RLS. Never disable
RLS, restore broad authenticated access, expose a service key, or drop membership
dependencies to resolve lockout. Managed Storage grant repair needs its authorized
platform owner/operator and remains unapplied. No recovery action was executed.

---

## Historical checkpoints (superseded)

All remaining sections below are earlier checkpoints retained for chronology.
Their pending/blocked/harness-present statements are superseded by the final
results above and are not the current Batch 1A status.

## Latest continuation: write approval received, session unavailable

The user explicitly approved the isolated fixture writes and cleanup. Action
approval is no longer the blocker. Before writes, the normal SDK owner check
returned "Approved owner session required" and `/admin` redirected to `/login`.
No credentials or browser storage were inspected, and no network error appeared
in the current server error log. The user was asked to complete normal interactive
login again; no password/token was requested in chat.

No write control was activated and no new fixture ID/row/object was created in
this continuation. The historical signed-owner PASS evidence below remains
historical evidence, not proof of a currently usable session.

The temporary harness was tightened before the approved tests:
- Membership negative tests target a fresh nonexistent fixture UUID/email,
  never the real owner membership.
- ERP verification includes a separate SELECT after UPDATE.
- ERP cleanup uses exact UUID plus exact allowed fixture names, not a partial
  name-only match.
- Storage checks include anonymous upsert denial, public PNG byte verification,
  owner update byte verification and owner upsert.
- Exact remaining storage filenames are checked after cleanup.

Typecheck and targeted harness lint pass after these changes. Dependency search
found only the QA page importing its client component; no production component
depends on the harness. It has NOT been removed because signed write/storage
acceptance is still pending. Final post-removal unit/build checks are not yet run.
No live RLS/migration/grant/business-logic change or production deployment occurred.

## Runtime connectivity and signed owner

The existing interactive owner login had reached the browser but the local
`/api/admin/login` handler returned `fetch failed`. Server logs identified EACCES
on outbound Supabase requests. The task-owned dev server PID was checked and
restarted outside the network-restricted sandbox, still listening only on
127.0.0.1:3000. No credentials were requested, copied, printed, or extracted.

Using the existing signed browser session after that restart:
- `/admin` returned HTTP200 and rendered real dashboard data; no browser errors.
- The Supabase browser SDK's `auth.getUser()` verified the approved account
  os.tadthepforwork@gmail.com, and own-row membership SELECT returned owner/active.
- Direct signed Data API SELECT on each of the six ERP tables returned HTTP200.
- `/api/admin/session` returned HTTP200 with authenticated=true, authorized=true.
- All four protected marketing APIs returned HTTP200 after their authorization
  guards. GA4/Meta and AI citations report missing integration configuration;
  this is authorization acceptance, not a claim their external integrations work.

These are REAL signed-session checks, not SET ROLE or mocked upstream. The
temporary page uses the existing Supabase browser-client singleton. It never
reads or prints access_token, refresh_token, cookies, or browser storage itself.
Results contain status codes and assertions only, not returned business rows.

## Temporary acceptance harness

Local route: `/qa/batch-1a`. Files:
- `src/app/qa/batch-1a/page.tsx`: returns notFound outside development.
- `src/app/qa/batch-1a/AcceptanceClient.tsx`: read and isolated-write controls.

The read button completed successfully. The write button has NOT been activated.
Action-time confirmation was requested for browser-driven fixture writes and
cleanup, including Storage operations and expected-denied membership mutations.
Pending fixtures are limited to UUID/prefix-scoped customer, draft post, public
setting and tiny generated PNG objects; cleanup checks exact owned identifiers.
Existing business rows are never test targets. No notifications are involved.
Remove the temporary harness after acceptance before assembling deployment.

## Signed identities still missing

- Non-admin: BLOCKED - NO APPROVED NON-ADMIN SIGNED TEST IDENTITY. No existing
  unrelated account was assumed to be approved, and no production user created.
- Active admin: BLOCKED / NOT TESTED - NO APPROVED ACTIVE ADMIN ACCOUNT.
- Inactive signed session and interactive logout/re-login: not exercised; the
  earlier inactive-membership SQL rollback test remains separate evidence.

## Storage platform limitation

Read-only inspection reconfirmed that cms-media CRUD policies require active
membership and that TRUNCATE/REFERENCES/TRIGGER grants for anon/authenticated
are still issued by supabase_storage_admin. Current postgres is not a member of
that managed role. Repair SQL remains UNAPPLIED; ownership and RLS are unchanged.

The normal table REST API documents row-resource HTTP methods, not arbitrary
TRUNCATE/REFERENCES/CREATE TRIGGER SQL. Storage exposes object operations, not a
general SQL execution endpoint. Inspected application functions are only the
public update_updated_at trigger function and private is_admin boolean helper;
no application SQL-execution RPC was found in those schemas. The authenticator
role did not provide an explicit exposed-schema setting in the inspected catalog.
An additional direct schema-exposure probe produced no usable result and is not
claimed as PASS. No destructive SQL was attempted to test reachability.

Classification: PLATFORM-MANAGED RESIDUAL PRIVILEGE, NOT A PROVEN BROWSER EXPLOIT;
requires Supabase/platform operator review. RLS-based actual Storage upload,
update and delete acceptance remains pending write-test confirmation. Do not
mark storage grant hardening, or Storage acceptance, as passed yet.

Primary references:
- https://docs.postgrest.org/en/v14/references/api/tables_views.html
- https://supabase.com/docs/guides/storage/security/access-control
- https://supabase.github.io/storage/

## Checks and remaining work

- Typecheck after temporary harness: PASS.
- Targeted ESLint for both harness files: PASS.
- Existing unit baseline: PASS 20; production authorization code was not changed.
- Existing global lint baseline: one pre-existing error and 172 warnings, unchanged.
- Build after harness: PASS, compilation/type checks and all 49 static pages.
- Built browser bundle scan: no SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SERVICE_KEY
  or sb_secret_ markers. No privileged keys were fetched or present in the local
  build environment. The harness is development-gated in source; a production
  runtime request to that temporary route was not separately tested.

Public homepage/blog/DB-backed article/settings/quote evidence from the prior
execution report remains valid; no public logic or database policies changed in
this acceptance step. Deployment is not authorized and was not performed.

Completion still requires the real signed owner write/cleanup checks and real
Storage API enforcement checks. The user now explicitly allows the lack of an
approved non-admin/admin identity and managed grants to remain documented
limitations when the other mandatory acceptance criteria are satisfied.
