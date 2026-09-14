# ERP Dashboard Phase 1 - Local Implementation

Date: 2026-09-10
Status: implemented locally, awaiting phase acceptance. Not deployed or pushed.

## Delivered
- Common Bangkok calendar range with URL persistence and period-preserving drill-down.
- Five clearly labelled estimated KPIs; actual operating expenses deducted separately.
- Pending quote, overdue invoice and uncertain-cost document review lists.
- Period-scoped trend, financial structure, actual expense categories, products,
  document counts and recent document lists.
- Complete paginated source reads with row-count/duplicate/partial-read checks.
- Expense drill-down includes archived, non-void rows, matching the report scope.
- Responsive layout and read-only detail dialogs. Errors do not become false zeros.

## Financial Boundary
- Legacy VAT-inclusive receipt eligibility and cost fallback remain unchanged.
- This is estimated reporting, not net profit, cash flow or approved accounting.
- Actual direct costs are displayed separately, never subtracted again from estimates.
- Zero/missing historical snapshots are still uncertain under the legacy cost fallback.
- Product figures remain line-based before document discounts and grouped by name.
- Paginated reads are not a transaction snapshot; equal-count concurrent edits can
  still change between pages. Large datasets may exceed existing loader timeouts.

## Verification
- 62 unit tests passed.
- TypeScript passed; scoped lint for new dashboard/model/tests passed.
- Optimized Next.js build passed using loopback synthetic Supabase configuration.
- Playwright passed 320/375/414/768/1280 widths, no horizontal page overflow,
  dialog open/close, fixture expense navigation/back, URL range reload and error state.
- Desktop and mobile screenshots visually inspected under output/playwright/executive.
- Browser data was mocked. This does not verify production RLS, live totals, or the
  entire authenticated parent admin navigation. No production records were written.

## Remaining
- Owner acceptance and live read-only reconciliation before release approval.
- Phase 2: period comparisons, automatic chart aggregation, category percentages,
  product sorting and richer analytical sections.
- Phase 3: complete operator journeys, exact-record drill-down, accessibility polish.
- Explicit approval remains required for publication/deployment. No schema changes.

## Preview
Run node tests/executive-preview-server.cjs from this worktree. It binds loopback
on an available port and prints its URL. All records are synthetic; writes are denied.
