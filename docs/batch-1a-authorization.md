# Batch 1A: Authorization and RLS Foundation

Date: 2026-08-31. Status: BATCH 1A COMPLETE under approved acceptance criteria.

Final signed owner CRUD, Storage API enforcement, exact cleanup, harness removal,
public regression and post-removal project checks passed. Current evidence and
approved limitations are in `batch-1a-acceptance-2026-08-31.md`, which supersedes
the historical pending checks below. Database foundation is live; application
code is ready for deployment review. Production deployment was NOT performed
or authorized. Batch 1B was not started. Managed Storage repair stays UNAPPLIED.

The user approved os.tadthepforwork@gmail.com as the existing owner. The second
email, tadthepsukthum@gmail.com, is for future use and has no Auth account; it was
not created or enrolled. Exactly one active owner membership now exists.
Membership and enforcement migrations were applied, without overwriting history.
Business test fixtures were fully rolled back; no existing business rows changed.
Application changes have NOT been deployed. See batch-1a-execution-2026-08-31.md
for evidence, signed-session verification blockers, and managed storage grants
that could not be revoked by the current database role.

## Pre-implementation checkpoint

A. Apply membership schema, bootstrap the approved owner, verify access, then
apply restrictive policies. Each stage must be atomic.

B. Create `public.admin_users` and `private.is_admin()`. Membership permits only
`owner` and `admin`; authorization requires `active = true`. The helper is SQL,
STABLE, SECURITY INVOKER, with an empty search_path and qualified references.
The membership SELECT policy checks only `auth.uid()`, never the helper, avoiding
recursive RLS. Client accounts can read only their own membership, not mutate it.
Owners do not get client-side membership management in this batch.

C. Replace broad authenticated policies on the six ERP tables, posts, CMS
settings, AI crawler reads, and cms-media object writes. Stage 2 fails on
unexpected additional policies rather than silently leaving permissive access.

D. ERP/posts/CMS grants become authenticated CRUD, with no TRUNCATE, REFERENCES,
or TRIGGER. Anonymous/public ERP privileges are revoked. Restore public SELECT
on posts/CMS separately. Remove non-read/non-insert AI privileges. Storage keeps
existing CRUD grants for API compatibility but loses client TRUNCATE, REFERENCES,
and TRIGGER. RLS limits cms-media operations to active admins. Membership grants
are authenticated SELECT and service_role CRUD, no anonymous access. No client
can create objects in the private schema; only authenticated can execute helper.

E. Bootstrap only the explicitly approved existing auth UUID. If approval is by
email, resolve it to exactly one auth UUID and verify it against that approval.
Never pick the first auth user or use company contact details as authorization.
Bootstrap rejects deleted, banned, anonymous, or missing/email-less accounts.

F. Keep a trusted SQL administration session available. Confirm owner can sign
in and that their authenticated session sees their active owner membership before
Stage 2. Stage 2 rechecks the exact UUID before any policy change. Do not deploy
if bootstrap, RLS verification, or owner access fails.

G. Published posts and public CMS settings retain SELECT for anon and
authenticated users. Draft posts remain admin-only. Quote policies/grants, the
quote API, quote-attachments, public cms-media bucket configuration/URLs, and
bounded public AI telemetry INSERT policy remain unchanged. Adding authenticated
public reads prevents an ordinary signed-in visitor losing public content access.
AI citation/referral tables are absent in this database; do not create them here.

H. Any failing migration transaction must roll back in full. After enforcement,
prefer trusted-SQL membership repair over restoring broad authenticated access.
Keep the previous app release available. Never solve lockout by disabling RLS,
granting everyone admin, exposing a service key, or deleting business data.

## Application order

These files follow the repository's existing manually named SQL convention.
They are not automatically applied by `supabase db push`. Use the migration
tool with distinct new migration names, or a trusted transaction-capable SQL
runner. Do not overwrite, repair, reset, or replay existing migration history.
The files intentionally do not contain BEGIN/COMMIT because the migration runner
must wrap the entire stage atomically. With a SQL editor, explicitly wrap each
stage in BEGIN/COMMIT and stop/ROLLBACK on any error; never execute line by line.

1. Reconfirm project `qlxxqrpsyjdsiyjnabjb`, current policies/grants, and that
   `admin_users`/helper do not already exist. Review any other private schema
   consumers before applying schema ACL changes. Retain a policy/grant snapshot.
2. Apply `supabase/batch-1a-admin-membership.sql` in one transaction. It depends
   on the inspected existing `public.update_updated_at()` trigger function.
3. Resolve the explicitly approved owner. Begin a new transaction, set
   `app.batch_1a_owner_id` with `set_config(..., true)` to that exact UUID, then
   execute `supabase/batch-1a-bootstrap-owner.sql` and commit only on success.
   The setting is transaction-local, not a persistent application configuration.
4. Verify that only the approved membership was created, role=owner, active=true.
   Confirm real owner sign-in and own-row membership SELECT. In a separate
   trusted transaction, set authenticated role and JWT claims for that owner
   and check `private.is_admin()` is true. Roll back this verification session.
   Role simulation supplements but does not replace testing a real owner JWT.
5. Begin another atomic transaction, set the same owner setting, execute
   `supabase/batch-1a-enforce-admin-rls.sql`, then commit only on success.
6. Run the live matrix below, configure the app's public Supabase URL/key and
   existing server secrets through approved secret management, build and deploy.
   Verify owner access again. Do not put privileged keys in NEXT_PUBLIC variables.

There are no executable placeholder UUIDs and no automatic account creation.
Stage 1 by itself does not restrict existing business policies. Complete the
controlled sequence promptly once owner verification is available.

## Forward repair

If membership is accidentally deactivated, use trusted Supabase SQL administration
to inspect only the explicitly approved UUID and its auth account. In a
transaction, update only that UUID's membership to the approved role/active state,
check exactly one affected row, verify, and commit. Missing membership requires
an explicitly approved insert using that auth account's email. Do not unban or
recreate an auth account implicitly. Client-side owners cannot self-repair.

For policy errors, compare against the captured policy/grant snapshot, prepare
a targeted repair migration, and retest. Do not rerun older baseline SQL files
that install `authenticated full access`. Do not drop membership while policies
depend on it. A previous app release still needs to work under restrictive RLS;
rolling back app code alone does not restore broad database access.

## Verification status

PASS: `npm run typecheck` (rerun after database enforcement).
PASS: `npm run test:unit`, 20 tests, including existing 5 tests, 7 new helper
tests and the new HTTP-boundary test with 7 subtests.
PASS: targeted ESLint on all changed TypeScript/TSX files and tests.
FAIL: `npm run lint`, 1 error and 172 warnings. The error is the existing
`react-hooks/purity` Date.now diagnostic at `src/app/admin/page.tsx:8493`.
That file was not edited, as explicitly excluded from this batch.
PASS: `npm run build`, all 49 static pages generated. The previous configuration
blocker was resolved using the connected project's real public URL/anon key in
ignored .env.local. No service-role key or notification credentials were fetched.

The boundary tests use actual NextRequest/NextResponse, proxy, login/session
handlers, and the installed Supabase SSR client with mocked upstream fetch.
They do not contact Supabase, issue valid tokens, render a browser, or execute SQL.
They verify anonymous redirect/401, non-admin403, active owner/admin200, inactive
admin403, login redirect behavior, generic503 on membership failure, and refreshed
cookies on session/denial responses. Helper tests also reject metadata promotion,
unknown roles/mismatched IDs and recheck revocation on each request.

Live SQL authorization tests now pass using real Auth UUIDs with transaction-local
role/claims. All test fixtures, including an owner deactivation, were rolled back;
owner active state was verified afterward. Anonymous signed-key REST checks pass
for ERP denial, CMS write denial, public posts and settings. Local anonymous admin
route/API checks pass. Production homepage/blog/article rendering was verified.
Quote SQL insert passes with rollback; local/production HTTP validation passes
without notifications. Authenticated REST/UI checks still require real sessions.
Managed storage grants remain unresolved; see the execution report.

## Required live acceptance matrix (pending)

Use separate real sessions on a staging clone with approved fixture accounts and
test rows. Do not modify existing production business records to test writes.
Do not log tokens, row contents, or keys. For RLS SELECT denial an empty result
can be correct; require zero protected rows, not necessarily HTTP403. UPDATE or
DELETE may likewise return zero affected rows. Verify unchanged fixture state.

| Identity | /admin | Admin APIs | Direct ERP | CMS writes | cms-media writes |
| --- | --- | --- | --- | --- | --- |
| Anonymous | login/denied | 401 (missing login payload400) | denied | denied | denied |
| Authenticated non-admin | 403 | 403 | no protected rows/changes | denied | denied |
| Active owner | allowed | allowed | required CRUD | allowed | allowed |
| Active admin | allowed | allowed | required CRUD | allowed | allowed |
| Inactive admin | 403 | 403 | no protected rows/changes | denied | denied |

For every identity, test six ERP tables, draft visibility, CMS settings updates,
AI crawler reads, and membership insert/update/activate/role-change attempts.
Even active owner/admin must be denied all direct membership mutations and
another user's membership reads. Verify there are no remaining broad policies
or inherited grants that permit TRUNCATE. Check all four marketing endpoints,
both login credential modes, session refresh, existing cookies after revocation,
and direct Data API requests that bypass Next.js entirely.

Verify anonymous and non-admin published blog reads, required public CMS settings,
real home/blog/portfolio rendering and public media. Submit a valid quote only
in an approved test environment; confirm current validation/storage behavior is
unchanged. Inspect production browser bundles/network to confirm no service-role
credentials. Current source changes use only public/session clients; no privileged
credentials were introduced, but a live browser/bundle check is still pending.

## Changed files

- src/lib/admin-authorization.ts (new)
- src/lib/admin-auth.ts
- src/proxy.ts
- src/app/admin/layout.tsx
- src/app/api/admin/login/route.ts
- src/app/api/admin/session/route.ts
- src/app/api/marketing/ga4/route.ts
- src/app/api/marketing/meta/route.ts
- src/app/api/marketing/ai-crawlers/route.ts
- src/app/api/marketing/ai-citations/route.ts
- tests/admin-authorization.test.ts (new)
- tests/admin-boundaries.test.ts (new)
- tests/batch-1a-rls.sql (new, rollback-only SQL verification)
- scripts/verify-batch-1a-public.mjs (new, anonymous API verification)
- supabase/batch-1a-admin-membership.sql (new)
- supabase/batch-1a-bootstrap-owner.sql (new)
- supabase/batch-1a-enforce-admin-rls.sql (new)
- supabase/batch-1a-storage-grants-repair.sql (new, pending authorized operator)
- .env.local (ignored; public URL/key only, never committed)
- docs/batch-1a-execution-2026-08-31.md (execution evidence)
- docs/batch-1a-authorization.md (this file)

`npm ci --ignore-scripts` restored existing lockfile dependencies; no new package
or version upgrade was added. Install reported one high-severity advisory, not
remediated in this scoped batch. The workspace has no Git metadata, so no Git
diff/commit or baseline comparison is available. Build/typecheck created ignored
local artifacts; the previously authored broad audit was not modified.

## Deferred

Service-role client refactor, revalidate security redesign, RichEditor/JSON-LD
XSS fixes, and all other explicitly excluded business/schema/UI changes are
untouched. This implementation is not a claim that those risks are resolved.
No work on Batch 1B or subsequent batches was started.

## References consulted

- Installed Next.js 16.3 docs: proxy, authentication, route handlers and cookies.
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
