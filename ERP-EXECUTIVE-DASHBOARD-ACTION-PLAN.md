# ERP Dashboard - Executive + Solo Operator

Status: ACTION PLAN READY. Approval required before implementation.
Audit date: 2026-09-10. Code inspection only; no production SQL or mutations.
Scope: the user's attached Executive + Solo Operator master brief.

## Baseline and boundaries

- Last confirmed production deployment: dpl_HbnhM6gHyzCgPpHyewZXfhqqk41j,
  expense balance/category release, source d542746. Not rechecked live in this audit.
- Workspace: display-works-media-expense-validation-20260908.
- Uncommitted UI changes already exist: ExpenseDashboard view/CSS, header ordering,
  date-mode selector and synthetic preview tests. These are NOT production evidence.
- Preserve this work, but do not deploy it as approval for the larger brief.
- This plan changes no source, formula, schema, RLS, RPC or production data.
- Later Batch 2/4/5A source must not be imported wholesale. No paid resources.

## Audit findings

1. HIGH: date scope differs across widgets. Dashboard period revenue/cost/profit
   use selectedRange, while profitMarginAll uses parent all-time totals. Products
   use all reportDocs; document counts, pending alerts and latest records use all
   documents. A period label does not currently guarantee a period calculation.
2. HIGH: cost formulas differ. Parent totalCost sums item cost only; Dashboard
   calcInternalDocumentCost includes items PLUS internalExpenses. Total margin and
   period margin therefore differ in both range and cost definition.
3. HIGH: costSnapshot=0 is not reliably preserved by fallbackItemCost. It uses a
   snapshot only if positive, otherwise shipping price/current catalog/name matching.
   Missing cost can become zero. Historical profit can depend on changed master data.
   This is a separate data-logic issue, not permission to silently apply Batch 2.
4. HIGH: revenue is receipt total including document VAT after discount, not a
   proven accounting revenue or cash collection measure. Receipt draft state is not
   excluded by isReportDoc; only deleted/cancelled are excluded. Partial/derived
   receipts need contract tests; changing recognition requires explicit approval.
5. HIGH: actual balance is receipt total MINUS all non-void expenses including VAT.
   It is not gross or net profit, and does not subtract estimated COGS. Conversely,
   adding all direct expenses to estimated COGS can count the same work twice.
6. MEDIUM: overdue alerts use draft/sent status and add 30 days even to dueDate.
   This is not a dependable unpaid-invoice test and does not honor selected range.
7. MEDIUM: Dashboard state lives in the conditionally mounted Dashboard component.
   Changing page loses it. DocumentPage has search/status but no shared date input;
   ExpensePage owns its own initial empty date filters. setPage alone loses context.
8. MEDIUM: top products group by item name, sum line revenue without allocating
   document discounts/VAT and omit internal document cost. Rankings are estimates,
   not necessarily reconcilable with document-total revenue/profit.
9. MEDIUM: ERP initial reads use select(*) without pagination/count completeness
   checks for documents/items/products. API row limits can silently understate totals.
   ExpenseDashboard already paginates expenses/count-checks and batches category IDs.
   Concurrent updates between pages still need snapshot/completeness consideration.
10. UX: duplicate financial panels, tiny text, all-time labels beside period values,
    parallel date inputs, repeated daily graph/table and nested scrolling obscure the
    business summary. Latest activity rows lack a clear detail action.

## Data-source and formula inventory

| Metric | Source and current rule | Required treatment |
| --- | --- | --- |
| Revenue | erp_documents + erp_document_items; reportingDocuments(receipts); calcDocTotal.total | Preserve baseline, label VAT/recognition basis; approve any change |
| Estimated cost | costSnapshot or product/supplier catalog fallback + internal_expenses in period view | One approved model; missing-cost quality indicator |
| Estimated profit | receipt total - estimated document cost | Never label as verified net profit |
| Margin | period margin and all-time parent margin coexist | Same selected range and same cost basis |
| Actual expenses | erp_expenses.total_amount, expense_date; voided_at=null | Keep archive history, exclude voids, paid/unpaid separate |
| Operating expense | erp_expenses.expense_class=operating | Separate from actual direct costs |
| Breakdown | legacy item/internal cost vs actual category_id/name | Separate estimates and actuals; percentages reconcile |
| Top products | receipt items grouped by name, lineAmount/lineCost | Range scope; stable identity contract and allocation decision |
| Documents | parent docCounts, excludes deleted/cancelled | Period-specific type/status counts |
| Alerts | all documents and selected revenue comparison | Actionable, period-scoped; correct due/payment semantics |
| Latest activity | documents sorted createdAt, first 5 | Period-filtered, meaningful date label, detail navigation |

## Approved-model proposal (requires approval)

- Keep two explicit bases until accounting definitions are confirmed:
  (a) receipt/document reporting including VAT as today;
  (b) actual expense register including VAT.
- Do NOT rename existing receipt totals to accounting revenue or cash flow silently.
- Proposed executive estimated model: selected receipt basis - estimated job cost
  = estimated gross profit; minus actual OPERATING expenses = estimated profit
  after operating expenses. Show actual DIRECT expenses separately and a reconciliation
  gap indicator. Do not add them again or automatically replace estimates.
- Real COGS/gross margin requires consistent VAT treatment, reliable snapshots and
  allocation/matching of actual direct costs. Mark unavailable rather than fabricate.
- Actual-vs-estimate only for a comparable population/class with a matched estimate.
  No operating budget exists in the inspected model. Show unavailable, not a fake
  budget and not receipt revenue as the expense estimate. Do not copy brief examples.
- Unknown cost is not zero; zero snapshot must be meaningful. Any correction to this
  rule is a separately reviewed read-model patch with impact tests, not a write change.
- Comparison: percent for monetary measures; percentage POINTS for margin. Prior=0
  has no valid percent baseline. Negative baselines require explicit delta labeling.

## Shared date and state contract

- One validated YYYY-MM-DD range, Asia/Bangkok interpretation, inclusive UI end
  converted once to exclusive query end. Never mix browser timezone with UTC parsing.
- Quick: today, 7 days, 30 days, month-to-date, year-to-date. Manual: day, month,
  year and custom range. Reject reversed/invalid ranges without erasing last valid data.
- Comparison: equal-length preceding range; previous calendar month; same range last
  year (clamp Feb 29); none. Always show the actual comparison dates to avoid ambiguity.
- Keep range/comparison in parent state plus validated URL parameters. Preserve on
  drill-down, back, refresh. Do not put row data or credentials in URL/localStorage.
- All nine sections consume one filtered model. Expenses use expense_date, documents
  use document date. Paid/unpaid is a status split, not a paid_at cash-flow report.
- Alerts obey selected document period. Any future all-time overdue queue must be
  separately labeled, not mixed into the selected-period figures.
- Data updated time is the last successful completed fetch, not the current render time.

## Components and queries

- Reuse reportingDocuments, calcDocTotal/line calculators, expenseTotal BigInt money,
  actualExpenseReport category grouping, Supabase browser session client and RLS.
- Introduce scoped dashboard date/read-model helpers and a Dashboard controller with
  small presentational sections. No broad unrelated admin/page.tsx refactor.
- Adapt ExpenseDashboardView to compact summary/breakdown; move daily ledger access
  into ExpensePage read-only detail view. Preserve history/upload/save components.
- First use complete paginated authenticated reads with narrow column lists. Load
  current/comparison expense ranges through one controlled loader; no duplicate widget
  queries. Handle cancellation, stale results, failures, row limits and permissions.
- Do not add service-role access for dashboard reads. No DB migration is assumed.
  If efficient aggregates require a new RPC/schema, stop for a separate design approval.
- DocumentPage/ExpensePage receive validated initial filters and return navigation.
  Product performance initially uses a read-only drawer from selected report items;
  do not invent a persistent product identity when legacy data lacks one.

## Impact analysis

| Boundary | Planned change | Safety condition |
| --- | --- | --- |
| admin/page.tsx Dashboard | Controller wiring, range model, section layout | Preserve document editors/ERP writes |
| dashboard helpers | Date, aggregation, comparison, quality flags | Pure tests before wiring |
| ExpenseDashboard + CSS | Summary, actual categories, readable states | Preserve current actual total semantics |
| ExpensePage | Context-preserving detail entry | No save/RPC/attachment behavior changes |
| DocumentPage | Date/status/detail navigation | No numbering or document transactions |
| Sidebar/top nav | Group labels and selected ERP state | Routes/actions unchanged |
| Database | Read-only consumption | No migrations/RLS/auth changes in this plan |

## Implementation phases

### Phase 1 - shared foundation and executive overview
1. Capture baseline fixtures, formulas and source-quality checks. Resolve the financial
   definition decisions above before changing derived KPIs.
2. Implement the global range/context contract, complete loaders and one read-model.
   Scope ALL existing widgets now, even if their visual upgrade comes later.
3. Build five clickable executive KPIs with estimated/unknown labels and formula
   tooltips. Establish drill-down context contracts; no dead clickable cards.
4. Move expenses below financial structure; bring actionable alerts below KPIs.
5. Preserve date selection on navigation/back. Include minimal loading/error/empty
   and responsive behavior immediately, not after production release.
6. Review formula changes separately from UI diff. Stop for Phase 1 acceptance.

### Phase 2 - analytical sections
7. Add comparison modes and meaningful deltas to all applicable KPIs.
8. Business trend: revenue, estimated gross profit, operating expense; signed values,
   keyboard/touch tooltip, no clipped losses. Auto daily <=31 days, weekly up to
   six months, monthly through two years, yearly beyond. Allow explicit resolution.
9. Financial structure uses exactly the same approved KPI formula chain.
10. Actual category bars show percentages; unknown comparisons remain unavailable.
11. Product sorting revenue/profit/margin, range-specific document statuses and latest
    activity. Preserve stable IDs where available and explain unmatched legacy items.
12. Stop for Phase 2 review; no automatic implementation of later phase.

### Phase 3 - operator journeys and polish
13. Finish product performance drawer, KPI/list drill-down and activity details with
    filter-preserving back navigation; read-only detail does not open an edit/save flow.
14. Harden skeletons/retries, stale-data signals, empty periods, keyboard focus and
    mobile layouts. No fabricated zero on error or missing data.
15. Sidebar grouping and subdued system switcher; consistent orange action, green
    positive, red loss/overdue, yellow warning and blue information.
16. Audit all nine sections in the required order. No full sales pipeline/task system.

## Validation and acceptance

- Unit fixtures: known zero vs missing cost; VAT/discount; direct/operating separation;
  cancelled/void/archive; drafts and partial receipts; allocation and duplicate roots;
  snapshots vs changed catalog. Preserve unapproved baseline semantics.
- Dates: Bangkok midnight, inclusive/exclusive boundaries, leap day, month end,
  custom ranges, zero/negative comparison base; aggregation totals equal KPI totals.
- Completeness: more than API default row cap, partial category load, failed page,
  denied auth, stale response, refresh, mixed source timestamps. No silent zero.
- Financial identity: approved revenue - cost = gross; gross - operating = estimated
  after-expense result. Never sum direct actuals and matched estimates twice.
- All widgets and drill-down share current range; back/refresh retains context.
- Owner UI smoke on isolated synthetic fixtures, no bypass, no published fake expenses.
- Review actual screenshots at 320/375/414/768/1280+ px, negative/large money, long Thai
  labels, keyboard/touch graph, all loading/error/empty states. Run unit, typecheck,
  scoped lint, build and bundle-secret checks. Record remaining coverage honestly.

## Release gates

- Plan approval is not deployment approval. Each phase has its own reviewed diff.
- Build from current verified production baseline plus only approved dashboard changes.
- Keep existing uncommitted visual work and unpushed commits; do not silently publish
  to the public repository while its separate publication approval is unresolved.
- No fresh cloud cost, destructive/concurrency production tests or production data edits.
- App-only rollback to previous deployment; no schema rollback needed for this scope.
- Read-only production smoke after approved promotion; owner-authenticated acceptance
  required before marking fully verified. Stop after each approved phase.

## Approval decisions

1. Accept the proposed ESTIMATED reporting model, or define consistent ex-VAT financial
   revenue/COGS/expenses first. Do not silently relabel current VAT-inclusive receipts.
2. Approve separate read-model fixes for missing/zero cost and eligible receipt states;
   otherwise keep quality warnings and estimated/unavailable indicators.
3. Start Phase 1 only after approval, with phase 2/3 retained as the roadmap.

ACTION PLAN READY - WAITING FOR APPROVAL
