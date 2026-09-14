# Executive Dashboard Release

Date: 2026-09-11

## Production
- User approved deployment of the three-phase dashboard.
- Deployment: dpl_8Hh7pX5m23pawuYMC1TMFcUrYHrQ
- URL: https://display-works-media-1tv8-q7sqgcu2r-os-projects1.vercel.app
- Promoted successfully. Vercel inspect of displayworksmedia.com resolves to this deployment, Ready.
- Previous deployment: dpl_J3TZF61TyC8zu8RSaa7hYx2crvjd.
- Source copied from the expense-validation worktree to dashboard-three-phase-release-20260911 using an explicit app-file allowlist. No credentials, local output, reports or test fixtures uploaded.
- No SQL migration or production record mutation performed. No Git push performed.

## Checks
- 68 unit tests passed after installing the patched lockfile.
- Vercel production build and TypeScript passed on Next.js 16.3.4.
- npm ci audit: 0 reported vulnerabilities across 449 packages.
- Earlier synthetic browser tests passed five widths, chart rendering, detail dialog Escape, expense navigation/back, activity pagination and sorting.
- After user login, the live dashboard displayed the new comparison controls, five KPIs, charts, product sorting and activity list. Year-to-date receipts 54,389.07, estimated costs 25,334.58, estimated gross 29,054.49; actual operating expenses 0. This is a display smoke check, not a full ledger reconciliation.
- Anonymous session endpoint returned HTTP 401.

## Reporting Boundaries
- VAT-inclusive legacy receipt totals and estimated document costs remain labelled as estimates.
- Actual operating expenses are deducted separately; direct actual costs are not deducted twice.
- Missing budget data is not replaced with fictional values.
- Product identity prefers stable product IDs, with legacy name fallback.
