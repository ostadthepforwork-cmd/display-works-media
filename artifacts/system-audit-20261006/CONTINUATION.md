# Admin QA Continuation - 2026-10-06

## Application Changes (Local, Not Deployed)

- Paired foreground/background rules for inverse expense surfaces, CMS SEO/publish panels and selected Marketing controls. Explicit WebKit text-fill rules prevent older theme overrides from hiding text.
- Increased targeted 8-11px admin captions to 12px, small tokens to 12/13px and dashboard body text to 14px. This does not certify every text node or every interaction state.
- Restored readable customer names and customer segment badges.
- Added CMS tab pressed-state semantics and fixed the publish checkbox being expanded by generic input styles. Native checkbox dimensions remain 18x18px.

## Verified This Continuation

| Check | Environment | Result |
| --- | --- | --- |
| Expense form, CMS SEO/publish, selected Ads controls | Synthetic browser, 1440px/390px | Passed; no horizontal page overflow, no uncaught errors; sampled text contrast 15.2-17.3:1; Escape closes dialogs |
| Five CSV datasets and JSON backup | Synthetic browser, 320/768/1280px | Actual files downloaded; backup checksum verified; keyboard selection and failed-export recovery passed |
| Quote/bill/invoice/receipt PDF | Actual renderer with synthetic data | Eight PDFs: four single-page and four four-page A4 files; 75-item documents retain their final item |
| Internal cost protection | Synthetic HTML/PDF and public query allowlist | Planted private sentinels absent; public queries request neither wildcard nor cost/profit/supplier fields |
| Signed production ERP/CMS/MKT navigation | Production, existing user session | Authenticated; expense data and article list loaded; new forms opened and closed without saving |
| Meta/GA4 source health | Production, read-only UI | Connected Meta account/campaign/adset/ad data and GA4 sessions displayed after requests completed; initial loading zeros are not final evidence |
| Recovery request | Real authorized test mailbox | Supabase accepted one request, HTTP 200; user reports that the link reaches localhost and fails. Recovery is BLOCKED; successful password reset is NOT verified |
| Application validation | Local | 138 tests passed; lint zero errors with existing warnings; typecheck and production build passed |

## Still Required Before Full Acceptance

1. Deploy this local readability patch, then repeat signed desktop/mobile checks on that exact release. No Git push or deployment was performed in this continuation.
2. Complete signed create/edit/delete/upload/download workflows using explicitly disposable fixtures. Opening a form is not a CRUD pass. Original business records were not modified.
3. Verify production backup delivery, native document sharing/print dialogs, revocation/expiry, attachments and historic free-text content. Synthetic PDF evidence does not certify every stored document; unlabelled secrets cannot be reliably inferred from prose.
4. Complete Messenger lead qualification -> quote -> won -> approved ERP receipt, and real ad-referral attribution. Meta/GA4 source connectivity alone does not prove conversion attribution.
5. Fix recovery redirect configuration first. User reports localhost connection refusal from the email link. Supabase URL Configuration inspection reached its sign-in screen: no dashboard session is available. Inspect Site URL, exact callback allowlist and recovery email template; a 200 response only means the recovery request was accepted. After repair, repeat the actual browser recovery flow and let the user enter/submit their own password. Existing admin session was preserved; browser-close persistence remains unverified.
6. Run concurrent HTTP quota acceptance with authorized server-side execution. The local production configuration has no usable service-role key; do not infer the production key is absent and do not widen its permissions. Prior SQL atomicity tests are separate evidence.
7. Expand accessibility coverage to remaining controls/states, keyboard focus, zoom and screen readers. Sample contrast checks are not an all-pages accessibility certification.

## Reproducible Tests

- `tests/admin-readability-ui-check.cjs`
- `tests/erp-export-ui-check.cjs`
- `tests/public-document-matrix-check.cjs`
- PDF parsing/rendering evidence and screenshots are in ignored `output/playwright/`; do not publish business exports, credentials or customer document files.

Browser plugin was not available for the local fixture workflow; regular Playwright used bundled Microsoft Edge headless. Authenticated production inspection used the existing in-app browser session.
