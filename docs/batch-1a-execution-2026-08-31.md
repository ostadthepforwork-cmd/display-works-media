# Batch 1A execution evidence

Follow-up: see `batch-1a-acceptance-2026-08-31.md` for real signed owner SELECT,
admin UI/API acceptance after fixing local server network access. Signed writes
and Storage API acceptance are still pending; the history below records the
earlier execution stage.

Status: INCOMPLETE. Database foundation and business RLS are live. Application
code is local, not deployed. Signed owner/non-admin sessions and managed storage
grant repair remain required. No Batch 1B work was started.

## Owner decision and bootstrap

The user explicitly designated both emails, then clarified that
`tadthepsukthum@gmail.com` is for future use. It has zero matching Auth accounts,
and was neither created nor enrolled. `os.tadthepforwork@gmail.com` matched exactly
one non-deleted, non-anonymous, non-banned, email-confirmed Auth account:
`6171de5d-eba4-4d3b-a6a5-e5bb195bb823`.

Exactly one membership exists: that UUID, role `owner`, active `true`.
Bootstrap resolved the UUID from the exact approved email again inside the
transaction, asserted exactly one match, set `app.batch_1a_owner_id` locally,
and executed the reviewed idempotent bootstrap file. No tokens, passwords, or
privileged keys were retrieved. No production test users were created.

## Applied changes

- `20260831082942_batch_1a_admin_membership`: new membership table, role constraint,
  active flag/timestamps, own-row SELECT policy, trigger, private invoker helper,
  restricted table/function grants.
- Owner bootstrap: separate committed data transaction, not a schema migration.
- `20260831083119_batch_1a_enforce_admin_rls`: all six ERP tables, posts/CMS writes,
  AI crawler reads and four cms-media policies now require active membership.
  Published posts/public CMS SELECT remain separate. No broad ALL/UPDATE/DELETE
  policies remain on the scoped protected tables.
- ERP/posts/CMS/AI client grants were reduced as planned. Quote policies/grants,
  public bucket settings and quote-attachments were unchanged.
- Existing migration history was not overwritten. The applied SQL files have
  not been rewritten to hide the storage grant limitation discovered afterward.

## Managed storage grant limitation

The enforcement migration's storage REVOKE returned successfully through the
migration tool, but effective-privilege verification showed no change to six
managed grants: TRUNCATE, REFERENCES and TRIGGER for anon and authenticated on
`storage.objects`. Their grantor/owner is `supabase_storage_admin`; the executing
role is `postgres`, which is not a member of that managed role. RLS CRUD policies
were changed successfully; the extra grants were not revoked.

This is NOT a claim that anonymous users can issue TRUNCATE through the normal
REST/Storage API. It is a remaining SQL privilege that RLS cannot constrain.
Do not claim all grant-hardening checks passed.

`supabase/batch-1a-storage-grants-repair.sql` is prepared but NOT applied. It must
be run by a Supabase-authorized storage-owner/platform operator, and asserts
effective privileges after REVOKE. Do not change managed table ownership,
grant reserved-role membership, or disable RLS as a workaround. Supabase support
is the escalation path for confirming/remediating these managed grants.

Relevant primary documentation:
- https://supabase.com/docs/guides/platform/permissions
- https://supabase.com/docs/guides/database/postgres/roles-superuser

## Pre-enforcement and recovery checks

Before enforcement, and again afterward, trusted SQL role/claim simulation
verified: exact owner membership/UUID/role/active; owner `is_admin()=true`;
an existing non-admin Auth UUID `is_admin()=false`; anonymous helper execution
denied; client membership mutation grants absent; own-row membership RLS works
without recursion. These tests did not mint signed tokens or authenticate HTTP.

Recovery was partly exercised safely: the SQL test temporarily deactivated the
owner within an uncommitted subtransaction, verified denial, and rolled back.
Owner role/active and fixture absence were checked afterward. No other session
could see that temporary deactivation. Trusted SQL access remains available.
End-to-end owner login/recovery is still unverified. Use targeted trusted SQL
membership repair if needed, never restore broad authenticated access.

## SQL authorization tests

`tests/batch-1a-rls.sql` executed against the actual database. It uses real owner
and existing non-admin Auth UUIDs with SET LOCAL ROLE and transaction-local
claims. All business fixtures and temporary owner state changes are inside a
subtransaction that raises/catches a dedicated rollback exception on success.
Assertion failure aborts the transaction instead. No existing customers,
products, documents, posts, or quotes were rewritten/deleted; no numbering or
sequences were changed; no email/LINE notification was sent.

PASS:
- Owner INSERT/SELECT/UPDATE on fixture rows in all six ERP tables.
- Owner INSERT/UPDATE on posts and CMS settings, including a published fixture.
- Anonymous and non-admin ERP reads/inserts denied on all six tables.
- Anonymous and non-admin CMS inserts denied; drafts not exposed.
- Non-admin membership insert, role escalation and activation denied.
- Non-admin AI crawler reads denied.
- Inactive membership helper, ERP reads and ERP insert denied.
- Anonymous/non-admin published posts and public settings readable.
- Anonymous valid quote INSERT accepted, then rolled back with all fixtures.
- Final owner is active and test fixtures do not persist.

Not tested here: signed REST authentication, actual admin-role session (none
enrolled), DELETE workflow, or Storage API upload/upsert/delete.

## Direct HTTP and application checks

`node --env-file=.env.local scripts/verify-batch-1a-public.mjs` PASS:
- Anonymous real Data API GET and PATCH: HTTP401 on all six ERP tables.
- Anonymous CMS posts/settings PATCH: HTTP401; membership SELECT: HTTP401.
- Public posts SELECT: HTTP200, 11 rows, all published; settings: HTTP200, 3 keys.
- PATCH probes target nonexistent sentinel identifiers, changing no row.
- Local admin session and four protected marketing APIs: HTTP401.
- Local and production `/api/quote`: invalid empty payload gives HTTP400 before
  writes/notifications. This verifies endpoint reachability and validation, not
  attachment upload or full notification delivery.
- Local browser `/admin` redirects to `/login`.

BLOCKED: signed owner/non-admin REST and authenticated UI/API checks. The user
was asked to log in locally; no password/token was requested in chat, no browser
session store was inspected, and no synthetic JWT was presented as a real test.

## Public browser regression

- Production homepage rendered meaningful content after enforcement.
- Production blog listing rendered published content.
- Production DB-backed `/blog/pp-vs-pvc-sticker-guide` rendered its heading,
  article content, summary and table. Visible blog assets were loaded.
- Local homepage rendered, screenshot inspected, no browser console errors.
- Public content APIs and quote checks are documented separately above; none
  grants anonymous access to protected ERP rows.
- Public shared-document behavior was not redesigned or comprehensively audited
  in this batch. Do not interpret the ERP Data API check as proof that every
  pre-existing server-side public sharing route is secure.

## Project checks and local configuration

- `npm run typecheck`: PASS, rerun.
- `npm run test:unit`: PASS, 20 tests, rerun. Includes mocked-upstream authorization
  matrix; do not substitute it for the pending signed-session acceptance tests.
- `npm run lint`: PRE-EXISTING FAILURE, same one admin/page.tsx purity error and
  172 warnings; no unrelated lint code was changed.
- `npm run build`: PASS, compilation/type checks and all 49 static pages.
- `.env.local`: ignored, real project public URL/anon key only; no service-role
  or notification secrets. No dummy environment used for the build.
- Built `.next/static` scan found no SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_SERVICE_KEY or sb_secret_ markers. No privileged value was available
  in the build environment. Production deployment/network secret review remains
  separate from this local bundle check.
- Local server: http://127.0.0.1:3000 (for owner sign-in and continued acceptance).

## Remaining work before COMPLETE

1. Real owner and authorized non-admin session verification against the Data API
   and local UI/API; exercise safe write fixtures in an approved test environment.
2. Resolve/explicitly review the managed storage grant limitation with a supported
   platform operator; verify storage write denial/allowance with real sessions.
3. Finish authenticated acceptance before deploying the local authorization code.
4. Do not start Batch 1B until Batch 1A acceptance and explicit approval.
